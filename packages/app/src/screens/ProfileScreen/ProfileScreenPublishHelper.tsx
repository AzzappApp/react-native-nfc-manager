import { noop } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Modal, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import type { ProfileScreenPublishHelper_profile$key } from '@azzapp/relay/artifacts/ProfileScreenPublishHelper_profile.graphql';
import type { ProfileScreenPublishHelperMutation } from '@azzapp/relay/artifacts/ProfileScreenPublishHelperMutation.graphql';

type ProfileScreenPublishHelperProps = {
  profile: ProfileScreenPublishHelper_profile$key;
  editMode: boolean;
};

const ProfileScreenPublishHelper = ({
  profile,
  editMode,
}: ProfileScreenPublishHelperProps) => {
  const { userName, cardIsPublished } = useFragment(
    graphql`
      fragment ProfileScreenPublishHelper_profile on Profile {
        id
        userName
        cardIsPublished
      }
    `,
    profile,
  );

  const intl = useIntl();

  const [commit, publishing] = useMutation<ProfileScreenPublishHelperMutation>(
    graphql`
      mutation ProfileScreenPublishHelperMutation {
        publishCard {
          profile {
            id
            cardIsPublished
          }
        }
      }
    `,
  );

  useEffect(() => {
    if (!cardIsPublished && editMode) {
      Toast.show({
        type: 'info',
        text1: intl.formatMessage({
          defaultMessage: 'Tap on a section of your WebCard to modify it',
          description:
            'Toast info message that appears when the user is in webcard edit mode for the first time',
        }),
        bottomOffset: 0,
        props: {
          showClose: true,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  const [showPublishModal, setShowPublishModal] = useState(false);

  const editModeRef = useRef(editMode);

  useEffect(() => {
    if (cardIsPublished && !editMode && editModeRef.current) {
      setShowPublishModal(true);
    }
    editModeRef.current = editMode;
  }, [cardIsPublished, editMode]);

  const onPublish = () => {
    commit({
      variables: {},
      onCompleted: (_, error) => {
        if (error) {
          // TODO - handle error
          console.log(error);
          return;
        }
        // TODO - add analytics
        setShowPublishModal(false);
      },
      onError: error => {
        //TODO - handle error
        console.log(error);
      },
    });
  };

  const onClose = () => {
    setShowPublishModal(false);
  };
  const url = buildUserUrl(userName);

  const styles = useStyleSheet(stylesheet);

  const insets = useScreenInsets();
  return (
    <Modal
      animationType="fade"
      visible={showPublishModal}
      onRequestClose={noop}
    >
      <Container
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Text variant="xlarge" style={styles.text}>
          <FormattedMessage
            defaultMessage="Congratulations!"
            description="Publish modal title"
          />
        </Text>
        <Text variant="medium" style={styles.text}>
          <FormattedMessage
            defaultMessage="Your personal WebCard{azzappA}, visible both in app and online, is created."
            description="Publish modal subtitle"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <Text variant="medium" style={styles.text}>
          <FormattedMessage
            defaultMessage="Your WebCard{azzappA} url is:"
            description="Publish modal url label"
            values={{
              azzappA: <Text variant="azzapp">a</Text>,
            }}
          />
        </Text>
        <View style={styles.urlContainer}>
          <Icon icon="earth" style={styles.iconLink} />
          <Text variant="button" numberOfLines={1} style={styles.url}>
            {url.replace('https://', '')}
          </Text>
        </View>
        <View style={styles.buttonGroup}>
          <Button
            onPress={onPublish}
            label={intl.formatMessage({
              defaultMessage: 'Ok, publish my WebCard!',
              description: 'Publish modal publish button label',
            })}
            loading={publishing}
          />
          <Button
            onPress={onClose}
            label={intl.formatMessage({
              defaultMessage: 'Hide my content for the moment',
              description: 'Publish modal publish later button label',
            })}
            disabled={publishing}
          />
        </View>
      </Container>
    </Modal>
  );
};

export default ProfileScreenPublishHelper;

const stylesheet = createStyleSheet(appearance => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 20,
    paddingHorizontal: 20,
  },
  text: {
    textAlign: 'center',
  },
  buttonGroup: {
    marginTop: 40,
    gap: 10,
  },
  urlContainer: {
    height: 25,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 22,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  url: {
    color: appearance === 'dark' ? colors.white : colors.black,
    marginLeft: 7,
  },
  iconLink: {
    tintColor: appearance === 'dark' ? colors.white : colors.black,
    height: 17,
    width: 17,
  },
}));
