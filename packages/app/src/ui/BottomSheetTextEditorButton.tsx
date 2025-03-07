import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

import IconButton from './IconButton';
import type { TextAndSelection } from './BottomSheetTextEditorTypes';
import type { Icons } from './Icon';
import type { RichTextASTTags } from '@azzapp/shared/richText/richTextTypes';

const defaultIconSize = 12;

type BottomSheetTextEditorButtonProps = {
  onPress: (arg: RichTextASTTags) => void;
  textAndSelection: TextAndSelection;
  tag: RichTextASTTags;
  icon: Icons;
  isFocused: boolean;
  iconSize?: number;
  enabledButtons?: RichTextASTTags[];
};

export const BottomSheetTextEditorButton = ({
  onPress,
  textAndSelection,
  tag,
  icon,
  isFocused,
  enabledButtons,
  iconSize = defaultIconSize,
}: BottomSheetTextEditorButtonProps) => {
  const styles = useStyleSheet(styleSheet);

  if (enabledButtons && !enabledButtons.includes(tag)) {
    return undefined;
  }
  const isDisableInner =
    !isFocused ||
    textAndSelection.selection?.start === textAndSelection.selection?.end;

  return (
    <IconButton
      icon={icon}
      iconSize={iconSize}
      variant="border"
      onPress={() => onPress(tag)}
      iconStyle={isDisableInner ? styles.buttonDisable : undefined}
      style={[
        styles.button,
        textAndSelection.selectedTag.find(t => t === tag) === undefined
          ? undefined
          : styles.buttonSelected,
      ]}
      disabled={isDisableInner}
      disabledOpacity={1}
    />
  );
};

const styleSheet = createStyleSheet(appearance => ({
  button: {
    width: 54,
    borderRadius: 33,
    borderColor: appearance === 'dark' ? colors.grey900 : colors.grey50,
    borderWidth: 1,
    height: '100%',
  },
  buttonDisable: {
    tintColor: appearance === 'dark' ? colors.grey800 : colors.grey200,
  },
  buttonSelected: {
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey50,
  },
}));

export default BottomSheetTextEditorButton;
