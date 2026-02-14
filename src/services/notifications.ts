// import { LogLevel, OneSignal } from 'react-native-onesignal';
import { Config } from '../constants/config';

export const initNotifications = () => {
    console.log("Notificações desativadas para teste no Expo Go (Plugin nativo ausente)");
    /* 
    // O código abaixo funciona apenas na Build de Desenvolvimento ou APK final
    try {
        OneSignal.Debug.setLogLevel(LogLevel.Verbose);
        const ONESIGNAL_APP_ID = 'beb38aec-d80e-4d88-b5d6-8853cb01427d';
        OneSignal.initialize(ONESIGNAL_APP_ID);
        OneSignal.Notifications.requestPermission(true);
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
            try { event.getNotification().display(); } catch (e) {}
        });
        OneSignal.Notifications.addEventListener('click', (event: any) => {
            console.log('OneSignal: notification clicked:', event);
        });
    } catch (error) {
        console.warn('OneSignal erro:', error);
    } 
    */
};
