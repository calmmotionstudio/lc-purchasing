import React, { useState, useEffect, useMemo } from 'react'
import { INITIAL_STATE, BRANCHES, CURATED_CATALOG } from './data/seedData'

const STORAGE_KEY = 'lc_unified_purchasing_v5'

const ROLES = [
  { id: 'staff', labelEn: 'Kitchen / Bar', labelAr: 'المطبخ / البار', tabs: ['daily', 'my_orders'] },
  { id: 'manager', labelEn: 'Restaurant Manager', labelAr: 'مدير المطعم', tabs: ['periodic', 'daily', 'receiving', 'shortages'] },
  { id: 'cost_office', labelEn: 'Cost Control Office', labelAr: 'مكتب مراقبة التكاليف', tabs: ['daily', 'periodic', 'history', 'shortages'] },
  { id: 'cost_control', labelEn: 'Cost Control Manager', labelAr: 'مدير مراقبة التكاليف', tabs: ['daily', 'periodic', 'history', 'shortages'] },
  { id: 'owner', labelEn: 'Owner · Lyudmyla', labelAr: 'المالكة · ليودميلا', tabs: ['periodic', 'history', 'shortages'] },
]

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...INITIAL_STATE, ...parsed, posterSnapshot: INITIAL_STATE.posterSnapshot }
    }
  } catch (e) {
    // ignore
  }
  return INITIAL_STATE
}

