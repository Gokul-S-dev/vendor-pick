import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import 'bootstrap/dist/css/bootstrap.min.css'

const STATUS_CLASS = {
  Pending: 'bg-warning text-dark',
  Accepted: 'bg-success',
  Approved: 'bg-success',
  Rejected: 'bg-danger',
}

function getStatusLabel(status) {
  if (status === 'Accepted') return 'Approved'
  return status || 'Pending'
}

function formatCurrency(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function ViewQuotations() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const token = localStorage.getItem('supplierToken')
        const supplierId = localStorage.getItem('supplierId')
        const response = await axios.get(`/api/quotation/supplier/${supplierId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setQuotations(response.data?.quotations || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to fetch submitted quotations.')
      } finally {
        setLoading(false)
      }
    }

    fetchQuotations()
  }, [])

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4 py-md-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 mb-1 fw-bold">My Submitted Quotations</h1>
            <p className="text-secondary mb-0">Track all quotations you submitted for RFQs.</p>
          </div>
          <Link to="/dashboard" className="btn btn-outline-primary">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status" />
              <p className="mb-0 text-secondary">Loading submitted quotations...</p>
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          quotations.length > 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>RFQ ID</th>
                      <th>Material</th>
                      <th>Price / Unit</th>
                      <th>Shipping Cost</th>
                      <th>Delivery Lead Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((q) => (
                      <tr key={q._id || q.rfqId}>
                        <td className="fw-semibold">{q.rfqId}</td>
                        <td>{q.material}</td>
                        <td>{formatCurrency(q.pricePerUnit)}</td>
                        <td>{formatCurrency(q.shippingCost)}</td>
                        <td>{q.deliveryLeadTime} days</td>
                        <td>
                          <span className={`badge ${STATUS_CLASS[q.status] || 'bg-secondary'}`}>
                            {getStatusLabel(q.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <h5 className="mb-2">No Quotations Found</h5>
                <p className="text-secondary mb-0">You have not submitted any quotations yet.</p>
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}

export default ViewQuotations
