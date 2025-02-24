import { FormattedMessage } from 'react-intl';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Text from '#ui/Text';

const ErrorScreen = ({ retry }: { retry: () => void }) => (
  <Container
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}
  >
    <Text variant="large">
      <FormattedMessage
        defaultMessage="Something went wrong"
        description="Top level error message for uncaught exceptions"
      />
    </Text>
    <Button
      label={
        <FormattedMessage
          defaultMessage="Retry"
          description="Retry button for uncaught exceptions"
        />
      }
      onPress={retry}
    />
  </Container>
);

export default ErrorScreen;
