import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { isNotFalsyString, isValidUrl } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { MediaImageRenderer } from '#components/medias';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import { hasCardModuleMediaError } from '#helpers/cardModuleHelpers';
import useBoolean from '#hooks/useBoolean';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import BottomSheetTextInput from '#ui/BottomSheetTextInput';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import Text from '#ui/Text';
import {
  DEFAULT_CARD_MODULE_TEXT,
  DEFAULT_CARD_MODULE_TITLE,
} from '../CardModuleBottomBar';
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
  const [text, setText] = useState(cardModuleMedia.text);
  const [title, setTitle] = useState(cardModuleMedia.title);
  const [linkUrl, setLinkUrl] = useState(cardModuleMedia.link?.url);
  const [linkAction, setLinkAction] = useState(cardModuleMedia.link?.label);
  const [hasLinkError, setHasLinkError] = useState(false);

  //this pattern is required here, because we can chose another MediaText/MediaTextLink to edit without dismounting completly the modal
  // lazy on bottom sheet does not work either. This will not cause to much rerender because the component is save only on dismissing the modal, not realtime
  useEffect(() => {
    setText(cardModuleMedia.text);
    setTitle(cardModuleMedia.title);
    setLinkUrl(cardModuleMedia.link?.url);
    setLinkAction(cardModuleMedia.link?.label);
  }, [cardModuleMedia]);

  useEffect(() => {
    if (show && isNotFalsyString(linkUrl)) {
      setHasLinkError(!isValidUrl(linkUrl));
    }
    //don't want to refrehs on linkUrl update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const actionLabel = intl.formatMessage({
    defaultMessage: 'Open',
    description: 'Link action placeholder in design module text tool',
  });

  // onDismiss call when the popup dismiss in order to save
  const onDismiss = () => {
    const url = convertUrlLink(linkUrl);
    setLinkUrl(url);
    onUpdateMedia({
      ...cardModuleMedia,
      text,
      title,
      link: {
        url,
        label: linkAction ?? actionLabel,
      },
    });
    //remove this error
    setHasLinkError(false);
    close();
  };

  // onDone should check the url is valid and not close the popup
  const onDone = () => {
    if (isNotFalsyString(linkUrl)) {
      const url = convertUrlLink(linkUrl);
      if (module.moduleKind === 'mediaTextLink') {
        if (!isValidUrl(url)) {
          setHasLinkError(true);
          return;
        }
      }
    }
    //closing will call ondismiss and save(don't want to create a double save )
    close();
  };

  const { bottom: bottomInset, top: topInset } = useScreenInsets();

  const hasError = useMemo(() => {
    return hasCardModuleMediaError(cardModuleMedia, module);
  }, [cardModuleMedia, module]);

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
        showError={hasError}
      />
      <BottomSheetModal
        visible={show}
        onDismiss={onDismiss}
        nestedScroll
        bottomInset={bottomInset}
        topInset={topInset}
        lazy
        enableContentPanningGesture={false}
        keyboardBehavior={
          module.moduleKind === 'mediaTextLink' ? 'fillParent' : 'interactive'
        }
      >
        <BottomSheetScrollView style={styles.container} bounces={false}>
          <Header
            middleElement={intl.formatMessage({
              defaultMessage: 'Design',
              description: 'CardModuleDesignTool - Bottom Sheet header',
            })}
            style={styles.header}
            rightElement={
              <TouchableOpacity onPress={onDone} style={styles.doneButton}>
                <Text variant="button" style={{ color: colors.white }}>
                  <FormattedMessage
                    defaultMessage="Done"
                    description="CardMOduleMediaTextTool - Done header button label"
                  />
                </Text>
              </TouchableOpacity>
            }
          />
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
              <View style={{ flex: 1 }}>
                <BottomSheetTextInput
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Enter your url',
                    description: 'Url placeholder in design module text tool',
                  })}
                  defaultValue={linkUrl}
                  onChangeText={setLinkUrl}
                  style={{ flex: 1 }}
                  autoCorrect={false}
                  autoCapitalize="none"
                  keyboardType="url"
                  isErrored={hasLinkError}
                />
                {hasLinkError ? (
                  <Text variant="error">
                    <FormattedMessage
                      defaultMessage="Please enter a valid link"
                      description="CardModuleMediaTextTool - Error message when the user enters an invalid link url"
                    />
                  </Text>
                ) : null}
              </View>
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
            defaultValue={title === DEFAULT_CARD_MODULE_TITLE ? '' : title}
            onChangeText={setTitle}
            style={styles.titleStyle}
          />
          <BottomSheetTextInput
            multiline
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter your description',
              description:
                'Text description placeholder in design module text tool',
            })}
            defaultValue={text === DEFAULT_CARD_MODULE_TEXT ? '' : text}
            onChangeText={setText}
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
                defaultValue={linkAction}
                onChangeText={setLinkAction}
                style={styles.titleStyle}
                autoCorrect={false}
              />
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
};

const convertUrlLink = (link: string | undefined) => {
  let url = link ?? '';
  if (isNotFalsyString(url) && !url.startsWith('http')) {
    url = `https://${url}`;
  }
  return url;
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
  container: { paddingHorizontal: 16 },
  header: { marginBottom: 15 },
  textAction: { paddingTop: 10, paddingBottom: 5 },
  titleStyle: { borderWidth: 0, height: 50 },
  textStyle: {
    borderWidth: 0,
    height: 200,
    marginTop: 10,
    verticalAlign: 'top',
  },
  previewContent: {
    height: 47,
    width: 47,
    borderRadius: 8,
  },
});
