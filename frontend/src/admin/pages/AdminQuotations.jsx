import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { AllCommunityModule, createGrid, ModuleRegistry } from 'ag-grid-community'
import { Swiper, SwiperSlide } from 'swiper/react'
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules'
import { Toaster, toast } from 'react-hot-toast'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/AdminQuotations.css'

ModuleRegistry.registerModules([AllCommunityModule])

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

function formatDate(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeUrgencyTag(value) {
  const normalized = String(value || 'Normal').trim().toLowerCase()
  if (normalized === 'critical') return 'Critical'
  if (normalized === 'high') return 'High'
  return 'Normal'
}

function resolveGroupUrgency(items) {
  if (!Array.isArray(items) || items.length === 0) return 'Normal'
  const priority = { Normal: 1, High: 2, Critical: 3 }
  return items.reduce((current, item) => {
    const next = normalizeUrgencyTag(item?.urgencyTag)
    return priority[next] > priority[current] ? next : current
  }, 'Normal')
}

function AdminQuotations() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [approvingQuotationId, setApprovingQuotationId] = useState('')
  const [selectedQuotationIds, setSelectedQuotationIds] = useState([])
  const [activeCompareGroupKey, setActiveCompareGroupKey] = useState('')
  const [compareRowsByGroup, setCompareRowsByGroup] = useState({})
  const [compareLoadingByGroup, setCompareLoadingByGroup] = useState({})
  const [compareErrorByGroup, setCompareErrorByGroup] = useState({})
  const gridElementByGroupRef = useRef({})
  const gridApiByGroupRef = useRef({})

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('adminToken')
    return token ? { Authorization: 'Bearer ' + token } : {}
  }, [])

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const response = await axios.get('/api/quotation/admin', {
          headers: authHeaders,
        })

        setQuotations(response.data?.quotations || [])
        if ((response.data?.quotations || []).length > 0) {
          toast.success('Quotations loaded successfully.', { id: 'quotations-loaded' })
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to load quotations.'
        setErrorMessage(message)
        toast.error(message, { id: 'quotations-load-error' })
      } finally {
        setLoading(false)
      }
    }

    fetchQuotations()
  }, [authHeaders])

  const groupedQuotations = Object.values(
    quotations.reduce((accumulator, quotation) => {
      const productName = String(quotation.product || 'Unknown Product').trim()
      const groupKey = productName.toLowerCase()

      if (!accumulator[groupKey]) {
        accumulator[groupKey] = {
          product: productName,
          rfqIds: [],
          items: [],
        }
      }

      const rfqId = String(quotation.rfqId || '').trim()
      if (rfqId && !accumulator[groupKey].rfqIds.includes(rfqId)) {
        accumulator[groupKey].rfqIds.push(rfqId)
      }

      accumulator[groupKey].items.push(quotation)
      return accumulator
    }, {})
  )

  const getStatusClass = (status) => {
    if (status === 'Accepted' || status === 'Approved') return 'bg-success'
    if (status === 'Rejected') return 'bg-danger'
    return 'bg-warning text-dark'
  }

  const getStatusLabel = (status) => {
    if (status === 'Accepted') return 'Approved'
    return status || 'Pending'
  }

  const handleApproveQuotation = async (quotation) => {
    try {
      setApprovingQuotationId(quotation.id)
      await axios.patch(`/api/quotation/${quotation.id}/approve`, {}, {
        headers: authHeaders,
      })

      setQuotations((previous) => previous.map((item) => (
        item.id === quotation.id ? { ...item, status: 'Accepted' } : item
      )))
      toast.success('Quotation approved successfully.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve quotation.')
    } finally {
      setApprovingQuotationId('')
    }
  }

  const toggleSingleSelection = (quotationId) => {
    setSelectedQuotationIds((previous) => (
      previous.includes(quotationId)
        ? previous.filter((id) => id !== quotationId)
        : [...previous, quotationId]
    ))
  }

  const toggleGroupSelection = (groupItems) => {
    const groupIds = groupItems.map((item) => item.id)

    setSelectedQuotationIds((previous) => {
      const allGroupSelected = groupIds.every((id) => previous.includes(id))

      if (allGroupSelected) {
        return previous.filter((id) => !groupIds.includes(id))
      }

      return [...new Set([...previous, ...groupIds])]
    })
  }

  const openComparisonForGroup = async (groupKey, selectedGroupItems) => {
    if (selectedGroupItems.length < 2) {
      toast('Select at least 2 quotations to compare.', { icon: 'ℹ️' })
      return
    }

    setActiveCompareGroupKey(groupKey)
    setCompareLoadingByGroup((previous) => ({ ...previous, [groupKey]: true }))
    setCompareErrorByGroup((previous) => ({ ...previous, [groupKey]: '' }))
    const toastId = `compare-${groupKey}`
    toast.loading('Running AI comparison...', { id: toastId })

    const urgencyTag = resolveGroupUrgency(selectedGroupItems)

    try {
      const payload = {
        urgencyTag,
        quotes: selectedGroupItems.map((quotation) => ({
          quotationId: quotation.quotationId,
          supplierName: quotation.supplierName,
          price: Number(quotation.pricePerUnit || 0),
          shipping: Number(quotation.shippingCost || 0),
          deliveryDate: Number(quotation.deliveryLeadTime || 0),
          urgencyTag: normalizeUrgencyTag(quotation.urgencyTag),
        })),
      }

      const response = await axios.post('http://localhost:5001/predict', payload)
      const rows = Array.isArray(response.data?.results)
        ? response.data.results.map((item) => ({
            quotationId: item.quotationId || '',
            supplierName: item.supplierName || '',
            price: Number(item.price || 0),
            shipping: Number(item.shipping || 0),
            deliveryDate: Number(item.deliveryDate || 0),
            supplierScore: Number(item.supplier_score || item.supplierScore || 0),
            urgencyTag: normalizeUrgencyTag(item.urgencyTag || urgencyTag),
            recommended: Boolean(item.recommended),
          }))
        : []

      setCompareRowsByGroup((previous) => ({ ...previous, [groupKey]: rows }))
      toast.success('AI comparison is ready.', { id: toastId })
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch AI comparison.'
      setCompareErrorByGroup((previous) => ({
        ...previous,
        [groupKey]: message,
      }))
      setCompareRowsByGroup((previous) => ({ ...previous, [groupKey]: [] }))
      toast.error(message, { id: toastId })
    } finally {
      setCompareLoadingByGroup((previous) => ({ ...previous, [groupKey]: false }))
    }
  }

  useEffect(() => {
    const groupKey = activeCompareGroupKey
    if (!groupKey) return

    const element = gridElementByGroupRef.current[groupKey]
    const rowData = compareRowsByGroup[groupKey]

    if (!element || !Array.isArray(rowData) || rowData.length === 0) {
      return
    }

    if (gridApiByGroupRef.current[groupKey]) {
      gridApiByGroupRef.current[groupKey].destroy()
      gridApiByGroupRef.current[groupKey] = null
    }

    const gridApi = createGrid(element, {
      columnDefs: [
        {
          headerName: 'Rank',
          maxWidth: 92,
          sortable: false,
          filter: false,
          resizable: false,
          pinned: 'left',
          cellClass: 'compare-cell--center',
          cellRenderer: (params) => {
            const rank = (params.node?.rowIndex ?? 0) + 1
            const toneClass = rank === 1 ? 'compare-rank-pill--top' : 'compare-rank-pill'
            return `<span class="${toneClass}">#${rank}</span>`
          },
        },
        {
          field: 'supplierName',
          headerName: 'Supplier',
          minWidth: 220,
          cellRenderer: (params) => {
            const supplierName = escapeHtml(params.data?.supplierName || 'Supplier')
            const quotationId = escapeHtml(params.data?.quotationId || '')
            const supplierInitial = escapeHtml((params.data?.supplierName || 'S').charAt(0).toUpperCase())
            return `
              <div class="compare-supplier-cell">
                <span class="compare-supplier-cell__avatar">${supplierInitial}</span>
                <div class="compare-supplier-cell__body">
                  <div class="compare-supplier-cell__name">${supplierName}</div>
                  <div class="compare-supplier-cell__sub">${quotationId}</div>
                </div>
              </div>
            `
          },
        },
        {
          field: 'price',
          headerName: 'Price',
          minWidth: 135,
          cellRenderer: (params) => `
            <div class="compare-metric-cell">
              <span class="compare-metric-cell__value">${formatCurrency(params.value)}</span>
              <span class="compare-metric-cell__label">per unit</span>
            </div>
          `,
        },
        {
          field: 'shipping',
          headerName: 'Shipping',
          minWidth: 135,
          cellRenderer: (params) => `
            <div class="compare-metric-cell">
              <span class="compare-metric-cell__value">${formatCurrency(params.value)}</span>
              <span class="compare-metric-cell__label">delivery cost</span>
            </div>
          `,
        },
        {
          field: 'deliveryDate',
          headerName: 'Delivery (Days)',
          minWidth: 150,
          cellRenderer: (params) => {
            const days = Number(params.value || 0)
            const toneClass = days <= 3 ? 'compare-chip compare-chip--good' : days <= 7 ? 'compare-chip compare-chip--neutral' : 'compare-chip compare-chip--slow'
            return `<span class="${toneClass}">${days} day${days === 1 ? '' : 's'}</span>`
          },
        },
        {
          field: 'supplierScore',
          headerName: 'AI Score',
          minWidth: 180,
          sort: 'desc',
          comparator: (valueA, valueB) => Number(valueA || 0) - Number(valueB || 0),
          cellRenderer: (params) => {
            const score = Number(params.value || 0)
            const scoreText = score.toFixed(4)
            const width = Math.max(6, Math.min(100, score * 100))
            return `
              <div class="compare-score-cell">
                <div class="compare-score-cell__meta">
                  <span class="compare-score-cell__value">${scoreText}</span>
                  <span class="compare-score-cell__hint">confidence</span>
                </div>
                <div class="compare-score-cell__bar">
                  <span class="compare-score-cell__fill" style="width:${width}%"></span>
                </div>
              </div>
            `
          },
        },
        {
          field: 'recommended',
          headerName: 'Recommended',
          minWidth: 145,
          cellClass: 'compare-cell--center',
          cellRenderer: (params) => {
            if (params.value) {
              return '<span class="compare-recommend-badge compare-recommend-badge--yes">Top pick</span>'
            }
            return '<span class="compare-recommend-badge">Review</span>'
          },
        },
      ],
      rowData,
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
      },
      animateRows: true,
      domLayout: 'autoHeight',
      rowHeight: 84,
      headerHeight: 52,
      suppressCellFocus: true,
      onFirstDataRendered: (params) => {
        params.api.sizeColumnsToFit()
      },
      rowClassRules: {
        'compare-best-row': (params) => Boolean(params.data?.recommended),
      },
    })

    gridApiByGroupRef.current[groupKey] = gridApi
  }, [activeCompareGroupKey, compareRowsByGroup])

  useEffect(() => {
    const gridApis = gridApiByGroupRef.current

    return () => {
      Object.values(gridApis).forEach((gridApi) => {
        if (gridApi) {
          gridApi.destroy()
        }
      })
    }
  }, [])

  return (
    <div className="admin-quotations-page">
      <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
      <div className="container py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 className="admin-quotations-title mb-1">Supplier Quotations</h1>
            <p className="admin-quotations-subtitle mb-0">
              Review all supplier quotations grouped by product name.
            </p>
            <p className="mb-0 mt-1 text-secondary small">
              Selected quotations: {selectedQuotationIds.length}
            </p>
          </div>
          <Link to="/admin/dashboard" className="btn btn-outline-primary">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status" />
              <p className="mb-0 text-secondary">Loading quotations...</p>
            </div>
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && groupedQuotations.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <h5 className="mb-2">No quotations submitted yet</h5>
              <p className="text-secondary mb-0">
                Supplier quotes will appear here once they respond to RFQs.
              </p>
            </div>
          </div>
        ) : null}

        {!loading && !errorMessage && groupedQuotations.length > 0 ? (
          <div className="quotations-swiper-wrap">
            <Swiper
              modules={[Navigation, Pagination, Keyboard, A11y]}
              navigation
              pagination={{ clickable: true }}
              keyboard={{ enabled: true }}
              spaceBetween={18}
              slidesPerView={1}
              breakpoints={{
                992: { slidesPerView: 1 },
              }}
              className="quotations-swiper"
            >
            {groupedQuotations.map((group) => {
              const groupKey = String(group.product || 'unknown-product').toLowerCase()
              const groupDomId = groupKey.replace(/[^a-z0-9]+/g, '-')
              const groupIds = group.items.map((item) => item.id)
              const selectedInGroup = groupIds.filter((id) => selectedQuotationIds.includes(id)).length
              const allGroupSelected = groupIds.length > 0 && selectedInGroup === groupIds.length
              const selectedGroupItems = group.items.filter((item) => selectedQuotationIds.includes(item.id))
              const compareEnabled = selectedGroupItems.length >= 2
              const isCompareOpen = activeCompareGroupKey === groupKey && compareEnabled
              const groupUrgencyTag = resolveGroupUrgency(group.items)
              const selectedUrgencyTag = selectedGroupItems.length > 0
                ? resolveGroupUrgency(selectedGroupItems)
                : groupUrgencyTag

              return (
              <SwiperSlide key={groupKey}>
              <section className="quotation-group-card card border-0">
                <div className="card-body p-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                    <div>
                      <p className="quotation-group-eyebrow mb-1">
                        RFQs: {group.rfqIds.length ? group.rfqIds.join(', ') : 'N/A'}
                      </p>
                      <h2 className="quotation-group-title mb-1">{group.product}</h2>
                      <p className="text-secondary mb-0">{group.items.length} supplier quote(s)</p>
                      <p className="small mb-0 mt-1">
                        <span className={`compare-urgency compare-urgency--${groupUrgencyTag.toLowerCase()}`}>
                          Urgency: {groupUrgencyTag}
                        </span>
                      </p>
                    </div>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={!compareEnabled}
                        onClick={() => openComparisonForGroup(groupKey, selectedGroupItems)}
                      >
                        Compare Selected ({selectedGroupItems.length})
                      </button>
                      <div className="form-check mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`select-group-${groupDomId}`}
                          checked={allGroupSelected}
                          onChange={() => toggleGroupSelection(group.items)}
                        />
                        <label
                          className="form-check-label small text-secondary"
                          htmlFor={`select-group-${groupDomId}`}
                        >
                          Select all in this group ({selectedInGroup}/{groupIds.length})
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Supplier</th>
                          <th>Price / Unit</th>
                          <th>Shipping</th>
                          <th>Lead Time</th>
                          <th>Urgency</th>
                          <th>Tax</th>
                          <th>Status</th>
                          <th>Submitted</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((quotation) => (
                          <tr key={quotation.id}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedQuotationIds.includes(quotation.id)}
                                onChange={() => toggleSingleSelection(quotation.id)}
                                aria-label={`Select quotation ${quotation.quotationId}`}
                              />
                            </td>
                            <td>
                              <div className="fw-semibold">{quotation.supplierName}</div>
                              <div className="small text-secondary">{quotation.quotationId}</div>
                            </td>
                            <td>{formatCurrency(quotation.pricePerUnit)}</td>
                            <td>{formatCurrency(quotation.shippingCost)}</td>
                            <td>{quotation.deliveryLeadTime} days</td>
                            <td>
                              <span className={`compare-urgency compare-urgency--${normalizeUrgencyTag(quotation.urgencyTag).toLowerCase()}`}>
                                {normalizeUrgencyTag(quotation.urgencyTag)}
                              </span>
                            </td>
                            <td>{quotation.tax}%</td>
                            <td>
                              <span className={`badge ${getStatusClass(quotation.status)}`}>
                                {getStatusLabel(quotation.status)}
                              </span>
                            </td>
                            <td>{formatDate(quotation.createdAt)}</td>
                            <td>
                              {quotation.status === 'Accepted' || quotation.status === 'Approved' ? (
                                <span className="badge bg-success">Approved</span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  disabled={approvingQuotationId === quotation.id}
                                  onClick={() => handleApproveQuotation(quotation)}
                                >
                                  {approvingQuotationId === quotation.id ? 'Approving...' : 'Approve'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {isCompareOpen ? (
                    <div className="compare-panel mt-4">
                      <div className="compare-panel__header">
                        <div>
                          <h3 className="compare-panel__title mb-1">AI Comparison</h3>

                        </div>
                        <div className="compare-panel__legend">
                          <span className="compare-recommend-badge compare-recommend-badge--yes">Top pick</span>
                          <span className="compare-chip compare-chip--neutral">Sorted by AI score</span>
                        </div>
                      </div>
                      {compareLoadingByGroup[groupKey] ? (
                        <div className="alert alert-info mb-0" role="alert">Comparing selected quotations...</div>
                      ) : null}
                      {!compareLoadingByGroup[groupKey] && compareErrorByGroup[groupKey] ? (
                        <div className="alert alert-danger mb-0" role="alert">{compareErrorByGroup[groupKey]}</div>
                      ) : null}
                      {!compareLoadingByGroup[groupKey] && !compareErrorByGroup[groupKey] && (compareRowsByGroup[groupKey] || []).length > 0 ? (
                        <div
                          className="ag-theme-quartz compare-grid"
                          ref={(element) => {
                            if (element) {
                              gridElementByGroupRef.current[groupKey] = element
                            }
                          }}
                        />
                      ) : null}
                    </div>
                  ) : null}

                  {group.items.some((quotation) => quotation.notes) ? (
                    <div className="quotation-notes-wrap mt-4">
                      <h3 className="quotation-notes-title">Supplier Notes</h3>
                      <div className="d-grid gap-2">
                        {group.items
                          .filter((quotation) => quotation.notes)
                          .map((quotation) => (
                            <div key={`${quotation.id}-note`} className="quotation-note-item">
                              <strong>{quotation.supplierName}:</strong> {quotation.notes}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
              </SwiperSlide>
              )
            })}
            </Swiper>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default AdminQuotations
