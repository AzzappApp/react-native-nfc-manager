import * as FileSystem from 'expo-file-system';
import { useCallback, useImperativeHandle, useState, forwardRef } from 'react';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import useScreenDimensions from '#hooks/useScreenDimensions';
import ContactDetailsBody from '#screens/ContactDetailsScreen/ContactDetailsBody';
import BottomSheetModal from '#ui/BottomSheetModal';
import type { ContactDetailsModal_webCard$key } from '#relayArtifacts/ContactDetailsModal_webCard.graphql';
import type { Contact } from 'expo-contacts';
import type { ForwardedRef } from 'react';

export type ContactDetailsModalActions = {
  open: (details: ContactDetails) => void;
};

type Props = {
  onInviteContact: (details: ContactDetails) => void;
};

const ContactDetailsModal = (
  { onInviteContact }: Props,
  ref: ForwardedRef<ContactDetailsModalActions>,
) => {
  const [details, setDetails] = useState<ContactDetails | null>(null);
  const { height } = useScreenDimensions();

  const onClose = useCallback(() => {
    setDetails(null);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      open: setDetails,
    }),
    [],
  );

  const webCard = useFragment(
    graphql`
      fragment ContactDetailsModal_webCard on WebCard
      @argumentDefinitions(
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
        cappedPixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
        screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
      ) {
        id
        ...CoverRenderer_webCard
        coverMedia {
          id
          __typename
          ... on MediaVideo {
            uri(width: $screenWidth, pixelRatio: $pixelRatio)
            thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
            smallThumbnail: thumbnail(width: 125, pixelRatio: $cappedPixelRatio)
          }
        }
      }
    `,
    details?.webCard,
  );

  const onSave = useCallback(async () => {
    if (details) {
      let image = details?.image;

      if (!image && webCard?.coverMedia?.smallThumbnail) {
        const localThumbnail = webCard?.coverMedia?.smallThumbnail
          ? await FileSystem.downloadAsync(
              webCard?.coverMedia?.smallThumbnail,
              FileSystem.cacheDirectory + webCard.id,
            )
          : null;

        if (localThumbnail) {
          image = {
            uri: localThumbnail?.uri,
            width: 125,
            height: 125 / COVER_RATIO,
          };
        }
      }

      onInviteContact({
        ...details,
        image,
      });
    }
  }, [
    details,
    onInviteContact,
    webCard?.coverMedia?.smallThumbnail,
    webCard?.id,
  ]);

  return (
    <BottomSheetModal height={height} visible={!!details} onDismiss={onClose}>
      {details && (
        <ContactDetailsBody
          details={{
            ...details,
            webCard,
          }}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </BottomSheetModal>
  );
};

export type ContactDetails = Contact & {
  createdAt: Date;
  profileId?: string;
  webCard?: ContactDetailsModal_webCard$key | null;
};

export default forwardRef(ContactDetailsModal);
