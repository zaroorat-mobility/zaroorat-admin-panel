import React from 'react'
import { useParams, Navigate } from 'react-router-dom'

export const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <Navigate to="/access-control/users" replace />
  }

  return <Navigate to={`/access-control/users/${id}?edit=true`} replace />
}

export default EditUserPage
