import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Badge } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing } from '../design-system/tokens';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'react-native';

const { width } = Dimensions.get('window');

export default function AiProScreen() {
    const { colors } = useTheme();
    const { user, toggleSubscription } = useAuth();
    const navigation = useNavigation();

    // Feature toggles state
    const [magicSearch, setMagicSearch] = useState(true);
    const [autoFormFill, setAutoFormFill] = useState(true);

    const isSubscribed = user?.is_ai_subscribed || user?.ai_override || user?.is_admin;

    const features = [
        {
            icon: 'sparkles',
            title: 'Magic Ask',
            description: 'Describe your need in plain text, and Gemini will fill the entire form for you instantly.'
        },
        {
            icon: 'color-wand',
            title: 'AI Description Enhancer',
            description: 'Turn a simple request into a professional, clear description that attracts better pros.'
        },
        {
            icon: 'flash',
            title: 'Smart Matchmaking',
            description: 'Our AI analyzes your task and suggests the most qualified professionals in Gurugram.'
        },
        {
            icon: 'chatbubbles',
            title: 'Expert AI Chat',
            description: 'Get instant advice on budget, time required, and materials needed for your tasks.'
        }
    ];

    const handleSubscribe = async () => {
        await toggleSubscription();
    };

    return (
        <View style={[styles.container, { backgroundColor: '#0f172a' }]}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <LinearGradient
                    colors={['#1e1b4b', '#0f172a']}
                    style={styles.hero}
                >
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.glowContainer}>
                        <View style={styles.glowCircle} />
                        <Ionicons name="sparkles" size={80} color="#818cf8" />
                    </View>

                    <Typography variant="h2" weight="black" align="center" style={{ color: '#fff' }}>
                        Snabb AI Pro
                    </Typography>
                    <Typography variant="body" align="center" style={{ color: '#94a3b8', marginTop: spacing[2], paddingHorizontal: 20 }}>
                        The smartest way to get things done. Powered by Gemini.
                    </Typography>
                    
                    {isSubscribed && (
                        <View style={{ backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="checkmark-circle" size={16} color="#fff" />
                            <Typography variant="caption" weight="bold" style={{ color: '#fff', marginLeft: 4 }}>AI Pro Member</Typography>
                        </View>
                    )}
                </LinearGradient>

                {!isSubscribed ? (
                    <>
                        <View style={styles.ctaContainer}>
                            <View style={styles.pricingBox}>
                                <Typography variant="h2" weight="black" style={{ color: '#fff' }}>₹75</Typography>
                                <Typography variant="bodySmall" style={{ color: '#94a3b8' }}>/ month</Typography>
                            </View>
                            
                            <View style={{ marginBottom: spacing[6], gap: spacing[2] }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="checkmark" size={20} color="#818cf8" />
                                    <Typography variant="body" weight="bold" style={{ color: '#f1f5f9', marginLeft: 8 }}>1 Week FREE Trial</Typography>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="checkmark" size={20} color="#818cf8" />
                                    <Typography variant="body" weight="bold" style={{ color: '#f1f5f9', marginLeft: 8 }}>Unlimited Magic Asks</Typography>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="checkmark" size={20} color="#818cf8" />
                                    <Typography variant="body" weight="bold" style={{ color: '#f1f5f9', marginLeft: 8 }}>Advanced Description Enhancement</Typography>
                                </View>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.subscribeButton}
                                onPress={handleSubscribe}
                            >
                                <LinearGradient
                                    colors={['#6366f1', '#4f46e5']}
                                    style={styles.gradientButton}
                                >
                                    <Ionicons name="flash" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Typography variant="body" weight="bold" style={{ color: '#fff' }}>
                                        Start 7-Day Free Trial
                                    </Typography>
                                </LinearGradient>
                            </TouchableOpacity>
                            
                            <Typography variant="caption" align="center" style={{ color: '#64748b', marginTop: spacing[4], textTransform: 'uppercase', letterSpacing: 1 }}>
                                No commitments • Cancel anytime
                            </Typography>
                        </View>

                        <View style={[styles.featuresContainer, { marginTop: spacing[6] }]}>
                            <Typography variant="h5" weight="black" style={{ color: '#fff', marginBottom: spacing[4] }}>Why Snabb AI?</Typography>
                            {features.map((feature, index) => (
                                <View key={index} style={styles.featureCard}>
                                    <View style={[styles.featureIcon, { backgroundColor: '#312e81' }]}>
                                        <Ionicons name={feature.icon as any} size={24} color="#818cf8" />
                                    </View>
                                    <View style={styles.featureInfo}>
                                        <Typography variant="body" weight="bold" style={{ color: '#f1f5f9' }}>{feature.title}</Typography>
                                        <Typography variant="caption" style={{ color: '#94a3b8', marginTop: 2 }}>{feature.description}</Typography>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                ) : (
                    <View style={styles.subscribedContainer}>
                        <View style={styles.manageBox}>
                            <Typography variant="h5" weight="black" style={{ color: '#fff', marginBottom: spacing[4] }}>Your AI Features</Typography>
                            
                            <View style={styles.toggleRow}>
                                <View style={styles.toggleInfo}>
                                    <View style={[styles.iconSmall, { backgroundColor: '#312e81' }]}>
                                        <Ionicons name="search" size={20} color="#818cf8" />
                                    </View>
                                    <View>
                                        <Typography variant="body" weight="bold" style={{ color: '#f1f5f9' }}>Magic Search</Typography>
                                        <Typography variant="caption" style={{ color: '#94a3b8' }}>Find what you need naturally</Typography>
                                    </View>
                                </View>
                                <Switch
                                    value={magicSearch}
                                    onValueChange={setMagicSearch}
                                    trackColor={{ false: '#334155', true: '#4f46e5' }}
                                    thumbColor="#fff"
                                />
                            </View>
                            
                            <View style={[styles.divider, { backgroundColor: '#334155', marginVertical: spacing[4] }]} />
                            
                            <View style={styles.toggleRow}>
                                <View style={styles.toggleInfo}>
                                    <View style={[styles.iconSmall, { backgroundColor: '#4c1d95' }]}>
                                        <Ionicons name="color-wand" size={20} color="#c084fc" />
                                    </View>
                                    <View>
                                        <Typography variant="body" weight="bold" style={{ color: '#f1f5f9' }}>Auto Form Fill</Typography>
                                        <Typography variant="caption" style={{ color: '#94a3b8' }}>Let AI fill task details automatically</Typography>
                                    </View>
                                </View>
                                <Switch
                                    value={autoFormFill}
                                    onValueChange={setAutoFormFill}
                                    trackColor={{ false: '#334155', true: '#7c3aed' }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </View>

                        <View style={[styles.manageBox, { marginTop: spacing[6], alignItems: 'center', paddingVertical: 40, borderStyle: 'dashed' }]}>
                            <View style={[styles.iconSmall, { backgroundColor: '#312e81', width: 64, height: 64, borderRadius: 32, marginBottom: spacing[4] }]}>
                                <Ionicons name="apps" size={32} color="#818cf8" />
                            </View>
                            <Typography variant="h5" weight="black" style={{ color: '#fff', marginBottom: 4 }}>SaaS Apps Coming Soon</Typography>
                            <Typography variant="bodySmall" align="center" style={{ color: '#94a3b8' }}>
                                We will be launching a suite of SaaS applications in the next release. Stay tuned!
                            </Typography>
                        </View>

                        <TouchableOpacity 
                            style={[styles.subscribeButton, { marginTop: spacing[6], backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155' }]}
                            onPress={handleSubscribe}
                        >
                            <View style={styles.gradientButton}>
                                <Typography variant="body" weight="bold" style={{ color: '#ef4444' }}>
                                    Cancel Subscription
                                </Typography>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing[8],
    },
    hero: {
        height: 350,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[6],
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    glowContainer: {
        marginBottom: spacing[6],
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowCircle: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#6366f1',
        opacity: 0.15,
    },
    featuresContainer: {
        paddingHorizontal: spacing[6],
    },
    featureCard: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        padding: spacing[4],
        borderRadius: 20,
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: '#334155',
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    featureInfo: {
        flex: 1,
    },
    ctaContainer: {
        paddingHorizontal: spacing[6],
        marginTop: spacing[4],
    },
    pricingBox: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: spacing[4],
        gap: 8,
    },
    subscribeButton: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 56,
    },
    gradientButton: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    subscribedContainer: {
        paddingHorizontal: spacing[6],
        marginTop: spacing[4],
    },
    manageBox: {
        backgroundColor: '#1e293b',
        padding: spacing[6],
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#334155',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: spacing[4],
    },
    iconSmall: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    divider: {
        height: 1,
        width: '100%',
    }
});
