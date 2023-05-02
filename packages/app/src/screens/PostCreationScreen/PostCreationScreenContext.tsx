import { createContext } from 'react';
import type { AuthorCartoucheFragment_profile$key } from '@azzapp/relay/artifacts/AuthorCartoucheFragment_profile.graphql';

type PostCreationState = {
  allowLikes: boolean;
  allowComments: boolean;
  content: string;
  setAllowLikes(value: boolean): void;
  setAllowComments(value: boolean): void;
  setContent(content: string): void;
  profile: AuthorCartoucheFragment_profile$key | null;
};

const PostCreationScreenContext = createContext<PostCreationState>({
  allowLikes: true,
  allowComments: true,
  content: '',
  setAllowLikes: () => void 0,
  setAllowComments: () => void 0,
  setContent: () => void 0,
  profile: null,
});

export default PostCreationScreenContext;
