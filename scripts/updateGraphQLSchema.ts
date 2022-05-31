import fs from 'fs';
import schema from '@azzapp/data/src/schema';
import { printSchema } from 'graphql';

fs.writeFileSync('./schema.graphql', printSchema(schema));