export default function App() {
  const [state, setState] = useState(loadState)
  const [branchId, setBranchId] = useState('boho')
  const [roleId, setRoleId] = useState('owner')
  const [lang, setLang] = useState('en')
  const [activeTab, setActiveTab] = useState('periodic')
  const [toast, setToast] = useState(null)

  const role = ROLES.find((r) => r.id === roleId) || ROLES[0]
  const branch = BRANCHES.find((b) => b.id === branchId) || BRANCHES[0]
  const branchTitle = lang === 'ar' ? branch.nameAr : branch.name
  const isAr = lang === 'ar'

  useEffect(() => {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr'
    document.documentElement.lang = isAr ? 'ar' : 'en'
  }, [isAr])

  useEffect(() => {
    try {
      const { posterSnapshot, ...rest } = state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
    } catch (e) {
      // ignore
    }
  }, [state])

  useEffect(() => {
    if (!role.tabs.includes(activeTab)) {
      setActiveTab(role.tabs[0])
    }
  }, [roleId, role.tabs, activeTab])

  const notify = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  // Poster-linked stock lookup for Daily Requests
  const stockOptions = useMemo(() => {
    const posterItems = state.posterSnapshot?.branches?.[branchId]?.items || []
    return [
      ...CURATED_CATALOG.map((c) => ({
        name: c.name,
        nameAr: c.nameAr,
        stock: c.posterStock[branchId] ?? 0,
        unit: c.unit,
      })),
      ...posterItems.slice(0, 60).map((p) => ({
        name: p.name,
        nameAr: p.name,
        stock: p.poster_stock,
        unit: p.unit,
      })),
    ]
  }, [state.posterSnapshot, branchId])

  const findStock = (name) => {
    const q = (name || '').trim().toLowerCase()
    if (!q) return '—'
    const found = stockOptions.find((s) => s.name.toLowerCase() === q || s.nameAr === name.trim())
    return found ? `${found.stock} ${found.unit}` : '0 (Not in Poster)'
  }

  // ============ WHATSAPP NUMBERS ============
  const [waPhones, setWaPhones] = useState(() => ({
    office: localStorage.getItem('lc_wa_office') || '',
    costMgr: localStorage.getItem('lc_wa_costmgr') || '',
    owner: localStorage.getItem('lc_wa_owner') || '',
  }))

  const saveWaPhones = () => {
    localStorage.setItem('lc_wa_office', waPhones.office)
    localStorage.setItem('lc_wa_costmgr', waPhones.costMgr)
    localStorage.setItem('lc_wa_owner', waPhones.owner)
    notify(isAr ? '✅ تم حفظ أرقام الواتساب' : '✅ WhatsApp numbers saved')
  }

  const clearWaPhones = () => {
    setWaPhones({ office: '', costMgr: '', owner: '' })
    localStorage.removeItem('lc_wa_office')
    localStorage.removeItem('lc_wa_costmgr')
    localStorage.removeItem('lc_wa_owner')
    notify(isAr ? '🗑️ تم مسح الأرقام' : '🗑️ Numbers cleared')
  }

  const sendWhatsApp = (phone, msg) => {
    const clean = (phone || '').replace(/[^0-9]/g, '')
    if (!clean) {
      alert(isAr ? 'اكتب رقم الواتساب الأول واضغط حفظ' : 'Please enter and save the WhatsApp number first.')
      return
    }
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ============ DAILY STATE ============
  const [dailyDate, setDailyDate] = useState('2026-11-24')
  const [dailyDept, setDailyDept] = useState('Kitchen')
  const [dailyRequester, setDailyRequester] = useState('Kitchen / Bar Lead')
  const [dailyRows, setDailyRows] = useState([
    { name: 'Tomatoes', qty: '10', notes: 'Fresh' },
    { name: 'Chicken breast', qty: '8', notes: 'Boneless' },
  ])

  const submitDaily = () => {
    const items = dailyRows
      .filter((r) => r.name.trim() && Number(r.qty) > 0)
      .map((r) => ({
        name: r.name.trim(),
        stock: findStock(r.name),
        qty: Number(r.qty),
        notes: r.notes,
      }))
    if (items.length === 0) return
    const id = `DR-${202 + state.dailyRequests.length}`
    const time = new Date().toTimeString().slice(0, 5)
    setState((prev) => ({
      ...prev,
      dailyRequests: [
        {
          id,
          branchId,
          date: dailyDate,
          department: dailyDept,
          requestedBy: dailyRequester,
          status: 'Waiting Cost Control Office',
          items,
          timeline: [{ time, text: `Daily request created by ${dailyRequester}` }],
        },
        ...prev.dailyRequests,
      ],
    }))
    notify(isAr ? `تم إرسال الطلب اليومي ${id} لمكتب Cost Control` : `Daily Request ${id} sent to Cost Control Office`)
  }

  const approveDailyByOffice = (dailyId) => {
    const time = new Date().toTimeString().slice(0, 5)
    setState((prev) => ({
      ...prev,
      dailyRequests: prev.dailyRequests.map((d) =>
        d.id !== dailyId
          ? d
          : {
              ...d,
              status: 'Approved by Cost Control Office',
              timeline: [...(d.timeline || []), { time, text: 'Approved by Cost Control Office' }],
            }
      ),
    }))
    notify(`✅ ${dailyId} approved by Cost Control Office`)
  }

  const rejectDailyByOffice = (dailyId) => {
    const time = new Date().toTimeString().slice(0, 5)
    setState((prev) => ({
      ...prev,
      dailyRequests: prev.dailyRequests.map((d) =>
        d.id !== dailyId
          ? d
          : {
              ...d,
              status: 'Rejected by Cost Control Office',
              timeline: [...(d.timeline || []), { time, text: 'Rejected by Cost Control Office' }],
            }
      ),
    }))
    notify(`❌ ${dailyId} rejected by Cost Control Office`)
  }

  // ============ PERIODIC STATE (NO PRICES, 4 SUBCATEGORIES, MANUAL INVENTORY -> NEED TO ORDER) ============
  const [perReqNo, setPerReqNo] = useState(`PER-00${state.periodicRequests.length + 1}`)
  const [perDate, setPerDate] = useState('2026-11-24')
  const [perDept, setPerDept] = useState('Restaurant')
  const [perRows, setPerRows] = useState([
    { name: 'Dinner plate 27 cm', specs: 'TW-027 Porcelain', category: 'Tableware & Glassware', inventory: '130', qty: '15' },
    { name: 'Nachos Skillet', specs: 'Cast iron', category: 'Kitchen & Bar Tools', inventory: '8', qty: '10' },
  ])
  const [openPerComboIdx, setOpenPerComboIdx] = useState(null)

  const supplyItems = CURATED_CATALOG.filter((c) => c.category === 'Non-food')

  const getLastInventory = (itemName) => {
    const q = (itemName || '').trim().toLowerCase()
    if (!q) return 0
    // 1. Check most recent saved periodic request for this branch
    for (const pr of state.periodicRequests) {
      if (pr.branchId !== branchId) continue
      const found = pr.items.find((i) => i.name.toLowerCase() === q)
      if (found && found.inventory !== undefined) return Number(found.inventory)
    }
    // 2. Fallback to initial catalog / Cairo & Boho sheet counts
    const cat = supplyItems.find((s) => s.name.toLowerCase() === q || s.nameAr === itemName.trim())
    return cat ? (cat.posterStock[branchId] ?? 0) : 0
  }

  const branchPeriodic = state.periodicRequests.filter((p) => p.branchId === branchId)
  const [selectedPerId, setSelectedPerId] = useState(branchPeriodic[0]?.id || state.periodicRequests[0]?.id)
  const activePer = state.periodicRequests.find((p) => p.id === selectedPerId && p.branchId === branchId) || branchPeriodic[0]

  const [stepInputs, setStepInputs] = useState({
    1: { name: '', sig: '', notes: '' },
    2: { name: '', sig: '', notes: '' },
    3: { name: '', sig: '', notes: '' },
  })

  const savePeriodic = () => {
    const items = perRows
      .filter((r) => r.name.trim() && Number(r.qty) > 0)
      .map((r) => ({
        name: r.name.trim(),
        specs: r.specs,
        category: r.category,
        inventory: Number(r.inventory || 0),
        qty: Number(r.qty),
      }))
    if (items.length === 0) return
    const newId = perReqNo.trim() || `PER-00${state.periodicRequests.length + 1}`
    setState((prev) => ({
      ...prev,
      periodicRequests: [
        {
          id: newId,
          branchId,
          date: perDate,
          department: perDept,
          status: 'Waiting Restaurant Manager',
          step1: { approved: false, name: '', sig: '', time: '' },
          step2: { approved: false, name: '', sig: '', time: '' },
          step3: { approved: false, name: '', sig: '', time: '' },
          items,
        },
        ...prev.periodicRequests,
      ],
    }))
    setSelectedPerId(newId)
    notify(isAr ? `تم حفظ طلب الدوري ${newId}` : `Periodic Request ${newId} saved`)
  }

  const approvePeriodicStep = (perId, stepNum, escalateToOwner = false) => {
    const inp = stepInputs[stepNum]
    if (!inp.name.trim() || !inp.sig.trim()) {
      alert(isAr ? 'اكتب الاسم والتوقيع الأول' : 'Please enter Name and Signature first.')
      return
    }
    const time = new Date().toTimeString().slice(0, 5)
    setState((prev) => ({
      ...prev,
      periodicRequests: prev.periodicRequests.map((p) => {
        if (p.id !== perId) return p
        const next = { ...p }
        if (stepNum === 1) {
          next.step1 = { approved: true, name: inp.name.trim(), sig: inp.sig.trim(), notes: inp.notes, time }
          next.status = 'Waiting Cost Control Manager'
        } else if (stepNum === 2) {
          next.step2 = { approved: true, name: inp.name.trim(), sig: inp.sig.trim(), notes: inp.notes, time }
          next.status = escalateToOwner
            ? 'Waiting Owner Final Approval'
            : 'Approved by Cost Control Manager (Sent to Cost Control Office)'
        } else if (stepNum === 3) {
          next.step3 = { approved: true, name: inp.name.trim(), sig: inp.sig.trim(), notes: inp.notes, time }
          next.status = 'Fully Approved by Owner'
        }
        return next
      }),
    }))
    notify(
      escalateToOwner
        ? (isAr ? `✅ تم اعتماد ${perId} والإرسال للمالكة` : `✅ ${perId} approved & sent to Owner`)
        : (isAr ? `✅ تم اعتماد ${perId}` : `✅ ${perId} approved (Step ${stepNum})`)
    )
  }

  const rejectPeriodicStep = (perId, stepNum) => {
    const inp = stepInputs[stepNum]
    const reason = inp.notes?.trim() || (isAr ? 'مرفوض' : 'Rejected')
    const time = new Date().toTimeString().slice(0, 5)
    setState((prev) => ({
      ...prev,
      periodicRequests: prev.periodicRequests.map((p) => {
        if (p.id !== perId) return p
        const next = { ...p }
        next.status = stepNum === 3 ? `Rejected by Owner (${reason})` : `Rejected by Cost Control Manager (${reason})`
        if (stepNum === 2) {
          next.step2 = { approved: false, rejected: true, name: inp.name.trim() || 'Cost Control Manager', notes: reason, time }
        }
        if (stepNum === 3) {
          next.step3 = { approved: false, rejected: true, name: inp.name.trim() || 'Owner', notes: reason, time }
        }
        return next
      }),
    }))
    notify(isAr ? `❌ تم رفض الطلب ${perId}` : `❌ ${perId} rejected`)
  }

  // ============ RECEIVING -> AUTO-CREATES PENDING SHORTAGES ============
  const branchPOs = state.pos.filter((p) => p.branchId === branchId)
  const [rcvPoId, setRcvPoId] = useState(branchPOs[0]?.id || state.pos[0]?.id)
  const activeRcvPo = branchPOs.find((p) => p.id === rcvPoId) || branchPOs[0]
  const [rcvArrived, setRcvArrived] = useState(activeRcvPo ? String(Math.max(0, activeRcvPo.orderedQty - activeRcvPo.receivedQty)) : '0')
  const [rcvReason, setRcvReason] = useState('Damaged packaging')
  const [rcvTemp, setRcvTemp] = useState('4')
  const [rcvExpiry, setRcvExpiry] = useState('2026-11-28')
  const [rcvNoteNo, setRcvNoteNo] = useState('DN-9012')

  const confirmReceiving = () => {
    if (!activeRcvPo) return
    const rem = Number((activeRcvPo.orderedQty - activeRcvPo.receivedQty).toFixed(3))
    const acc = Math.min(rem, Math.max(0, Number(rcvArrived || 0)))
    const missing = Number((rem - acc).toFixed(3))
    const time = new Date().toTimeString().slice(0, 5)

    setState((prev) => {
      const nextDiscrepancies =
        missing > 0
          ? [
              {
                id: `ISS-${402 + prev.discrepancies.length}`,
                branchId,
                type: 'Arrived Less',
                refDoc: activeRcvPo.id,
                itemName: activeRcvPo.itemName,
                expectedQty: rem,
                actualQty: acc,
                unit: activeRcvPo.unit,
                unmatchedEgp: 0,
                owner: 'Cost Control / Purchasing',
                due: 'Tomorrow 10:00',
                nextAction: `${rcvReason} (DN: ${rcvNoteNo})`,
                status: 'Pending',
                timeline: [
                  { time, text: `Ordered ${rem} ${activeRcvPo.unit}, accepted ${acc} ${activeRcvPo.unit}` },
                  { time, text: `Missing ${missing} ${activeRcvPo.unit} (${rcvReason})` },
                ],
              },
              ...prev.discrepancies,
            ]
          : prev.discrepancies

      return {
        ...prev,
        pos: prev.pos.map((p) =>
          p.id !== activeRcvPo.id
            ? p
            : {
                ...p,
                receivedQty: Number((p.receivedQty + acc).toFixed(3)),
                status: missing === 0 ? 'Received' : 'Part received',
              }
        ),
        discrepancies: nextDiscrepancies,
      }
    })
    notify(
      missing > 0
        ? `Saved! ${missing} ${activeRcvPo.unit} added to Shortages (Pending)`
        : `✅ All ${acc} ${activeRcvPo.unit} received OK`
    )
  }

  // ============ MY ORDERS (STAFF) & HISTORY ============
  const [historyFilter, setHistoryFilter] = useState('All')
  const branchDaily = state.dailyRequests.filter((d) => d.branchId === branchId)
  const [selectedOrderId, setSelectedOrderId] = useState(branchDaily[0]?.id || branchPOs[0]?.id)
  const [orderNoteText, setOrderNoteText] = useState('')
  const branchShortages = state.discrepancies.filter((d) => d.branchId === branchId)

  const addTimelineNote = (id, text) => {
    if (!text.trim()) return
    const time = new Date().toTimeString().slice(0, 5)
    setState((prev) => ({
      ...prev,
      dailyRequests: prev.dailyRequests.map((d) =>
        d.id === id ? { ...d, timeline: [...(d.timeline || []), { time, text: text.trim() }] } : d
      ),
      discrepancies: prev.discrepancies.map((s) =>
        s.id === id ? { ...s, timeline: [...(s.timeline || []), { time, text: text.trim() }] } : s
      ),
    }))
    setOrderNoteText('')
    notify('Note added to timeline')
  }

  return (
    <div className="wa-container">
      {/* Deep Forest Green Header */}
      <header className="wa-header">
        <h1>طلب شراء | Purchase Request</h1>
        <p>الاعتماد بيروح واتساب · WhatsApp Approval Flow · Poster Stock Linked</p>
      </header>

      {/* Top Controls Bar */}
      <div className="wa-controls-bar">
        <div className="wa-control-group">
          <div className="wa-pill-select">
            <span>🏪 {isAr ? 'المطعم:' : 'Restaurant:'}</span>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {isAr ? b.nameAr : b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="wa-pill-select">
            <span>👤 {isAr ? 'الدور:' : 'Role:'}</span>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {isAr ? r.labelAr : r.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="wa-control-group">
          <button className={`wa-lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>
            EN
          </button>
          <button className={`wa-lang-btn ${lang === 'ar' ? 'active' : ''}`} onClick={() => setLang('ar')}>
            مصري
          </button>
          <button
            className="wa-btn ghost"
            style={{ padding: '6px 10px', fontSize: 12 }}
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY)
              setState(INITIAL_STATE)
              notify('Reset done')
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Horizontal Top Tabs */}
      <div className="wa-tabs">
        {role.tabs.includes('daily') && (
          <button className={activeTab === 'daily' ? 'active' : ''} onClick={() => setActiveTab('daily')}>
            🥬 {isAr ? 'طلب يومي | Daily' : 'Daily Request'}
            <small>{isAr ? 'خضار - فاكهة - ستوك يومي' : 'Kitchen · Bar · Cost Control Office'}</small>
          </button>
        )}
        {role.tabs.includes('my_orders') && (
          <button className={activeTab === 'my_orders' ? 'active' : ''} onClick={() => setActiveTab('my_orders')}>
            📋 {isAr ? 'طلباتي' : 'My Orders'}
            <small>{isAr ? 'حالة الطلبات والتحديثات' : 'Status & Timeline'}</small>
          </button>
        )}
        {role.tabs.includes('periodic') && (
          <button className={activeTab === 'periodic' ? 'active' : ''} onClick={() => setActiveTab('periodic')}>
            🍽️ {isAr ? 'مشتريات دورية | Periodic' : 'Periodic Purchases'}
            <small>{isAr ? 'أدوات المطبخ والبار والمعدات' : 'Manager → Cost Control Manager → Owner'}</small>
          </button>
        )}
        {role.tabs.includes('receiving') && (
          <button className={activeTab === 'receiving' ? 'active' : ''} onClick={() => setActiveTab('receiving')}>
            🚚 {isAr ? 'الاستلام' : 'Receiving'}
            <small>{isAr ? 'تأكيد الكمية اللي وصلت' : 'Confirm arrival (auto-flags shortages)'}</small>
          </button>
        )}
        {role.tabs.includes('history') && (
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
            📋 {isAr ? 'سجل اليومي والدوري' : 'Orders History'}
            <small>{isAr ? `كل طلبات ${branchTitle}` : `Daily & Periodic · ${branchTitle}`}</small>
          </button>
        )}
        {role.tabs.includes('shortages') && (
          <button className={activeTab === 'shortages' ? 'active' : ''} onClick={() => setActiveTab('shortages')}>
            ⚠️ {isAr ? 'وصل أقل من المطلوب' : 'Shortages'}
            <small>{branchShortages.filter((s) => s.status === 'Pending' || s.status === 'Open').length} pending</small>
          </button>
        )}
      </div>

      {/* Main Content Body */}
      <div className="wa-body">
        {/* ================= TAB 1: DAILY ================= */}
        {activeTab === 'daily' && (
          <div>
            <h2 style={{ marginTop: 0 }}>🥬 {isAr ? `طلب يومي · ${branchTitle}` : `Daily Purchase Request · ${branchTitle}`}</h2>

            {/* WhatsApp numbers box — ONLY for Kitchen/Bar/Manager who send Daily WhatsApp to Cost Control Office */}
            {(roleId === 'staff' || roleId === 'manager') && (
              <div className="wa-settings">
                <h3>📱 {isAr ? 'أرقام الواتساب (الطلب اليومي)' : 'Daily WhatsApp Numbers'}</h3>
                <div className="wa-grid">
                  <div className="wa-field">
                    <label>Cost Control Office WhatsApp</label>
                    <input placeholder="2010xxxxxxxx" value={waPhones.office} onChange={(e) => setWaPhones((p) => ({ ...p, office: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="wa-btn whatsapp" onClick={saveWaPhones}>💾 {isAr ? 'حفظ الأرقام' : 'Save Numbers'}</button>
                  <button className="wa-btn ghost" onClick={clearWaPhones}>🗑️ {isAr ? 'مسح' : 'Clear'}</button>
                </div>
              </div>
            )}

            {/* COST CONTROL OFFICE: Approve or Reject Daily Requests (No WhatsApp forwarding) */}
            {roleId === 'cost_office' && (
              <div className="wa-card">
                <h3 style={{ marginTop: 0 }}>👁️ Cost Control Office — Approve or Reject Daily Requests</h3>
                <div className="wa-table-wrap responsive-cards-table" style={{ marginTop: 8 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>ID / Date</th>
                        <th>From</th>
                        <th>Items & Poster Stock</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchDaily.map((d) => (
                        <tr key={d.id}>
                          <td data-label="ID / Date"><strong>{d.id}</strong><div style={{ fontSize: 12, color: '#666' }}>{d.date}</div></td>
                          <td data-label="From">{d.department}<div style={{ fontSize: 12, color: '#666' }}>{d.requestedBy}</div></td>
                          <td data-label="Items" className="td-stack">
                            {d.items.map((i, idx) => (
                              <div key={idx} style={{ marginBottom: 4 }}>
                                <strong>{i.name}</strong>: {i.qty} · <span className="wa-badge green">Stock: {i.stock}</span>
                              </div>
                            ))}
                          </td>
                          <td data-label="Status">
                            <span className={`wa-badge ${d.status.includes('Approved') ? 'green' : d.status.includes('Rejected') ? 'red' : 'amber'}`}>
                              {d.status}
                            </span>
                          </td>
                          <td data-label="Action" className="td-stack">
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button className="wa-btn" style={{ padding: '7px 12px', fontSize: 12.5, flex: '1 1 auto' }} onClick={() => approveDailyByOffice(d.id)}>
                                ✅ Approve
                              </button>
                              <button className="wa-btn red" style={{ padding: '7px 12px', fontSize: 12.5, flex: '1 1 auto' }} onClick={() => rejectDailyByOffice(d.id)}>
                                ❌ Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* COST CONTROL MANAGER: Daily is INFORMATION ONLY (no approve button, no order creation) */}
            {roleId === 'cost_control' && (
              <div className="wa-card">
                <h3 style={{ marginTop: 0 }}>👁️ Cost Control Manager — Daily Requests (Information Only)</h3>
                <p style={{ fontSize: 13, color: '#526359', marginTop: 0 }}>
                  Shown for information only (Cost Control Manager approves Periodic Purchases only).
                </p>
                <div className="wa-table-wrap responsive-cards-table" style={{ marginTop: 8 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>ID / Date</th>
                        <th>From</th>
                        <th>Items & Poster Stock</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchDaily.map((d) => (
                        <tr key={d.id}>
                          <td data-label="ID / Date"><strong>{d.id}</strong><div style={{ fontSize: 12, color: '#666' }}>{d.date}</div></td>
                          <td data-label="From">{d.department}<div style={{ fontSize: 12, color: '#666' }}>{d.requestedBy}</div></td>
                          <td data-label="Items" className="td-stack">
                            {d.items.map((i, idx) => (
                              <div key={idx}><strong>{i.name}</strong>: {i.qty} · <span className="wa-badge green">Stock: {i.stock}</span></div>
                            ))}
                          </td>
                          <td data-label="Status">
                            <span className={`wa-badge ${d.status.includes('Approved') ? 'green' : d.status.includes('Rejected') ? 'red' : 'amber'}`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* KITCHEN / BAR / RESTAURANT MANAGER: Create Daily with +/- steppers & send ONLY to Cost Control Office */}
            {(roleId === 'staff' || roleId === 'manager') && (
              <>
                <div className="wa-grid-3">
                  <div className="wa-field">
                    <label>{isAr ? 'التاريخ / Date' : 'Date'}</label>
                    <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} />
                  </div>
                  <div className="wa-field">
                    <label>{isAr ? 'القسم / Department' : 'Department'}</label>
                    <select value={dailyDept} onChange={(e) => setDailyDept(e.target.value)}>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Bar">Bar</option>
                    </select>
                  </div>
                  <div className="wa-field">
                    <label>{isAr ? 'اسم الطالب / Requested By' : 'Requested By'}</label>
                    <input value={dailyRequester} onChange={(e) => setDailyRequester(e.target.value)} />
                  </div>
                </div>

                <div className="wa-table-wrap">
                  <div className="daily-row-head">
                    <div>{isAr ? 'اسم الصنف / Item' : 'Item Name'}</div>
                    <div>{isAr ? 'بوستر / Stock' : 'In Stock'}</div>
                    <div>{isAr ? 'الكمية / Order Qty' : 'Order Qty'}</div>
                    <div>{isAr ? 'ملاحظات / Notes' : 'Notes'}</div>
                    <div></div>
                  </div>
                  {dailyRows.map((row, idx) => (
                    <div key={idx} className="daily-row-grid">
                      <div>
                        <div className="per-cell-label">
                          <span>{isAr ? 'اسم الصنف / Item' : `Item #${idx + 1}`}</span>
                          <button
                            type="button"
                            className="wa-btn ghost per-remove-mobile-btn"
                            onClick={() => setDailyRows((p) => p.filter((_, i) => i !== idx))}
                          >
                            ✕ Remove
                          </button>
                        </div>
                        <input
                          list="poster-stock-datalist"
                          placeholder="e.g. Tomatoes"
                          value={row.name}
                          onChange={(e) => setDailyRows((p) => p.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))}
                        />
                      </div>

                      <div className="per-steppers-pair">
                        <div>
                          <div className="per-cell-label">{isAr ? 'الموجود / Stock' : 'In Stock (Poster)'}</div>
                          <span className="wa-badge green">{findStock(row.name)}</span>
                        </div>

                        <div>
                          <div className="per-cell-label">{isAr ? 'الكمية المطلوبة / Order Qty' : 'Order Qty'}</div>
                          <div className="stepper-box">
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() =>
                                setDailyRows((p) =>
                                  p.map((r, i) => (i === idx ? { ...r, qty: String(Math.max(0, Number(r.qty || 0) - 1)) } : r))
                                )
                              }
                            >
                              −
                            </button>
                            <input
                              type="number"
                              className="stepper-val"
                              value={row.qty}
                              onChange={(e) => setDailyRows((p) => p.map((r, i) => (i === idx ? { ...r, qty: e.target.value } : r)))}
                            />
                            <button
                              type="button"
                              className="stepper-btn plus"
                              onClick={() =>
                                setDailyRows((p) =>
                                  p.map((r, i) => (i === idx ? { ...r, qty: String(Number(r.qty || 0) + 1) } : r))
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="per-cell-label">{isAr ? 'ملاحظات / Notes' : 'Notes'}</div>
                        <input
                          placeholder="Optional"
                          value={row.notes}
                          onChange={(e) => setDailyRows((p) => p.map((r, i) => (i === idx ? { ...r, notes: e.target.value } : r)))}
                        />
                      </div>

                      <div className="per-remove-desktop-cell">
                        <button className="wa-btn ghost" style={{ padding: '6px 10px' }} onClick={() => setDailyRows((p) => p.filter((_, i) => i !== idx))}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <datalist id="poster-stock-datalist">
                  {stockOptions.map((s, i) => (
                    <option key={i} value={isAr ? s.nameAr : s.name}>
                      {s.name} · {s.nameAr} (Stock: {s.stock} {s.unit})
                    </option>
                  ))}
                </datalist>

                <div className="per-actions-bar">
                  <button className="wa-btn ghost" onClick={() => setDailyRows((p) => [...p, { name: '', qty: '1', notes: '' }])}>
                    + {isAr ? 'إضافة صنف' : 'Add Item'}
                  </button>
                  <button className="wa-btn" onClick={submitDaily}>
                    ✅ {isAr ? 'حفظ الطلب وإرساله لمكتب Cost Control' : 'Save Daily Request'}
                  </button>
                </div>

                <div className="wa-box">
                  <b>📱 {isAr ? 'إرسال الطلب اليومي لـ Cost Control Office فقط:' : 'Send Daily Request to Cost Control Office (Approval):'}</b>
                  <div style={{ marginTop: 10 }}>
                    <button
                      className="wa-btn whatsapp"
                      onClick={() => {
                        const lines = dailyRows
                          .filter((r) => r.name && r.qty)
                          .map((r) => `- ${r.name} | Stock: ${findStock(r.name)} | Order: ${r.qty} ${r.notes ? `(${r.notes})` : ''}`)
                          .join('\n')
                        sendWhatsApp(waPhones.office, `🥬 Daily Request\nRestaurant: ${branchTitle} (${dailyDept})\nBy: ${dailyRequester}\nDate: ${dailyDate}\n\n${lines}`)
                      }}
                    >
                      📱 {isAr ? 'ابعت لمكتب Cost Control للموافقة' : 'Send to Cost Control Office (WhatsApp)'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB 2: MY ORDERS (STAFF TWO-PANE TIMELINE) ================= */}
        {activeTab === 'my_orders' && (
          <div>
            <h2 style={{ marginTop: 0 }}>📋 {isAr ? `طلباتي · ${branchTitle}` : `My Orders · ${branchTitle}`}</h2>
            <div className="wa-grid-2">
              <div>
                {branchDaily.map((d) => (
                  <div
                    key={d.id}
                    className="wa-card"
                    style={{
                      cursor: 'pointer',
                      borderColor: selectedOrderId === d.id ? '#0e3a2a' : '#dfe6dc',
                      background: selectedOrderId === d.id ? '#f2f9f4' : '#fff',
                      marginBottom: 10,
                    }}
                    onClick={() => setSelectedOrderId(d.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{d.id} · {d.department}</strong>
                      <span className={`wa-badge ${d.status.includes('Approved') ? 'green' : 'amber'}`}>{d.status}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#526359', marginTop: 4 }}>
                      {d.date} · {d.items.map((i) => `${i.name} (${i.qty})`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              {(() => {
                const ord = branchDaily.find((d) => d.id === selectedOrderId) || branchDaily[0]
                if (!ord) return <div className="wa-card">No orders yet.</div>
                return (
                  <div className="wa-card">
                    <h3 style={{ marginTop: 0 }}>{ord.id} · {ord.department}</h3>
                    <div style={{ marginBottom: 10 }}>
                      {ord.items.map((i, idx) => (
                        <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #eef2ec', display: 'flex', justifyContent: 'space-between' }}>
                          <span><strong>{i.name}</strong></span>
                          <span>Qty: <strong>{i.qty}</strong></span>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: '#f8faf7', padding: 12, borderRadius: 10, marginBottom: 12 }}>
                      <strong style={{ display: 'block', marginBottom: 8 }}>Timeline</strong>
                      <div className="timeline-list">
                        {(ord.timeline || []).map((t, i) => (
                          <div key={i} className="timeline-item">
                            <span className="timeline-dot" />
                            <span><strong>{t.time}</strong> — {t.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        className="wa-field"
                        style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #cfd9cb', borderRadius: 8 }}
                        placeholder="Add a photo or note..."
                        value={orderNoteText}
                        onChange={(e) => setOrderNoteText(e.target.value)}
                      />
                      <button className="wa-btn" onClick={() => addTimelineNote(ord.id, orderNoteText)}>
                        📎 Add note
                      </button>
                    </div>
                    <button
                      className="wa-btn ghost"
                      style={{ width: '100%' }}
                      onClick={() => addTimelineNote(ord.id, 'Asked Cost Control Office for update')}
                    >
                      Ask for update
                    </button>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* ================= TAB 3: PERIODIC (NO PRICES, 4 SUBCATEGORIES, MANUAL INVENTORY -> NEED) ================= */}
        {activeTab === 'periodic' && (
          <div>
            <h2 style={{ marginTop: 0 }}>
              🍽️ {isAr ? `مشتريات دورية · ${branchTitle}` : `Periodic Purchases · ${branchTitle}`}
              <div style={{ fontSize: 13, fontWeight: 500, color: '#526359', marginTop: 4 }}>
                Tableware & Glassware · Kitchen & Bar Tools · Small Equipment · Linen & Textiles
              </div>
            </h2>

            {roleId !== 'owner' && (
              <div className="wa-settings">
                <h3>📱 {isAr ? 'أرقام الواتساب - الدوري' : 'Periodic WhatsApp Numbers'}</h3>
                <div className="wa-grid">
                  {roleId === 'manager' && (
                    <div className="wa-field">
                      <label>Cost Control Manager WhatsApp</label>
                      <input placeholder="2010xxxxxxxx" value={waPhones.costMgr} onChange={(e) => setWaPhones((p) => ({ ...p, costMgr: e.target.value }))} />
                    </div>
                  )}
                  {roleId === 'cost_control' && (
                    <>
                      <div className="wa-field">
                        <label>Cost Control Office WhatsApp</label>
                        <input placeholder="2010xxxxxxxx" value={waPhones.office} onChange={(e) => setWaPhones((p) => ({ ...p, office: e.target.value }))} />
                      </div>
                      <div className="wa-field">
                        <label>Owner / Lyudmyla WhatsApp</label>
                        <input placeholder="2010xxxxxxxx" value={waPhones.owner} onChange={(e) => setWaPhones((p) => ({ ...p, owner: e.target.value }))} />
                      </div>
                    </>
                  )}
                  {roleId === 'cost_office' && (
                    <div className="wa-field">
                      <label>Owner / Lyudmyla WhatsApp</label>
                      <input placeholder="2010xxxxxxxx" value={waPhones.owner} onChange={(e) => setWaPhones((p) => ({ ...p, owner: e.target.value }))} />
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="wa-btn whatsapp" onClick={saveWaPhones}>💾 Save Numbers</button>
                  <button className="wa-btn ghost" onClick={clearWaPhones}>🗑️ Clear</button>
                </div>
              </div>
            )}

            {/* Restaurant Manager & Cost Control Manager: Create Periodic Request (auto-fills last Inventory + +/- steppers, NO PRICES) */}
            {(roleId === 'manager' || roleId === 'cost_control') && (
              <div className="wa-card">
                <div className="wa-grid-3" style={{ marginBottom: 12 }}>
                  <div className="wa-field">
                    <label>Request No.</label>
                    <input value={perReqNo} onChange={(e) => setPerReqNo(e.target.value)} />
                  </div>
                  <div className="wa-field">
                    <label>Date</label>
                    <input type="date" value={perDate} onChange={(e) => setPerDate(e.target.value)} />
                  </div>
                  <div className="wa-field">
                    <label>Department</label>
                    <select value={perDept} onChange={(e) => setPerDept(e.target.value)}>
                      <option>Restaurant</option>
                      <option>Kitchen</option>
                      <option>Bar</option>
                      <option>Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="wa-table-wrap">
                  <div className="per-row-head">
                    <div>Category</div>
                    <div>Item</div>
                    <div>Have Now</div>
                    <div>Need to Order</div>
                    <div></div>
                  </div>
                  {perRows.map((row, idx) => {
                    const catItems = supplyItems.filter((s) => s.subType === row.category)
                    const q = (row.name || '').trim().toLowerCase()
                    const exactMatch = catItems.some((s) => s.name.toLowerCase() === q)
                    const filteredCatItems = !q || exactMatch
                      ? catItems
                      : catItems.filter((s) => s.name.toLowerCase().includes(q) || s.nameAr.includes(row.name.trim()))
                    return (
                      <div key={idx} className="per-row-grid">
                        <div>
                          <div className="per-cell-label">
                            <span>Category</span>
                            <button
                              type="button"
                              className="wa-btn ghost per-remove-mobile-btn"
                              onClick={() => setPerRows((p) => p.filter((_, i) => i !== idx))}
                            >
                              ✕ Remove
                            </button>
                          </div>
                          <select
                            value={row.category}
                            onChange={(e) => {
                              const newCat = e.target.value
                              const firstInCat = supplyItems.find((s) => s.subType === newCat)
                              const lastInv = firstInCat ? getLastInventory(firstInCat.name) : 0
                              setPerRows((p) =>
                                p.map((r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        category: newCat,
                                        name: firstInCat ? firstInCat.name : '',
                                        specs: firstInCat ? firstInCat.spec : '',
                                        inventory: firstInCat ? String(lastInv) : '0',
                                      }
                                    : r
                                )
                              )
                              setOpenPerComboIdx(null)
                            }}
                          >
                            <option value="Tableware & Glassware">{isAr ? 'أطباق وكاسات وأدوات مائدة' : 'Tableware & Glassware'}</option>
                            <option value="Kitchen & Bar Tools">{isAr ? 'أدوات المطبخ والبار' : 'Kitchen & Bar Tools'}</option>
                            <option value="Small Equipment">{isAr ? 'معدات صغيرة' : 'Small Equipment'}</option>
                            <option value="Linen & Textiles">{isAr ? 'مفروشات وملابس' : 'Linen & Textiles'}</option>
                            <option value="Spare Parts">{isAr ? 'قطع غيار' : 'Spare Parts'}</option>
                          </select>
                        </div>

                        <div>
                          <div className="per-cell-label">Item (type or choose)</div>
                          <div className="combo-wrap">
                            <div className="combo-input-row">
                              <input
                                type="text"
                                placeholder={isAr ? 'اكتب أو اختر الصنف...' : 'Type or pick item...'}
                                value={row.name}
                                onFocus={() => setOpenPerComboIdx(idx)}
                                onBlur={() => setTimeout(() => setOpenPerComboIdx((cur) => (cur === idx ? null : cur)), 160)}
                                onChange={(e) => {
                                  const val = e.target.value
                                  const match = catItems.find((s) => s.name.toLowerCase() === val.trim().toLowerCase())
                                  setPerRows((p) =>
                                    p.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            name: val,
                                            specs: match ? match.spec : '',
                                            inventory: match ? String(getLastInventory(match.name)) : r.inventory,
                                          }
                                        : r
                                    )
                                  )
                                  setOpenPerComboIdx(idx)
                                }}
                              />
                              {catItems.length > 0 && (
                                <button
                                  type="button"
                                  className="combo-toggle-btn"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => setOpenPerComboIdx((cur) => (cur === idx ? null : idx))}
                                  aria-label="Toggle items list"
                                >
                                  ▾
                                </button>
                              )}
                            </div>

                            {openPerComboIdx === idx && catItems.length > 0 && (
                              <div className="combo-menu">
                                {filteredCatItems.length === 0 ? (
                                  <div className="combo-option" style={{ color: '#526359', cursor: 'default' }}>
                                    <span>{isAr ? `صنف مخصص: "${row.name}"` : `Custom item: "${row.name}" (will be saved as typed)`}</span>
                                  </div>
                                ) : (
                                  filteredCatItems.map((s) => (
                                    <div
                                      key={s.id}
                                      className="combo-option"
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        const lastInv = getLastInventory(s.name)
                                        setPerRows((p) =>
                                          p.map((r, i) =>
                                            i === idx
                                              ? {
                                                  ...r,
                                                  name: s.name,
                                                  specs: s.spec,
                                                  inventory: String(lastInv),
                                                }
                                              : r
                                          )
                                        )
                                        setOpenPerComboIdx(null)
                                      }}
                                    >
                                      <span>
                                        <b>{isAr ? s.nameAr : s.name}</b>
                                        <span style={{ color: '#526359', marginInlineStart: 6, fontSize: 12 }}>
                                          {isAr ? s.name : s.nameAr}
                                        </span>
                                      </span>
                                      <small>Stock: {getLastInventory(s.name)}</small>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                          {row.specs && (
                            <div style={{ fontSize: 11.5, color: '#526359', marginTop: 3 }}>
                              {row.specs}
                            </div>
                          )}
                        </div>

                        <div className="per-steppers-pair">
                          <div>
                            <div className="per-cell-label">Inventory (Have Now)</div>
                            <div className="stepper-box">
                              <button
                                type="button"
                                className="stepper-btn"
                                onClick={() =>
                                  setPerRows((p) =>
                                    p.map((r, i) => (i === idx ? { ...r, inventory: String(Math.max(0, Number(r.inventory || 0) - 1)) } : r))
                                  )
                                }
                              >
                                −
                              </button>
                              <input
                                type="number"
                                className="stepper-val"
                                value={row.inventory}
                                onChange={(e) => setPerRows((p) => p.map((r, i) => (i === idx ? { ...r, inventory: e.target.value } : r)))}
                              />
                              <button
                                type="button"
                                className="stepper-btn plus"
                                onClick={() =>
                                  setPerRows((p) =>
                                    p.map((r, i) => (i === idx ? { ...r, inventory: String(Number(r.inventory || 0) + 1) } : r))
                                  )
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div>
                            <div className="per-cell-label">Need to Order</div>
                            <div className="stepper-box">
                              <button
                                type="button"
                                className="stepper-btn"
                                onClick={() =>
                                  setPerRows((p) =>
                                    p.map((r, i) => (i === idx ? { ...r, qty: String(Math.max(0, Number(r.qty || 0) - 1)) } : r))
                                  )
                                }
                              >
                                −
                              </button>
                              <input
                                type="number"
                                className="stepper-val"
                                value={row.qty}
                                onChange={(e) => setPerRows((p) => p.map((r, i) => (i === idx ? { ...r, qty: e.target.value } : r)))}
                              />
                              <button
                                type="button"
                                className="stepper-btn plus"
                                onClick={() =>
                                  setPerRows((p) =>
                                    p.map((r, i) => (i === idx ? { ...r, qty: String(Number(r.qty || 0) + 1) } : r))
                                  )
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="per-remove-desktop-cell">
                          <button className="wa-btn ghost" style={{ padding: '6px 10px' }} onClick={() => setPerRows((p) => p.filter((_, i) => i !== idx))}>✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="per-actions-bar">
                  <button
                    className="wa-btn ghost"
                    onClick={() =>
                      setPerRows((p) => [
                        ...p,
                        { name: 'White Napkin for wine', specs: 'Cotton linen service napkin', category: 'Linen & Textiles', inventory: String(getLastInventory('White Napkin for wine')), qty: '1' },
                      ])
                    }
                  >
                    + Add Item
                  </button>
                  <button className="wa-btn" onClick={savePeriodic}>
                    ✅ Save Periodic Request
                  </button>
                </div>
              </div>
            )}

            {/* Approval Workflow — Grouped by Person Whose Approval We Are Waiting For */}
            {branchPeriodic.length > 0 && (() => {
              const waitingStep1 = branchPeriodic.filter((p) => !p.step1?.approved && !p.status.includes('Rejected'))
              const waitingStep2 = branchPeriodic.filter((p) => p.step1?.approved && !p.step2?.approved && !p.step2?.rejected && !p.status.includes('Rejected'))
              const waitingStep3 = branchPeriodic.filter((p) => p.step2?.approved && !p.step3?.approved && !p.step3?.rejected && p.status.includes('Owner') && !p.status.includes('Cost Control Office'))
              const completedOrRejected = branchPeriodic.filter(
                (p) => !waitingStep1.includes(p) && !waitingStep2.includes(p) && !waitingStep3.includes(p)
              )

              const buckets = [
                {
                  num: 1,
                  title: '1 - Restaurant Manager',
                  subtitle: isAr ? 'في انتظار اعتماد مدير المطعم' : 'Waiting for Restaurant Manager approval',
                  items: waitingStep1,
                  canAct: roleId === 'manager',
                  reminderPhone: waPhones.office,
                  reminderLabel: '📱 Send Reminder to Manager',
                },
                {
                  num: 2,
                  title: '2 - Cost Control Manager',
                  subtitle: isAr ? 'تم اعتمادها من مدير المطعم · في انتظار Cost Control Manager' : 'Approved by Manager · Waiting for Cost Control Manager',
                  items: waitingStep2,
                  canAct: roleId === 'cost_control',
                  reminderPhone: waPhones.costMgr,
                  reminderLabel: '📱 Send Reminder to Cost Control Manager',
                },
                {
                  num: 3,
                  title: '3 - Owner (Lyudmyla)',
                  subtitle: isAr ? 'في انتظار الاعتماد النهائي من المالكة' : 'Waiting for Owner final approval',
                  items: waitingStep3,
                  canAct: roleId === 'owner',
                  reminderPhone: waPhones.owner,
                  reminderLabel: '📱 Send Reminder to Owner',
                },
              ]

              return (
                <div style={{ marginTop: 18 }}>
                  <h3 style={{ margin: '0 0 6px' }}>Periodic Approval Queues — {branchTitle}</h3>
                  <div style={{ fontSize: 13, color: '#526359', marginBottom: 8 }}>
                    {isAr
                      ? 'كل طلب يظهر مباشرة داخل خانة الشخص المطلوب اعتماده حالياً'
                      : 'Each request sits directly inside the section of the person whose approval is pending.'}
                  </div>

                  {buckets.map((bucket) => (
                    <div key={bucket.num} className={`approval-bucket ${bucket.items.length > 0 ? 'has-pending' : ''}`}>
                      <div className="approval-bucket-head">
                        <div>
                          <b style={{ fontSize: 15, color: '#0e3a2a' }}>{bucket.title}</b>
                          <div style={{ fontSize: 12, color: '#526359', marginTop: 2 }}>{bucket.subtitle}</div>
                        </div>
                        <span className={`wa-badge ${bucket.items.length > 0 ? 'amber' : 'gray'}`}>
                          {bucket.items.length > 0 ? `${bucket.items.length} Pending` : 'No pending'}
                        </span>
                      </div>

                      {bucket.items.map((req) => (
                        <div key={req.id} className="wf-request-box">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <b style={{ fontSize: 15, color: '#0e3a2a' }}>
                              {req.id} · {branchTitle} ({req.department})
                            </b>
                            <span className="wa-badge amber">Pending · {req.date}</span>
                          </div>

                          <div className="wf-meta-row">
                            {req.step1?.approved && (
                              <span style={{ color: '#146c43' }}>
                                ✅ Approved by Restaurant Manager: <b>{req.step1.name}</b> ({req.step1.time})
                              </span>
                            )}
                            {req.step2?.approved && (
                              <span style={{ color: '#146c43' }}>
                                ✅ Approved by Cost Control Manager: <b>{req.step2.name}</b> ({req.step2.time})
                              </span>
                            )}
                          </div>

                          <div className="wf-items-list">
                            <div className="wf-item-row head">
                              <div>Category</div>
                              <div>Item</div>
                              <div>Have Now</div>
                              <div>Need to Order</div>
                            </div>
                            {req.items.map((item, idx) => (
                              <div key={idx} className="wf-item-row">
                                <div style={{ color: '#526359', fontSize: 12 }}>{item.category || 'Non-food'}</div>
                                <div>
                                  <b>{item.name}</b>
                                  {item.specs && <div style={{ fontSize: 11.5, color: '#526359' }}>{item.specs}</div>}
                                </div>
                                <div>Have: <b>{item.inventory ?? 0}</b></div>
                                <div>Order: <b style={{ color: '#0e3a2a' }}>{item.qty}</b></div>
                              </div>
                            ))}
                          </div>

                          {bucket.canAct ? (
                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #eef2ec' }}>
                              <div className="wa-grid">
                                <div className="wa-field">
                                  <label>Name</label>
                                  <input
                                    placeholder="Your name"
                                    value={stepInputs[bucket.num].name}
                                    onChange={(e) => setStepInputs((p) => ({ ...p, [bucket.num]: { ...p[bucket.num], name: e.target.value } }))}
                                  />
                                </div>
                                <div className="wa-field">
                                  <label>Signature</label>
                                  <input
                                    placeholder="Type name as signature"
                                    value={stepInputs[bucket.num].sig}
                                    onChange={(e) => setStepInputs((p) => ({ ...p, [bucket.num]: { ...p[bucket.num], sig: e.target.value } }))}
                                  />
                                </div>
                                <div className="wa-field">
                                  <label>Notes</label>
                                  <input
                                    placeholder="Optional (or reject reason)"
                                    value={stepInputs[bucket.num].notes}
                                    onChange={(e) => setStepInputs((p) => ({ ...p, [bucket.num]: { ...p[bucket.num], notes: e.target.value } }))}
                                  />
                                </div>
                              </div>
                              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button className="wa-btn" onClick={() => approvePeriodicStep(req.id, bucket.num, false)}>
                                  ✅ Approve
                                </button>
                                {bucket.num === 2 && (
                                  <button className="wa-btn amber" onClick={() => approvePeriodicStep(req.id, 2, true)}>
                                    📤 Approve & Send to Owner
                                  </button>
                                )}
                                {(bucket.num === 2 || bucket.num === 3) && (
                                  <button className="wa-btn red" onClick={() => rejectPeriodicStep(req.id, bucket.num)}>
                                    ❌ Reject
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                className="wa-btn whatsapp"
                                onClick={() =>
                                  sendWhatsApp(
                                    bucket.reminderPhone,
                                    `⏰ Reminder: Periodic Request ${req.id} (${branchTitle} - ${req.department}) is waiting for your approval.\n${req.items.map((i) => `- ${i.name} (Have: ${i.inventory ?? 0}, Need: ${i.qty})`).join('\n')}`
                                  )
                                }
                              >
                                {bucket.reminderLabel}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  {completedOrRejected.length > 0 && (
                    <div className="approval-bucket">
                      <div className="approval-bucket-head">
                        <b style={{ fontSize: 15, color: '#0e3a2a' }}>✅ Completed / Closed Requests</b>
                        <span className="wa-badge green">{completedOrRejected.length}</span>
                      </div>
                      {completedOrRejected.map((req) => (
                        <div key={req.id} className="wf-request-box" style={{ background: req.status.includes('Rejected') ? '#fff8f8' : '#f7fbf8' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <b>{req.id} · {req.department} ({req.date})</b>
                            <span className={`wa-badge ${req.status.includes('Rejected') ? 'red' : 'green'}`}>{req.status}</span>
                          </div>
                          <div style={{ fontSize: 12.5, color: '#2b3a31', marginTop: 6 }}>
                            {req.items.map((i) => `${i.name} (Have: ${i.inventory ?? 0} → Order: ${i.qty})`).join(' · ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* ================= TAB 4: RECEIVING (1-TAP OK OR AUTO-CREATE PENDING SHORTAGE) ================= */}
        {activeTab === 'receiving' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ margin: 0 }}>🚚 {isAr ? `الاستلام · ${branchTitle}` : `Receiving · ${branchTitle}`}</h2>
              {branchPOs.length > 0 && (
                <select
                  className="wa-pill-select"
                  value={activeRcvPo?.id || ''}
                  onChange={(e) => {
                    const next = branchPOs.find((p) => p.id === e.target.value)
                    setRcvPoId(e.target.value)
                    if (next) setRcvArrived(String(Math.max(0, next.orderedQty - next.receivedQty)))
                  }}
                >
                  {branchPOs.map((p) => (
                    <option key={p.id} value={p.id}>{p.id} · {p.itemName} ({p.status})</option>
                  ))}
                </select>
              )}
            </div>

            {!activeRcvPo ? (
              <div className="wa-card" style={{ marginTop: 14 }}>No pending deliveries for {branchTitle}.</div>
            ) : (
              (() => {
                const rem = Number((activeRcvPo.orderedQty - activeRcvPo.receivedQty).toFixed(3))
                const acc = Math.min(rem, Math.max(0, Number(rcvArrived || 0)))
                const missing = Number((rem - acc).toFixed(3))
                return (
                  <div className="wa-card" style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                      <div>
                        <strong style={{ fontSize: 17 }}>{activeRcvPo.emoji} {activeRcvPo.itemName}</strong>
                        <div style={{ fontSize: 13, color: '#526359' }}>{activeRcvPo.spec} · Supplier: {activeRcvPo.supplier}</div>
                      </div>
                      {rem > 0 && (
                        <button
                          type="button"
                          className="wa-btn whatsapp"
                          onClick={() => setRcvArrived(String(rem))}
                        >
                          ✅ All {rem} {activeRcvPo.unit} arrived OK
                        </button>
                      )}
                    </div>

                    <div className="wa-grid" style={{ marginBottom: 14 }}>
                      <div className="wa-field">
                        <label>Ordered / Remaining</label>
                        <input readOnly value={`${rem} ${activeRcvPo.unit}`} style={{ background: '#f4f7f3', fontWeight: 700 }} />
                      </div>
                      <div className="wa-field">
                        <label>Arrived & Accepted ({activeRcvPo.unit})</label>
                        <input type="number" step="any" min="0" max={rem} value={rcvArrived} onChange={(e) => setRcvArrived(e.target.value)} style={{ fontWeight: 700 }} />
                      </div>
                      <div className="wa-field">
                        <label>Delivery Note #</label>
                        <input value={rcvNoteNo} onChange={(e) => setRcvNoteNo(e.target.value)} />
                      </div>
                    </div>

                    {missing > 0 && (
                      <div style={{ background: '#fef3dc', border: '1px solid #f5d89a', borderRadius: 12, padding: 12, marginBottom: 14 }}>
                        <strong style={{ color: '#9a4d06' }}>⚠️ Missing {missing} {activeRcvPo.unit} — will automatically appear in Shortages (Pending)</strong>
                        <div className="chip-row" style={{ marginTop: 8 }}>
                          {['Damaged packaging', 'Short delivery', 'Wrong item', 'Expired'].map((rs) => (
                            <button
                              key={rs}
                              type="button"
                              className={`chip-btn ${rcvReason === rs ? 'active' : ''}`}
                              onClick={() => setRcvReason(rs)}
                            >
                              {rs}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="wa-grid" style={{ marginBottom: 14 }}>
                      <div className="wa-field">
                        <label>Temp °C</label>
                        <input value={rcvTemp} onChange={(e) => setRcvTemp(e.target.value)} />
                      </div>
                      <div className="wa-field">
                        <label>Expiry Date</label>
                        <input type="date" value={rcvExpiry} onChange={(e) => setRcvExpiry(e.target.value)} />
                      </div>
                    </div>

                    <button className="wa-btn" disabled={rem <= 0 || acc <= 0} onClick={confirmReceiving}>
                      ✅ {rem <= 0 ? 'Fully received' : `Save Receipt (${acc} ${activeRcvPo.unit})`}
                    </button>
                  </div>
                )
              })()
            )}
          </div>
        )}

        {/* ================= TAB 5: ORDERS HISTORY (DAILY & PERIODIC) ================= */}
        {activeTab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ margin: 0 }}>📋 {isAr ? `سجل اليومي والدوري · ${branchTitle}` : `Orders History (Daily & Periodic) · ${branchTitle}`}</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {['All', 'Daily', 'Periodic'].map((f) => (
                  <button key={f} className={`wa-lang-btn ${historyFilter === f ? 'active' : ''}`} onClick={() => setHistoryFilter(f)}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="wa-table-wrap responsive-cards-table">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>ID / Date</th>
                    <th>Department</th>
                    <th>Items Ordered</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...(historyFilter !== 'Periodic'
                      ? state.dailyRequests
                          .filter((d) => d.branchId === branchId)
                          .map((d) => ({
                            type: 'Daily',
                            id: d.id,
                            date: d.date,
                            dept: `${d.department} (${d.requestedBy})`,
                            items: d.items.map((i) => `${i.name}: ${i.qty} (Stock: ${i.stock})`).join(' · '),
                            status: d.status,
                          }))
                      : []),
                    ...(historyFilter !== 'Daily'
                      ? state.periodicRequests
                          .filter((p) => p.branchId === branchId)
                          .map((p) => ({
                            type: 'Periodic',
                            id: p.id,
                            date: p.date,
                            dept: p.department,
                            items: p.items.map((i) => `${i.name}: Need ${i.qty} (Inv: ${i.inventory ?? 0})`).join(' · '),
                            status: p.status,
                          }))
                      : []),
                  ].map((r) => (
                    <tr key={r.id}>
                      <td data-label="Type"><span className={`wa-badge ${r.type === 'Daily' ? 'green' : 'amber'}`}>{r.type}</span></td>
                      <td data-label="ID / Date"><strong>{r.id}</strong><div style={{ fontSize: 12, color: '#666' }}>{r.date}</div></td>
                      <td data-label="Department">{r.dept}</td>
                      <td data-label="Items" className="td-stack">{r.items}</td>
                      <td data-label="Status"><span className={`wa-badge ${r.status.includes('Waiting') ? 'amber' : r.status.includes('Rejected') ? 'red' : 'green'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 6: SHORTAGES (FACTUAL ONLY, STATUS = PENDING) ================= */}
        {activeTab === 'shortages' && (
          <div>
            <h2 style={{ marginTop: 0 }}>⚠️ {isAr ? `وصل أقل من المطلوب · ${branchTitle}` : `Arrived Less Than Ordered · ${branchTitle}`}</h2>
            <p style={{ color: '#526359', fontSize: 13.5, marginTop: 4 }}>
              {isAr
                ? 'عرض فعلي للأصناف التي وصلت بكمية أقل من المطلوب (تظهر تلقائياً من الاستلام).'
                : 'Factual view of items that actually arrived in a smaller quantity than ordered (auto-populated from Receiving).'}
            </p>

            <div className="wa-table-wrap responsive-cards-table">
              <table>
                <thead>
                  <tr>
                    <th>ID / Order</th>
                    <th>Item</th>
                    <th>Ordered</th>
                    <th>Arrived</th>
                    <th>Missing</th>
                    <th>Reason / Timeline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {branchShortages.map((s) => {
                    const missing = Math.max(0, Number((s.expectedQty - s.actualQty).toFixed(3)))
                    const displayStatus = s.status === 'Open' ? 'Pending' : s.status
                    return (
                      <tr key={s.id}>
                        <td data-label="ID / Order"><strong>{s.id}</strong><div style={{ fontSize: 12, color: '#666' }}>{s.refDoc}</div></td>
                        <td data-label="Item"><strong>{s.itemName}</strong></td>
                        <td data-label="Ordered">{s.expectedQty} {s.unit}</td>
                        <td data-label="Arrived">{s.actualQty} {s.unit}</td>
                        <td data-label="Missing"><span className="wa-badge red">−{missing} {s.unit}</span></td>
                        <td data-label="Reason / Timeline" className="td-stack">
                          <div>{s.nextAction}</div>
                          {s.timeline && s.timeline.length > 0 && (
                            <div style={{ fontSize: 11.5, color: '#526359', marginTop: 4 }}>
                              {s.timeline[s.timeline.length - 1].time} — {s.timeline[s.timeline.length - 1].text}
                            </div>
                          )}
                        </td>
                        <td data-label="Status"><span className={`wa-badge ${displayStatus === 'Closed' ? 'green' : 'amber'}`}>{displayStatus}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toast && <div className="wa-toast">{toast}</div>}
    </div>
  )
}
