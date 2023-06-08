import { graphql, useMutation } from 'react-relay';

const useUpdateUser = () => {
  return useMutation(graphql`
    mutation useUpdateUser_Mutation($input: UpdateUserInput!) {
      updateUser(input: $input) {
        user {
          email
          phoneNumber
        }
      }
    }
  `);
};

export default useUpdateUser;
