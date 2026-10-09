// ===== Kapachim Calendar v2 — Εβδομαδιαίος υπολογισμός παραγωγής =====
const WEEK_PRODUCTION_KEY='kapachim.weekProduction.v1';
const WEEK_TANK_DEFAULTS=[
 {id:'Z1',maxM:8.65,tnm:11.63},{id:'Z2',maxM:7.50,tnm:13.54},{id:'Z3',maxM:7.50,tnm:13.54},
 {id:'D1',maxM:6.20,tnm:11.63},{id:'D2',maxM:6.20,tnm:11.63},{id:'D3',maxM:0,tnm:0,enabled:false}
];
function wpNum(v){return Number(String(v??'').replace(',','.'))||0}
function wpFmt(v,d=2){return Number(v||0).toLocaleString('el-GR',{minimumFractionDigits:d,maximumFractionDigits:d})}
function wpLocalDateTime(d=new Date()){const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`}
function wpLoad(){try{return JSON.parse(localStorage.getItem(WEEK_PRODUCTION_KEY)||'null')}catch{return null}}
function wpDefault(){return {kgH:'',start:wpLocalDateTime(),end:wpLocalDateTime(new Date(Date.now()+7*86400000)),todayDate:wpLocalDateTime().slice(0,10),todayTankers:0,tanks:WEEK_TANK_DEFAULTS.map(t=>({...t,m:'',targetM:t.maxM}))}}
let weekProduction=wpLoad()||wpDefault();
function wpNormalize(){
 weekProduction={...wpDefault(),...weekProduction};
 weekProduction.tanks=WEEK_TANK_DEFAULTS.map(def=>{const old=(weekProduction.tanks||[]).find(t=>t.id===def.id)||{};return {...def,...old,id:def.id,tnm:def.id==='D3'?(old.tnm??''):def.tnm,maxM:def.id==='D3'?(old.maxM??''):def.maxM,enabled:def.id==='D3'?(old.enabled===true):true,targetM:old.targetM===''?'':(old.targetM??def.maxM)}});
}
function wpSave(){localStorage.setItem(WEEK_PRODUCTION_KEY,JSON.stringify(weekProduction))}
function wpImportTankValues(){
 try{
  const raw=JSON.parse(localStorage.getItem('hypo-v8-tankers-targets')||'null');
  if(raw){if(raw.production!==undefined)weekProduction.kgH=String(raw.production);if(raw.startTime)weekProduction.start=String(raw.startTime).slice(0,16);for(const wt of weekProduction.tanks){const t=(raw.tanks||[]).find(x=>x.id===wt.id);if(t){wt.m=t.m;if(wt.id==='D3'){wt.maxM=wpNum(t.maxM)||wt.maxM;wt.tnm=wpNum(t.tnm)||wt.tnm;}wt.targetM=wpNum(t.maxM)||wt.targetM}}wpSave();wpRender();return true}
 }catch(e){}
 return false;
}
function wpWeeklyDayCounts(){return (weekProduction.days||Array(7).fill(0)).map(x=>Math.max(0,Math.floor(wpNum(x))))}
function wpRender(){
 wpNormalize();const grid=document.getElementById('productionTankGrid');if(!grid)return;grid.innerHTML='';
 weekProduction.tanks.forEach((t,i)=>{const tr=document.createElement('tr');tr.innerHTML=`<th>${t.id}${t.id==='D3'?`<label class="d3-toggle"><input type="checkbox" id="weeklyD3Enabled" ${t.enabled?'checked':''}> Έκτακτα</label>`:''}</th><td>${t.id==='D3'?`<input class="weekly-compact-input" type="text" inputmode="decimal" data-wp-max="${i}" value="${t.maxM||''}" placeholder="Max m">`:wpFmt(t.maxM)}</td><td>${t.id==='D3'?`<input class="weekly-compact-input" type="text" inputmode="decimal" data-wp-tnm="${i}" value="${t.tnm||''}" placeholder="tn/m">`:wpFmt(t.tnm)}</td><td><input class="weekly-compact-input" type="text" inputmode="decimal" data-wp-i="${i}" value="${t.m??''}" placeholder="0,00"></td><td id="wp-stock-${i}">—</td><td id="wp-free-m-${i}">—</td><td id="wp-free-${i}">—</td>`;grid.appendChild(tr)});
 grid.querySelectorAll('[data-wp-max]').forEach(el=>el.oninput=()=>{weekProduction.tanks[+el.dataset.wpMax].maxM=el.value;wpSave();wpCalculate()});grid.querySelectorAll('[data-wp-tnm]').forEach(el=>el.oninput=()=>{weekProduction.tanks[+el.dataset.wpTnm].tnm=el.value;wpSave();wpCalculate()});
 grid.querySelectorAll('[data-wp-i]').forEach(el=>el.oninput=()=>{weekProduction.tanks[+el.dataset.wpI].m=el.value;wpSave();wpCalculate()});
 const td=document.getElementById('weeklyTodayDate'),tc=document.getElementById('weeklyTodayTankers');if(td){td.value=weekProduction.todayDate||wpLocalDateTime().slice(0,10);td.onchange=()=>{weekProduction.todayDate=td.value;wpSave()}}if(tc){tc.value=weekProduction.todayTankers??0;tc.oninput=()=>{weekProduction.todayTankers=tc.value;wpSave();wpCalculate()}}
 const d3=document.getElementById('weeklyD3Enabled');if(d3)d3.onchange=()=>{weekProduction.tanks[5].enabled=d3.checked;wpSave();wpCalculate()};
 const kg=document.getElementById('weeklyKgH'),st=document.getElementById('weeklyProductionStart'),en=document.getElementById('weeklyProductionEnd');kg.value=weekProduction.kgH||'';st.value=(weekProduction.start||wpLocalDateTime()).slice(0,16);en.value=(weekProduction.end||wpLocalDateTime(new Date(new Date(st.value).getTime()+7*86400000))).slice(0,16);
 kg.oninput=()=>{weekProduction.kgH=kg.value;wpSave();wpCalculate()};st.onchange=()=>{weekProduction.start=st.value;wpSave();wpCalculate()};en.onchange=()=>{weekProduction.end=en.value;wpSave();wpCalculate()};document.getElementById('weeklyEndNowBtn').onclick=()=>{weekProduction.end=wpLocalDateTime();en.value=weekProduction.end;wpSave();wpCalculate()};
 document.getElementById('weeklyNowBtn').onclick=()=>{weekProduction.start=wpLocalDateTime();st.value=weekProduction.start;wpSave();wpCalculate()};
 wpCalculate();
}
function wpCalculate(){
 const kgH=Math.max(0,wpNum(weekProduction.kgH)),prod24=kgH*24/1000,counts=wpWeeklyDayCounts(),tankers=counts.reduce((a,b)=>a+b,0),sold=tankers*24.5;
 const periodStart=new Date(weekProduction.start),periodEnd=new Date(weekProduction.end);const validPeriod=Number.isFinite(periodStart.getTime())&&Number.isFinite(periodEnd.getTime())&&periodEnd>periodStart;const periodHours=validPeriod?(periodEnd-periodStart)/3600000:0;const prod7=kgH*periodHours/1000;
 const periodError=document.getElementById('weeklyPeriodError');periodError.textContent=validPeriod?'':'Η λήξη πρέπει να είναι μετά την έναρξη.';const hoursEl=document.getElementById('weeklyPeriodHours');hoursEl.textContent=validPeriod?wpFmt(periodHours)+' ώρες':'—';const productionEl=document.getElementById('weeklyPeriodProduction');productionEl.textContent=validPeriod?wpFmt(prod7)+' tn':'—';
 const monday=new Date();monday.setDate(monday.getDate()-(monday.getDay()+6)%7);monday.setHours(0,0,0,0);let periodTankers=0;counts.forEach((count,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);const next=new Date(d);next.setDate(next.getDate()+1);if(validPeriod&&d<periodEnd&&next>periodStart)periodTankers+=count});const periodSold=periodTankers*24.5;
 let current=0,capacity=0,free=0,freeMeters=0;
 weekProduction.tanks.forEach((t,i)=>{const active=t.id!=='D3'||t.enabled;const amount=Math.max(0,wpNum(t.m))*wpNum(t.tnm),cap=wpNum(t.maxM)*wpNum(t.tnm);if(active){current+=amount;capacity+=cap;free+=Math.max(0,cap-amount);freeMeters+=Math.max(0,wpNum(t.maxM)-wpNum(t.m))}const fm=document.getElementById('wp-free-m-'+i);if(fm)fm.textContent=active?wpFmt(Math.max(0,wpNum(t.maxM)-wpNum(t.m))):'—';const c=document.getElementById('wp-stock-'+i),f=document.getElementById('wp-free-'+i);if(c)c.textContent=active?wpFmt(amount):'—';if(f)f.textContent=active?wpFmt(Math.max(0,cap-amount)):'—'});
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('weeklyFreeMeters',wpFmt(freeMeters));set('weeklyTankTotal',wpFmt(current));set('weeklyCurrentKgH',Math.round(kgH).toLocaleString('el-GR')+' kg/h');set('weekly24hKgRepeat',Math.round(kgH*24).toLocaleString('el-GR')+' kg');set('weeklyDayTotalCount',String(tankers));set('weeklyDayTotalTons',wpFmt(sold)+' tn');set('weeklyFreeTotal',wpFmt(free));set('weeklyProduction24h',wpFmt(prod24)+' tn');set('weeklyTankerCount',String(tankers));set('weeklyTankerTons',wpFmt(sold)+' tn');set('weeklyCurrentStock',wpFmt(current)+' tn');set('weeklyProduction7d',validPeriod?wpFmt(prod7)+' tn':'—');set('weeklyFinalStock',validPeriod?wpFmt(current+prod7-periodSold)+' tn':'—');set('weeklyRequiredKgH',Math.round(sold*1000/168).toLocaleString('el-GR')+' kg/h');set('weeklyTodayTons',wpFmt(Math.max(0,Math.floor(wpNum(weekProduction.todayTankers)))*24.5)+' tn');set('weekly24hKg',Math.round(kgH*24).toLocaleString('el-GR')+' kg');set('weekly24hTn',wpFmt(prod24)+' tn');set('weeklyExcelInitial',wpFmt(current)+' tn');set('weeklyExcelProduced',validPeriod?wpFmt(prod7)+' tn':'—');set('weeklyExcelDemand',validPeriod?wpFmt(periodSold)+' tn':'—');set('weeklyExcelFinal',validPeriod?wpFmt(current+prod7-periodSold)+' tn':'—');
 const start=new Date(weekProduction.start||wpLocalDateTime());const eight=new Date(start);eight.setHours(8,0,0,0);if(eight<=start)eight.setDate(eight.getDate()+1);const until8=Number.isFinite(start.getTime())?kgH*(eight-start)/3600000000:0;set('weeklyTo8',wpFmt(until8)+' tn');set('weeklyUntil8Kg',Math.round(until8*1000).toLocaleString('el-GR')+' kg');
 const base=new Date();const day=(base.getDay()+6)%7;base.setDate(base.getDate()-day);base.setHours(0,0,0,0);let stock=current;const body=document.getElementById('weeklyBalanceBody');body.innerHTML='';['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'].forEach((name,i)=>{const d=new Date(base);d.setDate(d.getDate()+i);const tr=document.createElement('tr');stock+=prod24-counts[i]*24.5;tr.innerHTML=`<th>${name}</th><td>${d.toLocaleDateString('el-GR')}</td><td><input class="weekly-compact-input" type="number" min="0" step="1" data-wp-day="${i}" value="${counts[i]}"></td><td>${wpFmt(counts[i]*24.5)}</td>`;body.appendChild(tr)});
 body.querySelectorAll('[data-wp-day]').forEach(el=>el.onchange=()=>{weekProduction.days[+el.dataset.wpDay]=Math.max(0,Math.floor(wpNum(el.value)));wpSave();wpCalculate()});
 const advice=document.getElementById('weeklyProductionAdvice');const final=current+prod7-periodSold;advice.className='production-advice '+(final<0?'danger':final>capacity?'warn':'ok');advice.textContent=!validPeriod?'Επίλεξε σωστή ημερομηνία και ώρα έναρξης/λήξης.':!kgH?'Συμπλήρωσε παραγωγή kg/h για πρόβλεψη.':final<0?'⚠ Δεν επαρκεί το απόθεμα και η παραγωγή για τα βυτία του επιλεγμένου διαστήματος.':final>capacity?'⚠ Πιθανή υπερπλήρωση: το τελικό απόθεμα ξεπερνά τη χωρητικότητα.':'✓ Το τελικό ισοζύγιο του επιλεγμένου διαστήματος είναι εντός χωρητικότητας. Έλεγξε και τις ημερήσιες εκτιμήσεις.';
}
function wpInit(){wpNormalize();if(!Array.isArray(weekProduction.days))weekProduction.days=Array(7).fill(0);wpRender()}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wpInit,{once:true}); else wpInit();
