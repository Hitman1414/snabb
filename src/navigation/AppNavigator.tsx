import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../design-system/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useConversations } from '../hooks/useMessages';
import { OfflineBanner } from '../design-system/components';
import { registerForPushNotificationsAsync, updatePushTokenOnServer } from '../services/notifications';

// Screens
import {
    LoginScreen,
    RegisterScreen,
    HomeScreen,
    CreateAskScreen,
    AskDetailScreen,
    MyAsksScreen,
    ProfileScreen,
    PrivacyPolicyScreen,
    TermsOfServiceScreen,
    InterestedAsksScreen,
    MessagesScreen,
    ChatScreen,
    ProLandingScreen,
    NotificationsScreen,
    TrackingScreen,
    ProApplicationScreen
} from '../screens';

export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    Login: undefined;
    Register: undefined;
    CreateAsk: undefined;
    AskDetail: { askId: number };
    PrivacyPolicy: undefined;
    TermsOfService: undefined;
    ProLanding: undefined;
    ProApplication: undefined;
    Notifications: undefined;
    Tracking: { askId: number; helperId: number; askerLocation: { latitude: number; longitude: number }; initialHelperLocation?: { latitude: number; longitude: number } };
    Chat: { otherUserId: number; otherUserName: string; askId: number; askTitle: string };
};

export type MainTabParamList = {
    Home: undefined;
    MyAsks: undefined;
    Interested: undefined;
    Messages: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
    const { colors } = useTheme();
    const { data: conversations } = useConversations();
    const unreadCount = conversations?.reduce((sum, conv) => sum + conv.unread_count, 0) || 0;

    return (
        <Tab.Navigator
            id="MainTab"
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textTertiary,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'MyAsks') {
                        iconName = focused ? 'list' : 'list-outline';
                    } else if (route.name === 'Interested') {
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'Messages') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else {
                        iconName = 'help-circle';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Explore',
                }}
            />
            <Tab.Screen
                name="MyAsks"
                component={MyAsksScreen}
                options={{
                    tabBarLabel: 'My Asks',
                }}
            />
            <Tab.Screen
                name="Interested"
                component={InterestedAsksScreen}
                options={{
                    tabBarLabel: 'Interested',
                }}
            />
            <Tab.Screen
                name="Messages"
                component={MessagesScreen}
                options={{
                    tabBarLabel: 'Inbox',
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

export const AppNavigator = () => {
    const { user, loading } = useAuth();
    const { colors } = useTheme();

    useEffect(() => {
        if (user) {
            registerForPushNotificationsAsync().then(token => {
                if (token) {
                    updatePushTokenOnServer(token);
                }
            });
        }
    }, [user]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <>
            <NavigationContainer>
                <Stack.Navigator
                    id="RootStack"
                    screenOptions={{
                        headerStyle: { backgroundColor: colors.surface },
                        headerTintColor: colors.text,
                        headerTitleStyle: { fontWeight: 'bold' },
                        contentStyle: { backgroundColor: colors.background },
                    }}
                >
                    {user ? (
                        <>
                            <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
                            <Stack.Screen name="AskDetail" component={AskDetailScreen} options={{ title: 'Ask Details' }} />
                            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="CreateAsk" component={CreateAskScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="ProLanding" component={ProLandingScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="ProApplication" component={ProApplicationScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Tracking" component={TrackingScreen} options={{ headerShown: false }} />
                        </>
                    ) : (
                        <>
                            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                        </>
                    )}
                    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
                    <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ title: 'Terms of Service' }} />
                </Stack.Navigator>
            </NavigationContainer>
            <OfflineBanner />
        </>
    );
};
