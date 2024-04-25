import salesTax from '@mlecoq/sales-tax';

salesTax.setTaxOriginCountry('FR');

export const getTaxRate = async (countryCode?: string, vatNumber?: string) => {
  const taxes = await salesTax.getSalesTax(
    countryCode ?? 'FR',
    null,
    vatNumber,
  );

  return taxes.rate;
};
