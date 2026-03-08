<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

// ══════════ TYPES ══════════
type RarityKey = 'mil-spec' | 'restricted' | 'classified' | 'covert' | 'knife'
type WType     = 'pistol' | 'rifle' | 'smg' | 'sniper' | 'shotgun' | 'knife-w'
type Tab       = 'open' | 'inventory' | 'tradeup' | 'market'

interface PoolItem { weapon:string; skin:string; rarity:RarityKey; gradient:string; basePrice:number; wType:WType }
interface InvItem  extends PoolItem { uid:number; float:number; pattern:number; statTrak:boolean }

// ══════════ RARITY CONFIG ══════════
const RARITIES: Record<RarityKey,{weight:number;color:string;label:string;shadow:string;bg:string}> = {
  'mil-spec':   {weight:7992,color:'#4b69ff',label:'Mil-Spec',    shadow:'rgba(75,105,255,.6)',  bg:'rgba(75,105,255,.12)' },
  'restricted': {weight:1598,color:'#8847ff',label:'Restricted',  shadow:'rgba(136,71,255,.6)',  bg:'rgba(136,71,255,.12)' },
  'classified': {weight:320, color:'#d32ce6',label:'Classified',  shadow:'rgba(211,44,230,.6)',  bg:'rgba(211,44,230,.12)' },
  'covert':     {weight:64,  color:'#eb4b4b',label:'Covert',      shadow:'rgba(235,75,75,.6)',   bg:'rgba(235,75,75,.12)'  },
  'knife':      {weight:26,  color:'#e4ae39',label:'★ Rare Spec.',shadow:'rgba(228,174,57,.65)', bg:'rgba(228,174,57,.12)' },
}

// ══════════ SVG ICONS ══════════
const WSVG: Record<WType,string> = {
  pistol:   `<svg viewBox="0 0 80 44" fill="currentColor"><rect x="8" y="14" width="52" height="11" rx="3"/><rect x="5" y="17" width="7" height="5" rx="1"/><rect x="42" y="7" width="10" height="9" rx="2"/><rect x="22" y="25" width="16" height="17" rx="3"/><rect x="36" y="25" width="5" height="8" rx="1" opacity=".5"/></svg>`,
  rifle:    `<svg viewBox="0 0 96 40" fill="currentColor"><rect x="5" y="14" width="80" height="9" rx="2"/><rect x="2" y="16" width="7" height="5" rx="1"/><rect x="56" y="8" width="12" height="8"/><rect x="22" y="23" width="20" height="13" rx="3"/><rect x="74" y="10" width="5" height="13" rx="1"/></svg>`,
  smg:      `<svg viewBox="0 0 80 42" fill="currentColor"><rect x="8" y="14" width="58" height="10" rx="3"/><rect x="3" y="16" width="8" height="6" rx="1"/><rect x="46" y="8" width="10" height="8"/><rect x="16" y="24" width="14" height="14" rx="3"/><rect x="54" y="11" width="5" height="13" rx="1"/></svg>`,
  sniper:   `<svg viewBox="0 0 110 36" fill="currentColor"><rect x="5" y="13" width="94" height="10" rx="2"/><rect x="2" y="15" width="7" height="6" rx="1"/><rect x="30" y="23" width="22" height="11" rx="3"/><rect x="60" y="7" width="8" height="8"/><rect x="72" y="10" width="16" height="5" rx="2" opacity=".6"/></svg>`,
  shotgun:  `<svg viewBox="0 0 90 38" fill="currentColor"><rect x="5" y="13" width="74" height="12" rx="2"/><rect x="5" y="13" width="58" height="5" rx="1" opacity=".4"/><rect x="2" y="15" width="7" height="8" rx="1"/><rect x="22" y="25" width="20" height="11" rx="3"/></svg>`,
  'knife-w':`<svg viewBox="0 0 90 30" fill="currentColor"><polygon points="16,8 82,13 82,17 16,22"/><rect x="5" y="11" width="13" height="18" rx="3"/><line x1="16" y1="8" x2="16" y2="22" stroke="currentColor" stroke-width="1.5" opacity=".4"/></svg>`,
}

// ══════════ ITEM POOL ══════════
const POOL: PoolItem[] = [
  {weapon:'Glock-18',       skin:'Wasteland Rebel',rarity:'mil-spec',  gradient:'linear-gradient(135deg,#1d3b2a,#2e5c3d)',basePrice:.15, wType:'pistol'  },
  {weapon:'MP9',            skin:'Hypnotic',       rarity:'mil-spec',  gradient:'linear-gradient(135deg,#0f1e3d,#1a3566)',basePrice:.10, wType:'smg'     },
  {weapon:'P250',           skin:'Nuclear Threat', rarity:'mil-spec',  gradient:'linear-gradient(135deg,#3b0f0f,#661a1a)',basePrice:.10, wType:'pistol'  },
  {weapon:'SSG 08',         skin:'Dragonfire',     rarity:'mil-spec',  gradient:'linear-gradient(135deg,#3b1f0f,#7a3d12)',basePrice:.15, wType:'sniper'  },
  {weapon:'Nova',           skin:'Antique',        rarity:'mil-spec',  gradient:'linear-gradient(135deg,#2b2b1a,#4a4a28)',basePrice:.08, wType:'shotgun' },
  {weapon:'Dual Berettas',  skin:'Hemoglobin',     rarity:'mil-spec',  gradient:'linear-gradient(135deg,#3b0000,#780000)',basePrice:.10, wType:'pistol'  },
  {weapon:'FAMAS',          skin:'Meltdown',       rarity:'mil-spec',  gradient:'linear-gradient(135deg,#0f2e0f,#1e561e)',basePrice:.08, wType:'rifle'   },
  {weapon:'AUG',            skin:'Fleet Flock',    rarity:'restricted',gradient:'linear-gradient(135deg,#150a30,#2e1566)',basePrice:.60, wType:'rifle'   },
  {weapon:'CZ75-Auto',      skin:'Emerald Quartz', rarity:'restricted',gradient:'linear-gradient(135deg,#0a2818,#145c32)',basePrice:1.50,wType:'pistol'  },
  {weapon:'P90',            skin:'Shallow Grave',  rarity:'restricted',gradient:'linear-gradient(135deg,#1e1e0a,#3d3d14)',basePrice:.50, wType:'smg'     },
  {weapon:'M4A4',           skin:'Buzz Kill',      rarity:'restricted',gradient:'linear-gradient(135deg,#280a28,#52145c)',basePrice:4.00,wType:'rifle'   },
  {weapon:'MP7',            skin:'Motherboard',    rarity:'restricted',gradient:'linear-gradient(135deg,#0a1428,#142252)',basePrice:.80, wType:'smg'     },
  {weapon:'AWP',            skin:'Phobos',         rarity:'classified',gradient:'linear-gradient(135deg,#1a0a2e,#3d1466)',basePrice:10.0,wType:'sniper'  },
  {weapon:'M4A1-S',         skin:'Decimator',      rarity:'classified',gradient:'linear-gradient(135deg,#2e0a14,#661428)',basePrice:5.00,wType:'rifle'   },
  {weapon:'USP-S',          skin:'Flashback',      rarity:'classified',gradient:'linear-gradient(135deg,#0a0a2e,#0f0f66)',basePrice:18.0,wType:'pistol'  },
  {weapon:'AK-47',          skin:'Neon Rider',     rarity:'covert',    gradient:'linear-gradient(135deg,#1a0000,#660000)',basePrice:50.0,wType:'rifle'   },
  {weapon:'M4A4',           skin:'Desolate Space', rarity:'covert',    gradient:'linear-gradient(135deg,#00001a,#000066)',basePrice:30.0,wType:'rifle'   },
  {weapon:'Karambit',       skin:'Gamma Doppler',  rarity:'knife',     gradient:'linear-gradient(135deg,#0f1a0a,#1e3d14)',basePrice:550, wType:'knife-w' },
  {weapon:'M9 Bayonet',     skin:'Gamma Doppler',  rarity:'knife',     gradient:'linear-gradient(135deg,#0a1a0f,#143d20)',basePrice:360, wType:'knife-w' },
  {weapon:'Butterfly Knife',skin:'Gamma Doppler',  rarity:'knife',     gradient:'linear-gradient(135deg,#1a0a14,#3d142e)',basePrice:480, wType:'knife-w' },
  {weapon:'Huntsman Knife', skin:'Gamma Doppler',  rarity:'knife',     gradient:'linear-gradient(135deg,#0a1a1a,#143d3d)',basePrice:220, wType:'knife-w' },
  {weapon:'Falchion Knife', skin:'Gamma Doppler',  rarity:'knife',     gradient:'linear-gradient(135deg,#0f0a1a,#201452)',basePrice:190, wType:'knife-w' },
  {weapon:'Shadow Daggers', skin:'Gamma Doppler',  rarity:'knife',     gradient:'linear-gradient(135deg,#1a0f00,#3d2800)',basePrice:160, wType:'knife-w' },
  {weapon:'Gut Knife',      skin:'Gamma Doppler',  rarity:'knife',     gradient:'linear-gradient(135deg,#001a0a,#003d14)',basePrice:170, wType:'knife-w' },
  {weapon:'Bowie Knife',    skin:'Gamma Doppler',  rarity:'knife',     gradient:'linear-gradient(135deg,#001a14,#003d28)',basePrice:180, wType:'knife-w' },
]

