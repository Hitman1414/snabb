/**
 * LoadingButton Component
 * Button with loading state and theme support
 */
import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, TouchableOpacityProps, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../ThemeContext';
import { borderRadius, spacing, elevation } from '../tokens';

interface LoadingButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
    title,
    loading = false,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    leftIcon,
    style,
    disabled,
    ...props
}) => {
    const { colors } = useTheme();

    const getBackgroundColor = () => {
        if (disabled) return colors.border;
        switch (variant) {
            case 'primary': return colors.primary;
            case 'secondary': return colors.secondary;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return 'tertiary';
        switch (variant) {
            case 'primary': return 'inverse';
            case 'secondary': return 'inverse';
            case 'outline': return 'primary';
            case 'ghost': return 'primary';
            default: return 'inverse';
        }
    };

    const getHeight = () => {
        switch (size) {
            case 'sm': return 32;
            case 'lg': return 56;
            default: return 48;
        }
    };

    const containerStyle: ViewStyle = {
        backgroundColor: getBackgroundColor(),
        height: getHeight(),
        borderRadius: borderRadius.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[4],
        width: fullWidth ? '100%' : undefined,
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor: variant === 'outline' ? colors.primary : 'transparent',
        opacity: disabled || loading ? 0.7 : 1,
        ...((variant === 'primary' && !disabled) ? elevation.sm : {}),
    };

    return (
        <TouchableOpacity
            style={[containerStyle, style]}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse}
                    size="small"
                />
            ) : (
                <>
                    {leftIcon && <>{leftIcon}</>}
                    <Typography
                        variant={size === 'sm' ? 'bodySmall' : 'body'}
                        weight="semibold"
                        color={getTextColor() as any}
                        style={leftIcon ? { marginLeft: spacing[2] } : {}}
                    >
                        {title}
                    </Typography>
                </>
            )}
        </TouchableOpacity>
    );
};
