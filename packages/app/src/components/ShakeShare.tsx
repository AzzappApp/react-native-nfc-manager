import { BlurView } from 'expo-blur';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Directions,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import {
  useAnimatedSensor,
  SensorType,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { buildUserUrlWithContactCard } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import CoverRenderer from './CoverRenderer';
import type { ShakeShareScreenQuery } from '@azzapp/relay/artifacts/ShakeShareScreenQuery.graphql';

const ShakeShare = () => {
  const { viewer } = useLazyLoadQuery<ShakeShareScreenQuery>(
    graphql`
      query ShakeShareScreenQuery {
        viewer {
          profile {
            webCard {
              userName
              ...CoverRenderer_webCard
            }
            serializedContactCard {
              data
              signature
            }
          }
        }
      }
    `,
    {},
  );

  const [mountScreen, setMountScreen] = useState(false);
  const gyroscope = useAnimatedSensor(SensorType.ACCELEROMETER);

  useDerivedValue(() => {
    const { x, y, z } = gyroscope.sensor.value;
    const speed = Math.abs(x + y + z);
    // this 101 value is from tested, it has to be adjusted after multiple test, maybe removing  one axis
    if (speed > 101) {
      runOnJS(setMountScreen)(true);
    }
  });

  const contactCardUrl = useMemo(() => {
    if (!viewer?.profile?.serializedContactCard) {
      return null;
    }
    const { data, signature } = viewer.profile.serializedContactCard;
    return buildUserUrlWithContactCard(
      viewer.profile.webCard.userName,
      data,
      signature,
    );
  }, [
    viewer?.profile?.serializedContactCard,
    viewer?.profile?.webCard.userName,
  ]);

  const { width } = useWindowDimensions();

  const dismount = useCallback(() => {
    setMountScreen(false);
  }, []);

  //Gesture to close on swipe

  const fling = Gesture.Fling()
    .direction(Directions.DOWN)
    .onEnd(() => {
      runOnJS(dismount)();
    });

  if (!mountScreen) {
    return null;
  }
  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <GestureDetector gesture={fling}>
        <BlurView intensity={27} tint="dark" style={styles.blurView}>
          <SafeAreaView style={styles.safeArea}>
            <Header
              leftElement={
                <IconButton
                  icon="close"
                  variant="icon"
                  onPress={dismount}
                  iconStyle={styles.iconStyle}
                />
              }
              middleElement={
                <Text variant="large" style={styles.headerTitle}>
                  <FormattedMessage
                    defaultMessage={'Share your information'}
                    description={'Shake share screen header title'}
                  />
                </Text>
              }
              style={styles.headerStyle}
            />
            <View style={styles.container}>
              <CoverRenderer
                width={width / 2.5}
                webCard={viewer.profile?.webCard}
                style={styles.coverStyle}
                animationEnabled={true}
              />
              {contactCardUrl && (
                <QRCode
                  value={contactCardUrl}
                  size={width * 0.6}
                  color={colors.white}
                  backgroundColor="transparent"
                  ecl="L"
                />
              )}
            </View>
          </SafeAreaView>
        </BlurView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default ShakeShare;

const styles = StyleSheet.create({
  blurView: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(14, 18, 22, 0.95)',
  },
  headerStyle: { backgroundColor: 'transparent' },
  iconStyle: { tintColor: colors.white },
  coverStyle: { marginBottom: 50 },
  headerTitle: { color: colors.white },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
