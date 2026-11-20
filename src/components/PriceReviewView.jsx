import React, { useState } from 'react'
import { Database, ShieldCheck, FileText, AlertTriangle, Lock, CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { BRANCHES } from '../data/seedData'

export default function PriceReviewView({
  state,
  focusedLineId,
  role,
  lang,
  t,
  onApprovePrice,
  onReturnPrice,
  onRejectPrice,
}) {
  const canSeePrices = role.canViewPrices
  const allLines = state.prs.flatMap((pr) =>
    pr.lines.map((l) => ({ ...l, prId: pr.id, branchId: pr.branchId, createdAt: pr.createdAt }))
  )
  const reviewable = allLines.filter((l) => !l.priceApproved && l.needApproved)
  const [selectedId, setSelectedId] = useState(focusedLineId || reviewable[0]?.lineId || allLines[0]?.lineId)
  const line = allLines.find((l) => l.lineId === selectedId) || reviewable[0] || allLines[0]

  const [chosenQuoteIdx, setChosenQuoteIdx] = useState(0)
  const [reason, setReason] = useState('')

  const branchName = (id) => {
    const b = BRANCHES.find((x) => x.id === id)
    return b ? (lang === 'ar' ? b.nameAr : b.name) : id
  }

  if (!canSeePrices) {
    return (
      <div className="card">
        <div className="notice notice-amber">
          <Lock size={20} />
          <div>
            <strong>Price review is restricted (ACC02 / ACC06)</strong>
            <div>Only Owner, Cost Control, Purchasing, Head Chef & Managers can view supplier prices or approve quotes.</div>
          </div>
        </div>
      </div>
    )
  }

  if (!line) {
    return <div className="card">No lines pending price review.</div>
  }

  const quotes = line.quotes && line.quotes.length > 0
    ? line.quotes
    : [{ supplier: line.selectedSupplier || 'Approved Supplier', price: line.proposedPrice || line.lastPaid, delivery: 'Included', taxBasis: 'Excluding tax', date: '20 Nov', pdf: 'quote.pdf' }]

  const activeQuote = quotes[chosenQuoteIdx] || quotes[0]
  const lowestPrice = Math.min(...quotes.map((q) => q.price))
  const driftEgpPerUnit = activeQuote.price - (line.ceiling || line.lastPaid || activeQuote.price)
  const driftTotal = driftEgpPerUnit * line.qty
  const baseForPct = line.ceiling || line.lastPaid || activeQuote.price || 1
  const driftPct = Math.round((driftEgpPerUnit / baseForPct) * 100)
  const needsJustification = activeQuote.price > lowestPrice || activeQuote.price > (line.ceiling || activeQuote.price)

  const canAct = role.canApprovePrice && !line.priceApproved

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.priceReview}</h1>
          <p className="page-subtitle">
            {line.prId} · {line.itemName} · {line.qty} {line.unit} · {branchName(line.branchId)}
          </p>
        </div>

        <div className="select-pill">
          <span>Line:</span>
          <select
            value={line.lineId}
            onChange={(e) => {
              setSelectedId(e.target.value)
              setChosenQuoteIdx(0)
              setReason('')
            }}
          >
            {allLines.map((l) => (
              <option key={l.lineId} value={l.lineId}>
                {l.prId} · {l.itemName} ({l.stage})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><Database size={20} /></div>
          <div>
            <div className="kpi-label">Last paid · Poster</div>
            <div className="kpi-value" style={{ fontSize: 20 }}>EGP {line.lastPaid}/{line.unit}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><ShieldCheck size={20} /></div>
          <div>
            <div className="kpi-label">Approved price ceiling</div>
            <div className="kpi-value" style={{ fontSize: 20 }}>EGP {line.ceiling}/{line.unit}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><FileText size={20} /></div>
          <div>
            <div className="kpi-label">Proposed quote</div>
            <div className="kpi-value" style={{ fontSize: 20 }}>EGP {activeQuote.price}/{line.unit}</div>
          </div>
        </div>
        <div className={`kpi-card ${driftTotal > 0 ? 'amber' : ''}`}>
          <div className="kpi-icon"><AlertTriangle size={20} /></div>
          <div>
            <div className="kpi-label">Order effect ({line.qty} {line.unit})</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>
              {driftTotal > 0 ? `+${driftPct}% · +EGP ${driftTotal.toLocaleString()}` : 'Within ceiling'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Supplier Comparison Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Supplier</th>
                  <th>Price (EGP/{line.unit})</th>
                  <th>Quote date</th>
                  <th>Delivery</th>
                  <th>Quote (PDF)</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q, idx) => (
                  <tr
                    key={q.supplier + idx}
                    className={`clickable ${chosenQuoteIdx === idx ? 'selected' : ''}`}
                    onClick={() => setChosenQuoteIdx(idx)}
                  >
                    <td>
                      <input
                        type="radio"
                        checked={chosenQuoteIdx === idx}
                        onChange={() => setChosenQuoteIdx(idx)}
                      />
                    </td>
                    <td><strong>{line.emoji} {q.supplier}</strong></td>
                    <td><strong>EGP {q.price}</strong></td>
                    <td>{q.date}</td>
                    <td>{q.delivery}</td>
                    <td><span className="pill pill-red">PDF</span> {q.pdf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Decision Note & Actions */}
          <div className="card">
            <label style={{ fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 6 }}>
              Reason for choosing a higher price {needsJustification ? '*' : '(optional)'}
            </label>
            <textarea
              className="textarea"
              placeholder="Explain quality, availability or service difference (PRC05)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                disabled={!canAct || (needsJustification && !reason.trim())}
                onClick={() => {
                  onApprovePrice(line.prId, line.lineId, {
                    supplier: activeQuote.supplier,
                    price: activeQuote.price,
                    reason: reason.trim() || 'Within approved terms',
                  })
                }}
              >
                <CheckCircle2 size={16} /> {t.approvePrice}
              </button>
              <button
                className="btn btn-outline"
                disabled={!canAct}
                onClick={() => onReturnPrice(line.prId, line.lineId, reason || 'Returned for lower quote')}
              >
                <RotateCcw size={16} /> {t.returnToPurchasing}
              </button>
              <button
                className="btn btn-danger-outline"
                disabled={!canAct}
                onClick={() => onRejectPrice(line.prId, line.lineId, reason || 'Rejected by Cost Control')}
              >
                <XCircle size={16} /> {t.reject}
              </button>
            </div>
            {!role.canApprovePrice && (
              <div style={{ fontSize: 12, color: 'var(--amber-text)', marginTop: 8 }}>
                Switch role to <strong>Cost Control</strong> or <strong>Owner</strong> to approve/reject (ACC04).
              </div>
            )}
          </div>
        </div>

        {/* Right: Approval History & Revision Lock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title">Approval history</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span>✅ Manager · Need approved</span>
                <span style={{ color: 'var(--text-muted)' }}>14:10</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span>✅ Purchasing · Quote submitted</span>
                <span style={{ color: 'var(--text-muted)' }}>14:20</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span>{line.priceApproved ? '✅ Cost Control · Approved' : '🕒 Cost Control · Pending'}</span>
                <span style={{ color: 'var(--text-muted)' }}>{line.priceApproved ? 'Done' : 'Active'}</span>
              </div>
            </div>
          </div>

          <div className="notice notice-gray">
            <Lock size={18} />
            <span>
              <strong>REV02:</strong> Any later price, quantity or specification change invalidates approval and reopens review.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
