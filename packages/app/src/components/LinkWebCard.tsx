import Link from './Link';
import type { WebCardRoute } from '#routes';
import type { LinkProps } from './Link';

type LinkWebCard = Omit<LinkProps<WebCardRoute>, 'params' | 'route'> & {
  params: Omit<WebCardRoute['params'], 'userName'> & {
    userName?: string | null;
  };
};

const LinkWebCard = ({ params, children, ...props }: LinkWebCard) => {
  if (params?.userName) {
    <Link route="WEBCARD" params={params as WebCardRoute['params']} {...props}>
      {children}
    </Link>;
  }
  return children;
};

export default LinkWebCard;
