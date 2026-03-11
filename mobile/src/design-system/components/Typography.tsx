/**
 * Typography Component
 * Consistent text rendering with theme support
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';
import { typography } from '../tokens';

type Variant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'bodyLarge' | 'bodySmall' | 'caption' | 'label';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
type Color = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success';

interface TypographyProps extends TextProps {
    variant?: Variant;
    weight?: Weight;
    color?: Color;
    align?: 'left' | 'center' | 'right';
    children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
    variant = 'body',
    weight = 'regular',
    color = 'primary',
    align = 'left',
    style,
    children,
    ...props
}) => {
    const { colors } = useTheme();

    const variantStyles = {
        h1: { fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight },
        h2: { fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight },
        h3: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.semibold, lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight },
        h4: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, lineHeight: typography.fontSize.xl * typography.lineHeight.normal },
        h5: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, lineHeight: typography.fontSize.lg * typography.lineHeight.normal },
        h6: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, lineHeight: typography.fontSize.base * typography.lineHeight.normal },
        body: { fontSize: typography.fontSize.base, lineHeight: typography.fontSize.base * typography.lineHeight.normal },
        bodyLarge: { fontSize: typography.fontSize.lg, lineHeight: typography.fontSize.lg * typography.lineHeight.normal },
        bodySmall: { fontSize: typography.fontSize.sm, lineHeight: typography.fontSize.sm * typography.lineHeight.normal },
        caption: { fontSize: typography.fontSize.xs, lineHeight: typography.fontSize.xs * typography.lineHeight.normal },
        label: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, lineHeight: typography.fontSize.sm * typography.lineHeight.normal },
    };

    const colorMap = {
        primary: colors.text,
        secondary: colors.textSecondary,
        tertiary: colors.textTertiary,
        inverse: colors.textInverse,
        error: colors.error,
        success: colors.success,
    };

    return (
        <Text
            style={[
                variantStyles[variant],
                { fontWeight: typography.fontWeight[weight] },
                { color: colorMap[color] },
                { textAlign: align },
                style,
            ]}
            {...props}
        >
            {children}
        </Text>
    );
};
