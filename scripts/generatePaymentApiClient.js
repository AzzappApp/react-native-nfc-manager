const fs = require('fs');
const openapiTS = require('openapi-typescript');

console.log('Generating payment API client...');
console.log('API URL:', process.env.PAYMENT_API_URL);

fs.mkdirSync('./packages/payment/src/__generated__', { recursive: true });

openapiTS(`${process.env.PAYMENT_API_URL}/api/docs.jsonopenapi`).then(
  output => {
    fs.writeFileSync(
      './packages/payment/src/__generated__/paymentApi.ts',
      output,
    );
  },
);
