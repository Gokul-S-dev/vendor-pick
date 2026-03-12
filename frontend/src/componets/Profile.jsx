import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import 'bootstrap/dist/css/bootstrap.min.css'

const INITIAL_PROFILE = {
  supplierName: '',
  companyName: '',
  email: '',
  phone: '',
  address: '',
  materialsSupplied: '',
  password: '',
}

function Profile() {
  const [formData, setFormData] = useState(INITIAL_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('supplierToken')
        const response = await axios.get('/api/supplier/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setFormData({
          ...INITIAL_PROFILE,
          ...response.data,
          password: '',
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile details.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('supplierToken')
      const payload = { ...formData }
      if (!payload.password.trim()) {
        delete payload.password
      }

      await axios.put('/api/supplier/profile', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setSuccess('Profile updated successfully.')
      setFormData((prev) => ({ ...prev, password: '' }))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4 py-md-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">Manage Supplier Profile</h1>
            <p className="text-secondary mb-0">Update your business and contact information.</p>
          </div>
          <Link to="/dashboard" className="btn btn-outline-primary">Back to Dashboard</Link>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-md-5">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="text-secondary mb-0">Loading profile...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="row g-3">
                {error ? <div className="alert alert-danger">{error}</div> : null}
                {success ? <div className="alert alert-success">{success}</div> : null}

                <div className="col-md-6">
                  <label className="form-label">Supplier Name</label>
                  <input name="supplierName" value={formData.supplierName} onChange={handleChange} className="form-control" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Company Name</label>
                  <input name="companyName" value={formData.companyName} onChange={handleChange} className="form-control" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className="form-control" />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="form-control" />
                </div>
                <div className="col-12">
                  <label className="form-label">Address</label>
                  <input name="address" value={formData.address} onChange={handleChange} className="form-control" />
                </div>
                <div className="col-12">
                  <label className="form-label">Materials Supplied</label>
                  <textarea
                    name="materialsSupplied"
                    rows="3"
                    value={formData.materialsSupplied}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Password (optional update)</label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Leave blank to keep existing password"
                  />
                </div>
                <div className="col-12 d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
