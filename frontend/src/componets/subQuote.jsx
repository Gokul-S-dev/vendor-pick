import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'
import 'bootstrap/dist/css/bootstrap.min.css'
import './subQuote.css'

const INITIAL = {
  pricePerUnit:     '',
  shippingCost:     '',
  deliveryLeadTime: '',
  tax:              '',
  notes:            '',
}

/* ── Field row helper ── */
function FormField({ id, label, type = 'text', value, onChange, error, placeholder, required, prefix, suffix }) {
  return (
    <div className="sq-field">
      <label htmlFor={id} className="sq-label">
        {label}
        {required && <span className="sq-required">*</span>}
        {!required && <span className="sq-optional">(optional)</span>}
      </label>
      <div className={'sq-input-group' + (error ? ' sq-input-group--error' : '')}>
        {prefix && <span className="sq-input-prefix">{prefix}</span>}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          className="form-control sq-control"
          placeholder={placeholder}
          min={type === 'number' ? '0' : undefined}
          step={type === 'number' ? 'any' : undefined}
        />
        {suffix && <span className="sq-input-suffix">{suffix}</span>}
      </div>
      {error && <p className="sq-field-error">{error}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════
   SUBMIT QUOTATION PAGE
══════════════════════════════════════════ */
function SubmitQuotation() {
  const { rfqId }       = useParams()
  const navigate        = useNavigate()

  const [form,     setForm]     = useState(INITIAL)
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [serverErr,setServerErr]= useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setErrors((p) => ({ ...p, [name]: '' }))
    setServerErr('')
  }

  const validate = () => {
    const next = {}
    if (!form.pricePerUnit.toString().trim())
      next.pricePerUnit = 'Price per unit is required.'
    else if (isNaN(form.pricePerUnit) || Number(form.pricePerUnit) <= 0)
      next.pricePerUnit = 'Enter a valid price greater than 0.'

    if (!form.shippingCost.toString().trim())
      next.shippingCost = 'Shipping cost is required.'
    else if (isNaN(form.shippingCost) || Number(form.shippingCost) < 0)
      next.shippingCost = 'Enter a valid shipping cost (0 or more).'

    if (!form.deliveryLeadTime.toString().trim())
      next.deliveryLeadTime = 'Delivery lead time is required.'
    else if (!Number.isInteger(Number(form.deliveryLeadTime)) || Number(form.deliveryLeadTime) <= 0)
      next.deliveryLeadTime = 'Lead time must be a positive number of days.'

    if (form.tax && (isNaN(form.tax) || Number(form.tax) < 0 || Number(form.tax) > 100))
      next.tax = 'Tax must be a percentage between 0 and 100.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      rfqId,
      supplierId: localStorage.getItem('supplierId'),
      pricePerUnit:     Number(form.pricePerUnit),
      shippingCost:     Number(form.shippingCost),
      deliveryLeadTime: Number(form.deliveryLeadTime),
      tax:              form.tax ? Number(form.tax) : 0,
      notes:            form.notes.trim(),
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('supplierToken')
      await axios.post('/api/quotation/submit', payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch (err) {
      setServerErr(err.response?.data?.message || 'Failed to submit quotation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="sq-root">
        <div className="sq-success-screen">
          <div className="sq-success-icon">✅</div>
          <h2 className="sq-success-title">Quotation Submitted!</h2>
          <p className="sq-success-sub">
            Your quote for <strong>{rfqId}</strong> has been sent successfully.
            <br />Redirecting to dashboard…
          </p>
          <div className="spinner-border sq-success-spinner" role="status" />
        </div>
      </div>
    )
  }

  /* ── Form ── */
  return (
    <div className="sq-root">
      {/* Nav */}
      <header className="sq-nav">
        <div className="sq-nav__brand">
          <div className="sq-nav__logo" />
          <span className="sq-nav__name">Vendor Pulse</span>
        </div>
        <Link to="/dashboard" className="sq-nav__back">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="sq-main container">
        {/* Page header */}
        <div className="sq-page-header">
          <div>
            <p className="sq-page-eyebrow">Responding to</p>
            <h1 className="sq-page-title">Submit Quotation</h1>
            <p className="sq-page-sub">
              RFQ <span className="sq-rfq-chip">{rfqId}</span>
            </p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7">
            <div className="sq-card">
              <div className="sq-card__bar" />

              {/* Section: Pricing */}
              <p className="sq-section-heading">Pricing</p>
              <div className="row g-4">
                <div className="col-md-6">
                  <FormField
                    id="pricePerUnit" label="Price Per Unit" type="number"
                    value={form.pricePerUnit} onChange={handleChange}
                    error={errors.pricePerUnit} placeholder="e.g. 95"
                    required prefix="₹"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    id="shippingCost" label="Shipping Cost" type="number"
                    value={form.shippingCost} onChange={handleChange}
                    error={errors.shippingCost} placeholder="e.g. 500"
                    required prefix="₹"
                  />
                </div>
                <div className="col-md-6">
                  <FormField
                    id="tax" label="Tax" type="number"
                    value={form.tax} onChange={handleChange}
                    error={errors.tax} placeholder="e.g. 5"
                    suffix="%"
                  />
                </div>
              </div>

              <hr className="sq-divider" />

              {/* Section: Order */}
              <p className="sq-section-heading">Order Details</p>
              <div className="row g-4">
                <div className="col-md-6">
                  <FormField
                    id="deliveryLeadTime" label="Delivery Lead Time" type="number"
                    value={form.deliveryLeadTime} onChange={handleChange}
                    error={errors.deliveryLeadTime} placeholder="e.g. 10"
                    required suffix="days"
                  />
                </div>
              </div>

              <hr className="sq-divider" />

              {/* Section: Notes */}
              <p className="sq-section-heading">Additional Notes</p>
              <div>
                <label htmlFor="notes" className="sq-label">
                  Notes <span className="sq-optional">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="4"
                  className="form-control sq-control sq-textarea"
                  placeholder="e.g. Can deliver faster for bulk orders, special packaging available…"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>

              {/* Server error */}
              {serverErr && (
                <div className="alert alert-danger sq-server-error mt-4" role="alert">
                  ⚠️ {serverErr}
                </div>
              )}

              {/* Actions */}
              <div className="sq-actions">
                <Link to="/dashboard" className="btn sq-btn-cancel">
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn sq-btn-submit"
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</>
                    : '🚀  Submit Quotation'
                  }
                </button>
              </div>
            </div>

            {/* Preview summary */}
            {(form.pricePerUnit || form.shippingCost || form.deliveryLeadTime) && (
              <div className="sq-preview">
                <p className="sq-preview__title">Quote Preview</p>
                <div className="row g-3">
                  {[
                    ['Price / unit', form.pricePerUnit ? '₹ ' + Number(form.pricePerUnit).toLocaleString() : '—'],
                    ['Shipping',     form.shippingCost  ? '₹ ' + Number(form.shippingCost).toLocaleString()   : '—'],
                    ['Lead time',    form.deliveryLeadTime ? form.deliveryLeadTime + ' days'                   : '—'],
                    ['Tax',          form.tax           ? form.tax + '%'                                       : '0%'],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="col-6 col-md-4">
                      <div className="sq-preview__item">
                        <p className="sq-preview__lbl">{lbl}</p>
                        <p className="sq-preview__val">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default SubmitQuotation
