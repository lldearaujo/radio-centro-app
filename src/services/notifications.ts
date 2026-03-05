import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const registerTokenInSupabase = async (token: string) => {
  if (!supabase) return;

  try {
    await supabase
      .from('push_tokens')
      .upsert(
        {
          expo_push_token: token,
          platform: Platform.OS,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'expo_push_token' },
      );
    console.log('[Notifications] Token registrado no Supabase com sucesso.');
  } catch (error) {
    console.warn('[Notifications] Erro ao registrar token no Supabase:', error);
  }
};

const resolveProjectId = (): string | undefined => {
  const extraAny = Constants.expoConfig?.extra as any | undefined;
  const fromExtra = extraAny?.eas?.projectId;
  const fromLegacyExtra = (Constants.expoConfig as any)?.extra?.eas?.projectId;
  const fromEasConfig = (Constants as any).easConfig?.projectId;
  return fromExtra || fromLegacyExtra || fromEasConfig;
};

const registerForPushNotificationsAsync = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  const projectId = resolveProjectId();

  if (!projectId) {
    console.warn('[Notifications] EAS projectId não configurado (extra.eas.projectId ou Constants.easConfig).');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permissão para notificações não concedida.');
    return;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResponse.data;

  if (token) {
    await registerTokenInSupabase(token);
  } else {
    console.warn('[Notifications] getExpoPushTokenAsync não retornou token.');
  }
};

export const initNotifications = () => {
  // Executa de forma assíncrona sem bloquear a UI
  (async () => {
    try {
      await registerForPushNotificationsAsync();
    } catch (error) {
      console.error('[Notifications] Erro ao inicializar notificações:', error);
    }
  })();
};

