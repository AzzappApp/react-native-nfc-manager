import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

const defaultTheme: Theme = createTheme({
  palette: {
    mode: 'light',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          height: '100vh',
          overflow: 'hidden',
        },
      },
    },
  },
});

export default defaultTheme;
