import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { GlobalAccessibility } from './components/GlobalAccessibility'
import { PageAnnouncements } from './components/PageAnnouncements'
import { VoiceHoverListener } from './components/VoiceHoverListener'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ScreenReaderProvider } from './hooks/useScreenReader'
import { AccessibilitySettingsProvider } from './contexts/AccessibilitySettingsContext'
import { AccessibilityInit } from './components/AccessibilityInit'
import { Welcome, Record, Admin, Login, SignUp, Library } from './pages'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <AccessibilityInit />
        <AccessibilitySettingsProvider>
        <ScreenReaderProvider>
        <GlobalAccessibility />
        <PageAnnouncements />
        <VoiceHoverListener />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Welcome />} />
              <Route path="/record" element={<Record />} />
              <Route path="/library" element={<Library />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ScreenReaderProvider>
        </AccessibilitySettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
