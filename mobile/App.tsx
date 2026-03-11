import React from 'react';
import { registerRootComponent } from 'expo';
// import * as Sentry from '@sentry/react-native';
// 
// Sentry.init({
//   dsn: 'https://dummyPublicKey@o0.ingest.sentry.io/0',
//   tracesSampleRate: 1.0,
// });
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

export default App;

registerRootComponent(App);
