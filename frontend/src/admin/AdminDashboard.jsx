import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/AdminDashboard.css'

// TEMP MODE: set to false when backend endpoint /api/admin/dashboard is ready.
const USE_TEMP_DASHBOARD_DATA = false

const TEMP_DASHBOARD_METRICS = {
  rfqs: 12,
  suppliers: 34,
  pendingQuotations: 8,
  acceptedQuotations: 5,
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    rfqs: 0,
    suppliers: 0,
    pendingQuotations: 0,
    acceptedQuotations: 0,
  })
  const [suppliersList, setSuppliersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [showRfqModal, setShowRfqModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [rfqForm, setRfqForm] = useState({
    product: '',
    price: '',
    unit: '',
    deliveryTime: '',
    location: '',
  })
  const [rfqLoading, setRfqLoading] = useState(false)
  const [rfqError, setRfqError] = useState('')

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('adminToken')
    return token ? { Authorization: 'Bearer ' + token } : {}
  }, [])

  const handleOpenRfqModal = (supplier) => {
    setSelectedSupplier(supplier)
    setShowRfqModal(true)
    setRfqError('')
    setRfqForm({
      product: '',
      price: '',
      unit: '',
      deliveryTime: '',
      location: '',
    })
  }

  const handleCloseRfqModal = () => {
    setShowRfqModal(false)
    setSelectedSupplier(null)
    setRfqForm({
      product: '',
      price: '',
      unit: '',
      deliveryTime: '',
      location: '',
    })
    setRfqError('')
  }

  const handleRfqFormChange = (e) => {
    const { name, value } = e.target
    setRfqForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmitRfq = async (e) => {
    e.preventDefault()

    // Validation
    if (!rfqForm.product.trim()) {
      setRfqError('Product is required.')
      return
    }
    if (!rfqForm.price || isNaN(rfqForm.price) || rfqForm.price < 0) {
      setRfqError('Please enter a valid price.')
      return
    }
    if (!rfqForm.unit.trim()) {
      setRfqError('Unit is required.')
      return
    }
    if (!rfqForm.deliveryTime) {
      setRfqError('Delivery time is required.')
      return
    }
    if (!rfqForm.location.trim()) {
      setRfqError('Location is required.')
      return
    }

    try {
      setRfqLoading(true)
      setRfqError('')

      const response = await axios.post(
        '/api/rfq/send-to-supplier',
        {
          product: rfqForm.product,
          price: parseFloat(rfqForm.price),
          unit: rfqForm.unit,
          quantity: 1,
          deliveryTime: rfqForm.deliveryTime,
          location: rfqForm.location,
          supplierId: selectedSupplier.id,
          supplierName: selectedSupplier.supplierName,
        },
        { headers: authHeaders }
      )

      alert(`RFQ ${response.data.rfq.rfqId} sent to ${selectedSupplier.supplierName} successfully!`)
      handleCloseRfqModal()
    } catch (error) {
      setRfqError(error.response?.data?.message || 'Failed to send RFQ. Please try again.')
      console.error('Error sending RFQ:', error)
    } finally {
      setRfqLoading(false)
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('=== Fetching Dashboard Data ===')
      console.log('USE_TEMP_DASHBOARD_DATA:', USE_TEMP_DASHBOARD_DATA)
      console.log('Auth Headers:', authHeaders)
      
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

        // console.log('Dashboard Data Response:', response.data)
        setMetrics({
          rfqs: response.data?.rfqs ?? 0,
          suppliers: response.data?.suppliers ?? 0,
          pendingQuotations: response.data?.pendingQuotations ?? 0,
          acceptedQuotations: response.data?.acceptedQuotations ?? 0,
        })
      } catch (error) {
        console.error('Dashboard Error - Full Details:')
        console.error('Error Object:', error)
        console.error('Response Status:', error.response?.status)
        console.error('Response Data:', error.response?.data)
        console.error('Error Message:', error.message)
        console.error('Auth Headers:', authHeaders)
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
        console.error('Suppliers Fetch Error:')
        console.error('Error Object:', error)
        console.error('Response Status:', error.response?.status)
        console.error('Response Data:', error.response?.data)
        console.error('Error Message:', error.message)
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


      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">All Suppliers ({suppliersList.length})</h4>
        </div>

        {suppliersList.length === 0 ? (
          <div className="alert alert-info" role="alert">
            No suppliers registered yet.
          </div>
        ) : (
          <div className="row g-4">
            {suppliersList.map((supplier) => (
              <div key={supplier.id} className="col-md-6 col-lg-4">
                <div className="card supplier-card h-100 border-0" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="text-primary fw-bold mb-1">ID: {supplier.id.slice(-6)}</h6>
                        <h5 className="mb-0" style={{ fontSize: '1.1rem' }}>
                          {supplier.supplierName}
                        </h5>
                      </div>
                      <span className={`badge ${supplier.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                        {supplier.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-muted small mb-2">
                        <strong>Company:</strong> {supplier.companyName}
                      </p>
                      <p className="text-muted small mb-2">
                        <strong>Products:</strong> {supplier.products || 'Not specified'}
                      </p>
                    </div>

                    <div className="border-top pt-3 mt-auto">
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <small className="text-muted d-block">EMAIL</small>
                          <small className="fw-bold" style={{ wordBreak: 'break-word' }}>
                            {supplier.email}
                          </small>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">PHONE</small>
                          <small className="fw-bold">{supplier.phone}</small>
                        </div>
                      </div>

                      <div className="d-grid gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => console.log('View supplier details:', supplier.id)}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => handleOpenRfqModal(supplier)}
                        >
                          Send RFQ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RFQ Modal */}
      {showRfqModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Send RFQ to {selectedSupplier?.supplierName}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseRfqModal}
                  disabled={rfqLoading}
                />
              </div>
              <div className="modal-body">
                {rfqError && (
                  <div className="alert alert-danger" role="alert">
                    {rfqError}
                  </div>
                )}
                <form onSubmit={handleSubmitRfq}>
                  <div className="mb-3">
                    <label htmlFor="product" className="form-label">
                      Product <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="product"
                      name="product"
                      value={rfqForm.product}
                      onChange={handleRfqFormChange}
                      placeholder="e.g., Steel Pipe"
                      disabled={rfqLoading}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="price" className="form-label">
                        Price <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="price"
                        name="price"
                        value={rfqForm.price}
                        onChange={handleRfqFormChange}
                        placeholder="0.00"
                        step="0.01"
                        disabled={rfqLoading}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="unit" className="form-label">
                        Unit <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="unit"
                        name="unit"
                        value={rfqForm.unit}
                        onChange={handleRfqFormChange}
                        placeholder="e.g., kg, liters"
                        disabled={rfqLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="deliveryTime" className="form-label">
                      Delivery Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="deliveryTime"
                      name="deliveryTime"
                      value={rfqForm.deliveryTime}
                      onChange={handleRfqFormChange}
                      disabled={rfqLoading}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="location" className="form-label">
                      Location <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="location"
                      name="location"
                      value={rfqForm.location}
                      onChange={handleRfqFormChange}
                      placeholder="e.g., New York, NY"
                      disabled={rfqLoading}
                      required
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseRfqModal}
                  disabled={rfqLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSubmitRfq}
                  disabled={rfqLoading}
                >
                  {rfqLoading ? 'Sending...' : 'Send RFQ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminDashboard
