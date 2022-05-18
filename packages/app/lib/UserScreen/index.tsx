import { graphql } from 'react-relay';
import UserScreen from './UserScreen';
import type { UserScreenByIdQuery } from './__generated__/UserScreenByIdQuery.graphql';
import type { UserScreenByUserNameQuery } from './__generated__/UserScreenByUserNameQuery.graphql';

// TODO: Perhaps this query should be defined directly in UserMobileScreen
// since it's prety specific
export const userScreenByIdQuery = graphql`
  query UserScreenByIdQuery($userId: ID!) {
    user: node(id: $userId) {
      ...UserScreenFramgent_user
    }
    viewer {
      ...UserScreenFramgent_viewer
    }
  }
`;

export const userScreenByNameQuery = graphql`
  query UserScreenByUserNameQuery($userName: String!) {
    user(userName: $userName) {
      ...UserScreenFramgent_user
    }
    viewer {
      ...UserScreenFramgent_viewer
    }
  }
`;

export type { UserScreenByIdQuery, UserScreenByUserNameQuery };

export default UserScreen;
