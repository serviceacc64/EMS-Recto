import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Employee from './pages/Employee';
import JuniorHigh from './pages/JuniorHigh';
import SeniorHigh from './pages/SeniorHigh';
import Report from './pages/Report';
import LeaveTracker from './pages/LeaveTracker';
import AuditLogs from './pages/AuditLogs';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employee" element={<Employee />} />
                
                {/* Restricted Routes */}
                <Route 
                  path="/junior-high" 
                  element={<ProtectedRoute requireSuperAdmin={true}><JuniorHigh /></ProtectedRoute>} 
                />
                <Route 
                  path="/senior-high" 
                  element={<ProtectedRoute requireSuperAdmin={true}><SeniorHigh /></ProtectedRoute>} 
                />
                <Route 
                  path="/report" 
                  element={<ProtectedRoute requireSuperAdmin={true}><Report /></ProtectedRoute>} 
                />
                <Route 
                  path="/leave-tracker" 
                  element={<ProtectedRoute requireSuperAdmin={true}><LeaveTracker /></ProtectedRoute>} 
                />
                <Route 
                  path="/audit-logs" 
                  element={
                    <ProtectedRoute requireSuperAdmin={true}>
                      <AuditLogs />
                    </ProtectedRoute>
                  } 
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
