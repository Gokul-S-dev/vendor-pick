import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import 'bootstrap/dist/css/bootstrap.min.css'

const TYPE_META = {
  RFQ: { label: 'RFQ', cls: 'bg-primary' },
  Deadline: { label: 'Deadline', cls: 'bg-warning text-dark' },
  Accepted: { label: 'Accepted', cls: 'bg-success' },
  Rejected: { label: 'Rejected', cls: 'bg-danger' },
}

function getType(notification) {
  if (notification.type) return notification.type
  const message = (notification.message || '').toLowerCase()
  if (message.includes('deadline')) return 'Deadline'
  if (message.includes('accepted')) return 'Accepted'
  if (message.includes('rejected')) return 'Rejected'
  return 'RFQ'
}

function normalizeNotifications(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.notifications)) return payload.notifications
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('supplierToken')
        const response = await axios.get('/api/notifications/supplier', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setNotifications(normalizeNotifications(response.data))
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch notifications.')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4 py-md-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">Supplier Notifications</h1>
            <p className="text-secondary mb-0">Stay updated with RFQs and quotation status changes.</p>
          </div>
          <Link to="/dashboard" className="btn btn-outline-primary">Back to Dashboard</Link>
        </div>

        {loading ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status" />
              <p className="text-secondary mb-0">Loading notifications...</p>
            </div>
          </div>
        ) : null}

        {!loading && error ? <div className="alert alert-danger">{error}</div> : null}

        {!loading && !error ? (
          notifications.length > 0 ? (
            <div className="list-group shadow-sm">
              {notifications.map((n, index) => {
                const type = getType(n)
                const meta = TYPE_META[type] || TYPE_META.RFQ
                const message = n.message || n.text || n.title || 'Notification'
                return (
                  <div
                    key={n._id || `${type}-${index}`}
                    className="list-group-item d-flex justify-content-between align-items-start gap-3"
                  >
                    <div>
                      <p className="mb-1 fw-medium">{message}</p>
                      {n.createdAt ? (
                        <small className="text-secondary">
                          {new Date(n.createdAt).toLocaleString('en-IN')}
                        </small>
                      ) : null}
                    </div>
                    <span className={`badge ${meta.cls}`}>{meta.label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5 text-center">
                <h5 className="mb-2">No Notifications</h5>
                <p className="text-secondary mb-0">You have no new notifications at this time.</p>
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}

export default Notifications
