import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SupLogin from './componets/supLogin'
import SupRegister from './componets/supRegister'
import Dashboard from './componets/supDashboard'
import SubmitQuotation from './componets/subQuote'
import ViewQuotations from './componets/viewQuotations'
import Notifications from './componets/Notifications'
import Profile from './componets/Profile'
import AdminDashboard from './admin/AdminDashboard'
import AdminAddSupplier from './admin/pages/AdminAddSupplier'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"      element={<SupLogin />} />
        <Route path="/register"   element={<SupRegister />} />
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/submit-quotation/:rfqId" element={<SubmitQuotation />} />
        <Route path="/supplier/quotations" element={<ViewQuotations />} />
        <Route path="/supplier/notifications" element={<Notifications />} />
        <Route path="/supplier/profile" element={<Profile />} />
        {/* <Route path="/admin/login" element={<AdminLogin />} /> */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/suppliers" element={<AdminAddSupplier />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
