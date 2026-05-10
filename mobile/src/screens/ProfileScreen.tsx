/**
 * ProfileScreen
 * Displays user profile information and stats with theme support
 */
import React from 'react';
import { logger } from '../services/logger';
import { View, ScrollView, StyleSheet, Alert, Switch, Image as RNImage, TouchableOpacity, Platform, ActivityIndicator, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../design-system/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Typography, Card, Badge, LoadingButton, Skeleton, StarRating } from '../design-system/components';
import { spacing, borderRadius, elevation } from '../design-system/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useUserRating } from '../hooks/useReviews';
import apiClient from '../services/api';
import { getFullImageUrl } from '../constants/config';
import * as ImagePicker from 'expo-image-picker';
import { getInitials } from '../utils/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toastService } from '../services/toast.service';

export default function ProfileScreen() {
    const { user, logout, refreshUser } = useAuth();
    const { colors, colorScheme, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const { data: ratingData, isLoading: isRatingLoading } = useUserRating(user?.id || 0);
    const navigation = useNavigation<any>();

    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);

    const [isLogoutModalVisible, setIsLogoutModalVisible] = React.useState(false);

    const handleLogout = () => {
        setIsLogoutModalVisible(true);
    };

    const confirmLogout = async () => {
        setIsLogoutModalVisible(false);
        await logout();
    };

    const handleImageSelected = async (uri: string) => {
        try {
            setIsUploading(true);

            const response = await fetch(uri);
            const blob = await response.blob();
            const sizeMB = blob.size / (1024 * 1024);

            if (sizeMB > 5) {
                toastService.warning('Photo must be smaller than 5MB. Please choose a different image.');
                setIsUploading(false);
                return;
            }

            const formData = new FormData();
            const filename = uri.split('/').pop() || 'avatar.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('file', blob, filename);
            } else {
                // @ts-expect-error - React Native FormData expects specific object structure
                formData.append('file', { uri, name: filename, type });
            }

            await apiClient.post('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                transformRequest: (data) => data,
            });

            await refreshUser();
            toastService.success('Profile photo updated successfully!');
        } catch (error) {
            logger.error('Failed to upload avatar:', error);
            toastService.error('Failed to upload photo. Please try a JPG or PNG under 5MB.');
        } finally {
            setIsUploading(false);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                toastService.warning('Photo library access is required to change your profile picture. Please enable it in Settings.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                handleImageSelected(result.assets[0].uri);
            }
        } catch (error) {
            logger.error('Error picking image:', error);
            toastService.error('Failed to access your photo library. Please try again.');
        }
    };

    const handleReplayTour = async () => {
        await AsyncStorage.removeItem('hasSeenTour');
        toastService.info('Go back to the Home tab to replay the onboarding tour.');
    };

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: 'center', padding: spacing[4] }]}>
                <Skeleton variant="circle" height={100} style={{ alignSelf: 'center', marginBottom: spacing[4] }} />
                <Skeleton width="60%" height={24} style={{ alignSelf: 'center', marginBottom: spacing[2] }} />
                <Skeleton width="40%" height={16} style={{ alignSelf: 'center' }} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={{ paddingTop: insets.top }}
            showsVerticalScrollIndicator={false}
        >
            <View key={`header-${colorScheme}`} style={[styles.header, { backgroundColor: colors.surface }]}>
                <View style={styles.headerBackground}>
                    <View style={[styles.circleDeco, { backgroundColor: colors.primaryLight + '40', top: -50, right: -50 }]} />
                    <View style={[styles.circleDeco, { backgroundColor: colors.primaryLight + '20', bottom: -30, left: -20, width: 100, height: 100 }]} />
                </View>

                <View style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                    <Image 
                        source={require('../../assets/snabb-icon.svg')} 
                        style={{ width: 36, height: 36 }} 
                        contentFit="contain" 
                    />
                </View>

                <TouchableOpacity
                    style={[styles.avatarContainer, { backgroundColor: colors.primaryLight }]}
                    disabled={isUploading}
                    onPress={pickImage}
                >
                    {user.avatar_url ? (
                        <RNImage
                            source={{ uri: getFullImageUrl(user.avatar_url, true) as string }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <Typography variant="h1" color="inverse" weight="bold">
                            {getInitials(user.username)}
                        </Typography>
                    )}
                    {isUploading && (
                        <View style={[styles.uploadOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                            <ActivityIndicator color={colors.surface} />
                        </View>
                    )}
                    <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="camera" size={16} color={colors.surface} />
                    </View>
                </TouchableOpacity>

                <Typography variant="h3" weight="bold" style={{ marginBottom: spacing[1] }}>
                    {user.username}
                </Typography>

                <Typography variant="bodySmall" color="secondary" style={{ marginBottom: spacing[4] }}>
                    {user.email}
                </Typography>

                <View key={`stats-${colorScheme}`} style={[styles.statsRow, {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                }]}>
                    <View style={styles.statBox}>
                        <Typography variant="h5" weight="bold">
                            {ratingData?.average_rating?.toFixed(1) || '0.0'}
                        </Typography>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="star" size={12} color="#F7C301" />
                            <Typography variant="caption" color="tertiary" style={{ marginLeft: 2 }} align="center">Rating</Typography>
                        </View>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statBox}>
                        <Typography variant="h5" weight="bold">
                            {ratingData?.review_count || 0}
                        </Typography>
                        <Typography variant="caption" color="tertiary" align="center">Reviews</Typography>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <TouchableOpacity
                        style={styles.statBox}
                        onPress={() => navigation.navigate(user.is_pro ? 'Main' : 'ProLanding')}
                    >
                        {user.is_pro ? (
                            <Badge label="PRO" variant="success" size="sm" style={{ alignSelf: 'center', marginBottom: 2 }} />
                        ) : (
                            <Typography variant="h5" weight="bold" color="primary" align="center">JOIN</Typography>
                        )}
                        <Typography variant="caption" color="tertiary" align="center">Status</Typography>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                {/* Pro CTA Banner */}
                {!user.is_pro && (
                    <TouchableOpacity
                        style={[styles.proBanner, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('ProLanding')}
                        activeOpacity={0.9}
                    >
                        <View style={styles.proBannerContent}>
                            <View style={styles.proBannerText}>
                                <Typography variant="h5" weight="bold" color="inverse">Earn Money with Snabb</Typography>
                                <Typography variant="caption" color="inverse" style={{ opacity: 0.9 }}>
                                    Join Snabb Pro and start getting paid for your skills.
                                </Typography>
                            </View>
                            <Ionicons name="arrow-forward-circle" size={40} color="white" />
                        </View>
                    </TouchableOpacity>
                )}

                <View style={styles.sectionHeader}>
                    <Typography variant="h6" weight="bold">Experience Settings</Typography>
                </View>

                <View style={[styles.settingsContainer, { backgroundColor: colors.surface, borderColor: colors.border, ...elevation.sm }]}>
                    <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.infoLight + '20' }]}>
                                <Ionicons name={colorScheme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={20} color="#0EA5E9" />
                            </View>
                            <Typography variant="body" weight="medium">Appearance</Typography>
                        </View>
                        <Switch
                            value={colorScheme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={colors.surface}
                        />
                    </TouchableOpacity>

                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.successLight + '20' }]}>
                                <Ionicons name="notifications-outline" size={20} color="#22C55E" />
                            </View>
                            <Typography variant="body" weight="medium">Push Notifications</Typography>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={colors.surface}
                        />
                    </View>

                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={styles.menuItem} onPress={handleReplayTour}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight + '20' }]}>
                                <Ionicons name="compass-outline" size={20} color={colors.primary} />
                            </View>
                            <Typography variant="body" weight="medium">Replay App Tour</Typography>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <Typography variant="h6" weight="bold">More Info</Typography>
                </View>

                <View style={[styles.settingsContainer, { backgroundColor: colors.surface, borderColor: colors.border, ...elevation.sm }]}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HelpCenter')}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.infoLight + '20' }]}>
                                <Ionicons name="help-buoy-outline" size={20} color="#0EA5E9" />
                            </View>
                            <Typography variant="body" weight="medium">Help Center</Typography>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>

                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AboutUs')}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.successLight + '20' }]}>
                                <Ionicons name="information-circle-outline" size={20} color="#22C55E" />
                            </View>
                            <Typography variant="body" weight="medium">About Us</Typography>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>

                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.errorLight + '20' }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#EF4444" />
                            </View>
                            <Typography variant="body" weight="medium">Privacy Policy</Typography>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>

                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('TermsOfService')}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight + '20' }]}>
                                <Ionicons name="document-text-outline" size={20} color="#A855F7" />
                            </View>
                            <Typography variant="body" weight="medium">Terms of Service</Typography>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {user.is_admin && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Typography variant="h6" weight="bold">Administrative</Typography>
                        </View>
                        <View style={[styles.settingsContainer, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1.5, ...elevation.sm }]}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={async () => {
                                    try {
                                        navigation.navigate('AdminDashboard');
                                    } catch (error) {
                                        logger.error('Failed to open admin dashboard:', error);
                                        Alert.alert('Error', 'Could not open Admin Dashboard.');
                                    }
                                }}
                            >
                                <View style={styles.menuItemLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                                        <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Typography variant="body" weight="bold">Admin Control Center</Typography>
                                        <Typography variant="caption" color="tertiary">Real-time API & App Metrics</Typography>
                                    </View>
                                </View>
                                <Ionicons name="open-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>

                            <View style={[styles.menuDivider, { backgroundColor: colors.primary + '20' }]} />

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('AdminModeration')}
                            >
                                <View style={styles.menuItemLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: colors.errorLight + '20' }]}>
                                        <Ionicons name="shield-checkmark" size={20} color={colors.error} />
                                    </View>
                                    <View>
                                        <Typography variant="body" weight="bold">Content Moderation</Typography>
                                        <Typography variant="caption" color="tertiary">Review flagged requests natively</Typography>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <TouchableOpacity
                    style={[styles.logoutButton, { borderColor: colors.error }]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Typography variant="body" weight="bold" style={{ color: colors.error, marginLeft: 8 }}>
                        Logout Account
                    </Typography>
                </TouchableOpacity>

                <Typography variant="caption" color="tertiary" align="center" style={{ marginTop: spacing[10] }}>
                    Snabb App Version 1.0.0
                </Typography>
            </View>
            {/* Logout Confirmation Modal */}
            <Modal
                visible={isLogoutModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsLogoutModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={[styles.modalIconContainer, { backgroundColor: colors.error + '15' }]}>
                            <Ionicons name="log-out" size={32} color={colors.error} />
                        </View>
                        
                        <Typography variant="h4" weight="bold" align="center" style={{ marginBottom: spacing[2] }}>
                            Sign Out?
                        </Typography>
                        <Typography variant="body" color="secondary" align="center" style={{ marginBottom: spacing[8] }}>
                            Are you sure you want to log out of your account?
                        </Typography>

                        <View style={styles.modalButtons}>
                            <LoadingButton
                                title="Cancel"
                                variant="outline"
                                onPress={() => setIsLogoutModalVisible(false)}
                                style={{ flex: 1 }}
                            />
                            <LoadingButton
                                title="Yes, Logout"
                                variant="primary"
                                color={colors.error}
                                onPress={confirmLogout}
                                style={{ flex: 1.5, backgroundColor: colors.error }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        alignItems: 'center',
        paddingVertical: spacing[10],
        marginBottom: spacing[2],
        overflow: 'hidden',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerBackground: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    circleDeco: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing[4],
        position: 'relative',
        ...elevation.base,
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 60,
    },
    editBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'transparent',
        ...elevation.sm,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '90%',
        borderRadius: 20,
        paddingVertical: spacing[4],
        marginTop: spacing[2],
        borderWidth: 1,
    },
    statBox: { alignItems: 'center', flex: 1 },
    statDivider: { width: 1, height: 30 },
    content: { padding: spacing[4], paddingBottom: spacing[12] },
    sectionHeader: {
        marginBottom: spacing[3],
        marginTop: spacing[6],
        paddingHorizontal: spacing[2],
    },
    settingsContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[4],
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    menuDivider: {
        height: 1,
        marginHorizontal: spacing[4],
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing[10],
        paddingVertical: spacing[4],
        borderWidth: 1.5,
        borderRadius: 20,
        borderStyle: 'dashed',
    },
    proBanner: {
        marginTop: spacing[4],
        padding: spacing[5],
        borderRadius: 24,
        ...elevation.md,
    },
    proBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    proBannerText: {
        flex: 1,
        marginRight: spacing[4],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[6],
    },
    modalContent: {
        width: '100%',
        borderRadius: 32,
        padding: spacing[8],
        alignItems: 'center',
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[6],
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing[4],
        width: '100%',
    },
});
