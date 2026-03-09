/**
 * Card Component
 * Reusable card container with elevation and theme support
 */
import React from 'react';
import { View, ViewProps, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius, elevation } from '../tokens';

export interface CardProps extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'filled';
    elevation?: keyof typeof elevation;
    padding?: keyof typeof spacing;
    onPress?: () => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'elevated',
    elevation: elevationLevel = 'base',
    padding = 4,
    onPress,
    onPressIn,
    onPressOut,
    style,
    ...props
}) => {
    const { colors } = useTheme();

    const cardStyle = [
        styles.card,
        {
            backgroundColor: colors.surface,
            padding: spacing[padding],
        },
        variant === 'elevated' && elevation[elevationLevel],
        variant === 'outlined' && {
            borderWidth: 1,
            borderColor: colors.border,
        },
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity
                style={cardStyle}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityHint="Double tap to view details"
            >
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View style={cardStyle} accessible={true}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    elevated: {
        ...elevation.base,
    },
});
