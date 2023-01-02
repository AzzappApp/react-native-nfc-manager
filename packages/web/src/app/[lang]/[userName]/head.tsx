import type { UserPageProps } from './page';

const UserPageHead = ({ params: { userName } }: UserPageProps) => (
  <>
    <title>{userName}</title>
  </>
);

export default UserPageHead;
