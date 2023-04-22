import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { colors } from '#theme';
import FloatingButton from '#ui/FloatingButton';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import { useEditionParametersDisplayInfos } from './gpu';
import type { EditionParameters } from './gpu';
import type { ScrollViewProps } from 'react-native';

type EditionParametersListProps = ScrollViewProps & {
  /**
   * A callback called when the user selects a parameter.
   * @param param Theselected parameter .
   */
  onSelectParam(param: keyof EditionParameters): void;
  /**
   * A list of parameters to exclude from the list.
   */
  excludedParams?: Array<keyof EditionParameters>;
};

/**
 * A list of buttons to select a parameter to edit.
 */
const EditionParametersList = ({
  onSelectParam,
  excludedParams,
  ...props
}: EditionParametersListProps) => {
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

export default EditionParametersList;

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

const parametersList: Array<keyof EditionParameters> = [
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
  'vignetting',
];
