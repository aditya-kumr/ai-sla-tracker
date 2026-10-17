import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function Main() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Main />
      </AuthProvider>
    </ThemeProvider>
  );
}