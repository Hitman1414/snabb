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
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCreateAsk } from '../hooks/useAsks';
import { useAuth } from '../hooks/useAuth';
import { Input, Typography, Dropdown, LocationPicker, ImagePicker, LoadingButton, Card } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing, borderRadius, elevation } from '../design-system/tokens';
import { CATEGORIES } from '../constants/categories';
import { createAskSchema } from '../lib/validation';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../services/api';
import { toastService } from '../services/toast.service';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAsk'>;

const CreateAskScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const createAskMutation = useCreateAsk();

    const hasAiAccess = user?.is_ai_subscribed || user?.ai_override || user?.is_admin;
 
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
            toastService.warning('Please enter some text to describe your task.');
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
            toastService.success('✨ Form filled! Review and adjust the details.');
        } catch (error: any) {
            logger.error('Magic Ask Error:', error);
            const status = error?.response?.status;
            const detail = error?.response?.data?.detail || '';
            
            let msg = 'Magic Ask failed. Please try again.';
            if (status === 429 || detail.includes('RESOURCE_EXHAUSTED')) {
                msg = "AI is currently busy. Please try again in a few minutes.";
            } else if (status === 400 && detail.toLowerCase().includes('violates')) {
                msg = `🚫 Content blocked: ${detail}`;
            }

            toastService.error(msg);
        } finally {
            setIsMagicLoading(false);
        }
    };

    const handleEnhanceDescription = async () => {
        if (!description.trim() || description.length < 10) {
            toastService.warning('Write a few words in the description first before enhancing.');
            return;
        }
        setIsEnhancing(true);
        try {
            const response = await apiClient.post('/ai/enhance-description', { description });
            setDescription(response.data.enhanced_text);
            toastService.success('Description enhanced!');
        } catch (error: any) {
            logger.error('Enhance Description Error:', error);
            const status = error?.response?.status;
            const detail = error?.response?.data?.detail || '';

            let msg = 'Failed to enhance description.';
            if (status === 429 || detail.includes('RESOURCE_EXHAUSTED')) {
                msg = "AI is busy. Please try again soon.";
            } else if (status === 400 && detail.toLowerCase().includes('violates')) {
                msg = `🚫 Blocked: ${detail}`;
            }

            toastService.error(msg);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleLocationDetected = (locationData: { latitude: number; longitude: number; address: string }) => {
        setLocation(locationData.address);
        setCoordinates({ latitude: locationData.latitude, longitude: locationData.longitude });
        setLocationDetected(true);
    };

    const handleSaveDraft = () => {
        handleSubmit(null, 'draft');
    };

    const handleSubmit = async (e?: any, explicitStatus?: string) => {
        const finalStatus = explicitStatus || 'open';
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
            toastService.warning('Please detect your location or enter an address to continue.');
            return;
        }

        try {
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
                status: finalStatus,
            });

            setLoading(true);
            await createAskMutation.mutateAsync(validatedData);
            const successMsg = finalStatus === 'draft' 
                ? '📝 Ask saved to drafts!' 
                : '🎉 Your Ask has been published! Pros will start responding soon.';
            toastService.success(successMsg);
            navigation.goBack();
        } catch (error: any) {
            if (error.name === 'ZodError' || error.issues) {
                const firstIssue = error.issues?.[0];
                const msg = firstIssue ? firstIssue.message : 'Please check all fields and try again.';
                toastService.warning(msg);
            } else {
                logger.error('Failed to create ask:', error);
                const serverError = error?.response?.data?.detail || error?.response?.data?.error?.message;
                const msg = serverError || 'Failed to publish your Ask. Please check your connection and try again.';
                
                if (msg.toLowerCase().includes('violate') || msg.toLowerCase().includes('prohibited')) {
                    toastService.error(`🚫 ${msg}`);
                } else {
                    toastService.error(msg);
                }
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
                {/* ✨ Magic Ask Banner */}
                {!hasAiAccess ? (
                    <Card variant="elevated" elevation="base" style={[styles.aiCard, { backgroundColor: colors.surface, borderColor: colors.border, borderStyle: 'dashed' }]}>
                        <View style={styles.aiHeader}>
                            <MaterialCommunityIcons name="sparkles" size={20} color={colors.textTertiary} />
                            <Typography variant="body" weight="black" style={{ color: colors.textSecondary, marginLeft: 8, textTransform: 'uppercase', fontSize: 12 }}>
                                Magic Ask Locked
                            </Typography>
                        </View>
                        <Typography variant="caption" style={{ color: colors.textSecondary, marginBottom: spacing[3], fontWeight: 'bold' }}>
                            Subscribe to <Typography variant="caption" weight="black" color="primary">Snabb AI Pro</Typography> to unlock AI-powered form filling and description enhancement.
                        </Typography>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('AiPro')}
                            style={[styles.unlockButton, { backgroundColor: colors.primary }]}
                        >
                            <Typography variant="caption" weight="black" style={{ color: '#fff', textTransform: 'uppercase' }}>Upgrade to Unlock</Typography>
                        </TouchableOpacity>
                    </Card>
                ) : (
                    <Card variant="elevated" elevation="base" style={[styles.aiCard, { backgroundColor: '#F5F3FF', borderColor: '#8B5CF633' }]}>
                        <View style={styles.aiHeader}>
                            <MaterialCommunityIcons name="creation" size={22} color="#8B5CF6" />
                            <Typography variant="body" weight="black" style={{ color: '#8B5CF6', marginLeft: 8, textTransform: 'uppercase', fontSize: 12 }}>
                                Magic Ask — AI Power
                            </Typography>
                        </View>
                        <Typography variant="caption" style={{ color: '#6D28D9', marginBottom: spacing[3], fontWeight: 'bold' }}>
                            Describe what you need in plain English and Gemini will handle the details!
                        </Typography>
                        <View style={styles.magicInputRow}>
                            <TextInput
                                placeholder='e.g. "Fix my leaking sink, budget ₹500"'
                                placeholderTextColor="#A78BFA"
                                value={magicText}
                                onChangeText={setMagicText}
                                style={[styles.magicInput, { borderColor: '#8B5CF644', color: '#4C1D95', backgroundColor: '#fff' }]}
                            />
                            <TouchableOpacity 
                                onPress={handleMagicAsk}
                                disabled={isMagicLoading || !magicText.trim()}
                                style={[styles.magicButton, { backgroundColor: '#8B5CF6', opacity: (isMagicLoading || !magicText.trim()) ? 0.6 : 1 }]}
                            >
                                {isMagicLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="sparkles" size={20} color="#fff" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </Card>
                )}

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
                        <TouchableOpacity 
                            onPress={() => {
                                if (hasAiAccess) {
                                    handleEnhanceDescription();
                                } else {
                                    navigation.navigate('AiPro');
                                }
                            }}
                            disabled={isEnhancing || !description.trim()}
                            style={styles.enhanceButton}
                        >
                            {isEnhancing ? (
                                <ActivityIndicator size="small" color={hasAiAccess ? colors.primary : colors.textTertiary} />
                            ) : (
                                <MaterialCommunityIcons name="auto-fix" size={18} color={hasAiAccess ? colors.primary : colors.textTertiary} />
                            )}
                            <Typography variant="caption" weight="black" color={hasAiAccess ? 'primary' : 'tertiary'} style={{ marginLeft: 6, textTransform: 'uppercase', fontSize: 10 }}>
                                {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                            </Typography>
                        </TouchableOpacity>
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

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        onPress={handleSaveDraft}
                        disabled={loading || !title || !description}
                        style={[styles.draftButton, { borderColor: colors.primary, opacity: (loading || !title || !description) ? 0.6 : 1 }]}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Typography variant="body" weight="black" style={{ color: colors.primary, textTransform: 'uppercase' }}>Save Draft</Typography>
                        )}
                    </TouchableOpacity>

                    <LoadingButton
                        title="Publish Ask"
                        onPress={() => handleSubmit()}
                        loading={loading}
                        disabled={!title || !description || !location}
                        size="lg"
                        style={styles.mainButton}
                    />
                </View>
                
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
        marginBottom: spacing[5],
        padding: spacing[4],
        borderRadius: 24,
        borderWidth: 2,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[1],
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
        height: 48,
        paddingHorizontal: spacing[4],
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    unlockButton: {
        paddingVertical: spacing[3],
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    enhanceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[1],
        paddingHorizontal: spacing[2],
    },
    footerHint: {
        marginTop: spacing[4],
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        marginTop: spacing[6],
    },
    draftButton: {
        flex: 1,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButton: {
        flex: 1.5,
        height: 60,
        borderRadius: 30,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
});

export default CreateAskScreen;
