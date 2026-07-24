const KEY='fitplanner.v1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const todayISO=()=>new Date().toISOString().slice(0,10);
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const fmtDate=iso=>new Intl.DateTimeFormat('el-GR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(iso+'T12:00:00'));

const starterPrograms=[
 {id:'fullbody-dumbbells-beginner',muscle:'full',title:'Ολόκληρο σώμα με βαράκια — Αρχάριος',place:'home',level:'beginner',duration:40,goal:'general',exercises:[['Καθίσματα κρατώντας βαράκι στο στήθος',3,10],['Πιέσεις στήθους με βαράκια στο πάτωμα',3,10],['Κωπηλατική με ένα βαράκι',3,10],['Άρσεις θανάτου με βαράκια και τεντωμένα πόδια',3,10],['Σανίδα',3,30]]},
 {id:'bodyweight-20',muscle:'full',title:'Ασκήσεις με το βάρος του σώματος — 20 λεπτά',place:'home',level:'beginner',duration:20,goal:'fatloss',exercises:[['Καθίσματα',3,12],['Κάμψεις',3,8],['Προβολές ποδιών',3,10],['Γέφυρες γλουτών',3,15],['Ορειβάτες',4,30]]},
 {id:'home-outdoor-bodyweight',muscle:'full',title:'Ασκήσεις οικίας — χωρίς βάρη',place:'home',level:'beginner',duration:35,goal:'general',exercises:[['Καθίσματα με το βάρος του σώματος',4,15],['Κάμψεις στο έδαφος ή σε παγκάκι',4,10],['Προβολές προς τα πίσω',3,12],['Έλξεις σε μονόζυγο εξωτερικού χώρου',3,6],['Βυθίσεις τρικεφάλων σε παράλληλες μπάρες ή παγκάκι',3,8],['Ανεβάσματα σε παγκάκι',3,12],['Άρσεις γονάτων κρεμαστός σε μονόζυγο',3,10],['Σανίδα',3,30]]},
 {id:'upper-dumbbells',muscle:'upper',title:'Άνω σώμα με βαράκια',place:'home',level:'intermediate',duration:45,goal:'muscle',exercises:[['Πιέσεις στήθους με βαράκια',4,10],['Κωπηλατική σκυφτός με βαράκια',4,10],['Πιέσεις ώμων με βαράκια',3,10],['Πλάγιες άρσεις ώμων με βαράκια',3,12],['Κάμψεις δικεφάλων με βαράκια',3,12],['Εκτάσεις τρικεφάλων πάνω από το κεφάλι',3,12]]},
 {id:'lower-dumbbells',muscle:'legs',title:'Πόδια και γλουτοί με βαράκια',place:'home',level:'intermediate',duration:45,goal:'strength',exercises:[['Καθίσματα κρατώντας βαράκια',4,10],['Προβολές με βαράκια',3,10],['Άρσεις θανάτου με βαράκια',4,10],['Ανεβάσματα σε σκαλοπάτι με βαράκια',3,10],['Γέφυρες γλουτών με βαράκι',3,15],['Άρσεις γάμπας κρατώντας βαράκια',4,15]]},
 {id:'fullbody-strength',muscle:'full',title:'Δύναμη ολόκληρου σώματος με βαράκια',place:'home',level:'intermediate',duration:50,goal:'strength',exercises:[['Καθίσματα με βαράκια',4,8],['Πιέσεις στήθους με βαράκια',4,8],['Κωπηλατική με βαράκια',4,8],['Πιέσεις ώμων με βαράκια',3,8],['Άρσεις θανάτου με βαράκια',4,8],['Σανίδα με άγγιγμα ώμων',3,20]]},
 {id:'bodyweight-full',muscle:'full',title:'Ολόκληρο σώμα χωρίς εξοπλισμό',place:'home',level:'beginner',duration:35,goal:'general',exercises:[['Καθίσματα',4,12],['Κάμψεις σε τοίχο ή γόνατα',3,10],['Προβολές προς τα πίσω',3,10],['Βυθίσεις τρικεφάλων σε καρέκλα',3,8],['Γέφυρες γλουτών',3,15],['Σανίδα',3,30]]},
 {id:'core-bodyweight',muscle:'abs',title:'Κοιλιακοί και κορμός με βάρος σώματος',place:'home',level:'beginner',duration:25,goal:'general',exercises:[['Σανίδα',3,30],['Πλάγια σανίδα',3,20],['Άρσεις αντίθετου χεριού και ποδιού',3,10],['Νεκρό έντομο',3,10],['Ορειβάτες',3,30],['Άρσεις λεκάνης',3,15]]},
 {id:'conditioning-dumbbells',muscle:'full',title:'Κυκλική προπόνηση με βαράκια',place:'home',level:'intermediate',duration:30,goal:'endurance',exercises:[['Καθίσματα και πίεση ώμων με βαράκια',4,10],['Κωπηλατική με βαράκια',4,10],['Προβολές εναλλάξ',4,10],['Κάμψεις',4,8],['Άρσεις θανάτου με βαράκια',4,10],['Ορειβάτες',4,30]]},
 {id:'mobility',muscle:'mobility',title:'Κινητικότητα και αποκατάσταση',place:'home',level:'beginner',duration:25,goal:'mobility',exercises:[['Κίνηση γάτας και αγελάδας',2,10],['Περιστροφές ισχίων 90/90',2,8],['Περιστροφές θωρακικής μοίρας',2,8],['Διάταση καμπτήρων ισχίου',2,40],['Στάση του παιδιού',2,45]]},
 {id:'superset-fullbody-1',muscle:'full',title:'Superset ολόκληρου σώματος με βαράκια',place:'gym',level:'intermediate',duration:35,goal:'general',exercises:[['Καθίσματα με βαράκια + Πιέσεις ώμων',4,10],['Κωπηλατική με βαράκια + Κάμψεις',4,10],['Άρσεις θανάτου με βαράκια + Ορειβάτες',4,10],['Προβολές με βαράκια + Σανίδα',3,10]]},
 {id:'superset-upper-1',muscle:'upper',title:'Superset άνω σώματος',place:'gym',level:'intermediate',duration:35,goal:'muscle',exercises:[['Πιέσεις στήθους με βαράκια + Κωπηλατική με βαράκια',4,10],['Πιέσεις ώμων + Πλάγιες άρσεις ώμων',3,10],['Κάμψεις δικεφάλων + Εκτάσεις τρικεφάλων',3,12],['Κάμψεις + Σανίδα με άγγιγμα ώμων',3,10]]},
 {id:'superset-lower-1',muscle:'legs',title:'Superset ποδιών και γλουτών',place:'gym',level:'intermediate',duration:35,goal:'strength',exercises:[['Καθίσματα με βαράκια + Άρσεις θανάτου με βαράκια',4,10],['Προβολές προς τα πίσω + Γέφυρες γλουτών',3,12],['Ανεβάσματα σε σκαλοπάτι + Άρσεις γάμπας',3,12],['Καθίσματα χωρίς βάρος + Σανίδα',3,15]]},
 {id:'chest-focus',muscle:'chest',title:'Στήθος',place:'gym',level:'beginner',duration:35,goal:'muscle',exercises:[['Πιέσεις στήθους με βαράκια',4,10],['Κάμψεις',3,10],['Ανοίγματα στήθους με βαράκια',3,12],['Κάμψεις σε παγκάκι',3,12]]},
 {id:'back-focus',muscle:'back',title:'Πλάτη',place:'gym',level:'beginner',duration:40,goal:'muscle',exercises:[['Κωπηλατική με ένα βαράκι',4,10],['Κωπηλατική σκυφτός με βαράκια',3,12],['Έλξεις σε μονόζυγο εξωτερικού χώρου',3,6],['Superman',3,12]]},
 {id:'shoulders-focus',muscle:'shoulders',title:'Ώμοι',place:'home',level:'beginner',duration:30,goal:'muscle',exercises:[['Πιέσεις ώμων με βαράκια',4,10],['Πλάγιες άρσεις ώμων με βαράκια',3,12],['Μπροστινές άρσεις ώμων με βαράκια',3,12],['Σανίδα με άγγιγμα ώμων',3,20]]},
 {id:'legs-focus',muscle:'legs',title:'Πόδια',place:'home',level:'beginner',duration:40,goal:'strength',exercises:[['Καθίσματα',4,12],['Προβολές ποδιών',3,10],['Γέφυρες γλουτών',3,15],['Ανεβάσματα σε σκαλοπάτι',3,12],['Άρσεις γάμπας',4,15]]},
 {id:'abs-focus',muscle:'abs',title:'Κοιλιακοί',place:'home',level:'beginner',duration:25,goal:'general',exercises:[['Σανίδα',3,30],['Πλάγια σανίδα',3,20],['Νεκρό έντομο',3,10],['Ορειβάτες',3,30],['Άρσεις γονάτων κρεμαστός σε μονόζυγο',3,10]]}
];

const exerciseCatalog=[
 {name:'Πιέσεις στήθους με βαράκια',muscle:'chest',places:['home','gym']},{name:'Πιέσεις στήθους με βαράκια στο πάτωμα',muscle:'chest',places:['home']},{name:'Κάμψεις',muscle:'chest',places:['home','gym']},{name:'Κάμψεις σε παγκάκι',muscle:'chest',places:['home','gym']},{name:'Ανοίγματα στήθους με βαράκια',muscle:'chest',places:['home','gym']},
 {name:'Κωπηλατική με ένα βαράκι',muscle:'back',places:['home','gym']},{name:'Κωπηλατική σκυφτός με βαράκια',muscle:'back',places:['home','gym']},{name:'Έλξεις σε μονόζυγο εξωτερικού χώρου',muscle:'back',places:['home','gym']},{name:'Superman',muscle:'back',places:['home']},
 {name:'Πιέσεις ώμων με βαράκια',muscle:'shoulders',places:['home','gym']},{name:'Πλάγιες άρσεις ώμων με βαράκια',muscle:'shoulders',places:['home','gym']},{name:'Μπροστινές άρσεις ώμων με βαράκια',muscle:'shoulders',places:['home','gym']},{name:'Σανίδα με άγγιγμα ώμων',muscle:'shoulders',places:['home']},
 {name:'Καθίσματα',muscle:'legs',places:['home','gym']},{name:'Καθίσματα κρατώντας βαράκι στο στήθος',muscle:'legs',places:['home','gym']},{name:'Προβολές ποδιών',muscle:'legs',places:['home','gym']},{name:'Γέφυρες γλουτών',muscle:'legs',places:['home','gym']},{name:'Ανεβάσματα σε σκαλοπάτι',muscle:'legs',places:['home','gym']},{name:'Άρσεις γάμπας',muscle:'legs',places:['home','gym']},{name:'Άρσεις θανάτου με βαράκια',muscle:'legs',places:['home','gym']},
 {name:'Σανίδα',muscle:'abs',places:['home','gym']},{name:'Πλάγια σανίδα',muscle:'abs',places:['home','gym']},{name:'Νεκρό έντομο',muscle:'abs',places:['home']},{name:'Ορειβάτες',muscle:'abs',places:['home','gym']},{name:'Άρσεις γονάτων κρεμαστός σε μονόζυγο',muscle:'abs',places:['home','gym']},
 {name:'Κάμψεις δικεφάλων με βαράκια',muscle:'arms',places:['home','gym']},{name:'Εκτάσεις τρικεφάλων πάνω από το κεφάλι',muscle:'arms',places:['home','gym']},{name:'Βυθίσεις τρικεφάλων σε καρέκλα',muscle:'arms',places:['home']}
];
const muscleNames={all:'Όλα',full:'Όλο το σώμα',chest:'Στήθος',back:'Πλάτη',shoulders:'Ώμοι',legs:'Πόδια',abs:'Κοιλιακοί',arms:'Χέρια',upper:'Άνω σώμα',mobility:'Κινητικότητα'};

let state=load();
let calDate=new Date();
let selectedDate=todayISO();
let activeFilter='all';

function defaultState(){
 const id=uid();
 return {activePersonId:id,theme:'light',people:[{id,name:'Αλέξανδρος',birthdate:'',sex:'',height:'',weight:'',waist:'',level:'beginner',place:'gym',days:3,duration:45,goal:'general',limitations:'',measurements:[],calendar:{},customPrograms:[]}]} ;
}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||defaultState()}catch{return defaultState()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function person(){return state.people.find(p=>p.id===state.activePersonId)||state.people[0]}
function ageOf(b){if(!b)return null;const d=new Date(b),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a}
function latestMeasurement(p){return [...(p.measurements||[])].filter(m=>m.date&&m.weight).sort((a,b)=>b.date.localeCompare(a.date))[0]||null}
function currentWeightOf(p){const m=latestMeasurement(p);return m?String(m.weight):String(p.weight||'')}
function syncCurrentMeasurement(p){const m=latestMeasurement(p);if(m){p.weight=String(m.weight);if(m.waist)p.waist=String(m.waist)}}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function go(view){$$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));$$('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===view));if(view==='profile')fillProfile();if(view==='calendar')renderCalendar();window.scrollTo({top:0,behavior:'smooth'})}
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

function renderAll(){
 document.body.classList.toggle('dark',state.theme==='dark');
 const p=person();syncCurrentMeasurement(p);
 $('#activeName').textContent=p.name;
 $('#activeAvatar').textContent=(p.name||'?')[0].toUpperCase();
 const bits=[]; const age=ageOf(p.birthdate); if(age)bits.push(age+' ετών'); if(p.height)bits.push(p.height+' cm'); const cw=currentWeightOf(p); if(cw)bits.push(cw+' kg');
 $('#activeSummary').textContent=bits.join(' • ')||'Δεν έχουν συμπληρωθεί στοιχεία';
 $('#currentWeight').textContent=cw?cw+' kg':'—';
 const month=todayISO().slice(0,7); const entries=Object.entries(p.calendar||{}).filter(([d])=>d.startsWith(month)).flatMap(([,a])=>a||[]);
 $('#monthWorkouts').textContent=entries.filter(e=>e.done).length;
 $('#streak').textContent=calcStreak(p)+' εβδομ.';
 $('#nextGoal').textContent=goalName(p.goal);
 renderPeople();renderPrograms();renderMeasurements();renderHomeToday();
}
function calcStreak(p){let s=0;for(let w=0;w<12;w++){const end=new Date();end.setDate(end.getDate()-w*7);const start=new Date(end);start.setDate(end.getDate()-6);const has=Object.entries(p.calendar||{}).some(([d,a])=>{const x=new Date(d+'T12:00:00');return x>=start&&x<=end&&(a||[]).some(e=>e.done)});if(has)s++;else if(w>0)break;}return s}
function goalName(g){return ({general:'Ευεξία',fatloss:'Απώλεια λίπους',muscle:'Μυϊκή ανάπτυξη',strength:'Δύναμη',endurance:'Αντοχή',mobility:'Κινητικότητα'})[g]||'Ορισμός'}
function renderHomeToday(){const a=(person().calendar||{})[todayISO()]||[];if(a.length){$('#todayTitle').textContent=a[0].title;$('#todaySubtitle').textContent=a[0].done?'Η προπόνηση ολοκληρώθηκε.':'Έχει προγραμματιστεί για σήμερα.';$('#startTodayBtn').textContent=a[0].done?'Προβολή':'Ξεκίνα προπόνηση'}else{$('#todayTitle').textContent='Η σημερινή προπόνηση';$('#todaySubtitle').textContent='Δημιούργησε πρόγραμμα ή πάρε αυτόματη πρόταση.';$('#startTodayBtn').textContent='Ξεκίνα προπόνηση'}}

function renderPeople(){const g=$('#peopleGrid');g.innerHTML='';state.people.forEach(p=>{const el=document.createElement('article');el.className='person-card card';el.innerHTML=`<div class="person-head"><div class="profile-avatar">${(p.name||'?')[0]}</div><div><h3>${esc(p.name)}</h3><div class="muted small">${[ageOf(p.birthdate)?ageOf(p.birthdate)+' ετών':'',p.weight?p.weight+' kg':''].filter(Boolean).join(' • ')||'Χωρίς στοιχεία'}</div></div></div><div class="actions"><button class="primary select-person">${p.id===state.activePersonId?'Ενεργό':'Επιλογή'}</button><button class="secondary edit-person">Επεξεργασία</button>${state.people.length>1?'<button class="danger delete-person">×</button>':''}</div>`;
 el.querySelector('.select-person').onclick=()=>{state.activePersonId=p.id;save();toast('Επιλέχθηκε το προφίλ')};
 el.querySelector('.edit-person').onclick=()=>{state.activePersonId=p.id;save();go('profile')};
 el.querySelector('.delete-person')?.addEventListener('click',()=>{if(confirm('Να διαγραφεί το προφίλ και όλο το ιστορικό του;')){state.people=state.people.filter(x=>x.id!==p.id);if(state.activePersonId===p.id)state.activePersonId=state.people[0].id;save()}});
 g.appendChild(el)});
}
$('#addPersonBtn').onclick=()=>openPersonModal();
function openPersonModal(){openModal(`<h2>Νέο άτομο</h2><label>Όνομα<input id="newPersonName" required autofocus></label><div class="modal-actions"><button value="cancel" class="secondary">Ακύρωση</button><button value="default" class="primary" id="createPerson">Δημιουργία</button></div>`);$('#createPerson').onclick=e=>{e.preventDefault();const name=$('#newPersonName').value.trim();if(!name)return;const p={...defaultState().people[0],id:uid(),name,calendar:{},measurements:[],customPrograms:[]};state.people.push(p);state.activePersonId=p.id;closeModal();save();go('profile')}}

function initBirthdateSelectors(){
 const day=$('#birthDay'),month=$('#birthMonth'),year=$('#birthYear');
 if(day.options.length)return;
 day.innerHTML='<option value="">Ημέρα</option>'+Array.from({length:31},(_,i)=>`<option value="${String(i+1).padStart(2,'0')}">${i+1}</option>`).join('');
 month.innerHTML='<option value="">Μήνας</option>'+['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος','Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'].map((x,i)=>`<option value="${String(i+1).padStart(2,'0')}">${x}</option>`).join('');
 const y=new Date().getFullYear();year.innerHTML='<option value="">Έτος</option>'+Array.from({length:100},(_,i)=>`<option value="${y-i}">${y-i}</option>`).join('');
}
function fillProfile(){const p=person(),f=$('#profileForm');initBirthdateSelectors();Object.keys(p).forEach(k=>{if(f.elements[k])f.elements[k].value=p[k]??''});const [y,m,d]=(p.birthdate||'--').split('-');$('#birthDay').value=d||'';$('#birthMonth').value=m||'';$('#birthYear').value=y||''}
$('#saveProfileBtn').onclick=()=>{const p=person(),d=$('#birthDay').value,m=$('#birthMonth').value,y=$('#birthYear').value;$('#birthdateHidden').value=(d&&m&&y)?`${y}-${m}-${d}`:'';const f=new FormData($('#profileForm'));for(const [k,v] of f.entries())p[k]=v;p.days=Number(p.days||3);p.duration=Number(p.duration||45);save();toast('Το προφίλ αποθηκεύτηκε')};

function bmiData(p){if(!p.height||!p.weight)return null;const h=Number(p.height)/100,b=Number(p.weight)/(h*h);let label=b<18.5?'Χαμηλότερο από το συνήθως ενδεικτικό εύρος':b<25?'Μέσα στο συνήθως ενδεικτικό εύρος':b<30?'Πάνω από το συνήθως ενδεικτικό εύρος':'Σημαντικά πάνω από το ενδεικτικό εύρος';return {b,low:18.5*h*h,high:24.9*h*h,label}}
function renderWeightChart(p){
 const host=$('#weightChart');if(!host)return;const list=[...(p.measurements||[])].filter(m=>m.date&&m.weight).sort((a,b)=>a.date.localeCompare(b.date));
 if(!list.length){host.innerHTML='<p class="muted">Δεν υπάρχουν αρκετές καταχωρίσεις βάρους.</p>';return}
 const W=760,H=230,pad={l:52,r:20,t:18,b:45},vals=list.map(x=>Number(x.weight)),min=Math.min(...vals),max=Math.max(...vals),spread=Math.max(1,max-min),lo=min-spread*.25,hi=max+spread*.25;
 const x=i=>pad.l+(list.length===1?(W-pad.l-pad.r)/2:i*(W-pad.l-pad.r)/(list.length-1));const y=v=>pad.t+(hi-v)*(H-pad.t-pad.b)/(hi-lo);
 let grid='';for(let i=0;i<5;i++){const yy=pad.t+i*(H-pad.t-pad.b)/4,val=hi-i*(hi-lo)/4;grid+=`<line class="chart-grid" x1="${pad.l}" y1="${yy}" x2="${W-pad.r}" y2="${yy}"/><text class="chart-label" x="4" y="${yy+4}">${val.toFixed(1)} kg</text>`}
 const pts=list.map((m,i)=>`${x(i)},${y(Number(m.weight))}`).join(' ');const dots=list.map((m,i)=>`<circle class="chart-point" cx="${x(i)}" cy="${y(Number(m.weight))}" r="6"><title>${fmtDate(m.date)}: ${m.weight} kg</title></circle><text class="chart-label" text-anchor="middle" x="${x(i)}" y="${H-18}">${m.date.split('-').reverse().slice(0,2).join('/')}</text>`).join('');
 host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Εξέλιξη βάρους">${grid}<polyline class="chart-line" points="${pts}"/>${dots}</svg>`;
}
function renderMeasurements(){const p=person();syncCurrentMeasurement(p);const b=bmiData(p);$('#bmiValue').textContent=b?b.b.toFixed(1):'—';$('#bmiLabel').textContent=b?b.label:'Συμπλήρωσε ύψος και βάρος';$('#weightRange').textContent=b?`${b.low.toFixed(1)}–${b.high.toFixed(1)} kg`:'—';if(p.height&&p.waist){const r=Number(p.waist)/Number(p.height);$('#whrValue').textContent=r.toFixed(2);$('#whrLabel').textContent=r<.5?'Κάτω από το 0,50':'Στο 0,50 ή υψηλότερα'}else{$('#whrValue').textContent='—';$('#whrLabel').textContent='Πρόσθεσε περίμετρο μέσης'}renderWeightChart(p);const h=$('#measurementHistory');h.innerHTML='';const list=[...(p.measurements||[])].sort((a,b)=>b.date.localeCompare(a.date));if(!list.length)h.innerHTML='<p class="muted">Δεν υπάρχουν καταχωρίσεις.</p>';list.forEach(m=>{const e=document.createElement('div');e.className='entry';e.innerHTML=`<div class="grow"><b>${fmtDate(m.date)}</b><span class="muted small">${m.weight?m.weight+' kg':''}${m.waist?' • Μέση '+m.waist+' cm':''}${m.chest?' • Στήθος '+m.chest+' cm':''}</span></div><button class="secondary edit-measurement">Επεξεργασία</button><button class="danger delete-measurement">×</button>`;e.querySelector('.edit-measurement').onclick=()=>openMeasurementModal(m);e.querySelector('.delete-measurement').onclick=()=>{p.measurements=p.measurements.filter(x=>x.id!==m.id);syncCurrentMeasurement(p);save()};h.appendChild(e)})}
function openMeasurementModal(existing=null){const m=existing||{date:todayISO(),weight:currentWeightOf(person()),waist:person().waist||'',chest:'',arm:'',thigh:''};openModal(`<h2>${existing?'Επεξεργασία μέτρησης':'Νέα μέτρηση'}</h2><div class="form-grid"><label>Ημερομηνία<input id="mDate" type="date" value="${m.date||todayISO()}"></label><label>Βάρος (kg)<input id="mWeight" type="number" step="0.1" value="${m.weight||''}"></label><label>Μέση (cm)<input id="mWaist" type="number" step="0.1" value="${m.waist||''}"></label><label>Στήθος (cm)<input id="mChest" type="number" step="0.1" value="${m.chest||''}"></label><label>Μπράτσο (cm)<input id="mArm" type="number" step="0.1" value="${m.arm||''}"></label><label>Μηρός (cm)<input id="mThigh" type="number" step="0.1" value="${m.thigh||''}"></label></div><div class="modal-actions"><button value="cancel" class="secondary">Ακύρωση</button><button class="primary" id="saveMeasurement">Αποθήκευση</button></div>`);$('#saveMeasurement').onclick=e=>{e.preventDefault();const p=person(),data={id:existing?.id||uid(),date:$('#mDate').value,weight:$('#mWeight').value,waist:$('#mWaist').value,chest:$('#mChest').value,arm:$('#mArm').value,thigh:$('#mThigh').value};if(existing)Object.assign(existing,data);else p.measurements.push(data);syncCurrentMeasurement(p);closeModal();save();toast('Η μέτρηση αποθηκεύτηκε')}}
$('#addMeasurementBtn').onclick=()=>openMeasurementModal();

function allPrograms(){return [...starterPrograms,...(person().customPrograms||[])]}
function programMuscle(p){return p.muscle||'full'}
function renderPrograms(){
 const g=$('#programGrid');g.innerHTML='';
 const visible=allPrograms().filter(p=>activeFilter==='all'||p.place===activeFilter||p.level===activeFilter||programMuscle(p)===activeFilter);
 visible.forEach(p=>{
  const el=document.createElement('article');el.className='program-card card collapsed';
  el.innerHTML=`<button type="button" class="program-summary" aria-expanded="false"><div><span class="tag">${p.place==='home'?'Σπίτι':'Γυμναστήριο'}</span><span class="tag">${p.duration}′</span><span class="tag">${muscleNames[programMuscle(p)]||'Πρόγραμμα'}</span><h3>${esc(p.title)}</h3><small>${p.exercises.length} ασκήσεις — πάτησε για άνοιγμα</small></div><span class="program-chevron">⌄</span></button><div class="program-details"><ul>${p.exercises.map(x=>`<li><button type="button" class="exercise-link" data-exercise="${encodeURIComponent(x[0])}">${esc(x[0])}</button> — ${x[1]} × ${x[2]}</li>`).join('')}</ul><div class="actions"><button class="primary use-program">Προγραμματισμός</button><button class="secondary view-program">Προβολή</button></div></div>`;
  const summary=el.querySelector('.program-summary');summary.onclick=()=>{const open=el.classList.toggle('open');summary.setAttribute('aria-expanded',String(open))};
  el.querySelector('.use-program').onclick=()=>scheduleProgram(p);el.querySelector('.view-program').onclick=()=>viewProgram(p);el.querySelectorAll('.exercise-link').forEach(b=>b.onclick=()=>showExercise(decodeURIComponent(b.dataset.exercise)));g.appendChild(el)
 })
}
$$('[data-filter]').forEach(b=>b.onclick=()=>{activeFilter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderPrograms()});
function viewProgram(p){openModal(`<h2>${esc(p.title)}</h2><p class="muted">${p.duration} λεπτά • ${p.place==='home'?'Σπίτι':'Γυμναστήριο'}</p><div class="stack">${p.exercises.map(x=>`<div class="entry"><div class="grow"><button type="button" class="exercise-link" data-exercise="${encodeURIComponent(x[0])}">${esc(x[0])}</button><span class="muted small">${x[1]} σετ × ${x[2]} ${Number(x[2])>20?'δευτ.':'επαν.'}</span></div></div>`).join('')}</div><div class="modal-actions"><button value="cancel" class="secondary">Κλείσιμο</button><button class="primary" id="scheduleFromView">Προγραμματισμός</button></div>`);$('#modalContent').querySelectorAll('.exercise-link').forEach(b=>b.onclick=()=>showExercise(decodeURIComponent(b.dataset.exercise),true));$('#scheduleFromView').onclick=e=>{e.preventDefault();closeModal();scheduleProgram(p)}}
function scheduleProgram(p,date=selectedDate){openModal(`<h2>Προγραμματισμός</h2><label>Ημερομηνία<input id="scheduleDate" type="date" value="${date||todayISO()}"></label><div class="modal-actions"><button value="cancel" class="secondary">Ακύρωση</button><button class="primary" id="confirmSchedule">Αποθήκευση</button></div>`);$('#confirmSchedule').onclick=e=>{e.preventDefault();const d=$('#scheduleDate').value,per=person();per.calendar[d]=per.calendar[d]||[];per.calendar[d].push({id:uid(),programId:p.id,title:p.title,done:false,exercises:p.exercises.map(x=>[...x])});closeModal();save();selectedDate=d;toast('Μπήκε στο ημερολόγιο')}}
$('#newProgramBtn').onclick=()=>openProgramBuilder();
function openProgramBuilder(){
 openModal(`<h2>Νέο πρόγραμμα</h2><label>Όνομα<input id="progTitle" placeholder="π.χ. Πρόγραμμα στήθους"></label><div class="form-grid program-builder-filters"><label>Χώρος<select id="progPlace"><option value="home">Σπίτι / έξω</option><option value="gym">Γυμναστήριο</option></select></label><label>Μυϊκή ομάδα<select id="progMuscle"><option value="full">Όλο το σώμα</option><option value="chest">Στήθος</option><option value="back">Πλάτη</option><option value="shoulders">Ώμοι</option><option value="legs">Πόδια</option><option value="abs">Κοιλιακοί</option><option value="arms">Χέρια</option></select></label><label>Διάρκεια<input id="progDuration" type="number" value="45"></label></div><div class="suggestion-box"><b>Προτεινόμενες ασκήσεις</b><p class="muted small">Οι επιλογές αλλάζουν ανάλογα με τον χώρο και τη μυϊκή ομάδα.</p><div id="exerciseSuggestions" class="suggestion-chips"></div></div><h3>Ασκήσεις προγράμματος</h3><div id="exerciseBuilder"></div><button type="button" class="secondary" id="addExercise">+ Άσκηση</button><div class="modal-actions"><button value="cancel" class="secondary">Ακύρωση</button><button class="primary" id="saveProgram">Αποθήκευση</button></div>`);
 const options=()=>{const place=$('#progPlace').value,muscle=$('#progMuscle').value;return exerciseCatalog.filter(x=>(muscle==='full'||x.muscle===muscle)&&x.places.includes(place))};
 const add=(selected='')=>{const r=document.createElement('div');r.className='exercise-row';r.innerHTML=`<select class="exercise-select"></select><input type="number" value="3" min="1" aria-label="Σετ"><input type="number" value="10" min="1" aria-label="Επαναλήψεις"><button type="button" class="danger">×</button>`;const sel=r.querySelector('select');const names=[...new Set(exerciseCatalog.map(x=>x.name))].sort((a,b)=>a.localeCompare(b,'el'));sel.innerHTML='<option value="">Επίλεξε άσκηση</option>'+names.map(n=>`<option ${n===selected?'selected':''}>${esc(n)}</option>`).join('');r.querySelector('button').onclick=()=>r.remove();$('#exerciseBuilder').appendChild(r)};
 const refresh=()=>{const list=options();$('#exerciseSuggestions').innerHTML=list.length?list.map(x=>`<button type="button" class="chip suggestion-add" data-name="${encodeURIComponent(x.name)}">+ ${esc(x.name)}</button>`).join(''):'<span class="muted small">Δεν βρέθηκαν ασκήσεις για αυτόν τον συνδυασμό.</span>';$$('.suggestion-add').forEach(b=>b.onclick=()=>add(decodeURIComponent(b.dataset.name)))};
 $('#progPlace').onchange=refresh;$('#progMuscle').onchange=refresh;add();$('#addExercise').onclick=()=>add();refresh();
 $('#saveProgram').onclick=e=>{e.preventDefault();const exercises=$$('#exerciseBuilder .exercise-row').map(r=>{const i=r.querySelectorAll('select,input');return[i[0].value.trim(),Number(i[1].value),Number(i[2].value)]}).filter(x=>x[0]);if(!$('#progTitle').value.trim()||!exercises.length)return;person().customPrograms.push({id:uid(),title:$('#progTitle').value.trim(),place:$('#progPlace').value,muscle:$('#progMuscle').value,level:person().level,duration:Number($('#progDuration').value),goal:person().goal,exercises});closeModal();save();toast('Το πρόγραμμα δημιουργήθηκε')}
}
function renderCalendar(){
 const y=calDate.getFullYear(),m=calDate.getMonth();
 $('#calendarMonth').textContent=new Intl.DateTimeFormat('el-GR',{month:'long',year:'numeric'}).format(calDate);
 const first=new Date(y,m,1),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prevDays=new Date(y,m,0).getDate(),g=$('#calendarGrid');
 g.innerHTML='';
 for(let i=0;i<42;i++){
  let d,mon=m,yr=y,out=false;
  if(i<offset){d=prevDays-offset+i+1;mon=m-1;out=true}
  else if(i>=offset+days){d=i-offset-days+1;mon=m+1;out=true}
  else d=i-offset+1;
  const dt=new Date(yr,mon,d),iso=[dt.getFullYear(),String(dt.getMonth()+1).padStart(2,'0'),String(dt.getDate()).padStart(2,'0')].join('-');
  const b=document.createElement('button');
  b.type='button';
  const hasWorkout=(person().calendar[iso]||[]).length>0;
  b.className='day'+(out?' out':'')+(iso===todayISO()?' today':'')+(hasWorkout?' has-workout':'')+(iso===selectedDate?' selected':'');
  b.innerHTML=`<span>${d}</span>`;
  b.onclick=()=>{
   selectedDate=iso;
   renderCalendar();
   showDayQuickActions(iso);
  };
  g.appendChild(b);
 }
 renderDayPanel();
}
function renderDayPanel(){
 $('#selectedDateTitle').textContent=fmtDate(selectedDate);
 const a=person().calendar[selectedDate]||[],g=$('#dayEntries');g.innerHTML='';
 if(!a.length)g.innerHTML='<p class="muted">Δεν υπάρχει καταχωρισμένη προπόνηση.</p>';
 a.forEach(e=>{
  const row=document.createElement('div');row.className='entry'+(e.done?' done':'');
  row.innerHTML=`<div class="grow"><b>${esc(e.title)}</b><span class="muted small">${e.done?'Ολοκληρώθηκε':'Προγραμματισμένη'}</span></div><button type="button" class="primary">${e.done?'Προβολή':'Έναρξη'}</button><button type="button" class="danger">×</button>`;
  row.querySelector('.primary').onclick=()=>openWorkout(e,selectedDate);
  row.querySelector('.danger').onclick=()=>{person().calendar[selectedDate]=a.filter(x=>x.id!==e.id);save();renderCalendar()};
  g.appendChild(row)
 })
}
$('#prevMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};
$('#nextMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};
$('#calendarTodayBtn').onclick=()=>{calDate=new Date();selectedDate=todayISO();renderCalendar()};
function addSimpleWorkout(date=selectedDate){
 const per=person();per.calendar[date]=per.calendar[date]||[];
 per.calendar[date].push({id:uid(),title:'Προπόνηση',done:true,duration:0,exercises:[],completedAt:new Date().toISOString()});
 hideDayQuickActions();
 save();renderCalendar();toast('Η προπόνηση καταχωρίστηκε');
}
function showDayQuickActions(date){
 let box=document.querySelector('#dayQuickActions');
 if(!box){
  box=document.createElement('div');box.id='dayQuickActions';box.className='day-action-overlay';
  box.innerHTML=`<div class="day-action-card"><button type="button" class="day-action-close" aria-label="Κλείσιμο">×</button><div class="eyebrow">ΕΠΙΛΕΓΜΕΝΗ ΗΜΕΡΑ</div><h2 id="quickDateTitle"></h2><p>Θέλεις να σημειώσεις ότι έκανες προπόνηση αυτή την ημέρα;</p><button type="button" class="primary day-action-add">+ Προσθήκη προπόνησης</button><p class="muted small">Δεν χρειάζεται να γράψεις ασκήσεις ή διάρκεια.</p></div>`;
  document.body.appendChild(box);
  box.querySelector('.day-action-close').onclick=hideDayQuickActions;
  box.addEventListener('click',e=>{if(e.target===box)hideDayQuickActions()});
 }
 box.querySelector('#quickDateTitle').textContent=fmtDate(date);
 box.querySelector('.day-action-add').onclick=()=>addSimpleWorkout(date);
 box.classList.add('show');
}
function hideDayQuickActions(){document.querySelector('#dayQuickActions')?.classList.remove('show')}
$('#addDayWorkoutBtn').onclick=()=>addSimpleWorkout(selectedDate);
function openWorkout(entry,date){
 entry.exercises=entry.exercises||[];openModal(`<h2>${esc(entry.title)}</h2><p class="muted">${fmtDate(date)}</p><label>Διάρκεια προπόνησης (λεπτά)<input id="workoutDuration" type="number" min="0" value="${entry.duration||''}" placeholder="π.χ. 60"></label><h3>Ασκήσεις</h3><div id="workoutEditor" class="workout-editor"></div><button type="button" class="secondary" id="addWorkoutExercise">+ Άσκηση</button><div class="modal-actions"><button value="cancel" class="secondary">Κλείσιμο</button><button type="button" class="secondary" id="saveWorkoutChanges">Αποθήκευση αλλαγών</button><button type="button" class="primary" id="finishWorkout">${entry.done?'Αποθήκευση ως ολοκληρωμένη':'Ολοκλήρωση'}</button></div>`);
 const host=$('#workoutEditor');const addRow=(x=['',3,10])=>{const r=document.createElement('div');r.className='workout-exercise-row';r.innerHTML=`<label>Άσκηση<input class="we-name" value="${esc(x[0]||'')}"><button type="button" class="exercise-link we-image">Προβολή εικόνας</button></label><label>Σετ<input class="we-sets" type="number" min="1" value="${x[1]||3}"></label><label>Επαν.<input class="we-reps" type="number" min="1" value="${x[2]||10}"></label><button type="button" class="danger">×</button>`;r.querySelector('.danger').onclick=()=>r.remove();r.querySelector('.we-image').onclick=()=>showExercise(r.querySelector('.we-name').value);host.appendChild(r)};entry.exercises.forEach(addRow);$('#addWorkoutExercise').onclick=()=>addRow();
 const collect=()=>{entry.duration=Number($('#workoutDuration').value||0);entry.exercises=$$('#workoutEditor .workout-exercise-row').map(r=>[r.querySelector('.we-name').value.trim(),Number(r.querySelector('.we-sets').value||1),Number(r.querySelector('.we-reps').value||1)]).filter(x=>x[0]);};
 $('#saveWorkoutChanges').onclick=()=>{collect();closeModal();save();renderCalendar();toast('Οι αλλαγές αποθηκεύτηκαν')};$('#finishWorkout').onclick=()=>{collect();entry.done=true;entry.completedAt=new Date().toISOString();closeModal();save();renderCalendar();toast('Η προπόνηση αποθηκεύτηκε')};
}
function exercisePose(name){const n=name.toLowerCase();if(n.includes('κάμψ')||n.includes('πιέσεις στήθους'))return 'push';if(n.includes('κωπηλα'))return 'row';if(n.includes('καθίσ')||n.includes('προβολ'))return 'squat';if(n.includes('άρσεις θανάτου'))return 'hinge';if(n.includes('σανίδα')||n.includes('ορειβά'))return 'plank';if(n.includes('ώμων')||n.includes('πλάγιες άρσεις'))return 'press';if(n.includes('δικεφάλ'))return 'curl';if(n.includes('τρικεφάλ'))return 'triceps';if(n.includes('γέφυρ'))return 'bridge';return 'general'}
function exerciseSvg(name){
 const pose=exercisePose(name);
 const head=(x,y)=>`<ellipse class="skin" cx="${x}" cy="${y}" rx="18" ry="22"/><path class="hair" d="M${x-17} ${y-5} Q${x} ${y-27} ${x+18} ${y-5} Q${x+5} ${y-15} ${x-17} ${y-5}"/>`;
 const dumbbell=(x,y,rot=0)=>`<g transform="translate(${x} ${y}) rotate(${rot})"><rect class="metal" x="-16" y="-4" width="32" height="8" rx="4"/><rect class="weight" x="-28" y="-11" width="10" height="22" rx="3"/><rect class="weight" x="18" y="-11" width="10" height="22" rx="3"/></g>`;
 const standing=(x,end,kind)=>{
   const hy=70, shoulder=112, hip=178, knee=225, foot=272;
   let arms='',legs='',torso=`<path class="shirt" d="M${x-34} ${shoulder} Q${x} ${shoulder-12} ${x+34} ${shoulder} L${x+24} ${hip} Q${x} ${hip+10} ${x-24} ${hip} Z"/>`;
   if(kind==='squat'){
     const dy=end?34:0, hx=x+(end?18:0), sy=shoulder+dy, hipy=hip+dy;
     torso=`<path class="shirt" d="M${x-32} ${sy} Q${hx} ${sy-12} ${x+38} ${sy+8} L${x+18} ${hipy} Q${hx} ${hipy+8} ${x-20} ${hipy-3} Z"/>`;
     legs=`<path class="limb" d="M${x-12} ${hipy} L${x-48} ${end?220:225} L${x-70} ${foot}"/><path class="limb" d="M${x+12} ${hipy} L${x+58} ${end?220:225} L${x+76} ${foot}"/><path class="shoe" d="M${x-83} ${foot} h34"/><path class="shoe" d="M${x+61} ${foot} h34"/>`;
     arms=`<path class="arm" d="M${x-24} ${sy+15} L${x-58} ${sy+42} L${x-40} ${sy+62}"/><path class="arm" d="M${x+24} ${sy+15} L${x+58} ${sy+42} L${x+40} ${sy+62}"/>${dumbbell(x-42,sy+64)}${dumbbell(x+42,sy+64)}`;
     return `<g>${head(x+(end?18:0),hy+dy)}${torso}${arms}${legs}</g>`;
   }
   if(kind==='press'){
     legs=`<path class="limb" d="M${x-12} ${hip} L${x-18} ${knee} L${x-28} ${foot}"/><path class="limb" d="M${x+12} ${hip} L${x+18} ${knee} L${x+28} ${foot}"/><path class="shoe" d="M${x-42} ${foot} h30"/><path class="shoe" d="M${x+14} ${foot} h30"/>`;
     if(end){arms=`<path class="arm" d="M${x-24} ${shoulder+15} L${x-42} 86 L${x-40} 42"/><path class="arm" d="M${x+24} ${shoulder+15} L${x+42} 86 L${x+40} 42"/>${dumbbell(x-40,34)}${dumbbell(x+40,34)}`}
     else{arms=`<path class="arm" d="M${x-24} ${shoulder+15} L${x-58} 132 L${x-44} 96"/><path class="arm" d="M${x+24} ${shoulder+15} L${x+58} 132 L${x+44} 96"/>${dumbbell(x-44,91)}${dumbbell(x+44,91)}`}
   } else if(kind==='curl'){
     legs=`<path class="limb" d="M${x-12} ${hip} L${x-18} ${knee} L${x-28} ${foot}"/><path class="limb" d="M${x+12} ${hip} L${x+18} ${knee} L${x+28} ${foot}"/><path class="shoe" d="M${x-42} ${foot} h30"/><path class="shoe" d="M${x+14} ${foot} h30"/>`;
     arms=end?`<path class="arm" d="M${x-24} ${shoulder+15} L${x-42} 155 L${x-52} 116"/><path class="arm" d="M${x+24} ${shoulder+15} L${x+42} 155 L${x+52} 116"/>${dumbbell(x-54,108)}${dumbbell(x+54,108)}`:`<path class="arm" d="M${x-24} ${shoulder+15} L${x-40} 166 L${x-44} 208"/><path class="arm" d="M${x+24} ${shoulder+15} L${x+40} 166 L${x+44} 208"/>${dumbbell(x-44,214)}${dumbbell(x+44,214)}`;
   } else {
     legs=`<path class="limb" d="M${x-12} ${hip} L${x-18} ${knee} L${x-28} ${foot}"/><path class="limb" d="M${x+12} ${hip} L${x+18} ${knee} L${x+28} ${foot}"/><path class="shoe" d="M${x-42} ${foot} h30"/><path class="shoe" d="M${x+14} ${foot} h30"/>`;
     arms=`<path class="arm" d="M${x-24} ${shoulder+15} L${x-48} 164 L${x-50} 210"/><path class="arm" d="M${x+24} ${shoulder+15} L${x+48} 164 L${x+50} 210"/>${dumbbell(x-50,216)}${dumbbell(x+50,216)}`;
   }
   return `<g>${head(x,hy)}${torso}${arms}${legs}</g>`;
 };
 const floorPose=(x,end,kind)=>{
   if(kind==='push'||kind==='plank'){
     const y=end&&kind==='push'?210:176;
     return `<g>${head(x-78,y-26)}<path class="shirt" d="M${x-55} ${y-20} L${x+34} ${y-2} L${x+28} ${y+25} L${x-60} ${y+8} Z"/><path class="limb" d="M${x+30} ${y+10} L${x+92} ${y+24} L${x+128} ${y+28}"/><path class="arm" d="M${x-42} ${y-3} L${x-30} ${end?250:225} L${x-10} ${end?250:225}"/><path class="shoe" d="M${x+115} ${y+28} h28"/></g>`;
   }
   if(kind==='bridge'){
     const lift=end?44:0;
     return `<g>${head(x-88,220-lift)}<path class="shirt" d="M${x-66} ${216-lift} L${x+15} ${205-lift} L${x+40} ${228-lift} L${x-58} ${242-lift} Z"/><path class="limb" d="M${x+35} ${224-lift} L${x+76} 252 L${x+110} 252"/><path class="arm" d="M${x-45} ${230-lift} L${x-20} 258"/><path class="shoe" d="M${x+95} 252 h30"/></g>`;
   }
   return standing(x,end,kind);
 };
 const hinge=(x,end,kind)=>{
   const tilt=end?20:0;
   return `<g transform="rotate(${tilt} ${x} 175)">${head(x-8,72)}<path class="shirt" d="M${x-35} 108 Q${x} 96 ${x+34} 112 L${x+26} 178 L${x-20} 181 Z"/><path class="limb" d="M${x-10} 178 L${x-26} 226 L${x-32} 274"/><path class="limb" d="M${x+12} 178 L${x+30} 226 L${x+36} 274"/><path class="arm" d="M${x-25} 124 L${x-55} ${end?170:202} L${x-52} ${end?216:232}"/><path class="arm" d="M${x+25} 124 L${x+55} ${end?170:202} L${x+52} ${end?216:232}"/>${dumbbell(x-52,end?220:238)}${dumbbell(x+52,end?220:238)}<path class="shoe" d="M${x-47} 274 h30"/><path class="shoe" d="M${x+21} 274 h30"/></g>`;
 };
 const fig=(x,end)=> pose==='hinge'||pose==='row'?hinge(x,end,pose):pose==='push'||pose==='plank'||pose==='bridge'?floorPose(x,end,pose):standing(x,end,pose);
 return `<svg viewBox="0 0 760 340" role="img" aria-label="Οδηγίες εκτέλεσης ${esc(name)}"><defs><style>.skin{fill:#d7a47e;stroke:#684b3d;stroke-width:3}.hair{fill:#3b2a22}.shirt{fill:var(--primary);stroke:#263746;stroke-width:4;stroke-linejoin:round}.limb,.arm{fill:none;stroke:#d7a47e;stroke-width:18;stroke-linecap:round;stroke-linejoin:round}.shoe{fill:none;stroke:#263746;stroke-width:12;stroke-linecap:round}.metal{fill:#6b7884}.weight{fill:#263746}.label{fill:var(--text);font:600 19px system-ui}.hint{fill:var(--muted);font:16px system-ui}.arrow{fill:none;stroke:var(--primary);stroke-width:8;stroke-linecap:round;stroke-linejoin:round}</style></defs><rect x="14" y="14" width="350" height="312" rx="22" fill="var(--surface-2)"/><rect x="396" y="14" width="350" height="312" rx="22" fill="var(--surface-2)"/><text class="label" x="189" y="42" text-anchor="middle">Αρχική θέση</text><text class="label" x="571" y="42" text-anchor="middle">Τελική θέση</text>${fig(190,false)}${fig(570,true)}<path class="arrow" d="M365 170 H393 M383 158 L395 170 L383 182"/></svg>`;
}
function exerciseImagePair(name){
 const pose=exercisePose(name), base='https://commons.wikimedia.org/wiki/Special:Redirect/file/';
 const files={
  squat:['Squats-1.png','Squats-2-1.png'],
  hinge:['Romanian-deadlift-1.png','Romanian-deadlift-2.png'],
  press:['Dumbbell-shoulder-press-1.png','Dumbbell-shoulder-press-2.png'],
  curl:['Biceps curl with dumbbell 1.svg','Biceps curl with dumbbell 2.svg'],
  row:['Dumbbell-upright-row-1.png','Dumbbell-upright-row-2.png'],
  push:['Dumbbell-bench-press-1.png','Dumbbell-bench-press-2.png'],
  triceps:['One-arm-triceps-extension-1.png','One-arm-triceps-extension-2.png'],
  bridge:['Squats-1.png','Squats-2-1.png'],
  plank:['Push-up-1.png','Push-up-2.png'],
  general:['Dumbbell-shoulder-press-1.png','Dumbbell-shoulder-press-2.png']
 };
 const pair=files[pose]||files.general;
 return pair.map(f=>base+encodeURIComponent(f));
}
function exerciseGuide(name){
 const n=name.toLowerCase();
 const guide=(steps,muscles,breathing,mistakes,tips)=>({steps,muscles,breathing,mistakes,tips});
 if(n.includes('καθίσ')) return guide(
  ['Στάσου με τα πόδια περίπου στο άνοιγμα των ώμων και κράτησε τον κορμό σφιχτό.','Στείλε τη λεκάνη πίσω και λύγισε τα γόνατα, κρατώντας τις φτέρνες στο έδαφος.','Κατέβα μέχρι εκεί που ελέγχεις τη μέση σου και έπειτα πίεσε από τις φτέρνες για να σηκωθείς.'],
  ['Τετρακέφαλοι','Γλουτοί','Οπίσθιοι μηριαίοι','Κορμός'],
  'Εισπνοή στο κατέβασμα και εκπνοή καθώς ανεβαίνεις.',
  ['Τα γόνατα να κλείνουν προς τα μέσα.','Οι φτέρνες να σηκώνονται από το έδαφος.','Η μέση να στρογγυλεύει.'],
  ['Κοίτα μπροστά.','Κράτησε τα γόνατα στην ίδια κατεύθυνση με τα πέλματα.','Κάνε την κίνηση αργά και ελεγχόμενα.']);
 if(n.includes('προβολ')) return guide(
  ['Κάνε ένα ελεγχόμενο βήμα μπροστά ή πίσω, ανάλογα με την άσκηση.','Χαμήλωσε τη λεκάνη ώσπου και τα δύο γόνατα να λυγίσουν περίπου στις 90°.','Πίεσε από το μπροστινό πέλμα και επέστρεψε στην αρχική θέση.'],
  ['Τετρακέφαλοι','Γλουτοί','Οπίσθιοι μηριαίοι','Κορμός'],
  'Εισπνοή στο κατέβασμα και εκπνοή στην επιστροφή.',
  ['Το μπροστινό γόνατο να πέφτει προς τα μέσα.','Πολύ στενό βήμα που χάνει την ισορροπία.','Ο κορμός να γέρνει απότομα μπροστά.'],
  ['Κράτησε τον κορμό ψηλά.','Πάτησε ολόκληρο το μπροστινό πέλμα.']);
 if(n.includes('κάμψ')) return guide(
  ['Τοποθέτησε τα χέρια λίγο πιο ανοιχτά από τους ώμους και κράτησε το σώμα σε ευθεία γραμμή.','Λύγισε τους αγκώνες και κατέβασε το στήθος ελεγχόμενα.','Πίεσε το έδαφος και επέστρεψε χωρίς να χαλάσει η θέση της μέσης.'],
  ['Στήθος','Τρικέφαλοι','Πρόσθιοι ώμοι','Κορμός'],
  'Εισπνοή καθώς κατεβαίνεις και εκπνοή καθώς πιέζεις προς τα πάνω.',
  ['Η μέση να βουλιάζει.','Οι αγκώνες να ανοίγουν τελείως στο πλάι.','Ο αυχένας να πέφτει προς τα κάτω.'],
  ['Για πιο εύκολη εκτέλεση, κάνε την άσκηση στα γόνατα ή σε παγκάκι.','Κράτησε τους αγκώνες περίπου 30–45° από τον κορμό.']);
 if(n.includes('κωπηλα')) return guide(
  ['Λύγισε ελαφρά τα γόνατα, στείλε τη λεκάνη πίσω και κράτησε την πλάτη ουδέτερη.','Τράβηξε το βάρος προς τα πλευρά, οδηγώντας τον αγκώνα πίσω.','Κατέβασε αργά το βάρος μέχρι να τεντώσει το χέρι.'],
  ['Πλάτη','Πλατύς ραχιαίος','Οπίσθιοι ώμοι','Δικέφαλοι'],
  'Εκπνοή όταν τραβάς το βάρος και εισπνοή όταν το κατεβάζεις.',
  ['Στρογγυλή μέση.','Απότομο τράβηγμα με φόρα.','Ο ώμος να ανεβαίνει προς το αυτί.'],
  ['Σκέψου ότι φέρνεις τον αγκώνα προς την τσέπη σου.','Κράτησε τον αυχένα στην προέκταση της σπονδυλικής στήλης.']);
 if(n.includes('άρσεις θανάτου')) return guide(
  ['Στάσου με τα βάρη μπροστά στους μηρούς και τα γόνατα ελαφρά λυγισμένα.','Στείλε τη λεκάνη πίσω και κατέβασε τα βάρη κοντά στα πόδια, κρατώντας την πλάτη ουδέτερη.','Σφίξε τους γλουτούς και φέρε τη λεκάνη μπροστά για να επιστρέψεις όρθιος.'],
  ['Οπίσθιοι μηριαίοι','Γλουτοί','Ραχιαίοι','Κορμός'],
  'Εισπνοή στο κατέβασμα και εκπνοή στην άνοδο.',
  ['Η κίνηση να γίνεται σαν κάθισμα αντί για κίνηση ισχίου.','Τα βάρη να απομακρύνονται από τα πόδια.','Η μέση να στρογγυλεύει.'],
  ['Κράτησε τα βάρη κοντά στο σώμα.','Σταμάτα όταν αισθανθείς δυνατό τέντωμα πίσω από τους μηρούς χωρίς να χάνεται η θέση της πλάτης.']);
 if(n.includes('πιέσεις στήθους')) return guide(
  ['Ξάπλωσε σταθερά και κράτησε τα βάρη δίπλα στο στήθος με τους καρπούς ίσιους.','Πίεσε τα βάρη προς τα πάνω μέχρι να τεντώσουν σχεδόν οι αγκώνες.','Κατέβασέ τα αργά μέχρι οι αγκώνες να βρεθούν λίγο χαμηλότερα από το στήθος.'],
  ['Στήθος','Τρικέφαλοι','Πρόσθιοι ώμοι'],
  'Εκπνοή στην πίεση και εισπνοή στο κατέβασμα.',
  ['Οι καρποί να λυγίζουν πίσω.','Τα βάρη να χτυπούν μεταξύ τους.','Οι αγκώνες να ανοίγουν τελείως στο πλάι.'],
  ['Κράτησε τις ωμοπλάτες πίσω και κάτω.','Πίεσε τα πέλματα στο έδαφος για σταθερότητα.']);
 if(n.includes('πιέσεις ώμων')||n.includes('πίεση ώμων')) return guide(
  ['Κράτησε τα βάρη στο ύψος των ώμων με τους καρπούς πάνω από τους αγκώνες.','Πίεσε τα βάρη προς τα πάνω χωρίς να λυγίζει η μέση.','Κατέβασέ τα αργά στο ύψος των ώμων.'],
  ['Ώμοι','Τρικέφαλοι','Άνω θωρακικοί','Κορμός'],
  'Εκπνοή στην πίεση προς τα πάνω και εισπνοή στο κατέβασμα.',
  ['Υπερέκταση της μέσης.','Οι αγκώνες να πέφτουν πολύ πίσω.','Απότομο κλείδωμα των αγκώνων.'],
  ['Σφίξε κοιλιά και γλουτούς.','Κράτησε τα πλευρά χαμηλά.']);
 if(n.includes('πλάγιες άρσεις')) return guide(
  ['Στάσου όρθιος με τα βάρη δίπλα στους μηρούς και τους αγκώνες ελαφρά λυγισμένους.','Σήκωσε τα χέρια στο πλάι μέχρι περίπου το ύψος των ώμων.','Κατέβασέ τα αργά χωρίς να αφήσεις τα βάρη να πέσουν.'],
  ['Πλάγιοι δελτοειδείς','Άνω τραπεζοειδείς'],
  'Εκπνοή στην άνοδο και εισπνοή στο κατέβασμα.',
  ['Πολύ βαρύ φορτίο και κίνηση με φόρα.','Οι ώμοι να σηκώνονται προς τα αυτιά.','Τα χέρια να ανεβαίνουν πολύ ψηλότερα από τους ώμους.'],
  ['Χρησιμοποίησε μικρό βάρος.','Οδήγησε την κίνηση με τους αγκώνες.']);
 if(n.includes('δικεφάλ')) return guide(
  ['Κράτησε τους αγκώνες κοντά στα πλευρά και τους καρπούς ουδέτερους.','Λύγισε τους αγκώνες και φέρε τα βάρη προς τους ώμους.','Κατέβασε αργά μέχρι σχεδόν πλήρη έκταση.'],
  ['Δικέφαλοι','Βραχιόνιος','Πήχεις'],
  'Εκπνοή στην κάμψη και εισπνοή στο κατέβασμα.',
  ['Οι αγκώνες να κινούνται μπροστά.','Κούνημα του κορμού για φόρα.','Απότομο κατέβασμα.'],
  ['Κράτησε τους ώμους χαμηλά.','Δούλεψε σε πλήρες και ελεγχόμενο εύρος.']);
 if(n.includes('τρικεφάλ')||n.includes('βυθίσεις')) return guide(
  ['Κράτησε τον κορμό σταθερό και τους αγκώνες στραμμένους προς τα εμπρός ή πίσω, ανάλογα με την άσκηση.','Λύγισε τους αγκώνες ελεγχόμενα.','Τέντωσε τους αγκώνες χωρίς απότομο κλείδωμα.'],
  ['Τρικέφαλοι','Πρόσθιοι ώμοι','Στήθος'],
  'Εισπνοή στην κάμψη και εκπνοή στην έκταση.',
  ['Οι αγκώνες να ανοίγουν πολύ.','Οι ώμοι να ανεβαίνουν προς τα αυτιά.','Υπερβολικά βαθιά κάθοδος στις βυθίσεις.'],
  ['Κράτησε τους αγκώνες κοντά στο σώμα.','Σταμάτα αν αισθανθείς πόνο στον ώμο.']);
 if(n.includes('γέφυρ')||n.includes('άρσεις λεκάνης')) return guide(
  ['Ξάπλωσε με τα γόνατα λυγισμένα και τα πέλματα σταθερά στο έδαφος.','Πίεσε τις φτέρνες και σήκωσε τη λεκάνη μέχρι κορμός και μηροί να σχηματίσουν ευθεία.','Σφίξε τους γλουτούς και κατέβασε αργά.'],
  ['Γλουτοί','Οπίσθιοι μηριαίοι','Κορμός'],
  'Εκπνοή στην άνοδο και εισπνοή στο κατέβασμα.',
  ['Υπερέκταση της μέσης.','Πίεση από τις μύτες αντί από τις φτέρνες.','Τα γόνατα να ανοίγουν ή να κλείνουν.'],
  ['Κράτησε τα πλευρά χαμηλά.','Σφίξε τους γλουτούς στην κορυφή για ένα δευτερόλεπτο.']);
 if(n.includes('σανίδα')) return guide(
  ['Στήριξε αγκώνες ή παλάμες κάτω από τους ώμους.','Τέντωσε τα πόδια και κράτησε κεφάλι, πλάτη και λεκάνη σε ευθεία.','Σφίξε κοιλιά και γλουτούς και κράτησε τη θέση.'],
  ['Κοιλιακοί','Εγκάρσιος κοιλιακός','Ώμοι','Γλουτοί'],
  'Ανάπνεε ήρεμα και σταθερά χωρίς να κρατάς την αναπνοή.',
  ['Η μέση να βουλιάζει.','Η λεκάνη να σηκώνεται πολύ ψηλά.','Οι ώμοι να απομακρύνονται από τη στήριξη.'],
  ['Κάνε μικρότερη διάρκεια με σωστή τεχνική αντί για περισσότερο χρόνο με χαλαρή μέση.']);
 if(n.includes('ορειβά')) return guide(
  ['Πάρε θέση σανίδας με τα χέρια κάτω από τους ώμους.','Φέρε εναλλάξ κάθε γόνατο προς το στήθος.','Κράτησε τον κορμό σταθερό και συνέχισε με ελεγχόμενο ρυθμό.'],
  ['Κοιλιακοί','Καμπτήρες ισχίου','Ώμοι','Τετρακέφαλοι'],
  'Ανάπνεε ρυθμικά σε όλη τη διάρκεια.',
  ['Η λεκάνη να ανεβοκατεβαίνει έντονα.','Τα χέρια να βρίσκονται πολύ μπροστά.','Να χάνεται η ευθεία της μέσης.'],
  ['Ξεκίνα αργά και αύξησε την ταχύτητα μόνο όταν κρατάς σωστή θέση.']);
 if(n.includes('μονόζυγο')||n.includes('έλξεις')) return guide(
  ['Πιάσε τη μπάρα σταθερά και άφησε το σώμα να κρέμεται με ενεργούς ώμους.','Τράβηξε το στήθος προς τη μπάρα, οδηγώντας τους αγκώνες προς τα κάτω.','Κατέβασε αργά μέχρι σχεδόν πλήρη έκταση των χεριών.'],
  ['Πλατύς ραχιαίος','Δικέφαλοι','Άνω πλάτη','Κορμός'],
  'Εκπνοή στο τράβηγμα και εισπνοή στο κατέβασμα.',
  ['Κούνημα του σώματος.','Οι ώμοι να ανεβαίνουν στα αυτιά.','Απότομη πτώση στην επιστροφή.'],
  ['Χρησιμοποίησε υποβοήθηση ή αρνητικές επαναλήψεις αν χρειάζεται.']);
 if(n.includes('ανεβάσματα')) return guide(
  ['Τοποθέτησε ολόκληρο το πέλμα πάνω στο σταθερό σκαλοπάτι ή παγκάκι.','Πίεσε από το επάνω πόδι και ανέβασε το σώμα χωρίς ώθηση από το κάτω πόδι.','Κατέβασε αργά και επανάλαβε.'],
  ['Τετρακέφαλοι','Γλουτοί','Οπίσθιοι μηριαίοι','Γάμπες'],
  'Εκπνοή στην άνοδο και εισπνοή στο κατέβασμα.',
  ['Μόνο η μύτη του πέλματος πάνω στο σκαλοπάτι.','Σπρώξιμο με το κάτω πόδι.','Το γόνατο να κλείνει προς τα μέσα.'],
  ['Χρησιμοποίησε σταθερή επιφάνεια.','Ξεκίνα με χαμηλό ύψος.']);
 if(n.includes('γάμπ')) return guide(
  ['Στάσου όρθιος με τα πέλματα παράλληλα και κράτησε ισορροπία.','Σήκωσε τις φτέρνες όσο πιο ψηλά ελέγχεις.','Κατέβασε αργά μέχρι να πατήσουν οι φτέρνες.'],
  ['Γαστροκνήμιος','Υποκνημίδιος'],
  'Εκπνοή στην άνοδο και εισπνοή στο κατέβασμα.',
  ['Απότομες αναπηδήσεις.','Οι αστράγαλοι να γέρνουν προς τα μέσα ή έξω.'],
  ['Κράτησε για ένα δευτερόλεπτο στην κορυφή.']);
 return guide(
  ['Διάβασε πρώτα την αρχική και την τελική θέση στην εικόνα.','Εκτέλεσε την κίνηση αργά, με τον κορμό σταθερό και χωρίς απότομες κινήσεις.','Σταμάτα αν αισθανθείς οξύ πόνο ή ενόχληση στις αρθρώσεις.'],
  ['Κύρια μυϊκή ομάδα της άσκησης','Κορμός για σταθεροποίηση'],
  'Μην κρατάς την αναπνοή. Εκπνέεις στο δύσκολο μέρος της κίνησης.',
  ['Πολύ γρήγορη εκτέλεση.','Μεγαλύτερο βάρος από αυτό που μπορείς να ελέγξεις.','Λανθασμένη στάση της μέσης ή των αρθρώσεων.'],
  ['Ξεκίνα με μικρό εύρος και αύξησέ το σταδιακά.','Προτίμησε σωστή τεχνική αντί για περισσότερες επαναλήψεις.']);
}
function guideList(items){return `<ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}
function showExercise(name,fromModal=false){
 const pair=exerciseImagePair(name),g=exerciseGuide(name);
 openModal(`<h2>${esc(name)}</h2><div class="real-exercise-grid"><figure><figcaption>Αρχική θέση</figcaption><div class="real-exercise-image"><img src="${pair[0]}" alt="Αρχική θέση για ${esc(name)}"></div></figure><div class="exercise-arrow">→</div><figure><figcaption>Τελική θέση</figcaption><div class="real-exercise-image"><img src="${pair[1]}" alt="Τελική θέση για ${esc(name)}"></div></figure></div><div class="exercise-guide"><section><h3>▶ Εκτέλεση</h3>${guideList(g.steps)}</section><section><h3>💪 Μυϊκές ομάδες</h3>${guideList(g.muscles)}</section><section><h3>💨 Αναπνοή</h3><p>${esc(g.breathing)}</p></section><section><h3>⚠️ Συχνά λάθη</h3>${guideList(g.mistakes)}</section><section><h3>💡 Συμβουλές</h3>${guideList(g.tips)}</section></div><p class="exercise-credit">Εικονογράφηση: Everkinetic μέσω Wikimedia Commons — CC BY-SA 3.0.</p><div class="modal-actions"><button value="cancel" class="primary">Κλείσιμο</button></div>`);
 const fallback=exerciseSvg(name);
 $$('#modalContent .real-exercise-image img').forEach(img=>img.onerror=()=>{const box=img.parentElement;box.innerHTML=fallback;box.classList.add('fallback-svg')});
}

$('#themeBtn').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';save()};
$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fitplanner-backup-'+todayISO()+'.json';a.click();URL.revokeObjectURL(a.href)};
$('#importInput').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!data.people?.length)throw 0;state=data;save();toast('Το backup εισήχθη')}catch{alert('Το αρχείο backup δεν είναι έγκυρο')}};
function openModal(html){$('#modalContent').innerHTML=html;$('#modal').showModal()}
function closeModal(){$('#modal').close()}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});}if('caches' in window){caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))).catch(()=>{});}
renderAll();renderCalendar();
