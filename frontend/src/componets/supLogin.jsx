import { createElement, useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { FaEnvelope, FaLock, FaSignInAlt, FaShieldAlt } from 'react-icons/fa'
import { ToastContainer, toast } from 'react-toastify'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-toastify/dist/ReactToastify.css'
import './supLogin.css'

const initialForm = {
  email: '',
  password: '',
}

function Field({ label, name, type = 'text', value, onChange, error, icon: Icon }) {
  const iconNode = createElement(Icon, { className: 'sup-login__field-icon' })

  return (
    <div className="mb-4">
      <label htmlFor={name} className="form-label sup-login__label">
        {label}
      </label>
      <div className={`sup-login__input-group ${error ? 'is-invalid' : ''}`}>
        {iconNode}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className="form-control sup-login__control"
          placeholder={`Enter ${label.toLowerCase()}`}
          autoComplete={type === 'password' ? 'current-password' : 'email'}
        />
      </div>
      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
    </div>
  )
}

function SupLogin() {
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const navigate = useNavigate()

  const validate = () => {
    const next = {}

    if (!formData.email.trim()) {
      next.email = 'Email or Supplier ID is required.'
    } else if (
      formData.email.includes('@') &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      next.email = 'Enter a valid email address.'
    }

    if (!formData.password) {
      next.password = 'Password is required.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    try {
      setLoading(true)
      setServerError('')

      const response = await axios.post('http://localhost:3000/api/admin/login', formData)
      const token = response?.data?.token
      const role = response?.data?.role
      const redirectTo = response?.data?.redirectTo
      const userId = response?.data?.user?.id

      if (token) {
        if (role === 'admin') {
          localStorage.setItem('adminToken', token)
        } else {
          localStorage.setItem('supplierToken', token)
          localStorage.setItem('supplierId', userId)
        }
      }

      const nextPath = redirectTo || (role === 'admin' ? '/admin/dashboard' : '/dashboard')

      toast.success('Login successful! Redirecting…')
      setTimeout(() => navigate(nextPath), 1000)
    } catch (err) {
      const message =
        err.response?.status === 401
          ? 'Invalid email or password.'
          : err.response?.data?.message || 'Login failed. Please try again.'
      setServerError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="sup-login">
      <ToastContainer position="top-right" autoClose={2200} theme="colored" />

      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">

            {/* Brand mark */}
            <div className="text-center mb-4">
              <div className="sup-login__brand-icon mx-auto mb-3">
                <FaShieldAlt />
              </div>
              <h1 className="sup-login__brand-name">Vendor Pulse</h1>
              <p className="sup-login__brand-tagline">Supplier Portal</p>
            </div>

            {/* Card */}
            <div className="sup-login__card card border-0">
              <div className="card-body p-4 p-sm-5">
                <h2 className="sup-login__title">Welcome back</h2>
                <p className="sup-login__subtitle mb-4">
                  Sign in to your supplier account to continue.
                </p>

                {serverError ? (
                  <div className="alert sup-login__alert-error" role="alert">
                    {serverError}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} noValidate>
                  <Field
                    label="Email or Supplier ID"
                    name="email"
                    type="text"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    icon={FaEnvelope}
                  />

                  <Field
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    icon={FaLock}
                  />

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check sup-login__remember">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="remember"
                      />
                      <label className="form-check-label" htmlFor="remember">
                        Remember me
                      </label>
                    </div>
                    <a href="#forgot" className="sup-login__forgot-link">
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn sup-login__submit-btn w-100 mb-3"
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Signing in…
                      </>
                    ) : (
                      <>
                        <FaSignInAlt className="me-2" />
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center sup-login__register-prompt mb-0">
                  New supplier?{' '}
                  <Link to="/register" className="sup-login__register-link">
                    Create an account
                  </Link>
                </p>
              </div>
            </div>

            <p className="text-center sup-login__footer mt-4">
              © {new Date().getFullYear()} Vendor Pulse. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SupLogin
