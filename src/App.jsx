import React, { useState, useEffect, useMemo } from 'react'
import { INITIAL_STATE, BRANCHES, CURATED_CATALOG } from './data/seedData'

const STORAGE_KEY = 'lc_unified_purchasing_v6'
const AUTH_STORAGE_KEY = 'lc_auth_role_v1'

const FIXED_COST_CONTROL_OFFICERS = [
  { id: 'cc_office_1', label: 'Cost Control Office · Main (El Gouna / Cairo)', phone: '201000000001' },
  { id: 'cc_office_2', label: 'Cost Control Office · Night Shift', phone: '201000000002' },
]

function classifyPosterItem(name) {
  const n = ` ${(name || '').toLowerCase()} `
  if (/(foam|silver plate|plate 420|microwave|cover|lid\b|straw|napkin|towel|tissue|sponge|soap|detergent|chlorine|sanitizer|foil|cling|film|\bbag\b|takeaway|container|glove|trash|garbage|clean|bleach|disposable|toothpick|skewer|paper|degreaser|dishwasher|polish|charcoal|candle)/.test(n)) {
    return { cat: 'Consumables', foodSub: 'Dry, Sauces & Bakery' }
  }
  if (/(beer|wine|vodka|\bgin\b|\brum\b|whisky|whiskey|tequila|bourbon|brandy|cognac|liqueur|aperol|campari|vermouth|prosecco|champagne|stella|sakara|heineken|desperados|corona|syrup|monin|puree|juice|soda|cola|pepsi|sprite|fanta|schweppes|tonic|red bull|water|dasani|aquafina|coffee|espresso|beans|\btea\b|matcha|kombucha|bitters|triple sec|amaretto|baileys|kahlua|jagermeister|ouzo|arak|sake|soju|alcohol|mojito|daiquiri)/.test(n)) {
    return { cat: 'Bar & Beverages', foodSub: 'Beverages' }
  }
  if (/(beef|chicken|steak|burger|patty|meat|lamb|duck|turkey|fish|salmon|shrimp|prawn|calamari|tuna|crab|bacon|sausage|pepperoni|bresaola|prosciutto|veal|filet|ribeye|striploin|tenderloin)/.test(n)) {
    return { cat: 'Food', foodSub: 'Meat & Seafood' }
  }
  if (/(tomato|onion|garlic|lettuce|potato|carrot|cucumber|pepper|lemon|lime|orange|apple|banana|berry|strawberry|mango|avocado|mushroom|spinach|arugula|rocca|basil|mint|parsley|coriander|cilantro|ginger|chili|zucchini|eggplant|cabbage|broccoli|corn|pineapple|watermelon|melon|grape|pear|peach|kiwi|celery|leek|radish|beet|herb|jalapeno|rucola)/.test(n)) {
    return { cat: 'Food', foodSub: 'Produce (Veg & Fruit)' }
  }
  if (/(milk|cheese|mozzarella|cheddar|parmesan|feta|cream|butter|yogurt|egg|ricotta|mascarpone|brie|gouda|emmental|halloumi|labneh|ghee)/.test(n)) {
    return { cat: 'Food', foodSub: 'Dairy & Eggs' }
  }
  return { cat: 'Food', foodSub: 'Dry, Sauces & Bakery' }
}

const ROLES = [
  { id: 'staff', labelEn: 'Kitchen / Bar', labelAr: 'المطبخ / البار', icon: '🍳', pin: '1111', desc: 'Daily food & bar requests & order status', tabs: ['daily', 'my_orders'] },
  { id: 'manager', labelEn: 'Restaurant Manager', labelAr: 'مدير المطعم', icon: '🧑‍💼', pin: '2222', desc: 'Equipment & supplies orders, receiving, shortages & inventory', tabs: ['periodic', 'daily', 'receiving', 'shortages', 'inventory'] },
  { id: 'cost_office', labelEn: 'Cost Control Office', labelAr: 'مكتب مراقبة التكاليف', icon: '🗂️', pin: '3333', desc: 'Approve/Reject Daily, view Equipment orders & send to Supplier', tabs: ['daily', 'periodic', 'history', 'shortages'] },
  { id: 'cost_control', labelEn: 'Cost Control Manager', labelAr: 'مدير مراقبة التكاليف', icon: '📊', pin: '4444', desc: 'Approve/Escalate Equipment & Supplies, edit Inventory & send to Supplier', tabs: ['periodic', 'daily', 'history', 'shortages', 'inventory'] },
  { id: 'owner', labelEn: 'Owner · Lyudmyla', labelAr: 'المالكة · ليودميلا', icon: '👑', pin: null, desc: 'Final approvals, full history, inventory & view any role without PIN', tabs: ['periodic', 'history', 'shortages', 'inventory'] },
]

const ITEM_IMAGES = {
  'CAT-IRG': './items/irish-coffee-glass.jpg',
  'CAT-LTG': './items/latte-glass.jpg',
  'CAT-ESP-U': './items/espresso-underline.jpg',
  'CAT-ESP-C': './items/espresso-cup.jpg',
  'CAT-CAP-C': './items/cappuccino-cup.jpg',
  'CAT-AMR-C': './items/americano-cup.jpg',
  'CAT-SUG-J': './items/jar-for-sugar.jpg',
  'CAT-MLK-J': './items/milk-jar.jpg',
  'CAT-CAP-U': './items/cappuccino-underline.jpg',
  'CAT-AMR-U': './items/americano-underline.jpg',
  'CAT-MSR': './items/measure.jpg',
  'CAT-TEAP': './items/tea-pot.jpg',
  'CAT-MICC': './items/metal-ice-cream-cup.jpg',
  'CAT-SCHW-OF': './items/schweppes-old-fashion.jpg',
  'CAT-HB-300': './items/hi-ball-300ml.jpg',
  'CAT-COKE-G': './items/coca-cola-glass.jpg',
  'CAT-SPK-G': './items/sparkling-wine-glass.jpg',
  'CAT-CKG': './items/cocktail-glass.jpg',
  'CAT-OF-G': './items/old-fashion-glass.jpg',
  'CAT-HB-400': './items/hi-ball-400ml.jpg',
  'CAT-SHK': './items/bar-shaker.jpg',
  'CAT-WNG': './items/wine-glass.jpg',
  'CAT-BEER-L': './items/beer-glass-large.jpg',
  'CAT-BEER-S': './items/beer-glass-small.jpg',
  'CAT-FLDR-C': './items/folder-car.jpg',
  'CAT-WCB': './items/wooden-cutlery-box.jpg',
  'CAT-ASHT': './items/ashtray.jpg',
  'CAT-BBP-L': './items/bb-plate-large.jpg',
  'CAT-BBP-S': './items/bb-plate-small.jpg',
  'CAT-SAN-B': './items/sanitizer-bottle-black.jpg',
  'CAT-SAN-G': './items/sanitizer-bottle-grey.jpg',
  'CAT-BCJ': './items/black-cutlery-jar.jpg',
  'CAT-FORK': './items/fork.jpg',
  'CAT-KNIFE': './items/knife.jpg',
  'CAT-HURR-G': './items/hurricane-glass.jpg',
  'CAT-DAIQ-G': './items/daiquiri-glass.jpg',
  'CAT-BLND': './items/blender.jpg',
  'CAT-DRIER': './items/drier-machine.jpg',
  'CAT-GRND': './items/coffee-grinder.jpg',
  'CAT-LATT-S': './items/latte-spoon.jpg',
  'CAT-TEA-S': './items/tea-spoon.jpg',
  'CAT-SOUP-S': './items/soup-spoon.jpg',
}

function buildInitialInventoryCounts() {
  const counts = {}
  for (const b of BRANCHES) {
    counts[b.id] = {}
    for (const item of CURATED_CATALOG) {
      counts[b.id][item.id] = Number(item.posterStock?.[b.id] ?? 0)
    }
  }
  return counts
}

function loadState() {
  const defaultCounts = buildInitialInventoryCounts()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...INITIAL_STATE,
        ...parsed,
        posterSnapshot: INITIAL_STATE.posterSnapshot,
        inventoryCounts: parsed.inventoryCounts || defaultCounts,
        inventoryLog: parsed.inventoryLog || [],
      }
    }
  } catch (e) {
    // ignore
  }
  return { ...INITIAL_STATE, inventoryCounts: defaultCounts, inventoryLog: [] }
}

