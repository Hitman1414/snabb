import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Card, Badge } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing } from '../design-system/tokens';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NeedHelpHub() {
    const { colors } = useTheme();
    const navigation = useNavigation<NavigationProp>();

    const actions = [
        {
            title: 'Post an Ask',
            subtitle: 'Describe what you need and get offers',
            icon: 'add-circle',
            color: '#ef4444',
            onPress: () => navigation.navigate('CreateAsk' as any)
        },
        {
            title: 'My Active Asks',
            subtitle: 'Track your ongoing requests',
            icon: 'list',
            color: '#3b82f6',
            onPress: () => navigation.navigate('Main' as any, { screen: 'MyAsks' })
        },
        {
            title: 'Drafts',
            subtitle: 'Continue your saved requests',
            icon: 'document-text',
            color: '#6366f1',
            onPress: () => navigation.navigate('Main' as any, { screen: 'MyAsks', params: { tab: 'draft' } })
        }
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={['#ef4444', '#991b1b', colors.background]}
                style={styles.header}
            >
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#991b1b" />
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                    <View style={[styles.iconBox, { backgroundColor: '#fff', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }]}>
                        <Ionicons name="megaphone" size={32} color="#ef4444" />
                    </View>
                    <Typography variant="h1" weight="black" style={{ color: '#fff' }}>Snabb Ask</Typography>
                    <Typography variant="body" style={{ color: '#fff', opacity: 0.9 }}>Need Help? Post help and get things done by Professionals.</Typography>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <Typography variant="h5" weight="bold" style={styles.sectionTitle}>Quick Actions</Typography>
                
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

                <View style={styles.promoBox}>
                    <Typography variant="h5" weight="bold" style={{ color: '#991b1b' }}>How it works</Typography>
                    <View style={styles.step}>
                        <View style={styles.stepNumber}><Typography weight="black" style={{ color: '#fff' }}>1</Typography></View>
                        <Typography variant="bodySmall" weight="bold" style={{ color: '#991b1b' }}>Post your task details & budget</Typography>
                    </View>
                    <View style={styles.step}>
                        <View style={styles.stepNumber}><Typography weight="black" style={{ color: '#fff' }}>2</Typography></View>
                        <Typography variant="bodySmall" weight="bold" style={{ color: '#991b1b' }}>Pros will send you offers</Typography>
                    </View>
                    <View style={styles.step}>
                        <View style={styles.stepNumber}><Typography weight="black" style={{ color: '#fff' }}>3</Typography></View>
                        <Typography variant="bodySmall" weight="bold" style={{ color: '#991b1b' }}>Accept an offer and get it done!</Typography>
                    </View>
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
    promoBox: {
        backgroundColor: '#fef2f2',
        padding: spacing[6],
        borderRadius: 24,
        marginTop: spacing[4],
        gap: spacing[4],
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
