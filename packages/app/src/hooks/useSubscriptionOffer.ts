import { useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';

export function useUserSubscriptionOffer(period: 'month' | 'year') {
  const [month, setMonth] = useState<PurchasesPackage[]>([]);
  const [year, setYear] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
    const fetchRevenueCatData = async () => {
      try {
        const month: PurchasesPackage[] = [];
        const year: PurchasesPackage[] = [];
        const offerings = await Purchases.getOfferings();

        offerings.current?.availablePackages.forEach(
          (offering: PurchasesPackage) => {
            if (offering.product.subscriptionPeriod === 'P1M') {
              month.push(offering);
            } else if (offering.product.subscriptionPeriod === 'P1Y') {
              year.push(offering);
            }
          },
        );
        setMonth(month.sort(compareSeats));
        setYear(year.sort(compareSeats));
      } catch (error) {
        //@ts-expect-error typescript
        if (error?.code === '23') {
          console.error('AppleStore or android product config error', error);
        } else {
          console.error(JSON.stringify(error));
        }
      }
    };

    fetchRevenueCatData();
  }, []); // Empty dependency array means this effect runs once on mount

  return period === 'month' ? month : year;
}

function compareSeats(a: PurchasesPackage, b: PurchasesPackage) {
  const numA = parseInt(a.identifier.split('_').pop() ?? '0', 10);
  const numB = parseInt(b.identifier.split('_').pop() ?? '0', 10);
  return numA - numB;
}
