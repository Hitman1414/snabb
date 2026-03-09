/**
 * TermsOfServiceScreen
 * Displays the app's terms of service
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../design-system/ThemeContext';
import { Typography } from '../design-system/components';
import { spacing } from '../design-system/tokens';

export default function TermsOfServiceScreen() {
    const { colors } = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Typography variant="h3" weight="bold" style={styles.title}>
                    Terms of Service
                </Typography>

                <Typography variant="caption" color="secondary" style={styles.date}>
                    Last updated: December 1, 2025
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    1. Agreement to Terms
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Welcome to Snabb. By accessing or using the Snabb application ("App") and any related services (collectively, the "Services"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    2. User Accounts
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    When you create an account, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on our Service.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    3. Acceptable Use and Content
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    You agree not to use the Services for any unlawful purpose or in any way that interrupts, damages, or impairs the service. You are solely responsible for the content you post ("Content") and your interactions with other users. Snabb reserves the right to remove any Content that violates these Terms or is deemed inappropriate.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    4. Payments and Fees
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Snabb facilitates payments between users seeking help and Helpers. By adding a payment method, you authorize Snabb to charge appropriate fees for transactions. Please note that Snabb may charge service fees or commissions, which will be disclosed prior to confirming a transaction.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    5. Termination
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    6. Limitation of Liability
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Snabb is a platform connecting users. We do not guarantee the quality, safety, or legality of services offered by Helpers. You use the service at your own risk. In no event shall Snabb be liable for indirect, incidental, special, or consequential damages.
                </Typography>

                <View style={{ height: spacing[8] }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing[4],
    },
    title: {
        marginBottom: spacing[2],
    },
    date: {
        marginBottom: spacing[6],
    },
    sectionTitle: {
        marginTop: spacing[4],
        marginBottom: spacing[2],
    },
    paragraph: {
        lineHeight: 24,
    },
});
