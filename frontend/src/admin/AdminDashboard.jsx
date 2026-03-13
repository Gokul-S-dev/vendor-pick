import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { FaRegStar, FaStar } from 'react-icons/fa'

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
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState({
    rfqs: 0,
    suppliers: 0,
    pendingQuotations: 0,
    acceptedQuotations: 0,
  })
  const [suppliersList, setSuppliersList] = useState([])
  const [rfqHistory, setRfqHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
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
    urgencyTag: 'Normal',
  })
  const [rfqLoading, setRfqLoading] = useState(false)
  const [rfqError, setRfqError] = useState('')
  const [ratingSavingId, setRatingSavingId] = useState('')

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('adminToken')
    return token ? { Authorization: 'Bearer ' + token } : {}
  }, [])

  const fetchRfqHistory = useCallback(async () => {
    try {
      setHistoryLoading(true)
      const response = await axios.get('/api/rfq/history', {
        headers: authHeaders,
      })
      setRfqHistory(response.data?.history || [])
    } catch (error) {
      console.error('RFQ History Fetch Error:', error)
    } finally {
      setHistoryLoading(false)
    }
  }, [authHeaders])

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
      urgencyTag: 'Normal',
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
      urgencyTag: 'Normal',
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
          urgencyTag: rfqForm.urgencyTag,
          supplierId: selectedSupplier.id,
          supplierName: selectedSupplier.supplierName,
        },
        { headers: authHeaders }
      )

      alert(`RFQ ${response.data.rfq.rfqId} sent to ${selectedSupplier.supplierName} successfully!`)
      handleCloseRfqModal()
      fetchRfqHistory()
    } catch (error) {
      setRfqError(error.response?.data?.message || 'Failed to send RFQ. Please try again.')
      console.error('Error sending RFQ:', error)
    } finally {
      setRfqLoading(false)
    }
  }

  const handleRateSupplier = async (supplierId, ratingValue) => {
    try {
      setRatingSavingId(supplierId)

      await axios.patch(
        `/api/admin/suppliers/${supplierId}/rating`,
        { rating: ratingValue },
        { headers: authHeaders }
      )

      setSuppliersList((previous) => previous.map((supplier) => (
        supplier.id === supplierId ? { ...supplier, rating: ratingValue } : supplier
      )))
    } catch (error) {
      console.error('Supplier rating update failed:', error)
      alert(error.response?.data?.message || 'Failed to update supplier rating.')
    } finally {
      setRatingSavingId('')
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
    fetchRfqHistory()
  }, [authHeaders, fetchRfqHistory])

  return (
    <div className="adm-root">

      {/* ── Top Nav ── */}
      <nav className="adm-nav">
        <div className="adm-nav__brand">
          <div className="adm-nav__logo" />
          <span className="adm-nav__name">Vendor Pulse</span>
        </div>
        <div className="adm-nav__actions">
          <button
            type="button"
            className="adm-nav__action-btn"
            onClick={() => navigate('/admin/quotations')}
          >
            View Quotations
          </button>
          <button
            type="button"
            className="adm-nav__action-btn adm-nav__action-btn--primary"
            onClick={() => navigate('/admin/suppliers')}
          >
            Add Supplier
          </button>
          <div className="adm-nav__avatar">A</div>
          <button
            type="button"
            className="adm-nav__logout"
            onClick={() => {
              localStorage.removeItem('adminToken')
              navigate('/admin/login')
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── Main Canvas ── */}
      <main className="adm-main">

        {/* Heading */}
        <div className="adm-heading mb-4">
          <h2 className="adm-heading__title">Admin Dashboard</h2>
          <p className="adm-heading__sub">Manage your suppliers and RFQ workflow</p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger mb-4" role="alert">{errorMessage}</div>
        )}

        {/* ── Stat Cards ── */}
        <div className="row g-3 mb-5">
          <div className="col-6 col-md-3">
            <div className="adm-stat adm-stat--total">
              <div className="adm-stat__value">{loading ? '–' : metrics.rfqs}</div>
              <div className="adm-stat__label">Total RFQs</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="adm-stat adm-stat--pending">
              <div className="adm-stat__value">{loading ? '–' : metrics.pendingQuotations}</div>
              <div className="adm-stat__label">Pending Quotations</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="adm-stat adm-stat--review">
              <div className="adm-stat__value">{loading ? '–' : metrics.suppliers}</div>
              <div className="adm-stat__label">Registered Suppliers</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="adm-stat adm-stat--approved">
              <div className="adm-stat__value">{loading ? '–' : metrics.acceptedQuotations}</div>
              <div className="adm-stat__label">Accepted Quotations</div>
            </div>
          </div>
        </div>

        {/* ── Suppliers Section ── */}
        <div className="adm-section mb-5">
          <div className="adm-section__header mb-3">
            <h4 className="adm-section__title">All Suppliers ({suppliersList.length})</h4>
          </div>

          {suppliersList.length === 0 ? (
            <div className="adm-empty">No suppliers registered yet.</div>
          ) : (
            <div className="row g-4">
              {suppliersList.map((supplier) => (
                <div key={supplier.id} className="col-md-6 col-lg-4">
                  <div className="adm-supplier-card">

                    {/* Card Header */}
                    <div className="adm-supplier-card__header">
                      <div className="adm-supplier-card__avatar">
                        {(supplier.supplierName || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="adm-supplier-card__info">
                        <div className="adm-supplier-card__name">{supplier.supplierName}</div>
                        <div className="adm-supplier-card__company">{supplier.companyName}</div>
                      </div>
                      <span className={`adm-badge ${supplier.status === 'active' ? 'adm-badge--active' : 'adm-badge--inactive'}`}>
                        {supplier.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Card Meta */}
                    <div className="adm-supplier-card__meta">
                      <div className="adm-supplier-card__meta-row">
                        <span className="adm-supplier-card__meta-label">Products</span>
                        <span className="adm-supplier-card__meta-value">{supplier.products || '—'}</span>
                      </div>
                      <div className="adm-supplier-card__meta-row">
                        <span className="adm-supplier-card__meta-label">Email</span>
                        <span className="adm-supplier-card__meta-value" style={{ wordBreak: 'break-word' }}>{supplier.email}</span>
                      </div>
                      <div className="adm-supplier-card__meta-row">
                        <span className="adm-supplier-card__meta-label">Phone</span>
                        <span className="adm-supplier-card__meta-value">{supplier.phone}</span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="adm-supplier-card__rating">
                      <span className="adm-supplier-card__meta-label">Rating</span>
                      <div className="d-flex align-items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((starValue) => (
                          <button
                            key={starValue}
                            type="button"
                            className="btn p-0 border-0 bg-transparent"
                            disabled={ratingSavingId === supplier.id}
                            onClick={() => handleRateSupplier(supplier.id, starValue)}
                            aria-label={`Rate ${supplier.supplierName} ${starValue} stars`}
                          >
                            {Number(supplier.rating || 0) >= starValue ? (
                              <FaStar color="#f59e0b" size={16} />
                            ) : (
                              <FaRegStar color="#94a3b8" size={16} />
                            )}
                          </button>
                        ))}
                        <span className="adm-supplier-card__rating-val">
                          {Number(supplier.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="adm-supplier-card__actions">
                      <button
                        type="button"
                        className="adm-btn adm-btn--outline"
                        onClick={() => console.log('View supplier details:', supplier.id)}
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn--primary"
                        onClick={() => handleOpenRfqModal(supplier)}
                      >
                        Send RFQ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RFQ History Section ── */}
        <div className="adm-section mb-5">
          <div className="adm-section__header mb-3">
            <h4 className="adm-section__title">RFQ Send History ({rfqHistory.length})</h4>
          </div>

          {historyLoading ? (
            <div className="adm-empty">Loading RFQ history...</div>
          ) : rfqHistory.length === 0 ? (
            <div className="adm-empty">No RFQ history yet.</div>
          ) : (
            <div className="table-responsive adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>RFQ ID</th>
                    <th>Product</th>
                    <th>Urgency</th>
                    <th>Supplier</th>
                    <th>Price</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqHistory.map((item) => (
                    <tr key={item.id}>
                      <td><span className="adm-table__rfq-id">{item.rfqId}</span></td>
                      <td>{item.product}</td>
                      <td>
                        <span className={`adm-badge ${String(item.urgencyTag || 'Normal') === 'Critical' ? 'adm-badge--critical' : String(item.urgencyTag || 'Normal') === 'High' ? 'adm-badge--high' : 'adm-badge--normal'}`}>
                          {item.urgencyTag || 'Normal'}
                        </span>
                      </td>
                      <td>{item.supplierName}</td>
                      <td>₹{Number(item.price || 0).toLocaleString('en-IN')}</td>
                      <td>{item.location}</td>
                      <td>
                        <span className={`adm-badge ${item.status === 'Approved' ? 'adm-badge--approved' : item.status === 'In Review' ? 'adm-badge--review' : 'adm-badge--pending'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="adm-table__date">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

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
                    <label htmlFor="urgencyTag" className="form-label">
                      Urgency Tag <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="urgencyTag"
                      name="urgencyTag"
                      value={rfqForm.urgencyTag}
                      onChange={handleRfqFormChange}
                      disabled={rfqLoading}
                      required
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <small className="text-muted">
                      Critical RFQs prioritize faster delivery in AI comparison.
                    </small>
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
  )
}

export default AdminDashboard
