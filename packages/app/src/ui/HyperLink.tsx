import { Linking, StyleSheet } from 'react-native';
import Text from '#ui/Text';
import type { TextProps } from 'react-native';

type HyperLinkProps = TextProps & {
  label: string;
  url: string;
};

const HyperLink = ({ label, url, ...rest }: HyperLinkProps) => {
  return (
    <Text
      variant="hyperLink"
      style={styles.hyperlink}
      {...rest}
      onPress={() => Linking.openURL(url)}
    >
      {label}
    </Text>
  );
};
export default HyperLink;

const styles = StyleSheet.create({
  hyperlink: { paddingLeft: 4, paddingRight: 4 },
});
