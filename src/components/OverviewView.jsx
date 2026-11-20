import React, { useState } from 'react'
import { ClipboardCheck, Truck, Tag, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { BRANCHES } from '../data/seedData'

export default function OverviewView({ state, branchFilter, role, lang, t, onNavigate, onApproveOwnerLine }) {
  const [historyFilter, setHistoryFilter] = useState('All')
  const canSeePrices = role.canViewPrices

  const branchName = (id) => {
    const b = BRANCHES.find((x) => x.id === id)
    return b ? (lang === 'ar' ? b.nameAr : b.name) : id
  }

  const filterByBranch = (bId) => branchFilter === 'all' || bId === branchFilter

  const allLines = state.prs.flatMap((pr) =>
    pr.lines.map((l) => ({ ...l, prId: pr.id, branchId: pr.branchId, createdAt: pr.createdAt }))
  )

  const escalatedLines = allLines.filter(
    (l) => filterByBranch(l.branchId) && (l.escalatedToOwner || (!l.priceApproved && l.proposedPrice * l.qty > 10000))
  )
  const priceExceptions = allLines.filter(
    (l) => filterByBranch(l.branchId) && !l.priceApproved && l.proposedPrice > l.ceiling
  )
  const overdueLines = allLines.filter((l) => filterByBranch(l.branchId) && l.overdue)
  const openShortages = state.discrepancies.filter(
    (d) => filterByBranch(d.branchId) && d.status !== 'Closed'
  )

  const historyRows = state.pos
    .filter((p) => filterByBranch(p.branchId))
    .filter((p) => historyFilter === 'All' || (historyFilter === 'Food' ? p.category === 'Food' : p.category !== 'Food'))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.purchasingOverview}</h1>
          <p className="page-subtitle">
            {lang === 'ar'
              ? 'ملخص تنفيذي عبر الفروع الأربعة — المالك يراجع الاستثناءات فقط'
              : 'Executive control across 4 restaurants — Owner reviews only escalated limits & exceptions'}
          </p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => onNavigate('my_requests')}>
          <div className="kpi-icon"><ClipboardCheck size={20} /></div>
          <div>
            <div className="kpi-label">{t.awaitingApproval}</div>
            <div className="kpi-value">{escalatedLines.length + allLines.filter((l) => !l.needApproved).length}</div>
          </div>
        </div>
        <div className="kpi-card" onClick={() => onNavigate('purchasing')}>
          <div className="kpi-icon"><Truck size={20} /></div>
          <div>
            <div className="kpi-label">{t.overdueDeliveries}</div>
            <div className="kpi-value">{overdueLines.length}</div>
          </div>
        </div>
        <div className="kpi-card" onClick={() => onNavigate('price_review')}>
          <div className="kpi-icon"><Tag size={20} /></div>
          <div>
            <div className="kpi-label">{t.priceExceptions}</div>
            <div className="kpi-value">{priceExceptions.length}</div>
          </div>
        </div>
        <div className="kpi-card amber" onClick={() => onNavigate('deliveries')}>
          <div className="kpi-icon"><AlertTriangle size={20} /></div>
          <div>
            <div className="kpi-label">{t.unresolvedShortages}</div>
            <div className="kpi-value">{openShortages.length}</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Needs your attention */}
        <div className="card">
          <div className="card-title">
            <span>{t.needsYourAttention}</span>
            <span className="pill pill-amber">{escalatedLines.length + openShortages.length}</span>
          </div>
          <p className="page-subtitle" style={{ marginBottom: 12 }}>
            {lang === 'ar'
              ? 'يمكن لفريقك اعتماد المشتريات ضمن الحدود المفوضة؛ لا يصلك إلا الاستثناءات.'
              : 'Your team approves routine purchases within delegated limits, so only exceptions come to you.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {escalatedLines.map((line) => (
              <div
                key={line.lineId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#fff9ee',
                  border: '1px solid #f5d89a',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{line.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {branchName(line.branchId)} · {lang === 'ar' ? line.itemNameAr : line.itemName}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {line.escalationReason || line.stage}
                      {canSeePrices && ` · EGP ${(line.proposedPrice * line.qty).toLocaleString()}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {role.canApproveBudget && (
                    <button
                      className="btn btn-primary"
                      onClick={() => onApproveOwnerLine(line.prId, line.lineId)}
                    >
                      <CheckCircle2 size={15} /> {lang === 'ar' ? 'اعتماد' : 'Approve'}
                    </button>
                  )}
                  <button
                    className="btn btn-outline"
                    onClick={() => onNavigate('price_review', line.lineId)}
                  >
                    {t.review}
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
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#fff9ee',
                  border: '1px solid #f5d89a',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={18} color="#a15206" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {branchName(iss.branchId)} · {iss.refDoc} · {iss.itemName}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {iss.nextAction}
                      {canSeePrices && iss.unmatchedEgp > 0 ? ` · EGP ${iss.unmatchedEgp} unmatched` : ''}
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline" onClick={() => onNavigate('deliveries')}>
                  {t.review}
                </button>
              </div>
            ))}

            {escalatedLines.length === 0 && openShortages.length === 0 && (
              <div className="notice notice-green">
                <CheckCircle2 size={18} />
                <span>All escalated approvals & shortages are resolved.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Overdue escalation + Non-food accountability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title">
              <span>{lang === 'ar' ? 'تصعيد متأخر' : 'Overdue escalation'}</span>
              <span className="pill pill-red">{overdueLines.length}</span>
            </div>
            {overdueLines.length > 0 ? (
              overdueLines.slice(0, 2).map((line) => (
                <div
                  key={line.lineId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{line.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                        {branchName(line.branchId)} · {line.itemName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Owner: {line.owner} · <span style={{ color: 'var(--red-text)', fontWeight: 600 }}>{line.due}</span>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => onNavigate('purchasing')}>
                    {t.review}
                  </button>
                </div>
              ))
            ) : (
              <div className="notice notice-gray">No overdue escalations.</div>
            )}
          </div>

          <div className="card">
            <div className="card-title">
              <span>{t.nonFoodAccountability}</span>
              <button className="btn btn-outline" style={{ minHeight: 30, fontSize: 12 }} onClick={() => onNavigate('non_food')}>
                View all
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {state.nonFoodRegister.filter((n) => filterByBranch(n.branchId)).map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {item.location} · {item.qty}
                    </div>
                  </div>
                  <span className="pill pill-green">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team follow-up */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          <span>{t.teamFollowUp}</span>
          <span className="pill pill-gray">{state.stockChecks.length + state.transfers.length} active</span>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>{t.restaurant}</th>
                <th>Task</th>
                <th>Owner</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.stockChecks.filter((c) => filterByBranch(c.branchId)).map((c) => (
                <tr key={c.id} className="clickable" onClick={() => onNavigate('stock_checks')}>
                  <td><strong>{branchName(c.branchId)}</strong></td>
                  <td>{c.itemName} stock difference ({c.diff} {c.unit})</td>
                  <td>{c.assignedTo}</td>
                  <td>Today 16:00</td>
                  <td><span className="pill pill-amber">{c.status}</span></td>
                </tr>
              ))}
              {state.transfers.map((tr) => (
                <tr key={tr.id} className="clickable" onClick={() => onNavigate('transfers')}>
                  <td><strong>{branchName(tr.sourceBranchId)} → {branchName(tr.destBranchId)}</strong></td>
                  <td>{tr.type}: {tr.itemName} ({tr.dispatchedQty} {tr.unit})</td>
                  <td>{tr.owner}</td>
                  <td>{tr.returnDueDate || 'Today'}</td>
                  <td><span className="pill pill-blue">{tr.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase History */}
      <div className="card">
        <div className="card-title">
          <span>{t.purchaseHistory}</span>
          <div className="seg-group">
            {['All', 'Food', 'Non-food'].map((f) => (
              <button
                key={f}
                className={`seg-btn ${historyFilter === f ? 'active' : ''}`}
                onClick={() => setHistoryFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>PO #</th>
                <th>{t.restaurant}</th>
                <th>Item</th>
                <th>Supplier</th>
                {canSeePrices && <th>Amount</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((po) => (
                <tr key={po.id} className="clickable" onClick={() => onNavigate('deliveries')}>
                  <td><strong>{po.id}</strong></td>
                  <td>{branchName(po.branchId)}</td>
                  <td>
                    <div className="item-cell">
                      <span>{po.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{po.itemName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {po.orderedQty} {po.unit}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{po.supplier}</td>
                  {canSeePrices && <td><strong>EGP {po.invoiceAmount.toLocaleString()}</strong></td>}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
