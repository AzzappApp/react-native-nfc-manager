import { FormattedMessage } from 'react-intl';
import Container from '#ui/Container';
import Text from '#ui/Text';

const UpdateApplicationScreen = () => (
  <Container
    style={{
      flex: 1,
      gap: 20,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text variant="large">
      <FormattedMessage
        defaultMessage="It's time to update your application"
        description="Update application screen title"
      />
    </Text>
    <Text>
      <FormattedMessage
        defaultMessage="Your application version is not supported anymore. Please update your application to continue using it"
        description="Update application screen description"
      />
      {/* TODO add update version */}
    </Text>
  </Container>
);

export default UpdateApplicationScreen;
