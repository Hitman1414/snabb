/**
 * Enhanced CreateAskScreen
 * With category dropdown, geolocation, image upload, and improved UX
 */
import React, { useState } from 'react';
import { logger } from '../services/logger';
import {
    View,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
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
import apiClient from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAsk'>;

const CreateAskScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const createAskMutation = useCreateAsk();
 
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    const [manualAddress, setManualAddress] = useState('');
    const [houseNo, setHouseNo] = useState('');
    const [area, setArea] = useState('');
    const [landmark, setLandmark] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
 
    // Manual address toggle
    const [showManualAddress, setShowManualAddress] = useState(false);
    // Location detected feedback
    const [locationDetected, setLocationDetected] = useState(false);
 
    // Optional: Store lat/lng if needed for backend
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

    const [magicText, setMagicText] = useState('');
    const [isMagicLoading, setIsMagicLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleMagicAsk = async () => {
        if (!magicText.trim()) {
            Alert.alert('Error', 'Please enter some text for Magic Auto-fill.');
            return;
        }
        setIsMagicLoading(true);
        try {
            const response = await apiClient.post('/ai/magic-ask', { text: magicText });
            const data = response.data;
            
            setTitle(data.title || title);
            setDescription(data.description || description);
            setCategory(data.category || category);
            setBudgetMin(data.budget_min !== null ? String(data.budget_min) : budgetMin);
            setBudgetMax(data.budget_max !== null ? String(data.budget_max) : budgetMax);
            setMagicText('');
        } catch (error: any) {
            logger.error('Magic Ask Error:', error);
            const status = error?.response?.status;
            if (status === 429) {
                Alert.alert('Please Wait', 'AI is temporarily busy. Please wait a minute and try again.');
            } else {
                Alert.alert('Error', 'Magic Ask failed. Please try again.');
            }
        } finally {
            setIsMagicLoading(false);
        }
    };

    const handleEnhanceDescription = async () => {
        if (!description.trim() || description.length < 10) {
            Alert.alert('Error', 'Please write a few words in the description first to enhance it.');
            return;
        }
        setIsEnhancing(true);
        try {
            const response = await apiClient.post('/ai/enhance-description', { description });
            setDescription(response.data.enhanced_text);
        } catch (error: any) {
            logger.error('Enhance Description Error:', error);
            const status = error?.response?.status;
            const backendDetail = error?.response?.data?.detail || error?.response?.data?.error?.message;
            if (status === 429) {
                Alert.alert('Please Wait', backendDetail || 'AI is temporarily busy. Please wait a minute and try again.');
            } else {
                Alert.alert('Error', backendDetail || 'Failed to enhance description.');
            }
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleLocationDetected = (locationData: { latitude: number; longitude: number; address: string }) => {
        setLocation(locationData.address);
        setCoordinates({ latitude: locationData.latitude, longitude: locationData.longitude });
        setLocationDetected(true);
    };

    const handleSubmit = async () => {
        let finalLocation = location;
        if (showManualAddress) {
            // Build from manual address fields
            const parts = [houseNo, area, landmark, manualAddress].filter(val => val && val.trim().length > 0);
            finalLocation = parts.length > 0 ? parts.join(', ') : location;
        }
        // If user typed a manual address but didn't use GPS
        if (!finalLocation && manualAddress) {
            finalLocation = manualAddress;
        }
        
        if (!finalLocation || finalLocation.trim().length === 0) {
            Alert.alert('Error', 'Please detect your location or enter an address manually.');
            return;
        }

        try {
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
                contact_phone: contactPhone ? contactPhone.trim() : undefined,
            });

            setLoading(true);
            await createAskMutation.mutateAsync(validatedData);

            Alert.alert('Success', 'Ask created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            // Handle both Zod errors and standard errors
            if (error.name === 'ZodError' || error.issues) {
                const firstIssue = error.issues?.[0];
                Alert.alert('Validation Error', firstIssue ? `${firstIssue.path}: ${firstIssue.message}` : 'Please check all fields.');
            } else {
                logger.error('Failed to create ask:', error);
                const serverError = error?.response?.data?.error?.message || error?.response?.data?.detail;
                Alert.alert(
                    'Error', 
                    serverError ? `Server Error: ${serverError}` : 'Failed to create ask. Please check your internet or try again.'
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

                    <View style={[styles.sectionHeaderRow, { marginBottom: spacing[2], marginTop: spacing[4] }]}>
                        <Typography variant="caption" weight="bold" style={{ color: colors.textSecondary }}>
                            Description
                        </Typography>
                    </View>

                    <TextInput
                        placeholder="Provide details about your request..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text }]}
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

                    {/* Location Feedback */}
                    {locationDetected && (
                        <View style={[styles.locationFeedback, { backgroundColor: '#E8F5E9', borderColor: '#81C784' }]}>
                            <Ionicons name="checkmark-circle" size={16} color="#43A047" />
                            <Typography variant="caption" weight="bold" style={{ color: '#2E7D32', marginLeft: 6, flex: 1 }}>
                                Location detected: {location.length > 50 ? location.substring(0, 50) + '...' : location}
                            </Typography>
                        </View>
                    )}

                    {/* Manual Address Input (always visible as a simple text input) */}
                    <Input
                        label="Or type your address"
                        placeholder="e.g. Sector 89, Gurgaon, Haryana"
                        value={manualAddress}
                        onChangeText={(text) => {
                            setManualAddress(text);
                            if (!locationDetected) setLocation(text);
                        }}
                        style={{ marginTop: spacing[3] }}
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

                {/* Section 3: Contact */}
                <Card variant="elevated" elevation="base" style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
                    <Typography variant="body" weight="bold" style={[styles.sectionTitle, { color: colors.text }]}>
                        Contact (Optional)
                    </Typography>
                    <Input
                        label="Phone Number"
                        placeholder="+91 98765 43210"
                        value={contactPhone}
                        onChangeText={setContactPhone}
                        keyboardType="phone-pad"
                    />
                </Card>

                {/* Section 4: Budget */}
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

                {/* Section 5: Photos */}
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
        paddingBottom: spacing[4],
        backgroundColor: '#fff',
        borderBottomWidth: 1.5,
        borderBottomColor: '#F0F2F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F7FA',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    scrollContent: {
        padding: spacing[4],
        paddingBottom: spacing[12],
    },
    sectionCard: {
        marginBottom: spacing[5],
        padding: spacing[5],
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#F0F2F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionTitle: {
        marginBottom: spacing[4],
        color: '#1C1C1C',
        fontSize: 18,
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
        marginTop: spacing[3],
        gap: spacing[2],
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
    locationFeedback: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginTop: spacing[2],
    },
    aiCard: {
        marginBottom: spacing[4],
        padding: spacing[4],
        borderWidth: 1,
        borderRadius: borderRadius.lg,
    },
    magicInputRow: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    magicInput: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing[3],
        fontSize: 14,
    },
    magicButton: {
        height: 44,
        paddingHorizontal: spacing[4],
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    enhanceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[1],
        paddingHorizontal: spacing[2],
    },
    mainButton: {
        marginTop: spacing[6],
        height: 60,
        borderRadius: 30,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    footerHint: {
        marginTop: spacing[4],
    },
});

export default CreateAskScreen;
