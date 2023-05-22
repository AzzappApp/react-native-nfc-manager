import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  SIMPLE_TEXT_DEFAULT_VALUES,
  SIMPLE_TEXT_MAX_LENGTH,
} from '@azzapp/shared/cardModuleHelpers';
import { GraphQLError } from '@azzapp/shared/createRelayEnvironment';
import { useRouter } from '#PlatformEnvironment';
import useDataEditor from '#hooks/useDataEditor';
import useEditorLayout from '#hooks/useEditorLayout';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import TabView from '#ui/TabView';
import TextAreaModal from '#ui/TextAreaModal';
import SimpleTextEditionBackgroundPanel from './SimpleTextEditionBackgroundPanel';
import SimpleTextEditionBottomMenu from './SimpleTextEditionBottomMenu';
import SimpleTextMarginEditionPanel from './SimpleTextMarginsEditionPanel';
import SimpleTextPreview from './SimpleTextPreview';
import SimpleTextStyleEditionPanel from './SimpleTextStyleEditionPanel';
import type { SimpleTextEditionScreen_module$key } from '@azzapp/relay/artifacts/SimpleTextEditionScreen_module.graphql';
import type { SimpleTextEditionScreen_viewer$key } from '@azzapp/relay/artifacts/SimpleTextEditionScreen_viewer.graphql';
import type { SimpleTextEditionScreenUpdateModuleMutation } from '@azzapp/relay/artifacts/SimpleTextEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';

export type SimpleTextEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  viewer: SimpleTextEditionScreen_viewer$key;
  /**
   * the current module to edit, if null, a new module will be created
   */
  module: SimpleTextEditionScreen_module$key | null;
};

/**
 * A component that allows to create or update the SimpleText Webcard module.
 */
