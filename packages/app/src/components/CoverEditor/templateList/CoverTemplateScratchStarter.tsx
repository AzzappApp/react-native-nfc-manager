import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { TemplateTypePreview } from './CoverEditorTemplateTypePreviews';
import type { ViewProps } from 'react-native';

type CoverTemplateScratchStartersProps = ViewProps & {
  onSelectCoverTemplatePreview: (preview?: TemplateTypePreview | null) => void;
};

const CoverTemplateScratchStarters = ({
  onSelectCoverTemplatePreview,
  ...props
}: CoverTemplateScratchStartersProps) => {
  return (
    <View {...props}>
      <Text variant="smallbold" style={styles.label}>
        <FormattedMessage
          defaultMessage="Start from scratch"
          description="CoverEditorTemplateList - Start from scratch"
        />
      </Text>
      <View style={styles.scratchs}>
        <PressableNative
          style={styles.scratch}
          onPress={() => {
            onSelectCoverTemplatePreview();
          }}
        >
          <Icon icon="landscape" style={{ tintColor: '#C8C7CA' }} />
        </PressableNative>
        <PressableNative
          style={[styles.scratch, { backgroundColor: colors.black }]}
          onPress={() => {
            onSelectCoverTemplatePreview();
          }}
        >
          <Icon icon="landscape" style={{ tintColor: '#54535B' }} />
        </PressableNative>
        <PressableNative
          style={[styles.scratch, { backgroundColor: colors.grey400 }]}
          onPress={() => {
            onSelectCoverTemplatePreview();
          }}
        >
          <Icon icon="landscape" style={{ tintColor: '#87878E' }} />
        </PressableNative>
      </View>
    </View>
  );
};

export default CoverTemplateScratchStarters;

const styles = StyleSheet.create({
  label: {
    marginTop: 20,
    marginLeft: 20,
    fontSize: 16,
  },
  scratchs: {
    marginLeft: 20,
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  scratch: {
    display: 'flex',
    width: 75,
    height: 120,
    paddingVertical: 35,
    paddingHorizontal: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.grey50,
  },
});
