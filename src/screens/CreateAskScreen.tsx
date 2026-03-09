/**
 * Enhanced CreateAskScreen
 * With category dropdown, geolocation, image upload, and improved UX
 */
import React, { useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCreateAsk } from '../hooks/useAsks';
import { Input, Typography, Dropdown, LocationPicker, ImagePicker, LoadingButton, Card } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing, borderRadius, elevation } from '../design-system/tokens';
import { CATEGORIES } from '../constants/categories';
import { createAskSchema } from '../lib/validation';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAsk'>;

const CreateAskScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const createAskMutation = useCreateAsk();
 
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    const [houseNo, setHouseNo] = useState('');
    const [area, setArea] = useState('');
    const [landmark, setLandmark] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
 
    // Manual address toggle
    const [showManualAddress, setShowManualAddress] = useState(false);
 
    // Optional: Store lat/lng if needed for backend
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

    const handleLocationDetected = (locationData: { latitude: number; longitude: number; address: string }) => {
        setLocation(locationData.address);
        setCoordinates({ latitude: locationData.latitude, longitude: locationData.longitude });
    };

    const handleSubmit = async () => {
        try {
            // Combine location with manual fields if provided
            let finalLocation = location;
            if (showManualAddress) {
                const parts = [houseNo, area, landmark, location].filter(Boolean);
                finalLocation = parts.join(', ');
            }

            // Validate form data
            const validatedData = createAskSchema.parse({
                title,
                description,
                category,
                location: finalLocation,
                budget_min: budgetMin ? parseFloat(budgetMin) : undefined,
                budget_max: budgetMax ? parseFloat(budgetMax) : undefined,
                images,
                latitude: coordinates?.latitude,
                longitude: coordinates?.longitude,
            });

            setLoading(true);
            await createAskMutation.mutateAsync(validatedData);

            Alert.alert('Success', 'Ask created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            if (error instanceof z.ZodError) {
                Alert.alert('Validation Error', error.issues[0].message);
            } else {
                console.error('Failed to create ask:', error);
                const serverError = (error as any)?.response?.data?.error?.message || (error as any)?.response?.data?.detail;
                Alert.alert(
                    'Error', 
                    serverError ? `Failed to create ask: ${serverError}` : 'Failed to create ask. Please try again.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0} // Accounts for custom header + safe area
        >
            <View style={[styles.customHeader, { paddingTop: insets.top, height: insets.top + 56, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Typography variant="h6" weight="bold">Create New Ask</Typography>
                <View style={{ width: 40 }} /> 
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Section 1: Task Details */}
                <Card variant="elevated" elevation="base" style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
                    <Typography variant="body" weight="bold" style={[styles.sectionTitle, { color: colors.text }]}>
                        Task Details
                    </Typography>
                    
                    <Input
                        label="Title"
                        placeholder="What do you need help with?"
                        value={title}
                        onChangeText={setTitle}
                        style={styles.input}
                    />

                    <Dropdown
                        label="Category"
                        placeholder="Select a category"
                        value={category}
                        options={CATEGORIES}
                        onSelect={setCategory}
                        searchable
                    />

                    <Input
                        label="Description"
                        placeholder="Provide details about your request..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        style={[styles.input, styles.textArea]}
                    />
                </Card>

                {/* Section 2: Location */}
                <Card variant="elevated" elevation="base" style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Typography variant="body" weight="bold">Location</Typography>
                        <TouchableOpacity 
                            onPress={() => setShowManualAddress(!showManualAddress)}
                            style={[styles.manualToggle, { backgroundColor: showManualAddress ? colors.primaryLight : colors.surfaceVariant }]}
                        >
                            <Typography variant="caption" weight="bold" color={showManualAddress ? 'primary' : 'secondary'}>
                                {showManualAddress ? 'Hide Manual' : 'Add Manual Address'}
                            </Typography>
                        </TouchableOpacity>
                    </View>

                    <LocationPicker
                        label=""
                        value={location}
                        onChangeText={setLocation}
                        onLocationDetected={handleLocationDetected}
                    />

                    {showManualAddress && (
                        <View style={styles.manualFields}>
                            <Input
                                placeholder="House / Flat / Office No."
                                value={houseNo}
                                onChangeText={setHouseNo}
                                style={styles.manualInput}
                            />
                            <Input
                                placeholder="Area / Colony / Street"
                                value={area}
                                onChangeText={setArea}
                                style={styles.manualInput}
                            />
                            <Input
                                placeholder="Landmark (Optional)"
                                value={landmark}
                                onChangeText={setLandmark}
                                style={styles.manualInput}
                            />
                        </View>
                    )}
                </Card>

                {/* Section 3: Budget */}
                <Card variant="elevated" elevation="base" style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
                    <Typography variant="body" weight="bold" style={[styles.sectionTitle, { color: colors.text }]}>
                        Estimated Budget
                    </Typography>
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Input
                                label="Min (₹)"
                                placeholder="0"
                                value={budgetMin}
                                onChangeText={setBudgetMin}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Input
                                label="Max (₹)"
                                placeholder="5000"
                                value={budgetMax}
                                onChangeText={setBudgetMax}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </Card>

                {/* Section 4: Photos */}
                <Card variant="elevated" elevation="base" style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
                    <ImagePicker
                        label="Add Photos"
                        images={images}
                        onImagesChange={setImages}
                        maxImages={5}
                        maxSizeMB={5}
                    />
                </Card>

                <LoadingButton
                    title="Publish Ask"
                    onPress={handleSubmit}
                    loading={loading}
                    fullWidth
                    size="lg"
                    style={styles.mainButton}
                />
                
                <Typography variant="caption" color="tertiary" align="center" style={styles.footerHint}>
                    By publishing, you agree to our Terms of Service.
                </Typography>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[3],
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F7FA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: spacing[4],
        paddingBottom: spacing[12],
    },
    sectionCard: {
        marginBottom: spacing[4],
        padding: spacing[4],
    },
    sectionTitle: {
        marginBottom: spacing[4],
        color: '#1C1C1C',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    manualToggle: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1.5],
        borderRadius: borderRadius.full,
    },
    manualFields: {
        marginTop: spacing[2],
        gap: spacing[1],
    },
    manualInput: {
        marginBottom: spacing[2],
    },
    input: {
        marginBottom: spacing[4],
    },
    row: {
        flexDirection: 'row',
        gap: spacing[4],
    },
    halfInput: {
        flex: 1,
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    mainButton: {
        marginTop: spacing[4],
        height: 56,
        borderRadius: 28,
        shadowColor: '#F7C301',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    footerHint: {
        marginTop: spacing[4],
    },
});

export default CreateAskScreen;
