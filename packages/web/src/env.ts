import { z } from 'zod';

export const schema = z.object({
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().describe('Sentry DSN'),
  NEXT_PUBLIC_DOWNLOAD_IOS_APP: z
    .string()
    .url()
    .default('https://apps.apple.com/app/azzapp/id6502694267')
    .describe('URL for the iOS app download'),
  NEXT_PUBLIC_DOWNLOAD_ANDROID_APP: z
    .string()
    .url()
    .default('https://play.google.com/store/apps/details?id=com.azzapp.app')
    .describe('URL for the Android app download'),
  NEXT_PUBLIC_PLATFORM: z
    .enum(['development', 'staging', 'production'])
    .default('development')
    .describe('Platform environment'),
  NEXT_PUBLIC_APPLE_APP_ENABLED: z
    .string()
    .optional()
    .describe('Apple app clip enabled'),
  NEXT_PUBLIC_APPLE_APP_CLIP_URL: z
    .string()
    .url()
    .optional()
    .describe('Apple app clip URL'),
  NEXT_PUBLIC_API_ENDPOINT: z
    .string()
    .url()
    .default('http://localhost:3000')
    .describe('API endpoint'),
  NEXT_PUBLIC_GTM_ID: z.string().default('').describe('Google Tag Manager ID'),
  NEXT_PUBLIC_APPLE_ITUNES_APP_ID: z
    .string()
    .default('6502694267')
    .describe('Apple iTunes app meta'),
  NEXT_PUBLIC_APP_CLIP_BUNDLE_ID: z
    .string()
    .default(
      'app-clip-bundle-id=com.azzapp.app-dev.Clip, app-clip-display=card',
    )
    .describe('Apple App Clip meta'),
});

const env = schema.safeParse({
  ...process.env,
  NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
  NEXT_PUBLIC_APPLE_APP_ENABLED: process.env.NEXT_PUBLIC_APPLE_APP_ENABLED,
  NEXT_PUBLIC_APPLE_APP_CLIP_URL: process.env.NEXT_PUBLIC_APPLE_APP_CLIP_URL,
  NEXT_PUBLIC_APP_CLIP_BUNDLE_ID: process.env.NEXT_PUBLIC_APP_CLIP_BUNDLE_ID,
  NEXT_PUBLIC_APPLE_ITUNES_APP_ID: process.env.NEXT_PUBLIC_APPLE_ITUNES_APP_ID,
  NEXT_PUBLIC_DOWNLOAD_IOS_APP: process.env.NEXT_PUBLIC_DOWNLOAD_IOS_APP,
  NEXT_PUBLIC_DOWNLOAD_ANDROID_APP:
    process.env.NEXT_PUBLIC_DOWNLOAD_ANDROID_APP,
  NEXT_PUBLIC_PLATFORM: process.env.NEXT_PUBLIC_PLATFORM,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
});

if (!env.success) {
  console.error('❌ web - invalid environment variables:', env.error.format());
}

export default env.data!;
