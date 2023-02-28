import React, { Suspense } from 'react';
import getRuntimeEnvironment from '@azzapp/shared/getRuntimeEnvironment';
import type { SuspenseProps } from 'react';

/**
 * Suspense component that only renders on the client,
 * on the server it will always render the fallback or null if no fallback is provided.
 *
 * @param props - React Suspense props
 * @returns
 */
const ClientOnlySuspense = (props: SuspenseProps): any =>
  getRuntimeEnvironment() === 'node' ? (
    props.fallback ?? null
  ) : (
    <Suspense {...props} />
  );

export default ClientOnlySuspense;
