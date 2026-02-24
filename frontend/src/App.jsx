import { useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import HostDashboard from './pages/HostDashboard';
import NewListingPage from './pages/NewListingPage';
import { TripsPage, SavedPage } from './pages/TripsAndSaved';
import ProfilePage from './pages/ProfilePage';
import { useToast } from './components/UI';

function AppInner() {
  const [searchQuery, setSearchQuery] = useState('');
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register'
  const { show, ToastEl } = useToast();
  const navigate = useNavigate();

  const handleSearchChange = useCallback((v) => {
    setSearchQuery(v);
    navigate('/');
  }, [navigate]);

  return (
    <>
      {ToastEl}
      <Header
        onAuthOpen={setAuthModal}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSuccess={(user) => {
            show(`Welcome, ${user.first_name || user.email}! 🎉`);
            setAuthModal(null);
          }}
        />
      )}

      <Routes>
        <Route path="/"               element={<HomePage searchQuery={searchQuery} />} />
        <Route path="/listing/:id"    element={<ListingDetailPage />} />
        <Route path="/trips"          element={<TripsPage />} />
        <Route path="/saved"          element={<SavedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/host/new-listing" element={<NewListingPage />} />
        <Route path="*"               element={<div style={{ padding: '80px 24px', textAlign: 'center' }}><h2>404 — Page not found</h2></div>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
