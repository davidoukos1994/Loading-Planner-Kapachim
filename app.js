const KEY='loadingPlanner.v6', OLD_KEYS=['loadingPlanner.v5','loadingPlanner.v4','loadingPlanner.v3','loadingPlanner.v2','loadingPlanner.v1'];
const WEEK_PRODUCT_SECTIONS=[
 {key:'hypochlorite',label:'ΥΠΟΧΛΩΡΙΩΔΕΣ ΝΑΤΡΙΟ',rows:15,cls:'product-hypochlorite'},
 {key:'hydrochloric',label:'ΥΔΡΟΧΛΩΡΙΚΟ ΟΞΥ',rows:2,cls:'product-hydrochloric'},
 {key:'brine',label:'ΑΛΜΗ',rows:2,cls:'product-brine'},
 {key:'salt',label:'ΑΛΑΤΙ',rows:3,cls:'product-salt'}
];
const DAILY_HEADERS=['#','ΠΕΛΑΤΗΣ','ΑΠΟ ΔΕΞΑΜΕΝΗ','ΜΕΤΑΦΟΡΕΑΣ','ΠΟΣΟΤΗΤΑ','ΗΜ/ΝΙΑ - ΒΑΡΔΙΑ','ΩΡΑ ΦΟΡΤΩΣΗΣ','ΥΠΕΥΘΥΝΟΣ ΦΟΡΤΩΣΗΣ'];
const SEQUENCE_HEADERS=['#','ΔΕΞΑΜΕΝΗ','ΑΡΧΙΚΗ ΣΤΑΘΜΗ','ΤΕΛΙΚΗ ΣΤΑΘΜΗ','ΕΝΕΡΓΑ','ΣΟΔΑ','ΟΛΟΚΛΗΡΩΘΗΚΕ'];
const SALT_OPTIONS=['ΕΛΛΗΝΙΚΕΣ ΑΛΥΚΕΣ','ΔΑΚΑΡΙΔΗΣ'];
let state=loadState(), selectedInputs=[], ocrTarget='weekly', ocrPending=[];

// Κοινόχρηστος συγχρονισμός Supabase (μόνο δεδομένα, ποτέ φωτογραφίες).
const DEFAULT_SUPABASE_URL='https://jxuxrpemexgiqofjprms.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY='sb_publishable_C1umeeMdCahuDbDhFZFa1g_CpFtFj6i';
const CONNECTION_SETTINGS_KEY='loadingPlanner.connection.v1';
const SHARED_ROW_ID='shared-loading-planner';
function getConnectionSettings(){
 try{
  const saved=JSON.parse(localStorage.getItem(CONNECTION_SETTINGS_KEY)||'{}');
  return {url:(saved.url||DEFAULT_SUPABASE_URL).trim(),key:(saved.key||DEFAULT_SUPABASE_PUBLISHABLE_KEY).trim()};
 }catch{return {url:DEFAULT_SUPABASE_URL,key:DEFAULT_SUPABASE_PUBLISHABLE_KEY}}
}
function storeConnectionSettings(url,key){localStorage.setItem(CONNECTION_SETTINGS_KEY,JSON.stringify({url:String(url||'').trim(),key:String(key||'').trim()}))}
function setConnectionResult(text,kind='idle'){const el=document.getElementById('connectionResult');if(!el)return;el.textContent=text;el.dataset.kind=kind}
function fillConnectionSettings(){const cfg=getConnectionSettings();const u=document.getElementById('settingsSupabaseUrl'),k=document.getElementById('settingsSupabaseKey');if(u)u.value=cfg.url;if(k)k.value=cfg.key}

const DEVICE_ID_KEY='loadingPlanner.deviceId';
const DEVICE_ID=localStorage.getItem(DEVICE_ID_KEY)||((crypto.randomUUID&&crypto.randomUUID())||('device-'+Date.now()+'-'+Math.random().toString(16).slice(2)));
localStorage.setItem(DEVICE_ID_KEY,DEVICE_ID);
let supabaseClient=null, syncReady=false, applyingRemote=false, remoteTimer=null, realtimeChannel=null;


