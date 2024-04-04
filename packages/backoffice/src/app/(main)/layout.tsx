import {
  AccountCircle,
  Layers,
  People,
  PhoneIphone,
  StarsSharp,
} from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  Toolbar,
  Typography,
} from '@mui/material';
import CollapseListItem from '#components/CollapseListItem';
import LogoutButton from '#components/LogoutButton';
import getCurrentUser from '#helpers/getCurrentUser';
import backOfficeSections from '../../backOfficeSections';

const APPBAR_HEIGHT = 64;

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getCurrentUser();

  return (
    <>
      <AppBar
        position="fixed"
        sx={{ zIndex: 2000, backgroundColor: '#263238', height: APPBAR_HEIGHT }}
      >
        <Toolbar>
          <MenuIcon sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div" color="white">
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
            top: APPBAR_HEIGHT,
            height: 'auto',
            bottom: 0,
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Divider />
        <List style={{ paddingTop: 40, overflow: 'auto' }}>
          {backOfficeSections.map((section, i) => (
            <CollapseListItem
              key={section.text}
              section={section}
              user={user}
              Icon={SectionIcons[section.id]}
              isOpen={i === 0}
            />
          ))}
        </List>
        <Divider sx={{ mt: 'auto' }} />
        <List>
          <ListItem disablePadding>
            <LogoutButton />
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          ml: `${DRAWER_WIDTH}px`,
          mt: `${APPBAR_HEIGHT}px`,
          p: 3,
          overflow: 'auto',
          height: `calc(100% - ${APPBAR_HEIGHT}px)`,
        }}
      >
        {children}
      </Box>
    </>
  );
};

export default MainLayout;

const DRAWER_WIDTH = 308;

const SectionIcons: Record<string, React.ComponentType> = {
  userActivity: AccountCircle,
  profileType: People,
  webcards: PhoneIphone,
  covers: StarsSharp,
  sections: Layers,
};
