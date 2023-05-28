require('fix-esm').register();
require('@babel/register')({
  presets: ['@babel/preset-env', '@babel/preset-typescript'],
});

global.Headers = require('node-fetch').Headers;

const fs = require('fs');
const { printSchema } = require('graphql');
const { default: schema } = require('../packages/data/lib/schema');

fs.writeFileSync('./schema.graphql', printSchema(schema));