// ══════════ TRADE-UP CONFIG ══════════
const TU_NEXT:  Partial<Record<RarityKey,RarityKey>> = {'mil-spec':'restricted','restricted':'classified','classified':'covert','covert':'knife'}
const TU_COUNT: Partial<Record<RarityKey,number>>    = {'mil-spec':10,'restricted':10,'classified':10,'covert':5}

// ══════════ HELPERS ══════════
function rollRarity(): RarityKey {
  let r = Math.random()*10000
  for (const [k,v] of Object.entries(RARITIES) as [RarityKey,typeof RARITIES[RarityKey]][]) { r -= v.weight; if (r<=0) return k }
  return 'mil-spec'
}
const rndFloat   = () => parseFloat((Math.random()*0.9999999999).toFixed(10))
const rndPattern = () => Math.floor(Math.random()*1000)+1

function getCond(f:number,full=false):string {
  const s:[string,string] = f<.07?['FN','Factory New']:f<.15?['MW','Minimal Wear']:f<.38?['FT','Field-Tested']:f<.45?['WW','Well-Worn']:['BS','Battle-Scarred']
  return full?s[1]:s[0]
}
function condColor(f:number):string { return f<.07?'#4ade80':f<.15?'#22d3ee':f<.38?'#60a5fa':f<.45?'#fbbf24':'#f87171' }
function calcPrice(item:InvItem):number {
  const m = item.float<.07?1.8:item.float<.15?1.3:item.float<.38?1.0:item.float<.45?.8:.6
  return parseFloat((item.basePrice*m*(item.statTrak?1.3:1)).toFixed(2))
}
const fmtUSD = (n:number) => `$${n.toFixed(2)}`

let _uid = 0
function makeItem(rarity:RarityKey):InvItem {
  const pool = POOL.filter(p=>p.rarity===rarity)
  const base = pool[Math.floor(Math.random()*pool.length)] as PoolItem
  return {
    weapon:   base.weapon,
    skin:     base.skin,
    rarity:   base.rarity,
    gradient: base.gradient,
    basePrice:base.basePrice,
    wType:    base.wType,
    uid:      ++_uid,
    float:    rndFloat(),
    pattern:  rndPattern(),
    statTrak: rarity!=='knife' && Math.random()<.1,
  }
}
function genReel():InvItem[] {
  return Array.from({length:64},(_,i)=>{const it=makeItem(rollRarity());return {...it,uid:i}})
}

// ══════════ CONSTANTS ══════════
const IW=120,IG=8,IT=IW+IG,WI=48,CC=420,CPK=20

// ══════════ STATE ══════════
const tab         = ref<Tab>('open')
const showTut     = ref(true)
let   _tutShown   = false

const keys        = ref(0)
const farmClicks  = ref(0)
const farmFlash   = ref(false)
const farmBtnRef  = ref<HTMLElement|null>(null)
const particles   = ref<{id:number;x:number;y:number}[]>([])
let   _pid        = 0

const botCount    = ref(0)
let   _botInt: ReturnType<typeof setInterval>|null = null

const reelItems   = ref<InvItem[]>(genReel())
const spinning    = ref(false)
const showResult  = ref(false)
const curResult   = ref<InvItem|null>(null)
const tX          = ref(0)
const withTr      = ref(false)
const openCnt     = ref(0)
const knifeCnt    = ref(0)

const inventory   = ref<InvItem[]>([])
const balance     = ref(0)
const invFilter   = ref<RarityKey|'all'>('all')

const tuRarity    = ref<RarityKey>('mil-spec')
const tuSel       = ref<Set<number>>(new Set())
const tuResult    = ref<InvItem|null>(null)
const showTuRes   = ref(false)

const showcase    = ref<number[]>([])

// ══════════ COMPUTED ══════════
const farmPct       = computed(()=>(farmClicks.value/CPK)*100)
const tuCount       = computed(()=>TU_COUNT[tuRarity.value]??10)
const tuReady       = computed(()=>tuSel.value.size>=tuCount.value)
const tuInvItems    = computed(()=>inventory.value.filter(i=>i.rarity===tuRarity.value))
const showcaseItems = computed(()=>showcase.value.map(uid=>inventory.value.find(i=>i.uid===uid)).filter(Boolean) as InvItem[])
const showcaseSlots  = computed(()=>Array.from({length:5},(_,i)=>({idx:i, item: showcaseItems.value[i] ?? null})))
const filteredInv   = computed(()=>invFilter.value==='all'?inventory.value:inventory.value.filter(i=>i.rarity===invFilter.value))
const invCountBy    = (r:RarityKey)=>inventory.value.filter(i=>i.rarity===r).length

