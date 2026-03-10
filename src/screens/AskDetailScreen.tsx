import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAsk } from '../hooks/useAsks';
import { useResponses, useCreateResponse } from '../hooks/useResponses';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../design-system/ThemeContext';
import { Typography, Card, SkeletonGroup, Badge, LoadingButton, EmptyState, StarRating, ReviewCard, CloseAskModal, MessageModal, Input } from '../design-system/components';
import { spacing, elevation } from '../design-system/tokens';
import { useCreateReview, useAskReviews } from '../hooks/useReviews';
import { useToggleInterested } from '../hooks/useResponses';
import { useMarkMessagesRead } from '../hooks/useMessages';
import { getFullImageUrl } from '../constants/config';
import { responseSchema, reviewSchema } from '../lib/validation';
import { z } from 'zod';
import { toastService } from '../services/toast.service';

type AskDetailRouteProp = RouteProp<RootStackParamList, 'AskDetail'>;

export default function AskDetailScreen() {
    const route = useRoute<AskDetailRouteProp>();
    const { askId } = route.params;
    const navigation = useNavigation<any>();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [responseMessage, setResponseMessage] = useState('');
    const [bidAmount, setBidAmount] = useState('');

    // Review state
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);

    // Modal state
    const [closeAskVisible, setCloseAskVisible] = useState(false);
    const [messageModalVisible, setMessageModalVisible] = useState(false);
    const [selectedReceiver, setSelectedReceiver] = useState<{ id: number; username: string } | null>(null);

    const toggleInterestedMutation = useToggleInterested();
    const markMessagesReadMutation = useMarkMessagesRead();

    const {
        data: ask,
        isLoading: isAskLoading,
        refetch: refetchAsk,
        isRefetching: isAskRefetching
    } = useAsk(askId);

    const {
        data: responses,
        isLoading: isResponsesLoading,
        refetch: refetchResponses
    } = useResponses(askId);

    const createResponseMutation = useCreateResponse(askId);

    const {
        data: reviews,
        isLoading: isReviewsLoading,
        refetch: refetchReviews
    } = useAskReviews(askId);

    const createReviewMutation = useCreateReview();

    const handleRefresh = () => {
        refetchAsk();
        refetchResponses();
        refetchReviews();
    };

    const handleSubmitResponse = async () => {
        try {
            const validatedData = responseSchema.parse({
                message: responseMessage,
                bid_amount: bidAmount ? parseFloat(bidAmount) : undefined,
            });

            await createResponseMutation.mutateAsync(validatedData);
            setResponseMessage('');
            setBidAmount('');
            toastService.success('Response submitted!');
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toastService.error(error.issues[0].message);
            } else {
                console.error('Failed to submit response', error);
                toastService.error('Failed to submit response');
            }
        }
    };

    const handleSubmitReview = async () => {
        if (!computedRevieweeId) {
            toastService.error('Cannot determine who to review');
            return;
        }

        try {
            const validatedData = reviewSchema.parse({
                rating,
                comment: reviewComment,
            });

            await createReviewMutation.mutateAsync({
                ask_id: askId,
                reviewee_id: computedRevieweeId,
                ...validatedData
            });
            
            setIsReviewing(false);
            setRating(0);
            setReviewComment('');
            toastService.success('Review submitted!');
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toastService.error(error.issues[0].message);
            } else {
                console.error('Failed to submit review', error);
                toastService.error('Failed to submit review');
            }
        }
    };

    const handleToggleInterested = async (responseId: number, currentStatus: boolean) => {
        try {
            await toggleInterestedMutation.mutateAsync({
                responseId,
                isInterested: !currentStatus
            });
        } catch (error) {
            console.error('Failed to toggle interested', error);
        }
    };

    const handleRevert = (userId: number, username: string) => {
        setSelectedReceiver({ id: userId, username });
        setMessageModalVisible(true);
        // Mark messages as read when opening the modal
        markMessagesReadMutation.mutate(askId);
    };

    if (isAskLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={{ padding: spacing[4] }}>
                    <SkeletonGroup variant="card" />
                    <SkeletonGroup variant="list" />
                </View>
            </View>
        );
    }

    if (!ask) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <EmptyState
                    title="Ask Not Found"
                    description="The ask you are looking for does not exist or has been removed."
                    icon="alert-circle-outline"
                />
            </View>
        );
    }

    // Compute review eligibility BEFORE rendering
    const acceptedResponse = responses?.find(r => r.is_accepted);
    const isAskOwner = user?.id === ask.user_id;
    const isAcceptedResponder = responses?.some(r => r.user_id === user?.id && r.is_accepted);
    const hasAlreadyReviewed = reviews?.some(r => r.reviewer_id === user?.id);

    // Determine who the current user would review
    let computedRevieweeId: number | null = null;
    if (isAskOwner) {
        if (ask.server_id) {
            computedRevieweeId = ask.server_id;
        } else if (acceptedResponse) {
            computedRevieweeId = acceptedResponse.user_id;
        }
    } else if (isAcceptedResponder) {
        computedRevieweeId = ask.user_id;
    }

    // Can show review form only if involved AND there's a reviewee AND not yet reviewed
    const canLeaveReview = (isAskOwner || isAcceptedResponder) && !hasAlreadyReviewed && computedRevieweeId !== null;
    // Ask was closed but no helper was ever selected
    const closedWithoutHelper = ask.status === 'closed' && !ask.server_id && !acceptedResponse;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isAskRefetching}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Ask Details Card */}
                <View style={[styles.askHeaderCard, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <View style={styles.headerRow}>
                        <Badge
                            label={ask.status.replace('_', ' ').toUpperCase()}
                            variant={ask.status === 'open' ? 'success' : ask.status === 'in_progress' ? 'info' : 'outline'}
                            size="sm"
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                           <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                           <Typography variant="caption" color="tertiary" style={{ marginLeft: 4 }}>
                                {new Date(ask.created_at).toLocaleDateString()}
                            </Typography>
                        </View>
                    </View>

                    <Typography variant="h3" weight="bold" style={styles.title}>
                        {ask.title}
                    </Typography>

                    <View style={styles.categoryRow}>
                        <View style={[styles.categoryPill, { backgroundColor: colors.infoLight + '30' }]}>
                             <Typography variant="caption" weight="bold" style={{ color: colors.info }}>{ask.category}</Typography>
                        </View>
                        <View style={styles.locationMeta}>
                           <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                           <Typography variant="bodySmall" color="secondary" style={{ marginLeft: 4 }}>
                                {ask.location}
                            </Typography>
                        </View>
                    </View>

                    <Typography variant="body" style={styles.description}>
                        {ask.description}
                    </Typography>

                    {ask.images && ask.images.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing[3] }}>
                            {ask.images.map((imgUrl, index) => (
                                <Image 
                                    key={index}
                                    source={{ uri: getFullImageUrl(imgUrl) as string }}
                                    style={{
                                        width: 140,
                                        height: 140,
                                        borderRadius: 12,
                                        marginRight: spacing[3],
                                        backgroundColor: 'rgba(0,0,0,0.05)'
                                    }}
                                />
                            ))}
                        </ScrollView>
                    )}

                    {ask.budget_min && ask.budget_max && (
                        <View style={[styles.budgetModern, { backgroundColor: colors.primaryLight + '15' }]}>
                            <View>
                                <Typography variant="caption" color="secondary" weight="medium">Proposed Budget</Typography>
                                <Typography variant="h4" color="primary" weight="bold" style={{ color: colors.primaryDark }}>
                                    ₹{ask.budget_min} - ₹{ask.budget_max}
                                </Typography>
                            </View>
                            <View style={[styles.budgetIconBox, { backgroundColor: colors.surface }]}>
                                <Ionicons name="wallet-outline" size={24} color={colors.primaryDark} />
                            </View>
                        </View>
                    )}


                    {/* Close Ask Button for Owner */}
                    {ask.status === 'open' && ask.user_id === user?.id && (
                        <View style={{ marginTop: spacing[4] }}>
                            <LoadingButton
                                title="Close Ask"
                                variant="outline"
                                onPress={() => setCloseAskVisible(true)}
                            />
                        </View>
                    )}

                    {ask.status === 'in_progress' && ask.user_id === user?.id && (
                        <View style={{ marginTop: spacing[4] }}>
                            <LoadingButton
                                title="Track Helper"
                                variant="primary"
                                onPress={() => navigation.navigate('Tracking', {
                                    askId: ask.id,
                                    helperId: ask.server_id,
                                    askerLocation: { 
                                        latitude: ask.latitude || 28.4595, 
                                        longitude: ask.longitude || 77.0266 
                                    }
                                } as any)}
                            />
                            <LoadingButton
                                title="Mark as Completed"
                                variant="outline"
                                style={{ marginTop: spacing[2] }}
                                onPress={() => setCloseAskVisible(true)}
                            />
                        </View>
                    )}
                </View>

                {/* Responses Section */}
                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    Responses ({responses?.length || 0})
                </Typography>

                {isResponsesLoading ? (
                    <SkeletonGroup variant="list" />
                ) : responses && responses.length > 0 ? (
                    responses.map((response) => (
                        <Card key={response.id} variant="elevated" style={styles.responseCard}>
                            <View style={styles.responseHeader}>
                                <View style={styles.responseUser}>
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant, overflow: 'hidden' }]}>
                                        {response.user?.avatar_url ? (
                                            <Image 
                                                source={{ uri: getFullImageUrl(response.user.avatar_url) as string }} 
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        ) : (
                                            <Typography variant="bodySmall" weight="bold" style={{ color: colors.primary }}>
                                                {(response.user?.username || 'U')[0].toUpperCase()}
                                            </Typography>
                                        )}
                                    </View>
                                    <View>
                                        <Typography variant="body" weight="bold">
                                            {response.user?.username || 'User'}
                                        </Typography>
                                        <Typography variant="caption" color="tertiary">
                                            {new Date(response.created_at).toLocaleDateString()}
                                        </Typography>
                                    </View>
                                </View>
                                {response.is_accepted && (
                                    <Badge label="ACCEPTED" variant="success" size="sm" />
                                )}
                            </View>

                            <Typography variant="body" style={styles.responseMessage}>
                                {response.message}
                            </Typography>

                            {response.bid_amount && (
                                <View style={[styles.bidContainer, { backgroundColor: colors.surfaceVariant }]}>
                                    <Typography variant="caption" color="secondary">Bid Amount:</Typography>
                                    <Typography variant="body" weight="bold" color="primary">
                                        ₹{response.bid_amount}
                                    </Typography>
                                </View>
                            )}

                            {/* Response Actions for Ask Owner */}
                            {ask.user_id === user?.id && (
                                <View style={styles.responseActions}>
                                    <LoadingButton
                                        title={response.is_interested ? "Shortlisted" : "Interested"}
                                        variant={response.is_interested ? "primary" : "outline"}
                                        size="sm"
                                        onPress={() => handleToggleInterested(response.id, response.is_interested || false)}
                                        style={{ flex: 1, marginRight: spacing[2] }}
                                        loading={toggleInterestedMutation.isPending && toggleInterestedMutation.variables?.responseId === response.id}
                                    />
                                    <LoadingButton
                                        title="Revert"
                                        variant="secondary"
                                        size="sm"
                                        onPress={() => handleRevert(response.user_id, response.user?.username || 'User')}
                                        style={{ flex: 1 }}
                                    />
                                </View>
                            )}
                        </Card>
                    ))
                ) : (
                    <EmptyState
                        title="No Responses Yet"
                        description="Be the first to respond to this ask!"
                        icon="chatbubble-ellipses-outline"
                        style={{ padding: spacing[4] }}
                    />
                )}

                {/* Response Input Area - Only if ask is open and user doesn't own it */}
                {ask.status === 'open' && ask.user_id !== user?.id ? (
                    <View style={[styles.inputSection, { backgroundColor: colors.surface }]}>
                        <Typography variant="h6" style={{ marginBottom: spacing[2] }}>
                            Submit a Response
                        </Typography>

                        <Input
                            placeholder="Write your response..."
                            value={responseMessage}
                            onChangeText={setResponseMessage}
                            multiline
                            numberOfLines={3}
                            style={{ marginBottom: spacing[2] }}
                        />

                        <Input
                            placeholder="Bid Amount (Optional)"
                            value={bidAmount}
                            onChangeText={setBidAmount}
                            keyboardType="numeric"
                            style={{ marginBottom: spacing[3] }}
                        />

                        <LoadingButton
                            title="Submit Response"
                            onPress={handleSubmitResponse}
                            loading={createResponseMutation.isPending}
                            disabled={!responseMessage.trim()}
                            fullWidth
                        />
                    </View>
                ) : ask.status === 'open' && ask.user_id === user?.id ? (
                    <Card variant="outlined" style={styles.ownerNotice}>
                        <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
                            💡 You cannot respond to your own ask
                        </Typography>
                    </Card>
                ) : null}

                {/* Reviews Section - Only if ask is closed */}
                {ask.status === 'closed' && (
                    <View style={styles.reviewsSection}>
                        <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                            Reviews
                        </Typography>

                        {/* Closed without helper — show info notice instead of review form */}
                        {closedWithoutHelper && isAskOwner && (
                            <Card variant="outlined" style={styles.ownerNotice}>
                                <Ionicons name="information-circle-outline" size={20} color="#6B7280" style={{ marginBottom: 4 }} />
                                <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
                                    This ask was closed without selecting a helper, so no review can be left.
                                </Typography>
                            </Card>
                        )}

                        {/* Review Form */}
                        {canLeaveReview && (
                            <Card variant="elevated" style={styles.reviewForm}>
                                <Typography variant="h6" style={{ marginBottom: spacing[2] }}>
                                    Leave a Review
                                </Typography>
                                <Typography variant="bodySmall" color="secondary" style={{ marginBottom: spacing[3] }}>
                                    How was your experience?
                                </Typography>

                                <View style={{ alignItems: 'center', marginBottom: spacing[3] }}>
                                    <StarRating
                                        rating={rating}
                                        onRatingChange={setRating}
                                        size={32}
                                    />
                                </View>

                                <Input
                                    placeholder="Share your feedback (optional)..."
                                    value={reviewComment}
                                    onChangeText={setReviewComment}
                                    multiline
                                    numberOfLines={3}
                                    style={{ marginBottom: spacing[3] }}
                                />

                                <LoadingButton
                                    title="Submit Review"
                                    onPress={handleSubmitReview}
                                    loading={createReviewMutation.isPending}
                                    disabled={rating === 0}
                                    fullWidth
                                />
                            </Card>
                        )}

                        {/* Reviews List */}
                        {isReviewsLoading ? (
                            <SkeletonGroup variant="list" />
                        ) : reviews && reviews.length > 0 ? (
                            reviews.map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))
                        ) : (
                            !closedWithoutHelper && (
                                <EmptyState
                                    title="No Reviews Yet"
                                    description="Reviews will appear here once the ask is completed."
                                    icon="star-outline"
                                    style={{ padding: spacing[4] }}
                                />
                            )
                        )}
                    </View>
                )}
            </ScrollView>


            {/* Modals */}
            {
                ask && (
                    <CloseAskModal
                        visible={closeAskVisible}
                        onClose={() => setCloseAskVisible(false)}
                        askId={ask.id}
                        responses={responses || []}
                    />
                )
            }

            {
                selectedReceiver && (
                    <MessageModal
                        visible={messageModalVisible}
                        onClose={() => setMessageModalVisible(false)}
                        receiverId={selectedReceiver.id}
                        receiverName={selectedReceiver.username}
                        askId={askId}
                    />
                )
            }
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing[8],
    },
    askHeaderCard: {
        padding: spacing[5],
        borderBottomWidth: 1,
        marginBottom: spacing[4],
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    title: {
        marginBottom: spacing[3],
        lineHeight: 34,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[5],
    },
    categoryPill: {
        paddingHorizontal: spacing[3],
        paddingVertical: 4,
        borderRadius: 8,
    },
    locationMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: spacing[4],
    },
    description: {
        marginBottom: spacing[6],
        lineHeight: 24,
    },
    budgetModern: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing[4],
        borderRadius: 16,
        marginBottom: spacing[2],
    },
    budgetIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        marginHorizontal: spacing[4],
        marginBottom: spacing[3],
        marginTop: spacing[2],
    },
    responseCard: {
        marginHorizontal: spacing[4],
        padding: spacing[4],
        marginBottom: spacing[4],
        borderRadius: 20,
    },
    responseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[3],
    },
    responseUser: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    responseMessage: {
        marginBottom: spacing[3],
        lineHeight: 20,
    },
    bidContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[2],
        paddingHorizontal: spacing[3],
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    responseActions: {
        flexDirection: 'row',
        marginTop: spacing[4],
        gap: spacing[2],
    },
    inputSection: {
        margin: spacing[4],
        padding: spacing[4],
        borderRadius: 20,
        ...elevation.base,
    },
    ownerNotice: {
        margin: spacing[4],
        padding: spacing[4],
        borderRadius: 16,
    },
    reviewsSection: {
        marginTop: spacing[4],
    },
    reviewForm: {
        marginHorizontal: spacing[4],
        padding: spacing[5],
        marginBottom: spacing[6],
        borderRadius: 20,
    },
});
