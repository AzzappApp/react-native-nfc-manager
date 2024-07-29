import { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { graphql, useFragment } from 'react-relay';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { colors } from '#theme';
import PremiumIndicator from '#components/PremiumIndicator';
import useScreenInsets from '#hooks/useScreenInsets';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import { useHomeScreenContext } from './HomeScreenContext';
import type { HomeHeader_user$key } from '#relayArtifacts/HomeHeader_user.graphql';
import type { ColorValue } from 'react-native';

type HomeHeaderProps = {
  openPanel: () => void;
  user: HomeHeader_user$key;
};

const HomeHeader = ({ openPanel, user: userKey }: HomeHeaderProps) => {
  const { profiles } = useFragment(
    graphql`
      fragment HomeHeader_user on User {
        profiles {
          webCard {
            id
            cardColors {
              primary
            }
            isPremium
          }
        }
      }
    `,
    userKey,
  );
  const insets = useScreenInsets();
  const headerStyle = useMemo(() => ({ marginTop: insets.top }), [insets.top]);
  const { currentIndexSharedValue, currentIndexProfile, inputRange } =
    useHomeScreenContext();
  const readableColors = useMemo(
    () => [
      colors.white,
      ...(profiles?.map(profile => {
        return profile?.webCard.cardColors?.primary
          ? getTextColor(profile?.webCard.cardColors?.primary)
          : colors.white;
      }) ?? []),
    ],
    [profiles],
  );
  const colorValue = useDerivedValue<ColorValue>(() => {
    const currentProfileIndex = currentIndexSharedValue.value;
    if (inputRange.value.length > 1) {
      return interpolateColor(
        currentProfileIndex,
        inputRange.value,
        readableColors,
      );
    }
    if (readableColors.length > 0) {
      return readableColors[0];
    }
    return colors.white;
  }, [readableColors]);

  const svgProps = useAnimatedProps(() => ({ color: colorValue.value }));

  const iconStyles = useAnimatedStyle(() => ({
    tintColor: colorValue.value,
  }));

  const [currentWebCard, setCurrentWebCard] = useState(
    profiles?.[currentIndexProfile.value - 1]?.webCard,
  );
  useAnimatedReaction(
    () => currentIndexProfile.value,
    index => {
      const cProfile = profiles?.[index - 1];
      runOnJS(setCurrentWebCard)(cProfile?.webCard);
    },
  );

  return (
    <Header
      middleElement={
        <>
          <PremiumIndicator
            isRequired={currentWebCard?.isPremium}
            size={18}
            style={[styles.premiumIndicator, iconStyles]}
          />
          <AnimatedSvg
            width={134}
            height={32}
            viewBox="0 0 134 32"
            animatedProps={svgProps}
          >
            <Path
              d="M13.843 29.2C14.3314 29.2 14.8124 29.168 15.2841 29.106C16.8806 28.8962 18.5938 29.4314 19.3921 30.8298C17.6933 31.5824 15.8163 32 13.843 32C6.19771 32 0 25.732 0 18C0 10.268 6.19771 4 13.843 4C21.4882 4 27.6859 10.268 27.6859 18C27.6859 22.735 25.3616 26.921 21.804 29.4547L13.9344 15.6749L11.7943 19.4237C10.8143 21.1404 8.98923 22.2 7.01247 22.2L13.9344 10.0749L22.4688 25.0247C24.0004 23.1035 24.9174 20.66 24.9174 18C24.9174 11.8144 19.9592 6.8 13.843 6.8C7.72676 6.8 2.76859 11.8144 2.76859 18C2.76859 24.1856 7.72676 29.2 13.843 29.2Z"
              fill="currentColor"
            />
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M101.762 28.3706C102.139 28.1695 102.374 27.7776 102.374 27.351V22.8816C103.839 24.4086 105.92 25.3593 108.205 25.3593C112.659 25.3593 116.234 21.8157 116.234 17.4653C116.234 13.115 112.659 9.6001 108.205 9.6001C103.781 9.6001 100.206 13.115 100.206 17.4653V29.2001L101.762 28.3706ZM102.374 17.4653C102.374 14.2962 104.982 11.7321 108.205 11.7321C111.458 11.7321 114.065 14.2962 114.065 17.4653C114.065 20.6344 111.458 23.2274 108.205 23.2274C104.982 23.2274 102.374 20.6344 102.374 17.4653Z"
              fill="currentColor"
            />
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M42.3591 9.60044C46.7836 9.60044 50.3583 13.1153 50.3583 17.4656V25.2156L48.8027 24.3861C48.4255 24.185 48.19 23.7931 48.19 23.3665V22.882C46.725 24.4089 44.6446 25.3597 42.3591 25.3597C37.9346 25.3597 34.3306 21.816 34.3306 17.4656C34.3306 13.1153 37.9346 9.60044 42.3591 9.60044ZM36.4988 17.4656C36.4988 20.6348 39.136 23.2277 42.3591 23.2277C45.5822 23.2277 48.19 20.6348 48.19 17.4656C48.19 14.2965 45.5822 11.7324 42.3591 11.7324C39.136 11.7324 36.4988 14.2965 36.4988 17.4656Z"
              fill="currentColor"
            />
            <Path
              d="M66.691 9.74373H52.295L53.1251 11.2707C53.3278 11.6435 53.7188 11.8757 54.144 11.8757H62.5928L52.295 25.2149H66.691L65.8609 23.6879C65.6582 23.3151 65.2672 23.0829 64.842 23.0829H56.56L66.691 9.74373Z"
              fill="currentColor"
            />
            <Path
              d="M68.521 9.74373H82.9169L72.7859 23.0829H81.068C81.4931 23.0829 81.8842 23.3151 82.0868 23.6879L82.9169 25.2149H68.521L78.8187 11.8757H70.3699C69.9448 11.8757 69.5538 11.6435 69.3511 11.2707L68.521 9.74373Z"
              fill="currentColor"
            />
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M90.4683 9.60044C94.8928 9.60044 98.4675 13.1153 98.4675 17.4656V25.2156L96.9119 24.3861C96.5347 24.185 96.2992 23.7931 96.2992 23.3665V22.882C94.8342 24.4089 92.7538 25.3597 90.4683 25.3597C86.0438 25.3597 82.4398 21.816 82.4398 17.4656C82.4398 13.1153 86.0438 9.60044 90.4683 9.60044ZM84.6081 17.4656C84.6081 20.6348 87.2452 23.2277 90.4683 23.2277C93.6914 23.2277 96.2992 20.6348 96.2992 17.4656C96.2992 14.2965 93.6914 11.7324 90.4683 11.7324C87.2452 11.7324 84.6081 14.2965 84.6081 17.4656Z"
              fill="currentColor"
            />
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M120.141 27.351C120.141 27.7776 119.905 28.1695 119.528 28.3706L117.972 29.2001V17.4653C117.972 13.115 121.547 9.6001 125.971 9.6001C130.425 9.6001 134 13.115 134 17.4653C134 21.8157 130.425 25.3593 125.971 25.3593C123.686 25.3593 121.606 24.4086 120.141 22.8816V27.351ZM125.971 11.7321C122.748 11.7321 120.141 14.2962 120.141 17.4653C120.141 20.6344 122.748 23.2274 125.971 23.2274C129.224 23.2274 131.832 20.6344 131.832 17.4653C131.832 14.2962 129.224 11.7321 125.971 11.7321Z"
              fill="currentColor"
            />
            <Path
              d="M129.295 5.00003L130.837 0.530029L131.893 0.530029L133.435 5.00003H132.547L132.229 4.04003H130.501L130.177 5.00003H129.295ZM130.735 3.32003H131.995L131.251 1.09403H131.479L130.735 3.32003Z"
              fill="currentColor"
            />
            <Path
              d="M126.299 5.00003V1.25003L125.141 1.25003V0.530029L128.261 0.530029V1.25003H127.121V5.00003H126.299Z"
              fill="currentColor"
            />
            <Path
              d="M120.739 5.00003V0.530029L123.709 0.530029V1.25003L121.555 1.25003V2.39603L123.589 2.39603V3.11603L121.555 3.11603V4.28003H123.709V5.00003L120.739 5.00003Z"
              fill="currentColor"
            />
            <Path
              d="M115.391 5.00003V0.530029L117.275 0.530029C117.571 0.530029 117.823 0.582029 118.031 0.686029C118.243 0.78603 118.405 0.93003 118.517 1.11803C118.633 1.30203 118.691 1.52603 118.691 1.79003C118.691 1.99403 118.635 2.18603 118.523 2.36603C118.415 2.54203 118.241 2.68803 118.001 2.80403V2.42603C118.221 2.51003 118.395 2.61403 118.523 2.73803C118.651 2.86203 118.741 3.00003 118.793 3.15203C118.845 3.30403 118.871 3.46403 118.871 3.63203C118.871 4.06003 118.729 4.39603 118.445 4.64003C118.165 4.88003 117.775 5.00003 117.275 5.00003H115.391ZM116.207 4.28003H117.359C117.571 4.28003 117.739 4.22203 117.863 4.10603C117.991 3.98603 118.055 3.82803 118.055 3.63203C118.055 3.43603 117.991 3.27803 117.863 3.15803C117.739 3.03803 117.571 2.97803 117.359 2.97803L116.207 2.97803V4.28003ZM116.207 2.26403H117.317C117.485 2.26403 117.619 2.21603 117.719 2.12003C117.819 2.02003 117.869 1.89203 117.869 1.73603C117.869 1.58003 117.819 1.45603 117.719 1.36403C117.619 1.27203 117.485 1.22603 117.317 1.22603L116.207 1.22603V2.26403Z"
              fill="currentColor"
            />
            <Path
              d="M108.393 5.00003V0.530029L111.273 0.530029V0.98003L108.873 0.98003V2.53403L111.153 2.53403V2.98403L108.873 2.98403V4.55003L111.273 4.55003V5.00003L108.393 5.00003Z"
              fill="currentColor"
            />
            <Path
              d="M103.519 5.00003V0.530029L106.399 0.530029V0.98003L103.999 0.98003V2.53403L106.279 2.53403V2.98403L103.999 2.98403V4.55003L106.399 4.55003V5.00003L103.519 5.00003Z"
              fill="currentColor"
            />
            <Path
              d="M98.4756 5.00003V0.530029L100.012 0.530029C100.304 0.530029 100.56 0.588029 100.78 0.70403C101 0.81603 101.17 0.97603 101.29 1.18403C101.414 1.38803 101.476 1.62603 101.476 1.89803C101.476 2.21403 101.392 2.48403 101.224 2.70803C101.06 2.93203 100.836 3.09003 100.552 3.18203L101.596 5.00003L101.032 5.00003L99.9396 3.07403L100.264 3.26003L98.9556 3.26003V5.00003H98.4756ZM98.9556 2.81003L100.036 2.81003C100.228 2.81003 100.396 2.77403 100.54 2.70203C100.684 2.62603 100.796 2.52003 100.876 2.38403C100.956 2.24403 100.996 2.08003 100.996 1.89203C100.996 1.70403 100.956 1.54203 100.876 1.40603C100.796 1.27003 100.684 1.16603 100.54 1.09403C100.396 1.01803 100.228 0.98003 100.036 0.98003L98.9556 0.98003V2.81003Z"
              fill="currentColor"
            />
            <Path
              d="M93.7893 5.00003V0.530029L96.5493 0.530029V0.98003L94.2693 0.98003V2.53403L96.3693 2.53403V2.98403L94.2693 2.98403V5.00003H93.7893Z"
              fill="currentColor"
            />
          </AnimatedSvg>
        </>
      }
      //       <svg width="134" height="32" viewBox="0 0 134 32" fill="none" xmlns="http://www.w3.org/2000/svg">

      // </svg>
      rightElement={
        <View style={styles.rightButtonContainer}>
          <IconButton
            icon="menu"
            iconSize={26}
            size={45}
            variant="icon"
            iconStyle={iconStyles}
            onPress={openPanel}
          />
        </View>
      }
      style={[styles.header, headerStyle]}
    />
  );
};

export default memo(HomeHeader);
export const HOME_HEADER_HEIGHT = 28;

const styles = StyleSheet.create({
  rightButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  header: {
    backgroundColor: 'transparent',
    height: HOME_HEADER_HEIGHT,
  },
  premiumIndicator: {
    position: 'absolute',
    right: -20,
    top: -10,
  },
});

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

//save version without beta
//  <AnimatedSvg
//             width={136}
//             height={28}
//             viewBox="0 0 136 28"
//             animatedProps={svgProps}
//           >
//             <Path
//               fill="currentColor"
//               d="M14.343 25.2c.488 0 .97-.032 1.441-.094 1.597-.21 3.31.325 4.108 1.724A13.664 13.664 0 0114.343 28C6.698 28 .5 21.732.5 14S6.698 0 14.343 0s13.843 6.268 13.843 14a14.03 14.03 0 01-5.882 11.455l-7.87-13.78-2.14 3.749A5.506 5.506 0 017.512 18.2l6.922-12.125 8.535 14.95A11.232 11.232 0 0025.417 14c0-6.186-4.958-11.2-11.074-11.2S3.269 7.814 3.269 14c0 6.186 4.958 11.2 11.074 11.2zM102.262 24.37c.377-.2.612-.593.612-1.02v-4.469a8.073 8.073 0 005.831 2.478c4.454 0 8.029-3.544 8.029-7.894S113.159 5.6 108.705 5.6c-4.424 0-7.999 3.515-7.999 7.865V25.2l1.556-.83zm.612-10.905c0-3.169 2.608-5.733 5.831-5.733 3.253 0 5.86 2.564 5.86 5.733 0 3.17-2.607 5.762-5.86 5.762-3.223 0-5.831-2.593-5.831-5.762zM42.86 5.6c4.424 0 7.998 3.515 7.998 7.866v7.75l-1.555-.83a1.156 1.156 0 01-.613-1.02v-.484a8.072 8.072 0 01-5.83 2.477c-4.425 0-8.03-3.543-8.03-7.894 0-4.35 3.605-7.865 8.03-7.865zm-5.861 7.866c0 3.169 2.637 5.762 5.86 5.762 3.223 0 5.831-2.593 5.831-5.763 0-3.169-2.608-5.733-5.83-5.733-3.224 0-5.861 2.564-5.861 5.734zM67.191 5.744H52.795l.83 1.527a1.16 1.16 0 001.019.605h8.449L52.795 21.215h14.396l-.83-1.527a1.16 1.16 0 00-1.019-.605H57.06l10.131-13.34zm1.83 0h14.396L73.286 19.083h8.282c.425 0 .816.232 1.019.605l.83 1.527H69.02l10.298-13.34h-8.45a1.16 1.16 0 01-1.018-.604l-.83-1.527z"
//             />
//             <Path
//               fill="currentColor"
//               d="M90.968 5.6c4.425 0 8 3.515 8 7.866v7.75l-1.556-.83a1.156 1.156 0 01-.613-1.02v-.484a8.072 8.072 0 01-5.83 2.477c-4.425 0-8.03-3.543-8.03-7.894 0-4.35 3.605-7.865 8.03-7.865zm-5.86 7.866c0 3.169 2.637 5.762 5.86 5.762 3.223 0 5.831-2.593 5.831-5.763 0-3.169-2.608-5.733-5.83-5.733-3.224 0-5.86 2.564-5.86 5.734zm35.533 9.884c0 .427-.236.82-.613 1.02l-1.556.83V13.465c0-4.35 3.575-7.865 7.999-7.865 4.454 0 8.029 3.515 8.029 7.865s-3.575 7.894-8.029 7.894a8.07 8.07 0 01-5.83-2.478v4.47zm5.83-15.618c-3.223 0-5.83 2.564-5.83 5.733 0 3.17 2.607 5.762 5.83 5.762 3.253 0 5.861-2.593 5.861-5.762 0-3.169-2.608-5.733-5.861-5.733z"
//             />
