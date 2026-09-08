import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role } = useSelector(
    (state) => state.auth
  )

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={`/${role}/dashboard`} replace />
  }

  return children
}

export default ProtectedRoute