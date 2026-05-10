import React from 'react';
import { 
    View, 
    ScrollView, 
    TouchableOpacity, 
    StyleSheet, 
    Dimensions 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Badge } from '../design-system/components';
import { useTheme } from '../design-system/ThemeContext';
import { spacing } from '../design-system/tokens';
import { getFullImageUrl } from '../constants/config';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export type ProUser = {
    id: number;
    username: string;
    pro_category: string;
    pro_rating: number;
    pro_completed_tasks: number;
    avatar_url?: string;
};

interface ProCarouselProps {
    pros: ProUser[];
    onProPress: (username: string) => void;
}

export const ProCarousel: React.FC<ProCarouselProps> = ({ pros, onProPress }) => {
    const { colors } = useTheme();

    if (pros.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitle}>
                    <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="trophy" size={18} color="#D97706" />
                    </View>
                    <View>
                        <Typography variant="h5" weight="bold">Community Experts</Typography>
                        <Typography variant="caption" color="tertiary" style={{ marginTop: 2 }}>Top rated pros available now</Typography>
                    </View>
                </View>
                <TouchableOpacity onPress={() => {}}>
                    <Typography variant="caption" weight="bold" color="primary">View All</Typography>
                </TouchableOpacity>
            </View>

            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToInterval={CARD_WIDTH + spacing[4]}
                decelerationRate="fast"
            >
                {pros.map((pro) => (
                    <TouchableOpacity 
                        key={pro.id}
                        activeOpacity={0.9}
                        onPress={() => onProPress(pro.username)}
                        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.avatarContainer, { backgroundColor: colors.surfaceVariant }]}>
                                {pro.avatar_url ? (
                                    <Image 
                                        source={{ uri: getFullImageUrl(pro.avatar_url) }}
                                        style={styles.avatar}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <Typography variant="h4" weight="bold" color="primary">
                                        {pro.username.charAt(0).toUpperCase()}
                                    </Typography>
                                )}
                                <View style={styles.starBadge}>
                                    <Ionicons name="star" size={10} color="#fff" />
                                </View>
                            </View>
                            <View style={styles.proInfo}>
                                <View style={styles.nameRow}>
                                    <Typography variant="body" weight="bold" numberOfLines={1}>{pro.username}</Typography>
                                    <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                                </View>
                                <View style={styles.ratingRow}>
                                    <Typography variant="caption" weight="bold" style={{ color: '#D97706' }}>
                                        {(pro.pro_rating || 5.0).toFixed(1)} ★
                                    </Typography>
                                    <Typography variant="caption" color="tertiary" style={{ marginLeft: 4 }}>
                                        {pro.pro_completed_tasks || 0} REVIEWS
                                    </Typography>
                                </View>
                            </View>
                        </View>
                        
                        <View style={styles.cardFooter}>
                            <Badge 
                                label={pro.pro_category} 
                                variant="outline"
                                size="sm"
                            />
                            <View style={styles.viewProfile}>
                                <Typography variant="caption" weight="bold" color="primary" style={{ fontSize: 9 }}>
                                    VIEW PROFILE
                                </Typography>
                                <Ionicons name="arrow-forward" size={12} color={colors.primary} style={{ marginLeft: 2 }} />
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing[4],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        marginBottom: spacing[4],
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    scrollContent: {
        paddingHorizontal: spacing[4],
        gap: spacing[4],
    },
    card: {
        width: CARD_WIDTH,
        padding: spacing[4],
        borderRadius: 24,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    starBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#D97706',
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    proInfo: {
        flex: 1,
        marginLeft: spacing[3],
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing[3],
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    viewProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
