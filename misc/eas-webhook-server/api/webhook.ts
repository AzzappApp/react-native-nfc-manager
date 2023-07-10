import crypto from 'crypto';
import { Octokit } from '@octokit/rest';
import safeCompare from 'safe-compare';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const OWNER = 'AzzappApp';
const REPO = 'azzapp';

const handleBuildEvent = async (body: any) => {
  const {
    status,
    buildDetailsPageUrl,
    metadata: { message },
    platform,
  } = body as {
    status: 'canceled' | 'errored' | 'finished';
    buildDetailsPageUrl: string;
    metadata: {
      message: string;
    };
    platform: 'android' | 'ios';
  };

  if (status === 'canceled') {
    return;
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
  await octokit.repos.createCommitStatus({
    owner: OWNER,
    repo: REPO,
    sha: message,
    state: status === 'errored' ? 'error' : 'success',
    context: `Eas build ${platform}`,
    description: `EAS build - ${platform}`,
    target_url: buildDetailsPageUrl,
  });
};

const webhook = async (req: VercelRequest, res: VercelResponse) => {
  const expoSignature = req.headers['expo-signature'] as string;
  // process.env.SECRET_WEBHOOK_KEY has to match SECRET value set with `eas webhook:create` command
  const hmac = crypto.createHmac('sha1', process.env.EAS_BUILD_WEBHOOK_SECRET!);
  hmac.update(req.body);
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

export default webhook;
