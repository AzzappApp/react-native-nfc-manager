import { MultiRegionRatelimit, Ratelimit } from '@upstash/ratelimit';
import { waitUntil } from '@vercel/functions';
import { createClient, kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import type { AxiomRequest } from 'next-axiom';

type NextHandler<T = any> = (
  req: AxiomRequest,
  arg?: T,
) => NextResponse | Promise<NextResponse> | Promise<Response> | Response;

const cache = new Map();

const redisClient =
  process.env.NEXT_PUBLIC_PLATFORM === 'production'
    ? [
        createClient({
          url: process.env.KV_PROD_FRA1_REST_API_URL ?? '',
          token: process.env.KV_PROD_FRA1_REST_API_TOKEN ?? '',
        }),
        createClient({
          url: process.env.KV_PROD_PDX1_REST_API_URL ?? '',
          token: process.env.KV_PROD_PDX1_REST_API_TOKEN ?? '',
        }),
        createClient({
          url: process.env.KV_PROD_IAD1_REST_API_URL ?? '',
          token: process.env.KV_PROD_IAD1_REST_API_TOKEN ?? '',
        }),
        createClient({
          url: process.env.KV_PROD_GRU1_REST_API_URL ?? '',
          token: process.env.KV_PROD_GRU1_REST_API_TOKEN ?? '',
        }),
        createClient({
          url: process.env.KV_PROD_SIN1_REST_API_URL ?? '',
          token: process.env.KV_PROD_SIN1_REST_API_TOKEN ?? '',
        }),
      ]
    : kv;

const rateLimit = Array.isArray(redisClient)
  ? new MultiRegionRatelimit({
      redis: redisClient,
      limiter: MultiRegionRatelimit.fixedWindow(100, '4 s'),
      ephemeralCache: cache,
    })
  : new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.fixedWindow(100, '4 s'),
      ephemeralCache: cache,
    });

const withRateLimiterRoute =
  (handler: NextHandler): NextHandler =>
  async (req, args) => {
    if (process.env.NODE_ENV === 'production') {
      const ip = req.ip ?? '127.0.0.1';

      const startTime = performance.now();
      const { pending, success } = await rateLimit.limit(ip);

      console.log(
        `Rate limit: ${req.nextUrl.pathname} ${ip} ${success} ${
          performance.now() - startTime
        }ms`,
      );

      waitUntil(pending);

      if (!success) {
        return NextResponse.json(
          {
            message: 'Too Many Requests',
          },
          {
            status: 429,
          },
        );
      }
    }
    return handler(req, args);
  };

export const withPluginsRoute = (handler: NextHandler): NextHandler =>
  withAxiom(withRateLimiterRoute(handler));