watch(tuRarity,()=>{ tuSel.value=new Set() })

// ══════════ ACTIONS ══════════
function doFarm(silent=false,x=56,y=40) {
  if (!silent) { const id=_pid++; particles.value.push({id,x,y}); setTimeout(()=>{particles.value=particles.value.filter(p=>p.id!==id)},600) }
  farmClicks.value++
  if (farmClicks.value>=CPK) {
    farmClicks.value=0; keys.value++
    if (!silent) { farmFlash.value=true; setTimeout(()=>{farmFlash.value=false},400) }
  }
}
function farmClick(e?:MouseEvent) {
  const r=farmBtnRef.value?.getBoundingClientRect()
  doFarm(false,r&&e?e.clientX-r.left:56,r&&e?e.clientY-r.top:40)
}
function onKey(e:KeyboardEvent) { if (!e.repeat&&(e.key==='f'||e.key==='F')) doFarm(false) }

async function openCase() {
  if (spinning.value||keys.value<=0) return
  keys.value--; showResult.value=false; spinning.value=true; openCnt.value++
  const winner=makeItem(rollRarity())
  const reel=genReel(); reel[WI]={...winner,uid:WI}
  reelItems.value=reel; withTr.value=false; tX.value=0
  await nextTick(); await new Promise(r=>setTimeout(r,50))
  playReelSpin()
  withTr.value=true; tX.value=-(WI*IT-CC+IT/2+(Math.floor(Math.random()*80)-40))
  setTimeout(()=>{ spinning.value=false; curResult.value=winner; showResult.value=true; playReveal(winner.rarity); if(winner.rarity==='knife')knifeCnt.value++; inventory.value.unshift(winner) },6600)
}

function toggleTuSel(uid:number) {
  const s=new Set(tuSel.value)
  if (s.has(uid)) { s.delete(uid) } else if (s.size<tuCount.value) { s.add(uid) }
  tuSel.value=s
}
function doTradeUp() {
  if (!tuReady.value) return
  const next=TU_NEXT[tuRarity.value]; if (!next) return
  const uids=[...tuSel.value]
  inventory.value=inventory.value.filter(i=>!uids.includes(i.uid))
  showcase.value=showcase.value.filter(u=>!uids.includes(u))
  tuSel.value=new Set()
  const res=makeItem(next); inventory.value.unshift(res); tuResult.value=res; showTuRes.value=true
}

function sellItem(uid:number) {
  const item=inventory.value.find(i=>i.uid===uid); if (!item) return
  balance.value=parseFloat((balance.value+calcPrice(item)).toFixed(2))
  inventory.value=inventory.value.filter(i=>i.uid!==uid)
  showcase.value=showcase.value.filter(u=>u!==uid)
}
function buyKey()  { if (balance.value>=2)  { balance.value=parseFloat((balance.value-2).toFixed(2));  keys.value++ } }
function buyBot()  { if (balance.value>=4)  { balance.value=parseFloat((balance.value-4).toFixed(2));  botCount.value++ } }

function toggleShowcase(uid:number) {
  if (showcase.value.includes(uid)) { showcase.value=showcase.value.filter(u=>u!==uid) } else if (showcase.value.length<5) { showcase.value.push(uid) }
}

function closeTut() { showTut.value=false; _tutShown=true }
// ══════════ AUDIO ENGINE (Web Audio API) ══════════
let _actx: AudioContext|null = null
function getCtx(): AudioContext {
  if (!_actx) _actx = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)()
  return _actx
}

function playReelSpin() {
  const ctx = getCtx()
  // White-noise layer (muffled reel hiss)
  const buf = ctx.createBuffer(1, ctx.sampleRate * 7, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.035
  const noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = buf
  const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = 0.9
  filt.frequency.setValueAtTime(800, ctx.currentTime)
  filt.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 6.4)
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(1, ctx.currentTime)
  noiseGain.gain.setValueAtTime(1, ctx.currentTime + 5.8)
  noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 6.5)
  noiseSrc.connect(filt); filt.connect(noiseGain); noiseGain.connect(ctx.destination); noiseSrc.start()

  // Click ticks — accelerate then decelerate like a real roulette
  const schedule = [
    ...Array(30).fill(0).map((_,i)=>0.05+i*0.004),  // fast start
    ...Array(20).fill(0).map((_,i)=>0.09+i*0.018),  // slow down
    ...Array(8).fill(0).map((_,i)=>0.45+i*0.18),    // final clunks
  ]
  let t = ctx.currentTime + 0.05
  schedule.forEach(gap => {
    t += gap
    if (t > ctx.currentTime + 6.3) return
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 160 + Math.random()*80
    const g = ctx.createGain(); g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.04)
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+0.05)
  })
}

function playReveal(rarity: RarityKey) {
  const ctx = getCtx()
  const freqMap: Record<RarityKey, number> = {
    'mil-spec': 440, 'restricted': 523, 'classified': 659, 'covert': 880, 'knife': 1047
  }
  const base = freqMap[rarity]
  // Rising chord arpeggio
  ;[0, 4, 7].forEach((semi, i) => {
    const f = base * Math.pow(2, semi / 12)
    const o = ctx.createOscillator(); o.type = i === 0 ? 'sine' : 'triangle'; o.frequency.value = f
    const g = ctx.createGain()
    const t0 = ctx.currentTime + i * 0.07
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.28, t0 + 0.025)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.4)
    o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 1.5)
  })
  // Knife: extra swoosh
  if (rarity === 'knife') {
    const t0 = ctx.currentTime + 0.3
    const o = ctx.createOscillator(); o.type = 'sine'
    o.frequency.setValueAtTime(200, t0); o.frequency.exponentialRampToValueAtTime(1600, t0 + 0.2)
    const g = ctx.createGain(); g.gain.setValueAtTime(0.45, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7)
    o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 0.75)
  }
}


onMounted(()=>{
  window.addEventListener('keydown',onKey)
  _botInt=setInterval(()=>{ for(let i=0;i<botCount.value;i++) doFarm(true) },1000)
  if (_tutShown) showTut.value=false
})
onUnmounted(()=>{ window.removeEventListener('keydown',onKey); if(_botInt)clearInterval(_botInt) })

