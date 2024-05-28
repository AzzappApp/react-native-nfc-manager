export const runtime = 'edge';

export const preferredRegion =
  process.env.NEXT_PUBLIC_PLATFORM === 'production'
    ? ['fra1', 'iad1', 'pdx1', 'gru1', 'sin1']
    : ['fra1', 'iad1'];

export const dynamic = 'force-dynamic';
