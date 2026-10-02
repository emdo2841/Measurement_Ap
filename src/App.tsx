import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AuthPanel from './components/AuthPanel'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/CalendarPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailsPage from './pages/ClientDetailsPage'
import OrdersPage from './pages/OrdersPage'
import ClientMeasurementsPage from './pages/ClientMeasurementsPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import MeasurementsPage from './pages/MeasurementsPage'
import MeasurementDetailsPage from './pages/MeasurementDetailsPage'
import SharedMeasurementPage from './pages/SharedMeasurementPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem('accessToken')))

    function handleExpiredSession() {
      localStorage.removeItem('accessToken')
      setIsAuthenticated(false)
    }

    window.addEventListener('auth:expired', handleExpiredSession)
    return () => window.removeEventListener('auth:expired', handleExpiredSession)
  }, [])

  function handleLogout() {
    localStorage.removeItem('accessToken')
    setIsAuthenticated(false)
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPanel onAuthenticated={() => setIsAuthenticated(true)} />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/shared/measurements/:token" element={<SharedMeasurementPage />} />

      <Route element={isAuthenticated ? <AppLayout onLogout={handleLogout} /> : <Navigate to="/" replace />}>
        <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/clients" element={<ClientsPage onLogout={handleLogout} />} />
        <Route path="/clients/:id" element={<ClientDetailsPage onLogout={handleLogout} />} />
        <Route path="/orders" element={<OrdersPage onLogout={handleLogout} />} />
        <Route path="/orders/:id" element={<OrderDetailsPage onLogout={handleLogout} />} />
        <Route path="/measurements" element={<MeasurementsPage onLogout={handleLogout} />} />
        <Route path="/measurements/client/:clientId" element={<ClientMeasurementsPage onLogout={handleLogout} />} />
        <Route
  path="/measurements/:id"
  element={
    isAuthenticated ? (
      <MeasurementDetailsPage onLogout={handleLogout} />
    ) : (
      <Navigate to="/" replace />
    )
  }
/>
        <Route path="/calendar" element={<CalendarPage onLogout={handleLogout} />} />
        <Route path="/settings" element={<SettingsPage onLogout={handleLogout} />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  )
}

export default App
