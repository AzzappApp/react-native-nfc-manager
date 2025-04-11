import { NextResponse } from 'next/server';
import { withPluginsRoute } from '#helpers/queries';

export const HEAD = withPluginsRoute(async () => {
  return NextResponse.json({ message: 'ok' }, { status: 200 });
});

export const runtime = 'edge';
