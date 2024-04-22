'use client';

import {
  Box,
  Button,
  Card,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login, type LoginErrors } from './loginActions';

const LoginForm = () => {
  const [errors, setErrors] = useState<LoginErrors | null>(null);

  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    const errors = await login(formData);
    if (!errors) {
      router.replace(
        decodeURIComponent(window.location.search.replace('?redirect=', '')) ||
          '/',
      );
    } else {
      setErrors(errors);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Card
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
        }}
      >
        <Typography component="h1" variant="h5">
          Azzapp - Sign in
        </Typography>
        <Box sx={{ mt: 1 }}>
          <form action={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              error={!!errors?.email}
              helperText={errors?.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              error={!!errors?.password}
              helperText={errors?.password}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
          </form>
        </Box>
        <Typography component="p" variant="body1" color="error">
          {errors?.failed ?? ''}
        </Typography>
      </Card>
    </Container>
  );
};

export default LoginForm;
