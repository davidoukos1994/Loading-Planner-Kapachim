const TANKER_TONS = 24.5;

const displayOrder = ['Z1','Z2','Z3','D1','D2','D3'];

const defaultTanks = [
  {id:'Z1', code:'D-07-01', maxM:8.65, m:8.10, tnm:11.63, order:'', tankers:0, targets:'', fillOrder1:'', fillTarget1:'', fillOrder2:'', fillTarget2:''},
  {id:'Z2', code:'D-07-02', maxM:7.50, m:7.50, tnm:13.54, order:'', tankers:0, targets:'', fillOrder1:'', fillTarget1:'', fillOrder2:'', fillTarget2:''},
  {id:'Z3', code:'D-07-03', maxM:7.50, m:0.86, tnm:13.54, order:1, tankers:0, targets:'', fillOrder1:'', fillTarget1:'', fillOrder2:'', fillTarget2:''},
  {id:'D1', code:'D-07-04', maxM:6.20, m:0.00, tnm:11.63, order:4, tankers:0, targets:'', fillOrder1:'', fillTarget1:'', fillOrder2:'', fillTarget2:''},
  {id:'D2', code:'D-07-05', maxM:6.20, m:4.12, tnm:11.63, order:2, tankers:0, targets:'', fillOrder1:'', fillTarget1:'', fillOrder2:'', fillTarget2:''},
  {id:'D3', code:'D-07-06', maxM:6.20, m:0.18, tnm:11.63, order:3, tankers:0, targets:'', fillOrder1:'', fillTarget1:'', fillOrder2:'', fillTarget2:''},
];
const STORAGE_KEY = 'hypo-v8-tankers-targets';
const OLD_KEYS = ['hypo-v6-total-fixed'];
let state = load() || {production:'6824', startTime:toLocalInput(new Date()), globalTankers:0, tanks:structuredClone(defaultTanks)};
state = normalizeState(state);


const QUICK_STORAGE_KEY = 'hypo-v42-quick-planner';
let quickState = loadQuickState();

