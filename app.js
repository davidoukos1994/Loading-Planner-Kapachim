const KEY='loadingPlanner.v2';
const LEGACY_KEY='loadingPlanner.v1';
const WEEK_PRODUCT_SECTIONS=[
  {key:'hypochlorite',label:'ΥΠΟΧΛΩΡΙΩΔΕΣ ΝΑΤΡΙΟ',rows:15,cls:'product-hypochlorite'},
  {key:'hydrochloric',label:'ΥΔΡΟΧΛΩΡΙΚΟ ΟΞΥ',rows:2,cls:'product-hydrochloric'},
  {key:'brine',label:'ΑΛΜΗ',rows:2,cls:'product-brine'},
  {key:'salt',label:'ΑΛΑΤΙ',rows:2,cls:'product-salt'}
];
const WEEK_ROW_LAYOUT=WEEK_PRODUCT_SECTIONS.flatMap(section=>[
  {type:'header',section},
  ...Array.from({length:section.rows},(_,index)=>({type:'entry',section,index}))
]);
const DAILY_HEADERS=['#','ΠΡΟΓΡΑΜΜΑ','ΗΜΕΡΟΜΗΝΙΑ','ΒΑΡΔΙΑ / ΔΕΞΑΜΕΝΗ','ΠΕΛΑΤΗΣ','ΠΡΟΪΟΝ / ΔΕΞΑΜΕΝΗ','ΠΟΣΟΤΗΤΑ','ΩΡΑ / ΒΑΡΔΙΑ','ΜΕΤΑΦΟΡΕΑΣ','ΠΑΡΑΤΗΡΗΣΗ'];
const SALT_OPTIONS=['ΕΛΛΗΝΙΚΕΣ ΑΛΥΚΕΣ','ΔΑΚΑΡΙΔΗΣ'];
let state=loadState();
let selectedInputs=[];
let activeSuggestionInput=null;
let suggestionIndex=-1;

function blankDaily(){return Array.from({length:16},()=>Array(DAILY_HEADERS.length-1).fill(''));}
function defaultState(){return {weekStart:'',weekly:{},weeklyDone:{},dailyDate:'',daily:{},mobileDay:0,lists:{clients:['UNILEVER','ΚΩΝΣΤΑΝΤΙΝΙΔΗΣ','INTERSTAR','LUBRICO','ΕΥΡΩΧΑΡΤΙΚΗ'],tanks:['Δ1','Δ2','Ζ1','Ζ2','Α2','Α3','Α4'],carriers:['ΠΕΡΓΑΜΟΣ','ΠΑΝΑΓΙΩΤΗΣ','ΔΗΜΑ'],other:['ΝΑΥΠΛΙΟ','ΠΟΣΟΤΗΤΑ','24TN','25TN']}}}
function loadState(){
  try{
    const raw=localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY)||'{}';
    const parsed=JSON.parse(raw);
    const base=defaultState();
    return {...base,...parsed,lists:{...base.lists,...(parsed.lists||{})},weeklyDone:parsed.weeklyDone||{}};
  }catch{return defaultState();}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state));const s=document.getElementById('saveStatus');s.textContent='Αποθηκεύτηκε '+new Date().toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'});}
