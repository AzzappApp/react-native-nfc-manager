import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import Link from 'next/link';

const SectionItem = ({
  href,
  text,
  Icon,
}: {
  href: string;
  text: string;
  Icon?: React.ComponentType;
}) => (
  <ListItemButton key={href} component={Link} href={href}>
    {Icon && (
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
    )}
    <ListItemText primary={text} />
  </ListItemButton>
);

export default SectionItem;
