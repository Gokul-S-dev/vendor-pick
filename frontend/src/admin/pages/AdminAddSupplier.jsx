import { useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/AdminAddSupplier.css'

const initialForm = {
  supplierName: '',
  email: '',
  phone: '',
  companyName: '',
  gstNumber: '',
  address: '',
  password: '',
  products: '',
}

function AdminAddSupplier() {
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('adminToken')
    return token ? { Authorization: 'Bearer ' + token } : {}
  }, [])

  const validate = () => {
    const nextErrors = {}

    if (!formData.supplierName.trim()) {
      nextErrors.supplierName = 'Supplier name is required.'
    }

    if (!formData.companyName.trim()) {
      nextErrors.companyName = 'Company name is required.'
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone is required.'
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      nextErrors.phone = 'Enter a valid 10-digit phone number.'
    }

    if (!formData.password.trim()) {
      nextErrors.password = 'Password is required.'
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))

    setSuccessMessage('')
    setErrorMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    try {
      setLoading(true)
      setSuccessMessage('')
      setErrorMessage('')

      const payload = {
        name: formData.supplierName,
        supplierName: formData.supplierName,
        companyName: formData.companyName,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        gstNumber: formData.gstNumber.trim(),
        address: formData.address.trim(),
        products: formData.products.trim(),
        password: formData.password,
      }

      await axios.post('/api/admin/suppliers', payload, {
        headers: authHeaders,
      })

      setSuccessMessage('Supplier added successfully.')
      setFormData(initialForm)
      setErrors({})
    } catch (error) {
      const status = error?.response?.status

      if (status === 404) {
        setErrorMessage('Add supplier API is not ready yet. Expected endpoint: POST /api/admin/suppliers')
      } else {
        setErrorMessage(error?.response?.data?.message || 'Failed to add supplier.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-add-supplier-page">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="admin-add-supplier-title mb-0">Add Supplier</h2>
          <Link to="/admin/dashboard" className="btn btn-outline-secondary admin-back-button">
            Back to Dashboard
          </Link>
        </div>

        <div className="card admin-add-supplier-card">
          <div className="card-body p-4">
            {successMessage ? (
              <div className="alert alert-success" role="alert">
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="alert alert-danger" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="supplierName" className="form-label">Supplier Name</label>
                  <input
                    id="supplierName"
                    name="supplierName"
                    type="text"
                    className={'form-control admin-add-input ' + (errors.supplierName ? 'is-invalid' : '')}
                    value={formData.supplierName}
                    onChange={handleChange}
                    placeholder="Enter supplier name"
                  />
                  {errors.supplierName ? <div className="invalid-feedback">{errors.supplierName}</div> : null}
                </div>

                <div className="col-md-6">
                  <label htmlFor="companyName" className="form-label">Company Name</label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    className={'form-control admin-add-input ' + (errors.companyName ? 'is-invalid' : '')}
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                  />
                  {errors.companyName ? <div className="invalid-feedback">{errors.companyName}</div> : null}
                </div>

                <div className="col-md-6">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={'form-control admin-add-input ' + (errors.email ? 'is-invalid' : '')}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="supplier@example.com"
                  />
                  {errors.email ? <div className="invalid-feedback">{errors.email}</div> : null}
                </div>

                <div className="col-md-6">
                  <label htmlFor="phone" className="form-label">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    className={'form-control admin-add-input ' + (errors.phone ? 'is-invalid' : '')}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit phone number"
                  />
                  {errors.phone ? <div className="invalid-feedback">{errors.phone}</div> : null}
                </div>

                <div className="col-md-6">
                  <label htmlFor="gstNumber" className="form-label">GST Number</label>
                  <input
                    id="gstNumber"
                    name="gstNumber"
                    type="text"
                    className="form-control admin-add-input"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="Enter GST number"
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="password" className="form-label">Temporary Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className={'form-control admin-add-input ' + (errors.password ? 'is-invalid' : '')}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                  />
                  {errors.password ? <div className="invalid-feedback">{errors.password}</div> : null}
                </div>

                <div className="col-12">
                  <label htmlFor="address" className="form-label">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    className="form-control admin-add-input"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter supplier address"
                  />

                <div className="col-12">
                  <label htmlFor="products" className="form-label">Products/Services</label>
                  <textarea
                    id="products"
                    name="products"
                    rows="3"
                    className="form-control admin-add-input"
                    value={formData.products}
                    onChange={handleChange}
                    placeholder="Enter products or services provided by this supplier (e.g., Electronics, Hardware, Software, etc.)"
                  />
                </div>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-primary admin-add-submit" disabled={loading}>
                  {loading ? 'Adding Supplier...' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAddSupplier
