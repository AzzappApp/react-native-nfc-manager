import { FormattedMessage } from 'react-intl';
import { StyleSheet } from 'react-native';
import { colors } from '#theme';
import Text from '#ui/Text';

const HomeBottomPanelCreate = () => {
  return (
    <>
      <Text variant="large" style={styles.title}>
        <FormattedMessage
          defaultMessage="Create a new WebCard{azzappA}"
          description="Home Screen - Create a new WebCard"
          values={{
            azzappA: (
              <Text variant="azzapp" style={styles.icon}>
                a
              </Text>
            ),
          }}
        />
      </Text>
      <Text variant="medium" style={styles.text}>
        <FormattedMessage
          defaultMessage="Introduce yourself in a new way by creating your own WebCard{azzappA}."
          description="Home Screen - Create a new webcard description"
          values={{
            azzappA: (
              <Text variant="azzapp" style={styles.icon}>
                a
              </Text>
            ),
          }}
        />
      </Text>
    </>
  );
};

export default HomeBottomPanelCreate;

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    color: colors.white,
    marginHorizontal: 50,
    marginTop: 10,
  },
  title: {
    color: colors.white,
  },

  icon: {
    color: colors.white,
  },
});