function defaultState(){return {weekStart:'',weekly:{},weeklyDone:{},dailyDate:'',daily:{},sequenceDate:'',sequence:{},lists:{clients:['UNILEVER','ΚΩΝΣΤΑΝΤΙΝΙΔΗΣ','ΙΝΤΕΡΚΑΠΑ','LUBRICO','ΕΥΡΩΧΑΡΤΙΚΗ','ECOLAB','COLGATE','ΟΞΕΑ','FERI TRI','ALINDA'],tanks:['Δ1','Δ2','Ζ1','Ζ2','Ζ3','Α2','Α3','Α4'],carriers:[],other:[]}}}
function loadState(){try{let raw=localStorage.getItem(KEY);if(!raw)for(const k of OLD_KEYS){raw=localStorage.getItem(k);if(raw)break}const p=raw?JSON.parse(raw):{},b=defaultState();return {...b,...p,lists:{...b.lists,...(p.lists||{})},weeklyDone:p.weeklyDone||{},sequence:p.sequence||{}}}catch{return defaultState()}}
function setStatus(text,kind=''){const el=document.getElementById('saveStatus');if(!el)return;el.textContent=text;el.dataset.kind=kind}
function save(){
 localStorage.setItem(KEY,JSON.stringify(state));
 setStatus((syncReady?'Αποθηκεύτηκε • συγχρονισμός…':'Αποθηκεύτηκε τοπικά')+' '+new Date().toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'}),syncReady?'syncing':'local');
 scheduleRemoteSave();
}
function scheduleRemoteSave(){
 if(!syncReady||applyingRemote||!supabaseClient)return;
 clearTimeout(remoteTimer);remoteTimer=setTimeout(pushRemoteState,650);
}
async function pushRemoteState(){
 if(!syncReady||applyingRemote||!supabaseClient)return;
 try{
  const payload={id:SHARED_ROW_ID,data:state,updated_by:DEVICE_ID,updated_at:new Date().toISOString()};
  const {error}=await supabaseClient.from('loading_planner_state').upsert(payload,{onConflict:'id'});
  if(error)throw error;
  setStatus('Κοινόχρηστο • συγχρονίστηκε '+new Date().toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'}),'online');
 }catch(err){console.error('Supabase save',err);setStatus('Αποθηκεύτηκε τοπικά • σφάλμα συγχρονισμού','error')}
}
function applyRemoteState(remote){
 if(!remote||typeof remote!=='object')return;
 applyingRemote=true;
 const base=defaultState();
 state={...base,...remote,lists:{...base.lists,...(remote.lists||{})},weeklyDone:remote.weeklyDone||{},sequence:remote.sequence||{}};
 localStorage.setItem(KEY,JSON.stringify(state));
 state.weekStart=state.weekStart||mondayOfToday();state.dailyDate=state.dailyDate||iso(new Date());state.sequenceDate=state.sequenceDate||iso(new Date());
 initLists();renderWeekly();renderDaily();renderSequence();
 applyingRemote=false;
 setStatus('Κοινόχρηστο • ενημερώθηκε '+new Date().toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'}),'online');
}
async function initSharedSync(showResult=false){
 syncReady=false;
 if(realtimeChannel&&supabaseClient){try{await supabaseClient.removeChannel(realtimeChannel)}catch{}}
 realtimeChannel=null;supabaseClient=null;
 if(!window.supabase?.createClient){setStatus('Αποθηκεύτηκε τοπικά • δεν φορτώθηκε ο συγχρονισμός','error');setConnectionResult('🔴 Δεν φορτώθηκε η βιβλιοθήκη Supabase. Έλεγξε τη σύνδεση internet.','error');return false}
 const cfg=getConnectionSettings();
 if(!cfg.url||!cfg.key){setStatus('Αποθηκεύτηκε τοπικά • λείπουν ρυθμίσεις','error');setConnectionResult('🔴 Συμπλήρωσε Project URL και publishable key.','error');return false}
 try{
  supabaseClient=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false}});
  setStatus('Σύνδεση κοινής χρήσης…','syncing');
  const {data,error}=await supabaseClient.from('loading_planner_state').select('data,updated_by,updated_at').eq('id',SHARED_ROW_ID).maybeSingle();
  if(error)throw error;
  syncReady=true;
  if(data?.data)applyRemoteState(data.data);else await pushRemoteState();
  realtimeChannel=supabaseClient.channel('loading-planner-shared')
   .on('postgres_changes',{event:'*',schema:'public',table:'loading_planner_state',filter:`id=eq.${SHARED_ROW_ID}`},payload=>{
    const row=payload.new;if(!row||row.updated_by===DEVICE_ID)return;applyRemoteState(row.data);
   }).subscribe(status=>{if(status==='SUBSCRIBED'){setStatus('Κοινόχρηστο • online','online');setConnectionResult('🟢 Συνδεδεμένο με Supabase — ο συγχρονισμός είναι ενεργός.','online')}});
  setConnectionResult('🟢 Η σύνδεση και η ανάγνωση της κοινόχρηστης βάσης λειτουργούν.','online');
  return true;
 }catch(err){console.error('Supabase init',err);setStatus('Αποθηκεύτηκε τοπικά • έλεγξε τις ρυθμίσεις','error');setConnectionResult('🔴 Αποτυχία σύνδεσης: '+(err?.message||'Άγνωστο σφάλμα'),'error');return false}
}

