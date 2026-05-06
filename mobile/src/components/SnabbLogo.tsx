import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SnabbLogoProps {
    scale?: number;
}

/**
 * SnabbLogo — Pure React Native component.
 * Orange circle blob with WHITE 'S' + large dark 'nabb' text.
 */
const SnabbLogo: React.FC<SnabbLogoProps> = ({ scale = 1 }) => {
    const blob     = 96  * scale;   // circle diameter
    const sSize    = 64  * scale;   // 's' font size (white, inside blob)
    const nabbSize = 72  * scale;   // 'nabb' font size

    return (
        <View style={styles.row}>
            {/* Orange circle blob */}
            <View
                style={[
                    styles.blob,
                    {
                        width: blob,
                        height: blob,
                        borderRadius: blob / 2,
                    },
                ]}
            >
                <Text
                    style={[
                        styles.sText,
                        { fontSize: sSize, lineHeight: blob },
                    ]}
                >
                    s
                </Text>
            </View>

            {/* 'nabb' */}
            <Text
                style={[
                    styles.nabbText,
                    { fontSize: nabbSize, marginLeft: 10 * scale },
                ]}
            >
                nabb
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    blob: {
        backgroundColor: '#FF8C00',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#B94500',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
    },
    sText: {
        color: '#FFFFFF',          // ← WHITE 's' on orange blob
        fontFamily: 'Inter-Bold',
        textAlign: 'center',
        includeFontPadding: false,
    },
    nabbText: {
        color: '#0F172A',          // dark navy 'nabb'
        fontFamily: 'Inter-Bold',
        includeFontPadding: false,
    },
});

export default SnabbLogo;
