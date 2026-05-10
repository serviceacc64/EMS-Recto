import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employee from './pages/Employee';
import JuniorHigh from './pages/JuniorHigh';
import SeniorHigh from './pages/SeniorHigh';
import Report from './pages/Report';
import LeaveTracker from './pages/LeaveTracker';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employee" element={<Employee />} />
              <Route path="/junior-high" element={<JuniorHigh />} />
              <Route path="/senior-high" element={<SeniorHigh />} />
              <Route path="/report" element={<Report />} />
              <Route path="/leave-tracker" element={<LeaveTracker />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
