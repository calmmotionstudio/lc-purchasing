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
  const isAr = roleId !== 'owner' && lang === 'ar'
  const isUk = roleId === 'owner' && lang === 'uk'

  useEffect(() => {
    if (roleId === 'owner' && lang === 'ar') setLang('en')
    if (roleId !== 'owner' && lang === 'uk') setLang('en')
  }, [roleId, lang])

  useEffect(() => {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr'
    document.documentElement.lang = isAr ? 'ar' : isUk ? 'uk' : 'en'
  }, [isAr, isUk])

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

  // Poster-linked stock lookup for Daily Requests (Food / Daily items ONLY — excludes Periodic Non-food)
  const stockOptions = useMemo(() => {
    const posterItems = state.posterSnapshot?.branches?.[branchId]?.items || []
    return [
      ...CURATED_CATALOG.filter((c) => c.category === 'Food').map((c) => ({
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
  const [openDailyComboIdx, setOpenDailyComboIdx] = useState(null)

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
    const time = new Date().toTimeString().slice(0, 5)
    setState((prev) => ({
      ...prev,
      periodicRequests: [
        {
          id: newId,
          branchId,
          date: perDate,
          department: perDept,
          status: 'Waiting Cost Control Manager',
          step1: {
            approved: true,
            name: roleId === 'cost_control' ? 'Cost Control Manager' : 'Restaurant Manager',
            sig: 'Submitted',
            time,
          },
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
    if (stepNum !== 3 && (!inp.name.trim() || !inp.sig.trim())) {
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
          next.step3 = { approved: true, name: 'Lyudmyla (Owner)', sig: 'Approved', notes: inp.notes, time }
          next.status = 'Fully Approved by Owner'
        }
        return next
      }),
    }))
    notify(
      escalateToOwner
        ? (isAr ? `✅ تم اعتماد ${perId} والإرسال للمالكة` : `✅ ${perId} approved & sent to Owner`)
        : isUk
        ? `✅ ${perId} погоджено`
        : isAr
        ? `✅ تم اعتماد ${perId}`
        : `✅ ${perId} approved`
    )
  }

  const rejectPeriodicStep = (perId, stepNum) => {
    const inp = stepInputs[stepNum]
    const reason = inp.notes?.trim() || (isUk ? 'Відхилено' : isAr ? 'مرفوض' : 'Rejected')
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
          next.step3 = { approved: false, rejected: true, name: 'Lyudmyla (Owner)', notes: reason, time }
        }
        return next
      }),
    }))
    notify(isUk ? `❌ ${perId} відхилено` : isAr ? `❌ تم رفض الطلب ${perId}` : `❌ ${perId} rejected`)
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
  const [expandedHistoryId, setExpandedHistoryId] = useState(null)
  const [expandedOwnerReqId, setExpandedOwnerReqId] = useState(null)
  const [expandedShortageId, setExpandedShortageId] = useState(null)

  const compactStatus = (st) => {
    if (!st) return '—'
    if (st.includes('Cost Control Office') && st.includes('Waiting')) return isUk ? '⏳ Офіс CC' : '⏳ CC Office'
    if (st.includes('Cost Control Manager') && st.includes('Waiting')) return isUk ? '⏳ Менеджер CC' : '⏳ CC Mgr'
    if (st.includes('Owner') && st.includes('Waiting')) return isUk ? '⏳ Власник' : '⏳ Owner'
    if (st.includes('Fully Approved')) return isUk ? '✅ Погоджено' : '✅ Owner OK'
    if (st.includes('Approved by Cost Control Manager')) return isUk ? '✅ Погоджено CC' : '✅ CC Approved'
    if (st.includes('Approved by Cost Control Office')) return isUk ? '✅ Погоджено' : '✅ Approved'
    if (st.includes('Rejected')) return isUk ? '❌ Відхилено' : '❌ Rejected'
    return st
  }
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
        <div className="header-eyebrow">● 4 RESTAURANTS · EL GOUNA & CAIRO</div>
        <h1>L&amp;C Operations</h1>
        <p>
          {isAr
            ? 'مركز التشغيل والمشتريات · مخزون بوستر · الاستلام وسجل الطلبات'
            : isUk
            ? 'Запити на закупівлю · Погодження · Залишки Poster · Прийомка та історія'
            : 'Purchasing Requests · Approvals · Poster Stock · Receiving & Orders History'}
        </p>
      </header>

      {/* Top Controls Bar */}
      <div className="wa-controls-bar">
        <div className="wa-control-group">
          <div className="wa-pill-select">
            <span>🏪 {isAr ? 'المطعم:' : isUk ? 'Ресторан:' : 'Restaurant:'}</span>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {isAr ? b.nameAr : b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="wa-pill-select">
            <span>👤 {isAr ? 'الدور:' : isUk ? 'Роль:' : 'Role:'}</span>
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
          {roleId === 'owner' ? (
            <button className={`wa-lang-btn ${lang === 'uk' ? 'active' : ''}`} onClick={() => setLang('uk')}>
              УКР
            </button>
          ) : (
            <button className={`wa-lang-btn ${lang === 'ar' ? 'active' : ''}`} onClick={() => setLang('ar')}>
              مصري
            </button>
          )}
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
            🍽️ {isAr ? 'مشتريات دورية | Periodic' : isUk ? 'Періодичні закупівлі' : 'Periodic Purchases'}
            <small>{isAr ? 'أدوات المطبخ والبار والمعدات' : isUk ? 'Погодження власника' : 'Manager → Cost Control Manager → Owner'}</small>
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
            📋 {isAr ? 'سجل اليومي والدوري' : isUk ? 'Історія замовлень' : 'Orders History'}
            <small>{isAr ? `كل طلبات ${branchTitle}` : isUk ? `Щоденні та періодичні · ${branchTitle}` : `Daily & Periodic · ${branchTitle}`}</small>
          </button>
        )}
        {role.tabs.includes('shortages') && (
          <button className={activeTab === 'shortages' ? 'active' : ''} onClick={() => setActiveTab('shortages')}>
            ⚠️ {isAr ? 'وصل أقل من المطلوب' : isUk ? 'Нестачі' : 'Shortages'}
            <small>{branchShortages.filter((s) => s.status === 'Pending' || s.status === 'Open').length} {isUk ? 'очікує' : 'pending'}</small>
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

            {/* COST CONTROL OFFICE: Approve or Reject Daily Requests (Separated cards with clear accents) */}
            {roleId === 'cost_office' && (
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>
                  👁️ {isAr ? 'مكتب مراقبة التكاليف — اعتماد أو رفض الطلبات اليومية' : 'Cost Control Office — Approve or Reject Daily Requests'}
                </h3>
                {branchDaily.map((d) => (
                  <div key={d.id} className="daily-review-card">
                    <div className="daily-review-head">
                      <div className="daily-review-meta">
                        <strong style={{ fontSize: 15, color: '#0e3a2a' }}>{d.id}</strong>
                        <span className="dept-pill">
                          {d.department === 'Bar' ? '🍸' : '🍳'} {d.department}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#2b3a31' }}>· {d.requestedBy}</span>
                        <span className="date-pill">📅 {d.date}</span>
                      </div>
                      <span className={`wa-badge ${d.status.includes('Approved') ? 'green' : d.status.includes('Rejected') ? 'red' : 'amber'}`}>
                        {d.status}
                      </span>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      {d.items.map((i, idx) => (
                        <div key={idx} className="history-detail-row">
                          <span>
                            <strong>{i.name}</strong>
                            <span className="wa-badge green" style={{ marginInlineStart: 8 }}>Stock: {i.stock}</span>
                          </span>
                          <strong style={{ color: '#0e3a2a' }}>× {i.qty}</strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="wa-btn" style={{ flex: '1 1 130px' }} onClick={() => approveDailyByOffice(d.id)}>
                        ✅ {isAr ? 'موافقة' : 'Approve'}
                      </button>
                      <button className="wa-btn red" style={{ flex: '1 1 130px' }} onClick={() => rejectDailyByOffice(d.id)}>
                        ❌ {isAr ? 'رفض' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COST CONTROL MANAGER: Daily is INFORMATION ONLY (no approve button, no order creation) */}
            {roleId === 'cost_control' && (
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 4 }}>
                  👁️ {isAr ? 'مدير مراقبة التكاليف — الطلبات اليومية (للعلم فقط)' : 'Cost Control Manager — Daily Requests (Information Only)'}
                </h3>
                <p style={{ fontSize: 13, color: '#526359', marginTop: 0, marginBottom: 12 }}>
                  {isAr ? 'للعلم فقط (الاعتماد من مكتب مراقبة التكاليف).' : 'Shown for information only (Cost Control Manager approves Periodic Purchases only).'}
                </p>
                {branchDaily.map((d) => (
                  <div key={d.id} className="daily-review-card">
                    <div className="daily-review-head">
                      <div className="daily-review-meta">
                        <strong style={{ fontSize: 15, color: '#0e3a2a' }}>{d.id}</strong>
                        <span className="dept-pill">
                          {d.department === 'Bar' ? '🍸' : '🍳'} {d.department}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#2b3a31' }}>· {d.requestedBy}</span>
                        <span className="date-pill">📅 {d.date}</span>
                      </div>
                      <span className={`wa-badge ${d.status.includes('Approved') ? 'green' : d.status.includes('Rejected') ? 'red' : 'amber'}`}>
                        {d.status}
                      </span>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      {d.items.map((i, idx) => (
                        <div key={idx} className="history-detail-row">
                          <span>
                            <strong>{i.name}</strong>
                            <span className="wa-badge green" style={{ marginInlineStart: 8 }}>Stock: {i.stock}</span>
                          </span>
                          <strong style={{ color: '#0e3a2a' }}>× {i.qty}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                  {dailyRows.map((row, idx) => {
                    const dq = (row.name || '').trim().toLowerCase()
                    const dExact = stockOptions.some((s) => s.name.toLowerCase() === dq || s.nameAr === row.name.trim())
                    const filteredDailyStock = !dq || dExact
                      ? stockOptions
                      : stockOptions.filter((s) => s.name.toLowerCase().includes(dq) || s.nameAr.includes(row.name.trim()))
                    return (
                    <div key={idx} className="daily-row-grid">
                      <div className="item-card-top-bar">
                        <strong style={{ color: '#0e3a2a', fontSize: 13.5 }}>
                          {isAr ? `صنف #${idx + 1}` : `Item #${idx + 1}`}
                        </strong>
                        <button
                          type="button"
                          className="wa-btn ghost"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => setDailyRows((p) => p.filter((_, i) => i !== idx))}
                        >
                          ✕ {isAr ? 'حذف' : 'Remove'}
                        </button>
                      </div>

                      <div>
                        <div className="per-cell-label">{isAr ? 'اسم الصنف / Item' : 'Item Name'}</div>
                        <div className="combo-wrap">
                          <div className="combo-input-row">
                            <input
                              type="text"
                              placeholder={isAr ? 'اكتب أو اختر الصنف...' : 'Type or pick item...'}
                              value={row.name}
                              onFocus={() => setOpenDailyComboIdx(idx)}
                              onBlur={() => setTimeout(() => setOpenDailyComboIdx((cur) => (cur === idx ? null : cur)), 160)}
                              onChange={(e) => {
                                setDailyRows((p) => p.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))
                                setOpenDailyComboIdx(idx)
                              }}
                            />
                            <button
                              type="button"
                              className="combo-toggle-btn"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setOpenDailyComboIdx((cur) => (cur === idx ? null : idx))}
                              aria-label="Toggle daily items list"
                            >
                              ▾
                            </button>
                          </div>

                          {openDailyComboIdx === idx && (
                            <div className="combo-menu">
                              {filteredDailyStock.length === 0 ? (
                                <div className="combo-option" style={{ color: '#526359', cursor: 'default' }}>
                                  <span>{isAr ? `صنف مخصص: "${row.name}"` : `Custom item: "${row.name}"`}</span>
                                </div>
                              ) : (
                                filteredDailyStock.map((s, si) => (
                                  <div
                                    key={si}
                                    className="combo-option"
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      const pickedName = isAr ? s.nameAr : s.name
                                      setDailyRows((p) => p.map((r, i) => (i === idx ? { ...r, name: pickedName } : r)))
                                      setOpenDailyComboIdx(null)
                                    }}
                                  >
                                    <span>
                                      <b>{isAr ? s.nameAr : s.name}</b>
                                      <span style={{ color: '#526359', marginInlineStart: 6, fontSize: 12 }}>
                                        {isAr ? s.name : s.nameAr}
                                      </span>
                                    </span>
                                    <small>{s.stock} {s.unit}</small>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
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
                          placeholder={isAr ? 'اختياري' : 'Optional'}
                          value={row.notes}
                          onChange={(e) => setDailyRows((p) => p.map((r, i) => (i === idx ? { ...r, notes: e.target.value } : r)))}
                        />
                      </div>

                      <div className="per-remove-desktop-cell">
                        <button className="wa-btn ghost" style={{ padding: '6px 10px' }} onClick={() => setDailyRows((p) => p.filter((_, i) => i !== idx))}>✕</button>
                      </div>
                    </div>
                    )
                  })}
                </div>

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
            <div className="section-head-clean">
              <h2>
                {roleId === 'owner'
                  ? `👑 ${isUk ? `Погодження власника · ${branchTitle}` : `Owner Approvals · ${branchTitle}`}`
                  : `🍽️ ${isAr ? `مشتريات دورية · ${branchTitle}` : `Periodic Purchases · ${branchTitle}`}`}
              </h2>
              <p>
                {roleId === 'owner'
                  ? (isUk
                      ? 'Лише запити, що очікують на ваше фінальне рішення. Уся інша історія — в Історії замовлень.'
                      : 'Only requests waiting for your final approval. All other operations are in Orders History.')
                  : 'Tableware & Glassware · Kitchen & Bar Tools · Small Equipment · Linen & Textiles'}
              </p>
            </div>

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
                    <div>#</div>
                    <div>{isAr ? 'الفئة' : 'Category'}</div>
                    <div>{isAr ? 'الصنف' : 'Item'}</div>
                    <div>{isAr ? 'الموجود حالياً' : 'Have Now'}</div>
                    <div>{isAr ? 'المطلوب' : 'Need to Order'}</div>
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
                        <div className="item-num-desktop">#{idx + 1}</div>
                        <div className="item-card-top-bar">
                          <strong style={{ color: '#0e3a2a', fontSize: 13.5 }}>
                            {isAr ? `صنف #${idx + 1}` : `Item #${idx + 1}`}
                          </strong>
                          <button
                            type="button"
                            className="wa-btn ghost"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => setPerRows((p) => p.filter((_, i) => i !== idx))}
                          >
                            ✕ {isAr ? 'حذف' : 'Remove'}
                          </button>
                        </div>
                        <div>
                          <div className="per-cell-label">
                            <span>{isAr ? 'الفئة' : 'Category'}</span>
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
                            <div className="per-cell-label">{isAr ? 'الموجود حالياً' : 'Inventory (Have Now)'}</div>
                            <div className="inv-badge-wrap">
                              <span className="inv-count-pill">{row.inventory || 0}</span>
                              {roleId === 'manager' && (
                                <div className="inv-arrow-stack">
                                  <button
                                    type="button"
                                    className="inv-arrow-btn"
                                    title="Increase inventory"
                                    onClick={() =>
                                      setPerRows((p) =>
                                        p.map((r, i) => (i === idx ? { ...r, inventory: String(Number(r.inventory || 0) + 1) } : r))
                                      )
                                    }
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    className="inv-arrow-btn"
                                    title="Decrease inventory"
                                    onClick={() =>
                                      setPerRows((p) =>
                                        p.map((r, i) => (i === idx ? { ...r, inventory: String(Math.max(0, Number(r.inventory || 0) - 1)) } : r))
                                      )
                                    }
                                  >
                                    ▼
                                  </button>
                                </div>
                              )}
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
              const waitingStep2 = branchPeriodic.filter((p) => !p.step2?.approved && !p.step2?.rejected && !p.status.includes('Rejected'))
              const waitingStep3 = branchPeriodic.filter((p) => p.step2?.approved && !p.step3?.approved && !p.step3?.rejected && p.status.includes('Owner') && !p.status.includes('Cost Control Office'))
              const completedOrRejected = branchPeriodic.filter(
                (p) => !waitingStep2.includes(p) && !waitingStep3.includes(p)
              )

              const buckets = [
                {
                  num: 2,
                  title: '1 - Cost Control Manager',
                  subtitle: isAr ? 'في انتظار اعتماد Cost Control Manager' : 'Submitted · Waiting for Cost Control Manager',
                  items: waitingStep2,
                  canAct: roleId === 'cost_control',
                  reminderPhone: waPhones.costMgr,
                  reminderLabel: isAr ? '📱 تذكير Cost Control Manager' : '📱 Send Reminder to Cost Control Manager',
                },
                {
                  num: 3,
                  title: '2 - Owner (Lyudmyla)',
                  subtitle: isAr ? 'في انتظار الاعتماد النهائي من المالكة' : 'Waiting for Owner final approval',
                  items: waitingStep3,
                  canAct: roleId === 'owner',
                  reminderPhone: waPhones.owner,
                  reminderLabel: isAr ? '📱 تذكير المالكة' : '📱 Send Reminder to Owner',
                },
              ]

              const visibleBuckets = roleId === 'owner' ? buckets.filter((b) => b.num === 3) : buckets

              return (
                <div style={{ marginTop: roleId === 'owner' ? 8 : 18 }}>
                  {visibleBuckets.map((bucket) => (
                    <div key={bucket.num} className={`approval-bucket ${bucket.items.length > 0 ? 'has-pending' : ''}`}>
                      <div className="approval-bucket-head">
                        <div>
                          <b style={{ fontSize: 15, color: '#0e3a2a' }}>
                            {roleId === 'owner' ? (isUk ? 'Очікують на ваше рішення' : 'Pending Your Final Approval') : bucket.title}
                          </b>
                          {roleId !== 'owner' && (
                            <div style={{ fontSize: 12, color: '#526359', marginTop: 2 }}>{bucket.subtitle}</div>
                          )}
                        </div>
                        <span className={`wa-badge ${bucket.items.length > 0 ? 'amber' : 'gray'}`}>
                          {bucket.items.length > 0 ? `${bucket.items.length} ${isUk ? 'очікує' : 'Pending'}` : (isUk ? 'Немає запитів' : 'No pending')}
                        </span>
                      </div>

                      {roleId === 'owner' && bucket.items.length === 0 && (
                        <div style={{ marginTop: 10, fontSize: 13, color: '#526359' }}>
                          {isUk
                            ? `Немає запитів, які очікують на ваше погодження в ${branchTitle}.`
                            : `No requests waiting for your approval in ${branchTitle}.`}
                        </div>
                      )}

                      {bucket.items.map((req) => {
                        if (roleId === 'owner') {
                          const isOwnerOpen = expandedOwnerReqId === req.id
                          const previewItems = req.items.slice(0, 2).map((i) => `${i.name} (×${i.qty})`).join(', ') + (req.items.length > 2 ? ` +${req.items.length - 2}` : '')
                          return (
                            <div key={req.id} className={`history-card ${isOwnerOpen ? 'expanded' : ''}`} style={{ marginTop: 10 }}>
                              <div
                                className="history-card-summary"
                                onClick={() => setExpandedOwnerReqId((cur) => (cur === req.id ? null : req.id))}
                              >
                                <div className="history-card-top">
                                  <div className="history-card-left">
                                    <strong style={{ color: '#0e3a2a' }}>{req.id}</strong>
                                    <span className="dept-pill" style={{ fontSize: 11.5, padding: '2px 8px' }}>{req.department}</span>
                                    <span style={{ fontSize: 12, color: '#526359' }}>📅 {req.date}</span>
                                  </div>
                                  <div className="history-card-right">
                                    <span className="wa-badge amber compact">{isUk ? '⏳ На погодження' : '⏳ Final Approval'}</span>
                                    <span style={{ fontWeight: 700, color: '#0e3a2a', fontSize: 13 }}>{isOwnerOpen ? '▾' : '▸'}</span>
                                  </div>
                                </div>
                                <div className="history-preview-line">
                                  {req.items.length} {isUk ? 'поз.' : 'items'}: {previewItems}
                                </div>
                                <div className="history-card-sub" style={{ marginTop: 2 }}>
                                  <span>{req.step2?.name ? `✓ ${req.step2.name}` : ''}</span>
                                  <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                                    <button
                                      className="wa-btn"
                                      style={{ padding: '5px 11px', fontSize: 12 }}
                                      onClick={() => approvePeriodicStep(req.id, 3, false)}
                                    >
                                      ✅ {isUk ? 'Погодити' : 'Approve'}
                                    </button>
                                    <button
                                      className="wa-btn red"
                                      style={{ padding: '5px 11px', fontSize: 12 }}
                                      onClick={() => rejectPeriodicStep(req.id, 3)}
                                    >
                                      ❌ {isUk ? 'Відхилити' : 'Reject'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {isOwnerOpen && (
                                <div className="history-card-details">
                                  <div className="wf-meta-row" style={{ marginTop: 0, marginBottom: 8 }}>
                                    {req.step1?.approved && (
                                      <span style={{ color: '#146c43' }}>
                                        ✅ {isUk ? 'Подано:' : 'Submitted:'} <b>{req.step1.name}</b> ({req.step1.time})
                                      </span>
                                    )}
                                    {req.step2?.approved && (
                                      <span style={{ color: '#146c43' }}>
                                        ✅ Cost Control: <b>{req.step2.name}</b> ({req.step2.time})
                                      </span>
                                    )}
                                  </div>
                                  {req.items.map((item, idx) => (
                                    <div key={idx} className="history-detail-row">
                                      <span>
                                        <strong>{item.name}</strong>
                                        <span style={{ color: '#526359', marginInlineStart: 6, fontSize: 12 }}>
                                          ({isUk ? 'Є:' : 'Have:'} {item.inventory ?? 0})
                                        </span>
                                      </span>
                                      <strong style={{ color: '#0e3a2a' }}>× {item.qty}</strong>
                                    </div>
                                  ))}
                                  <div style={{ marginTop: 10 }}>
                                    <input
                                      style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #cfd9cb', borderRadius: 8, fontSize: 13 }}
                                      placeholder={isUk ? "Коментар або причина відмови (необов'язково)..." : 'Optional note or reject reason...'}
                                      value={stepInputs[3].notes}
                                      onChange={(e) => setStepInputs((p) => ({ ...p, 3: { ...p[3], notes: e.target.value } }))}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        }

                        return (
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
                              <div>{isUk ? 'Категорія' : isAr ? 'الفئة' : 'Category'}</div>
                              <div>{isUk ? 'Позиція' : isAr ? 'الصنف' : 'Item'}</div>
                              <div>{isUk ? 'Є зараз' : isAr ? 'الموجود' : 'Have Now'}</div>
                              <div>{isUk ? 'Замовити' : isAr ? 'المطلوب' : 'Need to Order'}</div>
                            </div>
                            {req.items.map((item, idx) => (
                              <div key={idx} className="wf-item-row">
                                <div style={{ color: '#526359', fontSize: 12 }}>{item.category || 'Non-food'}</div>
                                <div>
                                  <b>{item.name}</b>
                                  {item.specs && <div style={{ fontSize: 11.5, color: '#526359' }}>{item.specs}</div>}
                                </div>
                                <div>{isUk ? 'Є:' : isAr ? 'موجود:' : 'Have:'} <b>{item.inventory ?? 0}</b></div>
                                <div>{isUk ? 'Замовити:' : isAr ? 'مطلوب:' : 'Order:'} <b style={{ color: '#0e3a2a' }}>{item.qty}</b></div>
                              </div>
                            ))}
                          </div>

                          {bucket.canAct ? (
                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #eef2ec' }}>
                              <div className="wa-grid">
                                <div className="wa-field">
                                  <label>{isUk ? "Ім'я" : isAr ? 'الاسم' : 'Name'}</label>
                                  <input
                                    placeholder={isUk ? "Ваше ім'я" : isAr ? 'اكتب الاسم' : 'Your name'}
                                    value={stepInputs[bucket.num].name}
                                    onChange={(e) => setStepInputs((p) => ({ ...p, [bucket.num]: { ...p[bucket.num], name: e.target.value } }))}
                                  />
                                </div>
                                <div className="wa-field">
                                  <label>{isUk ? 'Підпис' : isAr ? 'التوقيع' : 'Signature'}</label>
                                  <input
                                    placeholder={isUk ? 'Введіть ім’я як підпис' : isAr ? 'اكتب الاسم كتوقيع' : 'Type name as signature'}
                                    value={stepInputs[bucket.num].sig}
                                    onChange={(e) => setStepInputs((p) => ({ ...p, [bucket.num]: { ...p[bucket.num], sig: e.target.value } }))}
                                  />
                                </div>
                                <div className="wa-field">
                                  <label>{isUk ? 'Примітки' : isAr ? 'ملاحظات' : 'Notes'}</label>
                                  <input
                                    placeholder={isUk ? "Необов'язково (або причина відмови)" : isAr ? 'اختياري (أو سبب الرفض)' : 'Optional (or reject reason)'}
                                    value={stepInputs[bucket.num].notes}
                                    onChange={(e) => setStepInputs((p) => ({ ...p, [bucket.num]: { ...p[bucket.num], notes: e.target.value } }))}
                                  />
                                </div>
                              </div>
                              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button className="wa-btn" onClick={() => approvePeriodicStep(req.id, bucket.num, false)}>
                                  ✅ {isUk ? 'Погодити' : isAr ? 'موافقة' : 'Approve'}
                                </button>
                                {bucket.num === 2 && (
                                  <button className="wa-btn amber" onClick={() => approvePeriodicStep(req.id, 2, true)}>
                                    📤 {isAr ? 'موافقة وإرسال للمالكة' : 'Approve & Send to Owner'}
                                  </button>
                                )}
                                {(bucket.num === 2 || bucket.num === 3) && (
                                  <button className="wa-btn red" onClick={() => rejectPeriodicStep(req.id, bucket.num)}>
                                    ❌ {isUk ? 'Відхилити' : isAr ? 'رفض' : 'Reject'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : roleId !== 'owner' ? (
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
                          ) : null}
                        </div>
                      )
                      })}
                    </div>
                  ))}

                  {roleId !== 'owner' && completedOrRejected.length > 0 && (
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

        {/* ================= TAB 5: ORDERS HISTORY (DAILY & PERIODIC — COMPACT EXPANDABLE CARDS) ================= */}
        {activeTab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ margin: 0 }}>
                📋 {isAr ? `سجل اليومي والدوري · ${branchTitle}` : isUk ? `Історія замовлень · ${branchTitle}` : `Orders History · ${branchTitle}`}
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {['All', 'Daily', 'Periodic'].map((f) => (
                  <button key={f} className={`wa-lang-btn ${historyFilter === f ? 'active' : ''}`} onClick={() => setHistoryFilter(f)}>
                    {isUk ? (f === 'All' ? 'Усі' : f === 'Daily' ? 'Щоденні' : 'Періодичні') : f}
                  </button>
                ))}
              </div>
            </div>

            <div className="history-list">
              {[
                ...(historyFilter !== 'Periodic'
                  ? state.dailyRequests
                      .filter((d) => d.branchId === branchId)
                      .map((d) => ({
                        type: 'Daily',
                        id: d.id,
                        date: d.date,
                        dept: d.department,
                        actor: d.requestedBy,
                        itemsList: d.items.map((i) => ({ name: i.name, qty: i.qty, stockLabel: `Stock: ${i.stock}` })),
                        status: d.status,
                        timeline: d.timeline || [],
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
                        actor: [
                          p.step1?.approved ? `Mgr: ${p.step1.name}` : null,
                          p.step2?.approved ? `CC: ${p.step2.name}` : null,
                          p.step3?.approved ? `Owner: ${p.step3.name}` : null,
                        ].filter(Boolean).join(' · '),
                        itemsList: p.items.map((i) => ({ name: i.name, qty: i.qty, stockLabel: `Have: ${i.inventory ?? 0}` })),
                        status: p.status,
                        timeline: [],
                      }))
                  : []),
              ].map((r) => {
                const isOpen = expandedHistoryId === r.id
                const previewText = r.itemsList.slice(0, 2).map((it) => `${it.name} (×${it.qty})`).join(', ') + (r.itemsList.length > 2 ? ` +${r.itemsList.length - 2}` : '')
                return (
                  <div key={r.id} className={`history-card ${isOpen ? 'expanded' : ''}`}>
                    <div
                      className="history-card-summary"
                      onClick={() => setExpandedHistoryId((cur) => (cur === r.id ? null : r.id))}
                    >
                      <div className="history-card-top">
                        <div className="history-card-left">
                          <span className={`wa-badge compact ${r.type === 'Daily' ? 'green' : 'amber'}`}>{r.type}</span>
                          <strong style={{ color: '#0e3a2a' }}>{r.id}</strong>
                          <span style={{ color: '#526359', fontSize: 12.5 }}>· {r.dept}</span>
                        </div>
                        <div className="history-card-right">
                          <span className={`wa-badge compact ${r.status.includes('Waiting') ? 'amber' : r.status.includes('Rejected') ? 'red' : 'green'}`}>
                            {compactStatus(r.status)}
                          </span>
                          <span style={{ fontWeight: 700, color: '#0e3a2a', fontSize: 13 }}>{isOpen ? '▾' : '▸'}</span>
                        </div>
                      </div>
                      <div className="history-preview-line">
                        {previewText}
                      </div>
                      <div className="history-card-sub">
                        <span>
                          📅 {r.date} · {r.itemsList.length} {isUk ? 'поз.' : 'items'}
                        </span>
                        <span>{isOpen ? (isUk ? 'Згорнути' : 'Hide') : (isUk ? 'Деталі' : 'Details')}</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="history-card-details">
                        {r.actor && (
                          <div style={{ fontSize: 12.5, color: '#526359', marginBottom: 8 }}>
                            👤 {r.actor}
                          </div>
                        )}
                        {r.itemsList.map((it, idx) => (
                          <div key={idx} className="history-detail-row">
                            <span>
                              <strong>{it.name}</strong>
                              <span style={{ color: '#526359', marginInlineStart: 8, fontSize: 12 }}>({it.stockLabel})</span>
                            </span>
                            <strong>× {it.qty}</strong>
                          </div>
                        ))}
                        {r.timeline.length > 0 && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eef2ec', fontSize: 12, color: '#526359' }}>
                            {r.timeline.map((t, i) => (
                              <div key={i}>• <strong>{t.time}</strong> — {t.text}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 6: SHORTAGES (FACTUAL ONLY, STATUS = PENDING) ================= */}
        {activeTab === 'shortages' && (
          <div>
            <h2 style={{ marginTop: 0 }}>
              ⚠️ {isAr ? `وصل أقل من المطلوب · ${branchTitle}` : isUk ? `Нестачі при прийманні · ${branchTitle}` : `Arrived Less Than Ordered · ${branchTitle}`}
            </h2>
            <p style={{ color: '#526359', fontSize: 13.5, marginTop: 4 }}>
              {isAr
                ? 'عرض فعلي للأصناف التي وصلت بكمية أقل من المطلوب (تظهر تلقائياً من الاستلام).'
                : isUk
                ? 'Фактичний перелік позицій, які прибули у меншій кількості, ніж замовляли (підтягується з прийомки).'
                : 'Factual view of items that actually arrived in a smaller quantity than ordered (auto-populated from Receiving).'}
            </p>

            <div className="history-list">
              {branchShortages.map((s) => {
                const missing = Math.max(0, Number((s.expectedQty - s.actualQty).toFixed(3)))
                const displayStatus = s.status === 'Open' ? 'Pending' : s.status
                const isShOpen = expandedShortageId === s.id
                return (
                  <div key={s.id} className={`history-card ${isShOpen ? 'expanded' : ''}`}>
                    <div
                      className="history-card-summary"
                      onClick={() => setExpandedShortageId((cur) => (cur === s.id ? null : s.id))}
                    >
                      <div className="history-card-top">
                        <div className="history-card-left">
                          <strong style={{ color: '#0e3a2a' }}>{s.id}</strong>
                          <strong style={{ color: '#15221b' }}>· {s.itemName}</strong>
                        </div>
                        <div className="history-card-right">
                          <span className="wa-badge red compact">−{missing} {s.unit}</span>
                          <span className={`wa-badge compact ${displayStatus === 'Closed' ? 'green' : 'amber'}`}>{displayStatus}</span>
                          <span style={{ fontWeight: 700, color: '#0e3a2a', fontSize: 13 }}>{isShOpen ? '▾' : '▸'}</span>
                        </div>
                      </div>
                      <div className="history-card-sub">
                        <span>
                          {s.refDoc} · {isUk ? 'Замовлено:' : 'Ordered:'} {s.expectedQty} {s.unit} → {isUk ? 'Прибуло:' : 'Arrived:'} {s.actualQty} {s.unit}
                        </span>
                        <span>{isShOpen ? (isUk ? 'Згорнути' : 'Hide') : (isUk ? 'Деталі' : 'Details')}</span>
                      </div>
                    </div>

                    {isShOpen && (
                      <div className="history-card-details">
                        <div style={{ fontSize: 13, marginBottom: 6 }}>
                          <strong>{isUk ? 'Дія / Причина:' : 'Action / Reason:'}</strong> {s.nextAction}
                        </div>
                        {s.timeline && s.timeline.length > 0 && (
                          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #eef2ec', fontSize: 12, color: '#526359' }}>
                            {s.timeline.map((t, i) => (
                              <div key={i}>• <strong>{t.time}</strong> — {t.text}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {toast && <div className="wa-toast">{toast}</div>}
    </div>
  )
}
