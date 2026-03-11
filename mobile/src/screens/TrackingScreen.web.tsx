import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TrackingScreen() {
    return (
        <View style={styles.container}>
            <Text>Live Tracking Map is not supported on the Web Preview.</Text>
            <Text>Please use Expo Go on your physical iOS or Android device to see the Map.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    }
});
