import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import DesignerDashboard from './pages/DesignerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Settings from './pages/Settings';
import './styles/global.css';

// Protected Route Component
const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const userRole = (user.role || '').toLowerCase();
  const allowed = allowedRoles.map(r => r.toLowerCase());

  if (allowedRoles && !allowed.includes(userRole)) {
    // Redirect to their own dashboard if they try to access unauthorized area
    return <Navigate to={userRole === 'designer' ? '/designer' : '/client'} replace />;
  }
  
  return <Outlet />;
};

// Placeholders for now
const Placeholder = ({ title }) => (
  <div className="card">
    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{title}</h3>
    <p style={{ color: 'var(--text-muted)' }}>This feature is under construction.</p>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<DashboardLayout />}>
             {/* Designer Routes */}
             <Route element={<ProtectedRoute allowedRoles={['designer']} />}>
                <Route path="/designer" element={<DesignerDashboard view="assigned" />} />
                <Route path="/designer/sent" element={<DesignerDashboard view="sent" />} />
                <Route path="/designer/rejected" element={<DesignerDashboard view="rejected" />} />
             </Route>

             {/* Client Routes */}
             <Route element={<ProtectedRoute allowedRoles={['client']} />}>
                <Route path="/client" element={<ClientDashboard />} />
                <Route path="/client/approvals" element={<Placeholder title="Pending Approvals" />} />
                <Route path="/client/settings" element={<Settings />} />
             </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}


export default App;
