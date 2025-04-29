import fs from 'fs';
import openapiTS, { astToString } from 'openapi-typescript';

console.log('Generating payment API client...');
console.log('API URL:', process.env.PAYMENT_API_URL);

fs.mkdirSync('./src/__generated__', { recursive: true });

const username = process.env.PAYMENT_API_DOCS_USERNAME;
const password = process.env.PAYMENT_API_DOCS_PASSWORD;

if (!username || !password) {
  throw new Error(
    'Missing PAYMENT_API_DOCS_USERNAME or PAYMENT_API_DOCS_PASSWORD in environment variables.',
  );
}

const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

fetch(`${process.env.PAYMENT_API_URL}/api/docs.jsonopenapi`, {
  headers: {
    Authorization: `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
  },
})
  .then(async res => {
    if (!res.ok) {
      throw new Error(
        `Failed to fetch OpenAPI schema: ${res.status} ${res.statusText}`,
      );
    }

    const schema = await res.json();
    const output = await openapiTS(schema);
    fs.writeFileSync('./src/__generated__/paymentApi.ts', astToString(output));
  })
  .catch(console.error);
