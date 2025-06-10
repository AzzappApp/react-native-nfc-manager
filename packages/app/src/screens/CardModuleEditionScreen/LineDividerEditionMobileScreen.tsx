import { graphql, usePreloadedQuery } from 'react-relay';
import LineDividerEditionScreen from '#screens/LineDividerEditionScreen';
import type { LineDividerEditionMobileScreenQuery } from '#relayArtifacts/LineDividerEditionMobileScreenQuery.graphql';
import type { LineDividerEditionScreen_module$key } from '#relayArtifacts/LineDividerEditionScreen_module.graphql';
import type { PreloadedQuery } from 'react-relay';

type LineDividerEditionMobileScreenProps = {
  /**
   * The id of the module to edit
   */
  moduleId?: string;
  /**
   * The preloaded query for the screen
   */
  preloadedQuery: PreloadedQuery<LineDividerEditionMobileScreenQuery>;
};

/**
 * Mobile specific screen for the line divider module edition
 * (In case of future web support)
 */
const LineDividerEditionMobileScreen = ({
  moduleId,
  preloadedQuery,
}: LineDividerEditionMobileScreenProps) => {
  const { node } = usePreloadedQuery(LineDividerQuery, preloadedQuery);
  const profile = node?.profile;
  if (!profile) {
    return null;
  }

  let module: LineDividerEditionScreen_module$key | null = null;
  if (moduleId != null) {
    module =
      profile?.webCard?.cardModules.find(module => module?.id === moduleId)
        ?.lineDividerModule ?? null;
    if (!module) {
      // TODO
    }
  }

  return (
    <LineDividerEditionScreen
      module={module}
      webCard={profile?.webCard ?? null}
    />
  );
};

const LineDividerQuery = graphql`
  query LineDividerEditionMobileScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        webCard {
          cardModules {
            id
            ...LineDividerEditionScreen_module @alias(as: "lineDividerModule")
          }
          ...LineDividerEditionScreen_webCard
        }
      }
    }
  }
`;

export default LineDividerEditionMobileScreen;