function debounce(fn,ms=250){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}
const autosave=debounce(save);
function upper(v){return (v||'').toLocaleUpperCase('el-GR');}
function iso(d){return d.toISOString().slice(0,10)}
function mondayOfToday(){const d=new Date();const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return iso(d)}
function fmt(d){return new Intl.DateTimeFormat('el-GR',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(d)}
function weekKey(){return state.weekStart||mondayOfToday()}
function dayKey(){return state.dailyDate||iso(new Date())}
function blankWeekly(){return WEEK_PRODUCT_SECTIONS.reduce((out,section)=>{out[section.key]=Array.from({length:section.rows},()=>Array(7).fill(''));return out},{});}
function blankWeeklyDone(){return WEEK_PRODUCT_SECTIONS.reduce((out,section)=>{out[section.key]=Array.from({length:section.rows},()=>Array(7).fill(false));return out},{});}
function normalizeWeeklyWeek(value){
  if(!value||Array.isArray(value))return blankWeekly();
  const result=blankWeekly();
  WEEK_PRODUCT_SECTIONS.forEach(section=>{const source=Array.isArray(value[section.key])?value[section.key]:[];for(let r=0;r<section.rows;r++)for(let c=0;c<7;c++)result[section.key][r][c]=upper(source[r]?.[c]||'');});
  return result;
}
function normalizeWeeklyDone(value){
  const result=blankWeeklyDone();
  WEEK_PRODUCT_SECTIONS.forEach(section=>{const source=Array.isArray(value?.[section.key])?value[section.key]:[];for(let r=0;r<section.rows;r++)for(let c=0;c<7;c++)result[section.key][r][c]=Boolean(source[r]?.[c]);});
  return result;
}
function allSuggestions(listKey='clients'){
  if(listKey==='salt')return SALT_OPTIONS;
  const source=state.lists[listKey]||state.lists.clients||[];
  return [...new Set(source.map(upper).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'el'));
}
function distance(a,b){if(Math.abs(a.length-b.length)>1)return 99;let d=0,i=0,j=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}d++;if(d>1)return d;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++}}return d+(i<a.length||j<b.length?1:0)}
function matchingSuggestions(query,listKey='clients',showAll=false){
  const q=upper(query).trim();
  const all=allSuggestions(listKey);
  if(!q)return showAll?all:all.slice(0,12);
  const starts=all.filter(x=>x.startsWith(q));
  const contains=all.filter(x=>!starts.includes(x)&&x.includes(q));
  const fuzzy=all.filter(x=>!starts.includes(x)&&!contains.includes(x)&&distance(x,q)<=1);
  return [...starts,...contains,...fuzzy].slice(0,8);
}
function ensureSuggestionBox(){
  let box=document.getElementById('suggestionBox');
  if(!box){box=document.createElement('div');box.id='suggestionBox';box.className='suggestion-box';document.body.appendChild(box);}
  return box;
}
function hideSuggestions(){const box=document.getElementById('suggestionBox');if(box)box.hidden=true;activeSuggestionInput=null;suggestionIndex=-1;}
function showSuggestions(el,listKey='clients',showAll=false){
  const hits=matchingSuggestions(el.value,listKey,showAll);
  const box=ensureSuggestionBox();
  if(!hits.length){hideSuggestions();return;}
  activeSuggestionInput=el;suggestionIndex=-1;box.innerHTML='';
  hits.forEach((hit,i)=>{const b=document.createElement('button');b.type='button';b.textContent=hit;b.dataset.index=i;b.onpointerdown=e=>{e.preventDefault();applySuggestion(hit)};box.appendChild(b)});
  const r=el.getBoundingClientRect();
  box.style.left=Math.max(6,Math.min(r.left,window.innerWidth-286))+'px';
  box.style.top=Math.min(window.innerHeight-210,r.bottom+4)+'px';
  box.style.width=Math.max(220,Math.min(r.width,280))+'px';box.hidden=false;
}
function applySuggestion(value){if(!activeSuggestionInput)return;activeSuggestionInput.value=upper(value);activeSuggestionInput.dispatchEvent(new Event('input',{bubbles:true}));activeSuggestionInput.focus();hideSuggestions();}
function handleSuggestionKeys(e,listKey){
  const box=document.getElementById('suggestionBox');
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    if(!box||box.hidden){showSuggestions(e.target,listKey);return;}
    const items=[...box.querySelectorAll('button')];if(!items.length)return;e.preventDefault();suggestionIndex=e.key==='ArrowDown'?Math.min(suggestionIndex+1,items.length-1):Math.max(suggestionIndex-1,0);items.forEach((x,i)=>x.classList.toggle('active',i===suggestionIndex));
  }else if((e.key==='Enter'||e.key==='Tab')&&box&&!box.hidden&&suggestionIndex>=0){e.preventDefault();applySuggestion(box.querySelectorAll('button')[suggestionIndex].textContent)}
  else if(e.key==='Escape')hideSuggestions();
}
function makeInput(value,oninput,classes='',listKey='clients'){
  const input=document.createElement('input');input.type='text';input.className='cell-input '+classes;input.value=upper(value||'');input.autocomplete='off';input.autocapitalize='characters';input.spellcheck=false;
  input.addEventListener('input',e=>{const pos=e.target.selectionStart;const v=upper(e.target.value);if(e.target.value!==v){e.target.value=v;try{e.target.setSelectionRange(pos,pos)}catch{}}oninput(v);autosave();showSuggestions(e.target,listKey)});
  input.addEventListener('focus',()=>{selectCell(input);showSuggestions(input,listKey)});
  input.addEventListener('click',()=>{selectCell(input);showSuggestions(input,listKey)});
  input.addEventListener('keydown',e=>handleSuggestionKeys(e,listKey));
  input.addEventListener('blur',()=>setTimeout(hideSuggestions,140));
  input.dataset.listKey=listKey;
  return input;
}
function makePickerButton(input,listKey='clients'){
  const button=document.createElement('button');
  button.type='button';button.className='picker-button';button.textContent='▾';button.title='Επιλογή από τη λίστα';button.setAttribute('aria-label','Επιλογή από τη λίστα');
  button.addEventListener('pointerdown',e=>e.preventDefault());
  button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();selectCell(input);activeSuggestionInput=input;showSuggestions(input,listKey,true);input.focus({preventScroll:true})});
  return button;
}
function selectCell(el){document.querySelectorAll('.selected-cell').forEach(x=>x.classList.remove('selected-cell'));el.closest('td')?.classList.add('selected-cell');selectedInputs=[el]}
function weeklyTotal(){
  const week=state.weekly[weekKey()]||blankWeekly();
  return WEEK_PRODUCT_SECTIONS.reduce((total,section)=>total+(week[section.key]||[]).reduce((n,row)=>n+row.filter(v=>String(v||'').trim()).length,0),0);
}
function updateWeekTotal(){
  const el=document.getElementById('weekTotal');
  if(el)el.textContent='ΣΥΝΟΛΟ ΒΥΤΙΩΝ: '+weeklyTotal();
}
function readListTextarea(key){
  const el=document.getElementById(key+'List');
  if(!el)return [];
  return [...new Set(el.value.split(/\r?\n/).map(x=>upper(x.trim())).filter(Boolean))];
}
function saveListsFromTextareas(showMessage=false){
  for(const k of ['clients','tanks','carriers','other'])state.lists[k]=readListTextarea(k);
  save();
  const status=document.getElementById('listSaveStatus');
  if(status){status.textContent='Αποθηκεύτηκαν '+new Date().toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'});setTimeout(()=>status.textContent='Αποθηκεύονται αυτόματα',1800)}
  if(showMessage)alert('Οι λίστες αποθηκεύτηκαν με κεφαλαία.');
}
const autosaveLists=debounce(()=>saveListsFromTextareas(false),180);
function renderWeekly(){
  const start=new Date((state.weekStart||mondayOfToday())+'T12:00:00');state.weekStart=iso(start);document.getElementById('weekStart').value=state.weekStart;
  const wk=weekKey();state.weekly[wk]=normalizeWeeklyWeek(state.weekly[wk]);state.weeklyDone[wk]=normalizeWeeklyDone(state.weeklyDone[wk]);
  const days=document.getElementById('weeklyDays');days.innerHTML='<th class="row-label">ΠΡΟΪΟΝ / ΘΕΣΗ</th>';
  const names=['ΔΕΥΤΕΡΑ','ΤΡΙΤΗ','ΤΕΤΑΡΤΗ','ΠΕΜΠΤΗ','ΠΑΡΑΣΚΕΥΗ','ΣΑΒΒΑΤΟ','ΚΥΡΙΑΚΗ'];
  const end=new Date(start);end.setDate(end.getDate()+6);document.getElementById('weekRange').textContent=fmt(start)+' – '+fmt(end);
  names.forEach((n,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);const th=document.createElement('th');th.dataset.day=i;th.innerHTML=`${fmt(d)}<br><strong>${n}</strong>`;days.appendChild(th)});
  const body=document.getElementById('weeklyBody');body.innerHTML='';
  WEEK_ROW_LAYOUT.forEach(item=>{
    const tr=document.createElement('tr');
    if(item.type==='header'){
      tr.className='weekly-product-header '+item.section.cls;
      const th=document.createElement('th');th.className='row-label';th.textContent=item.section.label;tr.appendChild(th);
      for(let c=0;c<7;c++){const td=document.createElement('td');td.dataset.day=c;td.textContent=item.section.label;tr.appendChild(td)}
    }else{
      tr.className='weekly-entry-row '+item.section.cls;
      const th=document.createElement('th');th.className='row-label entry-number';th.textContent=item.index+1;tr.appendChild(th);
      for(let c=0;c<7;c++){
        const td=document.createElement('td');td.dataset.day=c;
        const wrap=document.createElement('div');wrap.className='entry-with-check';
        const listKey=item.section.key==='salt'?'salt':'clients';
        const input=makeInput(state.weekly[wk][item.section.key][item.index][c],v=>{state.weekly[wk][item.section.key][item.index][c]=v;updateWeekTotal()},'',listKey);
        const picker=makePickerButton(input,listKey);
        const check=document.createElement('label');check.className='done-check';check.title='Το βυτίο έφυγε';
        const cb=document.createElement('input');cb.type='checkbox';cb.checked=state.weeklyDone[wk][item.section.key][item.index][c];cb.setAttribute('aria-label','Το βυτίο έφυγε');
        const mark=document.createElement('span');mark.textContent='✓';
        cb.onchange=()=>{state.weeklyDone[wk][item.section.key][item.index][c]=cb.checked;wrap.classList.toggle('completed',cb.checked);save()};
        check.append(cb,mark);wrap.append(input,picker,check);wrap.classList.toggle('completed',cb.checked);td.appendChild(wrap);tr.appendChild(td);
      }
    }
    body.appendChild(tr);
  });
  updateWeekTotal();
  applyMobileDay();
}
function renderDaily(){
  state.dailyDate=state.dailyDate||iso(new Date());document.getElementById('dailyDate').value=state.dailyDate;const dk=dayKey();if(!state.daily[dk])state.daily[dk]=blankDaily();
  const head=document.getElementById('dailyHead');head.innerHTML='';DAILY_HEADERS.forEach(h=>{const th=document.createElement('th');th.textContent=h;head.appendChild(th)});
  const body=document.getElementById('dailyBody');body.innerHTML='';
  state.daily[dk].forEach((row,ri)=>{const tr=document.createElement('tr');const num=document.createElement('th');num.textContent=ri+1;tr.appendChild(num);row.forEach((val,ci)=>{const td=document.createElement('td');const cls=(ci===6&&/24|25/.test(val))?'yellow':'';const listKey=ci===3?'clients':(ci===2||ci===4)?'tanks':ci===7?'carriers':'other';const wrap=document.createElement('div');wrap.className='daily-input-wrap';const input=makeInput(val,v=>state.daily[dk][ri][ci]=v,cls,listKey);wrap.append(input);if([2,3,4,7].includes(ci))wrap.append(makePickerButton(input,listKey));td.appendChild(wrap);tr.appendChild(td)});body.appendChild(tr)});
}
function applyMobileDay(){document.querySelectorAll('#weeklyTable [data-day]').forEach(el=>el.classList.add('mobile-visible'));}
function initLists(){for(const k of ['clients','tanks','carriers','other']){state.lists[k]=[...new Set((state.lists[k]||[]).map(upper).filter(Boolean))];const el=document.getElementById(k+'List');if(el)el.value=state.lists[k].join('\n')}}
function bindTabs(){document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab,.view').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.view).classList.add('active');hideSuggestions()})}
function normalizeForMatch(value){
  return upper(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[0ΟO]/g,'Ο').replace(/[1ΙI]/g,'Ι')
    .replace(/[^A-ZΑ-Ω0-9]+/g,' ')
    .replace(/\s+/g,' ').trim();
}
function levenshtein(a,b){
  const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return dp[m][n];
}
function extractKnownClients(rawText){
  const clients=allSuggestions('clients');
  const lines=rawText.split(/\r?\n/).map(x=>normalizeForMatch(x)).filter(Boolean);
  const found=[];
  for(const line of lines){
    const matches=[];
    for(const client of clients){
      const nc=normalizeForMatch(client);if(!nc)continue;
      let score=999;
      if(line.includes(nc))score=0;
      else if(nc.includes(line)&&line.length>=Math.max(4,nc.length-3))score=1;
      else{
        const words=line.split(' '),targetWords=nc.split(' '),windowSize=targetWords.length;
        for(let i=0;i<=Math.max(0,words.length-windowSize);i++){
          const part=words.slice(i,i+windowSize).join(' ');
          const d=levenshtein(part,nc);score=Math.min(score,d);
        }
      }
      const allowed=Math.max(1,Math.floor(nc.length*0.18));
      if(score<=allowed)matches.push({client,score,pos:Math.max(0,line.indexOf(nc))});
    }
    matches.sort((a,b)=>a.pos-b.pos||a.score-b.score||b.client.length-a.client.length);
    const used=new Set();
    for(const match of matches){if(!used.has(match.client)){found.push(match.client);used.add(match.client)}}
  }
  return found;
}
async function makeRotatedImage(file,degrees){
  if(!degrees)return file;
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url});
    const canvas=document.createElement('canvas'),swap=Math.abs(degrees)%180===90;
    canvas.width=swap?img.naturalHeight:img.naturalWidth;canvas.height=swap?img.naturalWidth:img.naturalHeight;
    const ctx=canvas.getContext('2d');ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(degrees*Math.PI/180);ctx.drawImage(img,-img.naturalWidth/2,-img.naturalHeight/2);
    return canvas;
  }finally{URL.revokeObjectURL(url)}
}
async function recognizeClients(source,bar,msg,attemptLabel){
  const result=await Tesseract.recognize(source,'ell+eng',{logger:m=>{if(m.progress){bar.style.width=Math.round(m.progress*100)+'%';msg.textContent=attemptLabel+' — '+(m.status||'Ανάγνωση')+' '+Math.round(m.progress*100)+'%'}}});
  return {raw:result.data.text,clients:extractKnownClients(result.data.text)};
}
async function runOcr(file){
  const dlg=document.getElementById('ocrDialog');dlg.showModal();
  const bar=document.getElementById('ocrBar'),msg=document.getElementById('ocrMessage'),txt=document.getElementById('ocrText');
  bar.style.width='0';txt.value='';msg.textContent='Φόρτωση αναγνώρισης πελατών…';
  try{
    let best=await recognizeClients(file,bar,msg,'Ανάγνωση φωτογραφίας');
    if(best.clients.length<2){
      for(const [deg,label] of [[90,'Δοκιμή περιστροφής'],[-90,'Δεύτερη δοκιμή περιστροφής']]){
        const rotated=await makeRotatedImage(file,deg);const candidate=await recognizeClients(rotated,bar,msg,label);
        if(candidate.clients.length>best.clients.length)best=candidate;
        if(best.clients.length>=3)break;
      }
    }
    txt.value=best.clients.join('\n');bar.style.width='100%';
    msg.textContent=best.clients.length?`Βρέθηκαν ${best.clients.length} πελάτες. Θα περαστούν μόνο αυτά τα ονόματα.`:'Δεν βρέθηκε όνομα από τη λίστα πελατών. Πρόσθεσε πρώτα τον πελάτη στη λίστα ή γράψ’ τον χειροκίνητα.';
  }catch(e){msg.textContent='Η ανάγνωση απέτυχε: '+e.message}
}
function insertOcr(){
  const lines=document.getElementById('ocrText').value.split(/\n/).map(x=>upper(x.trim())).filter(x=>allSuggestions('clients').includes(x));
  if(!lines.length){alert('Δεν υπάρχουν αναγνωρισμένοι πελάτες για εισαγωγή.');return;}
  const active=document.querySelector('.view.active');let inputs=[...active.querySelectorAll('.cell-input')].filter(x=>x.offsetParent!==null&&x.dataset.listKey==='clients');
  let start=selectedInputs[0]?inputs.indexOf(selectedInputs[0]):0;if(start<0)start=0;
  lines.forEach((line,i)=>{const el=inputs[start+i];if(el){el.value=line;el.dispatchEvent(new Event('input',{bubbles:true}))}});
  save();document.getElementById('ocrDialog').close();
}
function bind(){
  bindTabs();
  document.getElementById('weekStart').onchange=e=>{state.weekStart=e.target.value;renderWeekly();save()};
  document.getElementById('dailyDate').onchange=e=>{state.dailyDate=e.target.value;renderDaily();save()};
  document.getElementById('weeklyPhotoBtn').onclick=()=>document.getElementById('weeklyPhoto').click();document.getElementById('dailyPhotoBtn').onclick=()=>document.getElementById('dailyPhoto').click();
  document.getElementById('weeklyPhoto').onchange=e=>{const f=e.target.files[0];if(f)runOcr(f);e.target.value=''};document.getElementById('dailyPhoto').onchange=e=>{const f=e.target.files[0];if(f)runOcr(f);e.target.value=''};
  document.getElementById('insertOcrLines').onclick=insertOcr;document.getElementById('copyOcr').onclick=()=>navigator.clipboard.writeText(document.getElementById('ocrText').value);
  document.getElementById('addDailyRow').onclick=()=>{state.daily[dayKey()].push(Array(DAILY_HEADERS.length-1).fill(''));renderDaily();save()};
  document.getElementById('clearWeekly').onclick=()=>{if(confirm('Να καθαριστεί ολόκληρη η εβδομάδα;')){delete state.weekly[weekKey()];delete state.weeklyDone[weekKey()];renderWeekly();save()}};
  document.getElementById('clearDaily').onclick=()=>{if(confirm('Να καθαριστεί το καθημερινό πρόγραμμα;')){state.daily[dayKey()]=blankDaily();renderDaily();save()}};
  document.getElementById('saveLists').onclick=()=>{saveListsFromTextareas(true);initLists()};
  for(const k of ['clients','tanks','carriers','other']){const el=document.getElementById(k+'List');el.addEventListener('input',()=>{const pos=el.selectionStart;const v=upper(el.value);if(el.value!==v){el.value=v;try{el.setSelectionRange(pos,pos)}catch{}}autosaveLists()});el.addEventListener('change',()=>saveListsFromTextareas(false));el.addEventListener('blur',()=>saveListsFromTextareas(false))}
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveListsFromTextareas(false)});
  window.addEventListener('pagehide',()=>saveListsFromTextareas(false));
  document.getElementById('exportData').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='programma-fortoseon-backup.json';a.click();URL.revokeObjectURL(a.href)};
  document.getElementById('importData').onchange=async e=>{try{state=JSON.parse(await e.target.files[0].text());save();location.reload()}catch{alert('Μη έγκυρο αρχείο.')}};
  document.getElementById('eraseAll').onclick=()=>{if(confirm('Οριστική διαγραφή όλων των δεδομένων από αυτή τη συσκευή;')){localStorage.removeItem(KEY);localStorage.removeItem(LEGACY_KEY);location.reload()}};
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.suggestion-box')&&!e.target.closest('.cell-input'))hideSuggestions()});
  window.addEventListener('resize',hideSuggestions);
}
state.weekStart=state.weekStart||mondayOfToday();state.dailyDate=state.dailyDate||iso(new Date());bind();initLists();renderWeekly();renderDaily();save();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
