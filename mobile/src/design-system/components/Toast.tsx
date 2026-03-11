/**
 * Toast Component
 * Non-intrusive notification system
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../ThemeContext';
import { spacing, borderRadius } from '../tokens';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onHide?: () => void;
}

const { width } = Dimensions.get('window');

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    duration = 3000,
    onHide,
}) => {
    const { colors } = useTheme();
    const translateY = React.useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        // Slide in
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 10,
        }).start();

        // Auto hide
        const timer = setTimeout(() => {
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                onHide?.();
            });
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return '#10B981';
            case 'error':
                return '#EF4444';
            case 'warning':
                return '#F59E0B';
            default:
                return colors.primary;
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    transform: [{ translateY }],
                },
            ]}
        >
            <Typography variant="body" weight="medium" style={styles.text}>
                {message}
            </Typography>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: spacing[12],
        left: spacing[4],
        right: spacing[4],
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        borderRadius: borderRadius.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 9999,
    },
    text: {
        color: '#FFFFFF',
        textAlign: 'center',
    },
});
