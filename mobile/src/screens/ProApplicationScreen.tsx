import React, { useState } from 'react';
import { logger } from '../services/logger';
import {
    View,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, LoadingButton, Input, Dropdown } from '../design-system/components';
import { spacing, borderRadius } from '../design-system/tokens';
import { toastService } from '../services/toast.service';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/api';

const CATEGORIES = [
    'Technical Support',
    'Plumbing & Repairs',
    'Delivery & Errands',
    'Cleaning',
    'Moving & Lifting',
    'Personal Assistant',
];

export default function ProApplicationScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const { user, refreshUser } = useAuth();

    const [step, setStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [bio, setBio] = useState('');
    const [experience, setExperience] = useState('');
    const [idImageUri, setIdImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadingId, setUploadingId] = useState(false);

    const pickIdImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toastService.error('Permission to access photos is required');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.85,
        });
        if (!result.canceled && result.assets[0]) {
            setIdImageUri(result.assets[0].uri);
        }
    };

    const takeIdPhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            toastService.error('Camera permission is required');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.85,
        });
        if (!result.canceled && result.assets[0]) {
            setIdImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!selectedCategory || !bio) {
            toastService.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);

            // Step 1: Upload ID to S3 if provided
            let idCardUrl: string | undefined;
            if (idImageUri) {
                setUploadingId(true);
                try {
                    const filename = `id_${Date.now()}.jpg`;
                    const formData = new FormData();
                    formData.append('file', {
                        uri: idImageUri,
                        name: filename,
                        type: 'image/jpeg',
                    } as any);

                    const uploadRes = await apiClient.post('/users/me/id-card', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    idCardUrl = uploadRes.data.id_card_url;
                } catch (uploadErr) {
                    logger.error('ID upload failed:', uploadErr);
                    toastService.error('ID upload failed. Please try again.');
                    return;
                } finally {
                    setUploadingId(false);
                }
            }

            // Step 2: Submit the Pro application
            await apiClient.post('/users/me/apply-pro', {
                pro_category: selectedCategory,
                pro_bio: bio,
                ...(idCardUrl ? { id_card_url: idCardUrl } : {}),
            });

            await refreshUser();
            toastService.success('Application submitted! Pending admin review.');
            navigation.navigate('Main' as any);
        } catch (error) {
            logger.error('Failed to apply for Pro:', error);
            toastService.error('Application failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Typography variant="h4" weight="bold" style={{ marginBottom: spacing[2] }}>
                            What&apos;s your expertise?
                        </Typography>
                        <Typography variant="bodySmall" color="secondary" style={{ marginBottom: spacing[6] }}>
                            Select the primary category you want to provide services in.
                        </Typography>

                        <Dropdown
                            label="Primary Category"
                            value={selectedCategory}
                            onSelect={setSelectedCategory}
                            options={CATEGORIES}
                            placeholder="Select a category"
                        />

                        <View style={{ marginTop: spacing[10] }}>
                            <LoadingButton
                                title="Next Step"
                                disabled={!selectedCategory}
                                onPress={() => setStep(2)}
                                fullWidth
                            />
                        </View>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Typography variant="h4" weight="bold" style={{ marginBottom: spacing[2] }}>
                            Tell us about yourself
                        </Typography>
                        <Typography variant="bodySmall" color="secondary" style={{ marginBottom: spacing[6] }}>
                            Write a brief bio that will be shown to potential customers.
                        </Typography>

                        <Input
                            label="Professional Bio"
                            placeholder="Example: Expert plumber with 5+ years of experience..."
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                        />

                        <Input
                            label="Years of Experience"
                            placeholder="e.g. 5"
                            value={experience}
                            onChangeText={setExperience}
                            keyboardType="numeric"
                        />

                        <View style={{ marginTop: spacing[10], flexDirection: 'row', gap: spacing[4] }}>
                            <LoadingButton
                                title="Back"
                                variant="outline"
                                onPress={() => setStep(1)}
                                style={{ flex: 1 }}
                            />
                            <LoadingButton
                                title="Next Step"
                                disabled={!bio}
                                onPress={() => setStep(3)}
                                style={{ flex: 2 }}
                            />
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <Typography variant="h4" weight="bold" style={{ marginBottom: spacing[2] }}>
                            Verify your identity
                        </Typography>
                        <Typography variant="bodySmall" color="secondary" style={{ marginBottom: spacing[6] }}>
                            Upload a government-issued ID (passport, driver's licence, or national ID).
                            Your ID is stored securely and only seen by our admin team.
                        </Typography>

                        {/* ID Preview */}
                        {idImageUri ? (
                            <View style={styles.idPreviewContainer}>
                                <Image
                                    source={{ uri: idImageUri }}
                                    style={styles.idPreview}
                                    resizeMode="cover"
                                />
                                <TouchableOpacity
                                    style={[styles.reuploadBadge, { backgroundColor: colors.primary }]}
                                    onPress={pickIdImage}
                                >
                                    <Ionicons name="refresh" size={14} color="#fff" />
                                    <Typography variant="caption" style={{ color: '#fff', marginLeft: 4 }}>
                                        Change
                                    </Typography>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.idUploadArea}>
                                <TouchableOpacity
                                    style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                    onPress={pickIdImage}
                                >
                                    <Ionicons name="image-outline" size={28} color={colors.primary} />
                                    <Typography variant="bodySmall" weight="semibold" style={{ marginTop: spacing[2], color: colors.primary }}>
                                        Upload from Gallery
                                    </Typography>
                                </TouchableOpacity>

                                <Typography variant="caption" color="secondary" style={{ marginVertical: spacing[3] }}>
                                    or
                                </Typography>

                                <TouchableOpacity
                                    style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                    onPress={takeIdPhoto}
                                >
                                    <Ionicons name="camera-outline" size={28} color={colors.primary} />
                                    <Typography variant="bodySmall" weight="semibold" style={{ marginTop: spacing[2], color: colors.primary }}>
                                        Take a Photo
                                    </Typography>
                                </TouchableOpacity>
                            </View>
                        )}

                        <Typography variant="caption" color="secondary" style={{ marginTop: spacing[4], textAlign: 'center' }}>
                            ID upload is optional but speeds up approval.
                        </Typography>

                        <View style={{ marginTop: spacing[10], flexDirection: 'row', gap: spacing[4] }}>
                            <LoadingButton
                                title="Back"
                                variant="outline"
                                onPress={() => setStep(2)}
                                style={{ flex: 1 }}
                            />
                            <LoadingButton
                                title={uploadingId ? 'Uploading ID...' : 'Submit Application'}
                                loading={loading}
                                onPress={handleSubmit}
                                style={{ flex: 2 }}
                            />
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: colors.primary,
                                    width: step === 1 ? '33%' : step === 2 ? '66%' : '100%',
                                },
                            ]}
                        />
                    </View>
                </View>
                <Typography variant="caption" color="secondary" style={{ marginLeft: spacing[3] }}>
                    {step}/3
                </Typography>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {renderStep()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        flex: 1,
        marginLeft: spacing[4],
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    scrollContent: {
        padding: spacing[6],
    },
    stepContainer: {
        flex: 1,
    },
    idUploadArea: {
        alignItems: 'center',
        paddingVertical: spacing[4],
    },
    uploadButton: {
        width: '100%',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing[6],
        alignItems: 'center',
        justifyContent: 'center',
    },
    idPreviewContainer: {
        position: 'relative',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    idPreview: {
        width: '100%',
        height: 200,
        borderRadius: borderRadius.lg,
    },
    reuploadBadge: {
        position: 'absolute',
        bottom: spacing[2],
        right: spacing[2],
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: 99,
    },
});
