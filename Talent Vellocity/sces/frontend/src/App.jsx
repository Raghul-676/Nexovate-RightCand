import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './services/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProfileSetup from './pages/ProfileSetup'
import MyProfile from './pages/MyProfile'
import ProjectAnalysis from './pages/ProjectAnalysis'
import AdminDashboard from './pages/AdminDashboard'
import AdminStudentDetail from './pages/AdminStudentDetail'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile-setup" element={<PrivateRoute><ProfileSetup /></PrivateRoute>} />
          <Route path="/my-profile" element={<PrivateRoute><MyProfile /></PrivateRoute>} />
          <Route path="/project-analysis" element={<PrivateRoute><ProjectAnalysis /></PrivateRoute>} />
          <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/students/:id" element={<PrivateRoute><AdminStudentDetail /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
