import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { DocumentControllerPage } from '../pages/DocumentControllerPage'

export const DocumentControllerRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<DocumentControllerPage />} />
    </Routes>
  )
}

export default DocumentControllerRoutes
