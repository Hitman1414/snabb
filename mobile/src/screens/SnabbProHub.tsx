import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Badge } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing } from '../design-system/tokens';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { ProCarousel } from '../components/ProCarousel';
import apiClient from '../services/api';
import { logger } from '../services/logger';

const { width } = Dimensions.get('window');

export default function SnabbProHub() {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const { user } = useAuth();
    const [topPros, setTopPros] = useState([]);

    useEffect(() => {
        const fetchTopPros = async () => {
            try {
                const response = await apiClient.get('/users/pros?limit=10');
                setTopPros(response.data);
            } catch (err) {
                logger.error('Failed to fetch top pros:', err);
            }
        };
        fetchTopPros();
    }, []);

    const actions = [
        {
            title: 'Browse Tasks',
            subtitle: 'Find people looking for help nearby',
            icon: 'search',
            color: '#059669',
            onPress: () => navigation.navigate('Main' as any, { screen: 'Home' })
        },
        {
            title: 'Pro Dashboard',
            subtitle: 'Track your earnings and ratings',
            icon: 'stats-chart',
            color: '#0891b2',
            onPress: () => navigation.navigate('ProDashboard' as any)
        },
        {
            title: 'My Applications',
            subtitle: 'Manage tasks you are interested in',
            icon: 'briefcase',
            color: '#4f46e5',
            onPress: () => navigation.navigate('Main' as any, { screen: 'Interested' })
        }
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={['#ecfdf5', colors.background]}
                style={styles.header}
            >
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#065f46" />
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                    <View style={[styles.iconBox, { backgroundColor: '#a7f3d0' }]}>
                        <Ionicons name="trophy" size={32} color="#065f46" />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Typography variant="h2" weight="black" style={{ color: '#065f46' }}>Snabb Pro</Typography>
                        {user?.is_pro && <Badge label="VERIFIED" variant="primary" />}
                    </View>
                    <Typography variant="body" color="secondary">Join our professional network and start earning by helping others.</Typography>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {!user?.is_pro && (
                    <TouchableOpacity 
                        style={styles.registerBanner}
                        onPress={() => navigation.navigate('ProApplication' as any)}
                    >
                        <View style={styles.bannerContent}>
                            <Typography variant="h4" weight="black" style={{ color: '#fff' }}>Become a Pro</Typography>
                            <Typography variant="bodySmall" style={{ color: '#d1fae5' }}>Start your application today and unlock earning potential.</Typography>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={40} color="#fff" />
                    </TouchableOpacity>
                )}

                <Typography variant="h5" weight="bold" style={styles.sectionTitle}>Manage Your Business</Typography>
                
                {actions.map((action, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={action.onPress}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                            <Ionicons name={action.icon as any} size={24} color={action.color} />
                        </View>
                        <View style={styles.actionInfo}>
                            <Typography variant="body" weight="bold">{action.title}</Typography>
                            <Typography variant="caption" color="tertiary">{action.subtitle}</Typography>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                ))}

                {/* Migrated Community Experts Carousel */}
                <View style={{ marginTop: spacing[6], marginLeft: -spacing[6], width: width }}>
                    <ProCarousel 
                        pros={topPros} 
                        onProPress={(username) => navigation.navigate('Profile' as any, { username })} 
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: spacing[6],
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[6],
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerContent: {
        gap: spacing[2],
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[2],
    },
    content: {
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[8],
    },
    registerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b981',
        padding: spacing[6],
        borderRadius: 24,
        marginBottom: spacing[6],
    },
    bannerContent: {
        flex: 1,
        gap: 2,
    },
    sectionTitle: {
        marginBottom: spacing[4],
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: spacing[3],
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    actionInfo: {
        flex: 1,
    },
});
