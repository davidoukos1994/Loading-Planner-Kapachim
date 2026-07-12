const KEY='loadingPlanner.v1';
const WEEK_SECTIONS=[
  {label:'ΥΠΟΧΡΕΩΣΕΙΣ ΝΑΥΠΛΙΟ',rows:1,cls:'redtext'},
  {label:'ΦΟΡΤΩΣΕΙΣ / ΠΕΛΑΤΕΣ',rows:1},
  {label:'ΣΥΝΟΛΟ ΥΠΟΧΡΕΩΣΕΩΝ',rows:1,compact:true},
  {label:'ΔΕΞΑΜΕΝΕΣ / ΠΡΟΪΟΝ',rows:1,compact:true},
  {label:'ΛΟΙΠΕΣ ΦΟΡΤΩΣΕΙΣ',rows:1,compact:true},
  {label:'ΠΕΤΡΕΛΑΙΑ / ΛΟΙΠΑ',rows:1,compact:true,totals:true}
];
const DAILY_HEADERS=['#','ΠΡΟΓΡΑΜΜΑ','ΗΜΕΡΟΜΗΝΙΑ','ΒΑΡΔΙΑ / ΔΕΞΑΜΕΝΗ','ΠΕΛΑΤΗΣ','ΠΡΟΪΟΝ / ΔΕΞΑΜΕΝΗ','ΠΟΣΟΤΗΤΑ','ΩΡΑ / ΒΑΡΔΙΑ','ΜΕΤΑΦΟΡΕΑΣ','ΠΑΡΑΤΗΡΗΣΗ'];
let state=loadState(); let selectedInputs=[]; let ocrTarget='weekly';
function blankDaily(){return Array.from({length:16},()=>Array(DAILY_HEADERS.length-1).fill(''));}
function defaultState(){return {weekStart:'',weekly:{},dailyDate:'',daily:{},lists:{clients:['UNILEVER','ΚΩΝΣΤΑΝΤΙΝΙΔΗΣ','INTERSTAR','LUBRICO','ΕΥΡΩΧΑΡΤΙΚΗ'],tanks:['Δ1','Δ2','Ζ1','Ζ2','Α2','Α3','Α4'],carriers:['ΠΕΡΓΑΜΟΣ','ΠΑΝΑΓΙΩΤΗΣ','ΔΗΜΑ'],other:['ΝΑΥΠΛΙΟ','ΠΟΣΟΤΗΤΑ','24tn','25tn']}}}
function loadState(){try{return Object.assign(defaultState(),JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{return defaultState();}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));const s=document.getElementById('saveStatus');s.textContent='Αποθηκεύτηκε '+new Date().toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'});}
function debounce(fn,ms=250){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}} const autosave=debounce(save);
function iso(d){return d.toISOString().slice(0,10)}
function mondayOfToday(){const d=new Date();const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return iso(d)}
function fmt(d){return new Intl.DateTimeFormat('el-GR',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(d)}
function weekKey(){return state.weekStart||mondayOfToday()}
function dayKey(){return state.dailyDate||iso(new Date())}
function makeInput(value,oninput,classes=''){const ta=document.createElement('textarea');ta.className='cell-input '+classes;ta.value=value||'';ta.setAttribute('list','autocomplete');ta.autocomplete='off';ta.addEventListener('input',e=>{oninput(e.target.value);autosave();showSuggestions(e.target)});ta.addEventListener('focus',()=>selectCell(ta));ta.addEventListener('click',()=>selectCell(ta));return ta}
function selectCell(el){document.querySelectorAll('.selected-cell').forEach(x=>x.classList.remove('selected-cell'));el.parentElement.classList.add('selected-cell');selectedInputs=[el]}
function renderWeekly(){const start=new Date((state.weekStart||mondayOfToday())+'T12:00:00');state.weekStart=iso(start);document.getElementById('weekStart').value=state.weekStart;const wk=weekKey();if(!state.weekly[wk])state.weekly[wk]=WEEK_SECTIONS.map(()=>Array(7).fill(''));
 const days=document.getElementById('weeklyDays');days.innerHTML='<th class="row-label">ΗΜΕΡΑ</th>';const names=['ΔΕΥΤΕΡΑ','ΤΡΙΤΗ','ΤΕΤΑΡΤΗ','ΠΕΜΠΤΗ','ΠΑΡΑΣΚΕΥΗ','ΣΑΒΒΑΤΟ','ΚΥΡΙΑΚΗ'];
 const end=new Date(start);end.setDate(end.getDate()+6);document.getElementById('weekRange').textContent=fmt(start)+' – '+fmt(end);
 names.forEach((n,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);const th=document.createElement('th');th.innerHTML=`${fmt(d)}<br><strong>${n}</strong>`;days.appendChild(th)});
 const body=document.getElementById('weeklyBody');body.innerHTML='';WEEK_SECTIONS.forEach((sec,r)=>{const tr=document.createElement('tr');if(sec.compact)tr.classList.add('compact');if(sec.totals)tr.classList.add('totals');const th=document.createElement('th');th.className='row-label';th.textContent=sec.label;tr.appendChild(th);for(let c=0;c<7;c++){const td=document.createElement('td');td.appendChild(makeInput(state.weekly[wk][r][c],v=>state.weekly[wk][r][c]=v,sec.cls||''));tr.appendChild(td)}body.appendChild(tr)});updateAutocomplete();}
