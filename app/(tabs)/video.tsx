import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { Config } from '../../src/constants/config';
import { useAudio } from '../../src/context/AudioContext';

export default function VideoScreen() {
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<any>({});
    const { pause: pauseAudio, isPlaying: isAudioPlaying } = useAudio();

    // Rastrear se o vídeo já começou a tocar (para ignorar buffering contínuo)
    const hasPlayedRef = useRef(false);

    useFocusEffect(
        useCallback(() => {
            // Pause audio when entering video screen
            if (isAudioPlaying) {
                pauseAudio();
            }
            // Auto play video
            // videoRef.current?.playAsync(); // Vamos deixar o setUser decides ou autoPlay no Video component

            return () => {
                // Stop video when leaving
                videoRef.current?.pauseAsync();
            };
        }, [isAudioPlaying, pauseAudio])
    );

    const handleTogglePlay = async () => {
        if (status?.isPlaying) {
            await videoRef.current?.pauseAsync();
        } else {
            await videoRef.current?.playAsync();
        }
    };


    // Função para determinar o texto do botão
    const getButtonText = () => {
        console.log('getButtonText:', {
            isPlaying: status?.isPlaying,
            isBuffering: status?.isBuffering,
            hasPlayed: hasPlayedRef.current
        });

        // Se está tocando, mostrar "Pausar"
        if (status?.isPlaying) {
            return "Pausar";
        }

        // Se já tocou antes, mostrar "Assistir" (ignorar buffering)
        if (hasPlayedRef.current) {
            return "Assistir";
        }

        // Se está buffering e nunca tocou, mostrar "Carregando..."
        if (status?.isBuffering) {
            return "Carregando...";
        }

        // Padrão
        return "Assistir";
    };

    const handleWhatsApp = () => {
        const message = 'Olá, TV Centro! Estou assistindo pelo app.';
        const url = `whatsapp://send?phone=${Config.social.whatsapp}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
            Linking.openURL(`https://wa.me/${Config.social.whatsapp}?text=${encodeURIComponent(message)}`);
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.videoWrapper}>
                <Video
                    ref={videoRef}
                    style={styles.video}
                    source={{
                        uri: Config.urls.videoStreamHls,
                    }}
                    useNativeControls={false}
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={false}
                    shouldPlay={true}
                    onPlaybackStatusUpdate={(newStatus) => {
                        if (newStatus.isLoaded) {
                            // Marcar que já tocou quando começar a tocar
                            if (newStatus.isPlaying && !hasPlayedRef.current) {
                                hasPlayedRef.current = true;
                                console.log('Vídeo começou a tocar pela primeira vez');
                            }
                            setStatus(newStatus);
                        }
                    }}
                />

                {/* Custom Play/Pause Overlay (só aparece se pausado ou não tocando) */}
                {(status?.isLoaded && !status?.isPlaying && !status?.isBuffering) && (
                    <View style={styles.controlsOverlay}>
                        <TouchableOpacity onPress={handleTogglePlay} style={styles.playButton}>
                            <MaterialIcons name="play-circle-filled" size={80} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </View>
                )}
                {/* Pause Overlay (invisível mas clicável para pausar, ou botão explícito de pause) 
                    Melhor: colocar uma barra de controles abaixo ou overlay clicável. 
                    Simples: Botão play/pause abaixo do vídeo tb.
                 */}
            </View>

            {/* Controles e Informações abaixo do vídeo */}
            <View style={styles.infoContainer}>
                <View style={styles.controlsRow}>
                    <TouchableOpacity onPress={handleTogglePlay} style={styles.controlButton}>
                        <MaterialIcons
                            name={status?.isPlaying ? "pause" : "play-arrow"}
                            size={40}
                            color={Colors.primary}
                        />
                        <Text style={styles.controlText}>
                            {getButtonText()}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo-red.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <TouchableOpacity style={styles.messageButton} onPress={handleWhatsApp}>
                    <FontAwesome name="whatsapp" size={24} color="#FFF" />
                    <Text style={styles.messageButtonText}>Enviar Mensagem</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    videoWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: 'black',
        position: 'relative',
    },
    video: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        opacity: 0.9,
    },
    infoContainer: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.md,
    },
    controlsRow: {
        flexDirection: 'row',
        marginBottom: Spacing.lg,
        alignItems: 'center',
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gray,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: 20,
    },
    controlText: {
        marginLeft: Spacing.sm,
        fontSize: FontSize.md,
        fontWeight: 'bold',
        color: Colors.text,
    },
    logoContainer: {
        width: '60%',
        height: 80,
        marginBottom: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    messageButton: {
        flexDirection: 'row',
        backgroundColor: '#25D366',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 'auto', // Push to bottom if needed, or just margin
        marginBottom: Spacing.xl,
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
