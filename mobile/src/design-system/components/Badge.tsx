/**
 * Badge Component
 * Displays status, categories, or counts with theme support
 */
import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../ThemeContext';
import { borderRadius, spacing } from '../tokens';

interface BadgeProps extends ViewProps {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
    size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'default',
    size = 'md',
    style,
    ...props
}) => {
    const { colors } = useTheme();

    const getBackgroundColor = () => {
        switch (variant) {
            case 'success': return colors.successLight;
            case 'warning': return colors.warningLight;
            case 'error': return colors.errorLight;
            case 'info': return colors.infoLight;
            case 'outline': return 'transparent';
            default: return colors.border;
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'success': return 'success';
            case 'warning': return 'warning'; // We might need a specific warning text color if 'warning' maps to yellow
            case 'error': return 'error';
            case 'info': return 'primary'; // Using primary for info usually works, or add specific info color
            case 'outline': return 'primary';
            default: return 'primary';
        }
    };

    // Custom text color logic if needed, but Typography supports 'success', 'error' etc.
    // For warning/info we might need to extend Typography colors or use style override.
    // Let's stick to the Typography props for now.

    const containerStyle = {
        backgroundColor: getBackgroundColor(),
        borderColor: variant === 'outline' ? colors.border : 'transparent',
        borderWidth: variant === 'outline' ? 1 : 0,
        paddingHorizontal: size === 'sm' ? spacing[1] : spacing[2],
        paddingVertical: size === 'sm' ? 2 : spacing[1],
        borderRadius: borderRadius.sm,
    };

    return (
        <View style={[styles.container, containerStyle, style]} {...props}>
            <Typography
                variant={size === 'sm' ? 'caption' : 'bodySmall'}
                weight="medium"
                color={getTextColor() as any} // Cast to any if strict typing complains about specific color mapping
                style={{
                    color: variant === 'warning' ? colors.warning :
                        variant === 'info' ? colors.info : 
                        variant === 'outline' ? colors.text : undefined
                }}
            >
                {label}
            </Typography>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'flex-start',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
