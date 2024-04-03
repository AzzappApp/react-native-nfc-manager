'use client';

import { ExpandLess, ExpandMore } from '@mui/icons-material';
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import type { Section } from '#backOfficeSections';
import type { User } from '@azzapp/data/domains';

const CollapseListItem = ({
  section: { text, subSections },
  user,
  Icon,
}: {
  section: Section;
  user: User | null;
  Icon?: React.ComponentType;
}) => {
  const [open, setOpen] = useState(true);

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
          {pages.map(({ text, href }) => {
            return (
              <ListItem key={href} disablePadding sx={{ pl: 4 }}>
                <ListItemButton component={Link} href={href}>
                  <ListItemText primary={text} />
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
