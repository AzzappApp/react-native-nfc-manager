import React from 'react';
import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import type { ColorSchemeName } from 'react-native';

type EmptyContentProps = {
  message: React.ReactElement;
  description: React.ReactElement;
  colorScheme?: ColorSchemeName;
};

const EmptyContent = ({
  message,
  description,
  colorScheme,
}: EmptyContentProps) => {
  const styles = useStyleSheet(stylesheet, colorScheme);

  return (
    <View style={styles.container}>
      <Icon style={styles.icon} icon="empty" />
      <Text variant="xlarge" style={styles.message} appearance={colorScheme}>
        {message}
      </Text>
      <Text
        variant="medium"
        style={styles.description}
        appearance={colorScheme}
      >
        {description}
      </Text>
    </View>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  container: {
    alignItems: 'center',
    width: 200,
  },
  icon: {
    width: 60,
    height: 60,
    marginBottom: 20,
    tintColor: appearance === 'dark' ? colors.grey800 : colors.grey200,
  },
  message: { marginBottom: 10, textAlign: 'center' },
  description: { textAlign: 'center' },
}));

export default EmptyContent;
