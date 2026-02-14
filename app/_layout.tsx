import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/theme';

import { AudioProvider } from '../src/context/AudioContext';
import { MiniPlayer } from '../src/components/MiniPlayer';
import { initNotifications } from '../src/services/notifications';

export default function RootLayout() {
    useEffect(() => {
        try {
            initNotifications();
        } catch (error) {
            console.error('Erro ao inicializar notificações:', error);
        }
    }, []);

    return (
        <SafeAreaProvider>
            <StatusBar style="light" backgroundColor={Colors.primary} />
            <AudioProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
                <MiniPlayer />
            </AudioProvider>
        </SafeAreaProvider>
    );
}
