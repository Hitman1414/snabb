import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, Card, Badge } from '../design-system/components';
import { spacing, borderRadius } from '../design-system/tokens';
import * as Location from 'expo-location';
import { useAsk } from '../hooks/useAsks';
import { useResponses } from '../hooks/useResponses';
import { getFullImageUrl } from '../constants/config';
import { Image } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function TrackingScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { askId, helperId, askerLocation, initialHelperLocation } = route.params || {};

    const { data: ask } = useAsk(askId);
    const { data: responses } = useResponses(askId);
    
    const acceptedResponse = responses?.find(r => r.is_accepted);
    const helperName = acceptedResponse?.user?.username || 'Helper';
    const helperAvatar = acceptedResponse?.user?.avatar_url;
    const askTitle = ask?.title || 'Deliver your items';

    const [helperLocation, setHelperLocation] = useState(initialHelperLocation || {
        latitude: askerLocation?.latitude + 0.005,
        longitude: askerLocation?.longitude + 0.005,
    });
    const [isLoading, setIsLoading] = useState(true);
    const mapRef = useRef<MapView>(null);

    // Simulated movement for demo purposes
    useEffect(() => {
        const interval = setInterval(() => {
            setHelperLocation((prev: any) => {
                const newLat = prev.latitude - (prev.latitude - askerLocation.latitude) * 0.05;
                const newLng = prev.longitude - (prev.longitude - askerLocation.longitude) * 0.05;
                return { latitude: newLat, longitude: newLng };
            });
        }, 3000);

        setTimeout(() => setIsLoading(false), 1500);

        return () => clearInterval(interval);
    }, [askerLocation]);

    const centerMap = () => {
        mapRef.current?.animateToRegion({
            latitude: (askerLocation.latitude + helperLocation.latitude) / 2,
            longitude: (askerLocation.longitude + helperLocation.longitude) / 2,
            latitudeDelta: Math.abs(askerLocation.latitude - helperLocation.latitude) * 2,
            longitudeDelta: Math.abs(askerLocation.longitude - helperLocation.longitude) * 2,
        }, 1000);
    };

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Typography variant="body" style={{ marginTop: spacing[4] }}>Connecting to helper GPS...</Typography>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: (askerLocation.latitude + helperLocation.latitude) / 2,
                    longitude: (askerLocation.longitude + helperLocation.longitude) / 2,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
            >
                <Marker
                    coordinate={askerLocation}
                    title="My Location"
                >
                    <View style={[styles.markerContainer, { backgroundColor: colors.primary }]}>
                        <Ionicons name="home" size={20} color="#fff" />
                    </View>
                </Marker>

                <Marker
                    coordinate={helperLocation}
                    title="Helper"
                    description="Moving towards you"
                >
                    <View style={[styles.markerContainer, { backgroundColor: colors.success }]}>
                        <Ionicons name="bicycle" size={20} color="#fff" />
                    </View>
                </Marker>

                <Polyline
                    coordinates={[askerLocation, helperLocation]}
                    strokeColor={colors.primary}
                    strokeWidth={3}
                    lineDashPattern={[5, 5]}
                />
            </MapView>

            <SafeAreaView style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={[styles.backButton, { backgroundColor: colors.surface }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Card style={styles.statusCard}>
                        <View style={styles.statusRow}>
                            <Badge label="IN PROGRESS" variant="success" size="sm" />
                            <Typography variant="caption" color="secondary" style={{ marginLeft: spacing[2] }}>
                                ETA: 8 mins
                            </Typography>
                        </View>
                    </Card>
                </View>

                <View style={styles.footer}>
                    <Card style={styles.helperCard}>
                        <View style={styles.helperInfo}>
                            <View style={[styles.avatar, { backgroundColor: colors.surfaceVariant, overflow: 'hidden' }]}>
                                {helperAvatar ? (
                                    <Image source={{ uri: getFullImageUrl(helperAvatar) as string }} style={{ width: 48, height: 48 }} />
                                ) : (
                                    <Ionicons name="person" size={24} color={colors.textSecondary} />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: spacing[3] }}>
                                <Typography variant="body" weight="bold">{helperName}</Typography>
                                <Typography variant="caption" color="secondary" numberOfLines={1}>On the way for: {askTitle}</Typography>
                            </View>
                            <TouchableOpacity 
                                style={[styles.callButton, { backgroundColor: colors.primary }]}
                            >
                                <Ionicons name="call" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>

                <TouchableOpacity 
                    style={[styles.centerButton, { backgroundColor: colors.surface }]}
                    onPress={centerMap}
                >
                    <Ionicons name="locate" size={24} color={colors.primary} />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: width,
        height: height,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        pointerEvents: 'box-none',
    },
    header: {
        flexDirection: 'row',
        padding: spacing[4],
        pointerEvents: 'box-none',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusCard: {
        flex: 1,
        marginLeft: spacing[3],
        padding: spacing[2],
        justifyContent: 'center',
        elevation: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        padding: spacing[4],
    },
    helperCard: {
        padding: spacing[3],
        elevation: 8,
    },
    helperInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    centerButton: {
        position: 'absolute',
        right: spacing[4],
        bottom: 120, // Above helper card
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
});
