import React, { useState } from 'react'
import { CheckCircle2, AlertTriangle, Database, Camera, Utensils, Shirt, Wrench } from 'lucide-react'
import { BRANCHES } from '../data/seedData'

export default function ReceivingView({ state, branchFilter, role, lang, t, onConfirmReceipt }) {
  const canSeePrices = role.canViewPrices
  const receivablePOs = state.pos.filter((p) => branchFilter === 'all' || p.branchId === branchFilter)
  const [selectedPoId, setSelectedPoId] = useState(receivablePOs[0]?.id || state.pos[0]?.id)
  const po = state.pos.find((p) => p.id === selectedPoId) || receivablePOs[0]

  const [categoryTab, setCategoryTab] = useState(po?.category === 'Food' ? 'Food' : 'Equipment')
  const [acceptedInput, setAcceptedInput] = useState(po ? String(Math.max(0, po.orderedQty - po.receivedQty - 0.5)) : '0')
  const [tempC, setTempC] = useState('4')
  const [condition, setCondition] = useState('Accepted')
  const [expiryDate, setExpiryDate] = useState('2026-11-24')
  const [deliveryNoteNo, setDeliveryNoteNo] = useState('DN-8841')
  const [missingAction, setMissingAction] = useState('Keep remaining delivery open')
  const [techAccepted, setTechAccepted] = useState(true)

  const branchName = (id) => {
    const b = BRANCHES.find((x) => x.id === id)
    return b ? (lang === 'ar' ? b.nameAr : b.name) : id
  }

  if (!po) return <div className="card">No purchase orders available.</div>

  const remainingBefore = Number((po.orderedQty - po.receivedQty).toFixed(3))
  const acceptedNum = Math.min(remainingBefore, Math.max(0, Number(acceptedInput || 0)))
  const stillDue = Number((remainingBefore - acceptedNum).toFixed(3))
  const acceptedValue = acceptedNum * po.approvedPrice
  const unmatchedEgp = Math.max(0, Number((po.invoiceAmount - (po.receivedQty + acceptedNum) * po.approvedPrice).toFixed(2)))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Receive {po.id}</h1>
          <p className="page-subtitle">
            Supplier: <strong>{po.supplier}</strong> · Requested by: <strong>{branchName(po.branchId)}</strong> · Expected: <strong>{po.expectedDate}</strong>
          </p>
        </div>

        <div className="select-pill">
          <span>Order:</span>
          <select
            value={po.id}
            onChange={(e) => {
              const next = state.pos.find((x) => x.id === e.target.value)
              setSelectedPoId(e.target.value)
              if (next) {
                const rem = Math.max(0, next.orderedQty - next.receivedQty)
                setAcceptedInput(String(rem))
              }
            }}
          >
            {receivablePOs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.itemName} ({p.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Check Templates */}
      <div className="tabs-row" style={{ marginBottom: 16 }}>
        <div className="seg-group">
          {[
            ['Food', <Utensils size={14} key="f" />],
            ['Tableware', <Database size={14} key="t" />],
            ['Uniforms', <Shirt size={14} key="u" />],
            ['Equipment', <Wrench size={14} key="e" />],
          ].map(([cat, icon]) => (
            <button key={cat} className={`seg-btn ${categoryTab === cat ? 'active' : ''}`} onClick={() => setCategoryTab(cat)}>
              {icon} <span style={{ marginInlineStart: 5 }}>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Left: Physical Acceptance & Category Checklist */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="item-cell">
              <div className="item-thumb" style={{ width: 52, height: 52, fontSize: 28 }}>{po.emoji}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{po.itemName}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{po.spec}</div>
              </div>
            </div>
            {canSeePrices ? (
              <span className="pill pill-green">Approved price: EGP {po.approvedPrice}/{po.unit}</span>
            ) : (
              <span className="pill pill-gray">{t.priceRestricted}</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ background: 'var(--bg-subtle)', padding: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ordered / Remaining</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{po.orderedQty} / {remainingBefore} {po.unit}</div>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Received & accepted *</div>
              <input
                type="number"
                step="any"
                min="0"
                max={remainingBefore}
                className="input"
                style={{ width: '100%', fontWeight: 700, fontSize: 17 }}
                value={acceptedInput}
                onChange={(e) => setAcceptedInput(e.target.value)}
              />
            </div>
            <div className="card" style={{ background: stillDue > 0 ? 'var(--amber-bg)' : 'var(--green-bg)', padding: 12 }}>
              <div style={{ fontSize: 12, color: stillDue > 0 ? 'var(--amber-text)' : 'var(--green-text)' }}>Still due</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: stillDue > 0 ? 'var(--amber-text)' : 'var(--green-text)' }}>
                {stillDue} {po.unit}
              </div>
            </div>
          </div>

          {/* Category-Specific Checklist (RCV02) */}
          <div className="notice notice-green" style={{ marginBottom: 12, fontWeight: 600 }}>
            {categoryTab}: Actual quality & specification checks (RCV02)
          </div>

          {categoryTab === 'Food' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Measured temp °C *</label>
                <input className="input" style={{ width: '100%' }} value={tempC} onChange={(e) => setTempC(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Condition *</label>
                <select className="input" style={{ width: '100%' }} value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="Accepted">Accepted</option>
                  <option value="Chilled OK">Chilled OK</option>
                  <option value="Damaged / Hold">Damaged / Hold</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Expiry checked *</label>
                <input type="date" className="input" style={{ width: '100%' }} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>
          )}

          {categoryTab === 'Equipment' && (
            <div className="notice notice-amber" style={{ marginBottom: 14 }}>
              <Wrench size={18} />
              <div style={{ flex: 1 }}>
                <strong>EQP03 Technical Acceptance Gate:</strong> Delivery does NOT equal acceptance (e.g. undersized fryer case).
                <div style={{ marginTop: 6 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <input type="checkbox" checked={techAccepted} onChange={(e) => setTechAccepted(e.target.checked)} />
                    Capacity, dimensions & site fit verified by Technical Acceptor
                  </label>
                </div>
              </div>
            </div>
          )}

          {(categoryTab === 'Uniforms' || categoryTab === 'Tableware') && (
            <div className="notice notice-gray" style={{ marginBottom: 14 }}>
              <span>Verified against approved sample, size/dimensions & breakage count before store issue (UNI02 / NFD01).</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Supplier Delivery Note # *</label>
              <input className="input" style={{ width: '100%' }} value={deliveryNoteNo} onChange={(e) => setDeliveryNoteNo(e.target.value)} />
            </div>
            <div style={{ flex: 1, paddingTop: 18 }}>
              <span className="btn btn-outline" style={{ width: '100%' }}>
                <Camera size={16} /> Attach delivery note / photo
              </span>
            </div>
          </div>
        </div>

        {/* Right: Invoice Match & Discrepancy Auto-Tracking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-title">Invoice & Match Status (INV01)</div>
            {canSeePrices ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Invoice amount</span>
                  <strong>EGP {po.invoiceAmount.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Accepted this receipt</span>
                  <strong>EGP {acceptedValue.toLocaleString()}</strong>
                </div>
                {unmatchedEgp > 0 && (
                  <div className="notice notice-amber" style={{ justifyContent: 'space-between', fontWeight: 700, marginBottom: 8 }}>
                    <span>Unmatched</span>
                    <span>EGP {unmatchedEgp.toLocaleString()} · Pending review</span>
                  </div>
                )}
              </>
            ) : (
              <div className="notice notice-gray">
                <span>Monetary totals hidden for Receiver role (ACC02). Quantities & quality checks are saved normally.</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Not a final deduction or supplier debt until Cost Control / Accounting resolution.
            </div>
          </div>

          {stillDue > 0 && (
            <div className="card" style={{ background: '#fff9ee', borderColor: 'var(--amber-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--amber-text)', marginBottom: 8 }}>
                <AlertTriangle size={18} /> Issue: Missing {stillDue} {po.unit}
              </div>
              <div style={{ fontSize: 13, marginBottom: 10 }}>
                <div>Follow-up: <strong>Mona · Purchasing</strong></div>
                <div>Due: <strong>Tomorrow 10:00</strong></div>
              </div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Missing quantity action *</label>
              <select className="input" style={{ width: '100%' }} value={missingAction} onChange={(e) => setMissingAction(e.target.value)}>
                <option value="Keep remaining delivery open">Keep remaining delivery open</option>
                <option value="Request supplier credit note">Request supplier credit note</option>
                <option value="Close remainder with manager reason">Close remainder with manager reason</option>
              </select>
            </div>
          )}

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              <Database size={14} style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} />
              Poster posting: <strong>{po.postingStatus}</strong>
            </div>
            <button
              className="btn btn-primary btn-lg"
              disabled={remainingBefore <= 0 || acceptedNum <= 0}
              onClick={() => {
                onConfirmReceipt(po.id, {
                  acceptedQty: acceptedNum,
                  stillDue,
                  unmatchedEgp,
                  deliveryNoteNo,
                  missingAction,
                  techAccepted: categoryTab === 'Equipment' ? techAccepted : true,
                })
              }}
            >
              <CheckCircle2 size={18} /> {remainingBefore <= 0 ? 'Fully received' : `Save ${acceptedNum} ${po.unit} receipt`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