const SimpleTextEditionScreen = ({
  module,
  viewer: viewerKey,
}: SimpleTextEditionScreenProps) => {
  // #region Data retrieval
  const simpleText = useFragment(
    graphql`
      fragment SimpleTextEditionScreen_module on CardModuleSimpleText {
        id
        text
        textAlign
        color
        fontSize
        fontFamily
        verticalSpacing
        marginHorizontal
        marginVertical
        background {
          id
          uri
        }
        backgroundStyle {
          backgroundColor
          patternColor
          opacity
        }
      }
    `,
    module,
  );

  const viewer = useFragment(
    graphql`
      fragment SimpleTextEditionScreen_viewer on Viewer {
        ...SimpleTextEditionBackgroundPanel_viewer
        profile {
          ...ProfileColorPicker_profile
        }
        moduleBackgrounds {
          id
          uri
        }
      }
    `,
    viewerKey,
  );
  // #endregion

  // #region Data edition
  const { data, updates, updateFields, fieldUpdateHandler, dirty } =
    useDataEditor({
      initialValue: simpleText,
      defaultValue: SIMPLE_TEXT_DEFAULT_VALUES,
    });

  const {
    text,
    textAlign,
    color,
    fontSize,
    fontFamily,
    verticalSpacing,
    marginHorizontal,
    marginVertical,
    background,
    backgroundStyle,
  } = data;
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<SimpleTextEditionScreenUpdateModuleMutation>(graphql`
      mutation SimpleTextEditionScreenUpdateModuleMutation(
        $input: SaveSimpleTextModuleInput!
      ) {
        saveSimpleTextModule(input: $input) {
          card {
            id
            modules {
              ...SimpleTextEditionScreen_module
            }
          }
        }
      }
    `);

  const isValid = !!text;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();
  const onSave = useCallback(() => {
    if (!canSave) {
      return;
    }
    const { background, ...rest } = updates;
    commit({
      variables: {
        input: {
          moduleId: simpleText?.id,
          backgroundId: background == null ? null : background.id,
          ...rest,
        },
      },
      onCompleted() {
        router.back();
      },
      onError(e) {
        // eslint-disable-next-line no-alert
        // TODO better error handling
        console.log(e);
        if (e instanceof GraphQLError) {
          console.log(e.cause);
        }
      },
    });
  }, [canSave, commit, simpleText?.id, updates, router]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  // #endregion

  // #region Fields edition handlers

  const onTextChange = fieldUpdateHandler('text');

  const onColorChange = fieldUpdateHandler('color');

  const onFontSizeChange = fieldUpdateHandler('fontSize');

  const onFontFamilyChange = fieldUpdateHandler('fontFamily');

  const onTextAlignChange = fieldUpdateHandler('textAlign');

  const onVerticalSpacingChange = fieldUpdateHandler('verticalSpacing');

  const onMarginHorizontalChange = fieldUpdateHandler('marginHorizontal');

  const onMarginVerticalChange = fieldUpdateHandler('marginVertical');

  const onBackgroundChange = useCallback(
    (backgroundId: string | null) => {
      updateFields({
        background:
          backgroundId == null
            ? null
            : viewer.moduleBackgrounds.find(({ id }) => id === backgroundId),
      });
    },
    [updateFields, viewer.moduleBackgrounds],
  );

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');
  // #endregion

  // #region tabs

  const [showContentModal, setShowContentModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('style');

  const onPreviewPress = useCallback(() => {
    setShowContentModal(true);
  }, []);

  const onCloseContentModal = useCallback(() => {
    setShowContentModal(false);
  }, []);

  const onCurrentTabChange = useCallback(
    (currentTab: string) => {
      if (currentTab === 'edit') {
        setShowContentModal(true);
      } else {
        setCurrentTab(currentTab);
      }
    },
    [setCurrentTab],
  );
  // #endregion

  const {
    bottomPanelHeight,
    topPanelHeight,
    insetBottom,
    insetTop,
    windowWidth,
  } = useEditorLayout();
  const intl = useIntl();

  return (
    <Container style={[styles.root, { paddingTop: insetTop }]}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Simple text',
          description: 'Simple text screen title',
        })}
        leftElement={
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button label in cover edition screen',
            })}
          />
        }
        rightElement={
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in cover edition screen',
            })}
          />
        }
      />
      <SimpleTextPreview
        style={{ height: topPanelHeight - 20, marginVertical: 10 }}
        data={data as any}
        onPreviewPress={onPreviewPress}
      />
      <TabView
        style={{ height: bottomPanelHeight }}
        currentTab={currentTab}
        tabs={[
          {
            id: 'style',
            element: (
              <SimpleTextStyleEditionPanel
                profile={viewer.profile!}
                color={color ?? '#000'}
                fontFamily={fontFamily ?? 'Arial'}
                fontSize={fontSize ?? 12}
                textAlignment={textAlign ?? 'left'}
                verticalSpacing={verticalSpacing ?? 0}
                onColorChange={onColorChange}
                onFontFamilyChange={onFontFamilyChange}
                onFontSizeChange={onFontSizeChange}
                onTextAlignmentChange={onTextAlignChange}
                onVerticalSpacingChange={onVerticalSpacingChange}
                bottomSheetHeight={bottomPanelHeight}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
          {
            id: 'margins',
            element: (
              <SimpleTextMarginEditionPanel
                marginHorizontal={marginHorizontal ?? 0}
                marginVertical={marginVertical ?? 0}
                onMarginHorizontalChange={onMarginHorizontalChange}
                onMarginVerticalChange={onMarginVerticalChange}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
          {
            id: 'background',
            element: (
              <SimpleTextEditionBackgroundPanel
                viewer={viewer}
                backgroundId={background?.id}
                backgroundStyle={backgroundStyle}
                onBackgroundChange={onBackgroundChange}
                onBackgroundStyleChange={onBackgroundStyleChange}
                bottomSheetHeight={bottomPanelHeight}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
        ]}
      />
      <TextAreaModal
        visible={showContentModal}
        value={text ?? ''}
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter text',
          description:
            'Placeholder for text area in simple text edition screen',
        })}
        maxLength={SIMPLE_TEXT_MAX_LENGTH}
        onClose={onCloseContentModal}
        onChangeText={onTextChange}
      />
      <SimpleTextEditionBottomMenu
        currentTab={currentTab}
        onItemPress={onCurrentTabChange}
        style={[
          styles.tabsBar,
          { bottom: insetBottom, width: windowWidth - 20 },
        ]}
      />
    </Container>
  );
};

export default SimpleTextEditionScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabsBar: {
    position: 'absolute',
    left: 10,
    right: 10,
  },
});
