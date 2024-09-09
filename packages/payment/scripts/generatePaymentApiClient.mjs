import fs from 'fs';
import openapiTS, { astToString } from 'openapi-typescript';

console.log('Generating payment API client...');
console.log('API URL:', process.env.PAYMENT_API_URL);

fs.mkdirSync('./src/__generated__', { recursive: true });

openapiTS(`${process.env.PAYMENT_API_URL}/api/docs.jsonopenapi`)
  .then(output => {
    fs.writeFileSync('./src/__generated__/paymentApi.ts', astToString(output));
  })
  .catch(console.error);
