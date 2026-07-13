const KEY='loadingPlanner.v3', OLD_KEYS=['loadingPlanner.v2','loadingPlanner.v1'];
const WEEK_PRODUCT_SECTIONS=[
 {key:'hypochlorite',label:'ΥΠΟΧΛΩΡΙΩΔΕΣ ΝΑΤΡΙΟ',rows:15,cls:'product-hypochlorite'},
 {key:'hydrochloric',label:'ΥΔΡΟΧΛΩΡΙΚΟ ΟΞΥ',rows:2,cls:'product-hydrochloric'},
 {key:'brine',label:'ΑΛΜΗ',rows:2,cls:'product-brine'},
 {key:'salt',label:'ΑΛΑΤΙ',rows:2,cls:'product-salt'}
];
const DAILY_HEADERS=['#','ΠΕΛΑΤΗΣ','ΑΠΟ ΔΕΞΑΜΕΝΗ','ΜΕΤΑΦΟΡΕΑΣ','ΠΟΣΟΤΗΤΑ','ΗΜ/ΝΙΑ - ΒΑΡΔΙΑ','ΩΡΑ ΦΟΡΤΩΣΗΣ','ΥΠΕΥΘΥΝΟΣ ΦΟΡΤΩΣΗΣ'];
const SEQUENCE_HEADERS=['#','ΔΕΞΑΜΕΝΗ','ΑΡΧΙΚΗ ΣΤΑΘΜΗ','ΤΕΛΙΚΗ ΣΤΑΘΜΗ','ΕΝΕΡΓΑ','ΣΟΔΑ','ΟΛΟΚΛΗΡΩΘΗΚΕ'];
const SALT_OPTIONS=['ΕΛΛΗΝΙΚΕΣ ΑΛΥΚΕΣ','ΔΑΚΑΡΙΔΗΣ'];
let state=loadState(), selectedInputs=[], ocrTarget='weekly';

