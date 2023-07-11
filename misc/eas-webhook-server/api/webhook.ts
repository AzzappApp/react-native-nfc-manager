import crypto from 'crypto';
import { Octokit } from '@octokit/rest';
import safeCompare from 'safe-compare';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Readable } from 'node:stream';

const OWNER = 'AzzappApp';
const REPO = 'azzapp';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const EAS_BUILD_WEBHOOK_SECRET = process.env.EAS_BUILD_WEBHOOK_SECRET;

const handleBuildEvent = async (body: any) => {
  const {
    status,
    buildDetailsPageUrl,
    metadata: { gitCommitHash },
    platform,
  } = body as {
    status: 'canceled' | 'errored' | 'finished';
    buildDetailsPageUrl: string;
    metadata: {
      gitCommitHash: string;
    };
    platform: 'android' | 'ios';
  };

  if (status === 'canceled') {
    return;
  }

  const octokit = new Octokit({
    auth: GITHUB_TOKEN,
  });

  await octokit.repos.createCommitStatus({
    owner: OWNER,
    repo: REPO,
    sha: gitCommitHash,
    state: status === 'errored' ? 'error' : 'success',
    context: `Eas build ${platform}`,
    description: `EAS build - ${platform}`,
    target_url: buildDetailsPageUrl,
  });
};

function buffer(readable: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = [];
    readable.on('data', chunk => chunks.push(Buffer.from(chunk)));
    readable.on('error', err => reject(err));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

const webhook = async (req: VercelRequest, res: VercelResponse) => {
  const expoSignature = req.headers['expo-signature'] as string;
  const buf = await buffer(req);
  const body = buf.toString('utf8');
  const hmac = crypto.createHmac('sha1', EAS_BUILD_WEBHOOK_SECRET!);
  hmac.update(body);
  const hash = `sha1=${hmac.digest('hex')}`;
  if (!safeCompare(expoSignature, hash)) {
    res.status(500).send("Signatures didn't match!");
  } else {
    try {
      const data = JSON.parse(req.body);
      await handleBuildEvent(data);
    } catch (e) {
      console.error(e);
      res.status(500).send('Error!');
    }
    res.send('OK!');
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default webhook;
