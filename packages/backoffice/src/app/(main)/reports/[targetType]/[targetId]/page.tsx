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
} from '@mui/material';
import { and, eq } from 'drizzle-orm';
import {
  PostCommentTable,
  PostTable,
  WebCardTable,
  db,
} from '@azzapp/data/domains';
import { ReportTable } from '@azzapp/data/domains/report';
import { getImageURLForSize, getVideoURL } from '@azzapp/shared/imagesHelpers';
import { deleteRelatedItem, ignoreReport } from './reportsAction';
import ReportsList from './ReportsList';
import type { TargetType } from '@azzapp/data/domains/report';

type ReportPageProps = {
  params: {
    targetId: string;
    targetType: TargetType;
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

const ReportPage = async ({
  params: { targetId, targetType },
}: ReportPageProps) => {
  const reports = await db
    .select()
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
          </CardContent>
        ) : null}
        <CardActions>
          <form action={ignoreWithData}>
            <Button
              size="medium"
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

      <ReportsList reports={reports} />
    </div>
  );
};

export default ReportPage;
