import { useIntl } from 'react-intl';
import { WebView } from 'react-native-webview';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { EmailSignatureRoute } from '#routes';

const EmailSignatureScreen = ({
  route: {
    params: { userName, compressedContactCard, mode },
  },
}: NativeScreenProps<EmailSignatureRoute>) => {
  const router = useRouter();
  const intl = useIntl();
  const uri = buildWebUrl(
    `/${userName}/emailsignature?e=${compressedContactCard}&mode=${mode}`,
  );
  const insets = useScreenInsets();
  return (
    <Container
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Header
        leftElement={
          <IconButton
            icon="arrow_left"
            onPress={router.back}
            iconSize={30}
            size={47}
            style={{ borderWidth: 0 }}
          />
        }
        middleElement={intl.formatMessage({
          defaultMessage: 'Email Signature',
          description: 'Email signature screen title',
        })}
      />
      <WebView source={{ uri }} style={{ flex: 1 }} allowsInlineMediaPlayback />
    </Container>
  );
};

export default EmailSignatureScreen;
