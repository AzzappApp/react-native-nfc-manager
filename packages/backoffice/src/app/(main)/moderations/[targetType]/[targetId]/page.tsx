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
import { and, desc, eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import {
  PostCommentTable,
  PostTable,
  WebCardTable,
  db,
  ReportTable,
  ProfileTable,
} from '@azzapp/data';
import { getImageURLForSize, getVideoURL } from '@azzapp/shared/imagesHelpers';
import { deleteRelatedItem, ignoreReport } from './reportsAction';
import ReportsList from './ReportsList';
import type { ReportStatus } from '../../page';
import type {
  Post,
  PostComment,
  Report,
  TargetType,
  WebCard,
} from '@azzapp/data';

type ReportPageProps = {
  params: {
    targetId: string;
    targetType: TargetType;
  };
  searchParams: {
    page?: string;
  };
};

type Item = {
  targetType: TargetType;
  WebCard: WebCard;
  Post?: Post;
  PostComment?: PostComment;
};

const getItem = async (
  targetId: string,
  targetType: TargetType,
): Promise<Item> => {
  if (targetType === 'comment') {
    return db
      .select()
      .from(PostCommentTable)
      .where(eq(PostCommentTable.id, targetId))
      .innerJoin(PostTable, eq(PostTable.id, PostCommentTable.postId))
      .innerJoin(WebCardTable, eq(PostTable.webCardId, WebCardTable.id))
      .then(rows => ({ ...rows[0], targetType }));
  } else if (targetType === 'post') {
    return db
      .select()
      .from(PostTable)
      .where(eq(PostTable.id, targetId))
      .innerJoin(WebCardTable, eq(PostTable.webCardId, WebCardTable.id))
      .then(rows => ({ ...rows[0], targetType }));
  } else if (targetType === 'webCard') {
    return db
      .select()
      .from(WebCardTable)
      .where(eq(WebCardTable.id, targetId))
      .then(rows => ({ WebCard: { ...rows[0] }, targetType }));
  }

  throw new Error('Invalid targetType');
};

const getOwner = async (webCardId: string) => {
  const query = db
    .select()
    .from(ProfileTable)
    .where(
      and(
        eq(ProfileTable.webCardId, webCardId),
        eq(ProfileTable.profileRole, 'owner'),
      ),
    );

  return query.then(rows => rows[0]);
};

const getStatus = (reports: Report[]): ReportStatus => {
  const treated = reports.find(({ treatedAt }) => !!treatedAt);
  if (!treated || !treated.treatedAt) {
    return 'Opened';
  }

  const lastReportDate = reports.reduce(
    (max, report) => Math.max(max, report.createdAt.getTime()),
    -Infinity,
  );

  return treated.treatedAt.getTime() <= lastReportDate ? 'Opened' : 'Closed';
};

const ReportPage = async ({
  params: { targetId, targetType },
  searchParams,
}: ReportPageProps) => {
  let page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  page = Math.max(isNaN(page) ? 1 : page, 1);

  const reports = await db
    .select()
    .from(ReportTable)
    .where(
      and(
        eq(ReportTable.targetId, targetId),
        eq(ReportTable.targetType, targetType),
      ),
    )
    .offset((page - 1) * PAGE_SIZE)
    .orderBy(desc(ReportTable.createdAt))
    .limit(PAGE_SIZE);

  const [reportCount] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(ReportTable)
    .where(
      and(
        eq(ReportTable.targetId, targetId),
        eq(ReportTable.targetType, targetType),
      ),
    );

  const item = await getItem(targetId, targetType);
  const owner = await getOwner(item.WebCard.id);

  const ignoreWithData = ignoreReport.bind(null, targetId, targetType);
  const deleteWithData = deleteRelatedItem.bind(null, targetId, targetType);
  const status = getStatus(reports);
  const deleted =
    item.PostComment?.deleted || item.Post?.deleted || item.WebCard?.deleted;

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
          {item.targetType === 'comment' && item.PostComment && item.Post ? (
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {item.PostComment.comment}
              </Typography>
              <Chip
                sx={{ mt: 2, mb: 2 }}
                label={status}
                color={status === 'Opened' ? 'warning' : 'default'}
              />
              <Typography variant="body2" color="text.secondary">
                Post:
                <Link
                  href={`${process.env.NEXT_PUBLIC_URL}/${item.WebCard.userName}/post/${item.Post.id}`}
                  target="_blank"
                >{`${process.env.NEXT_PUBLIC_URL}/${item.WebCard.userName}/post/${item.Post.id}`}</Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Webcard:
                <Link
                  href={`${process.env.NEXT_PUBLIC_URL}/${item.WebCard.userName}`}
                  target="_blank"
                >{`${process.env.NEXT_PUBLIC_URL}/${item.WebCard.userName}`}</Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Owner:
                <Link href={`/users/${owner.userId}`} target="_blank">
                  {owner.userId}
                </Link>
              </Typography>
            </CardContent>
          ) : item.targetType === 'post' && item.Post ? (
            <>
              {item.Post.medias.map(media =>
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
                  {item.Post.content}
                </Typography>
                <Chip
                  sx={{ mt: 2, mb: 2 }}
                  label={status}
                  color={status === 'Opened' ? 'warning' : 'default'}
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
                      href={`${process.env.NEXT_PUBLIC_URL}/${item.WebCard.userName}/post/${item.Post.id}`}
                      target="_blank"
                    >{`${process.env.NEXT_PUBLIC_URL}/${item.WebCard.userName}/post/${item.Post.id}`}</Link>
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Webcard:
                  <Link
                    href={`${process.env.NEXT_PUBLIC_URL}/${item.WebCard.userName}`}
                    target="_blank"
                  >{`${process.env.NEXT_PUBLIC_URL}/${item.WebCard.userName}`}</Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Owner:
                  <Link href={`/users/${owner.userId}`} target="_blank">
                    {owner.userId}
                  </Link>
                </Typography>
              </CardContent>
            </>
          ) : item.targetType === 'webCard' && item.WebCard ? (
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {item.WebCard.userName}
              </Typography>
              <Chip
                sx={{ mt: 2, mb: 2 }}
                label={status}
                color={status === 'Opened' ? 'warning' : 'default'}
              />
              <Typography variant="body2" color="text.secondary">
                Webcard:
                <Link
                  href={`${process.env.NEXT_PUBLIC_URL}/${item.WebCard.userName}`}
                  target="_blank"
                >{`${process.env.NEXT_PUBLIC_URL}/${item.WebCard.userName}`}</Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Owner:
                <Link href={`/users/${owner.userId}`} target="_blank">
                  {owner.userId}
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
                disabled={status === 'Closed'}
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
        count={reportCount.count}
        page={page}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
};

export default ReportPage;

const PAGE_SIZE = 25;
