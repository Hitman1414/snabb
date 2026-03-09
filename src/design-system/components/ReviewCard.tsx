/**
 * ReviewCard Component
 * Displays a single review with rating, comment, and reviewer info
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';
import { Typography } from './Typography';
import { Card } from './Card';
import { StarRating } from './StarRating';
import { spacing } from '../tokens';

export interface Review {
    id: number;
    rating: number;
    comment?: string;
    created_at: string;
    reviewer?: {
        id: number;
        username: string;
    };
}

export interface ReviewCardProps {
    review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
    const { colors } = useTheme();

    return (
        <Card variant="outlined" style={styles.card}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Typography variant="bodySmall" weight="semibold">
                        {review.reviewer?.username || 'Anonymous'}
                    </Typography>
                    <StarRating rating={review.rating} readonly size={16} />
                </View>
                <Typography variant="caption" color="tertiary">
                    {new Date(review.created_at).toLocaleDateString()}
                </Typography>
            </View>

            {review.comment && (
                <Typography variant="body" style={styles.comment}>
                    {review.comment}
                </Typography>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: spacing[3],
        marginBottom: spacing[3],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing[2],
    },
    headerLeft: {
        flex: 1,
        gap: spacing[1],
    },
    comment: {
        marginTop: spacing[1],
    },
});
