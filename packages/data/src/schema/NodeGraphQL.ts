import { GraphQLID, GraphQLInterfaceType, GraphQLNonNull } from 'graphql';
import { isPost } from '../domains/Post';
import { isUser } from '../domains/User';
import { isUserCard } from '../domains/UserCard';

const NodeGraphQL = new GraphQLInterfaceType({
  name: 'Node',
  description: 'An object with an ID',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  resolveType: (value: any) => {
    if (isUser(value)) {
      return 'User';
    } else if (isUserCard(value)) {
      return 'UserCard';
    } else if (isPost(value)) {
      return 'Post';
    }
  },
});

export default NodeGraphQL;
