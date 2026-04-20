import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './clientside/ClientResponsive.css';
import { AuthProvider } from './context/AuthProvider';
import { ShopProvider } from './context/ShopProvider';
import { ModalProvider } from './context/ModalContext';
import { SiteSettingsProvider } from './clientside/context/SiteSettingsContext';
import { BrowsingHistoryProvider } from './context/BrowsingHistoryContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import AuthenticatedHome from './components/AuthenticatedHome';
import Home from './clientside/pages/Home';
import Appointments from './clientside/pages/Appointments';
import Services from './clientside/pages/Services';
import Products from './clientside/pages/Products';
import ProductDetails from './clientside/pages/ProductDetails';

import About from './clientside/pages/About';
import SignUp from './clientside/pages/SignUp';
import Login from './clientside/pages/Login';
import ForgotPassword from './clientside/pages/ForgotPassword';
import LoginSuccess from './clientside/pages/LoginSuccess';
import SearchResults from './clientside/pages/SearchResults';
import MyAppointments from './clientside/pages/MyAppointments';

import AdminLayout from './adminside/layouts/AdminLayout';
import Dashboard from './adminside/pages/Dashboard';
import ProfileSettings from './adminside/pages/ProfileSettings';
import AdminProducts from './adminside/pages/AdminProducts';
import AdminServices from './adminside/pages/AdminServices';
import AdminInventory from './adminside/pages/AdminInventory';
import AdminClient from './adminside/pages/AdminClient';
import AdminAppointments from './adminside/pages/AdminAppointments';
import WalkInAppointments from './adminside/pages/WalkInAppointments';
import WalkInPatients from './adminside/pages/WalkInPatients';
import PatientDetails from './adminside/pages/PatientDetails';
import OnlineClients from './adminside/pages/OnlineClients';
import ClientDetails from './adminside/pages/ClientDetails';
import Customers from './adminside/pages/Customers';
import CustomerDetails from './adminside/pages/CustomerDetails';
import OnlineAppointments from './adminside/pages/OnlineAppointments';

import AdminReports from './adminside/pages/AdminReports';
import AdminOptometrist from './adminside/pages/AdminOptometrist';
import DoctorsPage from './adminside/pages/DoctorsPage';
import AdminClientView from './adminside/pages/AdminClientView';
import AdminUpdates from './adminside/pages/AdminUpdates';
import AdminHistory from './adminside/pages/AdminHistory';
import AdminSettings from './adminside/pages/AdminSettings';
import SiteEditor from './adminside/pages/SiteEditor';
import AdminLogin from './adminside/pages/AdminLogin';
import AdminSignup from './adminside/pages/AdminSignup';
import CashierLayout from './adminside/layouts/CashierLayout';
import CashierPOS from './adminside/pages/CashierPOS';
import CashierHistory from './adminside/pages/CashierHistory';
import Chatbot from './clientside/components/Chatbot';
import OnboardingGuide from './clientside/components/OnboardingGuide';
import SignInModal from './clientside/components/SignInModal';
import SignUpModal from './clientside/components/SignUpModal';
import EditorControls from './clientside/components/EditorControls';
import { useModal } from './context/ModalContext';
import { LanguageProvider } from './context/LanguageContext';
import TestConnection from './components/TestConnection';

import DoctorLayout from './doctorside/DoctorLayout';
import DoctorDashboard from './doctorside/DoctorDashboard';
import DoctorAppointments from './doctorside/DoctorAppointments';
import SessionForm from './doctorside/SessionForm';
import DoctorSchedule from './doctorside/DoctorSchedule';
import DoctorPatients from './doctorside/DoctorPatients';
import DoctorPatientDetails from './doctorside/DoctorPatientDetails';

function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <BrowsingHistoryProvider>
          <SiteSettingsProvider>
            <ModalProvider>
              <LanguageProvider>
                <AppContent />
              </LanguageProvider>
            </ModalProvider>
          </SiteSettingsProvider>
        </BrowsingHistoryProvider>
      </ShopProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthOpen, authMode, closeAuth } = useModal();

  return (
    <Router>
      <Chatbot />
      <OnboardingGuide />
      <EditorControls />
      <Routes>
        {/* Client Side Routes */}
        <Route path="/test-connection" element={<TestConnection />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<AuthenticatedHome />} />

        {/* Guest Routes (No prefix) */}
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/services" element={<Services />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />

        <Route path="/about" element={<About />} />

        {/* Authenticated Routes (With client- prefix) */}
        <Route path="/client-appointments" element={<Appointments />} />
        <Route path="/client-services" element={<Services />} />
        <Route path="/client-products" element={<Products />} />
        <Route path="/client-products/:id" element={<ProductDetails />} />

        <Route path="/client-about" element={<About />} />

        {/* Auth Routes - Standalone Pages */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-success" element={<LoginSuccess />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/search" element={<SearchResults />} />

        {/* User Account Pages */}
        <Route path="/client-my-appointments" element={<MyAppointments />} />


        {/* Admin Side Routes - Protected */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin/signup" element={<Navigate to="/signup" replace />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="users" element={<OnlineClients />} />
          <Route path="clients/:id" element={<ClientDetails />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="walk-in-appointments" element={<WalkInAppointments />} />
          <Route path="online-appointments" element={<OnlineAppointments />} />
          <Route path="walk-in-patients" element={<WalkInPatients />} />
          <Route path="patients/:id" element={<PatientDetails />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customer-details/:id" element={<CustomerDetails />} />

          <Route path="reports" element={<AdminReports />} />
          <Route path="updates" element={<AdminUpdates />} />
          <Route path="optometrist" element={<DoctorsPage />} />
          <Route path="doctor/:id" element={<AdminOptometrist />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="client-view" element={<AdminClientView />} />
          <Route path="site-editor" element={<SiteEditor />} />
          <Route path="history" element={<AdminHistory />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Cashier Routes - Protected */}
        <Route
          path="/cashier"
          element={
            <ProtectedRoute requireCashier={true}>
              <CashierLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CashierPOS />} />
          <Route path="history" element={<CashierHistory />} />
        </Route>

        {/* Doctor Module Routes - Protected */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute requireDoctor={true}>
              <DoctorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="appointments/:id/session" element={<SessionForm />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="patients/:id" element={<DoctorPatientDetails />} />
          <Route path="schedule" element={<DoctorSchedule />} />
        </Route>
      </Routes>

      {/* Conditionally render modals based on ModalContext */}
      {isAuthOpen && authMode === 'login' && (
        <SignInModal isOpen={isAuthOpen} onClose={closeAuth} />
      )}
      {isAuthOpen && authMode === 'register' && (
        <SignUpModal isOpen={isAuthOpen} onClose={closeAuth} />
      )}
    </Router>
  );
}

export default App;
