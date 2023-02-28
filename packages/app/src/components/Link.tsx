import { usePlatformEnvironment } from '#PlatformEnvironment';
import type { LinkProps } from '#PlatformEnvironment';

const Link = (props: LinkProps) => {
  const { LinkComponent } = usePlatformEnvironment();
  return <LinkComponent {...props} />;
};

export default Link;
