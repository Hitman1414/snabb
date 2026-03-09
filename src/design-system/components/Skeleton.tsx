/**
 * Skeleton Component
 * Loading placeholder with shimmer effect
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../ThemeContext';
import { borderRadius } from '../tokens';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    variant?: 'rect' | 'circle' | 'text';
    style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius: customBorderRadius,
    variant = 'rect',
    style,
}) => {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [opacity]);

    const getVariantStyle = () => {
        switch (variant) {
            case 'circle':
                return {
                    width: height,
                    height: height,
                    borderRadius: height / 2,
                };
            case 'text':
                return {
                    height: height,
                    borderRadius: 4,
                };
            default:
                return {
                    borderRadius: customBorderRadius ?? 8,
                };
        }
    };

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    backgroundColor: colors.border,
                    opacity,
                },
                getVariantStyle(),
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
});

// Skeleton group for common patterns
interface SkeletonGroupProps {
    variant: 'card' | 'list' | 'profile';
    count?: number;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({ variant, count = 1 }) => {
    const { colors } = useTheme();

    const renderItem = (key: number) => {
        if (variant === 'card') {
            return (
                <View key={key} style={{ padding: 16, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 12 }}>
                    <Skeleton width="60%" height={24} style={{ marginBottom: 12 }} />
                    <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="80%" height={16} style={{ marginBottom: 16 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Skeleton width="30%" height={14} />
                        <Skeleton width="25%" height={14} />
                    </View>
                </View>
            );
        }

        if (variant === 'list') {
            return (
                <View key={key} style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                    <Skeleton variant="circle" height={48} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
                        <Skeleton width="50%" height={14} />
                    </View>
                </View>
            );
        }

        if (variant === 'profile') {
            return (
                <View key={key} style={{ padding: 16, alignItems: 'center' }}>
                    <Skeleton variant="circle" height={80} style={{ marginBottom: 16 }} />
                    <Skeleton width="50%" height={20} style={{ marginBottom: 8 }} />
                    <Skeleton width="70%" height={16} />
                </View>
            );
        }

        return null;
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => renderItem(index))}
        </>
    );
};
