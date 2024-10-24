import { Platform, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import FloatingButton from '#ui/FloatingButton';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import {
  editionParametersSettings,
  useEditionParametersDisplayInfos,
} from '../helpers/mediaEditions';
import type { EditionParameters } from '../helpers/mediaEditions';
import type { ScrollViewProps } from 'react-native';

type EditionParametersListProps = Omit<ScrollViewProps, 'hitSlop'> & {
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
    <ScrollView {...props} horizontal showsHorizontalScrollIndicator={false}>
      {parametersList
        .filter(param => {
          const supported = Platform.select({
            ios: editionParametersSettings[param]?.ios ?? true,
            android: editionParametersSettings[param]?.android ?? true,
            default: false,
          });
          return supported && !excludedParams?.includes(param);
        })
        .map(param => {
          const { label, icon } = paramsInfos[param]!;
          return (
            <View key={param} style={styles.paramsButtonContainer}>
              <FloatingButton
                onPress={() => onSelectParam(param)}
                accessibilityRole="button"
              >
                <Icon icon={icon} style={styles.paramIcon} />
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
  'shadow',
  'temperature',
  'saturation',
  'vibrance',
  'sharpness',
  'vignetting',
];
