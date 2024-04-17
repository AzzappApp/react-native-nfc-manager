import cn from 'classnames';
import React from 'react';
import styles from './Avatar.css';

export type AvatarProps = {
  className?: string;
  size?: 'medium';
} & (
  | {
      variant: 'icon';
      icon: JSX.Element;
    }
  | {
      variant: 'image';
      url: string;
      alt: string;
    }
  | {
      variant: 'initials';
      initials: string;
    }
);

const Avatar: React.FC<AvatarProps> = ({
  variant,
  className,
  size = 'medium',
  ...props
}) => {
  const classnames = cn(styles.avatarWrapper, className, {
    [styles.avatarMedium]: size === 'medium',
  });

  switch (variant) {
    case 'image': {
      const { url, alt } = props as AvatarProps & { url: string; alt: string };

      return (
        <div className={classnames}>
          <img className={styles.avatarImage} src={url} alt={alt} />
        </div>
      );
    }
    case 'initials': {
      const { initials } = props as AvatarProps & { initials: string };
      return (
        <div className={classnames}>
          <span className={styles.avatarInitials}>{initials}</span>
        </div>
      );
    }
    case 'icon': {
      const { icon } = props as AvatarProps & {
        icon: JSX.Element;
      };
      return (
        <div className={classnames}>
          <span className={styles.contentWrapper}>{icon}</span>
        </div>
      );
    }
  }
};

export default Avatar;
