import React, { useState } from 'react'
import { FileText, CheckCircle2, Truck, AlertTriangle, Copy, Send, MessageSquare, Lock } from 'lucide-react'
import { BRANCHES } from '../data/seedData'

export default function PurchasingView({
  state,
  branchFilter,
  role,
  lang,
  t,
  onSendQuoteToCostControl,
  onCreatePO,
  onUpdatePOStatus,
  onNavigate,
}) {
  const canSeePrices = role.canViewPrices
  const [catTab, setCatTab] = useState('All')
  const [assigneeFilter, setAssigneeFilter] = useState('All')
  const [selectedLineId, setSelectedLineId] = useState(state.prs[0]?.lines[0]?.lineId || null)
  const [quoteSupplier, setQuoteSupplier] = useState('')
  const [quotePrice, setQuotePrice] = useState('')
  const [whatsappPo, setWhatsappPo] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const branchName = (id) => {
    const b = BRANCHES.find((x) => x.id === id)
    return b ? (lang === 'ar' ? b.nameAr : b.name) : id
  }

  const allLines = state.prs.flatMap((pr) =>
    pr.lines.map((l) => ({ ...l, prId: pr.id, branchId: pr.branchId, neededBy: pr.neededBy }))
  )

  const filteredLines = allLines.filter((l) => {
    if (branchFilter !== 'all' && l.branchId !== branchFilter) return false
    if (catTab === 'Food' && l.category !== 'Food') return false
    if (catTab === 'Non-food' && l.category === 'Food') return false
    if (assigneeFilter !== 'All' && l.owner !== assigneeFilter) return false
    return true
  })

  const selectedLine = filteredLines.find((l) => l.lineId === selectedLineId) || filteredLines[0] || null

  const branchSuppliers = selectedLine
    ? state.posterSnapshot?.branches?.[selectedLine.branchId]?.suppliers || []
    : []

  const readyForPricingCount = allLines.filter((l) => !l.priceApproved && l.needApproved).length
  const approvedToSendCount = allLines.filter((l) => l.priceApproved && l.needApproved && l.stage === 'Approved').length
  const supplierDueCount = state.pos.filter((p) => p.status === 'Sent' || p.status === 'Confirmed').length
  const lateCount = allLines.filter((l) => l.overdue).length

  const formatWhatsappMessage = (po) => {
    const b = BRANCHES.find((x) => x.id === po.branchId)
    return [
      `*${b?.entity || 'L&C Restaurant Group'} — ${po.id} (Rev ${po.revision})*`,
      `Branch / Delivery: ${b?.name || po.branchId}`,
      `Supplier: ${po.supplier}`,
      `Required date: ${po.expectedDate}`,
      `---`,
      `• ${po.itemName}: ${po.orderedQty} ${po.unit} @ EGP ${po.approvedPrice}/${po.unit}`,
      `Total (excl. tax): EGP ${(po.orderedQty * po.approvedPrice).toLocaleString()}`,
      `---`,
      `Please confirm availability and delivery time. (Ref: ${po.prId})`,
    ].join('\n')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.purchasingWorkspace}</h1>
          <p className="page-subtitle">
            {lang === 'ar'
              ? 'إدارة عروض الأسعار وأوامر الشراء ومتابعة الموردين'
              : 'Combined branch requests, supplier quotes, POs & WhatsApp follow-up'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><FileText size={20} /></div>
          <div>
            <div className="kpi-label">Ready for pricing</div>
            <div className="kpi-value">{readyForPricingCount}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><CheckCircle2 size={20} /></div>
          <div>
            <div className="kpi-label">Approved to send</div>
            <div className="kpi-value">{approvedToSendCount}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><Truck size={20} /></div>
          <div>
            <div className="kpi-label">Active POs</div>
            <div className="kpi-value">{supplierDueCount}</div>
          </div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><AlertTriangle size={20} /></div>
          <div>
            <div className="kpi-label">Late deliveries</div>
            <div className="kpi-value">{lateCount}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="seg-group">
          {['All', 'Food', 'Non-food'].map((tab) => (
            <button key={tab} className={`seg-btn ${catTab === tab ? 'active' : ''}`} onClick={() => setCatTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <div className="select-pill">
          <span>Assignee:</span>
          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
            <option value="All">All assignees</option>
            <option value="Mona">Mona</option>
            <option value="Omar">Omar</option>
            <option value="Cost Control">Cost Control</option>
            <option value="HR">HR</option>
          </select>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Left: Requests Queue */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request / Item</th>
                <th>{t.restaurant}</th>
                <th>Stage</th>
                <th>Owner</th>
                <th>Due</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    No requests match the selected branch/filter.
                  </td>
                </tr>
              ) : filteredLines.map((line) => (
                <tr
                  key={line.lineId}
                  className={`clickable ${selectedLine?.lineId === line.lineId ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedLineId(line.lineId)
                    setQuoteSupplier(line.selectedSupplier || '')
                    setQuotePrice(String(line.proposedPrice || ''))
                  }}
                >
                  <td>
                    <div className="item-cell">
                      <div className="item-thumb">{line.emoji}</div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{line.prId}</div>
                        <div style={{ fontWeight: 600 }}>{line.itemName} · {line.qty} {line.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td>{branchName(line.branchId)}</td>
                  <td>
                    <span
                      className={`pill ${
                        line.stage === 'Approved' || line.stage === 'Need approved'
                          ? 'pill-green'
                          : line.stage.includes('review') || line.stage.includes('confirmation')
                          ? 'pill-amber'
                          : 'pill-gray'
                      }`}
                    >
                      {line.stage}
                    </span>
                  </td>
                  <td>{line.owner}</td>
                  <td>
                    <span className={`pill ${line.overdue ? 'pill-red' : 'pill-amber'}`}>{line.due}</span>
                  </td>
                  <td>
                    {line.stage === 'Approved' ? (
                      <button
                        className="btn btn-primary"
                        style={{ minHeight: 32, fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          const po = onCreatePO(line)
                          if (po) setWhatsappPo(po)
                        }}
                      >
                        {t.createPo}
                      </button>
                    ) : line.stage === 'Price review' ? (
                      <button
                        className="btn btn-outline"
                        style={{ minHeight: 32, fontSize: 12 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigate('price_review', line.lineId)
                        }}
                      >
                        Price review
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quote</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Selected Item Detail & Quote Entry */}
        {selectedLine && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div className="item-thumb" style={{ width: 48, height: 48, fontSize: 26 }}>{selectedLine.emoji}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {selectedLine.itemName} · {selectedLine.qty} {selectedLine.unit}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {selectedLine.prId} · {branchName(selectedLine.branchId)} · Rev {selectedLine.revision}
                </div>
              </div>
            </div>

            {!canSeePrices ? (
              <div className="notice notice-amber">
                <Lock size={16} />
                <span>Supplier prices & quotes are hidden for this role (ACC02).</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last paid in Poster</span>
                  <strong>EGP {selectedLine.lastPaid}/{selectedLine.unit}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Approved ceiling</span>
                  <strong>EGP {selectedLine.ceiling}/{selectedLine.unit}</strong>
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Supplier (incl. live Poster suppliers for {branchName(selectedLine.branchId)})
                  </label>
                  <select
                    className="input"
                    style={{ width: '100%' }}
                    value={quoteSupplier || selectedLine.selectedSupplier || ''}
                    onChange={(e) => setQuoteSupplier(e.target.value)}
                  >
                    <option value={selectedLine.selectedSupplier}>{selectedLine.selectedSupplier}</option>
                    {branchSuppliers.map((s) => (
                      <option key={s.poster_supplier_id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    New supplier quote (EGP / {selectedLine.unit})
                  </label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%', fontWeight: 700 }}
                    value={quotePrice || selectedLine.proposedPrice || ''}
                    onChange={(e) => setQuotePrice(e.target.value)}
                  />
                </div>

                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Delivery: <strong>Included</strong> · Tax basis: <strong>Excluding tax</strong>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  style={{ marginTop: 6 }}
                  disabled={!selectedLine.needApproved}
                  onClick={() => {
                    onSendQuoteToCostControl(selectedLine.prId, selectedLine.lineId, {
                      supplier: quoteSupplier || selectedLine.selectedSupplier,
                      price: Number(quotePrice || selectedLine.proposedPrice),
                    })
                  }}
                >
                  <Send size={16} /> {t.sendToCostControl}
                </button>
                {!selectedLine.needApproved && (
                  <div style={{ fontSize: 12, color: 'var(--amber-text)' }}>
                    Waiting for Manager / HR need approval before pricing can be finalized.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Supplier Orders (POs) */}
      <div className="card">
        <div className="card-title">
          <span>Supplier Purchase Orders (POs) & WhatsApp Evidence</span>
          <span className="pill pill-gray">{state.pos.length} POs</span>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>PO # / Rev</th>
                <th>{t.restaurant}</th>
                <th>Supplier</th>
                <th>Item & Qty</th>
                {canSeePrices && <th>Approved Total</th>}
                <th>Status</th>
                <th>Supplier Communication (SUP02)</th>
              </tr>
            </thead>
            <tbody>
              {state.pos.filter((p) => branchFilter === 'all' || p.branchId === branchFilter).map((po) => (
                <tr key={po.id}>
                  <td><strong>{po.id}</strong> · rev {po.revision}</td>
                  <td>{branchName(po.branchId)}</td>
                  <td>{po.supplier}</td>
                  <td>{po.emoji} {po.itemName} ({po.orderedQty} {po.unit})</td>
                  {canSeePrices && <td><strong>EGP {po.invoiceAmount.toLocaleString()}</strong></td>}
                  <td>
                    <span className={`pill ${po.status === 'Received' ? 'pill-green' : po.status === 'Part received' ? 'pill-amber' : 'pill-blue'}`}>
                      {po.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-outline"
                        style={{ minHeight: 32, fontSize: 12 }}
                        onClick={() => setWhatsappPo(po)}
                      >
                        <MessageSquare size={14} /> {t.copyWhatsapp}
                      </button>
                      {po.status === 'Sent' && (
                        <button
                          className="btn btn-primary"
                          style={{ minHeight: 32, fontSize: 12 }}
                          onClick={() => onUpdatePOStatus(po.id, 'Confirmed')}
                        >
                          Mark Confirmed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp PO Modal */}
      {whatsappPo && (
        <div className="modal-backdrop" onClick={() => setWhatsappPo(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>WhatsApp Supplier Order — {whatsappPo.id}</h2>
            <p className="page-subtitle" style={{ marginBottom: 12 }}>
              SUP01–SUP02: Excludes internal price discussions & approval comments. Copying is not sending.
            </p>
            <textarea
              className="textarea"
              style={{ minHeight: 170, fontFamily: 'monospace', fontSize: 12.5 }}
              readOnly
              value={formatWhatsappMessage(whatsappPo)}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  navigator.clipboard?.writeText(formatWhatsappMessage(whatsappPo))
                  setCopiedId(whatsappPo.id)
                }}
              >
                <Copy size={15} /> {copiedId === whatsappPo.id ? 'Copied!' : 'Copy to clipboard'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onUpdatePOStatus(whatsappPo.id, 'Sent')
                  setWhatsappPo(null)
                }}
              >
                <CheckCircle2 size={15} /> Record as Sent to Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
