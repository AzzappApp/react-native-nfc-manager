'use client';

import { Star } from '@mui/icons-material';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
} from '@mui/material';
import { yellow } from '@mui/material/colors';
import { getImageURLForSize, getVideoURL } from '@azzapp/shared/imagesHelpers';
import type { WebCard } from '@azzapp/data';

type Props = {
  webcard: WebCard;
  role: string;
  onRemoveWebCard: () => void;
  onToggleStar: () => void;
};

const WIDTH = 276;
const HEIGHT = 411;

const WebCardCover = ({
  webcard,
  role,
  onRemoveWebCard,
  onToggleStar,
}: Props) => {
  return (
    <Card sx={{ minWidth: WIDTH, margin: 1 }}>
      {webcard.coverMediaId?.startsWith('v') ? (
        <CardMedia
          sx={{ height: HEIGHT }}
          component="video"
          title={webcard.userName}
          image={getVideoURL(webcard.coverMediaId)}
          controls
        />
      ) : (
        <CardMedia
          sx={{ height: HEIGHT }}
          component="img"
          title={webcard.userName}
          image={getImageURLForSize({ id: webcard.coverMediaId || '' })}
        />
      )}
      <CardContent>
        <Typography variant="body1">name: {webcard.userName}</Typography>
        {webcard.companyName && (
          <Typography variant="subtitle2">
            Company: {webcard.companyName}
          </Typography>
        )}
        <Typography variant="subtitle2">id: {webcard.id}</Typography>
        <Typography variant="subtitle2">role: {role}</Typography>
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
