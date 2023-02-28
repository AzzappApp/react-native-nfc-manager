import { Linking, Text } from 'react-native';
import { textStyles } from '#theme';
import type { TextProps } from 'react-native';

type HyperLinkProps = TextProps & {
  label: string;
  url: string;
};

const HyperLink = ({ label, url, ...rest }: HyperLinkProps) => {
  return (
    <Text
      style={{ ...textStyles.hyperLink, paddingLeft: 4, paddingRight: 4 }}
      {...rest}
      onPress={() => Linking.openURL(url)}
    >
      {label}
    </Text>
  );
};
export default HyperLink;
