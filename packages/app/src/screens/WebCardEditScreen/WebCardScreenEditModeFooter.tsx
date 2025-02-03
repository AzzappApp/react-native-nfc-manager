import LottieView from 'lottie-react-native';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { View, TouchableOpacity } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { replaceColors } from '@azzapp/shared/lottieHelpers';
import { colors, shadow } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Text from '#ui/Text';
import placeholder from '../../assets/module/placeholder_sections.json';
import type { WebCardScreenEditModeFooter_webCard$key } from '#relayArtifacts/WebCardScreenEditModeFooter_webCard.graphql';

type WebCardScreenEditModeFooter = {
  fromCreation: boolean;
  onSkip?: () => void;
  webCard: WebCardScreenEditModeFooter_webCard$key;
};

const WebCardScreenEditModeFooter = ({
  fromCreation,
  onSkip,
  webCard: webCardKey,
}: WebCardScreenEditModeFooter) => {
  const intl = useIntl();

  const styles = useStyleSheet(stylesheet);

  const router = useRouter();

  const onAddContent = () => {
    router.push({
      route: 'ADD_MODULE_SECTION',
      params: { webCardId: webCardKey as unknown as string },
    });
  };

  const webCard = useFragment(
    graphql`
      fragment WebCardScreenEditModeFooter_webCard on WebCard {
        coverBackgroundColor
        cardColors {
          primary
          dark
          light
        }
        cardModules {
          id
        }
      }
    `,
    webCardKey,
  );

  const source = useMemo(() => {
    if (webCard.coverBackgroundColor === 'dark') {
      return replaceColors(
        [
          {
            sourceColor: PLACEHOLDER_BACKGROUND_COLOR,
            targetColor: webCard.cardColors!.dark,
          },
          {
            sourceColor: PLACEHOLDER_ELEMENT_COLOR,
            targetColor: webCard.cardColors!.light,
          },
        ],
        placeholder,
      );
    }

    if (webCard.coverBackgroundColor === 'light') {
      return replaceColors(
        [
          {
            sourceColor: PLACEHOLDER_BACKGROUND_COLOR,
            targetColor: webCard.cardColors!.light,
          },
          {
            sourceColor: PLACEHOLDER_ELEMENT_COLOR,
            targetColor: webCard.cardColors!.primary,
          },
        ],
        placeholder,
      );
    }

    return replaceColors(
      [
        {
          sourceColor: PLACEHOLDER_BACKGROUND_COLOR,
          targetColor: webCard.cardColors!.primary,
        },
        {
          sourceColor: PLACEHOLDER_ELEMENT_COLOR,
          targetColor: webCard.cardColors!.dark,
        },
      ],
      placeholder,
    );
  }, [webCard.cardColors, webCard.coverBackgroundColor]);

  const { bottom } = useScreenInsets();
  return (
    <View
      style={[styles.root, styles.creation, { paddingBottom: bottom + 30 }]}
    >
      {webCard.cardModules.length === 0 && (
        <View style={styles.lottieContainer}>
          <View style={styles.lottie}>
            <LottieView
              source={source}
              autoPlay
              loop
              hardwareAccelerationAndroid
              resizeMode="cover"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}
      {webCard.cardModules.length === 0 && (
        <Button
          variant="little_round"
          label={intl.formatMessage({
            defaultMessage: 'Add content to your WebCard',
            description: 'ProfileScreenBody button to load a new template',
          })}
          onPress={onAddContent}
        />
      )}
      {fromCreation && webCard.cardModules.length === 0 && (
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skip}>
            {intl.formatMessage({
              defaultMessage: 'Skip',
              description:
                'label of the button allowing to skip loading card template',
            })}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const WEBCARD_SCREEN_EDIT_MODE_FOOTER_HEIGHT = 110;

const stylesheet = createStyleSheet(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  creation: {
    marginTop: 20,
    height: '100%',
    flex: 1,
  },
  loadDescription: {
    textAlign: 'center',
    color: colors.grey700,
    marginHorizontal: 40,
  },
  azzapp: {
    color: colors.grey700,
  },
  skipButton: {
    marginTop: 50,
    height: 20,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  skip: {
    color: colors.grey200,
  },
  lottie: {
    width: '60%',
    aspectRatio: 2.5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  lottieContainer: {
    ...shadow(theme, 'bottom'),
    marginBottom: 20,
    borderRadius: 15,
  },
  load: {
    marginTop: 20,
  },
}));

const PLACEHOLDER_BACKGROUND_COLOR = '#010101';
const PLACEHOLDER_ELEMENT_COLOR = '#FEFEFE';

export default WebCardScreenEditModeFooter;
