/**
 * LocationPicker Component
 * Location input with geolocation auto-detection and manual override
 */
import React, { useState, useEffect } from 'react';
import { logger } from '../../services/logger';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius } from '../tokens';
import { Typography } from './Typography';
import { Input } from './Input';

export interface LocationPickerProps {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    onLocationDetected?: (location: { latitude: number; longitude: number; address: string }) => void;
    error?: string;
    disabled?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
    label = 'Location',
    value,
    onChangeText,
    onLocationDetected,
    error,
    disabled = false,
}) => {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
    };

    const requestPermission = async (): Promise<boolean> => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
        return status === 'granted';
    };

    const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
        try {
            const results = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (results && results.length > 0) {
                const address = results[0];
                const parts = [
                    address.street,
                    address.streetNumber,
                    address.district,
                    address.city,
                    address.region,
                    address.postalCode,
                ].filter(Boolean);
                return parts.join(', ') || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            }
            return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        } catch (error) {
            logger.error('Reverse geocoding failed:', error);
            return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
    };

    const handleDetectLocation = async () => {
        if (disabled) return;

        setLoading(true);
        try {
            // Check and request permission if needed
            let hasPermission = permissionStatus === 'granted';
            if (!hasPermission) {
                hasPermission = await requestPermission();
            }

            if (!hasPermission) {
                Alert.alert(
                    'Location Permission Required',
                    'Please enable location permissions in your device settings to use this feature.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = location.coords;

            // Reverse geocode to get address
            const address = await reverseGeocode(latitude, longitude);

            // Update the input field
            onChangeText(address);

            // Notify parent component if callback provided
            if (onLocationDetected) {
                onLocationDetected({ latitude, longitude, address });
            }
        } catch (error: any) {
            logger.error('Location detection failed:', error);
            const errorMessage = error.message || '';

            if (errorMessage.includes('Location services are disabled')) {
                Alert.alert(
                    'Location Disabled',
                    'Please enable location services in your device settings.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Location Error',
                    'Current location is unavailable. You can still enter your location manually using the fields below.',
                    [{ text: 'OK' }]
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {!!label && (
                <Typography variant="bodySmall" weight="medium" style={styles.label}>
                    {label}
                </Typography>
            )}

            <View style={styles.inputContainer}>
                <Input
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="Enter location manually or use GPS"
                    error={error}
                    disabled={disabled}
                    style={styles.input}
                />

                <TouchableOpacity
                    style={[
                        styles.gpsButton,
                        { backgroundColor: colors.primary },
                        (disabled || loading) && styles.gpsButtonDisabled,
                    ]}
                    onPress={handleDetectLocation}
                    disabled={disabled || loading}
                    activeOpacity={0.7}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Ionicons name="location" size={20} color="white" />
                    )}
                </TouchableOpacity>
            </View>

            {permissionStatus === 'denied' && (
                <Typography variant="caption" color="secondary" style={styles.hint}>
                    💡 Location permission denied. You can still enter location manually.
                </Typography>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing[3],
    },
    label: {
        marginBottom: spacing[2],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2],
    },
    input: {
        flex: 1,
        marginBottom: 0,
    },
    gpsButton: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
    },
    gpsButtonDisabled: {
        opacity: 0.5,
    },
    hint: {
        marginTop: spacing[1],
    },
});
