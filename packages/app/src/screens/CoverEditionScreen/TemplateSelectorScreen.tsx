import uniq from 'lodash/uniq';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Text, View, StyleSheet, FlatList } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { useRouter } from '#PlatformEnvironment';
import { colors, fontFamilies } from '#theme';
import useViewportSize, { insetBottom, insetTop } from '#hooks/useViewportSize';
import Button from '#ui/Button';
import PressableNative from '#ui/PressableNative';
import TemplateSelectorItem, {
  TEMPLATE_SELECTOR_ITEM_WIDTH,
} from './CoverTemplateRenderer';
import type { TemplateSelectorScreen_viewer$key } from '@azzapp/relay/artifacts/TemplateSelectorScreen_viewer.graphql';
import type { TemplateSelectorScreenProfileMutation } from '@azzapp/relay/artifacts/TemplateSelectorScreenProfileMutation.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

import type { ListRenderItemInfo } from 'react-native';

export type TemplateSelectorScreenProps = {
  /**
   * The relay viewer reference
   */
  viewer: TemplateSelectorScreen_viewer$key;
};

/**
 * Allows the user to select a template for the cover
 */
const TemplateSelectorScreen = ({
  viewer: viewerKey,
}: TemplateSelectorScreenProps) => {
  const { profile, coverTemplates } = useFragment(
    graphql`
      fragment TemplateSelectorScreen_viewer on Viewer {
        profile {
          id
          colorPalette
        }
        coverTemplates {
          id
          colorPalette
          ...CoverTemplateRenderer_template
        }
      }
    `,
    viewerKey,
  );

  const router = useRouter();

  const [commit] = useMutation<TemplateSelectorScreenProfileMutation>(graphql`
    mutation TemplateSelectorScreenProfileMutation(
      $input: UpdateProfileInput!
    ) {
      updateProfile(input: $input) {
        profile {
          id
          colorPalette
        }
      }
    }
  `);

  type Template = ArrayItemType<typeof coverTemplates>;

  const onSelectTemplate = useCallback(
    (template: Template) => {
      if (template.colorPalette) {
        const newColorArray = uniq([
          ...(profile!.colorPalette ?? []),
          ...template.colorPalette,
        ]);
        commit({
          variables: {
            input: {
              colorPalette: newColorArray,
            },
          },
          optimisticResponse: {
            updateProfile: {
              profile: {
                id: profile!.id,
                colorPalette: newColorArray,
              },
            },
          },
          onError(e: any) {
            // TODO
            console.error(e);
          },
        });
      }
      // TODO do we really want to not wait for the mutation to finish ? if so we need to handle the case where the mutation fails
      router.replace({
        route: 'CARD_MODULE_EDITION',
        params: {
          module: 'cover',
          templateId: template.id,
        },
      });
    },
    [commit, profile, router],
  );

  const onSkip = useCallback(() => {
    router.back();
  }, [router]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Template>) => {
      return (
        <TemplateSelectorItem
          template={item}
          onPress={() => onSelectTemplate(item)}
          style={{
            width: TEMPLATE_SELECTOR_ITEM_WIDTH,
            height: TEMPLATE_SELECTOR_ITEM_WIDTH / COVER_RATIO,
            marginLeft: index === 0 ? 13.5 : 0,
          }}
        />
      );
    },
    [onSelectTemplate],
  );

  const onCreateCoverFromScratch = useCallback(() => {
    router.replace({
      route: 'CARD_MODULE_EDITION',
      params: { module: 'cover' },
    });
  }, [router]);

  const intl = useIntl();
  const vp = useViewportSize();

  return (
    <View
      style={[
        {
          paddingTop: vp`${insetTop} + ${90}`,
          marginBottom: vp`${insetBottom} + ${10}`,
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'white', //Avoid stange flickering when screen entering the view. This screen will be delete in next version
        },
      ]}
    >
      <Text style={[styles.inner, styles.titleText]}>
        <FormattedMessage
          defaultMessage="Choose a visual for your cover"
          description="OnBoarding Cover Component - Title"
        />
      </Text>
      <Text style={[styles.inner, styles.subtitleText]}>
        <FormattedMessage
          defaultMessage="You’ll be able to modify it later"
          description="OnBoarding Cover Component - Subtitle"
        />
      </Text>

      <FlatList
        testID="cover-template-list"
        data={coverTemplates}
        renderItem={renderItem}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
        horizontal
        ItemSeparatorComponent={ItemSeparatorComponent}
        showsHorizontalScrollIndicator={false}
        accessibilityRole="list"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Horizontal list of Cover Templates',
          description: 'TemplateSelector - AccessibilityLabel List Templates',
        })}
        accessibilityHint="Scroll horizontally to see more templates"
      />
      <Text style={[styles.subtitleText, { paddingTop: 8, paddingBottom: 13 }]}>
        <FormattedMessage
          defaultMessage="or"
          description="OnBoarding Cover Component - Or text"
        />
      </Text>
      <Button
        testID="create-from-scratch-button"
        label={intl.formatMessage({
          defaultMessage: 'Create your cover from scratch',
          description:
            'TemplateSelector - Create your cover from scratch Button',
        })}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Create your cover from scratch',
          description:
            'TemplateSelector - AccessibilityLabel Button Create your cover from scratch',
        })}
        style={[styles.inner, styles.button]}
        onPress={onCreateCoverFromScratch}
      />

      <View
        style={[
          styles.inner,
          {
            marginBottom: vp`${insetBottom} `,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <PressableNative
          onPress={onSkip}
          accessibilityRole="link"
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Cancel and go back',
            description: 'TemplateSelector - AccessibilityLabel Link Cancel',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Tap to cancel the creation fo your cover',
            description: 'TemplateSelector - AccessibilityHint Link Cancel',
          })}
        >
          <Text style={styles.cancel}>
            <FormattedMessage
              defaultMessage="Cancel"
              description="OnBoarding Cover Component - Link Cancel"
            />
          </Text>
        </PressableNative>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inner: {
    marginLeft: 20,
    marginRight: 20,
  },
  titleText: {
    ...fontFamilies.semiBold,
    fontSize: 20,
    textAlign: 'center',
    paddingTop: 0,
    color: colors.black,
    textAlignVertical: 'center',
  },
  subtitleText: {
    ...fontFamilies.fontMedium,
    fontSize: 14,
    marginLeft: 33,
    marginRight: 33,
    textAlign: 'center',
    paddingBottom: 25,
    paddingTop: 20,
    color: colors.grey400,
  },
  cancel: { color: colors.grey200, marginTop: 22 },
  button: {
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default TemplateSelectorScreen;

const ItemSeparatorComponent = () => (
  <View style={{ width: 13, backgroundColor: 'transparent' }} />
);
