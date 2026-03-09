import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, ScrollView, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { Config } from '../../src/constants/config';
import { useAudio } from '../../src/context/AudioContext';
import { getActiveVideoBanner, HomeBanner } from '../../src/services/ads';
import { fetchYouTubeVideos, YouTubeVideo } from '../../src/services/youtube';

export default function VideoScreen() {
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<any>({});
    const { pause: pauseAudio, isPlaying: isAudioPlaying } = useAudio();
    const [banner, setBanner] = useState<HomeBanner | null>(null);
    const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
    const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);
    const [youtubeError, setYoutubeError] = useState<string | null>(null);

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

    useEffect(() => {
        const loadBanner = async () => {
            try {
                const activeBanner = await getActiveVideoBanner();
                setBanner(activeBanner);
            } catch (error) {
                console.warn('[VideoScreen] Erro ao carregar banner de vídeo:', error);
            }
        };

        loadBanner();
    }, []);

    useEffect(() => {
        const loadYouTubeVideos = async () => {
            try {
                setIsLoadingYouTube(true);
                setYoutubeError(null);
                const videos = await fetchYouTubeVideos(5);
                setYoutubeVideos(videos);
            } catch (error) {
                console.warn('[VideoScreen] Erro ao carregar vídeos do YouTube:', error);
                setYoutubeError('Não foi possível carregar os vídeos do YouTube.');
            } finally {
                setIsLoadingYouTube(false);
            }
        };

        loadYouTubeVideos();
    }, []);

    const handleTogglePlay = async () => {
        if (status?.isPlaying) {
            await videoRef.current?.pauseAsync();
        } else {
            await videoRef.current?.playAsync();
        }
    };

    const handleFullscreen = async () => {
        try {
            await videoRef.current?.presentFullscreenPlayer();
        } catch (error) {
            console.warn('Erro ao entrar em tela cheia:', error);
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

    const getYouTubeUrl = (video: YouTubeVideo) => {
        if (video.link && video.link.startsWith('http')) {
            return video.link;
        }
        if (video.id) {
            return `https://www.youtube.com/watch?v=${video.id}`;
        }
        // Fallback: canal da Rádio Centro
        return 'https://www.youtube.com/@radiocentrocajazeiras853';
    };

    const handleOpenYouTubeVideo = async (video: YouTubeVideo) => {
        try {
            const url = getYouTubeUrl(video);
            const canOpen = await Linking.canOpenURL(url);
            if (!canOpen) {
                console.warn('[VideoScreen] Não foi possível abrir URL do YouTube:', url);
                return;
            }
            await Linking.openURL(url);
        } catch (error) {
            console.warn('[VideoScreen] Erro ao tentar abrir vídeo do YouTube:', error);
        }
    };

    const formatDate = (value: string) => {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
                    <View style={styles.controlsGroup}>
                        <TouchableOpacity onPress={handleTogglePlay} style={styles.controlMain}>
                            <MaterialIcons
                                name={status?.isPlaying ? "pause" : "play-arrow"}
                                size={32}
                                color={Colors.primary}
                            />
                            <Text style={styles.controlText}>
                                {getButtonText()}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.controlsDivider} />

                        <TouchableOpacity onPress={handleFullscreen} style={styles.controlSecondary}>
                            <MaterialIcons
                                name="fullscreen"
                                size={28}
                                color={Colors.primary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo-red.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {banner && (
                    <View style={styles.bannerWrapper}>
                        <Text style={styles.adLabel}>Publicidade</Text>
                        <TouchableOpacity
                            style={styles.bannerContainer}
                            activeOpacity={0.9}
                            onPress={() => banner.targetUrl && Linking.openURL(banner.targetUrl)}
                            disabled={!banner.targetUrl}
                        >
                            <Image
                                source={{ uri: banner.imageUrl }}
                                style={styles.bannerImage}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity style={styles.messageButton} onPress={handleWhatsApp}>
                    <FontAwesome name="whatsapp" size={20} color="#FFF" />
                    <Text style={styles.messageButtonText}>Enviar mensagem</Text>
                </TouchableOpacity>

                <View style={styles.youtubeSection}>
                    <Text style={styles.youtubeTitle}>Últimas transmissões no YouTube</Text>

                    {isLoadingYouTube && (
                        <View style={styles.youtubeLoading}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.youtubeLoadingText}>Carregando vídeos...</Text>
                        </View>
                    )}

                    {!!youtubeError && !isLoadingYouTube && (
                        <Text style={styles.youtubeErrorText}>{youtubeError}</Text>
                    )}

                    {!isLoadingYouTube && !youtubeError && youtubeVideos.map((video) => (
                        <TouchableOpacity
                            key={video.id}
                            style={styles.youtubeItem}
                            activeOpacity={0.8}
                            onPress={() => handleOpenYouTubeVideo(video)}
                        >
                            {!!video.thumbnail && (
                                <Image
                                    source={{ uri: video.thumbnail }}
                                    style={styles.youtubeThumbnail}
                                    resizeMode="cover"
                                />
                            )}
                            <View style={styles.youtubeInfo}>
                                <Text style={styles.youtubeItemTitle} numberOfLines={2}>
                                    {video.title}
                                </Text>
                                {!!video.publishedAt && (
                                    <Text style={styles.youtubeItemDate}>
                                        {formatDate(video.publishedAt)}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
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
        justifyContent: 'center',
    },
    controlsGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gray,
        borderRadius: 24,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    controlMain: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    controlsDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.border,
    },
    controlSecondary: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
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
        marginBottom: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    bannerWrapper: {
        width: '100%',
        marginBottom: Spacing.lg,
    },
    adLabel: {
        textAlign: 'center',
        marginBottom: Spacing.xs,
        fontSize: FontSize.xs,
        color: Colors.textLight,
        fontStyle: 'italic',
    },
    bannerContainer: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: Colors.gray,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    bannerImage: {
        width: '100%',
        height: 120,
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: 24,
        backgroundColor: '#25D366',
        marginTop: Spacing.sm,
        marginBottom: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    messageButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: FontSize.md,
        marginLeft: Spacing.sm,
    },
    youtubeSection: {
        width: '100%',
        marginBottom: Spacing.lg,
    },
    youtubeTitle: {
        fontSize: FontSize.lg,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    youtubeLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    youtubeLoadingText: {
        marginLeft: Spacing.sm,
        fontSize: FontSize.sm,
        color: Colors.textLight,
    },
    youtubeErrorText: {
        fontSize: FontSize.sm,
        color: 'red',
        marginTop: Spacing.xs,
    },
    youtubeItem: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
        backgroundColor: Colors.gray,
        borderRadius: 12,
        overflow: 'hidden',
    },
    youtubeThumbnail: {
        width: 120,
        height: 80,
    },
    youtubeInfo: {
        flex: 1,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        justifyContent: 'space-between',
    },
    youtubeItemTitle: {
        fontSize: FontSize.sm,
        color: Colors.text,
        fontWeight: '600',
    },
    youtubeItemDate: {
        fontSize: FontSize.xs,
        color: Colors.textLight,
        marginTop: Spacing.xs,
    },
});
