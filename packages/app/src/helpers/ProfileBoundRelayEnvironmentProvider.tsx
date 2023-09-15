import React from 'react';
import { RelayEnvironmentProvider } from 'react-relay';
// @ts-expect-error not typed
import useRelayActorEnvironment from 'react-relay/lib/multi-actor/useRelayActorEnvironment';
import { ROOT_ACTOR_ID } from './relayEnvironment';
import type { PropsWithChildren } from 'react';
import type { Environment } from 'react-relay';

/**
 * This component is used to provide a Profile related Relay environment to its children.
 * It is used when a screen is not bound to a profile, but needs to access a profile related
 * Relay environment in some components.
 */
const ProfileBoundRelayEnvironmentProvider = ({
  children,
  profileId,
}: PropsWithChildren<{
  profileId: string | null;
}>) => {
  const environment = useRelayActorEnvironment(
    profileId ?? ROOT_ACTOR_ID,
  ) as Environment;
  return (
    <RelayEnvironmentProvider environment={environment}>
      {children}
    </RelayEnvironmentProvider>
  );
};

export default ProfileBoundRelayEnvironmentProvider;
