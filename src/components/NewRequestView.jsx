import React, { useState, useMemo } from 'react'
import { Search, RotateCcw, Calendar, AlertTriangle, CheckCircle2, X, ShoppingCart, Package } from 'lucide-react'
import { BRANCHES, CURATED_CATALOG } from '../data/seedData'

export default function NewRequestView({
  state,
  branchFilter,
  role,
  lang,
  t,
  onSaveStockCheck,
  onSubmitPR,
  onNavigate,
}) {
  const activeBranch = branchFilter === 'all' ? 'boho' : branchFilter
  const branchObj = BRANCHES.find((b) => b.id === activeBranch) || BRANCHES[0]
  const canSeePrices = role.canViewPrices

  const [viewMode, setViewMode] = useState('quick') // quick | photo | poster
  const [catFilter, setCatFilter] = useState('Food')
  const [search, setSearch] = useState('')
  const [neededBy, setNeededBy] = useState('2026-11-21')
  const [quantities, setQuantities] = useState({})
  const [checkItem, setCheckItem] = useState(null)
  const [countedInput, setCountedInput] = useState('')
  const [showBasket, setShowBasket] = useState(false)
  const [priority, setPriority] = useState('Normal')
  const [reason, setReason] = useState('Replenishment')

  const posterBranchData = state.posterSnapshot?.branches?.[activeBranch]

  const itemsList = useMemo(() => {
    if (viewMode === 'poster' && posterBranchData) {
      return posterBranchData.items
        .filter((it) => !search || it.name.toLowerCase().includes(search.toLowerCase()) || it.poster_id.includes(search))
        .map((it) => ({
          id: `POS-${activeBranch}-${it.poster_id}`,
          posterId: it.poster_id,
          name: it.name,
          nameAr: it.name,
          spec: `Poster ID #${it.poster_id}`,
          category: 'Poster Live',
          unit: it.unit,
          packFactor: 1,
          emoji: '📦',
          stock: it.poster_stock,
          target: Math.max(it.min_limit || 10, it.poster_stock + 5),
          incoming: 0,
          lastPaid: it.prime_cost > 0 ? it.prime_cost : null,
          ceiling: it.prime_cost > 0 ? Math.round(it.prime_cost * 1.05) : null,
          checkPolicy: 'Optional',
          defaultSupplier: posterBranchData.suppliers?.[0]?.name || 'Approved Supplier',
        }))
    }

    return CURATED_CATALOG.filter((it) => it.category === catFilter)
      .filter((it) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          it.name.toLowerCase().includes(q) ||
          it.nameAr.includes(search) ||
          it.spec.toLowerCase().includes(q) ||
          (it.posterId && it.posterId.includes(q))
        )
      })
      .map((it) => ({
        ...it,
        stock: it.posterStock[activeBranch] ?? 0,
        target: it.targetCoverage[activeBranch] ?? 10,
        incoming: it.incomingQty[activeBranch] ?? 0,
        lastPaid: it.lastPaidPoster,
        ceiling: it.approvedCeiling,
      }))
  }, [viewMode, catFilter, search, activeBranch, posterBranchData])

  const selectedLines = useMemo(() => {
    const allPossible = [
      ...CURATED_CATALOG.map((it) => ({
        ...it,
        stock: it.posterStock[activeBranch] ?? 0,
        lastPaid: it.lastPaidPoster,
        ceiling: it.approvedCeiling,
      })),
      ...(posterBranchData?.items || []).map((it) => ({
        id: `POS-${activeBranch}-${it.poster_id}`,
        name: it.name,
        nameAr: it.name,
        category: 'Food',
        unit: it.unit,
        emoji: '📦',
        lastPaid: it.prime_cost > 0 ? it.prime_cost : 0,
        ceiling: it.prime_cost > 0 ? Math.round(it.prime_cost * 1.05) : 0,
        defaultSupplier: posterBranchData?.suppliers?.[0]?.name || 'Approved Supplier',
      })),
    ]
    return Object.entries(quantities)
      .filter(([, q]) => Number(q) > 0)
      .map(([id, qty]) => {
        const meta = allPossible.find((x) => x.id === id)
        return meta ? { ...meta, qty: Number(qty) } : null
      })
      .filter(Boolean)
  }, [quantities, activeBranch, posterBranchData])

  const openCheckDrawer = (item) => {
    setCheckItem(item)
    setCountedInput(String(Math.max(0, item.stock - 1)))
  }

  const handleRepeatPrev = () => {
    setQuantities({
      'CAT-CHK': 8,
      'CAT-TOM': 10,
    })
  }

  const handleSubmitBasket = () => {
    if (selectedLines.length === 0) return
    onSubmitPR({
      branchId: activeBranch,
      neededBy,
      priority,
      reason,
      lines: selectedLines,
    })
    setQuantities({})
    setShowBasket(false)
    onNavigate('my_requests')
  }

  const checkDiff = checkItem ? Number((Number(countedInput || 0) - checkItem.stock).toFixed(3)) : 0
  const planningQty = checkItem
    ? Math.max(0, Number((checkItem.target - Number(countedInput || 0) - checkItem.incoming).toFixed(3)))
    : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.newRequest}</h1>
          <p className="page-subtitle">
            {lang === 'ar' ? branchObj.nameAr : branchObj.name} ·{' '}
            {lang === 'ar' ? 'الأسعار مخفية للأدوار غير المصرح بها (ACC02)' : 'Quick order & targeted stock checks'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="pill pill-amber">
            <AlertTriangle size={14} /> {state.stockChecks.filter((c) => c.branchId === activeBranch && c.status === 'Open').length} targeted checks due
          </span>
          <span className="pill pill-green">
            {t.posterSnapshot} · {posterBranchData?.total_ingredients_in_poster || 0} items
          </span>
        </div>
      </div>

      {/* Mode & Category Controls */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div className="seg-group">
            <button className={`seg-btn ${viewMode === 'quick' ? 'active' : ''}`} onClick={() => setViewMode('quick')}>
              {t.quickList}
            </button>
            <button className={`seg-btn ${viewMode === 'photo' ? 'active' : ''}`} onClick={() => setViewMode('photo')}>
              {t.photoCatalogue}
            </button>
            <button className={`seg-btn ${viewMode === 'poster' ? 'active' : ''}`} onClick={() => setViewMode('poster')}>
              <Package size={14} style={{ marginInlineEnd: 5 }} />
              Poster Live ({posterBranchData?.items?.length || 0})
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="select-pill">
              <Calendar size={15} />
              <span>{t.neededBy}:</span>
              <input
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
                style={{ border: 'none', outline: 'none', fontWeight: 600, background: 'transparent' }}
              />
            </div>
            <button className="btn btn-outline" onClick={handleRepeatPrev}>
              <RotateCcw size={15} /> {t.repeatPrev}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {viewMode !== 'poster' && (
            <div className="seg-group">
              {[
                ['Food', t.food],
                ['Drinks', t.drinks],
                ['Cleaning', t.cleaning],
                ['Non-food', t.nonFoodCat],
              ].map(([k, label]) => (
                <button
                  key={k}
                  className={`seg-btn ${catFilter === k ? 'active' : ''}`}
                  onClick={() => setCatFilter(k)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
            <Search size={16} style={{ position: 'absolute', top: 11, insetInlineStart: 12, color: 'var(--text-light)' }} />
            <input
              className="input"
              style={{ width: '100%', paddingInlineStart: 36 }}
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick List / Poster Table */}
      {viewMode !== 'photo' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item / Spec</th>
                <th>Poster stock</th>
                <th>Target / Incoming</th>
                <th>{t.lastPaidPoster}</th>
                <th>Request qty</th>
                <th>Check</th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((item) => {
                const qty = quantities[item.id] ?? ''
                const showTotalLitres = item.volumePerUnitL && Number(qty) > 0
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="item-cell">
                        <div className="item-thumb">{item.emoji}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {lang === 'ar' ? item.nameAr : item.name}{' '}
                            <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>{item.unit}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.spec}</div>
                        </div>
                      </div>
                    </td>
                    <td><strong>{item.stock} {item.unit}</strong></td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      Target {item.target} · In {item.incoming}
                    </td>
                    <td>
                      {canSeePrices ? (
                        item.lastPaid ? (
                          <strong>EGP {item.lastPaid}</strong>
                        ) : (
                          <span className="pill pill-gray">Unknown</span>
                        )
                      ) : (
                        <span className="pill pill-gray">{t.priceRestricted}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="input"
                          style={{ width: 88 }}
                          placeholder="0"
                          value={qty}
                          onChange={(e) =>
                            setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                        />
                        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{item.unit}</span>
                      </div>
                      {showTotalLitres && (
                        <div style={{ fontSize: 11.5, color: 'var(--green-text)', marginTop: 3 }}>
                          = {Number(qty) * item.packFactor} bottles ({(Number(qty) * item.packFactor * item.volumePerUnitL).toFixed(2)} L)
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn ${item.checkPolicy === 'Count due' ? 'btn-outline' : 'btn-outline'}`}
                        style={{
                          minHeight: 32,
                          fontSize: 12,
                          background: item.checkPolicy === 'Count due' ? 'var(--amber-bg)' : undefined,
                          color: item.checkPolicy === 'Count due' ? 'var(--amber-text)' : undefined,
                          borderColor: item.checkPolicy === 'Count due' ? 'var(--amber-border)' : undefined,
                        }}
                        onClick={() => openCheckDrawer(item)}
                      >
                        {item.checkPolicy}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="photo-grid">
          {itemsList.map((item) => (
            <div key={item.id} className="photo-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 34 }}>{item.emoji}</span>
                <span className={`pill ${item.checkPolicy === 'Count due' ? 'pill-amber' : 'pill-gray'}`}>
                  {item.checkPolicy}
                </span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{lang === 'ar' ? item.nameAr : item.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.spec}</div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Stock: <strong>{item.stock} {item.unit}</strong>
                {canSeePrices && item.lastPaid ? ` · EGP ${item.lastPaid}/${item.unit}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <input
                  type="number"
                  min="0"
                  className="input"
                  style={{ flex: 1 }}
                  placeholder={`Qty (${item.unit})`}
                  value={quantities[item.id] ?? ''}
                  onChange={(e) => setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />
                <button className="btn btn-outline" onClick={() => openCheckDrawer(item)}>Check</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <div className="sticky-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShoppingCart size={20} />
          <strong>{selectedLines.length} items selected</strong>
          {canSeePrices && selectedLines.length > 0 && (
            <span style={{ opacity: 0.85, fontSize: 13 }}>
              · Est. EGP {selectedLines.reduce((acc, l) => acc + (l.lastPaid || 0) * l.qty, 0).toLocaleString()}
            </span>
          )}
        </div>
        <button
          className="btn btn-outline"
          style={{ background: '#fff', color: 'var(--primary)', borderColor: '#fff' }}
          disabled={selectedLines.length === 0}
          onClick={() => setShowBasket(true)}
        >
          {t.reviewRequest} →
        </button>
      </div>

      {/* Inline Targeted Stock Check Drawer */}
      {checkItem && (
        <div className="drawer-backdrop" onClick={() => setCheckItem(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 19 }}>Check {checkItem.name}</h2>
              <button className="btn btn-outline" style={{ minHeight: 34, padding: '0 8px' }} onClick={() => setCheckItem(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="item-thumb" style={{ width: 52, height: 52, fontSize: 28 }}>{checkItem.emoji}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{checkItem.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Per {checkItem.unit} · {branchObj.name}</div>
              </div>
            </div>

            <div className="grid-equal-2">
              <div className="card" style={{ background: 'var(--bg-subtle)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Poster stock</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{checkItem.stock} {checkItem.unit}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Counted physically</div>
                <input
                  type="number"
                  step="any"
                  className="input"
                  style={{ width: '100%', fontWeight: 700, fontSize: 18 }}
                  value={countedInput}
                  onChange={(e) => setCountedInput(e.target.value)}
                />
              </div>
            </div>

            {checkDiff !== 0 && (
              <div className="notice notice-amber">
                <AlertTriangle size={18} />
                <div>
                  <strong>Difference: {checkDiff > 0 ? `+${checkDiff}` : checkDiff} {checkItem.unit}</strong>
                  <div style={{ fontSize: 12 }}>Creates discrepancy task assigned to Restaurant Manager.</div>
                </div>
              </div>
            )}

            <div className="card" style={{ background: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Request planning (STK04–05)</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>Target through {neededBy}:</span>
                <strong>{checkItem.target} {checkItem.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span>Confirmed incoming:</span>
                <strong>{checkItem.incoming} {checkItem.unit}</strong>
              </div>
              <div className="notice notice-green" style={{ justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Planning quantity:</span>
                <span>{planningQty} {checkItem.unit}</span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={() => {
                onSaveStockCheck({
                  branchId: activeBranch,
                  item: checkItem,
                  countedQty: Number(countedInput || 0),
                  diff: checkDiff,
                })
                setQuantities((prev) => ({ ...prev, [checkItem.id]: String(planningQty) }))
                setCheckItem(null)
              }}
            >
              <CheckCircle2 size={18} /> Save count & apply {planningQty} {checkItem.unit}
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Saves a dated count observation. Poster balance is NOT modified silently (STK03).
            </div>
          </div>
        </div>
      )}

      {/* Basket / Review PR Modal */}
      {showBasket && (
        <div className="modal-backdrop" onClick={() => setShowBasket(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Review purchase request</h2>
              <button className="btn btn-outline" style={{ minHeight: 34, padding: '0 8px' }} onClick={() => setShowBasket(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="stepper">
              <div className="step-node done"><div className="step-circle">✓</div><span>Request</span></div>
              <div className="step-node"><div className="step-circle">2</div><span>Price review</span></div>
              <div className="step-node"><div className="step-circle">3</div><span>Approval</span></div>
              <div className="step-node"><div className="step-circle">4</div><span>Order</span></div>
            </div>

            <div className="table-wrap" style={{ marginBottom: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    {canSeePrices && <th>Ref price</th>}
                    {canSeePrices && <th>Est. total</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedLines.map((l) => (
                    <tr key={l.id}>
                      <td><strong>{l.emoji} {l.name}</strong></td>
                      <td>{l.qty} {l.unit}</td>
                      {canSeePrices && <td>{l.lastPaid ? `EGP ${l.lastPaid}` : 'Unknown'}</td>}
                      {canSeePrices && <td><strong>EGP {((l.lastPaid || 0) * l.qty).toLocaleString()}</strong></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid-equal-2" style={{ marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Priority</label>
                <select className="input" style={{ width: '100%' }} value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent (Requires exception review)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Reason</label>
                <input className="input" style={{ width: '100%' }} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            </div>

            <div className="notice notice-amber" style={{ marginBottom: 14 }}>
              <AlertTriangle size={16} />
              <span>Purchasing will split food & non-food lines into separate supplier orders if needed (WF02).</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setShowBasket(false)}>Save draft</button>
              <button className="btn btn-primary" onClick={handleSubmitBasket}>{t.submitForReview}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
