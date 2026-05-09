import React from 'react';
import * as Sentry from '@sentry/react-native';

// Crash reporting — set EXPO_PUBLIC_SENTRY_DSN in .env / EAS secrets.
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 0.2,
        debug: false,
    });
}
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/hooks/useAuth';
import { OfflineProvider } from './src/contexts/OfflineContext';
import { queryClient } from './src/lib/queryClient';
import { ThemeProvider } from './src/design-system/ThemeContext';
import { ErrorBoundary, ToastContainer } from './src/design-system/components';
import { StatusBar } from 'expo-status-bar';
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

function App() {
    const [fontsLoaded] = useFonts({
        'Inter-Regular': Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
    });

    React.useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <SafeAreaProvider>
                    <ErrorBoundary>
                        <AuthProvider>
                            <OfflineProvider>
                                <AppNavigator />
                                <ToastContainer />
                            </OfflineProvider>
                        </AuthProvider>
                    </ErrorBoundary>
                    <StatusBar style="auto" />
                </SafeAreaProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default Sentry.wrap(App);
