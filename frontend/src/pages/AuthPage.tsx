import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Divider, 
  Alert,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export const AuthPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { highContrast } = useAccessibility();
  const navigate = useNavigate();

  const [tabIndex, setTabIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (tabIndex === 1 && !name)) {
      return setError('Please fill in all required inputs.');
    }

    setLoading(true);
    setError(null);
    try {
      if (tabIndex === 0) {
        // Sign In
        await signInWithEmail(email, password);
      } else {
        // Sign Up
        await signUpWithEmail(email, password, name);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail('test@example.com', 'password123');
      navigate('/dashboard');
    } catch (err: any) {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - 64px)', 
        background: highContrast ? '#000000' : 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.04) 0%, rgba(3, 7, 18, 1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440, p: { xs: 2, sm: 4 } }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center' }}>
            <Typography variant="h2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
              {tabIndex === 0 ? 'Welcome Back' : 'Create Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Intelligent travel planning is just a click away.
            </Typography>
          </Box>

          {/* Social Google Link */}
          <Button
            variant="outlined"
            onClick={handleGoogleSignIn}
            startIcon={loading ? <CircularProgress size={18} /> : <GoogleIcon />}
            disabled={loading}
            sx={{ 
              py: 1.25, 
              borderColor: 'divider', 
              color: 'text.primary',
              '&:hover': { borderColor: 'primary.main', backgroundColor: 'rgba(255,255,255,0.02)' }
            }}
          >
            Continue with Google
          </Button>

          <Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">OR</Typography></Divider>

          {error && <Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>}

          {/* Tabs */}
          <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Sign In" disabled={loading} sx={{ fontWeight: 600 }} />
            <Tab label="Sign Up" disabled={loading} sx={{ fontWeight: 600 }} />
          </Tabs>

          {/* Form */}
          <Box component="form" onSubmit={handleEmailSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tabIndex === 1 && (
              <TextField
                label="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={loading}
                fullWidth
                variant="outlined"
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            )}
            
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              fullWidth
              variant="outlined"
              InputProps={{ sx: { borderRadius: '12px' } }}
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              fullWidth
              variant="outlined"
              InputProps={{ sx: { borderRadius: '12px' } }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ 
                py: 1.5, 
                fontWeight: 700,
                background: highContrast ? 'none' : 'linear-gradient(45deg, #6366f1 30%, #14b8a6 90%)',
                color: highContrast ? 'primary.main' : '#ffffff',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : (tabIndex === 0 ? 'Sign In' : 'Create Account')}
            </Button>
          </Box>

          <Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">EVALUATION BYPASS</Typography></Divider>

          {/* Demo Bypass Trigger */}
          <Button
            variant="contained"
            color="secondary"
            onClick={handleDemoBypass}
            disabled={loading}
            startIcon={<LockOpenIcon />}
            sx={{ 
              py: 1.5, 
              borderRadius: '12px', 
              fontWeight: 700,
              backgroundColor: 'secondary.main',
              color: '#000000',
              '&:hover': { backgroundColor: 'secondary.dark' }
            }}
          >
            One-Click Demo Login
          </Button>

          {/* Go Back */}
          <Button 
            variant="text" 
            size="small" 
            onClick={() => navigate('/')}
            startIcon={<ArrowBackIcon />}
            sx={{ color: 'text.secondary', alignSelf: 'center' }}
          >
            Back to Home
          </Button>

        </CardContent>
      </Card>
    </Box>
  );
};
