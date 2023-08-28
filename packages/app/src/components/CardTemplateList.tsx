import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useLazyLoadQuery, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { colors } from '#theme';
import Button, { BUTTON_HEIGHT } from '#ui/Button';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import WebCardList from './WebCardList';
import type { ModuleRenderInfo } from './cardModules/CardModuleRenderer';
import type { WebCardInfo } from './WebCardList';
import type { CardTemplateList_cardTemplates$key } from '@azzapp/relay/artifacts/CardTemplateList_cardTemplates.graphql';
import type { CardTemplateListQuery } from '@azzapp/relay/artifacts/CardTemplateListQuery.graphql';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CardTemplateListProps = Omit<ViewProps, 'children'> & {
  height: number;
  onApplyTemplate: (cardTemplateId: string) => void;
  onSkip?: () => void;
  loading: boolean;
};

const CardTemplateList = ({
  height,
  onApplyTemplate,
  onSkip,
  loading,
  style,
  ...props
}: CardTemplateListProps) => {
  const { viewer } = useLazyLoadQuery<CardTemplateListQuery>(
    graphql`
      query CardTemplateListQuery {
        viewer {
          ...CardTemplateList_cardTemplates
          profile {
            id
            ...CoverRenderer_profile
            ...WebCardBackground_profile
            cardColors {
              primary
              dark
              light
            }
          }
        }
      }
    `,
    {},
  );

  const { profile } = viewer;

  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment CardTemplateList_cardTemplates on Viewer
      @refetchable(queryName: "CardTemplateList_cardTemplates_Query")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 20 }
      ) {
        cardTemplates(first: $first, after: $after)
          @connection(key: "CardTemplateList_connection_cardTemplates") {
          edges {
            node {
              id
              label
              cardStyle {
                borderColor
                borderRadius
                borderWidth
                buttonColor
                fontFamily
                fontSize
                gap
                titleFontFamily
                titleFontSize
                buttonRadius
              }
              modules {
                kind
                data
              }
            }
          }
        }
      }
    `,
    viewer as CardTemplateList_cardTemplates$key,
  );

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const cards = useMemo(
    () =>
      convertToNonNullArray(
        data?.cardTemplates?.edges?.map(edge => {
          if (!edge?.node || !profile) {
            return null;
          }
          const { id, label, cardStyle, modules } = edge.node;
          return {
            id,
            label: label as string,
            cardStyle,
            profile: profile!,
            cardColors: profile?.cardColors,
            cardModules: modules as ModuleRenderInfo[],
          };
        }) ?? [],
      ),
    [data?.cardTemplates?.edges, profile],
  );

  const onSubmit = () => {
    if (!cards) return;

    onApplyTemplate(cards[selectedIndex].id);
  };

  const canSkip = !!onSkip;

  const listHeight =
    height -
    BUTTON_HEIGHT -
    GAP -
    (canSkip ? SKIP_BUTTON_HEIGHT + BUTTON_GAP : 0);
  const intl = useIntl();
  return (
    <View style={[styles.root, style]} {...props}>
      <View style={{ flex: 1 }}>
        {cards && (
          <WebCardList
            cards={cards as unknown as WebCardInfo[]}
            height={listHeight}
            initialWebCardScrollPosition="halfCover"
            onSelectedIndexChange={setSelectedIndex}
            onEndReached={onEndReached}
            style={styles.cardTemplateList}
          />
        )}
      </View>
      <View style={styles.buttons}>
        <Button
          onPress={onSubmit}
          label={intl.formatMessage({
            defaultMessage: 'Load this template',
            description:
              'label of the button allowing to retry loading card template',
          })}
          loading={loading}
        />
        {canSkip && (
          <PressableNative
            onPress={onSkip}
            style={styles.skipButton}
            disabled={loading}
          >
            <Text style={styles.skip}>
              {intl.formatMessage({
                defaultMessage: 'Skip',
                description:
                  'label of the button allowing to skil loading card template',
              })}
            </Text>
          </PressableNative>
        )}
      </View>
    </View>
  );
};

export default CardTemplateList;

const GAP = 20;
const BUTTON_GAP = 10;
const SKIP_BUTTON_HEIGHT = 18;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: GAP,
  },
  cardTemplateList: {
    flex: 1,
  },
  buttons: {
    paddingHorizontal: 25,
    gap: BUTTON_GAP,
  },
  skipButton: {
    height: SKIP_BUTTON_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skip: {
    color: colors.grey200,
  },
});
