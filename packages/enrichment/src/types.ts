import type { EnrichedContactFields, PublicProfile } from '@azzapp/data';

// Represents the overall enriched contact with base fields and optionally a public profile
export type EnrichedData = {
  contact: EnrichedContactFields;
  profile?: PublicProfile;
};

// Represents a valid field path, either from contact or profile section
export type EnrichedDataFieldPath =
  | `contact.${keyof EnrichedContactFields}`
  | `profile.${keyof PublicProfile}`;

// A custom condition function based on the full enriched contact object
// Used to define conditional API execution logic
type CustomCondition = (data: EnrichedData) => boolean;

// Logical expression tree used to determine if an API can be executed
// - FieldPath: simple presence check
// - CustomCondition: advanced custom logic
// - all: all conditions must be true
// - any: at least one condition must be true
// - not: inverse of the inner condition
export type EnrichedDataFieldExpr =
  | CustomCondition
  | EnrichedDataFieldPath
  | { all: EnrichedDataFieldExpr[] }
  | { any: EnrichedDataFieldExpr[] }
  | { not: EnrichedDataFieldExpr };

// Result returned by an API resolver
export type ApiResult = {
  data?: Partial<EnrichedData>; // Only new or enriched fields should be returned
  error?: {
    message?: string; // Optional error message
    httpStatusCode?: number; // Optional HTTP status code for tracking
  };
};

// Convenience types for keys of the two sections
type ContactField = keyof EnrichedContactFields;
type ProfileField = keyof PublicProfile;

// Generic resolver type definition
// - C: contact fields this API can provide
// - P: profile fields this API can provide
export type ApiResolver<
  C extends ContactField = ContactField,
  P extends ProfileField = ProfileField,
> = {
  name: string; // Unique name of the resolver (used in trace/debug)
  priority: number; // Priority in execution (lower means higher priority)
  provides: {
    contact?: C[]; // List of contact fields this API may return
    profile?: P[]; // List of profile fields this API may return
  };
  dependsOn: EnrichedDataFieldExpr; // Conditions that must be satisfied to execute the resolver
  run: (
    data: EnrichedData, // Current data snapshot
  ) => Promise<ApiResult & { shouldRetry?: boolean }>; // Execution with optional retry signal
};
