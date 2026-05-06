import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../design-system/ThemeContext';
import { Typography } from '../design-system/components';
import { spacing } from '../design-system/tokens';

export default function AboutUsScreen() {
    const { colors } = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Typography variant="h3" weight="bold" style={styles.title}>
                    About Snabb
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    Our Mission
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Snabb was built with a simple but powerful vision: making local help accessible, instantaneous, and reliable. We believe in empowering local economies by connecting neighbors with skills to those who need them.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    How It Started
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    We realized that while the world is more connected than ever digitally, finding reliable help next door was still too complicated. Snabb bridges the gap between digital convenience and real-world assistance.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    The Team
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    We are a passionate group of developers, designers, and community builders dedicated to changing how people get things done in their local communities.
                </Typography>

                <View style={{ height: spacing[8] }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing[4] },
    title: { marginBottom: spacing[6] },
    sectionTitle: { marginTop: spacing[4], marginBottom: spacing[2] },
    paragraph: { lineHeight: 24 },
});
