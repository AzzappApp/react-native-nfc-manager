import { AccountCircle, Check } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Alert,
  Chip,
  Box,
  Link as MuiLink,
  Breadcrumbs,
} from '@mui/material';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPostById,
  getPostCommentById,
  getProfilesByWebCard,
  getTargetReports,
  getWebCardById,
  type Post,
  type PostComment,
  type Report,
  type ReportTargetType,
  type WebCard,
} from '@azzapp/data';
import {
  getImageURLForSize,
  getVideoURL,
} from '@azzapp/service/mediaServices/imageHelpers';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import { deleteRelatedItem, ignoreReport } from './reportsAction';
import ReportsList from './ReportsList';
import type { ReportStatus } from '../../page';

type ReportPageProps = {
  params: Promise<{
    targetId: string;
    targetType: ReportTargetType;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

type Item = {
  targetType: ReportTargetType;
  webCard: WebCard;
  post?: Post;
  postComment?: PostComment;
};

const getItem = async (
  targetId: string,
  targetType: ReportTargetType,
): Promise<Item | null> => {
  let webCardId = targetType === 'webCard' ? targetId : undefined;
  let postId = targetType === 'post' ? targetId : undefined;
  const postCommentId = targetType === 'comment' ? targetId : undefined;

  let postComment: PostComment | undefined = undefined;
  if (postCommentId) {
    postComment = (await getPostCommentById(postCommentId)) ?? undefined;
    if (!postComment) {
      return null;
    }
    postId = postComment.postId;
  }

  let post: Post | undefined = undefined;
  if (postId) {
    post = (await getPostById(postId)) ?? undefined;
    if (!post) {
      return null;
    }
    webCardId = post.webCardId;
  }

  if (!webCardId) {
    return null;
  }
  const webCard = await getWebCardById(webCardId);
  if (!webCard) {
    return null;
  }

  return {
    targetType,
    webCard,
    post,
    postComment,
  };
};

const getOwner = async (webCardId: string) =>
  getProfilesByWebCard(webCardId)
    .then(profiles =>
      profiles.filter(profile => profile.profileRole === 'owner'),
    )
    .then(profiles => profiles[0] ?? null);

const getStatus = (reports: Report[]): ReportStatus => {
  const treated = reports.find(({ treatedAt }) => !!treatedAt);
  if (!treated || !treated.treatedAt) {
    return 'open';
  }

  const lastReportDate = reports.reduce(
    (max, report) => Math.max(max, report.createdAt.getTime()),
    -Infinity,
  );

  return treated.treatedAt.getTime() <= lastReportDate ? 'open' : 'closed';
};

const ReportPage = async (props: ReportPageProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { targetId, targetType } = params;

  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const item = await getItem(targetId, targetType);
  if (!item) {
    return notFound();
  }
  const owner = await getOwner(item.webCard.id);

  const { reports, count: reportCount } = await getTargetReports(
    targetId,
    targetType,
    (page - 1) * PAGE_SIZE,
    PAGE_SIZE,
  );

  const ignoreWithData = ignoreReport.bind(null, targetId, targetType);
  const deleteWithData = deleteRelatedItem.bind(null, targetId, targetType);
  const status = getStatus(reports);
  const deleted =
    item.postComment?.deleted || item.post?.deleted || item.webCard?.deleted;

  return (
    <div>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/moderations"
        >
          <AccountCircle sx={{ mr: 0.5 }} fontSize="inherit" />
          Users
        </MuiLink>
      </Breadcrumbs>
      {deleted && (
        <Alert variant="filled" severity="warning" sx={{ mb: 5 }}>
          This item has been removed
        </Alert>
      )}
      <Box display="flex" flexDirection="column" alignItems="flex-Start">
        <Card sx={{ mb: 5 }} raised>
          {item.targetType === 'comment' && item.postComment && item.post ? (
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {item.postComment.comment}
              </Typography>
              <Chip
                sx={{ mt: 2, mb: 2 }}
                label={status}
                color={status === 'open' ? 'warning' : 'default'}
              />
              <Typography variant="body2" color="text.secondary">
                Post:
                <Link
                  href={buildWebUrl(
                    `/${item.webCard.userName}/post/${item.post.id}`,
                  )}
                  target="_blank"
                >
                  {buildWebUrl(
                    `/${item.webCard.userName}/post/${item.post.id}`,
                  )}
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Webcard:
                <Link href={buildWebUrl(item.webCard.userName)} target="_blank">
                  {buildWebUrl(item.webCard.userName)}
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Owner:
                <Link href={`/users/${owner?.userId}`} target="_blank">
                  {owner?.userId}
                </Link>
              </Typography>
            </CardContent>
          ) : item.targetType === 'post' && item.post ? (
            <>
              {item.post.medias.map(media =>
                media.startsWith('v') ? (
                  <CardMedia
                    key={media}
                    component="video"
                    height={400}
                    image={getVideoURL(media)}
                    controls
                  />
                ) : (
                  <CardMedia
                    key={media}
                    component="img"
                    height={400}
                    image={getImageURLForSize({ id: media })}
                  />
                ),
              )}

              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {item.post.content}
                </Typography>
                <Chip
                  sx={{ mt: 2, mb: 2 }}
                  label={status}
                  color={status === 'open' ? 'warning' : 'default'}
                />
                <Typography
                  display="flex"
                  component="div"
                  variant="body2"
                  color="text.secondary"
                >
                  Post:
                  <Typography variant="body2" color="text.secondary">
                    <Link
                      href={buildWebUrl(
                        `/${item.webCard.userName}/post/${item.post.id}`,
                      )}
                      target="_blank"
                    >
                      {buildWebUrl(
                        `${item.webCard.userName}/post/${item.post.id}`,
                      )}
                    </Link>
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Webcard:
                  <Link
                    href={buildWebUrl(item.webCard.userName)}
                    target="_blank"
                  >
                    {buildWebUrl(item.webCard.userName)}
                  </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Owner:
                  <Link href={`/users/${owner?.userId}`} target="_blank">
                    {owner?.userId}
                  </Link>
                </Typography>
              </CardContent>
            </>
          ) : item.targetType === 'webCard' && item.webCard ? (
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {item.webCard.userName}
              </Typography>
              <Chip
                sx={{ mt: 2, mb: 2 }}
                label={status}
                color={status === 'open' ? 'warning' : 'default'}
              />
              <Typography variant="body2" color="text.secondary">
                Webcard:
                <Link href={buildWebUrl(item.webCard.userName)} target="_blank">
                  {buildWebUrl(item.webCard.userName)}
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Owner:
                <Link href={`/users/${owner?.userId}`} target="_blank">
                  {owner?.userId}
                </Link>
              </Typography>
            </CardContent>
          ) : null}
          <CardActions>
            <form action={ignoreWithData}>
              <Button
                size="medium"
                variant="contained"
                color="primary"
                startIcon={<Check />}
                type="submit"
                disabled={status === 'closed'}
              >
                IGNORE
              </Button>
            </form>
            <form action={deleteWithData}>
              <Button
                size="medium"
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                type="submit"
                disabled={deleted}
              >
                REMOVE
              </Button>
            </form>
          </CardActions>
        </Card>
      </Box>

      <ReportsList
        reports={reports}
        count={reportCount}
        page={page}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
};

export default ReportPage;

const PAGE_SIZE = 25;
