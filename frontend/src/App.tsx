import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlannerPage } from './pages/PlannerPage';
import { MapPage } from './pages/MapPage';
import { CopilotPage } from './pages/CopilotPage';

// Protected Route Shield
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712' }}>
        <Box component="span" sx={{ fontSize: '1.2rem', color: '#9ca3af' }}>Loading session...</Box>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Route wrapper to auto-redirect authenticated users from /auth or / to dashboard
const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <AuthProvider>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                {/* PUBLIC ROUTES */}
                <Route 
                  path="/" 
                  element={
                    <RedirectIfAuthenticated>
                      <LandingPage />
                    </RedirectIfAuthenticated>
                  } 
                />
                <Route 
                  path="/auth" 
                  element={
                    <RedirectIfAuthenticated>
                      <AuthPage />
                    </RedirectIfAuthenticated>
                  } 
                />

                {/* SECURED OPERATIONAL ROUTES */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/planner" 
                  element={
                    <ProtectedRoute>
                      <PlannerPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/map/:id" 
                  element={
                    <ProtectedRoute>
                      <MapPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/copilot/:id" 
                  element={
                    <ProtectedRoute>
                      <CopilotPage />
                    </ProtectedRoute>
                  } 
                />

                {/* CATCH ALL */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </Box>
        </AuthProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
};

export default App;
