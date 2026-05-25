import { useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import HostDashboard from './pages/HostDashboard';
import NewListingPage from './pages/NewListingPage';
import { TripsPage, SavedPage } from './pages/TripsAndSaved';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import { useToast } from './components/UI';

function AppInner() {
  const { loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [authModal, setAuthModal] = useState(null);
  const { show, ToastEl } = useToast();
  const navigate = useNavigate();

  const handleSearchChange = useCallback((v) => {
    setSearchQuery(v);
    navigate('/');
  }, [navigate]);

  // Don't block render on auth loading — show app immediately
  // HomePage handles the case when user is null fine
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
        <Route path="/"                   element={<HomePage searchQuery={searchQuery} />} />
        <Route path="/listing/:slug"      element={<ListingDetailPage />} />
        <Route path="/trips"              element={<TripsPage />} />
        <Route path="/saved"              element={<SavedPage />} />
        <Route path="/profile"            element={<ProfilePage />} />
        <Route path="/messages"           element={<MessagesPage />} />
        <Route path="/messages/:id"       element={<MessagesPage />} />
        <Route path="/host/dashboard"     element={<HostDashboard />} />
        <Route path="/host/new-listing"   element={<NewListingPage />} />
        <Route path="*"                   element={<NotFound />} />
      </Routes>
    </>
  );
}

function NotFound() {
  return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontSize: 24, marginBottom: 8 }}>Page not found</h2>
      <a href="/" style={{ color: '#E8472A', fontWeight: 600 }}>Go home</a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
