import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, RotateCcw, Lock } from 'lucide-react'
import { BRANCHES } from '../data/seedData'

export default function PriceReviewView({
  state,
  branchFilter,
  focusedLineId,
  role,
  lang,
  t,
  onApprovePrice,
  onReturnPrice,
}) {
  const canSeePrices = role.canViewPrices
  const branchObj = BRANCHES.find((x) => x.id === branchFilter) || BRANCHES[0]
  const branchTitle = lang === 'ar' ? branchObj.nameAr : branchObj.name

  const allLines = state.prs
    .filter((pr) => pr.branchId === branchObj.id)
    .flatMap((pr) =>
      pr.lines.map((l) => ({ ...l, prId: pr.id, branchId: pr.branchId, createdAt: pr.createdAt }))
    )

  const reviewable = allLines.filter((l) => !l.priceApproved && l.needApproved)
  const [selectedId, setSelectedId] = useState(focusedLineId || reviewable[0]?.lineId || allLines[0]?.lineId)
  const line = allLines.find((l) => l.lineId === selectedId) || reviewable[0] || allLines[0]

  const [chosenQuoteIdx, setChosenQuoteIdx] = useState(0)
  const [reason, setReason] = useState('')

  if (!canSeePrices) {
    return (
      <div className="card">
        <div className="notice notice-amber">
          <Lock size={20} />
          <div>
            <strong>{lang === 'ar' ? 'الأسعار مخفية لهذا الدور' : 'Prices are hidden for this role'}</strong>
          </div>
        </div>
      </div>
    )
  }

  if (!line) {
    return (
      <div className="card">
        <div className="notice notice-green">
          <CheckCircle2 size={18} />
          <span>{lang === 'ar' ? `لا توجد أسعار للمراجعة في ${branchTitle}` : `No prices waiting for review in ${branchTitle}.`}</span>
        </div>
      </div>
    )
  }

  const quotes = line.quotes && line.quotes.length > 0
    ? line.quotes
    : [{ supplier: line.selectedSupplier || 'Approved Supplier', price: line.proposedPrice || line.lastPaid, delivery: 'Included', date: 'Tomorrow' }]

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="item-thumb" style={{ width: 56, height: 56, fontSize: 30 }}>{line.emoji}</div>
          <div>
            <h1 className="page-title">{t.checkPriceTitle}</h1>
            <p className="page-subtitle">
              {branchTitle} · <strong>{lang === 'ar' ? line.itemNameAr : line.itemName}</strong> · {line.qty} {line.unit}
            </p>
          </div>
        </div>

        {allLines.length > 1 && (
          <div className="select-pill">
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
                  {lang === 'ar' ? l.itemNameAr : l.itemName} ({l.stage})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3 Big Simple Price Cards (Screenshot #5) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 14 }}>
        <div className="card" style={{ background: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{t.lastDeliveryPrice}:</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{line.lastPaid} EGP/{line.unit}</div>
        </div>
        <div className="card" style={{ background: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{t.allowedPrice}:</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{line.ceiling} EGP/{line.unit}</div>
        </div>
        <div className="card" style={{ background: driftTotal > 0 ? '#fff5df' : 'var(--green-bg)', borderColor: driftTotal > 0 ? 'var(--amber-border)' : '#bfe3cd' }}>
          <div style={{ fontSize: 13, color: driftTotal > 0 ? 'var(--amber-text)' : 'var(--green-text)', marginBottom: 6 }}>{t.chosenPrice}:</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: driftTotal > 0 ? 'var(--amber-text)' : 'var(--green-text)' }}>
            {activeQuote.price} EGP/{line.unit}
          </div>
        </div>
      </div>

      {driftTotal > 0 && (
        <div className="notice notice-amber" style={{ marginBottom: 16, fontWeight: 600 }}>
          <AlertTriangle size={18} />
          <span>
            {lang === 'ar'
              ? `أغلى بنسبة ${driftPct}% · +${driftTotal.toLocaleString()} EGP لـ ${line.qty} ${line.unit}`
              : `${driftPct}% more expensive · +${driftTotal.toLocaleString()} EGP for ${line.qty} ${line.unit}`}
          </span>
        </div>
      )}

      {/* Simple Supplier Table */}
      <div className="table-wrap" style={{ marginBottom: 16 }}>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>{lang === 'ar' ? 'المورد' : 'Supplier'}</th>
              <th>{lang === 'ar' ? 'السعر' : 'Price'}</th>
              <th>{lang === 'ar' ? 'امتى هيوصل' : 'When'}</th>
              <th>{lang === 'ar' ? 'التوصيل' : 'Delivery'}</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q, idx) => (
              <tr
                key={q.supplier + idx}
                className={`clickable ${chosenQuoteIdx === idx ? 'selected' : ''}`}
                onClick={() => setChosenQuoteIdx(idx)}
              >
                <td style={{ width: 40 }}>
                  <input type="radio" checked={chosenQuoteIdx === idx} onChange={() => setChosenQuoteIdx(idx)} />
                </td>
                <td><strong>{q.supplier}</strong></td>
                <td><strong>{q.price} EGP/{line.unit}</strong></td>
                <td>{q.date || 'Tomorrow'}</td>
                <td>{q.delivery || 'Included'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Why pick more expensive? */}
      <div className="card">
        <label style={{ fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 8 }}>
          {t.whyMoreExpensive} {needsJustification ? '*' : ''}
        </label>
        {needsJustification && (
          <div className="chip-row" style={{ marginBottom: 10 }}>
            {[
              lang === 'ar' ? 'المورد الأساسي مخلص' : 'Regular supplier out of stock',
              lang === 'ar' ? 'جودة أحسن' : 'Better quality',
              lang === 'ar' ? 'محتاجينه ضروري النهاردة' : 'Urgent delivery today',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                className={`chip-btn ${reason === chip ? 'active' : ''}`}
                onClick={() => setReason(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        <textarea
          className="textarea"
          placeholder={lang === 'ar' ? 'أو اكتب السبب هنا...' : 'Or type another reason here...'}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {needsJustification && !reason.trim() && (
          <div style={{ fontSize: 12.5, color: 'var(--amber-text)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} />
            <span>{lang === 'ar' ? 'مينفعش توافق من غير ما تكتب السبب' : 'Cannot approve without a written reason'}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary btn-lg"
            disabled={!canAct || (needsJustification && !reason.trim())}
            onClick={() =>
              onApprovePrice(line.prId, line.lineId, {
                supplier: activeQuote.supplier,
                price: activeQuote.price,
                reason: reason.trim() || 'Within allowed price',
              })
            }
          >
            <CheckCircle2 size={17} /> {t.approvePrice}
          </button>
          <button
            className="btn btn-outline btn-lg"
            disabled={!canAct}
            onClick={() => onReturnPrice(line.prId, line.lineId, reason || 'Returned to Noman')}
          >
            <RotateCcw size={17} /> {t.returnToNoman}
          </button>
        </div>
      </div>
    </div>
  )
}
