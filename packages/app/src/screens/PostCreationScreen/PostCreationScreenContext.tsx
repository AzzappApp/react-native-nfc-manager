import { createContext } from 'react';

type PostCreationState = {
  allowLikes: boolean;
  allowComments: boolean;
  content: string;
  setAllowLikes(value: boolean): void;
  setAllowComments(value: boolean): void;
  setContent(content: string): void;
};

const PostCreationScreenContext = createContext<PostCreationState>({
  allowLikes: true,
  allowComments: true,
  content: '',
  setAllowLikes: () => void 0,
  setAllowComments: () => void 0,
  setContent: () => void 0,
});

export default PostCreationScreenContext;
