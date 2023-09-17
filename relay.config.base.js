module.exports = {
  name: 'azzapp',
  root: '.',
  sources: {
    'packages/app/src': 'azzapp',
    'packages/web/src': 'azzapp',
  },
  projects: {
    azzapp: {
      schema: 'schema.graphql',
      language: 'typescript',
      testPathRegex: '__tests__',
      requireCustomScalarTypes: true,
      output: 'packages/relay/artifacts',
      customScalarTypes: {
        JSON: 'Record<string, unknown>',
        DateTime: 'Date',
      },
      featureFlags: {
        enable_fragment_aliases: {
          kind: 'enabled',
        },
      },
    },
  },
};