function loadQuickState(){
  try{
    const saved = JSON.parse(localStorage.getItem(QUICK_STORAGE_KEY) || 'null');
    if(saved && Array.isArray(saved.rows)) return saved;
  }catch(e){}
  return {rows:[
    {tankId:'Z1', level:'', target:'', orders:'1-3'},
    {tankId:'Z2', level:'', target:'', orders:'2'}
  ]};
}
function saveQuickState(){ localStorage.setItem(QUICK_STORAGE_KEY, JSON.stringify(quickState)); }
function tankById(id){ return state.tanks.find(t=>t.id===id) || state.tanks[0]; }
function parseQuickOrders(value){
  return [...new Set(String(value ?? '').split(/[^0-9]+/).map(Number).filter(n=>Number.isFinite(n)&&n>0))].sort((a,b)=>a-b);
}
function ensureQuickLevels(){
  quickState.rows.forEach(row=>{
    const t=tankById(row.tankId);
    if(row.level==='' || row.level===null || row.level===undefined) row.level=String(t?.m ?? 0);
    if(row.target==='' || row.target===null || row.target===undefined) row.target=String(t?.maxM ?? 0);
  });
}
function renderQuick(){
  const root=qs('quickRows');
  if(!root) return;
  ensureQuickLevels();
  root.innerHTML=quickState.rows.map((row,i)=>{
    const t=tankById(row.tankId);
    return `<div class="quick-row">
      <label>Δεξαμενή
        <select data-quick-i="${i}" data-quick-k="tankId">${displayOrder.map(id=>`<option value="${id}" ${id===row.tankId?'selected':''}>${id}</option>`).join('')}</select>
      </label>
      <label>Στάθμη (m)
        <input class="quick-level" data-quick-i="${i}" data-quick-k="level" type="text" inputmode="decimal" value="${row.level}" placeholder="${t?.m ?? 0}">
      </label>
      <label>Στόχος (m)
        <input class="quick-target" data-quick-i="${i}" data-quick-k="target" type="text" inputmode="decimal" value="${row.target ?? t?.maxM ?? ''}" placeholder="${t?.maxM ?? 0}">
      </label>
      <label>Σειρές
        <input data-quick-i="${i}" data-quick-k="orders" type="text" inputmode="text" autocapitalize="off" spellcheck="false" value="${row.orders}" placeholder="π.χ. 1,3">
      </label>
      <button class="quick-remove" data-quick-remove="${i}" type="button" title="Αφαίρεση">×</button>
    </div>`;
  }).join('');
  root.querySelectorAll('[data-quick-i]').forEach(el=>el.addEventListener('input',e=>{
    const i=Number(e.target.dataset.quickI), k=e.target.dataset.quickK;
    quickState.rows[i][k]=e.target.value;
    if(k==='tankId'){
      const selected=tankById(e.target.value);
      quickState.rows[i].level=String(selected?.m ?? 0);
      quickState.rows[i].target=String(selected?.maxM ?? 0);
    }
    saveQuickState();
    if(k==='tankId') renderQuick();
  }));
  root.querySelectorAll('[data-quick-remove]').forEach(btn=>btn.addEventListener('click',()=>{
    quickState.rows.splice(Number(btn.dataset.quickRemove),1);
    if(!quickState.rows.length) quickState.rows.push({tankId:'Z1',level:String(tankById('Z1')?.m ?? 0),target:String(tankById('Z1')?.maxM ?? 0),orders:'1'});
    saveQuickState(); renderQuick(); calculateQuick();
  }));
}
function calculateQuick(){
  const out=qs('quickResults');
  if(!out) return;
  const prod=num(state.production);
  const start=new Date(state.startTime || toLocalInput(new Date()));
  const entries=[];
  quickState.rows.forEach((row,rowIndex)=>{
    const t=tankById(row.tankId);
    if(!t) return;
    parseQuickOrders(row.orders).forEach(order=>entries.push({order,rowIndex,t,row}));
  });
  entries.sort((a,b)=>a.order-b.order || a.rowIndex-b.rowIndex);
  if(!entries.length){out.innerHTML='<div class="quick-empty">Βάλε τουλάχιστον μία σειρά, π.χ. 1-3.</div>';return;}
  if(prod<=0){out.innerHTML='<div class="quick-empty">Δήλωσε πρώτα παραγωγή kg/hr.</div>';return;}
  const seen={}; let elapsed=0; const results=[];
  for(const e of entries){
    seen[e.t.id]=(seen[e.t.id]||0)+1;
    const occurrence=seen[e.t.id];
    const startM=occurrence===1 ? Math.max(0,num(e.row.level)) : 0;
    const requestedTarget=Math.max(0,num(e.row.target));
    const targetM=Math.min(Math.max(0,num(e.t.maxM)), requestedTarget);
    const tons=Math.max(0,(targetM-startM)*num(e.t.tnm));
    const hours=tons/(prod/1000);
    elapsed+=hours;
    const end=new Date(start.getTime()+elapsed*3600000);
    results.push({order:e.order,id:e.t.id,occurrence,startM,targetM,tons,hours,end});
  }
  out.innerHTML=results.map(r=>`<div class="quick-result-row">
    <span class="badge">${r.order}</span>
    <div><b>${r.id} — ${r.occurrence}η πλήρωση</b>: ${dateFmt(r.end)}
      <small>${fmt(r.startM,2)}m → ${fmt(r.targetM,2)}m · ${fmt(r.tons,2)} tn · ${dur(r.hours)}</small>
    </div>
  </div>`).join('');
}

