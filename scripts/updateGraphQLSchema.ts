/* eslint-disable @typescript-eslint/no-var-requires */
require('fix-esm').register();

const fs = require('fs');
const { default: schema } = require('@azzapp/data/lib/schema');
const { printSchema } = require('graphql');

fs.writeFileSync('./schema.graphql', printSchema(schema));

export {};
