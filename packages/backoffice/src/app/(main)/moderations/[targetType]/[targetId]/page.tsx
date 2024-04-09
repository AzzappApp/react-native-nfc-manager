import DeleteIcon from '@mui/icons-material/Delete';
import IgnoreIcon from '@mui/icons-material/VolumeOff';
import {
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Alert,
  Chip,
} from '@mui/material';
import { and, eq, sql } from 'drizzle-orm';
import {
  PostCommentTable,
  PostTable,
  WebCardTable,
  db,
  ReportTable,
} from '@azzapp/data';
import { getImageURLForSize, getVideoURL } from '@azzapp/shared/imagesHelpers';
import { deleteRelatedItem, ignoreReport } from './reportsAction';
import ReportsList from './ReportsList';
import type { ReportStatus } from '../../page';
import type { Report, TargetType } from '@azzapp/data';

type ReportPageProps = {
  params: {
    targetId: string;
    targetType: TargetType;
  };
  searchParams: {
    page?: string;
  };
};

const getItem = async (targetId: string, targetType: TargetType) => {
  if (targetType === 'comment') {
    return db
      .select()
      .from(PostCommentTable)
      .where(eq(PostCommentTable.id, targetId))
      .then(rows => ({ ...rows[0], targetType }));
  } else if (targetType === 'post') {
    return db
      .select()
      .from(PostTable)
      .where(eq(PostTable.id, targetId))
      .then(rows => ({ ...rows[0], targetType }));
  } else if (targetType === 'webCard') {
    return db
      .select()
      .from(WebCardTable)
      .where(eq(WebCardTable.id, targetId))
      .then(rows => ({ ...rows[0], targetType }));
  }

  throw new Error('Invalid targetType');
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

  return treated.treatedAt.getTime() < lastReportDate ? 'Opened' : 'Closed';
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

  const ignoreWithData = ignoreReport.bind(null, targetId, targetType);
  const deleteWithData = deleteRelatedItem.bind(null, targetId, targetType);
  const status = getStatus(reports);

  return (
    <div>
      {item.deleted && (
        <Alert variant="filled" severity="warning" sx={{ mb: 5 }}>
          This item has been removed
        </Alert>
      )}
      <Card sx={{ maxWidth: 400, mb: 5 }}>
        {item.targetType === 'comment' ? (
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Comment {item.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.comment}
            </Typography>
            <Chip
              sx={{ marginTop: 2 }}
              label={status}
              color={status === 'Opened' ? 'warning' : 'default'}
            />
          </CardContent>
        ) : item.targetType === 'post' ? (
          <>
            {item.medias.map(media =>
              media.startsWith('v') ? (
                <CardMedia
                  key={media}
                  component="video"
                  height="400"
                  image={getVideoURL(media)}
                  controls
                />
              ) : (
                <CardMedia
                  key={media}
                  component="img"
                  height="400"
                  image={getImageURLForSize(media)}
                />
              ),
            )}

            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Post {item.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.content}
              </Typography>
              <Chip
                sx={{ marginTop: 2 }}
                label={status}
                color={status === 'Opened' ? 'warning' : 'default'}
              />
            </CardContent>
          </>
        ) : item.targetType === 'webCard' ? (
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              WebCard {item.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.userName}
            </Typography>
            <Chip
              sx={{ marginTop: 2 }}
              label={status}
              color={status === 'Opened' ? 'warning' : 'default'}
            />
          </CardContent>
        ) : null}
        <CardActions>
          <form action={ignoreWithData}>
            <Button
              size="medium"
              variant="contained"
              color="primary"
              startIcon={<IgnoreIcon />}
              type="submit"
              disabled={item.deleted}
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
              disabled={item.deleted}
            >
              REMOVE
            </Button>
          </form>
        </CardActions>
      </Card>

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
