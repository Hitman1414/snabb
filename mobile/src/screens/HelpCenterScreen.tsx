import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../design-system/ThemeContext';
import { Typography } from '../design-system/components';
import { spacing } from '../design-system/tokens';

export default function HelpCenterScreen() {
    const { colors } = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Typography variant="h3" weight="bold" style={styles.title}>
                    Help Center
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    Account Issues
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Having trouble logging in? You can reset your password from the login screen. Ensure you're using the correct email address associated with your Snabb account.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    Payments & Pricing
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Creating an ask is free. You negotiate the price directly with the helper. All payments are processed securely through our platform. A small service fee is applied to completed jobs to maintain platform security.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    Safety & Reporting
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Your safety is our priority. Always meet in public, well-lit places when possible. If you encounter any suspicious behavior or have issues with a job, please use the "Report an Issue" feature directly from the ask details page or email us at safety@snabb.app.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    Contact Support
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Can't find what you're looking for? Reach out to our support team directly at support@snabb.app. We typically respond within 24 hours.
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
