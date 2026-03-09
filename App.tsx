import React from 'react';
import { registerRootComponent } from 'expo';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://dummyPublicKey@o0.ingest.sentry.io/0',
  tracesSampleRate: 1.0,
});
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/hooks/useAuth';
import { OfflineProvider } from './src/contexts/OfflineContext';
import { queryClient } from './src/lib/queryClient';
import { ThemeProvider } from './src/design-system/ThemeContext';
import { ErrorBoundary, ToastContainer } from './src/design-system/components';

function App() {
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
                </SafeAreaProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default Sentry.wrap(App);

registerRootComponent(Sentry.wrap(App));
