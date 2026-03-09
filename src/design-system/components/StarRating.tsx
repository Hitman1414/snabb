/**
 * StarRating Component
 * Displays and allows selection of star ratings (1-5)
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { spacing } from '../tokens';

export interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    size?: number;
    readonly?: boolean;
    showCount?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
    rating,
    onRatingChange,
    size = 24,
    readonly = false,
    showCount = false,
}) => {
    const { colors } = useTheme();

    const handlePress = (value: number) => {
        if (!readonly && onRatingChange) {
            onRatingChange(value);
        }
    };

    return (
        <View style={styles.container}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= rating;
                const isHalf = star === Math.ceil(rating) && rating % 1 !== 0;

                return (
                    <TouchableOpacity
                        key={star}
                        onPress={() => handlePress(star)}
                        disabled={readonly}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                            size={size}
                            color={isFilled || isHalf ? '#FBBF24' : colors.border}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
});
