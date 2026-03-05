import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'radio-centro-voter-id';

export const useVoterId = (): string | null => {
  const [voterId, setVoterId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrCreateId = async () => {
      try {
        const existing = await SecureStore.getItemAsync(STORAGE_KEY);
        if (!isMounted) return;

        if (existing) {
          setVoterId(existing);
          return;
        }

        const id = uuidv4();
        await SecureStore.setItemAsync(STORAGE_KEY, id);
        if (isMounted) {
          setVoterId(id);
        }
      } catch (error) {
        console.warn('Falha ao obter voterId do dispositivo:', error);
      }
    };

    loadOrCreateId();

    return () => {
      isMounted = false;
    };
  }, []);

  return voterId;
};

