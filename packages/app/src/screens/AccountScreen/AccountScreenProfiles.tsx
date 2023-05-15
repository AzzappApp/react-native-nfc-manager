import Clipboard from '@react-native-clipboard/clipboard';
import { useMemo, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { View, Image, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { buildUserUrl } from '#helpers/urlHelpers';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type {
  AccountScreenProfiles_userProfiles$data,
  AccountScreenProfiles_userProfiles$key,
} from '@azzapp/relay/artifacts/AccountScreenProfiles_userProfiles.graphql';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';

type AccountScreenCoverProps = {
  viewer: AccountScreenProfiles_userProfiles$key;
};

const COVER_WIDTH = 135;

export default function AccountScreenProfiles({
  viewer: viewerKey,
}: AccountScreenCoverProps) {
  const carouselRef = useRef<ICarouselInstance>(null);
  const progressValue = useSharedValue<number>(0);

  const [index, setIndex] = useState(0);

  const viewer = useFragment(
    graphql`
      fragment AccountScreenProfiles_userProfiles on Viewer {
        userProfiles {
          id
          userName
          firstName
          companyActivity {
            label
          }
          nbPosts
          nbFollowedProfiles
          nbFollowersProfiles
          card {
            cover {
              ...CoverRenderer_cover
            }
          }
        }
      }
    `,
    viewerKey,
  );
  const profiles = useMemo(() => {
    const data: Array<
      | NonNullable<
          AccountScreenProfiles_userProfiles$data['userProfiles']
        >[number]
      | string
    > = [];
    data.push('first');
    data.push(...(viewer.userProfiles ?? []));
    return data;
  }, [viewer.userProfiles]);

  useAnimatedReaction(
    () => {
      return progressValue.value;
    },
    (result, previous) => {
      if (
        Math.round(result) !== Math.round(previous ?? 0) &&
        Math.round(result) > 0
      ) {
        runOnJS(setIndex)(Math.round(result) - 1);
      }
    },
    [],
  );

  const styles = useStyleSheet(computedStyles);

  const vp = useViewportSize();

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.carouselContainer}>
        <View style={{ alignSelf: 'center' }}>
          <Carousel
            ref={carouselRef}
            height={230}
            width={COVER_WIDTH}
            style={{
              width: COVER_WIDTH * 3,
              justifyContent: 'center',
              height: 235,
            }}
            mode="parallax"
            windowSize={4}
            snapEnabled
            loop={false}
            data={profiles}
            modeConfig={{
              parallaxScrollingScale: 1,
              parallaxAdjacentItemScale: 0.5,
              parallaxScrollingOffset: 25,
            }}
            onProgressChange={(_, absoluteProgress) => {
              progressValue.value = absoluteProgress;
            }}
            defaultIndex={Math.min(profiles.length, 1)}
            renderItem={({ item }) =>
              typeof item === 'string' ? (
                <View style={styles.addContainer}>
                  <Icon icon="add" style={styles.icon} />
                </View>
              ) : (
                <View
                  style={{
                    shadowColor: '#45444C',
                    shadowOpacity: 0.3,
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 6,
                  }}
                >
                  <CoverRenderer
                    width={COVER_WIDTH}
                    key={item.id}
                    userName={item.userName}
                    cover={item.card?.cover}
                  />
                </View>
              )
            }
          />
        </View>
      </View>
      <View style={styles.countersContainer}>
        <View style={styles.counterContainer}>
          <Text variant="xlarge">{viewer.userProfiles?.[index]?.nbPosts}</Text>
          <Text variant="small" style={styles.counterValue} numberOfLines={1}>
            <FormattedMessage
              defaultMessage="Posts"
              description="Number of posts"
            />
          </Text>
        </View>
        <View style={styles.counterContainer}>
          <Text variant="xlarge">
            {viewer.userProfiles?.[index]?.nbFollowersProfiles}
          </Text>
          <Text variant="small" style={styles.counterValue} numberOfLines={1}>
            <FormattedMessage
              defaultMessage="Followers"
              description="Number of followers"
            />
          </Text>
        </View>
        <View style={styles.counterContainer}>
          <Text variant="xlarge">
            {viewer.userProfiles?.[index]?.nbFollowedProfiles}
          </Text>
          <Text variant="small" style={styles.counterValue} numberOfLines={1}>
            <FormattedMessage
              defaultMessage="Followings"
              description="Number of followed profiles"
            />
          </Text>
        </View>
      </View>
      <ScrollView>
        <View
          style={[
            styles.profileDataContainer,
            { paddingBottom: vp`${insetBottom}  + ${700}` },
          ]}
        >
          <PressableNative
            accessibilityRole="button"
            onPress={() =>
              Clipboard.setString(
                buildUserUrl(viewer.userProfiles?.[index]?.userName ?? ''),
              )
            }
          >
            <View style={styles.profileUrlContainer}>
              <Text
                variant="medium"
                style={styles.profileUrl}
                numberOfLines={1}
              >
                {buildUserUrl(viewer.userProfiles?.[index]?.userName ?? '')}
              </Text>
            </View>
          </PressableNative>

          <View style={styles.webCardContainer}>
            <View style={{ flex: 1 }}>
              <Image
                source={require('#assets/logo-full_white.png')}
                resizeMode="contain"
                style={{ width: 85 }}
              />
            </View>
            <View style={styles.webCardBackground}>
              <Image source={require('#assets/webcard/logo-substract.png')} />
              <Image
                source={require('#assets/webcard/background.png')}
                style={styles.webCardBackgroundImage}
              />
            </View>
            <View style={styles.webCardContent}>
              <View>
                <Text variant="large" style={styles.webCardLabel}>
                  {viewer.userProfiles?.[index]?.firstName}
                </Text>
                <Text variant="small" style={styles.webCardLabel}>
                  {viewer.userProfiles?.[index]?.companyActivity?.label}
                </Text>
              </View>
              <QRCode
                value={buildUserUrl(
                  viewer.userProfiles?.[index]?.userName ?? '',
                )}
                size={86.85}
                color={colors.white}
                backgroundColor={colors.black}
                logoBackgroundColor={colors.black}
                logo={require('#ui/Icon/assets/azzapp.png')}
              />
            </View>
            <View style={styles.webCardFooter}>
              <Text
                variant="xsmall"
                style={[styles.webCardLabel, { opacity: 0.5 }]}
              >
                {buildUserUrl(viewer.userProfiles?.[index]?.userName ?? '')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const computedStyles = createStyleSheet(appearance => ({
  carouselContainer: {
    paddingTop: 14,
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  addContainer: {
    borderColor: colors.grey200,
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
    width: COVER_WIDTH,
    height: 216,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    tintColor: colors.grey200,
    width: 32,
    height: 32,
  },
  countersContainer: {
    flexDirection: 'row',
    columnGap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: colors.grey100,
  },
  counterContainer: { width: 12, alignItems: 'center', flex: 1 },
  counterValue: {
    color: colors.grey400,
  },
  profileDataContainer: {
    maxWidth: 355,
    padding: 20,
    alignSelf: 'center',
    alignItems: 'center',
    width: '100%',
    rowGap: 10,
  },
  profileUrlContainer: {
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    height: 52,
    width: '100%',
    paddingLeft: 10,
    paddingRight: 20,
    borderRadius: 12,
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileUrl: {
    flex: 1,
  },
  arrowIcon: {
    tintColor: appearance === 'dark' ? colors.white : colors.black,
  },
  webCardContainer: {
    backgroundColor: colors.black,
    paddingVertical: 20,
    paddingHorizontal: 26,
    borderRadius: 13,
    width: '100%',
    aspectRatio: 1.6,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 10,
    shadowOpacity: 0.9,
  },
  webCardBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
    bottom: 0,
    borderRadius: 13,
  },
  webCardBackgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  webCardContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
  },
  webCardLabel: { color: colors.white },
  webCardFooter: { flex: 1, justifyContent: 'flex-end' },
}));
