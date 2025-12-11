import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import ClientPortal from './ClientPortal'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/portal" element={<ClientPortal />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)