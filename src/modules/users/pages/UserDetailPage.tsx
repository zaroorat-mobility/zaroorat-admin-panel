import React from 'react'
import { useParams, Navigate } from 'react-router-dom'

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <Navigate to="/access-control/users" replace />
  }

  return <Navigate to={`/access-control/users?view=${id}`} replace />
}

export default UserDetailPage
