import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudio } from '../context/AudioContext';
import { Colors, Spacing, FontSize } from '../constants/theme';
import { useRouter, usePathname } from 'expo-router';
import { Config } from '../constants/config';

export const MiniPlayer = () => {
    const { isPlaying, isLoading, play, pause, status } = useAudio();
    const router = useRouter();
    const pathname = usePathname();

    // Não mostrar na tela de Video para não sobrepor
    if (pathname === '/video') return null;

    // Só mostrar se estiver tocando ou carregando
    // if (!isPlaying && !isLoading) return null; 

    const handleTogglePlay = async () => {
        if (isPlaying) {
            await pause();
        } else {
            await play();
        }
    };

    const handlePress = () => {
        router.push('/(tabs)');
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.infoContainer} onPress={handlePress}>
                <Text style={styles.title} numberOfLines={1}>{Config.app.name}</Text>
                <Text style={styles.status}>{status || 'Toque para abrir'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.playButton}
                onPress={handleTogglePlay}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                    <MaterialIcons
                        name={isPlaying ? "pause" : "play-arrow"}
                        size={32}
                        color={Colors.white}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        padding: Spacing.sm,
        height: 60,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    infoContainer: {
        flex: 1,
        paddingHorizontal: Spacing.sm,
    },
    title: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: FontSize.sm,
    },
    status: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: FontSize.xs,
    },
    playButton: {
        padding: Spacing.xs,
    },
});
