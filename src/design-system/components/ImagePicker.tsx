/**
 * ImagePicker Component
 * Multi-image picker with previews, validation, and removal capability
 */
import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePickerExpo from 'expo-image-picker';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius } from '../tokens';
import { Typography } from './Typography';

export interface ImagePickerProps {
    label?: string;
    images: string[];
    onImagesChange: (images: string[]) => void;
    maxImages?: number;
    maxSizeMB?: number;
    error?: string;
    disabled?: boolean;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
    label = 'Photos',
    images,
    onImagesChange,
    maxImages = 5,
    maxSizeMB = 5,
    error,
    disabled = false,
}) => {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);

    const requestPermission = async (): Promise<boolean> => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please grant photo library permissions to upload images.',
                    [{ text: 'OK' }]
                );
                return false;
            }
        }
        return true;
    };

    const validateImage = async (uri: string): Promise<boolean> => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const sizeMB = blob.size / (1024 * 1024);

            if (sizeMB > maxSizeMB) {
                Alert.alert(
                    'File Too Large',
                    `Image size (${sizeMB.toFixed(1)}MB) exceeds the maximum allowed size of ${maxSizeMB}MB.`,
                    [{ text: 'OK' }]
                );
                return false;
            }

            return true;
        } catch (error) {
            console.error('Image validation failed:', error);
            return true;
        }
    };

    const handlePickImage = async () => {
        if (disabled || images.length >= maxImages) return;

        setLoading(true);
        try {
            const hasPermission = await requestPermission();
            if (!hasPermission) {
                return;
            }

            const result = await ImagePickerExpo.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets) {
                const remainingSlots = maxImages - images.length;
                const newImages = result.assets.slice(0, remainingSlots);

                const validatedImages: string[] = [];
                for (const asset of newImages) {
                    const isValid = await validateImage(asset.uri);
                    if (isValid) {
                        validatedImages.push(asset.uri);
                    }
                }

                if (validatedImages.length > 0) {
                    onImagesChange([...images, ...validatedImages]);
                }

                if (newImages.length > remainingSlots) {
                    Alert.alert(
                        'Maximum Images Reached',
                        `You can only upload ${maxImages} images. ${newImages.length - remainingSlots} image(s) were not added.`,
                        [{ text: 'OK' }]
                    );
                }
            }
        } catch (error: any) {
            console.error('Image picker failed:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to pick image. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        Alert.alert(
            'Remove Image',
            'Are you sure you want to remove this image?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const newImages = images.filter((_, i) => i !== index);
                        onImagesChange(newImages);
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {!!label && (
                <View style={styles.labelContainer}>
                    <Typography variant="bodySmall" weight="medium">
                        {label}
                    </Typography>
                    <Typography variant="caption" color="tertiary">
                        ({images.length}/{maxImages})
                    </Typography>
                </View>
            )}

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {images.map((uri, index) => (
                    <View key={index} style={styles.imageContainer}>
                        <Image source={{ uri }} style={styles.image} />
                        <TouchableOpacity
                            style={[styles.removeButton, { backgroundColor: colors.error }]}
                            onPress={() => handleRemoveImage(index)}
                        >
                            <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                ))}

                {images.length < maxImages && (
                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            {
                                backgroundColor: colors.surface,
                                borderColor: error ? colors.error : colors.border,
                            },
                            disabled && styles.addButtonDisabled,
                        ]}
                        onPress={handlePickImage}
                        disabled={disabled || loading}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="camera"
                            size={32}
                            color={error ? colors.error : colors.textSecondary}
                        />
                        <Typography variant="caption" color={error ? 'error' : 'secondary'}>
                            Add Photo
                        </Typography>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {!!error && (
                <Typography variant="caption" color="error" style={styles.error}>
                    {error}
                </Typography>
            )}

            <Typography variant="caption" color="tertiary" style={styles.hint}>
                💡 Accepted formats: JPG, PNG, WEBP. Max size: {maxSizeMB}MB per image.
            </Typography>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing[4],
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[2],
    },
    scrollContent: {
        paddingVertical: spacing[1],
    },
    imageContainer: {
        position: 'relative',
        marginRight: spacing[3],
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: borderRadius.md,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    addButton: {
        width: 100,
        height: 100,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing[1],
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    error: {
        marginTop: spacing[2],
    },
    hint: {
        marginTop: spacing[2],
    },
});
