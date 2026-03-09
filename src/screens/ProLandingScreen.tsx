import React from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, LoadingButton, Card } from '../design-system/components';
import { spacing, borderRadius, colors as themeColors } from '../design-system/tokens';

export default function ProLandingScreen() {
    const { colors, colorScheme } = useTheme();
    const navigation = useNavigation();

    const benefits = [
        {
            icon: 'cash-outline',
            title: 'Earn Extra Income',
            description: 'Help others with tasks and get paid for your time and skills.',
            color: '#1AB64F'
        },
        {
            icon: 'time-outline',
            title: 'Flexible Hours',
            description: 'Choose when you want to work. Be your own boss.',
            color: '#007AFF'
        },
        {
            icon: 'people-outline',
            title: 'Grow Your Business',
            description: 'Build your reputation and get more clients in your area.',
            color: '#AF52DE'
        }
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Image/Banner */}
                <View style={[styles.banner, { backgroundColor: colorScheme === 'dark' ? colors.surfaceVariant : '#ECFDF5' }]}>
                    <TouchableOpacity 
                        style={[styles.backButton, { backgroundColor: colors.surface }]} 
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.bannerContent}>
                        <Ionicons name="sparkles" size={60} color="#10B981" />
                        <Typography variant="h1" weight="bold" style={{ marginTop: spacing[4], color: colorScheme === 'dark' ? colors.text : '#065F46' }}>
                            Become a Snabb Pro
                        </Typography>
                        <Typography variant="body" align="center" style={{ marginTop: spacing[2], color: colorScheme === 'dark' ? colors.textSecondary : '#065F46' }}>
                            Join local helpers and start earning from your skills.
                        </Typography>
                    </View>
                </View>

                {/* Benefits Section */}
                <View style={styles.content}>
                    <Typography variant="h4" weight="bold" style={{ marginBottom: spacing[6] }}>
                        Why join Snabb Pro?
                    </Typography>

                    {benefits.map((benefit, index) => (
                        <Card key={index} variant="outlined" style={[styles.benefitCard, { borderColor: colors.border }]}>
                            <View style={[styles.iconContainer, { backgroundColor: benefit.color + '15' }]}>
                                <Ionicons name={benefit.icon as any} size={28} color={benefit.color} />
                            </View>
                            <View style={styles.benefitText}>
                                <Typography variant="h6" weight="bold">{benefit.title}</Typography>
                                <Typography variant="bodySmall" color="secondary">{benefit.description}</Typography>
                            </View>
                        </Card>
                    ))}

                    <View style={styles.ctaContainer}>
                        <LoadingButton 
                            title="Apply Now" 
                            onPress={() => {}} 
                            style={styles.button}
                        />
                        <Typography variant="caption" color="tertiary" align="center" style={{ marginTop: spacing[4] }}>
                            Application takes less than 2 minutes. Our team will review your profile within 24 hours.
                        </Typography>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    banner: {
        paddingVertical: spacing[12],
        paddingHorizontal: spacing[6],
        alignItems: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: spacing[4],
        left: spacing[4],
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerContent: {
        alignItems: 'center',
        marginTop: spacing[4],
    },
    content: {
        padding: spacing[6],
    },
    benefitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        marginBottom: spacing[4],
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    benefitText: {
        flex: 1,
    },
    ctaContainer: {
        marginTop: spacing[8],
        marginBottom: spacing[10],
    },
    button: {
        height: 56,
        borderRadius: 28,
    }
});
