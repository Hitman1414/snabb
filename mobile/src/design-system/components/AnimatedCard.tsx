/**
 * AnimatedCard Component
 * Card with smooth press animation
 */
import React from 'react';
import { StyleSheet, ViewStyle, Animated } from 'react-native';
import { Card, CardProps } from './Card';


interface AnimatedCardProps extends CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    onPress,
    ...props
}) => {
    const scale = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Card
                {...props}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {children}
            </Card>
        </Animated.View>
    );
};

const styles = StyleSheet.create({});
