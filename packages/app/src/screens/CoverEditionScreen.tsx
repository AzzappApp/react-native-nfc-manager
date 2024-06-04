import { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { graphql, usePreloadedQuery } from 'react-relay';
import {
  CancelHeaderButton,
  SaveHeaderButton,
} from '#components/commonsButtons';
import CoverEditor from '#components/CoverEditor';
import coverLocalStore from '#components/CoverEditor/coversLocalStore';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CoverEditionScreenQuery } from '#relayArtifacts/CoverEditionScreenQuery.graphql';
import type { CoverEditionRoute } from '#routes';

const CoverEditionScreen = ({
  preloadedQuery,
}: RelayScreenProps<CoverEditionRoute, CoverEditionScreenQuery>) => {
  const intl = useIntl();
  const router = useRouter();

  const insets = useScreenInsets();

  const data = usePreloadedQuery(query, preloadedQuery);
  const profile = data.node?.profile ?? null;
  const coverInitialSate = useMemo(() => coverLocalStore.getSavedCover(), []);
  const coverEditorRef = useRef<CoverEditorHandle | null>(null);
  const [canSave, setCanSave] = useState(false);
  const onSave = useCallback(() => {
    coverEditorRef.current?.save().then(() => {
      router.back();
    });
  }, [router]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (!profile) {
    // TODO handle erroneous case
    return null;
  }
  if (!coverInitialSate) {
    // TODO handle case where local cover is not found we need to show the cover template list
    return null;
  }

  return (
    <Container
      style={{
        flex: 1,
        paddingTop: insets.top,
      }}
    >
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Edit your cover',
          description: 'CoverEditionScreen header title',
        })}
        leftElement={<CancelHeaderButton onPress={onCancel} />}
        rightElement={<SaveHeaderButton disabled={!canSave} onPress={onSave} />}
      />
      <CoverEditor
        ref={coverEditorRef}
        profile={profile}
        backgroundColor={profile.webCard.coverBackgroundColor}
        coverInitialSate={coverInitialSate}
        coverTemplatePreview={null}
        onCanSaveChange={setCanSave}
        style={{ flex: 1 }}
      />
    </Container>
  );
};

const query = graphql`
  query CoverEditionScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        id
        ...CoverEditor_profile
        webCard {
          id
          coverBackgroundColor
        }
      }
    }
  }
`;

export default relayScreen(CoverEditionScreen, {
  query,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
});
