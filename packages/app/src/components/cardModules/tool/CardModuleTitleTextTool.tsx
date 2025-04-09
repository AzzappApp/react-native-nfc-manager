import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { colors } from '#theme';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import useBoolean from '#hooks/useBoolean';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import BottomSheetTextEditor from '#ui/BottomSheetTextEditor';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import DefaultPressableOpacity from '#ui/PressableOpacity';
import RichTextButtons, {
  textButtons,
  titleButtons,
} from '#ui/RichTextButtons';
import Text from '#ui/Text';
import {
  DEFAULT_CARD_MODULE_TEXT,
  DEFAULT_CARD_MODULE_TITLE,
} from '../CardModuleBottomBar';
import useRichTextManager from './useRichTextManager';
import type { ModuleKindAndVariant } from '#helpers/webcardModuleHelpers';
import type { CardModuleData } from '../CardModuleBottomBar';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { PressableProps } from 'react-native-gesture-handler';

type CardModuleMediaTextToolProps<T extends ModuleKindAndVariant> = {
  module: T;
  cardModuleTitleText?: { title: string; text: string };
  onUpdate: (param: CardModuleData) => void;
  openTextEdition: boolean;
};

//needs to be a pressable from gesture handler (hidden here to avoid other use)
const PressableOpacity =
  Platform.OS === 'android'
    ? ({
        activeOpacity = 0.2,
        style,
        children,
        ...rest
      }: PropsWithChildren<
        PressableProps & {
          activeOpacity?: number;
          style?: StyleProp<ViewStyle>;
        }
      >) => {
        return (
          <Pressable
            style={({ pressed }) => {
              return [style, { opacity: pressed ? activeOpacity : 1 }];
            }}
            {...rest}
          >
            {children}
          </Pressable>
        );
      }
    : DefaultPressableOpacity;

const CardModuleMediaTextTool = <T extends ModuleKindAndVariant>({
  module,
  cardModuleTitleText,
  onUpdate,
  openTextEdition,
}: CardModuleMediaTextToolProps<T>) => {
  const intl = useIntl();
  const [show, open, close] = useBoolean(openTextEdition);
  useEffect(() => {
    if (openTextEdition) {
      open();
    }
  }, [open, openTextEdition]);
  //keep a local ref value, don't commit to the data until the user press done(avoid rerender/blink/side effect)
  //this is far more better that using the value props in textInput, juste use defaultValue for initial setrting
  // in this case just save on close, text is hidden by the modal
  const [text, setText] = useState(cardModuleTitleText?.text);
  const [title, setTitle] = useState(cardModuleTitleText?.title);

  const [focusedInput, setFocusedInput] = useState<'text' | 'title'>('title');

  //#endregion
  const onTextFocus = () => {
    setFocusedInput('text');
  };
  const onTitleFocus = () => {
    setFocusedInput('title');
  };
  const {
    onApplyTagPress: onTextApplyTagPress,
    onSelectionChange: onTextSelectionChange,
    onChangeText: onTextChangeText,
    textAndSelection: textTextAndSelection,
  } = useRichTextManager({
    id: `text`,
    defaultValue:
      cardModuleTitleText?.text === DEFAULT_CARD_MODULE_TEXT
        ? ''
        : cardModuleTitleText?.text,
    setText,
  });

  const {
    onApplyTagPress: onTitleApplyTagPress,
    onSelectionChange: onTitleSelectionChange,
    onChangeText: onTitleChangeText,
    textAndSelection: titleTextAndSelection,
  } = useRichTextManager({
    id: `title`,
    defaultValue:
      cardModuleTitleText?.title === DEFAULT_CARD_MODULE_TITLE
        ? ''
        : cardModuleTitleText?.title,
    setText: setTitle,
  });

  // onDismiss call when the popup dismiss in order to save
  const onDismiss = () => {
    onUpdate({
      cardModuleTitleText: {
        text: text ?? '',
        title: title ?? '',
      },
    });
    close();
  };

  const { top: topInset } = useScreenInsets();

  const onApplyTagPress =
    focusedInput === 'text' ? onTextApplyTagPress : onTitleApplyTagPress;

  const textAndSelectionInner =
    focusedInput === 'text' ? textTextAndSelection : titleTextAndSelection;

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Text',
          description: 'Card Module Title Text Design Tool - Toolbox design',
        })}
        icon="bloc_text"
        onPress={open}
      />
      <BottomSheetModal
        visible={show}
        onDismiss={onDismiss}
        topInset={topInset}
        lazy
        snapPoints={['100%']}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        enableDynamicSizing={false}
        showHandleIndicator={false}
        handleComponent={null}
        automaticTopPadding={false}
        keyboardBehavior={
          module.moduleKind === 'mediaTextLink' ? 'fillParent' : 'interactive'
        }
      >
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Text',
            description: 'CardModuleDesignTool - Bottom Sheet header mediaText',
          })}
          style={styles.header}
          rightElement={
            <PressableOpacity onPress={onDismiss} style={styles.doneButton}>
              <Text variant="button" style={styles.doneButtonText}>
                <FormattedMessage
                  defaultMessage="Done"
                  description="CardModuleTitleTextTool - Done header button label"
                />
              </Text>
            </PressableOpacity>
          }
        />
        <View style={styles.container}>
          <Text variant="button" style={{ paddingTop: 10, paddingBottom: 5 }}>
            <FormattedMessage
              defaultMessage="Title & text"
              description="CardModuleMediaTextTool - Title and text"
            />
          </Text>
          <BottomSheetTextEditor
            multiline
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter your title',
              description: 'Title placeholder in design module text tool',
            })}
            onChangeText={onTitleChangeText}
            style={styles.titleStyle}
            onSelectionChange={onTitleSelectionChange}
            onFocus={onTitleFocus}
            textAndSelection={titleTextAndSelection}
          />
          <BottomSheetTextEditor
            multiline
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter your description',
              description:
                'Text description placeholder in design module text tool',
            })}
            style={styles.textStyle}
            onChangeText={onTextChangeText}
            onSelectionChange={onTextSelectionChange}
            onFocus={onTextFocus}
            textAndSelection={textTextAndSelection}
          />
          <RichTextButtons
            onPress={onApplyTagPress}
            textAndSelection={textAndSelectionInner}
            isFocused
            enabledButtons={
              focusedInput === 'title' ? titleButtons : textButtons
            }
          />
        </View>
      </BottomSheetModal>
    </>
  );
};

export default CardModuleMediaTextTool;

const styles = StyleSheet.create({
  doneButton: {
    width: 74,
    height: HEADER_HEIGHT,
    paddingHorizontal: 0,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  container: {
    paddingHorizontal: 16,
    overflow: 'visible',
    flex: 1,
  },
  header: { zIndex: 300, height: HEADER_HEIGHT + 15 },
  titleStyle: { borderWidth: 0, height: 60 },
  textStyle: {
    borderWidth: 0,
    flex: 1,
    marginTop: 10,
    verticalAlign: 'top',
  },
  doneButtonText: { color: colors.white },
});
