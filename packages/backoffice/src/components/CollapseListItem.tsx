'use client';

import { ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  Badge,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import type { Section } from '#backOfficeSections';
import type { User } from '@azzapp/data';
import type { BadgeProps } from '@mui/material';

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -15,
    top: 15,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
  },
}));

const CollapseListItem = ({
  section: { text, subSections },
  user,
  isOpen,
  Icon,
}: {
  section: Section;
  user: User | null;
  isOpen: boolean;
  Icon?: React.ComponentType;
}) => {
  const [open, setOpen] = useState(isOpen);

  const pages = subSections.filter(({ roles }) =>
    roles.some(role => user?.roles?.includes(role)),
  );

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <>
      <ListItemButton onClick={handleClick}>
        {Icon && (
          <ListItemIcon>
            <Icon />
          </ListItemIcon>
        )}
        <ListItemText primary={text} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {pages.map(({ text, href, badge }) => {
            return (
              <ListItem key={href} disablePadding sx={{ pl: 4 }}>
                <ListItemButton component={Link} href={href}>
                  <StyledBadge badgeContent={badge} color="warning">
                    <ListItemText primary={text} />
                  </StyledBadge>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </>
  );
};

export default CollapseListItem;
