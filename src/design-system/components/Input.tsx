import React from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../ThemeContext';
import { Typography } from './Typography';
import { spacing, borderRadius, fontSize } from '../tokens';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    leftIcon,
    rightIcon,
    style,
    disabled,
    ...props
}) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Typography variant="bodySmall" weight="medium" style={styles.label}>
                    {label}
                </Typography>
            )}
            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: colors.surface,
                    borderColor: error ? colors.error : colors.border,
                },
                disabled && styles.inputDisabled
            ]}>
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
                <TextInput
                    style={[styles.input, { color: colors.text }, style]}
                    placeholderTextColor={colors.textSecondary}
                    editable={!disabled}
                    {...props}
                />
                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>
            {error && (
                <Typography variant="caption" color="error" style={styles.errorText}>
                    {error}
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
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: borderRadius.md,
        minHeight: 48,
    },
    input: {
        flex: 1,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        fontSize: fontSize.base,
    },
    inputDisabled: {
        opacity: 0.5,
    },
    errorText: {
        marginTop: spacing[1],
    },
    iconLeft: {
        paddingLeft: spacing[3],
    },
    iconRight: {
        paddingRight: spacing[3],
    },
});
