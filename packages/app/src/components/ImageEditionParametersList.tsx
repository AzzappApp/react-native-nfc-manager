import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { colors } from '#theme';
import FloatingButton from '#ui/FloatingButton';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import { useEditionParametersDisplayInfos } from './medias';
import type { ImageEditionParameters } from '#helpers/mediaHelpers';
import type { ScrollViewProps } from 'react-native';

type ImageEditionParametersListProps = ScrollViewProps & {
  /**
   * A callback called when the user selects a parameter.
   * @param param Theselected parameter .
   */
  onSelectParam(param: keyof ImageEditionParameters): void;
  /**
   * A list of parameters to exclude from the list.
   */
  excludedParams?: Array<keyof ImageEditionParameters>;
};

/**
 * A list of buttons to select a parameter to edit.
 */
const ImageEditionParametersList = ({
  onSelectParam,
  excludedParams,
  ...props
}: ImageEditionParametersListProps) => {
  const paramsInfos = useEditionParametersDisplayInfos();
  return (
    <ScrollView {...props} horizontal>
      {parametersList
        .filter(param => !excludedParams?.includes(param))
        .map(param => {
          const { label, icon } = paramsInfos[param]!;
          return (
            <View key={param} style={styles.paramsButtonContainer}>
              <FloatingButton
                onPress={() => onSelectParam(param)}
                accessibilityRole="button"
              >
                <View style={styles.paramIconContainer}>
                  <Icon icon={icon} style={styles.paramIcon} />
                </View>
              </FloatingButton>
              <Text variant="small" style={styles.text}>
                {label}
              </Text>
            </View>
          );
        })}
    </ScrollView>
  );
};

export default ImageEditionParametersList;

const styles = StyleSheet.create({
  text: { marginTop: 5 },
  paramsButtonContainer: {
    width: 80,
    alignItems: 'center',
  },
  paramsButton: {
    alignItems: 'center',
  },
  paramIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paramIcon: {
    width: 26,
    height: 26,
  },
});

const parametersList: Array<keyof ImageEditionParameters> = [
  'cropData',
  'brightness',
  'contrast',
  'highlights',
  'saturation',
  'shadow',
  'sharpness',
  'structure',
  'temperature',
  'tint',
  'vibrance',
  'vigneting',
];
