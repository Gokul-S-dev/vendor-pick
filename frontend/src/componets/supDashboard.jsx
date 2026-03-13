import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './supDashboard.css'

/* ── Badge colour per status ── */
const STATUS_CLASS = {
  Pending: 'badge-pending',
  'In Review': 'badge-review',
  Approved: 'badge-approved',
}

/* ── Friendly deadline formatting ── */
function formatDeadline(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Days-remaining chip ── */
function DaysLeft({ dateStr }) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  if (diff < 0)  return <span className="days-chip days-chip--overdue">Overdue</span>
  if (diff === 0) return <span className="days-chip days-chip--today">Due today</span>
  if (diff <= 3)  return <span className="days-chip days-chip--urgent">{diff}d left</span>
  return <span className="days-chip days-chip--ok">{diff}d left</span>
}

/* ── RFQ Card ── */
function RfqCard({ rfq, onView, onSubmitQuote }) {
  const canSubmitQuote = rfq.status === 'Pending'

  return (
    <div className="rfq-card">
      <div className="rfq-card__header">
        <span className="rfq-card__id">{rfq.rfqId}</span>
        <span className={`rfq-card__badge ${STATUS_CLASS[rfq.status] || 'badge-pending'}`}>
          {rfq.status}
        </span>
      </div>

      <h3 className="rfq-card__material">{rfq.material}</h3>

      <div className="rfq-card__meta">
        <div className="rfq-card__meta-item">
          <span className="rfq-card__meta-label">Quantity</span>
          <span className="rfq-card__meta-value">
            {rfq.quantity.toLocaleString()} {rfq.unit}
          </span>
        </div>
        <div className="rfq-card__meta-item">
          <span className="rfq-card__meta-label">Deadline</span>
          <span className="rfq-card__meta-value">{formatDeadline(rfq.deadline)}</span>
        </div>
        <div className="rfq-card__meta-item">
          <span className="rfq-card__meta-label">Location</span>
          <span className="rfq-card__meta-value">{rfq.location || 'N/A'}</span>
        </div>
      </div>

      <div className="rfq-card__footer">
        <DaysLeft dateStr={rfq.deadline} />
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn rfq-card__btn rfq-card__btn--outline"
            onClick={() => onView(rfq)}
          >
            View Details
          </button>
          {canSubmitQuote ? (
            <button
              type="button"
              className="btn rfq-card__btn"
              onClick={() => onSubmitQuote(rfq)}
            >
              Submit Quote
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ── Detail Modal ── */
function DetailModal({ rfq, onClose, onSubmitQuote }) {
  if (!rfq) return null
  const canSubmitQuote = rfq.status === 'Pending'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal__header">
          <h4 className="detail-modal__title">{rfq.rfqId}</h4>
          <button type="button" className="detail-modal__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="detail-modal__body">
          <div className="detail-row">
            <span className="detail-row__label">Material</span>
            <span className="detail-row__value">{rfq.material}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Quantity</span>
            <span className="detail-row__value">{rfq.quantity.toLocaleString()} {rfq.unit}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Deadline</span>
            <span className="detail-row__value">{formatDeadline(rfq.deadline)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Location</span>
            <span className="detail-row__value">{rfq.location || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Status</span>
            <span className={`rfq-card__badge ${STATUS_CLASS[rfq.status] || 'badge-pending'}`}>
              {rfq.status}
            </span>
          </div>
        </div>
        <div className="detail-modal__footer">
          <button type="button" className="btn detail-modal__dismiss" onClick={onClose}>
            Close
          </button>
          {canSubmitQuote ? (
            <button
              type="button"
              className="btn detail-modal__action"
              onClick={() => onSubmitQuote(rfq)}
            >
              Submit Quote
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ── Stat summary bar ── */
function StatBar({ rfqs }) {
  const total    = rfqs.length
  const approved = rfqs.filter((r) => r.status === 'Approved').length
  const review   = rfqs.filter((r) => r.status === 'In Review').length
  const pending  = rfqs.filter((r) => r.status === 'Pending').length
  return (
    <div className="stat-bar row g-3 mb-4">
      {[
        { label: 'Total RFQs',  value: total,    cls: 'stat--total'    },
        { label: 'Pending',     value: pending,  cls: 'stat--pending'  },
        { label: 'In Review',   value: review,   cls: 'stat--review'   },
        { label: 'Approved',    value: approved, cls: 'stat--approved' },
      ].map(({ label, value, cls }) => (
        <div key={label} className="col-6 col-md-3">
          <div className={`stat-card ${cls}`}>
            <p className="stat-card__value">{value}</p>
            <p className="stat-card__label">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
══════════════════════════════════════════ */
function Dashboard() {
  const navigate = useNavigate()
  const [rfqs,      setRfqs]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [selected,   setSelected]   = useState(null)
  const [filter,     setFilter]     = useState('All')
  const [search,     setSearch]     = useState('')
  const [supplier,   setSupplier]   = useState({
    supplierName: 'Supplier',
    companyName: '',
  })

  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        setLoading(true)
        setError('')

        // Get the supplier ID and token from localStorage
        // For now, we'll use a stored supplier ID or fetch from auth context
        const token = localStorage.getItem('supplierToken')
        const supplierId = localStorage.getItem('supplierId')

        if (!token) {
          setError('Authentication required. Please log in again.')
          setLoading(false)
          return
        }

        if (!supplierId) {
          // If supplierId is not in localStorage, we need to store it during login
          console.warn('Supplier ID not found in localStorage')
          setError('Supplier information not available.')
          setLoading(false)
          return
        }

        const response = await axios.get(`/api/rfq/supplier/${supplierId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setRfqs(response.data?.rfqs || [])

        // Fetch supplier profile for nav personalization.
        try {
          const profileResponse = await axios.get('/api/supplier/profile', {
            headers: { Authorization: `Bearer ${supplierId}` },
          })

          setSupplier({
            supplierName: profileResponse.data?.supplierName || 'Supplier',
            companyName: profileResponse.data?.companyName || '',
          })
        } catch (profileErr) {
          console.warn('Unable to load supplier profile details:', profileErr?.response?.data || profileErr.message)
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to load RFQs. Please try again.'
        setError(errorMsg)
        console.error('Error fetching RFQs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRfqs()
  }, [])

  const STATUSES = ['All', 'Pending', 'In Review', 'Approved']

  const displayed = rfqs
    .filter((r) => filter === 'All' || r.status === filter)
    .filter((r) =>
      r.material.toLowerCase().includes(search.toLowerCase()) ||
      r.rfqId.toLowerCase().includes(search.toLowerCase())
    )

  const avatarInitial = (supplier.supplierName || 'S').trim().charAt(0).toUpperCase()

  return (
    <div className="dashboard-root">
      {/* ── Top nav bar ── */}
      <header className="dash-nav">
        <div className="dash-nav__brand">
          <div className="dash-nav__logo" />
          <span className="dash-nav__name">Vendor Pulse</span>
        </div>
        <div className="dash-nav__actions">
          <div className="dash-nav__user">
            <p className="dash-nav__user-name">{supplier.supplierName || 'Supplier'}</p>
            <p className="dash-nav__user-company">{supplier.companyName || 'Vendor Partner'}</p>
          </div>
          <div className="dash-nav__avatar">
            <span>{avatarInitial}</span>
          </div>
          <button
            type="button"
            className="btn dash-nav__logout"
            onClick={() => {
              localStorage.removeItem('supplierToken')
              localStorage.removeItem('supplierId')
              window.location.href = '/login'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main container-fluid py-4">
        {/* Page title */}
        <div className="dash-heading mb-4 d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <h1 className="dash-heading__title">RFQ Dashboard</h1>
            <p className="dash-heading__sub">
              Manage your assigned Requests For Quotation
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => navigate('/supplier/quotations')}
            >
              View My Quotations
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate('/supplier/notifications')}
            >
              View Notifications
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/supplier/profile')}
            >
              Manage Profile
            </button>
          </div>
        </div>

        {/* Stat bar */}
        {!loading && !error && <StatBar rfqs={rfqs} />}

        {/* Toolbar: search + filter */}
        {!loading && !error && (
          <div className="dash-toolbar row g-3 align-items-center mb-4">
            <div className="col-12 col-md-5">
              <div className="dash-toolbar__search-wrap">
                <input
                  type="text"
                  className="form-control dash-toolbar__search"
                  placeholder="Search by RFQ ID or material…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-7">
              <div className="dash-toolbar__filters d-flex gap-2 flex-wrap">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`btn dash-filter-btn ${filter === s ? 'dash-filter-btn--active' : ''}`}
                    onClick={() => setFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* States */}
        {loading && (
          <div className="dash-state dash-state--loading">
            <div className="spinner-border dash-state__spinner" role="status" />
            <p className="dash-state__text">Loading your RFQs…</p>
          </div>
        )}

        {error && (
          <div className="dash-state dash-state--error">
            <p className="dash-state__icon">⚠️</p>
            <p className="dash-state__text">{error}</p>
            <button
              type="button"
              className="btn dash-state__retry"
              onClick={() => { setError(''); setLoading(true); }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="dash-state dash-state--empty">
            <p className="dash-state__icon">📭</p>
            <p className="dash-state__text">No RFQs match your current filters.</p>
          </div>
        )}

        {/* RFQ grid */}
        {!loading && !error && displayed.length > 0 && (
          <div className="rfq-grid row g-4">
            {displayed.map((rfq) => (
              <div key={rfq._id} className="col-12 col-sm-6 col-xl-4">
                <RfqCard
                  rfq={rfq}
                  onView={(r) => setSelected(r)}
                  onSubmitQuote={(r) => navigate('/submit-quotation/' + r.rfqId)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail modal */}
      <DetailModal
        rfq={selected}
        onClose={() => setSelected(null)}
        onSubmitQuote={(r) => { setSelected(null); navigate('/submit-quotation/' + r.rfqId) }}
      />
    </div>
  )
}

export default Dashboard
