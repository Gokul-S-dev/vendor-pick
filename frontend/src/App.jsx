import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SupLogin from './componets/supLogin'
import SupRegister from './componets/supRegister'
import Dashboard from './componets/supDashboard'
import SubmitQuotation from './componets/subQuote'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"      element={<SupLogin />} />
        <Route path="/register"   element={<SupRegister />} />
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/submit-quotation/:rfqId" element={<SubmitQuotation />} />
        <Route path="*"           element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