export default function App() {
  const isDemoMode = typeof window !== 'undefined' && window.location.search.includes('demo=1')
  const isStartMode = typeof window !== 'undefined' && window.location.search.includes('start=1')
  const [authRoleId, setAuthRoleId] = useState(() => {
    if (isDemoMode) return 'owner'
    if (isStartMode) {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem('lc_auth_branch_v2')
      } catch (e) {
        // ignore
      }
      return null
    }
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) || null
    } catch (e) {
      return null
    }
  })
  const [authBranchSelected, setAuthBranchSelected] = useState(() => {
    if (isDemoMode) return true
    if (isStartMode) return false
    try {
      const savedRole = localStorage.getItem(AUTH_STORAGE_KEY)
      if (savedRole === 'owner') return true
      return Boolean(localStorage.getItem('lc_auth_branch_v2'))
    } catch (e) {
      return false
    }
  })
  const [pendingPinRole, setPendingPinRole] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')

  const [state, setState] = useState(loadState)
  const [branchId, setBranchId] = useState(() => {
    try {
      return localStorage.getItem('lc_auth_branch_v2') || 'boho'
    } catch (e) {
      return 'boho'
    }
  })
  const [roleId, setRoleId] = useState(() => authRoleId || 'owner')
  const [lang, setLang] = useState('en')
  const [activeTab, setActiveTab] = useState('periodic')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (authRoleId && authRoleId !== 'owner') {
      setRoleId(authRoleId)
    }
  }, [authRoleId])

  const loginAsRole = (r) => {
    if (!r.pin) {
      localStorage.setItem(AUTH_STORAGE_KEY, r.id)
      setAuthRoleId(r.id)
      setRoleId(r.id)
      if (r.id === 'owner') {
        setAuthBranchSelected(true)
      } else {
        localStorage.removeItem('lc_auth_branch_v2')
        setAuthBranchSelected(false)
      }
      setPendingPinRole(null)
      setPinInput('')
      setPinError('')
      return
    }
    setPendingPinRole(r)
    setPinInput('')
    setPinError('')
  }

  const submitPinLogin = (e) => {
    e.preventDefault()
    if (!pendingPinRole) return
    if (pinInput.trim() === pendingPinRole.pin) {
      localStorage.setItem(AUTH_STORAGE_KEY, pendingPinRole.id)
      setAuthRoleId(pendingPinRole.id)
      setRoleId(pendingPinRole.id)
      if (pendingPinRole.id === 'owner') {
        setAuthBranchSelected(true)
      } else {
        localStorage.removeItem('lc_auth_branch_v2')
        setAuthBranchSelected(false)
      }
      setPendingPinRole(null)
      setPinInput('')
      setPinError('')
    } else {
      setPinError('Incorrect PIN. Please try again.')
    }
  }

  const selectBranchAndEnter = (bId) => {
    setBranchId(bId)
    localStorage.setItem('lc_auth_branch_v2', bId)
    setAuthBranchSelected(true)
  }

  const changeRestaurantScreen = () => {
    localStorage.removeItem('lc_auth_branch_v2')
    setAuthBranchSelected(false)
  }

  const lockRoleScreen = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem('lc_auth_branch_v2')
    setAuthRoleId(null)
    setAuthBranchSelected(false)
    setPendingPinRole(null)
    setPinInput('')
    setPinError('')
  }

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

  // Poster-linked stock lookup for Daily Requests (Food & Bar Beverages only — excludes Consumables/Packaging)
  const stockOptions = useMemo(() => {
    const posterItems = state.posterSnapshot?.branches?.[branchId]?.items || []
    const foodAndBarPoster = posterItems.filter((p) => classifyPosterItem(p.name).cat !== 'Consumables')
    const posterNames = new Set(foodAndBarPoster.map((p) => p.name.trim().toLowerCase()))
    return [
      ...foodAndBarPoster.map((p) => ({
        name: p.name,
        nameAr: p.name,
        stock: p.poster_stock,
        unit: p.unit,
      })),
      ...CURATED_CATALOG.filter((c) => c.category === 'Food' && !posterNames.has(c.name.trim().toLowerCase())).map((c) => ({
        name: c.name,
        nameAr: c.nameAr,
        stock: c.posterStock[branchId] ?? 0,
        unit: c.unit,
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
    supplier: localStorage.getItem('lc_wa_supplier') || '',
  }))

  const saveWaPhones = () => {
    localStorage.setItem('lc_wa_office', waPhones.office)
    localStorage.setItem('lc_wa_costmgr', waPhones.costMgr)
    localStorage.setItem('lc_wa_owner', waPhones.owner)
    localStorage.setItem('lc_wa_supplier', waPhones.supplier)
    notify(isAr ? '✅ تم حفظ أرقام الواتساب' : '✅ WhatsApp numbers saved')
  }

  const clearWaPhones = () => {
    setWaPhones({ office: '', costMgr: '', owner: '', supplier: '' })
    localStorage.removeItem('lc_wa_office')
    localStorage.removeItem('lc_wa_costmgr')
    localStorage.removeItem('lc_wa_owner')
    localStorage.removeItem('lc_wa_supplier')
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

  const printOrderPdf = ({ id, type, branchName, department, date, items, status }) => {
    const win = window.open('', '_blank', 'width=860,height=920')
    if (!win) {
      alert('Please allow pop-ups in your browser to generate the PDF.')
      return
    }
    const rowsHtml = items
      .map(
        (it, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${it.name}</strong>${it.specs ? `<div style="font-size:11px;color:#555">${it.specs}</div>` : ''}</td>
          <td style="text-align:right"><strong>${it.qty}</strong></td>
        </tr>`
      )
      .join('')
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${id} - L&C Operations</title>
      <style>
        body { font-family: Inter, Arial, sans-serif; padding: 28px; color: #15221b; }
        .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid #0e3a2a; padding-bottom: 12px; margin-bottom: 18px; }
        .brand { font-size: 20px; font-weight: 800; color: #0e3a2a; }
        .meta { font-size: 13px; line-height: 1.5; margin-bottom: 16px; background: #f4f7f3; padding: 12px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #0e3a2a; color: #fff; padding: 9px 10px; text-align: left; font-size: 13px; }
        td { padding: 9px 10px; border-bottom: 1px solid #dfe6dc; font-size: 13.5px; }
        .foot { margin-top: 24px; font-size: 12px; color: #526359; }
      </style></head><body>
      <div class="head">
        <div><div class="brand">L&amp;C Operations — Purchase Order (${type})</div><div style="font-size:12px;color:#526359">${branchName}</div></div>
        <div style="text-align:right"><strong>${id}</strong><div style="font-size:12px">Date: ${date}</div></div>
      </div>
      <div class="meta">
        <div><strong>Restaurant:</strong> ${branchName}</div>
        <div><strong>Department:</strong> ${department}</div>
        <div><strong>Approval Status:</strong> ${status}</div>
      </div>
      <table><thead><tr><th style="width:40px">#</th><th>Item</th><th style="width:110px;text-align:right">Order Qty</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      <div class="foot">Generated from L&amp;C Operations · Ready to send to Supplier</div>
      <script>window.onload = () => { window.print(); }</script></body></html>`)
    win.document.close()
  }

  const sendSupplierWhatsApp = ({ id, branchName, department, date, items }) => {
    const lines = items.map((i) => `- ${i.name}: ${i.qty}`).join('\n')
    sendWhatsApp(
      waPhones.supplier,
      `📦 Purchase Order ${id}\nRestaurant: ${branchName} (${department})\nDate: ${date}\n\nItems to supply:\n${lines}`
    )
  }

  // ============ DAILY STATE ============
  const [dailyDate, setDailyDate] = useState('2026-11-24')
  const [dailyDept, setDailyDept] = useState('Kitchen')
  const [dailyRequester, setDailyRequester] = useState('Kitchen / Bar Lead')
  const [selectedOfficerId, setSelectedOfficerId] = useState(FIXED_COST_CONTROL_OFFICERS[0].id)
  const [savedDailyPreview, setSavedDailyPreview] = useState(null)
  const [dailyRows, setDailyRows] = useState([
    { name: '', qty: '1', notes: '' },
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
    const lines = items
      .map((i) => `- ${i.name} | Stock: ${i.stock} | Order: ${i.qty}${i.notes ? ` (${i.notes})` : ''}`)
      .join('\n')
    const msg = `🥬 Daily Request ${id}\nRestaurant: ${branchTitle} (${dailyDept})\nBy: ${dailyRequester}\nDate: ${dailyDate}\n\n${lines}`
    setSavedDailyPreview({ id, msg })
    notify(isAr ? `تم حفظ الطلب ${id} — راجع المعاينة وأرسل لـ Cost Control` : `Saved ${id}! Review preview below and send to Cost Control.`)
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
    { name: '', specs: '', category: 'Tableware & Glassware', inventory: '0', qty: '1' },
  ])
  const [openPerComboIdx, setOpenPerComboIdx] = useState(null)
  const [openDailyComboIdx, setOpenDailyComboIdx] = useState(null)

  const supplyItems = CURATED_CATALOG.filter((c) => c.category === 'Non-food')

  const getBranchStock = (item, bId = branchId) => {
    if (!item) return 0
    const stored = state.inventoryCounts?.[bId]?.[item.id]
    return stored !== undefined ? Number(stored) : Number(item.posterStock?.[bId] ?? 0)
  }

  const getLastInventory = (itemName) => {
    const q = (itemName || '').trim().toLowerCase()
    if (!q) return 0
    // 1. Live branch inventory (updated by Restaurant Manager adjustments or Periodic requests)
    const cat = supplyItems.find((s) => s.name.toLowerCase() === q || s.nameAr === itemName.trim())
    if (cat) return getBranchStock(cat, branchId)
    // 2. Fallback to most recent saved periodic request for this branch
    for (const pr of state.periodicRequests) {
      if (pr.branchId !== branchId) continue
      const found = pr.items.find((i) => i.name.toLowerCase() === q)
      if (found && found.inventory !== undefined) return Number(found.inventory)
    }
    return 0
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
    setState((prev) => {
      // Sync updated Have Now counts into live branch inventoryCounts
      const nextBranchCounts = { ...(prev.inventoryCounts?.[branchId] || {}) }
      for (const r of items) {
        const cat = CURATED_CATALOG.find((c) => c.name.toLowerCase() === r.name.toLowerCase())
        if (cat) nextBranchCounts[cat.id] = r.inventory
      }
      return {
        ...prev,
        inventoryCounts: {
          ...(prev.inventoryCounts || {}),
          [branchId]: nextBranchCounts,
        },
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
      }
    })
    setSelectedPerId(newId)
    setPerRows([{ name: '', specs: '', category: 'Tableware & Glassware', inventory: '0', qty: '1' }])
    notify(isAr ? `تم حفظ الطلب ${newId}` : `Equipment Request ${newId} saved`)
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
  const [myOrdersFilter, setMyOrdersFilter] = useState('All')
  const [myOrdersSearch, setMyOrdersSearch] = useState('')
  const [expandedMyOrderId, setExpandedMyOrderId] = useState(null)
  const [expandedPeriodicId, setExpandedPeriodicId] = useState(null)
  const [expandedOwnerReqId, setExpandedOwnerReqId] = useState(null)
  const [expandedShortageId, setExpandedShortageId] = useState(null)
  const [invCategory, setInvCategory] = useState('Tableware & Glassware')
  const [invFoodSub, setInvFoodSub] = useState('Meat & Seafood')
  const [invBranchPicked, setInvBranchPicked] = useState(false)
  const [invCatOpen, setInvCatOpen] = useState(false)
  const [invSearch, setInvSearch] = useState('')
  const [editingInvId, setEditingInvId] = useState(null)
  const [invEditQty, setInvEditQty] = useState('')
  const [invEditReason, setInvEditReason] = useState('')

  const saveInventoryAdjustment = (item) => {
    const newQty = Math.max(0, Number(invEditQty || 0))
    const reason = invEditReason.trim()
    if (!reason) {
      alert(isAr ? 'اكتب سبب التعديل الأول' : 'Please enter a reason (e.g. Broken, Damaged, Recount).')
      return
    }
    const prevQty = getBranchStock(item)
    const time = new Date().toTimeString().slice(0, 5)
    const date = new Date().toISOString().slice(0, 10)
    setState((prev) => ({
      ...prev,
      inventoryCounts: {
        ...(prev.inventoryCounts || {}),
        [branchId]: {
          ...(prev.inventoryCounts?.[branchId] || {}),
          [item.id]: newQty,
        },
      },
      inventoryLog: [
        {
          id: `INV-${Date.now()}`,
          branchId,
          date,
          time,
          itemName: item.name,
          unit: item.unit,
          prevQty,
          newQty,
          reason,
          by: role.labelEn,
        },
        ...(prev.inventoryLog || []),
      ],
    }))
    setEditingInvId(null)
    setInvEditReason('')
    notify(`✅ ${item.name}: ${prevQty} → ${newQty} (${reason})`)
  }

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

  if (!authRoleId) {
    return (
      <div className="auth-screen">
        <header className="wa-header">
          <div className="header-eyebrow">● 4 RESTAURANTS · EL GOUNA & CAIRO</div>
          <h1>L&amp;C Operations</h1>
          <p>Select your role to enter · Device stays signed in</p>
        </header>
        <div className="auth-body">
          <div style={{ fontSize: 14, color: '#2b3a31', fontWeight: 600 }}>
            Tap your role card below. Owner enters directly without a password; team roles require a 4-digit PIN once per device.
          </div>

          <div className="auth-grid">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`auth-role-card ${r.id === 'owner' ? 'owner-card' : ''}`}
                onClick={() => loginAsRole(r)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{r.icon}</span>
                  <span className={`wa-badge compact ${r.pin ? 'gray' : 'green'}`}>
                    {r.pin ? '🔒 PIN' : '🔓 No PIN'}
                  </span>
                </div>
                <strong style={{ fontSize: 15, color: '#0e3a2a', display: 'block' }}>{r.labelEn}</strong>
                <div style={{ fontSize: 12, color: '#526359', marginTop: 4 }}>{r.desc}</div>
              </button>
            ))}
          </div>

          {pendingPinRole && (
            <form className="auth-pin-box" onSubmit={submitPinLogin}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ color: '#0e3a2a' }}>
                  {pendingPinRole.icon} Enter 4-digit PIN for {pendingPinRole.labelEn}
                </strong>
                <button type="button" className="wa-btn ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setPendingPinRole(null)}>
                  Cancel
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="PIN (e.g. 1111)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  style={{ flex: '1 1 160px', padding: '10px 12px', border: '1.5px solid #0e3a2a', borderRadius: 10, fontSize: 16 }}
                />
                <button type="submit" className="wa-btn">
                  🔓 Enter System
                </button>
              </div>
              {pinError && <div style={{ color: '#b42318', fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>{pinError}</div>}
              <div style={{ fontSize: 11.5, color: '#526359', marginTop: 8 }}>
                Demo PINs — Kitchen/Bar: <b>1111</b> · Manager: <b>2222</b> · Cost Office: <b>3333</b> · Cost Manager: <b>4444</b>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  if (authRoleId !== 'owner' && !authBranchSelected) {
    return (
      <div className="auth-screen">
        <header className="wa-header">
          <div className="header-eyebrow">● STEP 2 OF 2 · SELECT RESTAURANT</div>
          <h1>{role.icon} {role.labelEn}</h1>
          <p>Choose the restaurant you are working in right now</p>
        </header>
        <div className="auth-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, color: '#2b3a31', fontWeight: 600 }}>
              Tap your restaurant below to open its stock, requests &amp; orders.
            </div>
            <button
              type="button"
              className="wa-btn ghost"
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={lockRoleScreen}
            >
              ← Switch Role
            </button>
          </div>

          <div className="branch-pick-grid">
            {BRANCHES.map((b) => (
              <button
                key={b.id}
                type="button"
                className="auth-role-card"
                onClick={() => selectBranchAndEnter(b.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>🏪</span>
                  <span className="wa-badge compact green">{b.city}</span>
                </div>
                <strong style={{ fontSize: 15.5, color: '#0e3a2a', display: 'block' }}>{b.name}</strong>
                <div style={{ fontSize: 12, color: '#526359', marginTop: 4 }}>{b.nameAr}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
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
          {authRoleId === 'owner' ? (
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
          ) : (
            <div className="wa-pill-select">
              <span>🏪 <b>{branchTitle}</b></span>
              <button
                type="button"
                className="wa-btn ghost"
                style={{ padding: '2px 8px', fontSize: 11.5, borderRadius: 6 }}
                onClick={changeRestaurantScreen}
              >
                🔄 {isAr ? 'تغيير' : 'Switch'}
              </button>
            </div>
          )}

          {authRoleId === 'owner' ? (
            <div className="wa-pill-select">
              <span>👑 {isUk ? 'Роль:' : 'View Role:'}</span>
              <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isAr ? r.labelAr : r.labelEn}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="wa-pill-select">
              <span>{role.icon} {isAr ? role.labelAr : role.labelEn}</span>
              <button
                type="button"
                className="wa-btn ghost"
                style={{ padding: '2px 8px', fontSize: 11.5, borderRadius: 6 }}
                onClick={lockRoleScreen}
              >
                🔒 Switch
              </button>
            </div>
          )}
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
              localStorage.removeItem(AUTH_STORAGE_KEY)
              localStorage.removeItem('lc_auth_branch_v2')
              setState(INITIAL_STATE)
              setAuthRoleId(null)
              setAuthBranchSelected(false)
              setPendingPinRole(null)
              setPinInput('')
              setPinError('')
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
            <small>{isAr ? 'خضار وفاكهة ولحوم يومية مع رصيد بوستر' : 'Daily food orders checked with Poster stock'}</small>
          </button>
        )}
        {role.tabs.includes('my_orders') && (
          <button className={activeTab === 'my_orders' ? 'active' : ''} onClick={() => setActiveTab('my_orders')}>
            📋 {isAr ? 'طلباتي' : 'My Orders'}
            <small>{isAr ? 'متابعة حالة الطلبات والتحديثات' : 'Track submitted requests & timeline'}</small>
          </button>
        )}
        {role.tabs.includes('periodic') && (
          <button className={activeTab === 'periodic' ? 'active' : ''} onClick={() => setActiveTab('periodic')}>
            🍽️ {isAr ? 'معدات وأدوات المطعم' : isUk ? 'Обладнання та інвентар' : 'Equipment & Supplies'}
            <small>
              {isAr
                ? 'أدوات المطبخ والبار والمعدات مع الجرد'
                : isUk
                ? 'Фінальне погодження запитів від Cost Control'
                : roleId === 'owner'
                ? 'Final Approve / Reject for Cost Control requests'
                : 'Tableware, bar tools & equipment orders'}
            </small>
          </button>
        )}
        {role.tabs.includes('receiving') && (
          <button className={activeTab === 'receiving' ? 'active' : ''} onClick={() => setActiveTab('receiving')}>
            🚚 {isAr ? 'الاستلام' : 'Receiving'}
            <small>{isAr ? 'تأكيد الكمية المستلمة وتسجيل النواقص' : 'Confirm delivery & auto-flag shortages'}</small>
          </button>
        )}
        {role.tabs.includes('history') && (
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
            📋 {isAr ? 'سجل اليومي والدوري' : isUk ? 'Історія замовлень' : 'Orders History'}
            <small>{isAr ? `سجل كامل لطلبات ${branchTitle}` : isUk ? `Усі щоденні та періодичні · ${branchTitle}` : `Full log of Daily & Periodic · ${branchTitle}`}</small>
          </button>
        )}
        {role.tabs.includes('shortages') && (
          <button className={activeTab === 'shortages' ? 'active' : ''} onClick={() => setActiveTab('shortages')}>
            ⚠️ {isAr ? 'وصل أقل من المطلوب' : isUk ? 'Нестачі' : 'Shortages'}
            <small>
              {branchShortages.filter((s) => s.status === 'Pending' || s.status === 'Open').length}{' '}
              {isUk ? 'очікує · Нестачі доставки' : 'pending · Short deliveries log'}
            </small>
          </button>
        )}
        {role.tabs.includes('inventory') && (
          <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
            📦 {isUk ? 'Інвентар' : 'Inventory'}
            <small>{isUk ? 'Залишки та фото по 4 ресторанах' : 'Stock & photos across 4 restaurants'}</small>
          </button>
        )}
      </div>

      {/* Main Content Body */}
      <div className="wa-body">
        {/* ================= TAB 1: DAILY ================= */}
        {activeTab === 'daily' && (
          <div>
            <h2 style={{ marginTop: 0 }}>🥬 {isAr ? `طلب يومي · ${branchTitle}` : `Daily Purchase Request · ${branchTitle}`}</h2>

            {/* Fixed Cost Control Officer selector (locked numbers — no manual phone editing) */}
            {(roleId === 'staff' || roleId === 'manager') && (
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div className="wa-field" style={{ flex: '1 1 260px' }}>
                  <label>📱 {isAr ? 'مسؤول مراقبة التكاليف (ثابت):' : 'Send to Cost Control Officer (Fixed):'}</label>
                  <select value={selectedOfficerId} onChange={(e) => setSelectedOfficerId(e.target.value)}>
                    {FIXED_COST_CONTROL_OFFICERS.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.label} ({off.phone})
                      </option>
                    ))}
                  </select>
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

                    {!d.status.includes('Approved') && !d.status.includes('Rejected') && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="wa-btn" style={{ flex: '1 1 130px' }} onClick={() => approveDailyByOffice(d.id)}>
                          ✅ {isAr ? 'موافقة' : 'Approve'}
                        </button>
                        <button className="wa-btn red" style={{ flex: '1 1 130px' }} onClick={() => rejectDailyByOffice(d.id)}>
                          ❌ {isAr ? 'رفض' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {d.status === 'Approved by Cost Control Office' && (
                      <div className="supplier-box">
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0e3a2a', marginBottom: 6 }}>
                          📤 {isAr ? 'تمت الموافقة — إرسال للمورد:' : 'Approved — Ready to Send to Supplier:'}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            placeholder="Supplier WhatsApp (2010...)"
                            value={waPhones.supplier}
                            onChange={(e) => setWaPhones((p) => ({ ...p, supplier: e.target.value }))}
                            style={{ flex: '1 1 160px', padding: '7px 10px', border: '1px solid #9ab0a2', borderRadius: 8, fontSize: 13 }}
                          />
                          <button
                            className="wa-btn whatsapp"
                            style={{ padding: '8px 14px', fontSize: 13 }}
                            onClick={() =>
                              sendSupplierWhatsApp({
                                id: d.id,
                                branchName: branchTitle,
                                department: d.department,
                                date: d.date,
                                items: d.items,
                              })
                            }
                          >
                            📱 {isAr ? 'إرسال للمورد' : 'Send to Supplier'}
                          </button>
                          <button
                            className="wa-btn ghost"
                            style={{ padding: '8px 12px', fontSize: 12.5 }}
                            onClick={() =>
                              printOrderPdf({
                                id: d.id,
                                type: 'Daily',
                                branchName: branchTitle,
                                department: d.department,
                                date: d.date,
                                items: d.items,
                                status: d.status,
                              })
                            }
                          >
                            📄 Download PDF
                          </button>
                        </div>
                      </div>
                    )}
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
                  {isAr ? 'للعلم فقط (الاعتماد من مكتب مراقبة التكاليف).' : 'Shown for information only (Cost Control Manager approves Equipment & Supplies only).'}
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
                {!savedDailyPreview ? (
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
                        ✅ {isAr ? 'حفظ الطلب للمراجعة' : 'Save Daily Request'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="wa-box" style={{ marginTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <b>✅ {savedDailyPreview.id} Saved — Preview for Cost Control Office:</b>
                      <button
                        type="button"
                        className="wa-btn ghost"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => setSavedDailyPreview(null)}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                    <pre style={{ margin: '10px 0 12px', padding: 12, background: '#ffffff', border: '1px solid #c8d3c3', borderRadius: 8, fontSize: 12.5, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {savedDailyPreview.msg}
                    </pre>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        className="wa-btn whatsapp"
                        style={{ width: '100%' }}
                        onClick={() => {
                          const officer = FIXED_COST_CONTROL_OFFICERS.find((o) => o.id === selectedOfficerId) || FIXED_COST_CONTROL_OFFICERS[0]
                          sendWhatsApp(officer.phone, savedDailyPreview.msg)
                          setSavedDailyPreview(null)
                          setDailyRows([{ name: '', qty: '1', notes: '' }])
                        }}
                      >
                        📱 {isAr ? 'إرسال الآن إلى Cost Control Office' : `Send to ${FIXED_COST_CONTROL_OFFICERS.find((o) => o.id === selectedOfficerId)?.label || 'Cost Control Office'} (WhatsApp)`}
                      </button>
                      <button
                        type="button"
                        className="wa-btn ghost"
                        style={{ width: '100%' }}
                        onClick={() => {
                          setSavedDailyPreview(null)
                          setDailyRows([{ name: '', qty: '1', notes: '' }])
                        }}
                      >
                        + {isAr ? 'إضافة طلب آخر' : 'Add another one'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ================= TAB 2: MY ORDERS (SCALABLE ACCORDION LIST) ================= */}
        {activeTab === 'my_orders' && (() => {
          const mq = myOrdersSearch.trim().toLowerCase()
          const filteredMyOrders = branchDaily.filter((d) => {
            if (myOrdersFilter === 'Waiting' && (d.status.includes('Approved') || d.status.includes('Rejected'))) return false
            if (myOrdersFilter === 'Approved' && !d.status.includes('Approved')) return false
            if (myOrdersFilter === 'Rejected' && !d.status.includes('Rejected')) return false
            if (!mq) return true
            return (
              d.id.toLowerCase().includes(mq) ||
              d.date.toLowerCase().includes(mq) ||
              d.department.toLowerCase().includes(mq) ||
              d.items.some((i) => i.name.toLowerCase().includes(mq))
            )
          })

          return (
            <div>
              <div className="section-head-clean">
                <h2>📋 {isAr ? `طلباتي · ${branchTitle}` : `My Orders · ${branchTitle}`}</h2>
                <p>{isAr ? 'اضغط على أي طلب لعرض الأصناف والتحديثات' : 'Tap any order card to inspect items, status timeline & add notes.'}</p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <div className="chip-row" style={{ marginBottom: 0 }}>
                  {['All', 'Waiting', 'Approved', 'Rejected'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`chip-btn ${myOrdersFilter === f ? 'active' : ''}`}
                      onClick={() => setMyOrdersFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <input
                  placeholder={isAr ? '🔍 بحث برقم الطلب أو الصنف...' : '🔍 Search order ID, item, or date...'}
                  value={myOrdersSearch}
                  onChange={(e) => setMyOrdersSearch(e.target.value)}
                  style={{ flex: '1 1 220px', padding: '8px 12px', border: '1.5px solid #9ab0a2', borderRadius: 10, fontSize: 13.5 }}
                />
              </div>

              {filteredMyOrders.length === 0 ? (
                <div className="wa-card" style={{ color: '#526359' }}>
                  {isAr ? 'لا توجد طلبات مطابقة.' : 'No orders found.'}
                </div>
              ) : (
                filteredMyOrders.map((d) => {
                  const isOpen = expandedMyOrderId === d.id
                  const badgeCls = d.status.includes('Approved') ? 'green' : d.status.includes('Rejected') ? 'red' : 'amber'
                  return (
                    <div key={d.id} className="daily-review-card" style={{ marginBottom: 10 }}>
                      <div
                        className="daily-review-head"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedMyOrderId(isOpen ? null : d.id)}
                      >
                        <div className="daily-review-meta">
                          <strong style={{ fontSize: 15, color: '#0e3a2a' }}>{d.id}</strong>
                          <span className="dept-pill">
                            {d.department === 'Bar' ? '🍸' : '🍳'} {d.department}
                          </span>
                          <span className="date-pill">📅 {d.date}</span>
                          <span style={{ fontSize: 12.5, color: '#526359' }}>
                            · {d.items.length} {d.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`wa-badge ${badgeCls}`}>{d.status}</span>
                          <span style={{ fontSize: 13, color: '#526359', fontWeight: 700 }}>{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {!isOpen && (
                        <div
                          style={{ fontSize: 12.5, color: '#526359', marginTop: 6, cursor: 'pointer' }}
                          onClick={() => setExpandedMyOrderId(d.id)}
                        >
                          {d.items.map((i) => `${i.name} (×${i.qty})`).join(', ')}
                        </div>
                      )}

                      {isOpen && (
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #e6ece3' }}>
                          <div style={{ marginBottom: 10 }}>
                            {d.items.map((i, idx) => (
                              <div key={idx} className="history-detail-row">
                                <span>
                                  <strong>{i.name}</strong>
                                  {i.notes ? <span style={{ color: '#526359', fontSize: 12, marginInlineStart: 6 }}>({i.notes})</span> : null}
                                </span>
                                <strong style={{ color: '#0e3a2a' }}>× {i.qty}</strong>
                              </div>
                            ))}
                          </div>

                          <div style={{ background: '#f8faf7', padding: 12, borderRadius: 10, marginBottom: 10 }}>
                            <strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Timeline</strong>
                            <div className="timeline-list">
                              {(d.timeline || []).map((t, i) => (
                                <div key={i} className="timeline-item">
                                  <span className="timeline-dot" />
                                  <span><strong>{t.time}</strong> — {t.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <input
                              style={{ flex: '1 1 200px', padding: '8px 10px', border: '1.5px solid #cfd9cb', borderRadius: 8, fontSize: 13 }}
                              placeholder={isAr ? 'أضف ملاحظة...' : 'Add a note...'}
                              value={orderNoteText}
                              onChange={(e) => setOrderNoteText(e.target.value)}
                            />
                            <button className="wa-btn" onClick={() => addTimelineNote(d.id, orderNoteText)}>
                              📎 {isAr ? 'إضافة ملاحظة' : 'Add Note'}
                            </button>
                            <button
                              className="wa-btn ghost"
                              onClick={() => addTimelineNote(d.id, 'Asked Cost Control Office for update')}
                            >
                              {isAr ? 'طلب تحديث' : 'Ask for Update'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )
        })()}

        {/* ================= TAB 3: PERIODIC (NO PRICES, 4 SUBCATEGORIES, MANUAL INVENTORY -> NEED) ================= */}
        {activeTab === 'periodic' && (
          <div>
            <div className="section-head-clean">
              <h2>
                {roleId === 'owner'
                  ? `👑 ${isUk ? `Погодження власника · ${branchTitle}` : `Owner Approvals · ${branchTitle}`}`
                  : `🍽️ ${isAr ? `معدات وأدوات المطعم · ${branchTitle}` : `Equipment & Supplies · ${branchTitle}`}`}
              </h2>
              <p>
                {roleId === 'owner'
                  ? (isUk
                      ? 'Тут ви отримуєте запити на обладнання та інвентар від Cost Control Manager для фінального рішення — погодити (Approve) або відхилити (Reject). Натисніть на картку, щоб переглянути деталі, або зв’яжіться з Cost Control Manager напряму.'
                      : 'Here you receive Equipment & Supplies Requests escalated by the Cost Control Manager for your final Approve or Reject decision. Tap any card to inspect full item details & stock, or contact the Cost Control Manager directly.')
                  : isAr
                  ? 'طلبات المعدات والأطباق والزجاجيات وأدوات المطبخ والبار مع مقارنة الرصيد الحالي.'
                  : 'Non-daily requests for Tableware & Glassware, Kitchen & Bar Tools, Small Equipment & Textiles with current inventory counts.'}
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
                    ✅ {isAr ? 'حفظ الطلب' : 'Save Equipment Request'}
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
                  title: roleId === 'cost_control'
                    ? (isAr ? '⚡ بانتظار موافقتك الآن' : '⚡ Waiting for you to approve')
                    : '1 - Cost Control Manager',
                  subtitle: roleId === 'cost_control'
                    ? (isAr ? 'مطلوب إجراء منك — راجع واعتمد أو ارفض' : 'Action required — review items and Approve, Reject, or Escalate to Owner')
                    : (isAr ? 'في انتظار اعتماد Cost Control Manager' : 'Submitted · Waiting for Cost Control Manager'),
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
                <div style={{ marginTop: roleId === 'owner' ? 8 : 22 }}>
                  {roleId !== 'owner' && (
                    <h3 style={{ margin: '0 0 10px', fontSize: 16, color: '#0e3a2a' }}>
                      📋 {isAr ? 'الطلبات المرسلة وحالة الاعتماد' : 'Submitted Requests & Approval Status'}
                    </h3>
                  )}
                  {visibleBuckets.map((bucket) => {
                    const isUrgentMine = roleId === 'cost_control' && bucket.canAct && bucket.items.length > 0
                    const isSecondaryBucket = roleId === 'cost_control' && !bucket.canAct
                    return (
                    <div
                      key={bucket.num}
                      className={`approval-bucket ${isUrgentMine ? 'urgent-mine' : isSecondaryBucket ? 'secondary-bucket' : bucket.items.length > 0 ? 'has-pending' : ''}`}
                    >
                      <div className="approval-bucket-head">
                        <div>
                          <b style={{ fontSize: 15, color: isUrgentMine ? '#991b1b' : '#0e3a2a' }}>
                            {roleId === 'owner' ? (isUk ? 'Очікують на ваше рішення' : 'Pending Your Final Approval') : bucket.title}
                          </b>
                          {roleId !== 'owner' && (
                            <div style={{ fontSize: 12, color: isUrgentMine ? '#7f1d1d' : '#526359', marginTop: 2 }}>{bucket.subtitle}</div>
                          )}
                        </div>
                        <span className={`wa-badge ${isUrgentMine ? 'red' : isSecondaryBucket ? 'gray' : bucket.items.length > 0 ? 'amber' : 'gray'}`}>
                          {bucket.items.length > 0
                            ? isUrgentMine
                              ? `${bucket.items.length} Action Required`
                              : `${bucket.items.length} ${isUk ? 'очікує' : 'Pending'}`
                            : (isUk ? 'Немає запитів' : 'No pending')}
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
                                  <span>{isOwnerOpen ? (isUk ? 'Згорнути' : 'Hide') : (isUk ? 'Натисніть для деталей' : 'Tap for details')}</span>
                                </div>
                                <div className="owner-card-actions" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="wa-btn"
                                    onClick={() => approvePeriodicStep(req.id, 3, false)}
                                  >
                                    ✅ {isUk ? 'Погодити' : 'Approve'}
                                  </button>
                                  <button
                                    className="wa-btn red"
                                    onClick={() => rejectPeriodicStep(req.id, 3)}
                                  >
                                    ❌ {isUk ? 'Відхилити' : 'Reject'}
                                  </button>
                                  <button
                                    className="wa-btn owner-contact-btn"
                                    onClick={() =>
                                      sendWhatsApp(
                                        waPhones.costMgr,
                                        `Hi Cost Control Manager, regarding Periodic Request ${req.id} (${branchTitle} - ${req.department}):\n${req.items.map((i) => `- ${i.name} (Have: ${i.inventory ?? 0}, Need: ${i.qty})`).join('\n')}`
                                      )
                                    }
                                  >
                                    📞 {isUk ? 'Зв’язатися з Cost Control Manager' : 'Contact Cost Control Manager'}
                                  </button>
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

                        const isPerOpen = expandedPeriodicId === req.id
                        return (
                        <div key={req.id} className="wf-request-box">
                          <div
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, cursor: 'pointer' }}
                            onClick={() => setExpandedPeriodicId((cur) => (cur === req.id ? null : req.id))}
                          >
                            <div>
                              <b style={{ fontSize: 15, color: '#0e3a2a' }}>
                                {req.id} · {branchTitle} ({req.department})
                              </b>
                              <div style={{ fontSize: 12.5, color: '#526359', marginTop: 3 }}>
                                {req.items.length} {req.items.length === 1 ? 'item' : 'items'}: {req.items.slice(0, 2).map((i) => `${i.name} (×${i.qty})`).join(', ')}{req.items.length > 2 ? ` +${req.items.length - 2}` : ''}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className={`wa-badge ${isUrgentMine ? 'red' : 'amber'}`}>
                                {isUrgentMine ? `⚡ Waiting for you · ${req.date}` : `Pending · ${req.date}`}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0e3a2a' }}>{isPerOpen ? '▲' : '▼'}</span>
                            </div>
                          </div>

                          {isPerOpen && (
                          <>
                          <div className="wf-meta-row" style={{ marginTop: 10 }}>
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
                                    `⏰ Reminder: Equipment Request ${req.id} (${branchTitle} - ${req.department}) is waiting for your approval.\n${req.items.map((i) => `- ${i.name} (Have: ${i.inventory ?? 0}, Need: ${i.qty})`).join('\n')}`
                                  )
                                }
                              >
                                {bucket.reminderLabel}
                              </button>
                            </div>
                          ) : null}
                          </>
                          )}
                        </div>
                      )
                      })}
                    </div>
                    )
                  })}

                  {roleId !== 'owner' && completedOrRejected.length > 0 && (
                    <div className="approval-bucket">
                      <div className="approval-bucket-head">
                        <b style={{ fontSize: 15, color: '#0e3a2a' }}>✅ Completed / Closed Requests</b>
                        <span className="wa-badge green">{completedOrRejected.length}</span>
                      </div>
                      {completedOrRejected.map((req) => {
                        const isFullyApproved = !req.status.includes('Rejected') && (req.status.includes('Approved by Cost Control Manager') || req.status === 'Fully Approved by Owner')
                        const approverParts = [
                          req.step1?.approved ? `Submitted: ${req.step1.name}` : null,
                          req.step2?.approved ? `Approved by Cost Control Manager: ${req.step2.name} (${req.step2.time})` : req.step2?.rejected ? `Rejected by Cost Control Manager: ${req.step2.name}` : null,
                          req.step3?.approved ? `Approved by Owner: ${req.step3.name} (${req.step3.time})` : req.step3?.rejected ? `Rejected by Owner: ${req.step3.name}` : null,
                        ].filter(Boolean)
                        return (
                        <div key={req.id} className="wf-request-box" style={{ background: req.status.includes('Rejected') ? '#fff8f8' : '#f7fbf8' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <b>{req.id} · {req.department} ({req.date})</b>
                            <span className={`wa-badge ${req.status.includes('Rejected') ? 'red' : 'green'}`}>{req.status}</span>
                          </div>
                          {approverParts.length > 0 && (
                            <div style={{ fontSize: 12, color: '#146c43', fontWeight: 600, marginTop: 6 }}>
                              {approverParts.join(' · ')}
                            </div>
                          )}
                          <div style={{ fontSize: 12.5, color: '#2b3a31', marginTop: 6 }}>
                            {req.items.map((i) => `${i.name} (Have: ${i.inventory ?? 0} → Order: ${i.qty})`).join(' · ')}
                          </div>
                          {isFullyApproved && (roleId === 'cost_office' || roleId === 'cost_control') && (
                            <div className="supplier-box">
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0e3a2a', marginBottom: 6 }}>
                                📤 {isAr ? 'إرسال الطلب المعتمد للمورد:' : 'Fully Approved — Send to Supplier:'}
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <input
                                  placeholder="Supplier WhatsApp (2010...)"
                                  value={waPhones.supplier}
                                  onChange={(e) => setWaPhones((p) => ({ ...p, supplier: e.target.value }))}
                                  style={{ flex: '1 1 160px', padding: '7px 10px', border: '1px solid #9ab0a2', borderRadius: 8, fontSize: 13 }}
                                />
                                <button
                                  className="wa-btn ghost"
                                  style={{ padding: '7px 12px', fontSize: 12.5 }}
                                  onClick={() =>
                                    printOrderPdf({
                                      id: req.id,
                                      type: 'Periodic',
                                      branchName: branchTitle,
                                      department: req.department,
                                      date: req.date,
                                      items: req.items,
                                      status: req.status,
                                    })
                                  }
                                >
                                  📄 PDF
                                </button>
                                <button
                                  className="wa-btn whatsapp"
                                  style={{ padding: '7px 12px', fontSize: 12.5 }}
                                  onClick={() =>
                                    sendSupplierWhatsApp({
                                      id: req.id,
                                      branchName: branchTitle,
                                      department: req.department,
                                      date: req.date,
                                      items: req.items,
                                    })
                                  }
                                >
                                  📱 WhatsApp Supplier
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* ================= TAB 7: INVENTORY EXPLORER (OWNER VIEW + MANAGER LIVE UPDATE & BREAKAGE) ================= */}
        {activeTab === 'inventory' && (() => {
          const invCategories = [
            { id: 'Food', label: isUk ? 'Продукти (Poster)' : 'Food (Poster Kitchen)', icon: '🥬', hero: true },
            { id: 'Tableware & Glassware', label: isUk ? 'Посуд та скло' : 'Tableware & Glassware', icon: '🍽️' },
            { id: 'Kitchen & Bar Tools', label: isUk ? 'Інвентар кухні та бару' : 'Kitchen & Bar Tools', icon: '🔪' },
            { id: 'Small Equipment', label: isUk ? 'Мале обладнання' : 'Small Equipment', icon: '⚙️' },
            { id: 'Linen & Textiles', label: isUk ? 'Текстиль' : 'Linen & Textiles', icon: '🧺' },
            { id: 'Consumables', label: isUk ? 'Упаковка та хімія' : 'Packaging & Hygiene', icon: '🧤' },
            { id: 'Bar & Beverages', label: isUk ? 'Бар та напої (Poster)' : 'Bar & Beverages (Poster)', icon: '🍸' },
          ]

          const getPosterBranchItems = (bId = branchId) =>
            (state.posterSnapshot?.branches?.[bId]?.items || []).map((p) => {
              const cls = classifyPosterItem(p.name)
              return {
                id: `POSTER-${p.poster_id}`,
                name: p.name,
                nameAr: p.name,
                spec: `Poster ID #${p.poster_id} · ${cls.cat === 'Food' ? cls.foodSub : cls.cat}${p.prime_cost ? ` · ${p.prime_cost} EGP` : ''}`,
                category: cls.cat,
                subType: cls.cat === 'Food' ? cls.foodSub : cls.cat,
                foodSub: cls.foodSub,
                unit: p.unit,
                emoji: cls.cat === 'Consumables' ? '🧤' : cls.cat === 'Bar & Beverages' ? '🍸' : '🥬',
                posterStock: { [bId]: p.poster_stock },
                isPoster: true,
              }
            })

          const branchItemQty = (item, bId = branchId) => getBranchStock(item, bId)
          const sq = invSearch.trim().toLowerCase()
          const canEditInv = roleId === 'manager' || roleId === 'cost_control'
          const nonFoodCatalog = CURATED_CATALOG.filter((c) => c.category === 'Non-food')
          const posterBranchItems = getPosterBranchItems(branchId)

          const allCombinedItems = [
            ...nonFoodCatalog,
            ...posterBranchItems,
          ]

          const catCatalogItems = (sq
            ? allCombinedItems
            : invCategory === 'Food'
            ? posterBranchItems.filter((p) => p.category === 'Food' && p.foodSub === invFoodSub)
            : invCategory === 'Bar & Beverages'
            ? posterBranchItems.filter((p) => p.category === 'Bar & Beverages')
            : invCategory === 'Consumables'
            ? [...nonFoodCatalog.filter((c) => c.subType === 'Consumables'), ...posterBranchItems.filter((p) => p.category === 'Consumables')]
            : nonFoodCatalog.filter((c) => c.subType === invCategory)
          ).filter((c) => {
            if (branchItemQty(c) <= 0 && !canEditInv) return false
            if (canEditInv && branchItemQty(c) <= 0 && !sq) return false
            if (!sq) return true
            return (
              c.name.toLowerCase().includes(sq) ||
              (c.nameAr || '').includes(invSearch.trim()) ||
              (c.spec || '').toLowerCase().includes(sq) ||
              (c.subType || '').toLowerCase().includes(sq) ||
              c.category.toLowerCase().includes(sq)
            )
          })

          const branchLog = (state.inventoryLog || []).filter((l) => l.branchId === branchId)

          return (
            <div>
              <div className="section-head-clean">
                <h2>📦 {isUk ? `Інвентар та залишки · ${branchTitle}` : `Restaurant Inventory · ${branchTitle}`}</h2>
                <p>
                  {canEditInv
                    ? `Live Poster food stock (${state.posterSnapshot?.fetched_at_utc || 'synced'}) + bar/kitchen supplies. Update actual counts or record breakage with a mandatory reason.`
                    : isUk
                    ? `Живі залишки продуктів із Poster (${state.posterSnapshot?.fetched_at_utc || ''}) та інвентар бару/кухні по кожному ресторану.`
                    : `Live Poster food stock (${state.posterSnapshot?.fetched_at_utc || 'synced'}) plus tableware, bar/kitchen tools & equipment.`}
                </p>
              </div>

              {(() => {
                const needsBranchPick = (roleId === 'owner' || roleId === 'cost_control') && !invBranchPicked
                const activeBranchObj = BRANCHES.find((b) => b.id === branchId) || BRANCHES[0]
                const activePosterCount = (state.posterSnapshot?.branches?.[activeBranchObj.id]?.items || []).filter((p) => p.poster_stock > 0).length
                const activeNonFoodCount = nonFoodCatalog.filter((c) => branchItemQty(c, activeBranchObj.id) > 0).length
                const getCatCount = (cat) =>
                  (cat.id === 'Food'
                    ? posterBranchItems.filter((p) => p.category === 'Food')
                    : cat.id === 'Bar & Beverages'
                    ? posterBranchItems.filter((p) => p.category === 'Bar & Beverages')
                    : cat.id === 'Consumables'
                    ? [...nonFoodCatalog.filter((c) => c.subType === 'Consumables'), ...posterBranchItems.filter((p) => p.category === 'Consumables')]
                    : nonFoodCatalog.filter((c) => c.subType === cat.id)
                  ).filter((c) => branchItemQty(c) > 0).length
                const activeCatObj = invCategories.find((c) => c.id === invCategory) || invCategories[0]

                if (needsBranchPick) {
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0e3a2a', marginBottom: 10 }}>
                        {isUk ? 'Крок 1: Оберіть ресторан, щоб переглянути залишки' : 'Step 1: Choose a restaurant to view its inventory'}
                      </div>
                      <div className="inv-branch-grid">
                        {BRANCHES.map((b) => {
                          const pCount = (state.posterSnapshot?.branches?.[b.id]?.items || []).filter((p) => p.poster_stock > 0).length
                          const nCount = nonFoodCatalog.filter((c) => branchItemQty(c, b.id) > 0).length
                          return (
                            <button
                              key={b.id}
                              type="button"
                              className="inv-branch-card"
                              onClick={() => {
                                setBranchId(b.id)
                                setInvBranchPicked(true)
                                setInvCatOpen(false)
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                                <strong style={{ color: '#0e3a2a', fontSize: 15 }}>🏪 {b.name}</strong>
                                <span style={{ color: '#0e3a2a', fontWeight: 700 }}>→</span>
                              </div>
                              <div style={{ fontSize: 12, color: '#526359', marginTop: 5 }}>
                                📍 {b.city} · {pCount} Poster + {nCount} supplies
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                return (
                  <>
                    {(roleId === 'owner' || roleId === 'cost_control') && (
                      <div className="inv-active-branch-bar">
                        <div>
                          <strong style={{ fontSize: 15 }}>🏪 {activeBranchObj.name}</strong>
                          <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>
                            📍 {activeBranchObj.city} · {activePosterCount} Poster + {activeNonFoodCount} supplies
                          </div>
                        </div>
                        <button
                          type="button"
                          className="inv-change-branch-btn"
                          onClick={() => {
                            setInvBranchPicked(false)
                            setInvCatOpen(false)
                            setInvSearch('')
                          }}
                        >
                          ← {isUk ? 'Змінити ресторан' : 'Change Restaurant'}
                        </button>
                      </div>
                    )}

                    <div className="inv-picker-wrap" style={{ marginBottom: 12 }}>
                      <button
                        type="button"
                        className="inv-picker-card"
                        onClick={() => setInvCatOpen((v) => !v)}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div className="inv-picker-eyebrow">{isUk ? 'Крок 2 · Категорія' : 'Category'}</div>
                          <strong style={{ color: '#0e3a2a', fontSize: 15, display: 'block' }}>
                            {activeCatObj.icon} {activeCatObj.label}
                          </strong>
                          <div style={{ fontSize: 11.5, color: '#526359', marginTop: 2 }}>
                            {getCatCount(activeCatObj)} {isUk ? 'позицій в наявності' : 'items in stock'}
                          </div>
                        </div>
                        <span className="inv-picker-chevron">{invCatOpen ? '▲ Close' : 'Choose Category ▾'}</span>
                      </button>

                      {invCatOpen && (
                        <div className="inv-picker-menu">
                          {invCategories.map((cat) => {
                            const count = getCatCount(cat)
                            const isActive = invCategory === cat.id
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                className={`inv-picker-option ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                  setInvCategory(cat.id)
                                  setInvCatOpen(false)
                                }}
                              >
                                <span>
                                  {cat.icon} <b>{cat.label}</b>
                                </span>
                                <span style={{ fontSize: 12, opacity: 0.85 }}>({count})</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="inv-search-wrap">
                      <input
                        className="inv-search-input"
                        placeholder={
                          isUk
                            ? '🔍 Пошук по назві або категорії (наприклад: Glass, Wine, Tomatoes)...'
                            : '🔍 Search item or category across this restaurant...'
                        }
                        value={invSearch}
                        onChange={(e) => setInvSearch(e.target.value)}
                      />
                      {invSearch && (
                        <button
                          type="button"
                          className="inv-search-clear"
                          onClick={() => setInvSearch('')}
                          aria-label="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </>
                )
              })()}

              {!((roleId === 'owner' || roleId === 'cost_control') && !invBranchPicked) && (
              <>
              {!sq && invCategory === 'Food' && (
                <div className="inv-subcat-bar">
                  <div className="inv-subcat-label">
                    {isUk ? 'Підкатегорія продуктів (Poster):' : 'Food Subcategory (Choose group):'}
                  </div>
                  <div className="inv-subcat-grid">
                    {['Meat & Seafood', 'Produce (Veg & Fruit)', 'Dairy & Eggs', 'Dry, Sauces & Bakery'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        className={`inv-subcat-btn ${invFoodSub === sub ? 'active' : ''}`}
                        onClick={() => setInvFoodSub(sub)}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {catCatalogItems.length === 0 ? (
                <div className="wa-card" style={{ color: '#526359', fontSize: 13.5 }}>
                  {isUk
                    ? `У категорії «${invCategories.find((c) => c.id === invCategory)?.label}» для ${branchTitle} зараз немає позицій на обліку.`
                    : `No items recorded in "${invCategory}" for ${branchTitle}.`}
                </div>
              ) : (
                <div className="inv-items-grid">
                  {catCatalogItems.map((item) => {
                    const imgSrc = branchId === 'cairo' ? ITEM_IMAGES[item.id] : null
                    const qty = branchItemQty(item)
                    const isEditing = editingInvId === item.id
                    return (
                      <div key={item.id} className="inv-item-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', flexDirection: 'inherit' }}>
                          <div className="inv-item-media" style={{ width: '100%', height: 145 }}>
                            {imgSrc ? (
                              <img src={imgSrc} alt={item.name} loading="lazy" />
                            ) : (
                              <span style={{ fontSize: 42 }}>{item.emoji || '📦'}</span>
                            )}
                          </div>
                          <div className="inv-item-body">
                            <div style={{ minWidth: 0 }}>
                              <strong style={{ fontSize: 14, color: '#0e3a2a', display: 'block' }}>{item.name}</strong>
                              <div style={{ fontSize: 12, color: '#526359', marginTop: 2 }}>{item.spec}</div>
                            </div>
                            <span className="wa-badge compact green">
                              {qty} {item.unit}
                            </span>
                          </div>
                        </div>

                        {canEditInv && !isEditing && (
                          <div style={{ padding: '0 12px 10px' }}>
                            <button
                              type="button"
                              className="wa-btn ghost"
                              style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}
                              onClick={() => {
                                setEditingInvId(item.id)
                                setInvEditQty(String(qty))
                                setInvEditReason('')
                              }}
                            >
                              ✏️ Update / Report Breakage
                            </button>
                          </div>
                        )}

                        {canEditInv && isEditing && (
                          <div style={{ padding: '10px 12px', borderTop: '1px solid #dfe6dc', background: '#f8faf7' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>New Actual Count ({item.unit}):</div>
                            <div className="stepper-box" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                              <button type="button" className="stepper-btn" onClick={() => setInvEditQty((v) => String(Math.max(0, Number(v || 0) - 1)))}>−</button>
                              <input type="number" className="stepper-val" value={invEditQty} onChange={(e) => setInvEditQty(e.target.value)} />
                              <button type="button" className="stepper-btn plus" onClick={() => setInvEditQty((v) => String(Number(v || 0) + 1))}>+</button>
                            </div>
                            <div className="chip-row" style={{ marginBottom: 6 }}>
                              {['Broken', 'Damaged', 'Lost', 'Recount'].map((rs) => (
                                <button
                                  key={rs}
                                  type="button"
                                  className={`chip-btn ${invEditReason === rs ? 'active' : ''}`}
                                  style={{ padding: '4px 8px', fontSize: 11.5 }}
                                  onClick={() => setInvEditReason(rs)}
                                >
                                  {rs}
                                </button>
                              ))}
                            </div>
                            <input
                              placeholder="Reason (required)..."
                              value={invEditReason}
                              onChange={(e) => setInvEditReason(e.target.value)}
                              style={{ width: '100%', padding: '7px 9px', border: '1px solid #cfd9cb', borderRadius: 8, fontSize: 12.5, marginBottom: 8 }}
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button type="button" className="wa-btn" style={{ flex: 1, padding: '6px 10px', fontSize: 12 }} onClick={() => saveInventoryAdjustment(item)}>
                                ✅ Save
                              </button>
                              <button type="button" className="wa-btn ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setEditingInvId(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {branchLog.length > 0 && (
                <div className="wa-card" style={{ marginTop: 16 }}>
                  <h3 style={{ marginTop: 0, fontSize: 15 }}>
                    📝 {isUk ? `Журнал змін та бою · ${branchTitle}` : `Inventory Adjustments & Breakage Log · ${branchTitle}`}
                  </h3>
                  {branchLog.map((l) => (
                    <div key={l.id} className="history-detail-row">
                      <span>
                        <strong>{l.itemName}</strong>: {l.prevQty} → <strong>{l.newQty} {l.unit}</strong>
                        <span className="wa-badge amber compact" style={{ marginInlineStart: 8 }}>{l.reason}</span>
                      </span>
                      <span style={{ fontSize: 12, color: '#526359' }}>{l.date} {l.time}</span>
                    </div>
                  ))}
                </div>
              )}
              </>
              )}
            </div>
          )
        })()}

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
                        actor: `${isUk ? 'Запит від:' : 'Requested by:'} ${d.requestedBy}`,
                        approvedBy: d.status.includes('Approved')
                          ? (isUk ? 'Погоджено: Cost Control Office' : 'Approved by: Cost Control Office')
                          : d.status.includes('Rejected')
                          ? (isUk ? 'Відхилено: Cost Control Office' : 'Rejected by: Cost Control Office')
                          : '',
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
                          p.step1?.approved ? `${isUk ? 'Подано:' : 'Requested:'} ${p.step1.name}` : null,
                          p.step2?.approved ? `CC Mgr: ${p.step2.name}` : null,
                          p.step3?.approved ? `Owner: ${p.step3.name}` : null,
                        ].filter(Boolean).join(' · '),
                        approvedBy: p.step3?.approved
                          ? (isUk ? `Погоджено: Owner (${p.step3.name})` : `Approved by: Owner (${p.step3.name})`)
                          : p.step2?.approved
                          ? (isUk ? `Погоджено: Cost Control Manager (${p.step2.name})` : `Approved by: Cost Control Manager (${p.step2.name})`)
                          : p.step3?.rejected
                          ? (isUk ? `Відхилено: Owner (${p.step3.name})` : `Rejected by: Owner (${p.step3.name})`)
                          : p.step2?.rejected
                          ? (isUk ? `Відхилено: Cost Control Manager (${p.step2.name})` : `Rejected by: Cost Control Manager (${p.step2.name})`)
                          : '',
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
                      {r.approvedBy && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: r.status.includes('Rejected') ? '#b42318' : '#146c43' }}>
                          {r.approvedBy}
                        </div>
                      )}
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
