'use client';

import { Star } from '@mui/icons-material';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import { yellow } from '@mui/material/colors';
import {
  getImageURLForSize,
  getVideoURL,
} from '@azzapp/service/mediaServices/imageHelpers';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import type { WebCard } from '@azzapp/data';

type Props = {
  webcard: WebCard;
  role: string;
  onRemoveWebCard: () => void;
  onToggleStar: () => void;
};

const HEIGHT = 200;

const WebCardCover = ({
  webcard,
  role,
  onRemoveWebCard,
  onToggleStar,
}: Props) => {
  return (
    <Card sx={{ minWidth: 200, flex: 0 }}>
      {webcard.coverMediaId?.startsWith('v') ? (
        <CardMedia
          sx={{ height: HEIGHT }}
          component="video"
          title={webcard.userName || ''}
          image={getVideoURL(webcard.coverMediaId)}
          controls
        />
      ) : (
        <CardMedia
          sx={{ height: HEIGHT }}
          component="img"
          title={webcard.userName || ''}
          image={getImageURLForSize({ id: webcard.coverMediaId || '' })}
        />
      )}
      <CardContent>
        <Link
          href={buildWebUrl(webcard.userName)}
          target="_blank"
          rel="noopener"
        >
          {webcard.userName}
        </Link>
        <Typography variant="body2">id: {webcard.id}</Typography>
        {webcard.companyName && (
          <Typography variant="body2">
            Company: {webcard.companyName}
          </Typography>
        )}
        <Typography variant="body2">user role: {role}</Typography>
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={onRemoveWebCard}
        >
          Remove
        </Button>
        <IconButton
          onClick={onToggleStar}
          style={
            webcard.starred
              ? {
                  color: yellow[600],
                }
              : {}
          }
        >
          <Star />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default WebCardCover;