function renderDaily(){state.dailyDate=state.dailyDate||iso(new Date());document.getElementById('dailyDate').value=state.dailyDate;const dk=dayKey();if(!state.daily[dk])state.daily[dk]=blankDaily();const head=document.getElementById('dailyHead');head.innerHTML='';DAILY_HEADERS.forEach(h=>{const th=document.createElement('th');th.textContent=h;head.appendChild(th)});const body=document.getElementById('dailyBody');body.innerHTML='';state.daily[dk].forEach((row,ri)=>{const tr=document.createElement('tr');const num=document.createElement('th');num.textContent=ri+1;tr.appendChild(num);row.forEach((val,ci)=>{const td=document.createElement('td');const cls=(ci===6&&/24|25/.test(val))?'yellow':'';td.appendChild(makeInput(val,v=>state.daily[dk][ri][ci]=v,cls));tr.appendChild(td)});body.appendChild(tr)});updateAutocomplete();}
function updateAutocomplete(){const all=Object.values(state.lists).flat().filter(Boolean);const dl=document.getElementById('autocomplete');dl.innerHTML='';[...new Set(all.map(x=>x.trim()).filter(Boolean))].sort().forEach(x=>{const o=document.createElement('option');o.value=x;dl.appendChild(o)})}
function showSuggestions(el){const q=el.value.trim().toUpperCase();if(q.length<2)return;const all=Object.values(state.lists).flat();const hit=all.find(x=>x.toUpperCase().startsWith(q)||distance(x.toUpperCase(),q)<=1);if(hit&&hit.toUpperCase()!==q)el.title='Πρόταση: '+hit}
function distance(a,b){if(Math.abs(a.length-b.length)>1)return 99;let d=0,i=0,j=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}d++;if(d>1)return d;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++}}return d+(i<a.length||j<b.length?1:0)}
function bindTabs(){document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab,.view').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.view).classList.add('active')})}
async function runOcr(file,target){ocrTarget=target;const dlg=document.getElementById('ocrDialog');dlg.showModal();const bar=document.getElementById('ocrBar'),msg=document.getElementById('ocrMessage'),txt=document.getElementById('ocrText');bar.style.width='0';txt.value='';msg.textContent='Φόρτωση μηχανής OCR…';try{const result=await Tesseract.recognize(file,'ell+eng',{logger:m=>{if(m.progress){bar.style.width=Math.round(m.progress*100)+'%';msg.textContent=(m.status||'Ανάγνωση')+' '+Math.round(m.progress*100)+'%'}}});txt.value=cleanOcr(result.data.text);msg.textContent='Ολοκληρώθηκε — έλεγξε το κείμενο.';bar.style.width='100%'}catch(e){msg.textContent='Η ανάγνωση απέτυχε: '+e.message}}
function cleanOcr(t){return t.split(/\r?\n/).map(x=>x.trim().replace(/\s{2,}/g,' ')).filter(x=>x.length>1).join('\n')}
function insertOcr(){const lines=document.getElementById('ocrText').value.split(/\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return;const active=document.querySelector('.view.active');let inputs=[...active.querySelectorAll('.cell-input')];let start=selectedInputs[0]?inputs.indexOf(selectedInputs[0]):0;if(start<0)start=0;lines.forEach((line,i)=>{const el=inputs[start+i];if(el){el.value=line;el.dispatchEvent(new Event('input',{bubbles:true}))}});save();document.getElementById('ocrDialog').close();}
function initLists(){for(const k of ['clients','tanks','carriers','other'])document.getElementById(k+'List').value=(state.lists[k]||[]).join('\n')}
function bind(){bindTabs();document.getElementById('weekStart').onchange=e=>{state.weekStart=e.target.value;renderWeekly();save()};document.getElementById('dailyDate').onchange=e=>{state.dailyDate=e.target.value;renderDaily();save()};
 document.getElementById('weeklyPhotoBtn').onclick=()=>document.getElementById('weeklyPhoto').click();document.getElementById('dailyPhotoBtn').onclick=()=>document.getElementById('dailyPhoto').click();document.getElementById('weeklyPhoto').onchange=e=>e.target.files[0]&&runOcr(e.target.files[0],'weekly');document.getElementById('dailyPhoto').onchange=e=>e.target.files[0]&&runOcr(e.target.files[0],'daily');
 document.getElementById('insertOcrLines').onclick=insertOcr;document.getElementById('copyOcr').onclick=()=>navigator.clipboard.writeText(document.getElementById('ocrText').value);
 document.getElementById('addDailyRow').onclick=()=>{state.daily[dayKey()].push(Array(DAILY_HEADERS.length-1).fill(''));renderDaily();save()};
 document.getElementById('clearWeekly').onclick=()=>{if(confirm('Να καθαριστεί ολόκληρη η εβδομάδα;')){delete state.weekly[weekKey()];renderWeekly();save()}};document.getElementById('clearDaily').onclick=()=>{if(confirm('Να καθαριστεί το καθημερινό πρόγραμμα;')){state.daily[dayKey()]=blankDaily();renderDaily();save()}};
 document.getElementById('saveLists').onclick=()=>{for(const k of ['clients','tanks','carriers','other'])state.lists[k]=document.getElementById(k+'List').value.split(/\n/).map(x=>x.trim()).filter(Boolean);updateAutocomplete();save();alert('Οι λίστες αποθηκεύτηκαν.')};
 document.getElementById('exportData').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='programma-fortoseon-backup.json';a.click();URL.revokeObjectURL(a.href)};
 document.getElementById('importData').onchange=async e=>{try{state=JSON.parse(await e.target.files[0].text());save();location.reload()}catch{alert('Μη έγκυρο αρχείο.')}};
 document.getElementById('eraseAll').onclick=()=>{if(confirm('Οριστική διαγραφή όλων των δεδομένων από αυτή τη συσκευή;')){localStorage.removeItem(KEY);location.reload()}};
}
state.weekStart=state.weekStart||mondayOfToday();state.dailyDate=state.dailyDate||iso(new Date());bind();initLists();renderWeekly();renderDaily();save();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
