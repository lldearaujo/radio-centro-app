import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { useAudio } from '../../src/context/AudioContext';
import { Config } from '../../src/constants/config';
import { useVoterId } from '../../src/hooks/useVoterId';
import {
    getActivePolls,
    getPollResults,
    getPollWithOptions,
    getUserVoteForPoll,
    PollResults,
    PollWithOptions,
} from '../../src/services/polls';
import { getActiveHomeBanner, HomeBanner } from '../../src/services/ads';
import { PollCard } from '../../src/components/PollCard';
import { getActivePrograms, Program } from '../../src/services/programs';

export default function AudioScreen() {
    const { isPlaying, isLoading, play, pause, status } = useAudio();
    const voterId = useVoterId();
    const [highlightPoll, setHighlightPoll] = useState<PollWithOptions | null>(null);
    const [highlightResults, setHighlightResults] = useState<PollResults | null>(null);
    const [highlightHasVoted, setHighlightHasVoted] = useState(false);
    const [loadingPoll, setLoadingPoll] = useState(false);
    const [banner, setBanner] = useState<HomeBanner | null>(null);
    const [currentProgram, setCurrentProgram] = useState<Program | null>(null);

    const handleTogglePlay = async () => {
        if (isPlaying) {
            await pause();
        } else {
            await play();
        }
    };

    const handleWhatsApp = () => {
        const message = 'Olá! Gostaria de enviar uma mensagem para a rádio.';
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

    const handleInstagram = () => {
        const username = Config.social.instagram;
        if (!username) {
            return;
        }
        const appUrl = `instagram://user?username=${username}`;
        const webUrl = `https://instagram.com/${username}`;

        Linking.canOpenURL(appUrl)
            .then(supported => {
                if (supported) {
                    return Linking.openURL(appUrl);
                }
                return Linking.openURL(webUrl);
            })
            .catch(err => console.error('Erro ao abrir Instagram', err));
    };

    useEffect(() => {
        const loadBanner = async () => {
            try {
                const activeBanner = await getActiveHomeBanner();
                setBanner(activeBanner);
            } catch (error) {
                console.warn('[AudioScreen] Erro ao carregar banner:', error);
            }
        };

        loadBanner();
    }, []);

    useEffect(() => {
        const loadCurrentProgram = async () => {
            try {
                const programs = await getActivePrograms();
                const now = new Date();
                const today = now.getDay();
                const nowMinutes = now.getHours() * 60 + now.getMinutes();

                const parseTimeToMinutes = (time: string): number => {
                    const [h, m] = time.split(':').map((v) => parseInt(v, 10));
                    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
                    return h * 60 + m;
                };

                const todays = programs.filter((p) => (p.weekdays || []).includes(today));
                const playing = todays.find((p) => {
                    const start = parseTimeToMinutes(p.start_time);
                    const end = parseTimeToMinutes(p.end_time);
                    return nowMinutes >= start && nowMinutes <= end;
                });

                setCurrentProgram(playing ?? null);
            } catch (error) {
                console.warn('[AudioScreen] Erro ao carregar programa atual:', error);
                setCurrentProgram(null);
            }
        };

        loadCurrentProgram();
    }, []);

    useEffect(() => {
        const loadHighlightPoll = async () => {
            if (!voterId) return;
            try {
                setLoadingPoll(true);
                const polls = await getActivePolls();
                const highlight = polls.find(p => p.highlight) ?? polls[0];
                if (!highlight) {
                    setHighlightPoll(null);
                    setHighlightResults(null);
                    setHighlightHasVoted(false);
                    return;
                }

                const full = await getPollWithOptions(highlight.id);
                if (!full) return;

                setHighlightPoll(full);

                const [results, userVote] = await Promise.all([
                    getPollResults(full.id),
                    getUserVoteForPoll(full.id, voterId),
                ]);

                setHighlightResults(results);
                setHighlightHasVoted(!!userVote);
            } catch (error) {
                console.warn('[AudioScreen] Erro ao carregar enquete em destaque:', error);
            } finally {
                setLoadingPoll(false);
            }
        };

        loadHighlightPoll();
    }, [voterId]);

    const handleVoteHighlight = async (optionId: string) => {
        if (!highlightPoll || !voterId) return;
        try {
            const { voteOnPoll } = await import('../../src/services/polls');
            await voteOnPoll(highlightPoll.id, optionId, voterId);
            const updated = await getPollResults(highlightPoll.id);
            setHighlightResults(updated);
            setHighlightHasVoted(true);
        } catch (error) {
            console.warn('[AudioScreen] Erro ao votar na enquete em destaque:', error);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo-red.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.liveHeader}>
                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveBadgeText}>AO VIVO</Text>
                    </View>
                    <Text style={styles.subtitle}>
                        {currentProgram ? `No ar: ${currentProgram.name}` : 'No ar'}
                    </Text>
                </View>

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

                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.messageButton} onPress={handleWhatsApp}>
                        <FontAwesome name="whatsapp" size={24} color="#FFF" />
                        <Text style={styles.messageButtonText}>Enviar Mensagem</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.instagramButton} onPress={handleInstagram}>
                        <FontAwesome name="instagram" size={24} color="#FFF" />
                        <Text style={styles.instagramButtonText}>Instagram</Text>
                    </TouchableOpacity>
                </View>

                {/* Enquete em destaque */}
                <View style={styles.pollContainer}>
                    {loadingPoll ? (
                        <View style={styles.pollLoading}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.pollLoadingText}>Carregando enquete...</Text>
                        </View>
                    ) : highlightPoll ? (
                        <>
                            <Text style={styles.pollSectionTitle}>Enquete do dia</Text>
                            <PollCard
                                poll={highlightPoll}
                                results={highlightResults ?? undefined}
                                isLoadingResults={false}
                                hasVoted={highlightHasVoted}
                                onVote={handleVoteHighlight}
                                defaultCollapsed
                            />
                        </>
                    ) : null}
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
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
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
        color: Colors.text,
        fontWeight: '600',
        marginTop: Spacing.sm,
    },
    liveHeader: {
        width: '100%',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: 999,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.white,
        marginRight: 6,
    },
    liveBadgeText: {
        fontSize: FontSize.xs,
        color: Colors.white,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    controlsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0,
        marginBottom: Spacing.sm,
    },
    playButton: {
        padding: Spacing.sm,
    },
    statusText: {
        marginTop: Spacing.sm,
        color: Colors.textLight,
        fontSize: FontSize.sm,
    },
    actionsContainer: {
        width: '100%',
        marginTop: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    messageButton: {
        flex: 1,
        marginRight: Spacing.sm,
        flexDirection: 'row',
        backgroundColor: '#25D366', // WhatsApp Brand Color
        paddingVertical: Spacing.md,
        justifyContent: 'center',
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
    instagramButton: {
        flex: 1,
        marginLeft: Spacing.sm,
        flexDirection: 'row',
        backgroundColor: '#E4405F', // Instagram brand color
        paddingVertical: Spacing.md,
        justifyContent: 'center',
        borderRadius: 25,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    instagramButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: FontSize.md,
        marginLeft: Spacing.sm,
    },
    adLabel: {
        textAlign: 'center',
        marginBottom: Spacing.xs,
        fontSize: FontSize.xs,
        color: Colors.textLight,
        fontStyle: 'italic',
    },
    bannerWrapper: {
        width: '100%',
        marginTop: Spacing.lg,
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
    pollContainer: {
        width: '100%',
        marginTop: Spacing.lg,
    },
    pollLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pollLoadingText: {
        marginLeft: Spacing.sm,
        fontSize: FontSize.sm,
        color: Colors.textLight,
    },
    pollSectionTitle: {
        fontSize: FontSize.md,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.sm,
        marginHorizontal: Spacing.md,
    },
});
