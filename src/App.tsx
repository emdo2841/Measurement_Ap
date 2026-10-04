import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import AuthPanel from './components/AuthPanel'
import AppLayout from './components/layout/AppLayout'
import PublicLegalLayout from './components/layout/PublicLegalLayout'
import AcceptableUsePage from './pages/AcceptableUsePage'
import CalendarPage from './pages/CalendarPage'
import ClientDetailsPage from './pages/ClientDetailsPage'
import ClientMeasurementsPage from './pages/ClientMeasurementsPage'
import ClientsPage from './pages/ClientsPage'
import CookiePolicyPage from './pages/CookiePolicyPage'
import Dashboard from './pages/Dashboard'
import MeasurementDetailsPage from './pages/MeasurementDetailsPage'
import MeasurementsPage from './pages/MeasurementsPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import OrdersPage from './pages/OrdersPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import SettingsPage from './pages/SettingsPage'
import SharedMeasurementPage from './pages/SharedMeasurementPage'
import TermsConditionsPage from './pages/TermsConditionsPage'
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('accessToken')),
  )

  useEffect(() => {
    function handleExpiredSession() {
      localStorage.removeItem('accessToken')
      setIsAuthenticated(false)
    }

    window.addEventListener('auth:expired', handleExpiredSession)

    return () => {
      window.removeEventListener('auth:expired', handleExpiredSession)
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem('accessToken')
    setIsAuthenticated(false)
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPanel onAuthenticated={() => setIsAuthenticated(true)} />
          )
        }
      />

      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/shared/measurements/:token" element={<SharedMeasurementPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="*" element={<NotFoundPage />} />

      {/* Public pages: no authentication required. */}
      <Route element={<PublicLegalLayout />}>
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="/acceptable-use" element={<AcceptableUsePage />} />
      </Route>

      {/* Authenticated application pages. */}
      <Route
        element={
          isAuthenticated ? (
            <AppLayout onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      >
        <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/clients" element={<ClientsPage onLogout={handleLogout} />} />
        <Route path="/clients/:id" element={<ClientDetailsPage onLogout={handleLogout} />} />
        <Route path="/orders" element={<OrdersPage onLogout={handleLogout} />} />
        <Route path="/orders/:id" element={<OrderDetailsPage onLogout={handleLogout} />} />
        <Route path="/measurements" element={<MeasurementsPage onLogout={handleLogout} />} />
        <Route path="/measurements/client/:clientId" element={<ClientMeasurementsPage onLogout={handleLogout} />} />
        <Route path="/measurements/:id" element={<MeasurementDetailsPage onLogout={handleLogout} />} />
        <Route path="/calendar" element={<CalendarPage onLogout={handleLogout} />} />
        <Route path="/settings" element={<SettingsPage onLogout={handleLogout} />} />

      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />}
      />
    </Routes>
  )
}

export default App
