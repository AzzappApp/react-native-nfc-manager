import fs from 'fs';
import { printSchema } from 'graphql';
import schema from '../src/schema';

fs.writeFileSync('./schema.graphql', printSchema(schema));
