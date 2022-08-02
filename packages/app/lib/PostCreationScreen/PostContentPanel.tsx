import { StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { colors } from '../../theme';
import Icon from '../ui/Icon';
import Switch from '../ui/Switch';
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
}: PostContentPanelProps) => (
  <View style={[styles.container, style]} {...props}>
    <View style={styles.settingsContainer}>
      <View style={styles.switchContainer}>
        <Icon icon="heart" style={styles.switchIcon} />
        <Switch value={allowLikes} onValueChange={onAllowLikesChange} />
      </View>
      <View style={styles.switchContainer}>
        <Icon icon="comment" style={styles.switchIcon} />
        <Switch value={allowComments} onValueChange={onAllowCommentsChange} />
      </View>
    </View>
    <TextInput
      multiline
      style={styles.textArea}
      placeholder="Describe your publication"
      value={content}
      onChangeText={onContentChange}
    />
  </View>
);

export default PostContentPanel;

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
    backgroundColor: colors.darkWhite,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
});