function debounce(fn,ms=200){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}} const autosave=debounce(save);
function upper(v){return (v||'').toLocaleUpperCase('el-GR')} function iso(d){return d.toISOString().slice(0,10)}
function mondayOfToday(){const d=new Date(),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return iso(d)}
function fmt(d){return new Intl.DateTimeFormat('el-GR',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(d)}
function weekKey(){return state.weekStart||mondayOfToday()} function dayKey(){return state.dailyDate||iso(new Date())} function seqKey(){return state.sequenceDate||iso(new Date())}
function blankWeekly(){return Object.fromEntries(WEEK_PRODUCT_SECTIONS.map(s=>[s.key,Array.from({length:s.rows},()=>Array(7).fill(''))]))}
function blankWeeklyDone(){return Object.fromEntries(WEEK_PRODUCT_SECTIONS.map(s=>[s.key,Array.from({length:s.rows},()=>Array(7).fill(false))]))}
function blankDaily(){return Array.from({length:16},()=>Array(DAILY_HEADERS.length-1).fill(''))}
function blankSequence(){return Array.from({length:12},()=>Array(SEQUENCE_HEADERS.length-1).fill(''))}
function normalizeWeekly(v){const out=blankWeekly();if(v&&!Array.isArray(v))WEEK_PRODUCT_SECTIONS.forEach(s=>{for(let r=0;r<s.rows;r++)for(let c=0;c<7;c++)out[s.key][r][c]=upper(v[s.key]?.[r]?.[c]||'')});return out}
function normalizeDone(v){const out=blankWeeklyDone();WEEK_PRODUCT_SECTIONS.forEach(s=>{for(let r=0;r<s.rows;r++)for(let c=0;c<7;c++)out[s.key][r][c]=!!v?.[s.key]?.[r]?.[c]});return out}
function suggestions(key){if(key==='salt')return SALT_OPTIONS;return [...new Set((state.lists[key]||[]).map(upper).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'el'))}
function editDistance(a,b){const m=a.length,n=b.length,d=Array.from({length:m+1},()=>Array(n+1).fill(0));for(let i=0;i<=m;i++)d[i][0]=i;for(let j=0;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}
function matches(q,key,all=false){q=upper(q).trim();const xs=suggestions(key);if(!q)return all?xs:xs.slice(0,8);return xs.map(x=>({x,score:x.startsWith(q)?0:x.includes(q)?1:editDistance(x,q)<=2?2:9})).filter(o=>o.score<9).sort((a,b)=>a.score-b.score||a.x.localeCompare(b.x,'el')).slice(0,8).map(o=>o.x)}
function selectCell(el){document.querySelectorAll('.selected-cell').forEach(x=>x.classList.remove('selected-cell'));el.closest('td')?.classList.add('selected-cell');selectedInputs=[el]}
function addClientToList(value){
 const v=upper(value).trim();
 if(!v)return;
 if(!state.lists.clients.includes(v)){
  state.lists.clients.push(v);
  state.lists.clients=[...new Set(state.lists.clients)].sort((a,b)=>a.localeCompare(b,'el'));
  const box=document.getElementById('clientsList');if(box)box.value=state.lists.clients.join('\n');
  save();
 }
}
function makeInput(value,onChange,classes='',listKey=null,withPicker=false,options={}){
 const wrap=document.createElement('div');wrap.className='autocomplete-wrap'+(withPicker?'':' no-picker');
 const isClient=listKey==='clients';
 const input=document.createElement(isClient?'textarea':'input');
 if(!isClient)input.type='text';else{input.rows=2;input.wrap='soft';input.setAttribute('aria-label','ΟΝΟΜΑ ΠΕΛΑΤΗ')}
 input.className='cell-input '+classes+(isClient?' client-name-input':'');input.dataset.listKey=listKey||'';input.value=upper(value);input.autocomplete='off';input.autocapitalize='characters';input.spellcheck=false;
 const preview=document.createElement('div');preview.className='inline-preview';const menu=document.createElement('div');menu.className='inline-suggestions';
 let activeIndex=-1,currentHits=[];
 function close(){menu.classList.remove('open');menu.innerHTML='';preview.textContent='';activeIndex=-1;currentHits=[]}
 function choose(hit){input.value=upper(hit);onChange(input.value);if(options.addToClients&&listKey==='clients')addClientToList(input.value);save();close();input.focus();try{input.setSelectionRange(input.value.length,input.value.length)}catch{}}
 function renderHits(hits){currentHits=hits;activeIndex=-1;menu.innerHTML='';for(const hit of hits){const b=document.createElement('button');b.type='button';b.textContent=hit;b.tabIndex=-1;b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();choose(hit)});menu.appendChild(b)}menu.classList.toggle('open',hits.length>0)}
 function updateActive(){[...menu.children].forEach((b,i)=>b.classList.toggle('active',i===activeIndex));if(activeIndex>=0)menu.children[activeIndex]?.scrollIntoView({block:'nearest'})}
 function openAll(){if(!listKey)return;renderHits(matches('',listKey,true))}
 function openFiltered(){if(!listKey)return;const q=input.value.trim();if(!q){close();return}const hits=matches(q,listKey,false);renderHits(hits);if(hits.length&&upper(hits[0]).startsWith(upper(q))&&upper(hits[0])!==upper(q))preview.textContent=hits[0]}
 input.addEventListener('input',()=>{const pos=input.selectionStart,v=upper(input.value);input.value=v;try{input.setSelectionRange(pos,pos)}catch{}onChange(v);autosave();openFiltered()});
 input.addEventListener('paste',()=>setTimeout(()=>{const pos=input.selectionStart,v=upper(input.value);input.value=v;try{input.setSelectionRange(pos,pos)}catch{}onChange(v);autosave();openFiltered()},0));
 input.addEventListener('focus',()=>{selectCell(input);close()});
 input.addEventListener('click',()=>{selectCell(input)});
 input.addEventListener('keydown',e=>{
  if(e.key==='Escape'){close();return}
  if(menu.classList.contains('open')&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();activeIndex=e.key==='ArrowDown'?Math.min(activeIndex+1,currentHits.length-1):Math.max(activeIndex-1,0);updateActive();return}
  if(e.key==='Enter'&&menu.classList.contains('open')&&currentHits.length){e.preventDefault();choose(currentHits[activeIndex>=0?activeIndex:0]);return}
  if(e.key==='Enter'&&isClient)e.preventDefault();
 });
 input.addEventListener('blur',()=>{setTimeout(close,220);if(options.addToClients&&listKey==='clients')addClientToList(input.value)});
 wrap.append(input,preview);
 if(withPicker){const p=document.createElement('button');p.type='button';p.className='picker-button';p.textContent='▾';p.setAttribute('aria-label','Άνοιγμα λίστας');p.addEventListener('pointerdown',e=>e.preventDefault());p.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();selectCell(input);input.focus();openAll()});wrap.appendChild(p)}
 wrap.appendChild(menu);return {wrap,input}
}
function weeklyTotal(){const w=state.weekly[weekKey()]||blankWeekly();return WEEK_PRODUCT_SECTIONS.reduce((t,s)=>t+w[s.key].flat().filter(Boolean).length,0)}
function updateWeekTotal(){document.getElementById('weekTotal').textContent='ΣΥΝΟΛΟ ΒΥΤΙΩΝ: '+weeklyTotal()}
function renderWeekly(){
 const start=new Date((state.weekStart||mondayOfToday())+'T12:00:00');state.weekStart=iso(start);document.getElementById('weekStart').value=state.weekStart;const k=weekKey();state.weekly[k]=normalizeWeekly(state.weekly[k]);state.weeklyDone[k]=normalizeDone(state.weeklyDone[k]);
 const days=document.getElementById('weeklyDays');days.innerHTML='<th class="row-label">ΠΡΟΪΟΝ / ΘΕΣΗ</th>';const names=['ΔΕΥΤΕΡΑ','ΤΡΙΤΗ','ΤΕΤΑΡΤΗ','ΠΕΜΠΤΗ','ΠΑΡΑΣΚΕΥΗ','ΣΑΒΒΑΤΟ','ΚΥΡΙΑΚΗ'];const end=new Date(start);end.setDate(end.getDate()+6);document.getElementById('weekRange').textContent=fmt(start)+' – '+fmt(end);
 names.forEach((n,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);const th=document.createElement('th');th.dataset.day=i;th.innerHTML=`${fmt(d)}<br><strong>${n}</strong>`;days.appendChild(th)});
 const body=document.getElementById('weeklyBody');body.innerHTML='';WEEK_PRODUCT_SECTIONS.forEach(s=>{const h=document.createElement('tr');h.className='weekly-product-header '+s.cls;const th=document.createElement('th');th.className='row-label';th.textContent=s.label;h.appendChild(th);for(let c=0;c<7;c++){const td=document.createElement('td');td.dataset.day=c;td.textContent=s.label;h.appendChild(td)}body.appendChild(h);
 for(let r=0;r<s.rows;r++){const tr=document.createElement('tr');tr.className='weekly-entry-row '+s.cls;const num=document.createElement('th');num.className='row-label entry-number';num.textContent=r+1;tr.appendChild(num);for(let c=0;c<7;c++){const td=document.createElement('td');td.dataset.day=c;const x=makeInput(state.weekly[k][s.key][r][c],v=>{state.weekly[k][s.key][r][c]=v;updateWeekTotal()},'ocr-client-input',s.key==='salt'?'salt':'clients',true,{addToClients:s.key!=='salt'});const outer=document.createElement('div');outer.className='entry-with-check';const check=document.createElement('label');check.className='done-check';const cb=document.createElement('input');cb.type='checkbox';cb.checked=state.weeklyDone[k][s.key][r][c];const mark=document.createElement('span');mark.textContent='✓';cb.onchange=()=>{state.weeklyDone[k][s.key][r][c]=cb.checked;outer.classList.toggle('completed',cb.checked);save()};check.append(cb,mark);outer.append(x.wrap,check);outer.classList.toggle('completed',cb.checked);td.appendChild(outer);tr.appendChild(td)}body.appendChild(tr)}});updateWeekTotal()
}
function normalizeRows(rows,count){const out=Array.isArray(rows)?rows:[];return out.map(r=>Array.from({length:count},(_,i)=>upper(r?.[i]||'')))}
function renderDaily(){state.dailyDate=state.dailyDate||iso(new Date());document.getElementById('dailyDate').value=state.dailyDate;const k=dayKey();if(!state.daily[k])state.daily[k]=blankDaily();state.daily[k]=normalizeRows(state.daily[k],7);const head=document.getElementById('dailyHead');head.innerHTML='';DAILY_HEADERS.forEach(h=>{const th=document.createElement('th');th.textContent=h;head.appendChild(th)});const body=document.getElementById('dailyBody');body.innerHTML='';state.daily[k].forEach((row,ri)=>{const tr=document.createElement('tr');const n=document.createElement('th');n.textContent=ri+1;tr.appendChild(n);row.forEach((v,ci)=>{const td=document.createElement('td');const keys=['clients','tanks','carriers',null,null,null,'other'],key=keys[ci];const x=makeInput(v,val=>state.daily[k][ri][ci]=val,(ci===0?'ocr-client-input ':'')+(ci===3&&/24|25/.test(v)?'yellow':''),key,!!key);td.appendChild(x.wrap);tr.appendChild(td)});body.appendChild(tr)})}
function renderSequence(){state.sequenceDate=state.sequenceDate||iso(new Date());document.getElementById('sequenceDate').value=state.sequenceDate;const k=seqKey();if(!state.sequence[k])state.sequence[k]=blankSequence();state.sequence[k]=normalizeRows(state.sequence[k],6);const head=document.getElementById('sequenceHead');head.innerHTML='';SEQUENCE_HEADERS.forEach(h=>{const th=document.createElement('th');th.textContent=h;head.appendChild(th)});const body=document.getElementById('sequenceBody');body.innerHTML='';state.sequence[k].forEach((row,ri)=>{const tr=document.createElement('tr');if(row[5]==='ΝΑΙ')tr.classList.add('completed-row');const n=document.createElement('th');n.textContent=ri+1;tr.appendChild(n);row.forEach((v,ci)=>{const td=document.createElement('td');if(ci===5){const lab=document.createElement('label');lab.className='sequence-complete';const cb=document.createElement('input');cb.type='checkbox';cb.checked=v==='ΝΑΙ';cb.onchange=()=>{state.sequence[k][ri][ci]=cb.checked?'ΝΑΙ':'';tr.classList.toggle('completed-row',cb.checked);save()};lab.appendChild(cb);td.appendChild(lab)}else{const key=ci===0?'tanks':null;const x=makeInput(v,val=>state.sequence[k][ri][ci]=val,'',key,!!key);td.appendChild(x.wrap)}tr.appendChild(td)});body.appendChild(tr)})}
function initLists(){for(const k of ['clients','tanks','carriers','other']){state.lists[k]=[...new Set((state.lists[k]||[]).map(upper).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'el'));document.getElementById(k+'List').value=state.lists[k].join('\n')}}
function saveLists(show=false){for(const k of ['clients','tanks','carriers','other']){state.lists[k]=[...new Set(document.getElementById(k+'List').value.split(/\r?\n/).map(x=>upper(x.trim())).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'el'));document.getElementById(k+'List').value=state.lists[k].join('\n')}save();if(show)alert('Οι λίστες αποθηκεύτηκαν αλφαβητικά.')}
const autoLists=debounce(()=>saveLists(false));
function bindTabs(){document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab,.view').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.view).classList.add('active')})}
function normalizeMatch(v){return upper(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-ZΑ-Ω0-9]+/g,' ').trim()}
function bestClientInLine(line){
 const clean=normalizeMatch(line);let best=null,bestScore=Infinity;
 for(const client of suggestions('clients')){
  const n=normalizeMatch(client);let score=Infinity;
  if(clean===n)score=0;else if(clean.includes(n))score=1;else if(n.includes(clean)&&clean.length>=4)score=2;else{const d=editDistance(clean,n);if(d<=Math.max(1,Math.floor(n.length*.2)))score=3+d/n.length}
  if(score<bestScore){bestScore=score;best=client}
 }
 return bestScore<10?best:null
}
function parseOcrDate(text){
 const m=String(text||'').match(/\b([0-3]?\d)[\/\-.]([01]?\d)(?:[\/\-.](\d{2,4}))?\b/);
 if(!m)return null;
 let y=m[3]?Number(m[3]):new Date().getFullYear();if(y<100)y+=2000;
 const d=new Date(y,Number(m[2])-1,Number(m[1]),12,0,0);
 return Number.isNaN(d.getTime())?null:d
}
function weekdayIndexFromDate(d){return (d.getDay()+6)%7}
function extractWeeklyLayout(data){
 const rawLines=(data.lines||[]).filter(x=>x&&x.text&&x.bbox);
 const dateHeads=[];
 for(const line of rawLines){const d=parseOcrDate(line.text);if(d){dateHeads.push({dayIndex:weekdayIndexFromDate(d),x:(line.bbox.x0+line.bbox.x1)/2,y:line.bbox.y1,date:d})}}
 const entries=[];
 for(const line of rawLines){const client=bestClientInLine(line.text);if(!client)continue;const x=(line.bbox.x0+line.bbox.x1)/2,y=(line.bbox.y0+line.bbox.y1)/2;let dayIndex=null;
  const candidates=dateHeads.filter(h=>y>=h.y-20);
  if(candidates.length){candidates.sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x));dayIndex=candidates[0].dayIndex}
  if(dayIndex===null){const now=new Date();dayIndex=weekdayIndexFromDate(now)}
  entries.push({name:client,dayIndex,y,x})
 }
 entries.sort((a,b)=>a.dayIndex-b.dayIndex||a.y-b.y||a.x-b.x);
 return entries
}
function extractWeeklyClients(text){
 const out=[];for(const line of text.split(/\r?\n/)){const c=bestClientInLine(line);if(c)out.push(c)}return out
}
function extractDailyClients(text){
 const raw=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),norm=raw.map(normalizeMatch),out=[];
 // Στο καθημερινό Excel κάθε εγγραφή έχει την ένδειξη ΠΕΛΑΤΗΣ. Παίρνουμε μόνο
 // το όνομα που ακολουθεί, ώστε να μην αντιγράφεται ο ίδιος πελάτης από τη στήλη ΜΕΤΑΦΟΡΕΑΣ.
 for(let i=0;i<norm.length;i++){
  if(norm[i].includes('ΠΕΛΑΤ')||norm[i].includes('PELATH')){
   for(let j=i+1;j<Math.min(norm.length,i+4);j++){
    if(norm[j].includes('ΑΠΟ ΔΕΞΑΜΕΝ')||norm[j].includes('ΜΕΤΑΦΟΡΕ')||norm[j].includes('ΠΟΣΟΤΗΤ'))break;
    const c=bestClientInLine(raw[j]);if(c){out.push(c);i=j;break}
   }
  }
 }
 // Εφεδρικά, όταν το OCR δεν διάβασε τις επικεφαλίδες, κρατάμε γνωστά ονόματα
 // και αφαιρούμε μόνο διαδοχικές διπλοεγγραφές.
 if(!out.length){for(const line of raw){const c=bestClientInLine(line);if(c&&out[out.length-1]!==c)out.push(c)}}
 return out
}
function loadImageBitmapFromFile(file){
 return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{URL.revokeObjectURL(img.src);resolve(img)};img.onerror=()=>reject(new Error('Δεν μπόρεσε να ανοίξει η εικόνα.'));img.src=URL.createObjectURL(file)})
}
function makeOcrCanvas(img,rotation=0,mode='contrast'){
 const maxSide=2400,scale=Math.min(2.2,maxSide/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
 const sw=Math.max(1,Math.round((img.naturalWidth||img.width)*scale)),sh=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
 const rot=((rotation%360)+360)%360,c=document.createElement('canvas');
 c.width=(rot===90||rot===270)?sh:sw;c.height=(rot===90||rot===270)?sw:sh;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.save();
 if(rot===90){ctx.translate(c.width,0);ctx.rotate(Math.PI/2)}else if(rot===180){ctx.translate(c.width,c.height);ctx.rotate(Math.PI)}else if(rot===270){ctx.translate(0,c.height);ctx.rotate(-Math.PI/2)}
 ctx.drawImage(img,0,0,sw,sh);ctx.restore();
 if(mode!=='plain'){
  const im=ctx.getImageData(0,0,c.width,c.height),d=im.data;
  for(let i=0;i<d.length;i+=4){let g=.299*d[i]+.587*d[i+1]+.114*d[i+2];if(mode==='threshold')g=g>176?255:0;else g=Math.max(0,Math.min(255,(g-128)*1.65+128));d[i]=d[i+1]=d[i+2]=g}
  ctx.putImageData(im,0,0)
 }
 return c
}
function countRecognizedClients(text){let count=0;for(const line of String(text||'').split(/\r?\n/))if(bestClientInLine(line))count++;return count}
function ocrResultScore(result,target){
 const text=result?.data?.text||'';let score=countRecognizedClients(text)*12;
 if(target==='weekly')score+=(text.match(/\b[0-3]?\d[\/\-.][01]?\d(?:[\/\-.]\d{2,4})?/g)||[]).length*4;
 else score+=(normalizeMatch(text).match(/ΠΕΛΑΤ|PELATH/g)||[]).length*3;
 return score
}
async function recognizeBestPhoto(file,target,onProgress){
 const img=await loadImageBitmapFromFile(file),variants=[
  {rotation:0,mode:'contrast',label:'βελτίωση εικόνας'},
  {rotation:90,mode:'contrast',label:'περιστροφή 90°'},
  {rotation:270,mode:'contrast',label:'περιστροφή 270°'},
  {rotation:0,mode:'threshold',label:'έντονη αντίθεση'}
 ];
 let best=null,bestScore=-1;
 for(let i=0;i<variants.length;i++){
  const v=variants[i],canvas=makeOcrCanvas(img,v.rotation,v.mode);
  const r=await Tesseract.recognize(canvas,'ell+eng',{logger:m=>{if(m.progress)onProgress((i+m.progress)/variants.length,`${v.label}: ${m.status||'Ανάγνωση'}`)}},{tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
  const score=ocrResultScore(r,target);if(score>bestScore){best=r;bestScore=score}
  if(score>=((target==='weekly'?10:7)*12))break;
 }
 return best
}
async function runOcr(file,target){
 ocrTarget=target||'weekly';ocrPending=[];
 const dlg=document.getElementById('ocrDialog'),bar=document.getElementById('ocrBar'),msg=document.getElementById('ocrMessage'),txt=document.getElementById('ocrText'),insert=document.getElementById('insertOcrLines');
 dlg.showModal();bar.style.width='0';txt.value='';insert.textContent=ocrTarget==='daily'?'Πέρασμα πελατών στη στήλη ΠΕΛΑΤΗΣ':'Πέρασμα πελατών στις σωστές ημέρες';
 try{
  const r=await recognizeBestPhoto(file,ocrTarget,(progress,status)=>{bar.style.width=Math.round(progress*100)+'%';msg.textContent=status+' '+Math.round(progress*100)+'%'});
  if(ocrTarget==='daily'){
   const found=extractDailyClients(r.data.text);ocrPending=found.map(name=>({name}));txt.value=found.join('\n');
  }else{
   let found=extractWeeklyLayout(r.data);
   if(!found.length)found=extractWeeklyClients(r.data.text).map(name=>({name,dayIndex:weekdayIndexFromDate(new Date())}));
   ocrPending=found;const dayNames=['ΔΕΥΤΕΡΑ','ΤΡΙΤΗ','ΤΕΤΑΡΤΗ','ΠΕΜΠΤΗ','ΠΑΡΑΣΚΕΥΗ','ΣΑΒΒΑΤΟ','ΚΥΡΙΑΚΗ'];
   txt.value=found.map(x=>`${dayNames[x.dayIndex]||''}: ${x.name}`).join('\n');
  }
  bar.style.width='100%';msg.textContent=ocrPending.length?`Βρέθηκαν ${ocrPending.length} πελάτες. Έλεγξέ τους πριν το πέρασμα.`:'Δεν βρέθηκε πελάτης από τη λίστα. Δοκίμασε πιο κοντινή και ευθεία φωτογραφία.'
 }catch(e){msg.textContent='Αποτυχία: '+e.message}
}
function insertOcr(){
 if(ocrTarget==='daily'){
  const lines=(ocrPending.length?ocrPending.map(x=>x.name):document.getElementById('ocrText').value.split(/\n/).map(x=>upper(x.trim())).filter(Boolean));
  const inputs=[...document.querySelectorAll('#daily .ocr-client-input')].filter(x=>x.offsetParent!==null);let start=0;if(selectedInputs[0]&&inputs.includes(selectedInputs[0]))start=inputs.indexOf(selectedInputs[0]);let cursor=Math.max(0,start);
  for(const name of lines){while(cursor<inputs.length&&inputs[cursor].value.trim())cursor++;if(cursor>=inputs.length)break;inputs[cursor].value=name;inputs[cursor].dispatchEvent(new Event('input',{bubbles:true}));cursor++}
 }else{
  const entries=ocrPending.length?ocrPending:document.getElementById('ocrText').value.split(/\n/).map(x=>({name:upper(x.replace(/^.*?:\s*/,'')),dayIndex:weekdayIndexFromDate(new Date())})).filter(x=>x.name);
  const k=weekKey();state.weekly[k]=normalizeWeekly(state.weekly[k]);
  const grouped=Array.from({length:7},()=>[]);for(const e of entries){if(e.name)grouped[Math.max(0,Math.min(6,Number(e.dayIndex)||0))].push(e.name)}
  for(let day=0;day<7;day++)for(const name of grouped[day]){let placed=false;for(const section of ['hypochlorite','hydrochloric','brine']){for(let r=0;r<state.weekly[k][section].length;r++){if(!state.weekly[k][section][r][day]){state.weekly[k][section][r][day]=name;addClientToList(name);placed=true;break}}if(placed)break}}
  renderWeekly();
 }
 save();document.getElementById('ocrDialog').close()
}
async function copySelectedCell(){
 const input=selectedInputs[0];if(!input){alert('Πάτησε πρώτα σε ένα κελί.');return}
 try{await navigator.clipboard.writeText(input.value||'');setStatus('Αντιγράφηκε το κελί','online')}catch{input.focus();input.select();document.execCommand('copy');setStatus('Αντιγράφηκε το κελί','online')}
}
async function pasteSelectedCell(){
 const input=selectedInputs[0];if(!input){alert('Πάτησε πρώτα σε ένα κελί.');return}
 try{const text=await navigator.clipboard.readText();input.value=upper(text.replace(/\r?\n+/g,' ').trim());input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();setStatus('Έγινε επικόλληση','online')}
 catch{alert('Ο browser δεν επέτρεψε αυτόματη επικόλληση. Κράτησε πατημένο το κελί και επίλεξε «Επικόλληση».')}
}
function bindClipboardButtons(){document.querySelectorAll('[data-copy-cell]').forEach(b=>b.onclick=copySelectedCell);document.querySelectorAll('[data-paste-cell]').forEach(b=>b.onclick=pasteSelectedCell)}
function bind(){bindTabs();bindClipboardButtons();
 fillConnectionSettings();
 const urlInput=document.getElementById('settingsSupabaseUrl'),keyInput=document.getElementById('settingsSupabaseKey');
 document.getElementById('toggleSupabaseKey').onclick=()=>{const hidden=keyInput.type==='password';keyInput.type=hidden?'text':'password';document.getElementById('toggleSupabaseKey').textContent=hidden?'Απόκρυψη':'Εμφάνιση'};
 document.getElementById('saveConnectionSettings').onclick=async()=>{storeConnectionSettings(urlInput.value,keyInput.value);setConnectionResult('Έλεγχος σύνδεσης…','testing');await initSharedSync(true)};
 document.getElementById('testConnection').onclick=async()=>{storeConnectionSettings(urlInput.value,keyInput.value);setConnectionResult('Έλεγχος σύνδεσης…','testing');await initSharedSync(true)};
 document.getElementById('resetConnectionSettings').onclick=async()=>{storeConnectionSettings(DEFAULT_SUPABASE_URL,DEFAULT_SUPABASE_PUBLISHABLE_KEY);fillConnectionSettings();setConnectionResult('Έγινε επαναφορά. Έλεγχος σύνδεσης…','testing');await initSharedSync(true)};
 document.getElementById('weekStart').onchange=e=>{
  const oldKey=weekKey();
  const currentWeekly=normalizeWeekly(state.weekly[oldKey]);
  const currentDone=normalizeDone(state.weeklyDone[oldKey]);
  const newKey=e.target.value||mondayOfToday();
  // Η αλλαγή ημερομηνιών αλλάζει μόνο τις επικεφαλίδες.
  // Τα δεδομένα που φαίνονται παραμένουν ακριβώς ίδια.
  state.weekly[newKey]=JSON.parse(JSON.stringify(currentWeekly));
  state.weeklyDone[newKey]=JSON.parse(JSON.stringify(currentDone));
  state.weekStart=newKey;
  renderWeekly();save()
};document.getElementById('dailyDate').onchange=e=>{state.dailyDate=e.target.value;renderDaily();save()};document.getElementById('sequenceDate').onchange=e=>{state.sequenceDate=e.target.value;renderSequence();save()};
 document.getElementById('weeklyCameraBtn').onclick=()=>document.getElementById('weeklyCamera').click();
 document.getElementById('weeklyGalleryBtn').onclick=()=>document.getElementById('weeklyGallery').click();
 document.getElementById('dailyCameraBtn').onclick=()=>document.getElementById('dailyCamera').click();
 document.getElementById('dailyGalleryBtn').onclick=()=>document.getElementById('dailyGallery').click();
 const bindPhotoInput=(id,target)=>{document.getElementById(id).onchange=e=>{const file=e.target.files&&e.target.files[0];if(file)runOcr(file,target);e.target.value=''}};
 bindPhotoInput('weeklyCamera','weekly');bindPhotoInput('weeklyGallery','weekly');bindPhotoInput('dailyCamera','daily');bindPhotoInput('dailyGallery','daily');
 document.getElementById('insertOcrLines').onclick=insertOcr;document.getElementById('copyOcr').onclick=()=>navigator.clipboard.writeText(document.getElementById('ocrText').value);
 document.getElementById('addDailyRow').onclick=()=>{state.daily[dayKey()].push(Array(7).fill(''));renderDaily();save()};document.getElementById('addSequenceRow').onclick=()=>{state.sequence[seqKey()].push(Array(6).fill(''));renderSequence();save()};
 document.getElementById('clearWeekly').onclick=()=>{if(confirm('Να καθαριστεί η εβδομάδα;')){delete state.weekly[weekKey()];delete state.weeklyDone[weekKey()];renderWeekly();save()}};document.getElementById('clearDaily').onclick=()=>{if(confirm('Να καθαριστεί το καθημερινό;')){state.daily[dayKey()]=blankDaily();renderDaily();save()}};document.getElementById('clearSequence').onclick=()=>{if(confirm('Να καθαριστεί η σειρά φορτώσεων;')){state.sequence[seqKey()]=blankSequence();renderSequence();save()}};
 document.getElementById('saveLists').onclick=()=>saveLists(true);for(const k of ['clients','tanks','carriers','other'])document.getElementById(k+'List').addEventListener('input',e=>{const p=e.target.selectionStart;e.target.value=upper(e.target.value);try{e.target.setSelectionRange(p,p)}catch{}autoLists()});
 document.getElementById('exportData').onclick=()=>{const b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='programma-fortoseon-backup.json';a.click();URL.revokeObjectURL(a.href)};document.getElementById('importData').onchange=async e=>{try{state=JSON.parse(await e.target.files[0].text());save();location.reload()}catch{alert('Μη έγκυρο αρχείο.')}};document.getElementById('eraseAll').onclick=()=>{if(confirm('Οριστική διαγραφή όλων των δεδομένων;')){[KEY,...OLD_KEYS].forEach(k=>localStorage.removeItem(k));location.reload()}};
 window.addEventListener('pagehide',()=>saveLists(false));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveLists(false)})
}
state.weekStart=state.weekStart||mondayOfToday();state.dailyDate=state.dailyDate||iso(new Date());state.sequenceDate=state.sequenceDate||iso(new Date());bind();initLists();renderWeekly();renderDaily();renderSequence();localStorage.setItem(KEY,JSON.stringify(state));initSharedSync();
// Αφαιρεί παλιό service worker/cache ώστε το GitHub Pages να φορτώνει πάντα τη νεότερη έκδοση.
if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});}
if('caches' in window){caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).catch(()=>{});}