function qs(id){return document.getElementById(id)}
function num(v){
  if(v === '' || v === null || v === undefined) return 0;
  const clean = String(v).trim().replace(/\s/g,'').replace(',', '.');
  if(clean === '' || clean === '.' || clean === ',') return 0;
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}
function fmt(n,d=2){ return Number(n).toLocaleString('el-GR',{minimumFractionDigits:d,maximumFractionDigits:d}); }
function toLocalInput(date){ const z=new Date(date.getTime()-date.getTimezoneOffset()*60000); return z.toISOString().slice(0,16); }
function dateFmt(date){ return date.toLocaleString('el-GR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function dur(hours){ if(!isFinite(hours)||hours<=0) return '0ω 00λ'; const h=Math.floor(hours); const m=Math.round((hours-h)*60); return `${h}ω ${String(m).padStart(2,'0')}λ`; }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){
  try{
    const current = localStorage.getItem(STORAGE_KEY);
    if(current) return JSON.parse(current);
    for(const key of OLD_KEYS){
      const old = localStorage.getItem(key);
      if(old) return JSON.parse(old);
    }
  }catch(e){return null;}
  return null;
}
function normalizeState(s){
  const base = {production:'6824', startTime:toLocalInput(new Date()), globalTankers:0, tanks:structuredClone(defaultTanks), ...s};
  const defaultsById = Object.fromEntries(defaultTanks.map(t=>[t.id, t]));
  const savedById = Object.fromEntries((base.tanks || []).filter(t=>t && t.id).map(t=>[t.id, t]));

  // Η απεικόνιση των καρτών είναι πάντα σταθερή: Z1, Z2, Z3, D1, D2, D3.
  // Τα αποθηκευμένα στοιχεία μένουν ανά δεξαμενή με βάση το id, για να μη χαθούν οι τιμές του χρήστη.
  base.tanks = displayOrder.map(id=>{
    const t = {...structuredClone(defaultsById[id]), ...(savedById[id] || {})};
    return {
      ...t,
      tankers: t.tankers ?? 0,
      targets: t.targets ?? '',
      fillOrder1: t.fillOrder1 ?? '',
      fillTarget1: t.fillTarget1 ?? '',
      fillOrder2: t.fillOrder2 ?? '',
      fillTarget2: t.fillTarget2 ?? ''
    };
  });
  return base;
}
function clamp(n,min,max){ return Math.min(max, Math.max(min, n)); }

function orderList(t){
  const raw = String(t.order ?? '').trim();
  if(!raw) return [];
  // Το 1-5 σημαίνει ότι η ίδια δεξαμενή εμφανίζεται στη σειρά 1 και ξανά στη σειρά 5.
  // Υποστηρίζονται επίσης 1,5 ή 1;5 ή 1 5.
  const parts = raw.split(/[^0-9]+/).map(x=>Number(x)).filter(x=>Number.isFinite(x) && x>0);
  return [...new Set(parts)].sort((a,b)=>a-b);
}

function targetList(t){
  const maxM = Math.max(0, num(t.maxM));
  const raw = String(t.targets ?? '').split(/[;,]+/).map(x=>x.trim()).filter(Boolean).map(num).filter(x=>x>0);
  const list = raw.length ? raw : [maxM];
  const cleaned = [...new Set(list.map(x=>clamp(x, 0, maxM)))].filter(x=>x>0).sort((a,b)=>a-b);
  return cleaned.length ? cleaned : [maxM];
}


function explicitFillPlans(t){
  const maxM = Math.max(0, num(t.maxM));
  const plans = [];
  [1,2].forEach(n=>{
    const order = Number(num(t[`fillOrder${n}`]));
    const targetRaw = String(t[`fillTarget${n}`] ?? '').trim();
    const target = targetRaw ? clamp(num(targetRaw), 0, maxM) : 0;
    if(Number.isFinite(order) && order > 0 && target > 0){
      plans.push({order, targetM: target, fillNo: n, explicit: true});
    }
  });
  return plans.sort((a,b)=>a.order-b.order || a.fillNo-b.fillNo);
}

function fillPlans(t){
  const explicit = explicitFillPlans(t);
  if(explicit.length) return explicit;

  // Παλιά λειτουργία: Σειρά + Στόχοι m.
  // Αν οι στόχοι είναι ίδιοι σε πλήθος με τις σειρές, τους αντιστοιχίζουμε ένας-προς-έναν.
  // Αλλιώς κρατάμε την παλιά λογική, όπου κάθε εμφάνιση περνά από όλους τους στόχους.
  const orders = orderList(t);
  if(!orders.length) return [];
  const targets = targetList(t);
  if(targets.length === orders.length){
    return orders.map((order, i)=>({order, targetM: targets[i], fillNo: i+1, explicit: false, pairedLegacy: true}));
  }
  return orders.flatMap((order, occurrenceIndex)=>targets.map((targetM, idx)=>({
    order, targetM, fillNo: occurrenceIndex+1, step: idx+1, explicit: false
  })));
}

function plannedTargets(t){
  const plans = fillPlans(t).map(p=>p.targetM).filter(x=>x>0);
  return plans.length ? plans : targetList(t);
}

function tankCalc(t){
  const maxT = Math.max(0, num(t.maxM) * num(t.tnm));
  const curM = Math.max(0,num(t.m));
  const curT = Math.max(0, curM * num(t.tnm));
  const tankerCount = Math.max(0, Math.floor(num(t.tankers)));
  const tankerT = tankerCount * TANKER_TONS;
  // Τα +βυτία είναι ΜΟΝΟ έξτρα ποσότητα για το Πρόγραμμα γεμίσματος.
  // Δεν αλλάζουν την πραγματική στάθμη/απεικόνιση της δεξαμενής.
  const displayT = curT;
  const displayM = curM;
  const lastTargetM = plannedTargets(t).slice(-1)[0] || num(t.maxM);
  const targetT = Math.min(maxT, lastTargetM * num(t.tnm));
  const missT = Math.max(0, targetT - curT);
  const pct = maxT > 0 ? Math.min(100, (curT/maxT)*100) : 0;
  const prod = num(state.production);
  const hours = prod > 0 ? missT / (prod/1000) : 0;
  return {maxT, curM, curT, tankerCount, tankerT, displayT, displayM, missT, pct, hours, lastTargetM};
}

function render(){
  qs('production').value = state.production ?? '';
  qs('startTime').value = state.startTime;
  qs('globalTankers').value = state.globalTankers ?? 0;
  renderQuick();
  const root = qs('tanks'); root.innerHTML='';
  state.tanks.forEach((t,i)=>{
    const c=tankCalc(t);
    const card=document.createElement('article'); card.className='tank-card';
    card.innerHTML=`
      <div class="tank-title"><span>${t.id}</span><span>${t.code}</span></div>
      <div class="tank-layout">
        <div class="tank-visual">
          ${Array.from({length:9},(_,k)=>`<div class="mark" style="bottom:${(k+1)*10}%"></div>`).join('')}
          <div class="fill" style="height:${c.pct}%"></div>
          <div class="tank-text"><div>${t.id}</div><div>${fmt(c.displayT,1)} tn</div><div>${fmt(c.displayM,2)} m</div></div>
        </div>
        <div class="fields">
          <label>Max m<input data-i="${i}" data-k="maxM" type="text" inputmode="text" value="${t.maxM}"></label>
          <label>Πραγματικά m<input data-i="${i}" data-k="m" type="text" inputmode="text" value="${t.m}"></label>
          <label>tn / m<input data-i="${i}" data-k="tnm" type="text" inputmode="text" value="${t.tnm}"></label>
          <label>1η σειρά<input data-i="${i}" data-k="fillOrder1" type="text" inputmode="numeric" placeholder="π.χ. 1" value="${t.fillOrder1 ?? ''}"></label>
          <label>1ος στόχος m<input data-i="${i}" data-k="fillTarget1" type="text" inputmode="text" placeholder="π.χ. 2,0" value="${t.fillTarget1 ?? ''}"></label>
          <label>2η σειρά<input data-i="${i}" data-k="fillOrder2" type="text" inputmode="numeric" placeholder="π.χ. 5" value="${t.fillOrder2 ?? ''}"></label>
          <label>2ος στόχος m<input data-i="${i}" data-k="fillTarget2" type="text" inputmode="text" placeholder="π.χ. 6,2" value="${t.fillTarget2 ?? ''}"></label>
          <label>Βυτία x ${fmt(TANKER_TONS,1)}tn<input data-i="${i}" data-k="tankers" type="text" inputmode="numeric" value="${t.tankers}"></label>
          <label>Παλιά σειρά<input data-i="${i}" data-k="order" type="text" inputmode="numeric" placeholder="π.χ. 1-5" value="${t.order}"></label>
          <label>Παλιοί στόχοι m<input data-i="${i}" data-k="targets" type="text" inputmode="text" placeholder="π.χ. 2, 6.20" value="${t.targets ?? ''}"></label>
          <div class="small-btns tankers-btns">
            <button class="tankerbtn" data-addtankers="${i}" data-step="1" type="button">+1 βυτίο</button>
            <button class="tankerbtn" data-addtankers="${i}" data-step="2" type="button">+2 βυτία</button>
            <button class="tankerbtn secondary" data-addtankers="${i}" data-step="-1" type="button">-1</button>
            <button class="tankerbtn secondary" data-cleartankers="${i}" type="button">Μηδέν</button>
          </div>
          <div class="small-btns"><button class="maxbtn" data-max="${i}" type="button">MAX</button><button class="emptybtn" data-empty="${i}" type="button">EMPTY</button></div>
          <div class="results">
            Πραγματικό: <b>${fmt(c.curT,2)} tn</b><br>
            Βυτία για πρόγραμμα: <b>${c.tankerCount} × ${fmt(TANKER_TONS,1)} = ${fmt(c.tankerT,2)} tn έξτρα έξοδος</b><br>
            <small>Δεν γεμίζουν/αλλάζουν τη δεξαμενή στην κάρτα. Προστίθενται μόνο στο Πρόγραμμα γεμίσματος.</small><br>
            Τελικός στόχος: <b>${fmt(c.lastTargetM,2)} m</b><br>
            Λείπουν μέχρι στόχο χωρίς βυτία: <b>${fmt(c.missT,2)} tn</b><br>
            Χρόνος χωρίς βυτία: <b>${dur(c.hours)}</b><br>
            Πλήρωση: <b>${fmt(c.pct,1)}%</b>
          </div>
        </div>
      </div>`;
    root.appendChild(card);
  });
  attachEvents();
  updateSchedule();
}

function attachEvents(){
  document.querySelectorAll('input[data-i]').forEach(inp=>{
    inp.addEventListener('input', e=>{
      const i=Number(e.target.dataset.i), k=e.target.dataset.k;
      state.tanks[i][k] = e.target.value;
      save(); updateSchedule();
    });
    inp.addEventListener('blur', ()=>render());
  });
  document.querySelectorAll('[data-max]').forEach(btn=>btn.onclick=()=>{ const i=Number(btn.dataset.max); state.tanks[i].m=state.tanks[i].maxM; save(); render(); });
  document.querySelectorAll('[data-empty]').forEach(btn=>btn.onclick=()=>{ const i=Number(btn.dataset.empty); state.tanks[i].m=0; save(); render(); });
  document.querySelectorAll('[data-addtankers]').forEach(btn=>btn.onclick=()=>{
    const i=Number(btn.dataset.addtankers); const step=Number(btn.dataset.step);
    state.tanks[i].tankers = Math.max(0, Math.floor(num(state.tanks[i].tankers) + step));
    save(); render();
  });
  document.querySelectorAll('[data-cleartankers]').forEach(btn=>btn.onclick=()=>{ const i=Number(btn.dataset.cleartankers); state.tanks[i].tankers=0; save(); render(); });
}
function updateSchedule(){
  const prod=num(qs('production').value); state.production=qs('production').value;
  state.startTime=qs('startTime').value || toLocalInput(new Date());
  const start = new Date(state.startTime);
  const calcs = state.tanks.map(t=>({...t, calc:tankCalc(t)}));
  const totalPhysical = calcs.reduce((s,t)=>s+t.calc.curT,0);
  qs('totalNow').textContent = `${fmt(totalPhysical,2)} tn`;
  const bd = qs('totalBreakdown');
  if (bd) {
    const globalCount = Math.max(0, Math.floor(num(state.globalTankers)));
    bd.innerHTML = calcs.map(t=>`<div><span>${t.id}</span>${fmt(t.calc.curT,2)} tn${t.calc.tankerCount ? `<small>+${t.calc.tankerCount} βυτ. στο πρόγραμμα</small>` : ''}</div>`).join('') +
      (globalCount ? `<div class="wide"><span>Γενικά βυτία</span>${globalCount} × ${fmt(TANKER_TONS,1)} = ${fmt(globalCount*TANKER_TONS,2)} tn<small>Χωρίς σύνδεση με συγκεκριμένη δεξαμενή</small></div>` : '');
  }
  const rawPlanEntries = calcs.flatMap(t=>fillPlans(t).map(plan=>({
    ...t,
    plan,
    order: plan.order,
    targetM: plan.targetM
  }))).sort((a,b)=>a.order-b.order || a.id.localeCompare(b.id));
  const seenByTank = {};
  const planEntries = rawPlanEntries.map(entry=>{
    seenByTank[entry.id] = (seenByTank[entry.id] || 0) + 1;
    return {...entry, occurrence: seenByTank[entry.id], isRepeat: seenByTank[entry.id] > 1};
  });
  let elapsed=0; let rows=[];
  const globalTankerCount = Math.max(0, Math.floor(num(state.globalTankers)));
  const globalTankerTons = globalTankerCount * TANKER_TONS;
  for(const [entryIndex, entry] of planEntries.entries()){
    // Στην πρώτη προγραμματισμένη πλήρωση χρησιμοποιείται η δηλωμένη/υπολογιστική στάθμη.
    // Στη δεύτερη πλήρωση της ίδιας δεξαμενής θεωρούμε ότι έχει αδειάσει και ξαναξεκινάει από 0.
    const levelT = entry.isRepeat ? 0 : entry.calc.curT;
    const startM = num(entry.tnm) > 0 ? levelT / num(entry.tnm) : 0;
    const targetT = Math.min(entry.calc.maxT, entry.targetM * num(entry.tnm));
    const fillMiss = Math.max(0, targetT - levelT);
    // Τα βυτία ΔΕΝ αλλάζουν τη στάθμη στην κάρτα και ΔΕΝ θεωρούνται ότι βγαίνουν πριν τη γέμιση.
    // Στο πρόγραμμα μετράνε σαν ταυτόχρονη έξοδος κατά τη διάρκεια της πλήρωσης:
    // παραγωγή που χρειάζεται = ποσότητα μέχρι στόχο + ποσότητα βυτίων.
    const tankerExtra = entry.isRepeat ? 0 : entry.calc.tankerT;
    // Τα γενικά βυτία δεν συνδέονται με δεξαμενή. Για να επηρεάζουν όλους τους χρόνους,
    // η συνολική τους ποσότητα προστίθεται μία φορά στην πρώτη ενεργή φάση του προγράμματος.
    const globalExtra = entryIndex === 0 ? globalTankerTons : 0;
    const miss = fillMiss + tankerExtra + globalExtra;
    const h = prod>0 ? miss/(prod/1000) : 0;
    if(miss > 0.0001){
      elapsed += h;
      const end = new Date(start.getTime() + elapsed*3600000);
      rows.push({
        id:entry.id, order:entry.order, targetM:entry.targetM, miss, h, end,
        startM, isRepeat:entry.isRepeat, occurrence:entry.occurrence, fillNo: entry.plan.fillNo,
        tankerCount: entry.isRepeat ? 0 : entry.calc.tankerCount,
        tankerT: entry.isRepeat ? 0 : entry.calc.tankerT,
        globalTankerCount: entryIndex === 0 ? globalTankerCount : 0,
        globalTankerTons: globalExtra,
        fillMiss
      });
    }
  }
  qs('allFullTime').textContent = rows.length ? `${dateFmt(rows[rows.length-1].end)} (${dur(elapsed)})` : 'Όλα στους στόχους / χωρίς σειρά';
  const sch=qs('schedule');
  sch.innerHTML = '<div class="schedule-row"><span>Σειρά</span><span>Δεξαμενή / στόχος</span><span>Λείπουν</span><span>Φτάνει στις</span></div>' +
    (rows.length ? rows.map(r=>{
      const tankerText = r.tankerCount
        ? `<b>Πλήρωση με ταυτόχρονη έξοδο ${r.tankerCount} βυτίων = ${fmt(r.tankerT,2)} tn.</b> `
        : '';
      const globalText = r.globalTankerCount
        ? `<b>Γενική έξοδος ${r.globalTankerCount} βυτίων = ${fmt(r.globalTankerTons,2)} tn.</b> `
        : '';
      const fillText = `από ${fmt(r.startM,2)}m μέχρι ${fmt(r.targetM,2)}m`;
      const details=[];
      if(r.tankerCount) details.push(`βυτία συγκεκριμένης δεξαμενής ${fmt(r.tankerT,2)} tn`);
      if(r.globalTankerCount) details.push(`γενικά βυτία ${fmt(r.globalTankerTons,2)} tn`);
      const detailText = details.length
        ? `<small>Δεν σταματάει το γέμισμα: στόχος δεξαμενής ${fmt(r.fillMiss,2)} tn + ${details.join(' + ')} = ${fmt(r.miss,2)} tn παραγωγή συνολικά.</small>`
        : '';
      return `<div class="schedule-row"><span class="badge">${r.order}</span><span>${r.id} ${r.fillNo ? r.fillNo+'η πλήρωση: ' : ''}${globalText}${tankerText}${fillText}${r.isRepeat ? ' <small>(ξανά από 0)</small>' : ''} — ${dur(r.h)}${detailText}</span><span>${fmt(r.miss,2)} tn</span><span>${dateFmt(r.end)}</span></div>`;
    }).join('') : '<p>Βάλε 1η σειρά/στόχο και, αν χρειάζεται, 2η σειρά/στόχο. Παράδειγμα D1: 1η σειρά 1 στόχος 2,0m και 2η σειρά 5 στόχος 6,2m.</p>');
  calculateQuick();
  save();
}

qs('production').addEventListener('input', e=>{ state.production=e.target.value; updateSchedule(); });
qs('startTime').addEventListener('input', updateSchedule);
qs('globalTankers').addEventListener('input', e=>{ state.globalTankers=e.target.value; save(); updateSchedule(); });
qs('nowBtn').onclick=()=>{state.startTime=toLocalInput(new Date()); save(); render();};
qs('saveBtn').onclick=()=>{save(); alert('Αποθηκεύτηκε στη συσκευή.');};
qs('resetBtn').onclick=()=>{
  if(confirm('Να καθαριστούν οι σειρές, οι στόχοι, τα βυτία και τα πραγματικά μέτρα;')){
    localStorage.removeItem(STORAGE_KEY);
    OLD_KEYS.forEach(k=>localStorage.removeItem(k));
    const clearedTanks=structuredClone(defaultTanks).map(t=>({
      ...t,
      m:'',
      order:'',
      targets:'',
      fillOrder1:'',
      fillTarget1:'',
      fillOrder2:'',
      fillTarget2:'',
      tankers:0
    }));
    state={production:'6824',startTime:toLocalInput(new Date()),globalTankers:0,tanks:clearedTanks};
    save();
    render();
  }
};
qs('quickAddBtn').onclick=()=>{
  const id=displayOrder.find(id=>!quickState.rows.some(r=>r.tankId===id)) || 'Z1';
  quickState.rows.push({tankId:id,level:String(tankById(id)?.m ?? 0),target:String(tankById(id)?.maxM ?? 0),orders:''});
  saveQuickState(); renderQuick();
};
qs('quickCalcBtn').onclick=()=>{ saveQuickState(); calculateQuick(); };
qs('quickClearBtn').onclick=()=>{
  if(confirm('Να καθαριστούν οι γραμμές και τα αποτελέσματα του γρήγορου υπολογισμού;')){
    quickState={rows:[{tankId:'Z1',level:'',target:'',orders:''}]};
    saveQuickState(); renderQuick();
    qs('quickResults').innerHTML='<div class="quick-empty">Ο γρήγορος υπολογισμός καθαρίστηκε.</div>';
  }
};
function changeGlobalTankers(step){
  state.globalTankers=Math.max(0,Math.floor(num(state.globalTankers)+step));
  save(); render();
}
qs('globalTankerPlus1').onclick=()=>changeGlobalTankers(1);
qs('globalTankerPlus2').onclick=()=>changeGlobalTankers(2);
qs('globalTankerMinus1').onclick=()=>changeGlobalTankers(-1);
qs('globalTankerClear').onclick=()=>{state.globalTankers=0;save();render();};

render();
