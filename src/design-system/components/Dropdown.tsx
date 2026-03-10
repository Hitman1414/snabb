/**
 * Dropdown Component
 * Searchable dropdown/select component with filter capability
 */
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    TextInput,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius, fontSize } from '../tokens';
import { Typography } from './Typography';

export interface DropdownProps {
    label?: string;
    placeholder?: string;
    value: string;
    options: readonly string[] | string[];
    onSelect: (value: string) => void;
    error?: string;
    disabled?: boolean;
    searchable?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
    label,
    placeholder = 'Select an option',
    value,
    options,
    onSelect,
    error,
    disabled = false,
    searchable = true,
}) => {
    const { colors } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchQuery.trim()) {
            return options;
        }
        const query = searchQuery.toLowerCase();
        return options.filter((option) =>
            option.toLowerCase().includes(query)
        );
    }, [options, searchQuery, searchable]);

    const handleSelect = (option: string) => {
        onSelect(option);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClose = () => {
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <View style={styles.container}>
            {!!label && (
                <Typography variant="bodySmall" weight="medium" style={styles.label}>
                    {label}
                </Typography>
            )}

            <TouchableOpacity
                style={[
                    styles.trigger,
                    {
                        backgroundColor: colors.surface,
                        borderColor: error ? colors.error : colors.border,
                    },
                    disabled && styles.disabled,
                ]}
                onPress={() => !disabled && setIsOpen(true)}
                activeOpacity={0.7}
            >
                <Typography
                    variant="body"
                    color={value ? 'primary' : 'tertiary'}
                    numberOfLines={1}
                    style={styles.triggerText}
                >
                    {value || placeholder}
                </Typography>
                <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                />
            </TouchableOpacity>

            {!!error && (
                <Typography variant="caption" color="error" style={styles.error}>
                    {error}
                </Typography>
            )}

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <Pressable style={styles.modalOverlay} onPress={handleClose}>
                    <Pressable
                        style={[styles.modalContent, { backgroundColor: colors.surface }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.modalHeader}>
                            <Typography variant="h6" weight="semibold">
                                {label || 'Select'}
                            </Typography>
                            <TouchableOpacity onPress={handleClose}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {searchable && (
                            <View
                                style={[
                                    styles.searchContainer,
                                    { backgroundColor: colors.background, borderColor: colors.border },
                                ]}
                            >
                                <Ionicons
                                    name="search"
                                    size={20}
                                    color={colors.textSecondary}
                                    style={styles.searchIcon}
                                />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder="Search..."
                                    placeholderTextColor={colors.textTertiary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                            </View>
                        )}

                        <FlatList
                            data={filteredOptions}
                            keyExtractor={(item, index) => `${item}-${index}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.option,
                                        item === value && {
                                            backgroundColor: colors.primaryLight,
                                        },
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Typography
                                        variant="body"
                                        weight={item === value ? 'semibold' : 'regular'}
                                        color={item === value ? 'primary' : 'primary'}
                                    >
                                        {item}
                                    </Typography>
                                    {item === value && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Typography variant="body" color="secondary" align="center">
                                        No options found
                                    </Typography>
                                </View>
                            }
                            style={styles.optionsList}
                            contentContainerStyle={styles.optionsListContent}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
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
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderRadius: borderRadius.md,
        borderWidth: 1,
        minHeight: 48,
    },
    triggerText: {
        flex: 1,
        marginRight: spacing[2],
    },
    disabled: {
        opacity: 0.5,
    },
    error: {
        marginTop: spacing[1],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[4],
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing[4],
        marginBottom: spacing[2],
        paddingHorizontal: spacing[3],
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: spacing[2],
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing[2],
        fontSize: fontSize.base,
    },
    optionsList: {
        maxHeight: 400,
    },
    optionsListContent: {
        paddingBottom: spacing[2],
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        minHeight: 48,
    },
    emptyContainer: {
        padding: spacing[6],
    },
});
