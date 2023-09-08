import { FormattedMessage } from 'react-intl';
import { graphql, useFragment } from 'react-relay';
import AuthorCartouche from '#components/AuthorCartouche';
import { useRouter } from '#components/NativeRouter';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type { ContactCardHeader_profile$key } from '@azzapp/relay/artifacts/ContactCardHeader_profile.graphql';

type ContactCardHeaderProps = {
  profileKey: ContactCardHeader_profile$key;
};

const ContactCardHeader = ({ profileKey }: ContactCardHeaderProps) => {
  const profile = useFragment(
    graphql`
      fragment ContactCardHeader_profile on Profile {
        ...AuthorCartoucheFragment_profile
        ...PostRendererBottomPanelFragment_author
      }
    `,
    profileKey,
  );

  const router = useRouter();

  return (
    <Header
      leftElement={
        <IconButton
          icon="arrow_left"
          onPress={router.back}
          iconSize={28}
          variant="icon"
        />
      }
      middleElement={
        <Text variant="large">
          <FormattedMessage
            defaultMessage="Contact Card"
            description="Contact Card screen header title"
          />
        </Text>
      }
      rightElement={
        <AuthorCartouche
          author={profile}
          activeLink={true}
          hideUserName={true}
        />
      }
      style={{ marginBottom: 20 }}
    />
  );
};

export default ContactCardHeader;
