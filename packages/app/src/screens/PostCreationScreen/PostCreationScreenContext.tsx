import { createContext } from 'react';
import type { AuthorCartoucheFragment_webCard$key } from '@azzapp/relay/artifacts/AuthorCartoucheFragment_webCard.graphql';

type PostCreationState = {
  allowLikes: boolean;
  allowComments: boolean;
  content: string;
  setAllowLikes(value: boolean): void;
  setAllowComments(value: boolean): void;
  setContent(content: string): void;
  webCard: AuthorCartoucheFragment_webCard$key | null;
};

const PostCreationScreenContext = createContext<PostCreationState>({
  allowLikes: true,
  allowComments: true,
  content: '',
  setAllowLikes: () => void 0,
  setAllowComments: () => void 0,
  setContent: () => void 0,
  webCard: null,
});

export default PostCreationScreenContext;
