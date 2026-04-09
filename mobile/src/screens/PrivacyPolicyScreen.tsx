/**
 * PrivacyPolicyScreen
 * Displays the app's privacy policy
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../design-system/ThemeContext';
import { Typography } from '../design-system/components';
import { spacing } from '../design-system/tokens';

export default function PrivacyPolicyScreen() {
    const { colors } = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Typography variant="h3" weight="bold" style={styles.title}>
                    Privacy Policy
                </Typography>

                <Typography variant="caption" color="secondary" style={styles.date}>
                    Last updated: December 1, 2025
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    1. Introduction
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Welcome to Snabb (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed to protecting your personal data. This privacy policy informs you how we handle your personal data when you use the Snabb mobile application (&quot;App&quot;) and any related services (collectively, the &quot;Services&quot;), and tells you about your privacy rights.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    2. Information We Collect
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    We may collect, use, store, and transfer different kinds of personal data about you, including:
                    {'\n'}• <Typography weight="bold">Identity Data</Typography>: Username, first and last name, profile picture.
                    {'\n'}• <Typography weight="bold">Contact Data</Typography>: Email address, phone number.
                    {'\n'}• <Typography weight="bold">Location Data</Typography>: Precise or approximate location to connect you with nearby help.
                    {'\n'}• <Typography weight="bold">Financial Data</Typography>: Payment card details and transaction history (processed securely via our payment partners).
                    {'\n'}• <Typography weight="bold">Usage & Technical Data</Typography>: Details about how you use our App, interactions, device ID, and IP address.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    3. How We Use Your Data
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    We use your data only when the law allows us to. Most commonly:
                    {'\n'}• To register you as a new user and manage your account.
                    {'\n'}• To connect you with other users (Helpers or those needing help).
                    {'\n'}• To process and facilitate payments.
                    {'\n'}• To manage our relationship with you, including notifying you of updates.
                    {'\n'}• To improve our App, services, user experiences, and safety.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    4. Data Security and Retention
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered, or disclosed. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
                    {'\n\n'}
                    We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    5. Your Legal Rights
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, or to object to processing. 
                </Typography>

                <Typography variant="h5" weight="semibold" style={styles.sectionTitle}>
                    6. Contact Us
                </Typography>
                <Typography variant="body" style={styles.paragraph}>
                    If you have questions about this privacy policy or our privacy practices, or if you wish to exercise any of your legal rights, please contact us at:
                    {'\n\n'}Email: <Typography weight="semibold" color="primary">privacy@snabb.app</Typography>
                    {'\n'}Address: Snabb Technologies Inc., 123 Innovation Drive, Tech City
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
