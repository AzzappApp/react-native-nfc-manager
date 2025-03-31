import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const GET = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');

  console.error('OAuth Google Error', {
    error,
    errorDescription,
    state,
    timestamp: new Date().toISOString(),
  });

  return new NextResponse(
    `
    <html>
      <head><title>Erreur OAuth</title></head>
      <body>
        <h1>Échec de la connexion avec Google</h1>
        <p><strong>Erreur :</strong> ${error}</p>
        <p><strong>Description :</strong> ${errorDescription}</p>
      </body>
    </html>
  `,
    {
      status: 400,
      headers: {
        'Content-Type': 'text/html',
      },
    },
  );
};
