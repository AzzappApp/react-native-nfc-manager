import { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, textStyles } from '#theme';
import Header from '#components/Header';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Switch from '#ui/Switch';
import type { ViewProps } from 'react-native';

type PostContentPanelProps = ViewProps & {
  allowLikes: boolean;
  allowComments: boolean;
  content: string;
  onAllowLikesChange: (value: boolean) => void;
  onAllowCommentsChange: (value: boolean) => void;
  onContentChange: (value: string) => void;
};

const PostContentPanel = ({
  allowLikes,
  allowComments,
  content,
  onAllowLikesChange,
  onAllowCommentsChange,
  onContentChange,
  style,
  ...props
}: PostContentPanelProps) => {
  const [showContentModal, setShowContentModal] = useState(false);
  const onFocus = () => {
    setShowContentModal(true);
  };
  const onModalClose = () => {
    setShowContentModal(false);
  };
  const intl = useIntl();
  const textAraPlaceHolder = intl.formatMessage({
    defaultMessage: 'Describe your publication',
    description: 'Post creation screen textarea placeholder',
  });

  const { top: safeAreaTop } = useSafeAreaInsets();

  return (
    <>
      <View style={[styles.container, style]} {...props}>
        <View style={styles.settingsContainer}>
          <View style={styles.switchContainer}>
            <Icon icon="heart" style={styles.switchIcon} />
            <Switch value={allowLikes} onValueChange={onAllowLikesChange} />
          </View>
          <View style={styles.switchContainer}>
            <Icon icon="comment" style={styles.switchIcon} />
            <Switch
              value={allowComments}
              onValueChange={onAllowCommentsChange}
            />
          </View>
        </View>
        <PressableNative
          style={styles.textArea}
          onPress={onFocus}
          activeOpacity={0.8}
        >
          {content ? (
            <Text style={textStyles.normal}>{content}</Text>
          ) : (
            <Text style={[textStyles.normal, styles.placeHolder]}>
              {textAraPlaceHolder}
            </Text>
          )}
        </PressableNative>
      </View>
      <Modal
        transparent
        animationType="fade"
        visible={showContentModal}
        onRequestClose={onModalClose}
      >
        <View style={styles.modal}>
          <Header
            style={{
              backgroundColor: 'white',
              height: 70 + safeAreaTop,
              paddingTop: safeAreaTop,
            }}
            rightButton={
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Ok',
                  description:
                    'Ok button label in post creation text edition modal',
                })}
                onPress={onModalClose}
                variant="secondary"
                style={styles.headerButtons}
              />
            }
          />
          <KeyboardAvoidingView behavior="height" style={styles.contentModal}>
            <View style={styles.textArea}>
              <TextInput
                multiline
                placeholder={textAraPlaceHolder}
                style={textStyles.normal}
                value={content}
                onChangeText={onContentChange}
                autoFocus
                maxLength={MAX_CONTENT_LENGHT}
                onBlur={onModalClose}
              />
            </View>
            <Text style={[textStyles.small, styles.counter]}>
              {content?.length ?? 0} / {MAX_CONTENT_LENGHT}
            </Text>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

export default PostContentPanel;

const MAX_CONTENT_LENGHT = 3000;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
  },
  settingsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  switchIcon: {
    width: 20,
    tintColor: colors.dark,
    marginRight: 10,
  },
  textArea: {
    borderRadius: 12,
    backgroundColor: colors.grey50,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  placeHolder: {
    color: colors.grey400,
  },
  modal: {
    flex: 1,
  },
  headerButtons: {
    width: 70,
    height: 46,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  contentModal: {
    flex: 1,
    backgroundColor: `${colors.black}AA`,
    height: 1,
    padding: 10,
  },
  counter: {
    marginTop: 5,
    marginLeft: 12,
    color: 'white',
  },
});
