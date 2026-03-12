import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/AdminDashboard.css'

// TEMP MODE: set to false when backend endpoint /api/admin/dashboard is ready.
const USE_TEMP_DASHBOARD_DATA = true

const TEMP_DASHBOARD_METRICS = {
  rfqs: 12,
  suppliers: 34,
  pendingQuotations: 8,
  acceptedQuotations: 5,
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState({
    rfqs: 0,
    suppliers: 0,
    pendingQuotations: 0,
    acceptedQuotations: 0,
  })
  const [suppliersList, setSuppliersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('adminToken')
    return token ? { Authorization: 'Bearer ' + token } : {}
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      // TEMP: load dummy data so UI works without backend.
      if (USE_TEMP_DASHBOARD_DATA) {
        setLoading(true)
        setErrorMessage('')

        setTimeout(() => {
          setMetrics(TEMP_DASHBOARD_METRICS)
          setLoading(false)
        }, 400)

        return
      }

      // BACKEND MODE: uncomment/keep this block for real API data.
      try {
        setLoading(true)
        setErrorMessage('')

        const response = await axios.get('/api/admin/dashboard', {
          headers: authHeaders,
        })

        setMetrics({
          rfqs: response.data?.rfqs ?? 0,
          suppliers: response.data?.suppliers ?? 0,
          pendingQuotations: response.data?.pendingQuotations ?? 0,
          acceptedQuotations: response.data?.acceptedQuotations ?? 0,
        })
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    const fetchAllSuppliers = async () => {
      try {
        const response = await axios.get('/api/admin/suppliers', {
          headers: authHeaders,
        })

        setSuppliersList(response.data?.suppliers || [])
      } catch (error) {
        console.error('Failed to fetch suppliers:', error.message)
      }
    }

    fetchDashboardData()
    fetchAllSuppliers()
  }, [authHeaders])

  return (
    <div className="admin-dashboard-page">
      <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="admin-dashboard-heading mb-0">Admin Dashboard</h2>
      </div>

      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="alert alert-info" role="alert">
          Loading dashboard...
        </div>
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card admin-metric-card h-100">
              <div className="card-body">
                <h6 className="admin-metric-title text-muted">Active RFQs</h6>
                <h3 className="admin-metric-value">{metrics.rfqs}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card admin-metric-card h-100">
              <div className="card-body">
                <h6 className="admin-metric-title text-muted">Registered Suppliers</h6>
                <h3 className="admin-metric-value">{metrics.suppliers}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card admin-metric-card h-100">
              <div className="card-body">
                <h6 className="admin-metric-title text-muted">Pending Quotations</h6>
                <h3 className="admin-metric-value">{metrics.pendingQuotations}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card admin-metric-card h-100">
              <div className="card-body">
                <h6 className="admin-metric-title text-muted">Accepted Quotations</h6>
                <h3 className="admin-metric-value">{metrics.acceptedQuotations}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card admin-nav-card">
        <div className="card-body">
          <h5 className="mb-3">Quick Navigation</h5>
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary admin-nav-button" onClick={() => navigate('/admin/suppliers')}>
              Supplier Management
            </button>
            <button type="button" className="btn btn-primary admin-nav-button" onClick={() => navigate('/admin/rfq')}>
              RFQ Management
            </button>
            <button type="button" className="btn btn-primary admin-nav-button" onClick={() => navigate('/admin/quotations')}>
              Quotation Monitoring
            </button>
            <button type="button" className="btn btn-primary admin-nav-button" onClick={() => navigate('/admin/comparison')}>
              Comparison Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="card admin-nav-card mt-4">
        <div className="card-body">
          <h5 className="mb-4">All Suppliers ({suppliersList.length})</h5>
          {suppliersList.length === 0 ? (
            <div className="alert alert-info" role="alert">
              No suppliers registered yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Supplier Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Products</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliersList.map((supplier) => (
                    <tr key={supplier.id}>
                      <td>
                        <strong>{supplier.supplierName}</strong>
                      </td>
                      <td>{supplier.companyName}</td>
                      <td>{supplier.email}</td>
                      <td>{supplier.phone}</td>
                      <td>
                        <small className="text-muted">{supplier.products || 'Not specified'}</small>
                      </td>
                      <td>
                        <span className={`badge ${supplier.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {supplier.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

export default AdminDashboard
