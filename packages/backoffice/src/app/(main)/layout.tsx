import {
  AddCard,
  CardGiftcard,
  Colorize,
  Image,
  ImageAspectRatio,
  Person,
  Person2,
  Style,
} from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { logout } from '#app/loginActions';
import getCurrentUser from '#helpers/getCurrentUser';
import backOfficeSections from '../../backOfficeSections';

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getCurrentUser();

  const pages = backOfficeSections.filter(({ roles }) =>
    roles.some(role => user?.roles?.includes(role)),
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: 2000 }}>
        <Toolbar sx={{ backgroundColor: 'background.paper' }}>
          <DashboardIcon
            sx={{ color: '#444', mr: 2, transform: 'translateY(-2px)' }}
          />
          <Typography variant="h6" noWrap component="div" color="black">
            Azzapp - Backoffice
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: ['48px', '56px', '64px'],
            height: 'auto',
            bottom: 0,
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Divider />
        <List>
          {pages.map(({ text, href }) => {
            const Icon = SectionIcons[href];
            return (
              <ListItem key={href} disablePadding>
                <ListItemButton component={Link} href={href}>
                  <ListItemIcon>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Divider sx={{ mt: 'auto' }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton component="button" formAction={logout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          ml: `${DRAWER_WIDTH}px`,
          mt: ['48px', '56px', '64px'],
          p: 3,
        }}
      >
        {children}
      </Box>
    </>
  );
};

export default MainLayout;

const DRAWER_WIDTH = 240;

const SectionIcons: Record<string, React.ComponentType> = {
  '/users': Person,
  '/colorPalettes': Colorize,
  '/cardStyles': Style,
  '/profileCategories': Person2,
  '/staticMedias': Image,
  '/suggestedMedias': ImageAspectRatio,
  '/coverTemplates': CardGiftcard,
  '/cardTemplates': AddCard,
};
