import { memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet } from 'react-native';
import { colors } from '#theme';
import Link from '#components/Link';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import type { HomeBottomPanelMessage_profiles$data } from '#relayArtifacts/HomeBottomPanelMessage_profiles.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

const HomeBottomPanelNewCover = ({
  profile,
}: {
  profile: ArrayItemType<HomeBottomPanelMessage_profiles$data>;
}) => {
  return (
    <>
      <Icon icon="warning" style={styles.warningIcon} />
      <Text variant="large" style={styles.title}>
        <FormattedMessage
          defaultMessage="This WebCard{azzappA} needs a cover"
          description="Home Screen - Missing cover title"
          values={{
            azzappA: (
              <Text style={styles.icon} variant="azzapp">
                a
              </Text>
            ),
          }}
        />
      </Text>
      <Text variant="medium" style={styles.text}>
        <FormattedMessage
          defaultMessage="This WebCard{azzappA} has no cover and can’t be published."
          description="Home Screen - Missing cover text"
          values={{
            azzappA: (
              <Text style={styles.icon} variant="azzapp">
                a
              </Text>
            ),
          }}
        />
      </Text>
      <Link
        route="NEW_WEBCARD"
        params={
          profile?.webCard.id ? { webCardId: profile?.webCard.id } : undefined
        }
      >
        <Button
          variant="secondary"
          appearance="dark"
          label={
            <FormattedMessage
              defaultMessage="Create your WebCard{azzappA} cover{azzappA}"
              description="Home Screen - Missing cover button"
              values={{
                azzappA: (
                  <Text style={styles.icon} variant="azzapp">
                    a
                  </Text>
                ),
              }}
            />
          }
          style={styles.button}
        />
      </Link>
    </>
  );
};

export default memo(HomeBottomPanelNewCover);

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
  warningIcon: {
    tintColor: colors.white,
    marginBottom: 20,
    width: 20,
    height: 20,
  },
  icon: {
    color: colors.white,
  },
  button: {
    marginTop: 30,
    minWidth: 250,
  },
});
