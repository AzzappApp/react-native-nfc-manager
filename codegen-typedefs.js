const graphqlUtils = require('@graphql-tools/utils');
const graphql = require('graphql');

// https://github.com/dotansimha/graphql-code-generator/issues/3899
const print = schema => {
  const escapedSchema = schema.replace(/\\`/g, '\\\\`').replace(/`/g, '\\`');

  return (
    '\n import gql from "graphql-tag"; \n' +
    'export const typeDefs = gql`' +
    escapedSchema +
    '`;'
  );
};

module.exports = {
  plugin(schema) {
    return print(
      graphql.stripIgnoredCharacters(
        graphqlUtils.printSchemaWithDirectives(schema),
      ),
    );
  },
};
