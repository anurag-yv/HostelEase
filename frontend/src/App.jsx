import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { RaiseComplaintPage } from './pages/student/RaiseComplaintPage';
import { StudentComplaintsPage } from './pages/student/StudentComplaintsPage';
import { ComplaintDetailPage } from './pages/student/ComplaintDetailPage';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffTasksPage } from './pages/staff/StaffTasksPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminComplaintsPage } from './pages/admin/AdminComplaintsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminLogsPage } from './pages/admin/AdminLogsPage';

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      {/* Screen reader skip-link */}
      <a href="#main-content" className="skip-link">
        Skip to main content (Alt + S)
      </a>

      <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} isSidebarOpen={sidebarOpen} />
      <div className="he-layout">
        {user && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main
          id="main-content"
          tabIndex="-1"
          role="main"
          className={user ? 'he-main-content' : 'flex-grow-1'}
          aria-label="Main content"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<RoleRedirect />} />

                {/* Authenticated Common Routes */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                } />

                {/* Student Protected Routes */}
                <Route path="/student/dashboard" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/student/raise-complaint" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <RaiseComplaintPage />
                  </ProtectedRoute>
                } />
                <Route path="/student/complaints" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentComplaintsPage />
                  </ProtectedRoute>
                } />
                <Route path="/student/complaints/:id" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <ComplaintDetailPage />
                  </ProtectedRoute>
                } />

                {/* Staff Protected Routes */}
                <Route path="/staff/dashboard" element={
                  <ProtectedRoute allowedRoles={['STAFF']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/staff/tasks" element={
                  <ProtectedRoute allowedRoles={['STAFF']}>
                    <StaffTasksPage />
                  </ProtectedRoute>
                } />

                {/* Admin Protected Routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/complaints" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminComplaintsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/logs" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLogsPage />
                  </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </AccessibilityProvider>
  );
}

export default App;
