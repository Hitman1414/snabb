/**
 * SearchBar Component
 * Search input with debounce support
 */
import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius, typography } from '../tokens';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    onClear?: () => void;
    rightElement?: React.ReactNode;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    placeholder = 'Search...',
    onClear,
    rightElement,
}) => {
    const { colors } = useTheme();
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (text: string) => {
        setLocalValue(text);
        onChangeText(text);
    };

    const handleClear = () => {
        setLocalValue('');
        onChangeText('');
        onClear?.();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.icon} />

            <TextInput
                value={localValue}
                onChangeText={handleChange}
                placeholder={placeholder}
                placeholderTextColor={colors.textTertiary}
                style={[
                    styles.input,
                    {
                        color: colors.text,
                        fontFamily: typography.fontFamily.regular,
                        fontSize: typography.fontSize.base,
                    }
                ]}
            />

            {localValue.length > 0 && !rightElement && (
                <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
            )}

            {rightElement && (
                <View style={{ marginLeft: spacing[2] }}>
                    {rightElement}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[3],
        height: 48,
        borderRadius: borderRadius.base,
        borderWidth: 1,
    },
    icon: {
        marginRight: spacing[2],
    },
    input: {
        flex: 1,
        height: '100%',
    },
});
