import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Audio } from 'expo-av';
import { Config } from '../constants/config';

interface AudioContextType {
    isPlaying: boolean;
    isLoading: boolean;
    play: () => Promise<void>;
    pause: () => Promise<void>;
    status: string;
}

const AudioContext = createContext<AudioContextType>({
    isPlaying: false,
    isLoading: false,
    play: async () => { },
    pause: async () => { },
    status: '',
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');

    // Usar useRef para rastrear se já tocou (não causa re-render e é acessível no callback)
    const hasPlayedRef = useRef(false);

    useEffect(() => {
        // Configure audio mode for background playback
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        }).catch((error) => {
            console.error('Erro ao configurar modo de áudio:', error);
        });

        return () => {
            if (sound) {
                sound.unloadAsync().catch((error) => {
                    console.error('Erro ao fazer unload do som:', error);
                });
            }
        };
    }, [sound]);

    const onPlaybackStatusUpdate = (playbackStatus: any) => {
        console.log('Status update:', {
            isLoaded: playbackStatus.isLoaded,
            isPlaying: playbackStatus.isPlaying,
            isBuffering: playbackStatus.isBuffering,
            hasPlayed: hasPlayedRef.current
        });

        if (playbackStatus.isLoaded) {
            // Atualizar estado de playing
            setIsPlaying(playbackStatus.isPlaying);

            // Se está tocando, SEMPRE marcar que já tocou e limpar loading
            if (playbackStatus.isPlaying) {
                hasPlayedRef.current = true;
                setIsLoading(false);
                setStatus('Tocando agora');
            }
            // Se já tocou antes e agora está pausado/parado (não buffering)
            else if (hasPlayedRef.current && !playbackStatus.isBuffering) {
                setIsLoading(false);
                setStatus('Pausado');
            }
            // Se está buffering mas JÁ TOCOU antes, manter "Tocando agora" (ignorar micro-buffers)
            else if (hasPlayedRef.current && playbackStatus.isBuffering) {
                setIsLoading(false);
                setStatus('Tocando agora'); // Manter como tocando, ignorar buffering
            }
            // Se está buffering e NUNCA tocou, mostrar loading
            else if (playbackStatus.isBuffering && !hasPlayedRef.current) {
                setIsLoading(true);
                setStatus('Carregando...');
            }
        } else if (playbackStatus.error) {
            console.error('Erro no playback:', playbackStatus.error);
            setIsLoading(false);
            setStatus('Erro de reprodução');
        }
    };

    const initSound = async () => {
        try {
            console.log('--- INICIANDO AUDIO SETUP ---');
            setIsLoading(true);
            setStatus('Carregando...');
            hasPlayedRef.current = false; // Reset

            const uri = Config.urls.audioStreamBackup;
            console.log('Conectando ao stream:', uri);

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            const { sound: newSound } = await Audio.Sound.createAsync(
                {
                    uri: uri,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            setSound(newSound);
            console.log('Sound criado com sucesso');
        } catch (error) {
            console.error('ERRO ao criar player:', error);
            setIsLoading(false);
            setStatus('Erro de conexão');
            hasPlayedRef.current = false;
        }
    };

    const play = async () => {
        // Sempre recriar o stream para garantir que pegamos o "ao vivo"
        if (!sound) {
            await initSound();
        } else {
            try {
                const currentStatus = await sound.getStatusAsync();
                // Se o som foi parado (stopAsync), não está mais loaded
                // Nesse caso, precisamos recriar
                if (!currentStatus.isLoaded) {
                    console.log('Som não está carregado, recriando...');
                    await initSound();
                } else {
                    // Se ainda está loaded, tentar retomar
                    setIsLoading(true);
                    setStatus('Carregando...');
                    await sound.playAsync();
                }
            } catch (e) {
                console.log('Erro ao retomar play:', e);
                // Em caso de erro, limpar e recriar
                try {
                    await sound.unloadAsync();
                } catch (unloadError) {
                    console.log('Erro ao fazer unload:', unloadError);
                }
                setSound(null);
                await initSound();
            }
        }
    };

    const pause = async () => {
        if (sound) {
            try {
                // Para stream ao vivo, é melhor fazer unload completo
                // para economizar dados e garantir que o próximo play pegue o "agora"
                await sound.unloadAsync();
                setSound(null); // Importante: limpar a referência
                setIsPlaying(false);
                setIsLoading(false);
                setStatus('Parado');
                // NÃO resetar hasPlayedRef aqui - deixar true para evitar "Carregando..." em plays subsequentes
            } catch (error) {
                console.log('Erro ao pausar:', error);
                setIsLoading(false);
                setSound(null); // Garantir que limpa mesmo com erro
            }
        }
    };

    return (
        <AudioContext.Provider value={{ isPlaying, isLoading, play, pause, status }}>
            {children}
        </AudioContext.Provider>
    );
};
