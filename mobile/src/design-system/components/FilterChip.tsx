/**
 * FilterChip Component
 * Selectable chip for filtering
 */
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius } from '../tokens';

interface FilterChipProps {
    label: string;
    selected?: boolean;
    onPress: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
    label,
    selected = false,
    onPress,
}) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.container,
                {
                    backgroundColor: selected ? colors.primaryLight : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                }
            ]}
        >
            <Typography
                variant="caption"
                weight="medium"
                color={selected ? 'inverse' : 'primary'}
                style={{ color: selected ? colors.textInverse : colors.text }}
            >
                {label}
            </Typography>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
        borderWidth: 1,
        marginRight: spacing[2],
    },
});
