import { useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { DoneHeaderButton } from '#components/commonsButtons';
import { MediaImageRenderer } from '#components/medias';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import useBoolean from '#hooks/useBoolean';
import BottomSheetModal from '#ui/BottomSheetModal';
import BottomSheetTextInput from '#ui/BottomSheetTextInput';
import Header from '#ui/Header';
import Text from '#ui/Text';
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
  const linkUrl = useRef(cardModuleMedia.link?.url);
  const linkAction = useRef(cardModuleMedia.link?.label);
  const onChangeText = (value: string) => {
    text.current = value;
  };

  const onChangeTitle = (value: string) => {
    title.current = value;
  };

  const onChangeUrl = (value: string) => {
    linkUrl.current = value;
  };

  const onChangeAction = (value: string) => {
    linkAction.current = value;
  };

  const actionLabel = intl.formatMessage({
    defaultMessage: 'Open',
    description: 'Link action placeholder in design module text tool',
  });

  const onDismiss = () => {
    onUpdateMedia({
      ...cardModuleMedia,
      text: text.current,
      title: title.current,
      link: linkUrl.current
        ? {
            url: linkUrl.current,
            label: linkAction.current ?? actionLabel,
          }
        : undefined,
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
          style={styles.header}
          rightElement={<DoneHeaderButton onPress={onDismiss} />}
        />
        <View style={styles.container}>
          {module.moduleKind === 'mediaTextLink' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MediaImageRenderer
                source={{
                  uri:
                    cardModuleMedia.media.galleryUri ??
                    cardModuleMedia.media.smallThumbnail ??
                    cardModuleMedia.media.thumbnail ??
                    cardModuleMedia.media.uri,
                  requestedSize: 66,
                  mediaId: cardModuleMedia.media.id,
                }}
                fit="cover"
                style={styles.previewContent}
              />
              <BottomSheetTextInput
                placeholder={intl.formatMessage({
                  defaultMessage: 'Enter your url',
                  description: 'Url placeholder in design module text tool',
                })}
                defaultValue={linkUrl.current}
                onChangeText={onChangeUrl}
                style={{ flex: 1 }}
              />
            </View>
          )}
          <Text variant="button" style={{ paddingTop: 10, paddingBottom: 5 }}>
            <FormattedMessage
              defaultMessage="Title & description"
              description="CardModuleMediaTextTool - Title and description"
            />
          </Text>
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
          {module.moduleKind === 'mediaTextLink' && (
            <>
              <Text variant="button" style={styles.textAction}>
                <FormattedMessage
                  defaultMessage="Action name (if button displayed)"
                  description="CardModuleMediaTextTool - link action"
                />
              </Text>
              <BottomSheetTextInput
                placeholder={actionLabel}
                defaultValue={linkAction.current}
                onChangeText={onChangeAction}
                style={styles.titleStyle}
              />
            </>
          )}
        </View>
      </BottomSheetModal>
    </>
  );
};

const isVisible = (module: ModuleKindAndVariant) => {
  switch (module.moduleKind) {
    case 'mediaText':
      return true;
    case 'mediaTextLink':
      return true;
  }
  return false;
};

export default CardModuleMediaTextTool;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  header: { marginBottom: 15 },
  textAction: { paddingTop: 10, paddingBottom: 5 },
  titleStyle: { borderWidth: 0, height: 50 },
  textStyle: { borderWidth: 0, height: 200, marginTop: 10 },
  previewContent: {
    height: 47,
    width: 47,
    borderRadius: 8,
  },
});