// ══════════ SHORTHAND UTILS ══════════
const rc  = (r:RarityKey)=>RARITIES[r].color
const rl  = (r:RarityKey)=>RARITIES[r].label
const rs  = (r:RarityKey)=>RARITIES[r].shadow
const rbg = (r:RarityKey)=>RARITIES[r].bg
const dr  = (r:RarityKey)=>(RARITIES[r].weight/100).toFixed(2)

// ══════════ TABS ══════════
const TABS = computed<[Tab, string, string][]>(() => [
  ['open',      '📦', 'Mở Hòm'],
  ['inventory', '🎒', `Kho (${inventory.value.length})`],
  ['tradeup',   '🔄', 'Trade-up'],
  ['market',    '🏪', 'Chợ'],
])
</script>

<template>
  <div class="min-h-screen text-white relative overflow-x-hidden" style="background:#080c10;font-family:'Segoe UI',system-ui,sans-serif;">

    <!-- Ambient bg -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute inset-0 opacity-[0.035]" style="background-image:linear-gradient(#00e676 1px,transparent 1px),linear-gradient(90deg,#00e676 1px,transparent 1px);background-size:64px 64px;"></div>
      <div class="absolute top-[-8%] left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full opacity-[0.08]" style="background:radial-gradient(ellipse,#00e676 0%,transparent 70%);filter:blur(60px);"></div>
    </div>

    <!-- Header -->
    <header class="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3" style="border-bottom:1px solid rgba(255,255,255,.07);background:rgba(8,12,16,.9);backdrop-filter:blur(12px);">
      <RouterLink to="/" class="text-xs transition-colors" style="color:rgba(255,255,255,.4);" onmouseover="this.style.color='#00e676'" onmouseout="this.style.color='rgba(255,255,255,.4)'">← Trang chủ</RouterLink>
      <div class="text-center">
        <div class="text-[10px] tracking-[.3em] uppercase" style="color:#00e676;">CS:GO Simulator</div>
        <div class="text-base font-bold tracking-widest uppercase">Gamma Case</div>
      </div>
      <div class="text-xs text-right" style="color:rgba(255,255,255,.4);">
        <div>Mở: <strong class="text-white">{{openCnt}}</strong></div>
        <div v-if="knifeCnt" style="color:#e4ae39;">🔪 {{knifeCnt}} dao</div>
      </div>
    </header>

    <!-- Tab bar -->
    <nav class="sticky top-0 z-20 flex" style="background:rgba(8,12,16,.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.07);">
      <button v-for="[t,icon,label] in TABS"
              :key="t" @click="tab=t"
              class="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
              :style="{ color:tab===t?'#00e676':'rgba(255,255,255,.35)', borderBottom:tab===t?'2px solid #00e676':'2px solid transparent' }">
        <span class="text-base leading-none">{{icon}}</span>
        <span class="hidden sm:block">{{label}}</span>
      </button>
    </nav>

    <main class="relative z-10 max-w-5xl mx-auto px-3 sm:px-4 py-6">

      <!-- ══════════ TAB: OPEN ══════════ -->
      <div v-show="tab==='open'">

        <!-- Case info -->
        <div class="flex flex-col sm:flex-row items-center gap-4 mb-6 p-4 rounded-xl" style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);">
          <div class="relative flex-shrink-0">
            <div class="w-24 h-24 rounded-xl flex items-center justify-center text-4xl" style="background:linear-gradient(135deg,#0d2010,#1a4020);border:2px solid rgba(0,230,118,.35);box-shadow:0 0 25px rgba(0,230,118,.12);">📦</div>
            <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-2 py-0.5 rounded-full text-black" style="background:#00e676;">GAMMA CASE</div>
          </div>
          <div class="text-center sm:text-left">
            <h1 class="text-lg font-bold mb-1">Gamma Case</h1>
            <p class="text-xs mb-2" style="color:rgba(255,255,255,.45);">
              Nhấn 🔑 hoặc phím <kbd class="px-1 py-0.5 rounded text-[10px] font-bold" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);">F</kbd> để farm key (20 lần = 1 key)
            </p>
            <div class="flex flex-wrap gap-1.5 justify-center sm:justify-start text-[10px]">
              <span v-for="[r] in Object.entries(RARITIES)" :key="r" class="px-2 py-0.5 rounded font-bold" :style="{background:rbg(r as RarityKey),color:rc(r as RarityKey)}">{{dr(r as RarityKey)}}% {{rl(r as RarityKey)}}</span>
            </div>
          </div>
        </div>

        <!-- Farm zone -->
        <div class="mb-6 p-4 rounded-xl" style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);">
          <div class="flex flex-col sm:flex-row items-center gap-5">
            <div class="relative flex-shrink-0">
              <button ref="farmBtnRef" @mousedown.left="farmClick($event)" :class="farmFlash?'key-flash':''"
                class="relative w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-1 select-none overflow-visible active:scale-90 transition-transform duration-75"
                style="background:linear-gradient(135deg,#1a1a2e,#2a2a4a);border:2px solid rgba(255,200,0,.35);box-shadow:0 0 18px rgba(255,200,0,.1);cursor:pointer;">
                <span v-for="p in particles" :key="p.id" class="particle absolute" :style="{left:p.x+'px',top:p.y+'px'}">+1</span>
                <span class="text-4xl leading-none" style="filter:drop-shadow(0 0 8px rgba(255,200,0,.5))">🔑</span>
                <span class="text-[9px] font-bold uppercase tracking-wider" style="color:rgba(255,255,255,.45)">Click / F</span>
              </button>
            </div>
            <div class="flex-1 w-full">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] uppercase tracking-widest font-bold" style="color:rgba(255,255,255,.4)">Tiến độ farm ({{farmClicks}}/{{CPK}})</span>
                <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" :class="farmFlash?'key-flash':''" style="background:rgba(255,200,0,.12);border:1px solid rgba(255,200,0,.3);">
                  <span>🔑</span><span class="font-bold text-sm" style="color:#ffd700">{{keys}}</span><span class="text-[10px]" style="color:rgba(255,200,0,.6)">key</span>
                </div>
              </div>
              <div class="w-full rounded-full overflow-hidden mb-2" style="height:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);">
                <div class="h-full rounded-full transition-all duration-100" :style="{width:farmPct+'%',background:'linear-gradient(90deg,#4b69ff,#00e676)',boxShadow:farmPct>0?'0 0 6px rgba(0,230,118,.5)':'none'}"></div>
              </div>
              <div class="flex gap-1 flex-wrap">
                <div v-for="i in CPK" :key="i" class="rounded-sm transition-all duration-100"
                     :style="{width:'13px',height:'13px',background:i<=farmClicks?'#00e676':'rgba(255,255,255,.08)',boxShadow:i<=farmClicks?'0 0 4px rgba(0,230,118,.5)':'none',transform:i===farmClicks+1?'scale(1.25)':'scale(1)'}"></div>
              </div>
              <p class="text-[10px] mt-1.5" style="color:rgba(255,255,255,.25)">Còn <strong class="text-white">{{CPK-farmClicks}}</strong> lần nữa để nhận key</p>
              <div v-if="botCount>0" class="mt-2 text-[10px]" style="color:rgba(255,200,0,.5)">🤖 {{botCount}} bot đang tự động farm</div>
            </div>
          </div>
        </div>

        <!-- Roulette -->
        <div class="relative mb-5 select-none">
          <div class="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none" style="background:linear-gradient(to right,#080c10,transparent)"></div>
          <div class="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none" style="background:linear-gradient(to left,#080c10,transparent)"></div>
          <div class="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center" style="width:2px">
            <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:13px solid #e4ae39;"></div>
            <div class="flex-1" style="width:2px;background:rgba(228,174,57,.5)"></div>
            <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:13px solid #e4ae39;"></div>
          </div>
          <div class="overflow-hidden rounded-lg" style="height:170px;background:#0d1117;border:1px solid rgba(255,255,255,.08);">
            <div class="flex items-center h-full"
                 :style="{transform:`translateX(${tX}px)`,transition:withTr?'transform 6.5s cubic-bezier(0.13,0,0.08,1)':'none',width:`${64*IT}px`,paddingLeft:'4px',gap:IG+'px'}">
              <div v-for="(item,i) in reelItems" :key="i" class="flex-shrink-0 rounded flex flex-col overflow-hidden"
                   :style="{width:IW+'px',height:'150px',border:`2px solid ${rc(item.rarity)}`,boxShadow:`0 0 8px ${rs(item.rarity)}`}">
                <div class="flex-1 relative flex items-center justify-center" :style="{background:item.gradient}">
                  <div class="w-14 flex items-center justify-center" :style="{color:rc(item.rarity)}" v-html="WSVG[item.wType]"></div>
                  <span v-if="item.statTrak" class="absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded leading-none" style="background:rgba(200,110,0,.85);color:#fff">ST™</span>
                </div>
                <div class="px-1 py-1 text-center" :style="{background:'rgba(0,0,0,.7)',borderTop:`1px solid ${rc(item.rarity)}33`}">
                  <div class="text-white font-semibold truncate" style="font-size:8px">{{item.weapon}}</div>
                  <div class="truncate" :style="{color:rc(item.rarity),fontSize:'7px'}">{{item.skin}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Open button -->
        <div class="flex flex-col items-center gap-2 mb-8">
          <button @click="openCase" :disabled="spinning||keys<=0"
                  class="px-10 py-3 text-sm font-bold uppercase tracking-widest rounded transition-all duration-200"
                  :class="(spinning||keys<=0)?'opacity-40 cursor-not-allowed':'hover:scale-105 active:scale-95'"
                  :style="{background:keys>0&&!spinning?'linear-gradient(135deg,#00c853,#00e676)':'rgba(255,255,255,.08)',color:keys>0&&!spinning?'#000':'rgba(255,255,255,.4)',boxShadow:keys>0&&!spinning?'0 0 24px rgba(0,230,118,.4)':'none'}">
            <span v-if="spinning">↻ Đang mở...</span>
            <span v-else-if="keys>0">🔑 Mở Hòm ×{{keys}}</span>
            <span v-else>🔒 Cần key để mở hòm</span>
          </button>
          <p v-if="keys<=0&&!spinning" class="text-[11px] animate-pulse" style="color:rgba(255,200,0,.6)">Nhấn 🔑 hoặc bấm F để farm key</p>
        </div>

        <!-- Drop rates -->
        <div class="rounded-xl overflow-hidden" style="border:1px solid rgba(255,255,255,.08);">
          <div class="px-4 py-2 text-[10px] font-bold uppercase tracking-widest" style="background:rgba(255,255,255,.04);color:rgba(255,255,255,.4);border-bottom:1px solid rgba(255,255,255,.07)">Tỷ lệ rơi</div>
          <div class="grid grid-cols-5">
            <div v-for="[r] in Object.entries(RARITIES)" :key="r" class="p-2.5 text-center" style="border-right:1px solid rgba(255,255,255,.05)">
              <div class="text-[9px] font-bold mb-1 uppercase" :style="{color:rc(r as RarityKey)}">{{rl(r as RarityKey)}}</div>
              <div class="text-sm font-mono font-bold text-white">{{dr(r as RarityKey)}}%</div>
            </div>
          </div>
        </div>
        <!-- Showcase -->
        <div class="mt-6 rounded-xl overflow-hidden" style="border:1px solid rgba(255,255,255,.08);">
          <div class="px-4 py-2 text-[10px] font-bold uppercase tracking-widest" style="background:rgba(255,255,255,.04);color:rgba(255,255,255,.4);border-bottom:1px solid rgba(255,255,255,.07)">🏆 Showcase — Tối đa 5 skin yêu thích (pin từ tab Kho đồ)</div>
          <div class="p-3">
            <div class="grid grid-cols-5 gap-2 mb-3">
              <div v-for="slot in showcaseSlots" :key="slot.idx" class="rounded-lg overflow-hidden relative" style="aspect-ratio:1">
                <template v-if="slot.item">
                  <div class="h-full flex flex-col" :style="{border:`2px solid ${rc(slot.item.rarity)}`,boxShadow:`0 0 14px ${rs(slot.item.rarity)}`,borderRadius:'0.5rem',overflow:'hidden'}">
                    <div class="flex-1 flex items-center justify-center" :style="{background:slot.item.gradient}">
                      <div class="w-3/4" :style="{color:rc(slot.item.rarity)}" v-html="WSVG[slot.item.wType]"></div>
                    </div>
                    <div class="p-1 text-center text-[8px]" :style="{background:'rgba(0,0,0,.85)',borderTop:`1px solid ${rc(slot.item.rarity)}33`}">
                      <div class="text-white font-bold truncate">{{slot.item.weapon}}</div>
                      <div class="truncate" :style="{color:rc(slot.item.rarity)}">{{slot.item.skin}}</div>
                      <div class="font-mono mt-0.5 text-[7px]" :style="{color:condColor(slot.item.float)}">{{getCond(slot.item.float)}} · {{slot.item.float.toFixed(6)}}</div>
                    </div>
                  </div>
                  <button @click="toggleShowcase(slot.item.uid)" class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style="background:rgba(0,0,0,.7);color:rgba(255,255,255,.6)">✕</button>
                </template>
                <template v-else>
                  <div class="h-full flex items-center justify-center text-xl rounded-lg" style="border:2px dashed rgba(255,255,255,.1);color:rgba(255,255,255,.12)">+</div>
                </template>
              </div>
            </div>
            <p v-if="showcaseItems.length===0" class="text-center text-[10px] py-1" style="color:rgba(255,255,255,.2)">Chưa có skin nào — pin skin từ tab 🎒 Kho đồ</p>
          </div>
        </div>
      </div>

      <!-- ══════════ TAB: INVENTORY ══════════ -->
      <div v-show="tab==='inventory'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold">Kho đồ <span class="text-sm font-normal" style="color:rgba(255,255,255,.4)">({{inventory.length}} vật phẩm)</span></h2>
          <div class="flex gap-1 flex-wrap">
            <button @click="invFilter='all'" class="px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors" :style="{background:invFilter==='all'?'rgba(255,255,255,.15)':'rgba(255,255,255,.05)',color:invFilter==='all'?'#fff':'rgba(255,255,255,.4)'}">Tất cả</button>
            <button v-for="r in (['mil-spec','restricted','classified','covert','knife'] as RarityKey[])" :key="r"
                    @click="invFilter=r" class="px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors"
                    :style="{background:invFilter===r?rbg(r):'rgba(255,255,255,.05)',color:invFilter===r?rc(r):'rgba(255,255,255,.35)'}">
              {{rl(r)}} {{invCountBy(r)?'('+invCountBy(r)+')':''}}
            </button>
          </div>
        </div>

        <div v-if="filteredInv.length===0" class="text-center py-16" style="color:rgba(255,255,255,.25)">
          <div class="text-4xl mb-3">📭</div>
          <div>Kho trống — hãy mở hòm để nhận skin!</div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <div v-for="item in filteredInv" :key="item.uid" class="rounded-lg overflow-hidden flex flex-col transition-transform hover:scale-[1.02]"
               :style="{border:`2px solid ${rc(item.rarity)}`,boxShadow:`0 0 10px ${rs(item.rarity)}`}">
            <!-- Icon -->
            <div class="relative h-16 flex items-center justify-center" :style="{background:item.gradient}">
              <div class="w-12 flex items-center justify-center" :style="{color:rc(item.rarity)}" v-html="WSVG[item.wType]"></div>
              <span v-if="item.statTrak" class="absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded leading-none" style="background:rgba(200,110,0,.85);color:#fff">ST™</span>
              <span v-if="showcase.includes(item.uid)" class="absolute top-1 right-1 text-[10px]">📌</span>
            </div>
            <!-- Info -->
            <div class="p-2 flex-1 flex flex-col gap-1 text-[10px]" style="background:rgba(0,0,0,.7)">
              <div class="font-bold text-white truncate leading-tight">{{item.weapon}}</div>
              <div class="truncate leading-tight" :style="{color:rc(item.rarity)}">{{item.skin}}</div>
              <div class="flex items-center gap-1 flex-wrap">
                <span class="px-1 py-0.5 rounded font-bold text-[9px]" :style="{background:condColor(item.float)+'22',color:condColor(item.float)}">{{getCond(item.float)}}</span>
                <span class="font-mono text-[8px]" style="color:rgba(255,255,255,.35)">{{item.float.toFixed(10)}}</span>
              </div>
              <div style="color:rgba(255,255,255,.3)">Pattern: #{{item.pattern}}</div>
              <div class="font-bold mt-auto" :style="{color:rc(item.rarity)}">{{fmtUSD(calcPrice(item))}}</div>
            </div>
            <!-- Actions -->
            <div class="flex gap-1 p-1.5" style="background:rgba(0,0,0,.5);border-top:1px solid rgba(255,255,255,.06)">
              <button @click="toggleShowcase(item.uid)"
                      class="flex-1 py-1 rounded text-[9px] font-bold transition-opacity hover:opacity-75"
                      :style="{background:showcase.includes(item.uid)?'rgba(255,200,0,.2)':'rgba(255,255,255,.08)',color:showcase.includes(item.uid)?'#ffd700':'rgba(255,255,255,.5)'}">
                {{showcase.includes(item.uid)?'📌 Đang trưng':'📌 Showcase'}}
              </button>
              <button @click="sellItem(item.uid)" class="flex-1 py-1 rounded text-[9px] font-bold transition-opacity hover:opacity-75" style="background:rgba(0,200,80,.15);color:#00e676">
                💰 Bán
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════ TAB: TRADE-UP ══════════ -->
      <div v-show="tab==='tradeup'">
        <div class="mb-5">
          <h2 class="font-bold mb-1">Trade-up Contract</h2>
          <p class="text-xs" style="color:rgba(255,255,255,.4)">Gộp nhiều skin cùng hạng để đổi lấy 1 skin hạng trên. Covert chỉ cần 5 skin.</p>
        </div>

        <!-- Rarity selector -->
        <div class="flex gap-2 mb-5 flex-wrap">
          <button v-for="r in (['mil-spec','restricted','classified','covert'] as RarityKey[])" :key="r"
                  @click="tuRarity=r" class="flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all"
                  :style="{background:tuRarity===r?rbg(r):'rgba(255,255,255,.05)',color:tuRarity===r?rc(r):'rgba(255,255,255,.35)',border:`1px solid ${tuRarity===r?rc(r):'rgba(255,255,255,.08)'}`}">
            {{rl(r)}}
            <span class="ml-1 opacity-70">({{invCountBy(r)}})</span>
            → <span :style="{color:rc(TU_NEXT[r]!)}">{{rl(TU_NEXT[r]!)}}</span>
          </button>
        </div>

        <!-- Selection info -->
        <div class="flex items-center justify-between mb-3 p-3 rounded-lg" style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)">
          <div>
            <div class="text-sm font-bold" :style="{color:rc(tuRarity)}">{{tuSel.size}}/{{tuCount}} đã chọn</div>
            <div class="text-[10px]" style="color:rgba(255,255,255,.35)">Chọn đủ {{tuCount}} skin {{rl(tuRarity)}} để trade-up</div>
          </div>
          <button @click="doTradeUp" :disabled="!tuReady"
                  class="px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all"
                  :class="tuReady?'hover:opacity-85 active:scale-95':'opacity-40 cursor-not-allowed'"
                  :style="{background:tuReady?rc(tuRarity):'rgba(255,255,255,.08)',color:tuReady?'#000':'rgba(255,255,255,.4)'}">
            🔄 Trade Up
          </button>
        </div>

        <div v-if="tuInvItems.length===0" class="text-center py-12" style="color:rgba(255,255,255,.25)">
          <div class="text-3xl mb-2">🎒</div>
          <div>Không có skin {{rl(tuRarity)}} trong kho</div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <div v-for="item in tuInvItems" :key="item.uid"
               @click="toggleTuSel(item.uid)" class="rounded-lg overflow-hidden cursor-pointer transition-all"
               :style="{border:`2px solid ${tuSel.has(item.uid)?rc(item.rarity):'rgba(255,255,255,.12)'}`,boxShadow:tuSel.has(item.uid)?`0 0 14px ${rs(item.rarity)}`:'none',opacity:!tuSel.has(item.uid)&&tuSel.size>=tuCount?'0.4':'1'}">
            <div class="relative h-16 flex items-center justify-center" :style="{background:item.gradient}">
              <div class="w-12" :style="{color:rc(item.rarity)}" v-html="WSVG[item.wType]"></div>
              <div v-if="tuSel.has(item.uid)" class="absolute inset-0 flex items-center justify-center" style="background:rgba(0,0,0,.4)">
                <span class="text-2xl">✓</span>
              </div>
              <span v-if="item.statTrak" class="absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded" style="background:rgba(200,110,0,.85);color:#fff">ST™</span>
            </div>
            <div class="p-2 text-[10px]" style="background:rgba(0,0,0,.7)">
              <div class="font-bold text-white truncate">{{item.weapon}}</div>
              <div class="truncate" :style="{color:rc(item.rarity)}">{{item.skin}}</div>
              <div class="flex items-center gap-1 mt-1">
                <span class="px-1 py-0.5 rounded text-[8px] font-bold" :style="{background:condColor(item.float)+'22',color:condColor(item.float)}">{{getCond(item.float)}}</span>
                <span class="font-mono text-[8px]" style="color:rgba(255,255,255,.3)">{{item.float.toFixed(6)}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════ TAB: MARKETPLACE ══════════ -->
      <div v-show="tab==='market'">
        <!-- Balance -->
        <div class="flex items-center justify-between mb-6 p-4 rounded-xl" style="background:rgba(0,200,80,.08);border:1px solid rgba(0,200,80,.2)">
          <div>
            <div class="text-[10px] uppercase tracking-widest font-bold mb-1" style="color:rgba(0,230,118,.6)">Số dư</div>
            <div class="text-3xl font-bold" style="color:#00e676">{{fmtUSD(balance)}}</div>
          </div>
          <div class="text-right text-xs" style="color:rgba(255,255,255,.35)">
            <div>🔑 {{keys}} key</div>
            <div>🤖 {{botCount}} bot</div>
          </div>
        </div>

        <!-- Shop -->
        <div class="mb-6">
          <h3 class="text-sm font-bold mb-3 uppercase tracking-wider" style="color:rgba(255,255,255,.5)">🛒 Mua vật phẩm</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Key -->
            <div class="p-4 rounded-xl flex items-center gap-4" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,200,0,.2)">
              <span class="text-3xl">🔑</span>
              <div class="flex-1">
                <div class="font-bold text-white">Key</div>
                <div class="text-xs" style="color:rgba(255,255,255,.4)">Dùng để mở Gamma Case</div>
                <div class="text-sm font-bold mt-1" style="color:#ffd700">$2.00 / key</div>
              </div>
              <button @click="buyKey" :disabled="balance<2" class="px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all" :class="balance>=2?'hover:opacity-85 active:scale-95':'opacity-40 cursor-not-allowed'" style="background:rgba(255,200,0,.2);color:#ffd700;border:1px solid rgba(255,200,0,.3)">Mua</button>
            </div>
            <!-- Bot -->
            <div class="p-4 rounded-xl flex items-center gap-4" style="background:rgba(255,255,255,.04);border:1px solid rgba(75,105,255,.2)">
              <span class="text-3xl">🤖</span>
              <div class="flex-1">
                <div class="font-bold text-white">Autoclick Bot</div>
                <div class="text-xs" style="color:rgba(255,255,255,.4)">1 click/giây, cộng dồn (có {{botCount}})</div>
                <div class="text-sm font-bold mt-1" style="color:#4b69ff">$4.00 / bot</div>
              </div>
              <button @click="buyBot" :disabled="balance<4" class="px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all" :class="balance>=4?'hover:opacity-85 active:scale-95':'opacity-40 cursor-not-allowed'" style="background:rgba(75,105,255,.2);color:#4b69ff;border:1px solid rgba(75,105,255,.3)">Mua</button>
            </div>
          </div>
        </div>

        <!-- Sell -->
        <div>
          <h3 class="text-sm font-bold mb-3 uppercase tracking-wider" style="color:rgba(255,255,255,.5)">💰 Bán skin ({{inventory.length}} trong kho)</h3>
          <div v-if="inventory.length===0" class="text-center py-10" style="color:rgba(255,255,255,.25)">
            <div>Kho trống — mở hòm để có skin bán!</div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div v-for="item in inventory" :key="item.uid" class="flex items-center gap-3 p-3 rounded-lg" style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)">
              <div class="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" :style="{background:item.gradient,border:`1px solid ${rc(item.rarity)}`}">
                <div class="w-8" :style="{color:rc(item.rarity)}" v-html="WSVG[item.wType]"></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1">
                  <span v-if="item.statTrak" class="text-[8px] font-bold px-1 py-0.5 rounded leading-none" style="background:rgba(200,110,0,.85);color:#fff">ST™</span>
                  <span class="text-xs font-bold text-white truncate">{{item.weapon}} | {{item.skin}}</span>
                </div>
                <div class="flex items-center gap-2 text-[10px]">
                  <span class="px-1 py-0.5 rounded font-bold" :style="{background:condColor(item.float)+'22',color:condColor(item.float)}">{{getCond(item.float,true)}}</span>
                  <span style="color:rgba(255,255,255,.35)">P: #{{item.pattern}}</span>
                </div>
              </div>
              <button @click="sellItem(item.uid)" class="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-85 active:scale-95" style="background:rgba(0,200,80,.15);color:#00e676;border:1px solid rgba(0,200,80,.2)">
                {{fmtUSD(calcPrice(item))}}
              </button>
            </div>
          </div>
        </div>
      </div>


    </main>

    <!-- ══════════ TUTORIAL MODAL ══════════ -->
    <Transition name="fade">
      <div v-if="showTut" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,.8);backdrop-filter:blur(8px);" @click.self="closeTut">
        <div class="w-full max-w-md rounded-2xl overflow-hidden" style="background:#0d1117;border:1px solid rgba(0,230,118,.3);box-shadow:0 0 60px rgba(0,230,118,.15)">
          <div class="h-1" style="background:linear-gradient(90deg,transparent,#00e676,transparent)"></div>
          <div class="p-6">
            <div class="text-center mb-5">
              <div class="text-3xl mb-2">📦</div>
              <h2 class="text-lg font-bold text-white">Gamma Case Simulator</h2>
              <p class="text-xs mt-1" style="color:rgba(255,255,255,.4)">Hướng dẫn nhanh</p>
            </div>
            <div class="space-y-3">
              <div v-for="[icon,title,desc] in [
                ['🔑','Farm Key','Nhấn nút 🔑 hoặc bấm phím F — đủ 20 lần nhận 1 key'],
                ['📦','Mở Hòm','Dùng key để mở hòm, tỷ lệ chính xác theo CS:GO gốc'],
                ['🎒','Kho đồ','Xem toàn bộ skin đã mở, ghim vào Showcase hoặc bán'],
                ['🔄','Trade-up','10 skin cùng hạng → 1 skin hạng trên (Covert: 5 skin → Knife)'],
                ['🏪','Marketplace','Bán skin lấy tiền · Mua Key ($2) · Mua Bot autoclick ($4/bot)'],
                ['🏆','Showcase','Pin skin từ Kho đồ → hiển thị ở cuối tab Mở Hòm'],
              ]" :key="title" class="flex items-start gap-3 p-3 rounded-lg" style="background:rgba(255,255,255,.03)">
                <span class="text-xl flex-shrink-0 mt-0.5">{{icon}}</span>
                <div>
                  <div class="text-sm font-bold text-white">{{title}}</div>
                  <div class="text-xs" style="color:rgba(255,255,255,.45)">{{desc}}</div>
                </div>
              </div>
            </div>
            <button @click="closeTut" class="mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-85" style="background:linear-gradient(135deg,#00c853,#00e676)">
              Bắt đầu chơi!
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ══════════ RESULT MODAL (Case opening) ══════════ -->
    <Transition name="fade">
      <div v-if="showResult&&curResult" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,.8);backdrop-filter:blur(8px);" @click="showResult=false">
        <div class="w-full max-w-xs rounded-2xl overflow-hidden text-center" :style="{border:`2px solid ${rc(curResult.rarity)}`,boxShadow:`0 0 60px ${rs(curResult.rarity)}`,background:'#0d1117'}" @click.stop>
          <div class="h-1" :style="{background:`linear-gradient(90deg,transparent,${rc(curResult.rarity)},transparent)`}"></div>
          <div class="px-5 py-5">
            <div class="text-[10px] tracking-[.3em] uppercase mb-3 font-bold" :style="{color:rc(curResult.rarity)}">{{rl(curResult.rarity)}}</div>
            <div class="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center mb-3" :style="{background:curResult.gradient,border:`2px solid ${rc(curResult.rarity)}`,boxShadow:`0 0 25px ${rs(curResult.rarity)}`}">
              <div class="w-20" :style="{color:rc(curResult.rarity)}" v-html="WSVG[curResult.wType]"></div>
            </div>
            <div v-if="curResult.statTrak" class="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-2" style="background:rgba(200,110,0,.85);color:#fff">StatTrak™</div>
            <div class="text-xl font-bold text-white mb-0.5">{{curResult.weapon}}</div>
            <div class="text-sm mb-2" :style="{color:rc(curResult.rarity)}">{{curResult.skin}}</div>
            <div class="text-[10px] mb-1" :style="{color:condColor(curResult.float)}">{{getCond(curResult.float,true)}} · {{curResult.float.toFixed(10)}}</div>
            <div class="text-[10px] mb-4" style="color:rgba(255,255,255,.35)">Pattern: #{{curResult.pattern}} · {{fmtUSD(calcPrice(curResult))}}</div>
            <div class="flex gap-2">
              <button @click="showResult=false;keys>0&&openCase()" :disabled="keys<=0" class="flex-1 py-2 rounded-lg text-xs font-bold text-black transition-opacity" :class="keys>0?'hover:opacity-85':'opacity-40 cursor-not-allowed'" :style="{background:rc(curResult.rarity)}">{{keys>0?`Mở tiếp (${keys})`:'Hết key'}}</button>
              <button @click="showResult=false" class="flex-1 py-2 rounded-lg text-xs font-bold transition-colors" style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.7)">Đóng</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ══════════ TRADE-UP RESULT MODAL ══════════ -->
    <Transition name="fade">
      <div v-if="showTuRes&&tuResult" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,.8);backdrop-filter:blur(8px);" @click="showTuRes=false">
        <div class="w-full max-w-xs rounded-2xl overflow-hidden text-center" :style="{border:`2px solid ${rc(tuResult.rarity)}`,boxShadow:`0 0 60px ${rs(tuResult.rarity)}`,background:'#0d1117'}" @click.stop>
          <div class="h-1" :style="{background:`linear-gradient(90deg,transparent,${rc(tuResult.rarity)},transparent)`}"></div>
          <div class="px-5 py-5">
            <div class="text-[10px] tracking-[.3em] uppercase mb-1 font-bold" style="color:rgba(255,255,255,.4)">🔄 Kết quả Trade-up</div>
            <div class="text-[10px] tracking-[.3em] uppercase mb-3 font-bold" :style="{color:rc(tuResult.rarity)}">{{rl(tuResult.rarity)}}</div>
            <div class="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center mb-3" :style="{background:tuResult.gradient,border:`2px solid ${rc(tuResult.rarity)}`,boxShadow:`0 0 25px ${rs(tuResult.rarity)}`}">
              <div class="w-20" :style="{color:rc(tuResult.rarity)}" v-html="WSVG[tuResult.wType]"></div>
            </div>
            <div v-if="tuResult.statTrak" class="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-2" style="background:rgba(200,110,0,.85);color:#fff">StatTrak™</div>
            <div class="text-xl font-bold text-white mb-0.5">{{tuResult.weapon}}</div>
            <div class="text-sm mb-2" :style="{color:rc(tuResult.rarity)}">{{tuResult.skin}}</div>
            <div class="text-[10px] mb-1" :style="{color:condColor(tuResult.float)}">{{getCond(tuResult.float,true)}} · {{tuResult.float.toFixed(10)}}</div>
            <div class="text-[10px] mb-4" style="color:rgba(255,255,255,.35)">Pattern: #{{tuResult.pattern}} · {{fmtUSD(calcPrice(tuResult))}}</div>
            <button @click="showTuRes=false" class="w-full py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-85" :style="{background:rc(tuResult.rarity),color:'#000'}">Tuyệt!</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-enter-active,.fade-leave-active { transition: opacity .25s ease; }
.fade-enter-from,.fade-leave-to       { opacity: 0; }

@keyframes keyFlash {
  0%   { box-shadow: 0 0 0 rgba(255,215,0,0); }
  40%  { box-shadow: 0 0 30px rgba(255,215,0,.9), 0 0 60px rgba(255,215,0,.3); }
  100% { box-shadow: 0 0 0 rgba(255,215,0,0); }
}
.key-flash { animation: keyFlash .4s ease-out; }

@keyframes floatUp {
  0%   { opacity:1; transform:translate(-50%,-50%) translateY(0); }
  100% { opacity:0; transform:translate(-50%,-50%) translateY(-36px); }
}
.particle {
  position:absolute; animation:floatUp .6s ease-out forwards;
  transform:translate(-50%,-50%); font-size:11px; font-weight:700;
  color:#00e676; pointer-events:none; text-shadow:0 0 6px rgba(0,230,118,.8); white-space:nowrap;
}
</style>
