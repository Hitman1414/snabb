/**
 * ImagePicker Component
 * Allows users to select images from gallery or camera
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius } from '../tokens';

interface ImagePickerProps {
    onImageSelected: (uri: string) => void;
    initialImage?: string;
}

export const ImageUploader: React.FC<ImagePickerProps> = ({
    onImageSelected,
    initialImage,
}) => {
    const { colors } = useTheme();
    const [image, setImage] = useState<string | null>(initialImage || null);

    const pickImage = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            onImageSelected(result.assets[0].uri);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={pickImage}
                style={[
                    styles.uploadBox,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                        borderStyle: 'dashed',
                    }
                ]}
            >
                {image ? (
                    <Image source={{ uri: image }} style={styles.image} />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="camera-outline" size={32} color={colors.primary} />
                        <Typography variant="bodySmall" color="secondary" style={{ marginTop: spacing[2] }}>
                            Tap to upload image
                        </Typography>
                    </View>
                )}
            </TouchableOpacity>

            {image && (
                <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: colors.error }]}
                    onPress={() => {
                        setImage(null);
                        onImageSelected('');
                    }}
                >
                    <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing[4],
        position: 'relative',
    },
    uploadBox: {
        height: 200,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        alignItems: 'center',
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
});
