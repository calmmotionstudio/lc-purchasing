import React, { useState } from 'react'
import { CheckCircle2, AlertTriangle, Database, Camera, Utensils, Shirt, Wrench, Truck, Clock, PhoneCall } from 'lucide-react'
import { BRANCHES } from '../data/seedData'

export default function ReceivingView({ state, branchFilter, role, lang, t, onConfirmReceipt, onResolveDiscrepancy }) {
  const canSeePrices = role.canViewPrices
  const isPurchasing = role.id === 'purchasing'
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
  const [resolveModalIss, setResolveModalIss] = useState(null)
  const [resolveOutcome, setResolveOutcome] = useState('Supplier credit note')
  const [resolveDocRef, setResolveDocRef] = useState('')
  const [resolveNote, setResolveNote] = useState('')

  const branchName = (id) => {
    const b = BRANCHES.find((x) => x.id === id)
    return b ? (lang === 'ar' ? b.nameAr : b.name) : id
  }

  // PURCHASING VIEW: Tracks what was sent, sees branch receiver's confirmation & resolves shortages
  if (isPurchasing) {
    const openIssues = state.discrepancies.filter(
      (d) => (branchFilter === 'all' || d.branchId === branchFilter) && d.status !== 'Closed'
    )
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">{lang === 'ar' ? 'متابعة التوريدات والعجز (المشتريات)' : 'Delivery Tracking & Supplier Shortages'}</h1>
            <p className="page-subtitle">
              Purchasing tracks supplier deliveries and resolves shortages reported by the branch Receiver. Physical arrival is confirmed only by Receiving / Restaurant Manager (OWN01).
            </p>
          </div>
        </div>

        {/* Open Shortages / Issues from Receiver */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">
            <span>Reported by Branch Receiver — Action Required</span>
            <span className="pill pill-amber">{openIssues.length} open</span>
          </div>
          {openIssues.length === 0 ? (
            <div className="notice notice-green">
              <CheckCircle2 size={18} />
              <span>All reported shortages and delivery issues are resolved.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {openIssues.map((iss) => (
                <div
                  key={iss.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: '#fff9ee',
                    border: '1px solid var(--amber-border)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {iss.id} · {iss.refDoc} · {branchName(iss.branchId)} · {iss.itemName}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      {iss.expectedQty > 0
                        ? `Ordered: ${iss.expectedQty} ${iss.unit} → Receiver accepted: ${iss.actualQty} ${iss.unit}`
                        : iss.nextAction}
                      {canSeePrices && iss.unmatchedEgp > 0 ? ` · Unmatched: EGP ${iss.unmatchedEgp}` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--amber-text)', marginTop: 3 }}>
                      Action: {iss.nextAction} · Due: {iss.due}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      style={{ minHeight: 34, fontSize: 12 }}
                      onClick={() => {
                        setResolveModalIss(iss)
                        setResolveOutcome('Supplier credit note')
                        setResolveDocRef('')
                        setResolveNote('')
                      }}
                    >
                      <CheckCircle2 size={14} /> Resolve Issue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All POs Delivery & Receiver Confirmation Log */}
        <div className="card">
          <div className="card-title">
            <span>All Sent POs & Branch Receiver Confirmations</span>
            <span className="pill pill-gray">{receivablePOs.length} POs</span>
          </div>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>{t.restaurant}</th>
                  <th>Supplier</th>
                  <th>Item</th>
                  <th>Ordered / Accepted</th>
                  <th>Receiver Evidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {receivablePOs.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.id}</strong></td>
                    <td>{branchName(p.branchId)}</td>
                    <td>{p.supplier}</td>
                    <td>{p.emoji} <strong>{p.itemName}</strong></td>
                    <td>
                      <strong>{p.receivedQty}</strong> / {p.orderedQty} {p.unit}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {p.lastReceiptNote
                        ? p.lastReceiptNote
                        : p.receivedQty > 0
                        ? 'Confirmed by branch receiver'
                        : 'Awaiting branch physical arrival'}
                    </td>
                    <td>
                      <span
                        className={`pill ${
                          p.status === 'Received'
                            ? 'pill-green'
                            : p.status === 'Part received'
                            ? 'pill-amber'
                            : 'pill-blue'
                        }`}
                      >
                        {p.status === 'Confirmed' || p.status === 'Sent' ? (
                          <><Clock size={12} /> {p.status}</>
                        ) : (
                          p.status
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {resolveModalIss && (
          <div className="modal-backdrop" onClick={() => setResolveModalIss(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginTop: 0 }}>Resolve Issue — {resolveModalIss.id} ({resolveModalIss.refDoc})</h2>
              <p className="page-subtitle" style={{ marginBottom: 12 }}>
                ISS01–ISS02: Closing a discrepancy requires a documented outcome and supporting reference. "Done" alone is not allowed.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Resolution Outcome *</label>
                  <select className="input" style={{ width: '100%' }} value={resolveOutcome} onChange={(e) => setResolveOutcome(e.target.value)}>
                    <option value="Supplier credit note">Supplier credit note (deduct unmatched EGP)</option>
                    <option value="Later delivery scheduled">Later delivery scheduled (keep balance open)</option>
                    <option value="Return / Replacement">Return / Replacement arranged</option>
                    <option value="Approved cancellation">Approved cancellation of remainder</option>
                    <option value="Verified count correction">Verified count correction</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Supporting Document / Reference # *
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Credit Note #CN-412, New ETA 22 Nov 10:00, or WhatsApp ref"
                    value={resolveDocRef}
                    onChange={(e) => setResolveDocRef(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Resolution Note *</label>
                  <textarea
                    className="textarea"
                    placeholder="Explain how the shortage/discrepancy was settled with the supplier..."
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className="btn btn-outline" onClick={() => setResolveModalIss(null)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  disabled={!resolveDocRef.trim() || !resolveNote.trim()}
                  onClick={() => {
                    onResolveDiscrepancy(resolveModalIss.id, {
                      outcome: resolveOutcome,
                      docRef: resolveDocRef.trim(),
                      note: resolveNote.trim(),
                    })
                    setResolveModalIss(null)
                  }}
                >
                  <CheckCircle2 size={15} /> Save Resolution
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // RECEIVING / RESTAURANT MANAGER VIEW: Confirms physical arrival, temp, quality & sends confirmation back to Purchasing
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
          <h1 className="page-title">
            <Truck size={22} style={{ verticalAlign: 'middle', marginInlineEnd: 8 }} />
            Receive {po.id}
          </h1>
          <p className="page-subtitle">
            Sent by Purchasing · Supplier: <strong>{po.supplier}</strong> · Destination: <strong>{branchName(po.branchId)}</strong> · Expected: <strong>{po.expectedDate}</strong>
          </p>
        </div>

        <div className="select-pill">
          <span>Expected PO:</span>
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
                <span>Monetary totals hidden for Receiver role (ACC02). Your confirmation sends accepted quantities to Purchasing & Accounting.</span>
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
                <div>Follow-up sent to: <strong>Mona · Purchasing</strong></div>
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
                  receiptSummary: `DN ${deliveryNoteNo} · ${condition} (${tempC}°C) · Accepted ${acceptedNum} ${po.unit}`,
                })
              }}
            >
              <CheckCircle2 size={18} /> {remainingBefore <= 0 ? 'Fully received' : `Confirm & Send ${acceptedNum} ${po.unit} Receipt`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
