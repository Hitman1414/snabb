import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, LoadingButton, Input, Dropdown } from '../design-system/components';
import { spacing, borderRadius } from '../design-system/tokens';
import { toastService } from '../services/toast.service';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/api';

const CATEGORIES = [
    'Technical Support',
    'Plumbing & Repairs',
    'Delivery & Errands',
    'Cleaning',
    'Moving & Lifting',
    'Personal Assistant',
];

export default function ProApplicationScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const { user, refreshUser } = useAuth();

    const [step, setStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [bio, setBio] = useState('');
    const [experience, setExperience] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedCategory || !bio) {
            toastService.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            await apiClient.patch('/auth/me', {
                is_pro: true, // Auto-approve for now or handle as request
                pro_category: selectedCategory,
                pro_bio: bio
            });

            await refreshUser(); // Update app state
            toastService.success('Your application has been submitted!');
            navigation.navigate('Main' as any);
        } catch (error) {
            console.error('Failed to apply for Pro:', error);
            toastService.error('Application failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Typography variant="h4" weight="bold" style={{ marginBottom: spacing[2] }}>
                            What's your expertise?
                        </Typography>
                        <Typography variant="bodySmall" color="secondary" style={{ marginBottom: spacing[6] }}>
                            Select the primary category you want to provide services in.
                        </Typography>

                        <Dropdown
                            label="Primary Category"
                            value={selectedCategory}
                            onSelect={setSelectedCategory}
                            options={CATEGORIES}
                            placeholder="Select a category"
                        />

                        <View style={{ marginTop: spacing[10] }}>
                            <LoadingButton
                                title="Next Step"
                                disabled={!selectedCategory}
                                onPress={() => setStep(2)}
                                fullWidth
                            />
                        </View>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Typography variant="h4" weight="bold" style={{ marginBottom: spacing[2] }}>
                            Tell us about yourself
                        </Typography>
                        <Typography variant="bodySmall" color="secondary" style={{ marginBottom: spacing[6] }}>
                            Write a brief bio that will be shown to potential customers.
                        </Typography>

                        <Input
                            label="Professional Bio"
                            placeholder="Example: Expert plumber with 5+ years of experience in leak repairs and installations..."
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                        />

                        <Input
                            label="Years of Experience"
                            placeholder="e.g. 5"
                            value={experience}
                            onChangeText={setExperience}
                            keyboardType="numeric"
                        />

                        <View style={{ marginTop: spacing[10], flexDirection: 'row', gap: spacing[4] }}>
                            <LoadingButton
                                title="Back"
                                variant="outline"
                                onPress={() => setStep(1)}
                                style={{ flex: 1 }}
                            />
                            <LoadingButton
                                title="Submit Application"
                                loading={loading}
                                onPress={handleSubmit}
                                style={{ flex: 2 }}
                            />
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: step === 1 ? '50%' : '100%' }]} />
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderStep()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        flex: 1,
        marginLeft: spacing[4],
        marginRight: spacing[10],
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    scrollContent: {
        padding: spacing[6],
    },
    stepContainer: {
        flex: 1,
    }
});
