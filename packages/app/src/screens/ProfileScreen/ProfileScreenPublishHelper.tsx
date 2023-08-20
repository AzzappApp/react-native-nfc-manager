import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import Button from '#ui/Button';
import Container from '#ui/Container';
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
  const { cardIsPublished } = useFragment(
    graphql`
      fragment ProfileScreenPublishHelper_profile on Profile {
        cardIsPublished
      }
    `,
    profile,
  );

  const intl = useIntl();

  const [commit] = useMutation<ProfileScreenPublishHelperMutation>(graphql`
    mutation ProfileScreenPublishHelperMutation {
      publishCard {
        profile {
          cardIsPublished
        }
      }
    }
  `);

  const [showPublishModal, setShowPublishModal] = useState(false);

  const editModeRef = useRef(editMode);
  useEffect(() => {
    if (!cardIsPublished) {
      if (editMode) {
        Toast.show({
          type: 'info',
          text1: intl.formatMessage({
            defaultMessage: 'Tap on a section of your WebCarda to modify it',
            description:
              'Toast info message that appears when the user is in webcard edit mode for the first time',
          }),
        });
      } else if (editModeRef.current) {
        setShowPublishModal(true);
        commit({
          variables: {},
          onCompleted: () => {
            // TODO - add analytics
          },
          onError: error => {
            console.log(error);
          },
        });
      }
      editModeRef.current = editMode;
    }
  }, [cardIsPublished, commit, editMode, intl]);

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 16);
  const bottomInset = Math.max(insets.bottom, 16);
  return (
    <Modal
      animationType="fade"
      visible={showPublishModal}
      onRequestClose={() => setShowPublishModal(false)}
    >
      <Container
        style={{
          paddingTop: topInset,
          paddingBottom: bottomInset,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: 20,
        }}
      >
        <Text variant="xlarge" style={{ textAlign: 'center' }}>
          <FormattedMessage
            defaultMessage="Your WebCard is now published"
            description="Publish modal title"
          />
        </Text>
        <Button
          onPress={() => setShowPublishModal(false)}
          label={intl.formatMessage({
            defaultMessage: 'OK',
            description: 'Publish modal button label',
          })}
        />
      </Container>
    </Modal>
  );
};

export default ProfileScreenPublishHelper;
