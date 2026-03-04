import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../src/constants/theme';

import { AudioProvider } from '../src/context/AudioContext';
import { MiniPlayer } from '../src/components/MiniPlayer';
import { initNotifications } from '../src/services/notifications';

// Error Boundary Component - Simplified for New Architecture compatibility
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        console.error('Erro capturado pelo ErrorBoundary:', error);
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
                    <Text style={styles.errorText}>
                        {this.state.error?.message || 'Erro desconhecido'}
                    </Text>
                    <Text style={styles.errorHint}>
                        Verifique o console para mais detalhes
                    </Text>
                </View>
            );
        }

        return this.props.children;
    }
}

export default function RootLayout() {
    useEffect(() => {
        try {
            initNotifications();
        } catch (error) {
            console.error('Erro ao inicializar notificações:', error);
        }
    }, []);

    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <StatusBar style="light" backgroundColor={Colors.primary} />
                <AudioProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    </Stack>
                    <MiniPlayer />
                </AudioProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.background,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.error,
        marginBottom: 10,
    },
    errorText: {
        fontSize: 16,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 10,
    },
    errorHint: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
    },
});
