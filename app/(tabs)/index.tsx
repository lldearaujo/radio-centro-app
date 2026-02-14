import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { useAudio } from '../../src/context/AudioContext';
import { Config } from '../../src/constants/config';

export default function AudioScreen() {
    const { isPlaying, isLoading, play, pause, status } = useAudio();

    const handleTogglePlay = async () => {
        if (isPlaying) {
            await pause();
        } else {
            await play();
        }
    };

    const handleWhatsApp = () => {
        const message = 'Olá, Rádio Centro! Gostaria de enviar uma mensagem.';
        const url = `whatsapp://send?phone=${Config.social.whatsapp}&text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                return Linking.openURL(url);
            } else {
                // Fallback for when WhatsApp is not installed
                return Linking.openURL(`https://wa.me/${Config.social.whatsapp}?text=${encodeURIComponent(message)}`);
            }
        }).catch(err => console.error('An error occurred', err));
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo-red.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.subtitle}>Ao Vivo</Text>

                <View style={styles.controlsContainer}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={handleTogglePlay}
                        disabled={isLoading}
                    >
                        <MaterialIcons
                            name={isPlaying ? "pause-circle-filled" : "play-circle-filled"}
                            size={100}
                            color={isLoading ? Colors.textLight : Colors.primary}
                        />
                    </TouchableOpacity>
                    <Text style={styles.statusText}>{status}</Text>
                </View>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.messageButton} onPress={handleWhatsApp}>
                        <FontAwesome name="whatsapp" size={24} color="#FFF" />
                        <Text style={styles.messageButtonText}>Enviar Mensagem</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        padding: Spacing.xl,
        width: '100%',
    },
    logoContainer: {
        width: '80%',
        height: 120,
        marginBottom: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.lg,
        color: Colors.textLight,
        marginBottom: Spacing.xl,
        marginTop: Spacing.sm,
    },
    controlsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.xl,
    },
    playButton: {
        padding: Spacing.sm,
    },
    statusText: {
        marginTop: Spacing.md,
        color: Colors.textLight,
        fontSize: FontSize.sm,
    },
    actionsContainer: {
        width: '100%',
        marginTop: Spacing.xl,
        alignItems: 'center',
    },
    messageButton: {
        flexDirection: 'row',
        backgroundColor: '#25D366', // WhatsApp Brand Color
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    messageButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: FontSize.md,
        marginLeft: Spacing.sm,
    },
});
