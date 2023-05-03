import { memo, useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import { KeyboardAvoidingView, Modal, StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import AuthorCartouche from '#components/AuthorCartouche';
import Button from '#ui/Button';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import PostCreationScreenContext from './PostCreationScreenContext';
import type { ViewProps } from 'react-native';

type PostContentPanelProps = Omit<ViewProps, 'children'> & {
  insetBottom: number;
  insetTop: number;
};

const PostContentPanel = ({
  style,
  insetBottom,
  insetTop,
  ...props
}: PostContentPanelProps) => {
  const {
    allowLikes,
    allowComments,
    content,
    setAllowLikes,
    setAllowComments,
    setContent,
    profile,
  } = useContext(PostCreationScreenContext);

  const [showContentModal, setShowContentModal] = useState(false);
  const onFocus = () => {
    setShowContentModal(true);
  };
  const onModalClose = () => {
    setShowContentModal(false);
  };
  const intl = useIntl();
  const textAraPlaceHolder = intl.formatMessage({
    defaultMessage: 'Describe your post',
    description: 'Post creation screen textarea placeholder',
  });

  return (
    <>
      <View
        style={[styles.container, { marginBottom: insetBottom + 10 }, style]}
        {...props}
      >
        <AuthorCartouche
          author={profile!}
          variant="createPost"
          style={{ paddingLeft: 0 }}
        />
        <View style={styles.settingsContainer}>
          <View style={styles.switchContainer}>
            <Icon icon="like" style={styles.switchIcon} />
            <Switch
              variant="large"
              value={allowLikes}
              onValueChange={setAllowLikes}
            />
          </View>
          <View style={styles.switchContainer}>
            <Icon icon="comment" style={styles.switchIcon} />
            <Switch
              variant="large"
              value={allowComments}
              onValueChange={setAllowComments}
            />
          </View>
        </View>
        <PressableNative
          style={styles.textArea}
          onPress={onFocus}
          activeOpacity={0.8}
        >
          {content ? (
            <Text>{content}</Text>
          ) : (
            <Text variant="textField" style={styles.placeHolder}>
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
              marginTop: insetTop,
              marginBottom: 10,
            }}
            middleElement={intl.formatMessage({
              defaultMessage: 'Description',
              description: 'Post creation screen textarea modal title',
            })}
            rightElement={
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Ok',
                  description:
                    'Ok button label in post creation text edition modal',
                })}
                onPress={onModalClose}
              />
            }
          />
          <KeyboardAvoidingView behavior="height" style={[styles.contentModal]}>
            <TextInput
              multiline
              placeholder={textAraPlaceHolder}
              value={content}
              onChangeText={setContent}
              autoFocus
              maxLength={MAX_CONTENT_LENGHT}
              onBlur={onModalClose}
              style={{ borderWidth: 0, flex: 1 }}
            />
            <Text
              variant="smallbold"
              style={[
                styles.counter,
                content.length >= MAX_CONTENT_LENGHT && {
                  color: colors.red400,
                },
              ]}
            >
              {content?.length ?? 0} / {MAX_CONTENT_LENGHT}
            </Text>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

export default memo(PostContentPanel);

const MAX_CONTENT_LENGHT = 2200;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  settingsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  switchIcon: {
    marginRight: 12,
  },
  textArea: {
    borderRadius: 12,
    backgroundColor: colors.grey50,
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  placeHolder: {
    color: colors.grey400,
  },
  modal: {
    flex: 1,
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
