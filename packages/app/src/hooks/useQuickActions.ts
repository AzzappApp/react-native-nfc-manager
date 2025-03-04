import * as QuickActions from 'expo-quick-actions';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from '#components/NativeRouter';

export const useQuickActions = () => {
  const router = useRouter();
  useEffect(() => {
    QuickActions.setItems([
      {
        title: 'Scan',
        icon: Platform.select({
          ios: 'symbol:text.viewfinder', //use SF Symbol from apple
          android: 'shortcut_scan',
        }),
        id: 'scan',
      },
    ]);
  }, []);

  useQuickActionCallback(action => {
    if (action.id === 'scan') {
      router.push({
        route: 'CONTACT_CREATE',
        params: { showCardScanner: true },
      });
    }
  });
};
