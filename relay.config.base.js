module.exports = {
  name: 'azzapp',
  root: '.',
  sources: {
    'packages/app/src': 'azzapp',
  },
  projects: {
    azzapp: {
      schema: 'schema.graphql',
      // TODO - remove this and properly handle undefined
      typescriptExcludeUndefinedFromNullableUnion: true,
      language: 'typescript',
      testPathRegex: '__tests__',
      requireCustomScalarTypes: true,
      output: 'packages/app/src/relayArtifacts',
      customScalarTypes: {
        JSON: 'Record<string, unknown>',
        DateTime: 'string',
      },
      featureFlags: {},
      eagerEsModules: false,
    },
  },
};
