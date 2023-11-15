'use client';
import LogoutIcon from '@mui/icons-material/Logout';

import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { startTransition, useCallback } from 'react';
import { logout } from '../app/loginActions';

const LogoutButton = () => {
  const onLogout = useCallback(() => {
    startTransition(() => {
      logout();
    });
  }, []);
  return (
    <ListItemButton component="button" onClick={onLogout}>
      <ListItemIcon>
        <LogoutIcon />
      </ListItemIcon>
      <ListItemText primary="Logout" />
    </ListItemButton>
  );
};
export default LogoutButton;
