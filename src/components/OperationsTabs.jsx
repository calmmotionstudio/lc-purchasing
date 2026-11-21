import React, { useState } from 'react'
import { CheckCircle2, ArrowRightLeft, Database, ShieldAlert, Lock, History, Plus, AlertTriangle, ClipboardCheck } from 'lucide-react'
import { BRANCHES, CURATED_CATALOG } from '../data/seedData'

const branchName = (id, lang) => {
  const b = BRANCHES.find((x) => x.id === id)
  return b ? (lang === 'ar' ? b.nameAr : b.name) : id
}

export function MyRequestsView({ state, branchFilter, role, lang, onApproveNeed, onRequestReport, onNavigate }) {
  const canSeePrices = role.canViewPrices
  const prs = state.prs.filter((p) => branchFilter === 'all' || p.branchId === branchFilter)
  const [reportModalPr, setReportModalPr] = useState(null)
  const [reportNote, setReportNote] = useState('')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {role.id === 'owner'
              ? (lang === 'ar' ? 'الطلبات وأوامر الشراء' : 'Branch Requests & Orders')
              : (lang === 'ar' ? 'طلباتي' : 'Branch Requests (PRs)')}
          </h1>
          <p className="page-subtitle">
            {role.id === 'owner'
              ? 'Read-only executive view of branch requests. Owner can review exceptions or request a report from Noman / Cost Control.'
              : 'WF02: Food lines can proceed independently while Non-food / Equipment approvals wait.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {prs.map((pr) => {
          const foodTotal = pr.lines.filter((l) => l.category === 'Food').reduce((s, l) => s + l.qty * l.lastPaid, 0)
          const nonFoodTotal = pr.lines.filter((l) => l.category !== 'Food').reduce((s, l) => s + l.qty * l.lastPaid, 0)
          return (
            <div key={pr.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>
                    {pr.id} · {branchName(pr.branchId, lang)}
                  </h2>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    Needed by {pr.neededBy} · Requester: {pr.requester} · {pr.reason}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {canSeePrices && (
                    <span className="pill pill-green">Food est: EGP {foodTotal.toLocaleString()}</span>
                  )}
                  {canSeePrices && nonFoodTotal > 0 && (
                    <span className="pill pill-amber">Non-food est: EGP {nonFoodTotal.toLocaleString()}</span>
                  )}
                  {role.canRequestReport && (
                    <button
                      className="btn btn-outline"
                      style={{ minHeight: 32, fontSize: 12 }}
                      onClick={() => {
                        setReportModalPr(pr)
                        setReportNote('')
                      }}
                    >
                      Request report
                    </button>
                  )}
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      {canSeePrices && <th>Last paid</th>}
                      {canSeePrices && <th>Estimate</th>}
                      <th>Approval / Stage</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pr.lines.map((l) => (
                      <tr key={l.lineId}>
                        <td><strong>{l.emoji} {lang === 'ar' ? l.itemNameAr : l.itemName}</strong></td>
                        <td>{l.qty} {l.unit}</td>
                        {canSeePrices && <td>EGP {l.lastPaid}/{l.unit}</td>}
                        {canSeePrices && <td><strong>EGP {(l.qty * l.lastPaid).toLocaleString()}</strong></td>}
                        <td>
                          <span className={`pill ${l.needApproved ? 'pill-green' : 'pill-amber'}`}>
                            {l.stage}
                          </span>
                        </td>
                        <td>
                          {!l.needApproved && role.canApproveNeed ? (
                            <button
                              className="btn btn-primary"
                              style={{ minHeight: 32, fontSize: 12 }}
                              onClick={() => onApproveNeed(pr.id, l.lineId)}
                            >
                              <CheckCircle2 size={14} /> Approve need
                            </button>
                          ) : role.id === 'purchasing' && l.needApproved ? (
                            <button
                              className="btn btn-outline"
                              style={{ minHeight: 32, fontSize: 12 }}
                              onClick={() => onNavigate('purchasing')}
                            >
                              Open in Purchasing
                            </button>
                          ) : role.canApprovePrice && !l.priceApproved && l.needApproved ? (
                            <button
                              className="btn btn-outline"
                              style={{ minHeight: 32, fontSize: 12 }}
                              onClick={() => onNavigate('price_review', l.lineId)}
                            >
                              Review price
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {l.needApproved ? `Owner: ${l.owner}` : 'Awaiting Manager/HR'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {reportModalPr && (
        <div className="modal-backdrop" onClick={() => setReportModalPr(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Request Report — {reportModalPr.id}</h2>
            <p className="page-subtitle" style={{ marginBottom: 12 }}>
              Assigns a report / verification task to Mohamed Noman & Cost Control for {branchName(reportModalPr.branchId, lang)}.
            </p>
            <textarea
              className="textarea"
              placeholder="What should Noman / Cost Control verify or report on this request?"
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button className="btn btn-outline" onClick={() => setReportModalPr(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!reportNote.trim()}
                onClick={() => {
                  onRequestReport(reportModalPr.id, reportModalPr.branchId, reportNote.trim())
                  setReportModalPr(null)
                }}
              >
                Send report request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function TransfersView({ state, lang, onCreateTransfer, onAcceptTransfer }) {
  const [source, setSource] = useState('boho')
  const [dest, setDest] = useState('saigon')
  const [type, setType] = useState('Loan')
  const [itemName, setItemName] = useState('Espresso beans')
  const [qty, setQty] = useState('2')
  const [unit, setUnit] = useState('kg')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transfers, Loans & Transport (TRF01–TRF08)</h1>
          <p className="page-subtitle">Source custodian dispatches; destination receiver independently confirms actual arrival.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">New Inter-Branch Transfer / Loan</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Source</label>
            <select className="input" style={{ width: '100%' }} value={source} onChange={(e) => setSource(e.target.value)}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Destination</label>
            <select className="input" style={{ width: '100%' }} value={dest} onChange={(e) => setDest(e.target.value)}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Type</label>
            <select className="input" style={{ width: '100%' }} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Loan">Temporary Loan</option>
              <option value="Permanent transfer">Permanent Transfer</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Item</label>
            <input className="input" style={{ width: '100%' }} value={itemName} onChange={(e) => setItemName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Qty ({unit})</label>
            <input type="number" className="input" style={{ width: '100%' }} value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            disabled={source === dest || Number(qty) <= 0}
            onClick={() => onCreateTransfer({ sourceBranchId: source, destBranchId: dest, type, itemName, qty: Number(qty), unit })}
          >
            <Plus size={16} /> Dispatch
          </button>
        </div>
        {source === dest && (
          <div style={{ fontSize: 12, color: 'var(--red-text)', marginTop: 6 }}>
            TRF01: Source and destination cannot be identical. (Same-warehouse use is an internal issue, not a transfer.)
          </div>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Route</th>
              <th>Type</th>
              <th>Item</th>
              <th>Dispatched / Received</th>
              <th>Return Due</th>
              <th>Status</th>
              <th>Destination Action</th>
            </tr>
          </thead>
          <tbody>
            {state.transfers.map((tr) => (
              <tr key={tr.id}>
                <td><strong>{tr.id}</strong></td>
                <td><ArrowRightLeft size={14} style={{ marginInlineEnd: 5 }} />{branchName(tr.sourceBranchId, lang)} → {branchName(tr.destBranchId, lang)}</td>
                <td>{tr.type}</td>
                <td>{tr.emoji} <strong>{tr.itemName}</strong></td>
                <td>{tr.dispatchedQty} / {tr.receivedQty} {tr.unit}</td>
                <td>{tr.returnDueDate || '—'}</td>
                <td>
                  <span className={`pill ${tr.status === 'Received' ? 'pill-green' : tr.status === 'Part received' ? 'pill-amber' : 'pill-blue'}`}>
                    {tr.status}
                  </span>
                </td>
                <td>
                  {tr.receivedQty < tr.dispatchedQty ? (
                    <button
                      className="btn btn-primary"
                      style={{ minHeight: 32, fontSize: 12 }}
                      onClick={() => onAcceptTransfer(tr.id)}
                    >
                      Confirm arrival ({tr.dispatchedQty - tr.receivedQty} {tr.unit})
                    </button>
                  ) : (
                    <span className="pill pill-green">Settled</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function NonFoodView({ state, branchFilter, lang }) {
  const rows = state.nonFoodRegister.filter((r) => branchFilter === 'all' || r.branchId === branchFilter)
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Non-food Accountability Register</h1>
          <p className="page-subtitle">Equipment custody, Uniform employee issue & Tableware counts (EQP / UNI / NFD).</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Item</th>
              <th>Branch & Location</th>
              <th>Custodian</th>
              <th>Quantity / State</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.code}</strong></td>
                <td>{r.type}</td>
                <td><strong>{r.name}</strong></td>
                <td>{branchName(r.branchId, lang)} · {r.location}</td>
                <td>{r.custodian}</td>
                <td>{r.qty}</td>
                <td><span className="pill pill-green">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AccountingView({ state, role, lang, onMarkPosted }) {
  const canSeePrices = role.canViewPrices
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounting & Poster Posting Queue (PST01–PST04)</h1>
          <p className="page-subtitle">Reconcile receipts, duplicate invoice checks & external posting IDs.</p>
        </div>
      </div>

      {!canSeePrices && (
        <div className="notice notice-amber" style={{ marginBottom: 16 }}>
          <Lock size={18} />
          <span>ACC02 Active: Accounting reconciles posting keys, delivery status & external IDs without site price/total visibility.</span>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PO #</th>
              <th>Branch</th>
              <th>Supplier</th>
              <th>Accepted / Ordered</th>
              {canSeePrices && <th>Invoice EGP</th>}
              <th>Posting State</th>
              <th>Poster Supply ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {state.pos.map((po) => (
              <tr key={po.id}>
                <td><strong>{po.id}</strong></td>
                <td>{branchName(po.branchId, lang)}</td>
                <td>{po.supplier}</td>
                <td>{po.receivedQty} / {po.orderedQty} {po.unit}</td>
                {canSeePrices && <td>EGP {po.invoiceAmount.toLocaleString()}</td>}
                <td>
                  <span className={`pill ${po.postingStatus === 'Posted' ? 'pill-green' : 'pill-amber'}`}>
                    {po.postingStatus}
                  </span>
                </td>
                <td><code>{po.posterSupplyId || 'Pending'}</code></td>
                <td>
                  {po.postingStatus !== 'Posted' ? (
                    <button className="btn btn-outline" style={{ minHeight: 32, fontSize: 12 }} onClick={() => onMarkPosted(po.id)}>
                      Reconcile Poster ID
                    </button>
                  ) : (
                    <span className="pill pill-green">Verified</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function IntegrationsView({ state, role }) {
  const branches = Object.values(state.posterSnapshot?.branches || {})
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Poster POS Integration & System Health</h1>
          <p className="page-subtitle">
            Snapshot fetched: <strong>{state.posterSnapshot?.fetched_at_utc}</strong> · Credentials stored server-side only (INT01).
          </p>
        </div>
      </div>

      {!role.canViewPrices && (
        <div className="notice notice-gray" style={{ marginBottom: 16 }}>
          <ShieldAlert size={18} />
          <span>ACC06: IT Lead manages technical sync & permissions without purchasing approval or price visibility.</span>
        </div>
      )}

      <div className="kpi-grid">
        {branches.map((b) => (
          <div key={b.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong>{b.name}</strong>
              <span className="pill pill-green">{b.is_pilot ? 'Pilot #1' : 'Connected'}</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
              Account: <code>{b.poster_account}</code> · {b.city}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <div>Storages: <strong>{b.storages.length}</strong> ({b.storages.slice(0, 3).map((s) => s.name).join(', ')}...)</div>
              <div>Active Ingredients: <strong>{b.total_ingredients_in_poster}</strong></div>
              <div>Active Suppliers: <strong>{b.suppliers_count}</strong></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title"><Database size={18} /> Integration Capability Matrix (INT06)</div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Operation</th>
                <th>Poster API Endpoint</th>
                <th>Mode</th>
                <th>Idempotency / Fallback</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Storages & Warehouses Read</td><td><code>storage.getStorages</code></td><td><span className="pill pill-green">Automated (Live)</span></td><td>Cached snapshot (5 min SLA)</td></tr>
              <tr><td>Stock Leftovers Snapshot</td><td><code>storage.getStorageLeftovers</code></td><td><span className="pill pill-green">Automated (Live)</span></td><td>Marked Stale if &gt; 15 min (INT02)</td></tr>
              <tr><td>Suppliers Directory</td><td><code>storage.getSuppliers</code></td><td><span className="pill pill-green">Automated (Live)</span></td><td>Read-only mapping</td></tr>
              <tr><td>Supply / Receipt Write</td><td><code>storage.createSupply</code></td><td><span className="pill pill-amber">Controlled Queue (PST01)</span></td><td>Unique operation key + Unknown outcome check</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function HistoryView({ state, branchFilter, lang }) {
  const logs = state.auditLog.filter((a) => branchFilter === 'all' || a.branchId === branchFilter || a.branchId === 'all')
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Immutable Audit Log & Stock Checks (DAT04)</h1>
          <p className="page-subtitle">Actor, role, timestamp (Africa/Cairo), revision and action history.</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Branch</th>
              <th>Rev</th>
              <th>Audit Event</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((a) => (
              <tr key={a.id}>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}><History size={13} style={{ marginInlineEnd: 5 }} />{a.time}</td>
                <td><strong>{a.actor}</strong> <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>({a.role})</span></td>
                <td>{branchName(a.branchId, lang)}</td>
                <td><span className="pill pill-gray">{a.rev}</span></td>
                <td>{a.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function StockChecksView({ state, branchFilter, role, lang, onResolveCheck, onSaveStockCheck }) {
  const activeBranch = branchFilter === 'all' ? 'boho' : branchFilter
  const checks = state.stockChecks.filter((c) => branchFilter === 'all' || c.branchId === branchFilter)
  const openCount = checks.filter((c) => c.status === 'Open').length
  const matchedCount = checks.filter((c) => c.status === 'Resolved' || c.status === 'Matched').length

  const [countItemId, setCountItemId] = useState(CURATED_CATALOG[0].id)
  const [countedVal, setCountedVal] = useState('7')
  const selectedItem = CURATED_CATALOG.find((x) => x.id === countItemId) || CURATED_CATALOG[0]
  const posterQty = selectedItem.posterStock[activeBranch] ?? 0
  const liveDiff = Number((Number(countedVal || 0) - posterQty).toFixed(3))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{lang === 'ar' ? 'مراقبة المخزون والجرد' : 'Stock Control & Cycle Counts (STK01–STK07)'}</h1>
          <p className="page-subtitle">
            Physical count observations vs Poster snapshot. Variances create assigned tasks without silently altering Poster (STK03).
          </p>
        </div>
        <span className="pill pill-green">Poster sync: {state.posterSnapshot?.fetched_at_utc}</span>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><ClipboardCheck size={20} /></div>
          <div>
            <div className="kpi-label">Critical daily items</div>
            <div className="kpi-value">{CURATED_CATALOG.filter((i) => i.checkPolicy === 'Count due').length}</div>
          </div>
        </div>
        <div className={`kpi-card ${openCount > 0 ? 'amber' : ''}`}>
          <div className="kpi-icon"><AlertTriangle size={20} /></div>
          <div>
            <div className="kpi-label">Open variances</div>
            <div className="kpi-value">{openCount}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><CheckCircle2 size={20} /></div>
          <div>
            <div className="kpi-label">Reviewed / Matched</div>
            <div className="kpi-value">{matchedCount}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><Database size={20} /></div>
          <div>
            <div className="kpi-label">Poster feed status</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>Fresh (&lt;5m)</div>
          </div>
        </div>
      </div>

      {/* Perform New Physical Count */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Record Physical Count Observation ({branchName(activeBranch, lang)})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Item</label>
            <select
              className="input"
              style={{ width: '100%' }}
              value={countItemId}
              onChange={(e) => {
                const next = CURATED_CATALOG.find((x) => x.id === e.target.value)
                setCountItemId(e.target.value)
                if (next) setCountedVal(String(Math.max(0, (next.posterStock[activeBranch] ?? 0) - 1)))
              }}
            >
              {CURATED_CATALOG.map((it) => (
                <option key={it.id} value={it.id}>{it.emoji} {it.name} ({it.unit})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Poster Stock</label>
            <input className="input" style={{ width: '100%', background: 'var(--bg-subtle)' }} readOnly value={`${posterQty} ${selectedItem.unit}`} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Counted Physically ({selectedItem.unit})</label>
            <input type="number" step="any" className="input" style={{ width: '100%', fontWeight: 700 }} value={countedVal} onChange={(e) => setCountedVal(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Live Variance</label>
            <div className={`pill ${liveDiff === 0 ? 'pill-green' : 'pill-amber'}`} style={{ height: 38, width: '100%', justifyContent: 'center' }}>
              {liveDiff > 0 ? `+${liveDiff}` : liveDiff} {selectedItem.unit}
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() =>
              onSaveStockCheck({
                branchId: activeBranch,
                item: { ...selectedItem, stock: posterQty },
                countedQty: Number(countedVal || 0),
                diff: liveDiff,
              })
            }
          >
            <Plus size={16} /> Save Count
          </button>
        </div>
      </div>

      {/* Count Observations & Variances */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Count Observations & Variance Tasks</div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Branch</th>
                <th>Item</th>
                <th>Poster Stock</th>
                <th>Counted</th>
                <th>Difference</th>
                <th>Counted By</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.id}</strong></td>
                  <td>{branchName(c.branchId, lang)}</td>
                  <td><strong>{c.itemName}</strong></td>
                  <td>{c.posterStock} {c.unit}</td>
                  <td><strong>{c.countedQty} {c.unit}</strong></td>
                  <td>
                    <span className={`pill ${c.diff === 0 ? 'pill-green' : 'pill-amber'}`}>
                      {c.diff > 0 ? `+${c.diff}` : c.diff} {c.unit}
                    </span>
                  </td>
                  <td>{c.countedBy} <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{c.countedAt}</div></td>
                  <td>{c.assignedTo}</td>
                  <td><span className={`pill ${c.status === 'Resolved' || c.status === 'Matched' ? 'pill-green' : 'pill-amber'}`}>{c.status}</span></td>
                  <td>
                    {c.status === 'Open' && (role.canApproveNeed || role.canApproveBudget || role.canApprovePrice) ? (
                      <button className="btn btn-primary" style={{ minHeight: 32, fontSize: 12 }} onClick={() => onResolveCheck(c.id)}>
                        Mark Reviewed
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cycle Count Policies */}
      <div className="card">
        <div className="card-title">Configured Count Policies (STK02)</div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Poster Stock ({branchName(activeBranch, lang)})</th>
                <th>Target Coverage</th>
                <th>Count Policy</th>
              </tr>
            </thead>
            <tbody>
              {CURATED_CATALOG.slice(0, 6).map((it) => (
                <tr key={it.id}>
                  <td><strong>{it.emoji} {it.name}</strong></td>
                  <td>{it.category}</td>
                  <td>{it.posterStock[activeBranch] ?? 0} {it.unit}</td>
                  <td>{it.targetCoverage[activeBranch] ?? 10} {it.unit}</td>
                  <td>
                    <span className={`pill ${it.checkPolicy === 'Count due' ? 'pill-amber' : 'pill-gray'}`}>
                      {it.checkPolicy === 'Count due' ? 'Critical daily check' : it.checkPolicy}
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
