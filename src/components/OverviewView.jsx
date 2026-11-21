import React from 'react'
import { CheckCircle2, AlertTriangle, ShoppingBag, Clock } from 'lucide-react'
import { BRANCHES } from '../data/seedData'

export default function OverviewView({ state, branchFilter, role, lang, t, onNavigate, onApproveOwnerLine }) {
  const canSeePrices = role.canViewPrices
  const branchObj = BRANCHES.find((x) => x.id === branchFilter) || BRANCHES[0]
  const branchTitle = lang === 'ar' ? branchObj.nameAr : branchObj.name

  const restaurantLines = state.prs
    .filter((pr) => pr.branchId === branchObj.id)
    .flatMap((pr) => pr.lines.map((l) => ({ ...l, prId: pr.id, branchId: pr.branchId, createdAt: pr.createdAt })))

  const needsDecision = restaurantLines.filter(
    (l) => l.escalatedToOwner || (!l.priceApproved && l.proposedPrice * l.qty > 10000) || (!l.priceApproved && l.proposedPrice > l.ceiling)
  )
  const openShortages = state.discrepancies.filter(
    (d) => d.branchId === branchObj.id && d.status !== 'Closed'
  )
  const branchPOs = state.pos.filter((p) => p.branchId === branchObj.id)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{branchTitle}</h1>
          <p className="page-subtitle">
            {lang === 'ar'
              ? 'ملخص بسيط لهذا المطعم فقط — بدون دمج باقي المطاعم'
              : `Simple overview for ${branchTitle} only — each restaurant is separate`}
          </p>
        </div>
      </div>

      {/* 3 Simple KPI Cards for THIS restaurant only */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="kpi-card" onClick={() => onNavigate('price_review')}>
          <div className="kpi-icon"><Clock size={20} /></div>
          <div>
            <div className="kpi-label">{lang === 'ar' ? 'مستني قرارك' : 'Waiting for you'}</div>
            <div className="kpi-value">{needsDecision.length}</div>
          </div>
        </div>
        <div className={`kpi-card ${openShortages.length > 0 ? 'amber' : ''}`} onClick={() => onNavigate('my_requests')}>
          <div className="kpi-icon"><AlertTriangle size={20} /></div>
          <div>
            <div className="kpi-label">{lang === 'ar' ? 'مشاكل / نواقص' : 'Shortages & issues'}</div>
            <div className="kpi-value">{openShortages.length}</div>
          </div>
        </div>
        <div className="kpi-card" onClick={() => onNavigate('my_requests')}>
          <div className="kpi-icon"><ShoppingBag size={20} /></div>
          <div>
            <div className="kpi-label">{lang === 'ar' ? 'طلبات هذا المطعم' : 'Active orders'}</div>
            <div className="kpi-value">{branchPOs.length}</div>
          </div>
        </div>
      </div>

      {/* Needs your decision */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          <span>{lang === 'ar' ? 'محتاج موافقتك' : 'Needs your decision'}</span>
          <span className="pill pill-amber">{needsDecision.length}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {needsDecision.map((line) => (
            <div
              key={line.lineId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#fff9ee',
                border: '1px solid #f5d89a',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26 }}>{line.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {lang === 'ar' ? line.itemNameAr : line.itemName} · {line.qty} {line.unit}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {line.escalationReason || line.stage}
                    {canSeePrices && ` · ${(line.proposedPrice * line.qty).toLocaleString()} EGP`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {role.canApproveBudget && (
                  <button
                    className="btn btn-primary"
                    onClick={() => onApproveOwnerLine(line.prId, line.lineId)}
                  >
                    <CheckCircle2 size={15} /> {lang === 'ar' ? 'موافقة' : 'Approve'}
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  onClick={() => onNavigate('price_review', line.lineId)}
                >
                  {lang === 'ar' ? 'شوف التفاصيل' : 'Check price'}
                </button>
              </div>
            </div>
          ))}

          {openShortages.map((iss) => (
            <div
              key={iss.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#fff9ee',
                border: '1px solid #f5d89a',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={20} color="#a15206" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {iss.itemName} ({iss.refDoc})
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {iss.nextAction}
                  </div>
                </div>
              </div>
              <button className="btn btn-outline" onClick={() => onNavigate('my_requests')}>
                {lang === 'ar' ? 'افتح' : 'Open'}
              </button>
            </div>
          ))}

          {needsDecision.length === 0 && openShortages.length === 0 && (
            <div className="notice notice-green">
              <CheckCircle2 size={18} />
              <span>{lang === 'ar' ? 'كله تمام في هذا المطعم!' : `Everything is clear in ${branchTitle}!`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent orders for this restaurant only */}
      <div className="card">
        <div className="card-title">
          <span>{lang === 'ar' ? `آخر طلبات ${branchTitle}` : `Recent orders · ${branchTitle}`}</span>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>{lang === 'ar' ? 'الصنف' : 'Item'}</th>
                <th>{lang === 'ar' ? 'الكمية' : 'Quantity'}</th>
                <th>{lang === 'ar' ? 'المورد' : 'Supplier'}</th>
                {canSeePrices && <th>{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>}
                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {branchPOs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                    {lang === 'ar' ? 'لا توجد طلبات مسجلة بعد' : 'No orders yet for this restaurant.'}
                  </td>
                </tr>
              ) : (
                branchPOs.map((po) => (
                  <tr key={po.id} className="clickable" onClick={() => onNavigate('my_requests')}>
                    <td>
                      <div className="item-cell">
                        <span style={{ fontSize: 20 }}>{po.emoji}</span>
                        <strong>{lang === 'ar' ? po.itemNameAr || po.itemName : po.itemName}</strong>
                      </div>
                    </td>
                    <td>{po.orderedQty} {po.unit}</td>
                    <td>{po.supplier}</td>
                    {canSeePrices && <td><strong>{po.invoiceAmount.toLocaleString()} EGP</strong></td>}
                    <td>
                      <span
                        className={`pill ${
                          po.status === 'Received'
                            ? 'pill-green'
                            : po.status === 'Part received'
                            ? 'pill-amber'
                            : 'pill-blue'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
