import { graphql, useFragment } from 'react-relay';
import CoverLinkRenderer from './CoverLinkRenderer';
import type { CoverLinkRendererProps } from './coverLinkTypes';
import type { CoverLink_profile$key } from '@azzapp/relay/artifacts/CoverLink_profile.graphql';

export type CoverLinkProps = Omit<
  CoverLinkRendererProps,
  'profile' | 'userName'
> & {
  profile: CoverLink_profile$key;
};

const CoverLink = ({ profile: profileKey, ...props }: CoverLinkProps) => {
  const profile = useFragment(
    graphql`
      fragment CoverLink_profile on Profile {
        userName
        ...CoverRenderer_profile
      }
    `,
    profileKey,
  );

  return (
    <CoverLinkRenderer
      {...props}
      userName={profile.userName}
      profile={profile}
    />
  );
};

export default CoverLink;
