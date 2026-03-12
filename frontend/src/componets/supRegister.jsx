import { createElement, useState } from 'react'
import axios from 'axios'
import { FaBoxOpen, FaEnvelope, FaIndustry, FaLock, FaMapMarkerAlt, FaPhoneAlt, FaTruck } from 'react-icons/fa'
import { ToastContainer, toast } from 'react-toastify'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-toastify/dist/ReactToastify.css'
import './supRegister.css'

const initialForm = {
  supplierName: '',
  companyName: '',
  email: '',
  phone: '',
  address: '',
  materialsSupplied: '',
  password: '',
}

function Field({ label, name, type = 'text', value, onChange, error, icon: Icon }) {
  const iconNode = createElement(Icon, { className: 'sup-register__field-icon' })

  return (
    <div className="col-md-6">
      <label htmlFor={name} className="form-label sup-register__label">
        {label}
      </label>
      <div className={`sup-register__input-group ${error ? 'is-invalid' : ''}`}>
        {iconNode}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className="form-control sup-register__control"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
    </div>
  )
}

function TextAreaField({ label, name, value, onChange, error, icon: Icon }) {
  const iconNode = createElement(Icon, { className: 'sup-register__field-icon sup-register__field-icon--textarea' })

  return (
    <div className="col-12">
      <label htmlFor={name} className="form-label sup-register__label">
        {label}
      </label>
      <div className={`sup-register__input-group sup-register__input-group--textarea ${error ? 'is-invalid' : ''}`}>
        {iconNode}
        <textarea
          id={name}
          name={name}
          rows="4"
          value={value}
          onChange={onChange}
          className="form-control sup-register__control sup-register__control--textarea"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
    </div>
  )
}

function SupRegister() {
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [serverError, setServerError] = useState('')

  const validateForm = () => {
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
      nextErrors.phone = 'Phone number is required.'
    } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      nextErrors.phone = 'Enter a valid phone number.'
    }

    if (!formData.address.trim()) {
      nextErrors.address = 'Address is required.'
    }

    if (!formData.materialsSupplied.trim()) {
      nextErrors.materialsSupplied = 'Materials supplied is required.'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }))

    setServerError('')
    setSuccessMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      toast.error('Please correct the highlighted fields.')
      return
    }

    try {
      setLoading(true)
      setServerError('')
      setSuccessMessage('')

      const response = await axios.post('/api/supplier/register', formData)
      const message = response?.data?.message || 'Supplier registration completed successfully.'

      setSuccessMessage(message)
      setFormData(initialForm)
      setErrors({})
      toast.success(message)
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to register supplier right now.'
      setServerError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="sup-register">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />

      <div className="container py-5">
        <div className="sup-register__shell row g-0 overflow-hidden">
          <div className="col-lg-5">
            <aside className="sup-register__panel h-100">
              <div className="sup-register__panel-overlay" />
              <div className="sup-register__panel-content">
                <span className="sup-register__eyebrow">
                  Supplier Onboarding Portal
                </span>

                <div className="mb-4">
                  <h1 className="sup-register__title">
                    Register your business and start supplying with confidence.
                  </h1>
                  <p className="sup-register__description">
                    Submit your supplier profile, materials catalog, and contact details through a clean,
                    verified registration workflow built for modern procurement teams.
                  </p>
                </div>

                <div className="sup-register__checklist card border-0">
                  <div className="card-body p-4 p-xl-4">
                    <h2 className="sup-register__checklist-title">Registration checklist</h2>
                    <ul className="sup-register__checklist-list mb-0">
                      <li>
                        <span className="sup-register__bullet" />
                        Verified business and supplier contact details
                      </li>
                      <li>
                        <span className="sup-register__bullet" />
                        Materials and product categories supplied
                      </li>
                      <li>
                        <span className="sup-register__bullet" />
                        Secure password for portal access
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="col-lg-7">
            <div className="sup-register__form-wrap">
              <div className="mb-4">
                <h2 className="sup-register__form-title">Supplier Registration</h2>
                <p className="sup-register__form-subtitle mb-0">
                  Complete the form below to create your supplier account.
                </p>
              </div>

              {successMessage ? (
                <div className="alert alert-success sup-register__alert" role="alert">
                  {successMessage}
                </div>
              ) : null}

              {serverError ? (
                <div className="alert alert-danger sup-register__alert" role="alert">
                  {serverError}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="row g-4">
                <Field
                  label="Supplier Name"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  error={errors.supplierName}
                  icon={FaTruck}
                />

                <Field
                  label="Company Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  error={errors.companyName}
                  icon={FaIndustry}
                />

                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  icon={FaEnvelope}
                />

                <Field
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  icon={FaPhoneAlt}
                />

                <TextAreaField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  icon={FaMapMarkerAlt}
                />

                <Field
                  label="Materials Supplied"
                  name="materialsSupplied"
                  value={formData.materialsSupplied}
                  onChange={handleChange}
                  error={errors.materialsSupplied}
                  icon={FaBoxOpen}
                />

                <div className="col-12">
                  <Field
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    icon={FaLock}
                  />
                </div>

                <div className="col-12 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn sup-register__submit-btn w-100"
                  >
                    {loading ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : null}
                    {loading ? 'Submitting Registration...' : 'Register Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SupRegister
