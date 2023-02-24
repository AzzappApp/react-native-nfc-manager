/* eslint-disable @typescript-eslint/no-var-requires */
require('fix-esm').register();

const fs = require('fs');
const { printSchema } = require('graphql');
const { default: schema } = require('@azzapp/data/lib/schema');

fs.writeFileSync('./schema.graphql', printSchema(schema));

export {};