function defaultState(){return {weekStart:'',weekly:{},weeklyDone:{},dailyDate:'',daily:{},sequenceDate:'',sequence:{},lists:{clients:['UNILEVER','ΚΩΝΣΤΑΝΤΙΝΙΔΗΣ','ΙΝΤΕΡΚΑΠΑ','LUBRICO','ΕΥΡΩΧΑΡΤΙΚΗ','ECOLAB','COLGATE','ΟΞΕΑ','FERI TRI','ALINDA'],tanks:['Δ1','Δ2','Ζ1','Ζ2','Ζ3','Α2','Α3','Α4'],carriers:[],other:[]}}}
function loadState(){try{let raw=localStorage.getItem(KEY);if(!raw)for(const k of OLD_KEYS){raw=localStorage.getItem(k);if(raw)break}const p=raw?JSON.parse(raw):{},b=defaultState();return {...b,...p,lists:{...b.lists,...(p.lists||{})},weeklyDone:p.weeklyDone||{},sequence:p.sequence||{}}}catch{return defaultState()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));const s=document.getElementById('saveStatus');if(s)s.textContent='Αποθηκεύτηκε '+new Date().toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'})}
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
function makeInput(value,onChange,classes='',listKey=null,withPicker=false){
 const wrap=document.createElement('div');wrap.className='autocomplete-wrap'+(withPicker?'':' no-picker');
 const input=document.createElement('input');input.type='text';input.className='cell-input '+classes;input.dataset.listKey=listKey||'';input.value=upper(value);input.autocomplete='off';input.autocapitalize='characters';input.spellcheck=false;
 const preview=document.createElement('div');preview.className='inline-preview';const menu=document.createElement('div');menu.className='inline-suggestions';
 function close(){menu.classList.remove('open');menu.innerHTML='';preview.textContent=''}
 function open(showAll=false){if(!listKey)return;const hits=matches(input.value,listKey,showAll);menu.innerHTML='';preview.textContent=hits[0]&&upper(input.value)!==hits[0]?hits[0]:'';for(const hit of hits){const b=document.createElement('button');b.type='button';b.textContent=hit;b.onpointerdown=e=>{e.preventDefault();input.value=hit;onChange(hit);save();close();input.focus()};menu.appendChild(b)}menu.classList.toggle('open',hits.length>0)}
 input.addEventListener('input',()=>{const pos=input.selectionStart,v=upper(input.value);input.value=v;try{input.setSelectionRange(pos,pos)}catch{}onChange(v);autosave();open(false)});
 input.addEventListener('focus',()=>{selectCell(input);open(false)}); input.addEventListener('click',()=>open(false));
 input.addEventListener('keydown',e=>{if(e.key==='Tab'&&preview.textContent){e.preventDefault();input.value=preview.textContent;onChange(input.value);save();close()}else if(e.key==='Escape')close()});
 input.addEventListener('blur',()=>setTimeout(close,180));wrap.append(input,preview);
 if(withPicker){const p=document.createElement('button');p.type='button';p.className='picker-button';p.textContent='▾';p.onpointerdown=e=>e.preventDefault();p.onclick=()=>{input.focus();open(true)};wrap.appendChild(p)}
 wrap.appendChild(menu);return {wrap,input}
}
function weeklyTotal(){const w=state.weekly[weekKey()]||blankWeekly();return WEEK_PRODUCT_SECTIONS.reduce((t,s)=>t+w[s.key].flat().filter(Boolean).length,0)}
function updateWeekTotal(){document.getElementById('weekTotal').textContent='ΣΥΝΟΛΟ ΒΥΤΙΩΝ: '+weeklyTotal()}
function renderWeekly(){
 const start=new Date((state.weekStart||mondayOfToday())+'T12:00:00');state.weekStart=iso(start);document.getElementById('weekStart').value=state.weekStart;const k=weekKey();state.weekly[k]=normalizeWeekly(state.weekly[k]);state.weeklyDone[k]=normalizeDone(state.weeklyDone[k]);
 const days=document.getElementById('weeklyDays');days.innerHTML='<th class="row-label">ΠΡΟΪΟΝ / ΘΕΣΗ</th>';const names=['ΔΕΥΤΕΡΑ','ΤΡΙΤΗ','ΤΕΤΑΡΤΗ','ΠΕΜΠΤΗ','ΠΑΡΑΣΚΕΥΗ','ΣΑΒΒΑΤΟ','ΚΥΡΙΑΚΗ'];const end=new Date(start);end.setDate(end.getDate()+6);document.getElementById('weekRange').textContent=fmt(start)+' – '+fmt(end);
 names.forEach((n,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);const th=document.createElement('th');th.dataset.day=i;th.innerHTML=`${fmt(d)}<br><strong>${n}</strong>`;days.appendChild(th)});
 const body=document.getElementById('weeklyBody');body.innerHTML='';WEEK_PRODUCT_SECTIONS.forEach(s=>{const h=document.createElement('tr');h.className='weekly-product-header '+s.cls;const th=document.createElement('th');th.className='row-label';th.textContent=s.label;h.appendChild(th);for(let c=0;c<7;c++){const td=document.createElement('td');td.dataset.day=c;td.textContent=s.label;h.appendChild(td)}body.appendChild(h);
 for(let r=0;r<s.rows;r++){const tr=document.createElement('tr');tr.className='weekly-entry-row '+s.cls;const num=document.createElement('th');num.className='row-label entry-number';num.textContent=r+1;tr.appendChild(num);for(let c=0;c<7;c++){const td=document.createElement('td');td.dataset.day=c;const x=makeInput(state.weekly[k][s.key][r][c],v=>{state.weekly[k][s.key][r][c]=v;updateWeekTotal()},'ocr-client-input',s.key==='salt'?'salt':'clients',true);const outer=document.createElement('div');outer.className='entry-with-check';const check=document.createElement('label');check.className='done-check';const cb=document.createElement('input');cb.type='checkbox';cb.checked=state.weeklyDone[k][s.key][r][c];const mark=document.createElement('span');mark.textContent='✓';cb.onchange=()=>{state.weeklyDone[k][s.key][r][c]=cb.checked;outer.classList.toggle('completed',cb.checked);save()};check.append(cb,mark);outer.append(x.wrap,check);outer.classList.toggle('completed',cb.checked);td.appendChild(outer);tr.appendChild(td)}body.appendChild(tr)}});updateWeekTotal()
}
function normalizeRows(rows,count){const out=Array.isArray(rows)?rows:[];return out.map(r=>Array.from({length:count},(_,i)=>upper(r?.[i]||'')))}
function renderDaily(){state.dailyDate=state.dailyDate||iso(new Date());document.getElementById('dailyDate').value=state.dailyDate;const k=dayKey();if(!state.daily[k])state.daily[k]=blankDaily();state.daily[k]=normalizeRows(state.daily[k],7);const head=document.getElementById('dailyHead');head.innerHTML='';DAILY_HEADERS.forEach(h=>{const th=document.createElement('th');th.textContent=h;head.appendChild(th)});const body=document.getElementById('dailyBody');body.innerHTML='';state.daily[k].forEach((row,ri)=>{const tr=document.createElement('tr');const n=document.createElement('th');n.textContent=ri+1;tr.appendChild(n);row.forEach((v,ci)=>{const td=document.createElement('td');const keys=['clients','tanks','carriers',null,null,null,'other'],key=keys[ci];const x=makeInput(v,val=>state.daily[k][ri][ci]=val,(ci===0?'ocr-client-input ':'')+(ci===3&&/24|25/.test(v)?'yellow':''),key,!!key);td.appendChild(x.wrap);tr.appendChild(td)});body.appendChild(tr)})}
function renderSequence(){state.sequenceDate=state.sequenceDate||iso(new Date());document.getElementById('sequenceDate').value=state.sequenceDate;const k=seqKey();if(!state.sequence[k])state.sequence[k]=blankSequence();state.sequence[k]=normalizeRows(state.sequence[k],6);const head=document.getElementById('sequenceHead');head.innerHTML='';SEQUENCE_HEADERS.forEach(h=>{const th=document.createElement('th');th.textContent=h;head.appendChild(th)});const body=document.getElementById('sequenceBody');body.innerHTML='';state.sequence[k].forEach((row,ri)=>{const tr=document.createElement('tr');if(row[5]==='ΝΑΙ')tr.classList.add('completed-row');const n=document.createElement('th');n.textContent=ri+1;tr.appendChild(n);row.forEach((v,ci)=>{const td=document.createElement('td');if(ci===5){const lab=document.createElement('label');lab.className='sequence-complete';const cb=document.createElement('input');cb.type='checkbox';cb.checked=v==='ΝΑΙ';cb.onchange=()=>{state.sequence[k][ri][ci]=cb.checked?'ΝΑΙ':'';tr.classList.toggle('completed-row',cb.checked);save()};lab.appendChild(cb);td.appendChild(lab)}else{const key=ci===0?'tanks':null;const x=makeInput(v,val=>state.sequence[k][ri][ci]=val,'',key,!!key);td.appendChild(x.wrap)}tr.appendChild(td)});body.appendChild(tr)})}
function initLists(){for(const k of ['clients','tanks','carriers','other']){state.lists[k]=[...new Set((state.lists[k]||[]).map(upper).filter(Boolean))];document.getElementById(k+'List').value=state.lists[k].join('\n')}}
function saveLists(show=false){for(const k of ['clients','tanks','carriers','other'])state.lists[k]=[...new Set(document.getElementById(k+'List').value.split(/\r?\n/).map(x=>upper(x.trim())).filter(Boolean))];save();if(show)alert('Οι λίστες αποθηκεύτηκαν.')}
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
async function runOcr(file,target){
 ocrTarget=target||'weekly';
 const dlg=document.getElementById('ocrDialog'),bar=document.getElementById('ocrBar'),msg=document.getElementById('ocrMessage'),txt=document.getElementById('ocrText'),insert=document.getElementById('insertOcrLines');
 dlg.showModal();bar.style.width='0';txt.value='';insert.textContent=ocrTarget==='daily'?'Πέρασμα πελατών στη στήλη ΠΕΛΑΤΗΣ':'Πέρασμα πελατών στα εβδομαδιαία κελιά';
 try{const r=await Tesseract.recognize(file,'ell+eng',{logger:m=>{if(m.progress){bar.style.width=Math.round(m.progress*100)+'%';msg.textContent=(m.status||'Ανάγνωση')+' '+Math.round(m.progress*100)+'%'}}});
  const found=ocrTarget==='daily'?extractDailyClients(r.data.text):extractWeeklyClients(r.data.text);
  txt.value=found.join('\n');msg.textContent=found.length?`Βρέθηκαν ${found.length} πελάτες. Θα συμπληρωθούν μόνο τα πεδία ΠΕΛΑΤΗΣ.`:'Δεν βρέθηκε πελάτης από τη λίστα.'
 }catch(e){msg.textContent='Αποτυχία: '+e.message}
}
function insertOcr(){
 const lines=document.getElementById('ocrText').value.split(/\n/).map(x=>upper(x.trim())).filter(Boolean);
 const section=document.getElementById(ocrTarget==='daily'?'daily':'weekly');
 const inputs=[...section.querySelectorAll('.ocr-client-input')].filter(x=>x.offsetParent!==null);
 let start=0;
 if(selectedInputs[0]&&inputs.includes(selectedInputs[0]))start=inputs.indexOf(selectedInputs[0]);
 // Δεν αγγίζουμε δεξαμενή, μεταφορέα, ποσότητα, βάρδια, ώρα ή υπεύθυνο.
 // Από το επιλεγμένο κελί και μετά συμπληρώνουμε τα επόμενα κενά πεδία πελάτη.
 let cursor=Math.max(0,start);
 for(const name of lines){
  while(cursor<inputs.length&&inputs[cursor].value.trim())cursor++;
  if(cursor>=inputs.length)break;
  inputs[cursor].value=name;inputs[cursor].dispatchEvent(new Event('input',{bubbles:true}));cursor++;
 }
 save();document.getElementById('ocrDialog').close()
}
function bind(){bindTabs();
 document.getElementById('weekStart').onchange=e=>{state.weekStart=e.target.value;renderWeekly();save()};document.getElementById('dailyDate').onchange=e=>{state.dailyDate=e.target.value;renderDaily();save()};document.getElementById('sequenceDate').onchange=e=>{state.sequenceDate=e.target.value;renderSequence();save()};
 document.getElementById('weeklyPhotoBtn').onclick=()=>document.getElementById('weeklyPhoto').click();document.getElementById('dailyPhotoBtn').onclick=()=>document.getElementById('dailyPhoto').click();document.getElementById('weeklyPhoto').onchange=e=>{if(e.target.files[0])runOcr(e.target.files[0],'weekly');e.target.value=''};document.getElementById('dailyPhoto').onchange=e=>{if(e.target.files[0])runOcr(e.target.files[0],'daily');e.target.value=''};
 document.getElementById('insertOcrLines').onclick=insertOcr;document.getElementById('copyOcr').onclick=()=>navigator.clipboard.writeText(document.getElementById('ocrText').value);
 document.getElementById('addDailyRow').onclick=()=>{state.daily[dayKey()].push(Array(7).fill(''));renderDaily();save()};document.getElementById('addSequenceRow').onclick=()=>{state.sequence[seqKey()].push(Array(6).fill(''));renderSequence();save()};
 document.getElementById('clearWeekly').onclick=()=>{if(confirm('Να καθαριστεί η εβδομάδα;')){delete state.weekly[weekKey()];delete state.weeklyDone[weekKey()];renderWeekly();save()}};document.getElementById('clearDaily').onclick=()=>{if(confirm('Να καθαριστεί το καθημερινό;')){state.daily[dayKey()]=blankDaily();renderDaily();save()}};document.getElementById('clearSequence').onclick=()=>{if(confirm('Να καθαριστεί η σειρά φορτώσεων;')){state.sequence[seqKey()]=blankSequence();renderSequence();save()}};
 document.getElementById('saveLists').onclick=()=>saveLists(true);for(const k of ['clients','tanks','carriers','other'])document.getElementById(k+'List').addEventListener('input',e=>{const p=e.target.selectionStart;e.target.value=upper(e.target.value);try{e.target.setSelectionRange(p,p)}catch{}autoLists()});
 document.getElementById('exportData').onclick=()=>{const b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='programma-fortoseon-backup.json';a.click();URL.revokeObjectURL(a.href)};document.getElementById('importData').onchange=async e=>{try{state=JSON.parse(await e.target.files[0].text());save();location.reload()}catch{alert('Μη έγκυρο αρχείο.')}};document.getElementById('eraseAll').onclick=()=>{if(confirm('Οριστική διαγραφή όλων των δεδομένων;')){[KEY,...OLD_KEYS].forEach(k=>localStorage.removeItem(k));location.reload()}};
 window.addEventListener('pagehide',()=>saveLists(false));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveLists(false)})
}
state.weekStart=state.weekStart||mondayOfToday();state.dailyDate=state.dailyDate||iso(new Date());state.sequenceDate=state.sequenceDate||iso(new Date());bind();initLists();renderWeekly();renderDaily();renderSequence();save();if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
