/**
 * OnboardingTour – Mobile
 *
 * A step-by-step onboarding overlay that shows on first app launch.
 * Stores completion state in AsyncStorage under 'hasSeenTour'.
 *
 * Usage:
 *   <OnboardingTour onDone={() => setShowTour(false)} />
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Step {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    title: string;
    description: string;
    tip?: string;
}

const STEPS: Step[] = [
    {
        icon: 'sparkles',
        iconColor: '#F97316',
        iconBg: '#FFEDD5',
        title: 'Welcome to Snabb!',
        description: 'Your all-in-one platform to post tasks, find help, and connect with skilled professionals in your area.',
    },
    {
        icon: 'add-circle',
        iconColor: '#10B981',
        iconBg: '#D1FAE5',
        title: 'Post an Ask',
        description: 'Tap the big orange button to post a request. Describe what you need — delivery, repairs, errands, and more.',
        tip: 'Use "Magic Ask" to auto-fill your form with AI!',
    },
    {
        icon: 'search',
        iconColor: '#3B82F6',
        iconBg: '#DBEAFE',
        title: 'Search & Discover',
        description: 'Use the search bar to instantly find asks by keyword or browse by category icons on the home feed.',
        tip: 'Filter by "Nearby" to see tasks close to you.',
    },
    {
        icon: 'people',
        iconColor: '#8B5CF6',
        iconBg: '#EDE9FE',
        title: 'Hire a Pro',
        description: 'Browse verified Snabb Pros — skilled individuals you can hire directly for high-quality services.',
        tip: 'Pro profiles show ratings and completed tasks.',
    },
    {
        icon: 'chatbubbles',
        iconColor: '#EC4899',
        iconBg: '#FCE7F3',
        title: 'Chat & Negotiate',
        description: 'Message task posters or Pros directly. Agree on details, set a price, and confirm the job — all in-app.',
    },
    {
        icon: 'shield-checkmark',
        iconColor: '#F97316',
        iconBg: '#FFEDD5',
        title: "You're All Set!",
        description: 'Snabb is ready to go. Post your first ask or explore the home feed to get started.',
        tip: 'Upgrade to Snabb Pro to earn money from your skills.',
    },
];

interface Props {
    onDone: () => void;
}

export default function OnboardingTour({ onDone }: Props) {
    const [step, setStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

    // Animate in on mount + on step change
    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(40);
        Animated.parallel([
            Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
        ]).start();
    }, [step]);

    // Update progress bar
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: (step + 1) / STEPS.length,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [step]);

    const handleNext = () => {
        if (isLast) {
            handleDone();
        } else {
            setStep(s => s + 1);
        }
    };

    const handleDone = async () => {
        await AsyncStorage.setItem('hasSeenTour', 'true');
        onDone();
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.overlay}>
            <StatusBar barStyle="light-content" />

            {/* Background darkening */}
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleDone} />

            <Animated.View
                style={[
                    styles.card,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                {/* Progress bar */}
                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                </View>

                {/* Step counter + skip */}
                <View style={styles.topRow}>
                    <Text style={styles.stepCounter}>
                        {step + 1} of {STEPS.length}
                    </Text>
                    <TouchableOpacity onPress={handleDone} style={styles.skipBtn}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* Icon */}
                <View style={[styles.iconCircle, { backgroundColor: current.iconBg }]}>
                    <Ionicons name={current.icon} size={44} color={current.iconColor} />
                </View>

                {/* Content */}
                <Text style={styles.title}>{current.title}</Text>
                <Text style={styles.description}>{current.description}</Text>

                {/* Tip pill */}
                {current.tip && (
                    <View style={styles.tipRow}>
                        <Ionicons name="bulb-outline" size={14} color="#F97316" />
                        <Text style={styles.tipText}>{current.tip}</Text>
                    </View>
                )}

                {/* Dot indicators */}
                <View style={styles.dots}>
                    {STEPS.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                i === step && styles.dotActive,
                                i < step && styles.dotDone,
                            ]}
                        />
                    ))}
                </View>

                {/* Buttons */}
                <View style={styles.btnRow}>
                    {step > 0 && (
                        <TouchableOpacity
                            style={styles.prevBtn}
                            onPress={() => setStep(s => s - 1)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={18} color="#64748B" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.nextBtn, step === 0 && styles.nextBtnFull]}
                        onPress={handleNext}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.nextBtnText}>
                            {isLast ? "Get Started" : 'Next'}
                        </Text>
                        {!isLast && (
                            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
                        )}
                        {isLast && (
                            <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 6 }} />
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15,23,42,0.65)',
    },
    card: {
        width: SCREEN_W,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingTop: 8,
        paddingHorizontal: 28,
        paddingBottom: Platform.OS === 'ios' ? 48 : 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -16 },
        shadowOpacity: 0.18,
        shadowRadius: 40,
        elevation: 24,
    },
    progressTrack: {
        width: '100%',
        height: 3,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        marginBottom: 20,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#F97316',
        borderRadius: 4,
    },
    topRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    stepCounter: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    skipBtn: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    skipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 8,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FED7AA',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
    },
    tipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#C2410C',
        flexShrink: 1,
    },
    dots: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 28,
        marginBottom: 24,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E2E8F0',
    },
    dotActive: {
        width: 22,
        borderRadius: 3,
        backgroundColor: '#F97316',
    },
    dotDone: {
        backgroundColor: '#FED7AA',
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    prevBtn: {
        width: 52,
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    nextBtn: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#F97316',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    nextBtnFull: {
        flex: 1,
    },
    nextBtnText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: 0.3,
    },
});
