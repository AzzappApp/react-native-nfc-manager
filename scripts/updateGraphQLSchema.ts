import fs from 'fs';
import schema from '@azzapp/data/lib/schema';
import { printSchema } from 'graphql';

fs.writeFileSync('./schema.graphql', printSchema(schema));
