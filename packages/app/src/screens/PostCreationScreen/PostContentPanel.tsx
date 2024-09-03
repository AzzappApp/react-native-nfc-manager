import { memo, useCallback, useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import AuthorCartouche from '#components/AuthorCartouche';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import TextAreaModal from '#ui/TextAreaModal';
import PostCreationScreenContext from './PostCreationScreenContext';
import type { ViewProps } from 'react-native';

type PostContentPanelProps = Omit<ViewProps, 'children'> & {
  insetBottom: number;
};

const PostContentPanel = ({
  style,
  insetBottom,
  ...props
}: PostContentPanelProps) => {
  const {
    allowLikes,
    allowComments,
    content,
    setAllowLikes,
    setAllowComments,
    setContent,
    webCard,
  } = useContext(PostCreationScreenContext);

  const [showContentModal, setShowContentModal] = useState(false);
  const onFocus = useCallback(() => {
    setShowContentModal(true);
  }, []);

  const onModalClose = useCallback(() => {
    setShowContentModal(false);
  }, []);

  const intl = useIntl();
  const textAraPlaceHolder = intl.formatMessage({
    defaultMessage: 'Describe your post',
    description: 'Post creation screen textarea placeholder',
  });

  const styles = useStyleSheet(styleSheet);

  return (
    <>
      <View
        style={[styles.container, { marginBottom: insetBottom + 10 }, style]}
        {...props}
      >
        <AuthorCartouche
          author={webCard!}
          variant="createPost"
          style={styles.authorCartouche}
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
      <TextAreaModal
        visible={showContentModal}
        value={content ?? ''}
        placeholder={textAraPlaceHolder}
        maxLength={POST_MAX_CONTENT_LENGTH}
        onClose={onModalClose}
        onChangeText={setContent}
      />
    </>
  );
};

export default memo(PostContentPanel);

export const POST_MAX_CONTENT_LENGTH = 2200;

const styleSheet = createStyleSheet(appearance => ({
  authorCartouche: {
    paddingLeft: 0,
  },
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
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
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
}));
