import { useRef } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { DoneHeaderButton } from '#components/commonsButtons';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import useBoolean from '#hooks/useBoolean';
import BottomSheetModal from '#ui/BottomSheetModal';
import BottomSheetTextInput from '#ui/BottomSheetTextInput';
import Header from '#ui/Header';
import type { ModuleKindAndVariant } from '#helpers/webcardModuleHelpers';
import type { CardModuleMedia } from '../cardModuleEditorType';

type CardModuleMediaTextToolProps<T extends ModuleKindAndVariant> = {
  module: T;
  cardModuleMedia: CardModuleMedia;
  onUpdateMedia: (cmm: CardModuleMedia) => void;
};

const CardModuleMediaTextTool = <T extends ModuleKindAndVariant>({
  module,
  cardModuleMedia,
  onUpdateMedia,
}: CardModuleMediaTextToolProps<T>) => {
  const intl = useIntl();
  const [show, open, close] = useBoolean(false);

  //keep a local ref value, don't commit to the data until the user press done(avoid rerender/blink/side effect)
  //this is far more better that using the value props in textInput, juste use defaultValue for initial setrting
  // in this case just save on close, text is hidden by the modal
  const text = useRef(cardModuleMedia.text);
  const title = useRef(cardModuleMedia.title);
  const onChangeText = (value: string) => {
    text.current = value;
  };

  const onChangeTitle = (value: string) => {
    title.current = value;
  };

  const onDismiss = () => {
    onUpdateMedia({
      ...cardModuleMedia,
      text: text.current,
      title: title.current,
    });
    close();
  };

  if (!isVisible(module)) {
    return null;
  }

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Text',
          description: 'Card Module Design Tool - Toolbox design',
        })}
        icon="bloc_text"
        onPress={open}
      />
      <BottomSheetModal visible={show} onDismiss={onDismiss}>
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Design',
            description: 'CardModuleDesignTool - Bottom Sheet header',
          })}
          style={{ marginBottom: 15 }}
          rightElement={<DoneHeaderButton onPress={onDismiss} />}
        />
        <BottomSheetTextInput
          multiline
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter your title',
            description: 'Title placeholder in design module text tool',
          })}
          defaultValue={title.current}
          onChangeText={onChangeTitle}
          style={styles.titleStyle}
        />
        <BottomSheetTextInput
          multiline
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter your description',
            description:
              'Text description placeholder in design module text tool',
          })}
          defaultValue={text.current}
          onChangeText={onChangeText}
          style={styles.textStyle}
        />
      </BottomSheetModal>
    </>
  );
};

const isVisible = (module: ModuleKindAndVariant) => {
  switch (module.moduleKind) {
    case 'mediaText':
      return true;
  }
  return false;
};

export default CardModuleMediaTextTool;

const styles = StyleSheet.create({
  titleStyle: { borderWidth: 0, height: 50 },
  textStyle: { borderWidth: 0, height: 200, marginTop: 20 },
});
