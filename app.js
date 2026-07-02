// ════════════════════════════════════════════════════════════════════
// SCRIPORA  -  APP.JS
// State, constants, utilities, UI handlers, init
// Load order: engine.js -> sync.js -> app.js
// ════════════════════════════════════════════════════════════════════

// ── SECTION 1: State & Constants ──
// ═══════════════════════════════════════
// SCRIPORA   Full Engine
// ═══════════════════════════════════════
// ── Core state   declared first so nothing can crash before these exist ──
var SK='sp1',THEME_KEY='sp_theme',STATS_KEY='sp_stats';
var EMAILJS_SVC='service_8i8l9cr',EMAILJS_TPL='template_g7hi73d',EMAILJS_KEY='0PgWLFm8kqqvXjc9_';
var auth=null,db=null;

var THEMES=[
  {id:'midnight',name:'Midnight',cls:'',bg:'#12161F',s2:'#1A1F2E',ac:'#B87333',tx:'#E8E0D0',desc:'Dark ink on deep navy.'},
  {id:'obsidian',name:'Obsidian',cls:'theme-obsidian',bg:'#0D0D0D',s2:'#181818',ac:'#C9962A',tx:'#F0EBE3',desc:'Pure black with amber gold.'},
  {id:'slate',name:'Slate',cls:'theme-slate',bg:'#1A1C20',s2:'#24272D',ac:'#7B9FD4',tx:'#DCE4F0',desc:'Cool grey with steel blue.'},
  {id:'rouge',name:'Rouge',cls:'theme-rouge',bg:'#1A1218',s2:'#251C22',ac:'#C4657A',tx:'#F0E8EC',desc:'Dark plum with rose.'},
  {id:'forest',name:'Forest',cls:'theme-forest',bg:'#111A14',s2:'#182019',ac:'#5A9E6F',tx:'#E0EDDF',desc:'Deep green editorial.'}
];

var TAGS={
  hook:{label:'Hook',cls:'tag-hook',color:'#B87333'},
  ctx:{label:'Context',cls:'tag-ctx',color:'#6AAF82'},
  body:{label:'Main Body',cls:'tag-body',color:'#5A7EC9'},
  cta:{label:'CTA',cls:'tag-cta',color:'#C47AAF'},
  out:{label:'Outro',cls:'tag-out',color:'#8A6AC9'}
};

var S={scripts:[],activeId:null,currentUser:null,isGuest:false,appShown:false,drawerTab:'facts',bulkMode:false,bulkSelected:[],analysing:false,syncEnabled:false};


// ── Firebase init   wrapped so offline/CDN failure can't break the app ──
try{
  var fbConfig={apiKey:"AIzaSyB2JM8740tE5EfjQTZyfGrvBUNdJt5l6jI",authDomain:"scripora-app.firebaseapp.com",projectId:"scripora-app",storageBucket:"scripora-app.firebasestorage.app",messagingSenderId:"408270357865",appId:"1:408270357865:web:8d1e332f58b584db0329f8"};
  firebase.initializeApp(fbConfig);
  auth=firebase.auth();
  db=firebase.firestore();
}catch(e){
  console.warn('Firebase unavailable   running in local mode.',e);
}


// ── Helpers ──

function safeGtag(){try{if(typeof gtag!=='undefined')gtag.apply(null,arguments);}catch(e){}}
function uid(){return 'id_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);}
function escHtml(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function wordCount(t){return t?t.trim().split(/\s+/).filter(function(w){return w.length>0;}).length:0;}
function totalWords(script){return (script.paragraphs||[]).reduce(function(a,p){return a+wordCount(p.text);},0);}
function getActive(){for(var i=0;i<S.scripts.length;i++){if(S.scripts[i].id===S.activeId)return S.scripts[i];}return null;}
function timeAgo(ts){if(!ts)return 'just now';var d=Date.now()-new Date(ts).getTime(),m=Math.floor(d/60000);if(m<1)return 'just now';if(m<60)return m+'m ago';var h=Math.floor(m/60);if(h<24)return h+'h ago';var dy=Math.floor(h/24);if(dy===1)return 'yesterday';if(dy<7)return dy+'d ago';return Math.floor(dy/7)+'w ago';}

// ── Storage ──
function save(){localStorage.setItem(SK,JSON.stringify(S.scripts));}
function load(){try{var d=JSON.parse(localStorage.getItem(SK)||'[]');S.scripts=Array.isArray(d)?d:[];}catch(e){S.scripts=[];}}

// ── Theme ──
function applyTheme(id){var t=null;for(var i=0;i<THEMES.length;i++){if(THEMES[i].id===id){t=THEMES[i];break;}}t=t||THEMES[0];document.body.className=t.cls||'';localStorage.setItem(THEME_KEY,id);}
function currentThemeId(){return localStorage.getItem(THEME_KEY)||'midnight';}

// ── SCRIPORA INTELLIGENCE ENGINE v3 ──
// Viewer attention simulator based on temporal signal analysis

// ── Sentence utilities ──

// ── SECTION 2: UI, Render & Init ──
// ── Toast ──
var toastTimer=null;
function showToast(msg,type,icon){
  var el=document.getElementById('toast');
  var icons={success:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',error:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',info:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'};
  el.className='toast '+(type||'default');
  el.innerHTML=(icons[type]||'')+escHtml(msg);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){el.classList.remove('show');},2800);
}

// ── Screen navigation ──
var screens=['scripts','write','profile'];
function goScreen(name){
  screens.forEach(function(s){
    var el=document.getElementById('screen-'+s);
    var nt=document.getElementById('nt-'+s);
    if(el)el.classList.toggle('on',s===name);
    if(nt)nt.classList.toggle('on',s===name);
  });
  updateHeader(name);
  if(name==='scripts'){if(S.bulkMode)exitBulkMode();else setTimeout(renderScripts,0);}
  if(name==='write')renderWrite();
  if(name==='profile')renderProfile();
  recordSession();
}

function updateHeader(screen){
  var logo=document.getElementById('headerLogo');
  var right=document.getElementById('headerRight');
  logo.innerHTML='<em>Scrip</em><span>ora</span>';
  right.innerHTML='';
  if(screen==='scripts'){
    right.innerHTML='<button class="hdr-btn" onclick="toggleSearch()" title="Search"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>';
  }
}

// ── Scripts screen ──
var activeFilter=null,searchOpen=false;
function toggleSearch(){
  searchOpen=!searchOpen;
  document.getElementById('searchBar').classList.toggle('hide',!searchOpen);
  if(searchOpen)document.getElementById('searchInp').focus();
  else{document.getElementById('searchInp').value='';setTimeout(renderScripts,0);}
}
function clearSearch(){document.getElementById('searchInp').value='';toggleSearch();}
function setFilter(btn,f){
  // Double-tap same pill to deselect (show all)
  if(activeFilter===f){activeFilter=null;document.querySelectorAll('.fpill').forEach(function(p){p.classList.remove('on');});}
  else{activeFilter=f;document.querySelectorAll('.fpill').forEach(function(p){p.classList.toggle('on',p.dataset.filter===f);});}
  setTimeout(renderScripts,0);
}
function renderScripts(){
  var el=document.getElementById('scriptsList');
  var q=(document.getElementById('searchInp')?document.getElementById('searchInp').value:'').toLowerCase();
  var list=S.scripts.filter(function(s){
    var matchQ=!q||s.title.toLowerCase().indexOf(q)>=0;
    var matchF=!activeFilter||activeFilter===null||s.status===activeFilter;
    return matchQ&&matchF;
  });
  if(list.length===0){
    if(S.scripts.length===0){
      el.innerHTML='<div class="empty-state"><div class="eico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></div><h3>Your first script is waiting</h3><p>Structure your Hook, build your Context, nail your CTA. Every great video starts here.</p><button class="add-btn" id="emptyCreateBtn" onclick="openModal(\'newScript\')"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>Write your first script</button><div class="empty-hint">Scripts save automatically as you write.<br/>Sign in anytime to back them up.</div></div>';
    }else{
      el.innerHTML='<div class="empty-state"><div class="eico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div><h3>No matches</h3><p>Try a different search or filter.</p></div>';
    }
    return;
  }
  setTimeout(function(){var eb=document.getElementById('emptyCreateBtn');if(eb)eb.onclick=function(){openModal('newScript');};},0);
  var statusCls={Draft:'draft','In Progress':'progress',Ready:'ready',Filmed:'filmed'};
  el.innerHTML=list.map(function(s){
    var wc=totalWords(s),pc=(s.paragraphs||[]).length;
    return '<div class="scard'+(S.bulkMode&&S.bulkSelected.indexOf(s.id)>=0?' selected':'')+' " id="sc_'+s.id+'" ontouchstart="onScardTouchStart(\''+s.id+'\',event)" ontouchend="onScardTouchEnd()" ontouchmove="onScardTouchMove()">'+
      '<div class="scard-inner" onclick="openScript(\''+s.id+'\')">'+
      '<div class="scard-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>'+
      '<div class="scard-info"><div class="scard-name">'+escHtml(s.title)+'</div>'+
      '<div class="scard-meta">'+wc+' words &nbsp;&middot;&nbsp; '+pc+' '+(pc===1?'section':'sections')+' &nbsp;&middot;&nbsp; '+timeAgo(s.updatedAt)+'</div>'+
      '<div class="scard-row"><span class="sbadge '+(statusCls[s.status]||'draft')+'" onclick="event.stopPropagation();cycleStatus(\''+s.id+'\');" style="cursor:pointer;"><span class="sbadge-dot"></span>'+(s.status||'Draft')+'</span></div></div>'+
      '<button class="pb-action" onclick="event.stopPropagation();openScriptMenu(\''+s.id+'\')" style="padding:8px;color:var(--muted);background:none;border:none;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01"/></svg></button>'+
      '</div></div>';
  }).join('');
}

// ── Long press + bulk select ──
var _lpTimer=null;
function onScardTouchStart(id,evt){
  _lpTimer=setTimeout(function(){
    _lpTimer=null;
    enterBulkMode(id);
  },500);
}
function onScardTouchEnd(){
  if(_lpTimer){clearTimeout(_lpTimer);_lpTimer=null;}
}
function onScardTouchMove(){
  if(_lpTimer){clearTimeout(_lpTimer);_lpTimer=null;}
}
function enterBulkMode(firstId){
  S.bulkMode=true;S.bulkSelected=[firstId];
  document.getElementById('bulkBar').classList.remove('hide');
  setTimeout(renderScripts,0);
  updateBulkCount();
}
function exitBulkMode(){
  S.bulkMode=false;S.bulkSelected=[];
  document.getElementById('bulkBar').classList.add('hide');
  setTimeout(renderScripts,0);
}
function toggleBulkSelect(id){
  var idx=S.bulkSelected.indexOf(id);
  if(idx>=0)S.bulkSelected.splice(idx,1);
  else S.bulkSelected.push(id);
  // Update card visual
  var card=document.getElementById('sc_'+id);
  if(card)card.classList.toggle('selected',S.bulkSelected.indexOf(id)>=0);
  updateBulkCount();
  if(S.bulkSelected.length===0)exitBulkMode();
}
function updateBulkCount(){
  var el=document.getElementById('bulkCount');
  var n=S.bulkSelected.length;
  if(el)el.textContent=n+' selected';
}
function bulkDelete(){
  if(!S.bulkSelected.length)return;
  var n=S.bulkSelected.length;
  openModal('_raw','<div class="mhandle"></div><div class="modal-title">Delete '+n+' script'+(n===1?'':'s')+'?</div><p style="font-size:.78rem;color:var(--muted);margin-bottom:16px;">This cannot be undone.</p><div class="modal-acts"><button class="btn-g" onclick="closeMoForce()">Cancel</button><button class="btn-danger active" onclick="event.stopPropagation();confirmBulkDelete();">Delete all</button></div>');
}
function confirmBulkDelete(){
  S.scripts=S.scripts.filter(function(s){return S.bulkSelected.indexOf(s.id)<0;});
  if(S.bulkSelected.indexOf(S.activeId)>=0)S.activeId=null;
  save();syncToCloud();
  closeMoForce();
  exitBulkMode();
  showToast('Deleted','default');
}
function openScript(id){
  if(S.bulkMode){toggleBulkSelect(id);return;}
  if(S.activeId!==id){
    S.syncEnabled=false;
    if(_liveSyncTimer){clearTimeout(_liveSyncTimer);_liveSyncTimer=null;}
  }
  S.activeId=id;goScreen('write');
}

function openScriptMenu(id){
  var s=S.scripts.find(function(x){return x.id===id;});
  if(!s)return;
  var statuses=['Draft','In Progress','Ready','Filmed'];
  var statusOpts=statuses.map(function(st){
    return '<button class="tag-opt'+(s.status===st?' on':'')+'" style="color:var(--text);border-color:var(--border);" onclick="setScriptStatus(\''+id+'\',\''+st+'\');closeMoForce();">'+st+'</button>';
  }).join('');
  openModal('_raw','<div class="mhandle"></div><div class="modal-title">'+escHtml(s.title)+'</div><div class="modal-sub">Tap a status to update, or delete this script.</div><div class="tag-sel">'+statusOpts+'</div><div class="modal-acts"><button class="btn-g" onclick="closeMoForce()">Cancel</button><button class="btn-danger active" onclick="confirmDeleteScript(\''+id+'\')">Delete</button></div>');
}

function cycleStatus(id){
  var order=['Draft','In Progress','Ready','Filmed'];
  var s=S.scripts.find(function(x){return x.id===id;});
  if(!s)return;
  var idx=order.indexOf(s.status||'Draft');
  var next=order[(idx+1)%order.length];
  setScriptStatus(id,next);
  showToast(next,'default');
}
function setScriptStatus(id,status){
  var s=S.scripts.find(function(x){return x.id===id;});
  if(!s)return;
  s.status=status;s.updatedAt=new Date().toISOString();
  save();syncToCloud();
  setTimeout(renderScripts,0);
}

function confirmDeleteScript(id){
  var s=S.scripts.find(function(x){return x.id===id;});
  if(!s)return;
  openModal('_raw','<div class="mhandle"></div><div class="modal-title">Delete script?</div><div class="modal-sub" style="color:var(--text);font-weight:600;">'+escHtml(s.title)+'</div><p style="font-size:.76rem;color:var(--muted);margin:8px 0 16px;">This cannot be undone.</p><div class="modal-acts"><button class="btn-g" onclick="closeMoForce()">Cancel</button><button class="btn-danger active" onclick="event.stopPropagation();deleteScript(\''+id+'\');closeMoForce();">Yes, delete</button></div>');
}
function deleteScript(id){
  S.scripts=S.scripts.filter(function(s){return s.id!==id;});
  if(S.activeId===id)S.activeId=null;
  save();syncToCloud();
  setTimeout(renderScripts,0);
  showToast('Script deleted','default');
}

// ── Write screen ──
function renderWrite(){
  var script=getActive();
  var titleEl=document.getElementById('writeTitleLbl');
  var pbList=document.getElementById('pbList');
  var addBar=document.getElementById('pbAddBar');
  if(!script){
    titleEl.textContent='Select a script';
    pbList.innerHTML='<div class="write-empty"><p>Open a script from the Scripts tab to start writing.</p></div>';
    if(addBar)addBar.classList.add('hide');
    return;
  }
  titleEl.textContent=script.title;
  if(addBar)addBar.classList.remove('hide');
  if(!(script.paragraphs&&script.paragraphs.length)){
    pbList.innerHTML='<div class="write-empty"><p>No paragraphs yet.<br/>Add your first section below.</p></div>';
    return;
  }
  // Preserve scroll position across re-renders (tag change, move, etc.)
  var scrollEl=pbList.closest('.scr-scroll');
  var savedScroll=scrollEl?scrollEl.scrollTop:0;

  pbList.innerHTML=script.paragraphs.map(function(p){
    var tag=TAGS[p.tag]||TAGS.hook;
    var wc=wordCount(p.text);
    return '<div class="pb '+tag.cls+'" id="pb_'+p.id+'">'+
      '<div class="pb-hd">'+
      '<span class="pb-tag">'+tag.label+'</span>'+
      '</div>'+
      '<div class="pb-body"><textarea class="pb-ta" rows="3" placeholder="Write your '+tag.label.toLowerCase()+'..." onblur="saveParagraph(\''+p.id+'\',this.value)" oninput="autoResize(this);onParagraphInput(\''+p.id+'\',\''+p.tag+'\',this.value)">'+escHtml(p.text)+'</textarea></div>'+
      '<div class="pb-ft"><span class="pb-wc" id="wc_'+p.id+'">'+wc+' words</span>'+
      '<div class="pb-actions">'+
      '<button class="pb-action" onclick="moveParagraph(\''+p.id+'\',-1)" title="Move up"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg></button>'+
      '<button class="pb-action" onclick="moveParagraph(\''+p.id+'\',1)" title="Move down"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg></button>'+
      '<button class="pb-action" onclick="changeParagraphTag(\''+p.id+'\')" title="Change tag"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg></button>'+
      '<button class="pb-action" onclick="confirmDeleteParagraph(\''+p.id+'\')" title="Delete" style="color:var(--s-low)"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>'+
      '</div></div></div>';
  }).join('');
  document.querySelectorAll('.pb-ta').forEach(function(ta){autoResize(ta);});
  // Always restore scroll explicitly so Chrome's scroll-anchoring cannot
  // move the viewport during autoResize. On initial open savedScroll is 0
  // (top). On re-renders it is the position the user was already at.
  if(scrollEl){scrollEl.scrollTop=savedScroll;}
}

function editScriptTitle(){
  var script=getActive();if(!script)return;
  openModal('_raw','<div class="mhandle"></div><div class="modal-title">Rename Script</div><input class="modal-inp" id="renameTitleInp" value="'+escHtml(script.title)+'" maxlength="120" onkeydown="if(event.key===\'Enter\')saveScriptTitle()"/><div class="modal-acts"><button class="btn-g" onclick="closeMoForce()">Cancel</button><button class="btn-p" onclick="saveScriptTitle()">Save</button></div>');
  setTimeout(function(){var i=document.getElementById('renameTitleInp');if(i){i.focus();i.select();}},180);
}
function saveScriptTitle(){
  var inp=document.getElementById('renameTitleInp');
  var val=inp?inp.value.trim():'';
  if(!val){showToast('Title cannot be empty','error');return;}
  var script=getActive();if(!script)return;
  script.title=val;script.updatedAt=new Date().toISOString();
  save();syncToCloud();
  document.getElementById('writeTitleLbl').textContent=val;
  closeMoForce();
  setTimeout(renderScripts,0);
  showToast('Renamed','success');
}

function autoResize(ta){
  ta.style.height='auto';
  ta.style.height=ta.scrollHeight+'px';
}

var _liveSyncTimer=null;
function onParagraphInput(pid,tag,text){
  var wcel=document.getElementById('wc_'+pid);
  if(wcel)wcel.textContent=wordCount(text)+' words';
  // Save text immediately so sync reads current content
  var script=getActive();
  if(script){
    script.paragraphs.forEach(function(p){
      if(p.id===pid){p.text=text;}
    });
    script.updatedAt=new Date().toISOString();
    save();
  }
  // Debounced live sync
  if(S.syncEnabled){
    if(_liveSyncTimer)clearTimeout(_liveSyncTimer);
    _liveSyncTimer=setTimeout(runLiveSync,1500);
  }
}

function saveParagraph(pid,text){
  var script=getActive();if(!script)return;
  script.paragraphs.forEach(function(p){if(p.id===pid){p.text=text;}});
  script.updatedAt=new Date().toISOString();
  save();syncToCloud();
}

function moveParagraph(pid,dir){
  var script=getActive();if(!script)return;
  var ps=script.paragraphs,i=-1;
  for(var x=0;x<ps.length;x++){if(ps[x].id===pid){i=x;break;}}
  var j=i+dir;if(j<0||j>=ps.length)return;
  var tmp=ps[i];ps[i]=ps[j];ps[j]=tmp;
  script.updatedAt=new Date().toISOString();save();setTimeout(renderWrite,0);
}

function confirmDeleteParagraph(pid){
  openModal('_raw','<div class="mhandle"></div><div class="modal-title">Delete this paragraph?</div><p style="font-size:.78rem;color:var(--muted);margin-bottom:16px;">This cannot be undone.</p><div class="modal-acts"><button class="btn-g" onclick="closeMoForce()">Cancel</button><button class="btn-danger active" onclick="event.stopPropagation();deleteParagraph(\''+pid+'\');closeMoForce();">Delete</button></div>');
}
function deleteParagraph(pid){
  var script=getActive();if(!script)return;
  script.paragraphs=script.paragraphs.filter(function(p){return p.id!==pid;});
  script.updatedAt=new Date().toISOString();
  save();setTimeout(renderWrite,0);
  if(S.syncEnabled){
    if(_liveSyncTimer)clearTimeout(_liveSyncTimer);
    _liveSyncTimer=setTimeout(runLiveSync,800);
  }
}

function changeParagraphTag(pid){
  var script=getActive();if(!script)return;
  var p=null;for(var i=0;i<script.paragraphs.length;i++){if(script.paragraphs[i].id===pid){p=script.paragraphs[i];break;}}
  if(!p)return;
  var opts=Object.keys(TAGS).map(function(k){return '<button class="tag-opt '+k+(p.tag===k?' on':'')+'" onclick="applyTagChange(\''+pid+'\',\''+k+'\');closeMo()">'+TAGS[k].label+'</button>';}).join('');
  openModal('_raw','<div class="mhandle"></div><div class="modal-title">Change Tag</div><div class="modal-sub">Choose a new tag for this paragraph.</div><div class="tag-sel">'+opts+'</div>');
}

function applyTagChange(pid,tag){
  var script=getActive();if(!script)return;
  script.paragraphs.forEach(function(p){if(p.id===pid){p.tag=tag;}});
  script.updatedAt=new Date().toISOString();save();setTimeout(renderWrite,0);
  // Trigger sync on tag change
  if(S.syncEnabled){
    if(_liveSyncTimer)clearTimeout(_liveSyncTimer);
    _liveSyncTimer=setTimeout(runLiveSync,800);
  }
}

// ── Drawer ──
function openDrawer(){
  document.getElementById('drawer').classList.add('open');
  document.getElementById('dov').classList.add('open');
  renderDrawerTab();
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('dov').classList.remove('open');
}
function switchDrawerTab(btn){
  S.drawerTab=btn.dataset.tab;
  document.querySelectorAll('.dtab').forEach(function(t){t.classList.toggle('on',t===btn);});
  renderDrawerTab();
}
function renderDrawerTab(){
  var script=getActive(),body=document.getElementById('drawerBody'),tab=S.drawerTab;
  if(!script){body.innerHTML='<p style="font-size:.8rem;color:var(--muted);text-align:center;padding:20px 0;">Open a script first.</p>';return;}
  if(!script.notes)script.notes={facts:[],ideas:[],links:[],notes:[]};
  var items=script.notes[tab]||[];
  var html='';
  if(tab==='links'){
    html=items.map(function(item,i){
      var openBtn='<button class="link-open" onclick="window.open(\'' + encodeURI(item.url||'') + '\',\'_blank\')" title="Open"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></button>';
      var editBtn='<button class="fact-del" onclick="editLink(' + i + ')" title="Edit" style="color:var(--accent);"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
      var delBtn='<button class="fact-del" onclick="deleteNote(\'links\',' + i + ')" title="Remove"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>';
      return '<div class="link-item">' +
        '<div class="link-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></div>' +
        '<div class="link-info"><div class="link-label">' + escHtml(item.label||item.url||'') + '</div><div class="link-url">' + escHtml(item.url||'') + '</div></div>' +
        openBtn + editBtn + delBtn + '</div>';
    }).join('');
    html+='<button class="add-fact-btn" onclick="openModal(\'addLink\')">+ Add a link</button>';
  }else{
    html=items.map(function(item,i){
      var txt=typeof item==='string'?item:(item.text||'');
      var editBtn='<button class="fact-del" onclick="editNote(\''+tab+'\','+i+')" title="Edit" style="color:var(--accent);"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
      var delBtn='<button class="fact-del" onclick="deleteNote(\''+tab+'\','+i+')" title="Delete"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>';
      return '<div class="fact-item"><div class="fact-dot"></div><div class="fact-text">'+escHtml(txt)+'</div>'+editBtn+delBtn+'</div>';
    }).join('');
    var singular={facts:'fact',ideas:'idea',links:'link',notes:'note'}[tab]||tab;
    html+='<button class="add-fact-btn" onclick="openModal(\'addNote\',\''+tab+'\')">+ Add a '+singular+'</button>';
  }
  body.innerHTML=html||'<p style="font-size:.78rem;color:var(--muted);text-align:center;padding:16px 0;">No '+tab+' yet.</p>';
  body.innerHTML+=html?'':'';
}
function deleteNote(tab,idx){
  var script=getActive();if(!script||!script.notes)return;
  script.notes[tab].splice(idx,1);save();setTimeout(renderDrawerTab,0);
}
function editNote(tab,idx){
  var script=getActive();if(!script||!script.notes)return;
  var current=script.notes[tab][idx]||'';
  var txt=typeof current==='string'?current:(current.text||'');
  openModal('_raw',
    '<div class="mhandle"></div><div class="modal-title">Edit note</div>'+
    '<textarea class="modal-inp" id="editNoteText" style="min-height:80px;resize:vertical;">'+escHtml(txt)+'</textarea>'+
    '<div class="modal-acts">'+
      '<button class="btn-g" onclick="closeMoForce()">Cancel</button>'+
      '<button class="btn-p" onclick="saveEditNote(\''+tab+'\','+idx+')">Save</button>'+
    '</div>');
  setTimeout(function(){var ta=document.getElementById('editNoteText');if(ta){ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);}},180);
}
function saveEditNote(tab,idx){
  var ta=document.getElementById('editNoteText');
  var val=ta?(ta.value.trim()):'';
  if(!val){showToast('Note cannot be empty','error');return;}
  var script=getActive();if(!script||!script.notes)return;
  script.notes[tab][idx]=val;
  save();closeMoForce();setTimeout(renderDrawerTab,0);
  showToast('Updated','success');
}

// ── View Script ──
function openViewScript(){
  var script=getActive();if(!script)return;
  document.getElementById('viewTitle').textContent=script.title;
  var wct=totalWords(script),pc=(script.paragraphs||[]).length,mins=Math.max(1,Math.round(wct/130));
  document.getElementById('viewMeta').innerHTML=wct+' words <div class="view-meta-dot"></div> '+pc+' section'+(pc===1?'':'s')+' <div class="view-meta-dot"></div> ~'+mins+' min read';
  var out='<div class="view-script-title">'+escHtml(script.title)+'</div>';
  (script.paragraphs||[]).forEach(function(p){
    var barCls=p.tag==='body'?'body-t':p.tag;
    out+='<div class="view-section"><div class="view-bar '+barCls+'"></div><div class="view-para">'+escHtml(p.text)+'</div></div>';
  });
  out+='<div class="view-footer"><span>Scripora</span><span>scripora.app</span></div>';
  document.getElementById('viewBody').innerHTML=out;
  // Show screen AFTER content is ready
  setTimeout(function(){
    document.getElementById('viewScriptScreen').classList.remove('hide');
  },0);
}
function closeViewScript(){document.getElementById('viewScriptScreen').classList.add('hide');}

function copyScript(){
  var script=getActive();if(!script)return;
  var txt=script.title+'\n\n'+(script.paragraphs||[]).map(function(p){return p.text;}).join('\n\n');
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){showToast('Copied to clipboard','success');}).catch(function(){copyFallback(txt);});
  }else{copyFallback(txt);}
}
function copyFallback(txt){
  var ta=document.createElement('textarea');
  ta.value=txt;ta.style.cssText='position:fixed;top:0;left:0;opacity:0;';
  document.body.appendChild(ta);ta.focus();ta.select();
  try{document.execCommand('copy');showToast('Copied to clipboard','success');}
  catch(e){showToast('Copy failed   try long-pressing the text','error');}
  document.body.removeChild(ta);
}
function downloadScript(){
  var script=getActive();if(!script)return;
  var txt=script.title+'\n\n'+(script.paragraphs||[]).map(function(p){return p.text;}).join('\n\n');
  var a=document.createElement('a');
  a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);
  a.download=script.title.replace(/[^a-z0-9]/gi,'_')+'.txt';
  a.style.cssText='position:fixed;top:0;left:0;opacity:0;';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){document.body.removeChild(a);},200);
  showToast('Downloaded','success');
}


// ── Portfolio ──
function openPortfolio(){
  var script=getActive();if(!script)return;
  document.getElementById('portTitle').textContent=script.title;
  var wc=totalWords(script),mins=Math.max(1,Math.round(wc/130));
  var email=S.currentUser?S.currentUser.email:'';
  var author=S.currentUser?(S.currentUser.displayName||'Creator'):'Creator';
  var date=new Date().toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  var prevParas=(script.paragraphs||[]).slice(0,3).map(function(p){
    return '<div class="port-para"><div class="port-para-bar" style="background:'+(TAGS[p.tag]||TAGS.hook).color+'"></div><div class="port-para-text">'+escHtml((p.text||'').substring(0,120))+(p.text&&p.text.length>120?'...':'')+'</div></div>';
  }).join('');
  document.getElementById('portBody').innerHTML=
    '<div class="port-preview-card">'+
    '<div class="port-cover"><div class="port-eyebrow">Script Portfolio</div>'+
    '<div class="port-title-lbl">'+escHtml(script.title)+'</div>'+
    '<div class="port-rule"></div>'+
    '<div class="port-meta-row">'+
    '<div class="port-meta-item"><div class="port-meta-lbl">Author</div><div class="port-meta-val">'+escHtml(author)+'</div></div>'+
    (email?'<div class="port-meta-item"><div class="port-meta-lbl">Email</div><div class="port-meta-val">'+escHtml(email)+'</div></div>':'')+
    '<div class="port-meta-item"><div class="port-meta-lbl">Words</div><div class="port-meta-val">'+wc+'</div></div>'+
    '<div class="port-meta-item"><div class="port-meta-lbl">Duration</div><div class="port-meta-val">~'+mins+' min</div></div>'+
    '<div class="port-meta-item"><div class="port-meta-lbl">Date</div><div class="port-meta-val">'+date+'</div></div></div></div>'+
    '<div class="port-script-body"><div class="port-script-lbl">Script</div>'+prevParas+'</div></div>'+
    '<p class="port-info">A beautifully designed document ready to share with brands, sponsors and collaborators.</p>'+
    '<button class="port-export-btn" onclick="exportPortfolio()"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Export Portfolio</button>';
  setTimeout(function(){document.getElementById('portfolioScreen').classList.remove('hide');},0);
}
function closePortfolio(){document.getElementById('portfolioScreen').classList.add('hide');}

function exportPortfolio(){
  var script=getActive();if(!script)return;
  var wc=totalWords(script),mins=Math.max(1,Math.round(wc/130));
  var email=S.currentUser?S.currentUser.email:'';
  var author=S.currentUser?(S.currentUser.displayName||'Creator'):'Creator';
  var date=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  var paras=(script.paragraphs||[]).map(function(p){
    var col=(TAGS[p.tag]||TAGS.hook).color;
    return '<div style="display:flex;gap:14px;margin-bottom:22px;"><div style="width:3px;border-radius:2px;background:'+col+';flex-shrink:0;margin-top:4px;"></div><div style="font-size:1rem;line-height:1.88;color:#E8E0D0;text-align:justify;">'+escHtml(p.text)+'</div></div><div style="height:1px;background:rgba(255,255,255,.05);margin-bottom:22px;"></div>';
  }).join('');
  var html='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>'+escHtml(script.title)+'</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet"/><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;background:#12161F;color:#E8E0D0;}.cover{background:#0A0D14;padding:60px 48px 48px;}.eyebrow{font-size:.65rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#B87333;margin-bottom:16px;}.title{font-family:"Playfair Display",serif;font-size:2.2rem;font-weight:700;line-height:1.2;margin-bottom:24px;}.rule{height:1px;background:rgba(255,255,255,.12);margin-bottom:20px;}.meta{display:flex;flex-wrap:wrap;gap:24px;}.ml{font-size:.55rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.3;margin-bottom:3px;}.mv{font-size:.88rem;font-weight:600;}.body{background:#12161F;padding:48px;}.slbl{font-size:.6rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(232,224,208,.25);margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid rgba(255,255,255,.06);}.footer{background:#0A0D14;padding:24px 48px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,.06);}.flogo{font-family:"Playfair Display",serif;font-size:1.1rem;color:#B87333;font-style:italic;}.furl{font-size:.7rem;color:rgba(232,224,208,.25);}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>'+
    '<div class="cover"><div class="eyebrow">Script Portfolio</div><div class="title">'+escHtml(script.title)+'</div><div class="rule"></div><div class="meta">'+
    '<div><div class="ml">Author</div><div class="mv">'+escHtml(author)+'</div></div>'+
    (email?'<div><div class="ml">Email</div><div class="mv">'+escHtml(email)+'</div></div>':'')+
    '<div><div class="ml">Words</div><div class="mv">'+wc+'</div></div>'+
    '<div><div class="ml">Duration</div><div class="mv">~'+mins+' min</div></div>'+
    '<div><div class="ml">Date</div><div class="mv">'+date+'</div></div></div></div>'+
    '<div class="body"><div class="slbl">Script</div>'+paras+'</div>'+
    '<div class="footer"><div class="flogo"><em>Scrip</em>ora</div><div class="furl">scripora.app</div></div></body></html>';
  var a=document.createElement('a');
  a.href='data:text/html;charset=utf-8,'+encodeURIComponent(html);
  a.download=script.title.replace(/[^a-z0-9]/gi,'_')+'_portfolio.html';
  a.click();
  showToast('Portfolio exported','success');
  safeGtag('event','portfolio_export');
}

function recordSession(){
  var now=new Date();
  var h=now.getHours();
  var slot=h<12?'morning':h<18?'afternoon':'evening';
  var date=now.toISOString().split('T')[0];
  var day=now.getDay();
  var raw=JSON.parse(localStorage.getItem(STATS_KEY)||'{}');
  var sessions=raw.sessions||[];
  // Only record once per hour
  var last=sessions[sessions.length-1];
  if(last&&last.date===date&&Math.abs(now.getTime()-new Date(last.ts||0).getTime())<3600000)return;
  sessions.push({date:date,slot:slot,day:day,ts:now.toISOString()});
  // Keep last 365 days
  if(sessions.length>365)sessions=sessions.slice(-365);
  // Best session by words written
  var todayWords=S.scripts.reduce(function(a,s){return a+(s.updatedAt&&s.updatedAt.startsWith(date)?totalWords(s):0);},0);
  var best=raw.bestSession||null;
  if(!best||todayWords>best.words)best={words:todayWords,date:date};
  raw.sessions=sessions;raw.bestSession=best;
  localStorage.setItem(STATS_KEY,JSON.stringify(raw));
}


function highlightText(text){
  // Highlight filler words in amber/red, strong words in green
  var safe=escHtml(text);
  var fillers=['basically','literally','you know','like i said','sort of','kind of','actually'];
  fillers.forEach(function(f){safe=safe.replace(new RegExp('\\b'+f+'\\b','gi'),function(m){return '<span class="hl-bad">'+m+'</span>';});});
  return safe;
}


// ── Help page ──
function openHelp(){
  document.getElementById('helpScreen').classList.remove('hide');
  switchHelpTab('start');
}
function closeHelp(){
  document.getElementById('helpScreen').classList.add('hide');
}
function switchHelpTab(tab){
  ['start','write','account'].forEach(function(t){
    var btn=document.getElementById('htab-'+t);
    if(btn)btn.classList.toggle('on',t===tab);
  });
  document.getElementById('helpBody').innerHTML=renderHelpContent(tab);
}
function toggleHelpItem(el){
  el.closest('.help-item').classList.toggle('open');
}
function renderHelpContent(tab){
  var secs=getHelpSections(tab);
  return secs.map(function(s){
    return '<div class="help-section"><div class="help-section-title">'+s.title+'</div>'+
      s.items.map(function(item){
        return '<div class="help-item">'+
          '<div class="help-item-hd" onclick="toggleHelpItem(this)">'+
          '<span class="help-item-q">'+item.q+'</span>'+
          '<svg class="help-item-chev" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:14px;height:14px;flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>'+
          '</div><div class="help-item-a">'+item.a+'</div></div>';
      }).join('')+'</div>';
  }).join('');
}
function getHelpSections(tab){
  if(tab==='start')return [
    {title:'Welcome',items:[
      {q:'What is Scripora?',a:'Scripora is a script planning app for YouTube creators. It helps you structure your Hook, Context, Main Body, CTA and Outro for a clear, well-paced video.'},
      {q:'How do I create my first script?',a:'Go to the Scripts tab and tap the + button at the top right. Give your script a title and you will be taken straight to the Write tab.'},
      {q:'Do I need to sign in?',a:'No. You can write and save scripts without an account. Sign in with Google to back up your scripts to the cloud and access them on any device.'}
    ]},
    {title:'Script Structure',items:[
      {q:'What are Hook, Context, Body, CTA and Outro?',a:'These are the five sections of a YouTube script. Hook grabs attention in the first few seconds. Context builds credibility and sets the promise. Main Body delivers the value. CTA directs the viewer. Outro closes the loop and sends them forward.'},
      {q:'Do I have to use all five sections?',a:'No. Use whatever sections fit your video. A complete script with all five tends to have the clearest structure.'}
    ]}
  ];
  if(tab==='write')return [
    {title:'Writing',items:[
      {q:'How do I add sections?',a:'Tap the + button at the bottom of the Write screen. Choose a tag (Hook, Context etc) and type your paragraph.'},
      {q:'Can I reorder sections?',a:'Yes. Each paragraph has up and down arrows to move it.'},
      {q:'What is the Notes drawer?',a:'Tap the clipboard icon in the Write header to open a notes drawer with four tabs: Facts, Ideas, Links and Notes. Use it to store research and reference material while writing.'},
      {q:'How do I rename a script?',a:'Tap the script title at the top of the Write screen to rename it.'}
    ]},
    {title:'Export',items:[
      {q:'How do I copy my script?',a:'Tap the eye icon in the Write header to open View Script. From there you can copy the full text or download it as a plain text file.'},
      {q:'What is Portfolio export?',a:'Portfolio export turns your script into a formatted HTML document with colour-coded sections, ready to download or share.'}
    ]}
  ];
  if(tab==='account')return [
    {title:'Account and Sync',items:[
      {q:'How does cloud sync work?',a:'When signed in, your scripts sync automatically after every change. You can access them from any device by signing in with the same Google account.'},
      {q:'How do I delete my account?',a:'Go to Profile, scroll to the bottom, tap Delete Account, and type DELETE to confirm. This removes all your data permanently.'}
    ]},
    {title:'Privacy',items:[
      {q:'What data does Scripora store?',a:'Your scripts and writing session data are stored locally on your device and optionally synced to Firebase if you are signed in. Scripora does not sell or share your data.'},
      {q:'Does Scripora use AI?',a:'No. Scripora Version 1 does not use AI. There is no analysis engine. You write your script and the app organises it by section. AI-assisted features may come in a future version.'}
    ]}
  ];
  return [];
}

// ── Onboarding ──
var _obSlide=0;
var _obData=[
  {icon:'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',title:'Write with structure',body:'Scripora gives you five building blocks: Hook, Context, Body, CTA and Outro. Each paragraph gets a colour-coded tag. Tap the tag to change it. The app is intuitive. Explore every button and see what it does.'},
  {icon:'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',title:'Start on the Scripts tab',body:'The Scripts tab is your home. Create a script, open one to write, and track its status at a glance. Tap any card to open it in the Write tab.'},
  {icon:'M13 10V3L4 14h7v7l9-11h-7z',title:'Write with intention',body:'Scripora is for writers who want to improve, not shortcuts. Every tag you choose is a decision. Every section you write is a practice. The tool reflects your craft back at you.'}
];
function initOnboarding(){
  var seen=localStorage.getItem('sp_ob');
  if(seen)return;
  _obSlide=0;
  showOnboardSlide(0);
  document.getElementById('onboardScreen').classList.remove('hide');
}
function showOnboardSlide(n){
  var d=_obData[n];
  document.getElementById('obSlides').innerHTML=
    '<div class="ob-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="'+d.icon+'"/></svg></div>'+
    '<div class="ob-title">'+d.title+'</div>'+
    '<div class="ob-body">'+d.body+'</div>';
  [0,1,2,3,4].forEach(function(i){var dot=document.getElementById('od'+i);if(dot)dot.classList.toggle('on',i===n);});
  var back=document.getElementById('obBack');
  var next=document.getElementById('obNext');
  if(back)back.style.display=n>0?'':'none';
  if(next)next.textContent=n===_obData.length-1?'Get Started':'Next';
}
function obNext(){
  if(_obSlide<_obData.length-1){_obSlide++;showOnboardSlide(_obSlide);}
  else{localStorage.setItem('sp_ob','1');document.getElementById('onboardScreen').classList.add('hide');}
}
function obPrev(){if(_obSlide>0){_obSlide--;showOnboardSlide(_obSlide);}}

function toggleLiveSync(){
  S.syncEnabled=!S.syncEnabled;
  if(S.syncEnabled){
    showToast('Live Sync on','success');
    runLiveSync();
  }else{
    showToast('Live Sync off','default');
  }
  save();
}


// ── Profile ──
function renderProfile(){
  var el=document.getElementById('profileContent');
  var u=S.currentUser;
  var isGuest=!u||S.isGuest;

  function rowIcon(col,path,stroke){
    var bgs={blue:'rgba(90,126,201,.12)',green:'rgba(106,175,130,.12)',purple:'rgba(196,122,175,.12)',copper:'rgba(184,115,51,.12)',gray:'rgba(122,128,153,.08)',red:'rgba(192,90,90,.12)'};
    return '<div style="width:32px;height:32px;border-radius:9px;background:'+bgs[col]+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+
      '<svg fill="none" stroke="'+stroke+'" viewBox="0 0 24 24" stroke-width="2" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="'+path+'"/></svg>'+
    '</div>';
  }
  function row(icon,title,sub,action,right){
    return '<div class="prof-row"'+(action?' onclick="'+action+'"':'')+'>'+icon+
      '<div style="flex:1;"><div class="prof-row-title">'+title+'</div>'+(sub?'<div class="prof-row-sub">'+sub+'</div>':'')+
      '</div>'+(right||'')+'</div>';
  }
  function group(rows){
    return '<div style="margin:0 14px;background:var(--surface);border-radius:16px;border:1px solid var(--border);overflow:hidden;">'+rows.join('')+'</div>';
  }
  function lbl(text){
    return '<div style="font-size:.56rem;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);padding:18px 20px 8px;font-weight:600;">'+text+'</div>';
  }
  var chev='<div style="color:var(--faint);font-size:.9rem;">&#8250;</div>';

  var themeIds=['midnight','obsidian','slate','rouge','forest'];
  var themeBgs=['#12161F','#1A1A1A','#1C2030','#1F1218','#121A14'];
  var cur=currentThemeId();
  var dotHtml='';
  for(var ti=0;ti<themeIds.length;ti++){
    dotHtml+='<div onclick="applyTheme(\''+themeIds[ti]+'\');setTimeout(renderProfile,0);" style="width:16px;height:16px;border-radius:50%;background:'+themeBgs[ti]+';border:2px solid '+(cur===themeIds[ti]?'var(--accent)':'rgba(255,255,255,.2)')+';box-shadow:0 0 0 1px rgba(0,0,0,.4);cursor:pointer;"></div>';
  }
  var appearHTML=
    lbl('Appearance')+
    group([row(rowIcon('copper','M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M12 7a5 5 0 100 10 5 5 0 000-10z','var(--accent)'),'Theme','',null,'<div style="display:flex;gap:5px;">'+dotHtml+'</div>')]);
  var supportHTML=
    lbl('Support')+
    group([
      row(rowIcon('copper','M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z','var(--accent)'),'Help &amp; Guide','','openHelp()',chev),
      row(rowIcon('purple','M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z','var(--cta)'),'Contact Developer','','openModal(\'contact\')',chev)
    ]);
  var legalHTML=
    lbl('Legal')+
    group([
      row(rowIcon('gray','M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z','var(--muted)'),'Privacy Policy','','openModal(\'privacy\')',chev),
      row(rowIcon('gray','M9 12h6m-6 4h6M5 8h14M5 4h14','var(--muted)'),'Terms of Use','','openModal(\'terms\')',chev)
    ]);
  var ver='<div style="text-align:center;font-size:.62rem;color:var(--faint);padding:20px;letter-spacing:.04em;">Scripora v1.0 &middot; by Selerii</div>';

  if(isGuest){
    el.innerHTML=
      '<div style="padding:36px 20px 24px;display:flex;flex-direction:column;align-items:center;gap:12px;border-bottom:1px solid var(--border);background:linear-gradient(170deg,rgba(184,115,51,.06) 0%,transparent 80%);">'+
        '<div style="width:68px;height:68px;border-radius:50%;background:var(--s2);border:1.5px dashed var(--faint);display:flex;align-items:center;justify-content:center;">'+
          '<svg fill="none" stroke="var(--faint)" viewBox="0 0 24 24" stroke-width="1.5" style="width:28px;height:28px;"><path stroke-linecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>'+
        '</div>'+
        '<div style="font-size:1.1rem;color:var(--text);text-align:center;font-weight:600;">You\'re writing as a guest</div>'+
        '<div style="font-size:.75rem;color:var(--muted);text-align:center;line-height:1.6;max-width:260px;">Sign in to back up your scripts, sync across devices, and access your work anywhere.</div>'+
        '<button onclick="signInGoogle()" style="width:100%;background:var(--text);color:#12161F;border:none;border-radius:14px;padding:14px;font-size:.88rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-top:4px;">'+
          '<div style="width:18px;height:18px;border-radius:50%;background:conic-gradient(#4285F4 0deg 90deg,#EA4335 90deg 180deg,#FBBC05 180deg 270deg,#34A853 270deg);flex-shrink:0;"></div>'+
          'Continue with Google'+
        '</button>'+
        '<div style="display:flex;flex-direction:column;gap:6px;width:100%;margin-top:2px;">'+
          '<div style="display:flex;align-items:center;gap:10px;background:var(--s2);border-radius:10px;padding:10px 14px;font-size:.72rem;color:var(--muted);">&#9729; Scripts backed up automatically</div>'+
          '<div style="display:flex;align-items:center;gap:10px;background:var(--s2);border-radius:10px;padding:10px 14px;font-size:.72rem;color:var(--muted);">&#9889; Live Sync as you write</div>'+
          '<div style="display:flex;align-items:center;gap:10px;background:var(--s2);border-radius:10px;padding:10px 14px;font-size:.72rem;color:var(--muted);">&#128241; Access from any device</div>'+
        '</div>'+
      '</div>'+
      appearHTML+supportHTML+legalHTML+ver;
    return;
  }

  var initials=(u.displayName||'?').split(' ').map(function(w){return w.charAt(0);}).join('').slice(0,2).toUpperCase();
  var avatarHTML=u.photoURL?
    '<img src="'+u.photoURL+'" style="width:68px;height:68px;border-radius:50%;object-fit:cover;" onerror="this.style.display=\'none\'"/>':
    '<div style="width:68px;height:68px;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--accent);">'+initials+'</div>';
  var html=
    '<div style="padding:28px 20px 20px;background:linear-gradient(170deg,rgba(184,115,51,.08) 0%,transparent 70%);border-bottom:1px solid var(--border);display:flex;flex-direction:column;align-items:center;gap:10px;">'+
      '<div style="width:76px;height:76px;border-radius:50%;border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;">'+avatarHTML+'</div>'+
      '<div style="font-size:1.15rem;font-weight:700;color:var(--text);">'+escHtml(u.displayName||'Scripora User')+'</div>'+
      (u.email?'<div style="font-size:.72rem;color:var(--muted);">'+escHtml(u.email)+'</div>':'')+
    '</div>';

  html+=appearHTML;
  html+=lbl('Account')+
    group([
      row(rowIcon('blue','M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z','var(--body-c)'),'Edit Profile','','openModal(\'editProfile\')',chev),
      row(rowIcon('green','M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z','var(--s-high)'),'Get the App','Install on your home screen','openInstallGuide()',chev)
    ]);
  html+=supportHTML+legalHTML;
  html+=lbl('Account actions')+
    group([
      row(rowIcon('gray','M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1','var(--muted)'),'Sign Out','','signOut()',''),
      '<div class="prof-row" onclick="openModal(\'deleteAccount\')">'+
        '<div style="flex:1;"><div style="font-size:.84rem;color:var(--s-low);">Delete Account</div><div style="font-size:.65rem;color:var(--dim);margin-top:1px;">Permanently removes your data</div></div>'+
      '</div>'
    ]);
  html+=ver;
  el.innerHTML=html;
}


// ── Sign in/out ──
function signInGoogle(){
  try{
    var provider=new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(function(err){
      console.error(err);
      if(err.code==='auth/popup-blocked'){showToast('Popup blocked   allow popups for this site','error');}
      else if(err.code==='auth/network-request-failed'){showToast('No connection   try again when online','error');}
      else{showToast('Sign-in failed','error');}
    });
  }catch(e){showToast('Sign-in unavailable in this environment','error');}
}
function continueGuest(){
  S.isGuest=true;
  load();applyTheme(currentThemeId());
  showApp();
  showToast('Writing as guest. Sign in anytime to back up.','info');
}
function signOut(){
  openModal('_raw','<div class="mhandle"></div><div class="modal-title">Sign out?</div><div class="modal-sub">Your scripts will remain on this device.</div><div class="modal-acts"><button class="btn-g" onclick="closeMoForce()">Cancel</button><button class="btn-p" onclick="doSignOut()">Sign Out</button></div>');
}
function doSignOut(){
  auth.signOut().then(function(){S.currentUser=null;S.isGuest=false;closeMo();showLogin();showToast('Signed out','default');}).catch(function(){showToast('Error signing out','error');});
}
function showLogin(){document.getElementById('loginScreen').classList.remove('hide');document.getElementById('app').classList.add('hide');}
function showApp(){S.appShown=true;setTimeout(initOnboarding,800);document.getElementById('loginScreen').classList.add('hide');document.getElementById('app').classList.remove('hide');goScreen('scripts');}

// ── Modals ──
var _modalOpen=false;
var _modalNoBackdropClose=false;
function openModal(type,data){
  // Cancel any pending long-press timer
  if(_lpTimer){clearTimeout(_lpTimer);_lpTimer=null;}
  _modalOpen=true;
  _modalNoBackdropClose=(type==='newScript');
  var mo=document.getElementById('mo');
  var modal=document.getElementById('modal');
  var xBtn='<button onclick="closeMoForce()" style="position:absolute;top:10px;right:12px;background:none;border:none;color:var(--muted);padding:4px;cursor:pointer;display:flex;z-index:2;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>';
  var html='<div class="mhandle"></div>'+xBtn;

  if(type==='_raw'){html=data||'';modal.innerHTML=html;mo.classList.add('open');return;}

  if(type==='newScript'){
    html+='<div class="modal-title">New Script</div>'+
      '<input class="modal-inp" id="newScriptTitle" placeholder="Working title e.g. How I Built a Channel..." maxlength="120" style="margin-bottom:6px;"/>'+
      '<div class="modal-hint" style="margin-bottom:12px;">You can change the title at any time.</div>'+
      '<div id="pasteAccordion">'+
        '<button type="button" onclick="togglePasteArea()" style="background:none;border:none;color:var(--muted);font-size:.72rem;display:flex;align-items:center;gap:6px;cursor:pointer;padding:0;margin-bottom:0;">'+
          '<svg id="pasteChevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2" style="width:13px;height:13px;transition:transform .18s;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>'+
          'Paste an existing script <span style="color:var(--faint);margin-left:3px;">(optional)</span>'+
        '</button>'+
        '<div id="pasteAreaWrap" style="display:none;margin-top:10px;">'+
          '<div class="modal-hint" style="margin-bottom:6px;">Separate sections with a blank line. Scripora will automatically detect and tag your Hook, Context, Body, CTA and Outro.</div>'+
          '<textarea id="newScriptPaste" class="modal-inp" placeholder="Paste your script here..." style="min-height:90px;resize:vertical;font-size:.72rem;line-height:1.6;"></textarea>'+
        '</div>'+
      '</div>'+
      '<div class="modal-acts" style="margin-top:14px;"><button class="btn-g" onclick="closeMoForce()">Cancel</button><button class="btn-p" onclick="createScript()">Create</button></div>';
    modal.innerHTML=html;mo.classList.add('open');
    setTimeout(function(){var i=document.getElementById('newScriptTitle');if(i)i.focus();},180);
    return;
  }

  if(type==='addParagraph'){
    var tagOpts=Object.keys(TAGS).map(function(k){return '<button class="tag-opt '+k+'" onclick="addParagraph(\''+k+'\');closeMo()">'+TAGS[k].label+'</button>';}).join('');
    html+='<div class="modal-title">Add Paragraph</div>'+
      '<div class="modal-sub">Choose a tag for this section.</div>'+
      '<div class="tag-sel">'+tagOpts+'</div>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  if(type==='addNote'){
    var tab=data||'facts';
    var singular={facts:'fact',ideas:'idea',notes:'note'}[tab]||tab;
    html+='<div class="modal-title">Add '+singular.charAt(0).toUpperCase()+singular.slice(1)+'</div>'+
      '<textarea class="modal-inp" id="noteText" placeholder="Write your '+singular+'..." rows="3" style="resize:none;min-height:80px;"></textarea>'+
      '<div class="modal-acts"><button class="btn-g" onclick="closeMo()">Cancel</button><button class="btn-p" onclick="saveNote(\''+tab+'\')">Add</button></div>';
    modal.innerHTML=html;mo.classList.add('open');
    setTimeout(function(){var i=document.getElementById('noteText');if(i)i.focus();},180);
    return;
  }

  if(type==='addLink'){
    html+='<div class="modal-title">Add Link</div>'+
      '<input class="modal-inp" id="linkUrl" placeholder="https://..." type="url"/>'+
      '<input class="modal-inp" id="linkLabel" placeholder="Label (optional)"/>'+
      '<div class="modal-acts"><button class="btn-g" onclick="closeMo()">Cancel</button><button class="btn-p" onclick="saveLink()">Add</button></div>';
    modal.innerHTML=html;mo.classList.add('open');
    setTimeout(function(){var i=document.getElementById('linkUrl');if(i)i.focus();},180);
    return;
  }


  if(type==='themes'){
    var cards=THEMES.map(function(t){
      var active=currentThemeId()===t.id;
      return '<div class="theme-card'+(active?' active':'')+'" onclick="applyTheme(\''+t.id+'\');closeMo();setTimeout(renderProfile,0);">'+
        '<div class="theme-preview" style="background:'+t.bg+';">'+
        '<div class="theme-bar" style="background:'+t.s2+'"></div>'+
        '<div class="theme-bar" style="background:'+t.s2+'"></div>'+
        '<div class="theme-bar ac" style="background:'+t.ac+'"></div>'+
        '</div>'+
        '<div class="theme-meta"><div class="theme-name-lbl">'+t.name+'</div><div class="theme-tag-lbl" style="color:'+t.ac+'">Scripora</div></div>'+
        (active?'<div class="theme-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>':'')+
        '</div>';
    }).join('');
    html+='<div class="modal-title">Themes</div><div class="theme-grid-modal">'+cards+'</div>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  if(type==='editProfile'){
    var u=S.currentUser;
    html+='<div class="modal-title">Edit Profile</div>'+
      '<input class="modal-inp" id="editName" placeholder="Display name" value="'+(u?escHtml(u.displayName||''):'')+'"/>'+
      '<div class="modal-acts"><button class="btn-g" onclick="closeMo()">Cancel</button><button class="btn-p" onclick="saveProfile()">Save</button></div>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  if(type==='contact'){
    html+='<div class="modal-title">Contact Developer</div>'+
      '<div class="contact-form">'+
      '<select class="contact-sel" id="contactType"><option value="feedback">General feedback</option><option value="bug">Bug report</option><option value="feature">Feature request</option></select>'+
      '<textarea class="contact-ta" id="contactMsg" placeholder="Write your message..."></textarea>'+
      '</div>'+
      '<div class="modal-acts" style="margin-top:10px;"><button class="btn-g" onclick="closeMo()">Cancel</button><button class="btn-p" onclick="sendContact()">Send</button></div>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  if(type==='deleteAccount'){
    html+='<div class="modal-title">Delete Account</div>'+
      '<div class="modal-sub">This will permanently delete your account and all synced data. Your local scripts will remain on this device until you clear storage.</div>'+
      '<p style="font-size:.8rem;color:var(--muted);margin-bottom:2px;">Type <strong style="color:var(--s-low);letter-spacing:.06em;">DELETE</strong> to confirm</p>'+
      '<input class="confirm-type-inp" id="deleteConfirm" placeholder="DELETE" oninput="checkDeleteConfirm(this)"/>'+
      '<button class="btn-danger" id="deleteBtn" onclick="deleteAccount()">Delete Account</button>'+
      '<button class="btn-g" onclick="closeMo()" style="width:100%;margin-top:8px;">Cancel</button>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  if(type==='changeTag'){
    // data is the pid
    var pid=data;
    var script=getActive();
    if(!script)return;
    var para=null;
    for(var i=0;i<script.paragraphs.length;i++){if(script.paragraphs[i].id===pid){para=script.paragraphs[i];break;}}
    if(!para)return;
    var opts=Object.keys(TAGS).map(function(k){
      return '<button class="tag-opt '+k+(para.tag===k?' on':'')+'" onclick="applyTagChange(\''+pid+'\',\''+k+'\');closeMoForce()">'+TAGS[k].label+'</button>';
    }).join('');
    html+='<div class="modal-title">Change Tag</div>'+
      '<div class="modal-sub">Choose a new tag for this paragraph.</div>'+
      '<div class="tag-sel">'+opts+'</div>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  if(type==='analyseHelp'){
    html+='<div class="modal-title">How to paste your script</div>'+
      '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">'+
      '<div style="display:flex;gap:10px;align-items:flex-start;">'+
      '<div style="width:22px;height:22px;border-radius:50%;background:var(--hook-bg);border:1px solid var(--hook-border);display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:700;color:var(--hook);flex-shrink:0;margin-top:1px;">1</div>'+
      '<div><div style="font-size:.8rem;font-weight:600;color:var(--text);">Hook</div><div style="font-size:.72rem;color:var(--muted);line-height:1.55;">Your first paragraph. The opening line or question that earns the first 30 seconds.</div></div></div>'+
      '<div style="display:flex;gap:10px;align-items:flex-start;">'+
      '<div style="width:22px;height:22px;border-radius:50%;background:var(--ctx-bg);border:1px solid var(--ctx-border);display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:700;color:var(--ctx);flex-shrink:0;margin-top:1px;">2</div>'+
      '<div><div style="font-size:.8rem;font-weight:600;color:var(--text);">Context</div><div style="font-size:.72rem;color:var(--muted);line-height:1.55;">Why you are qualified to talk about this. One credential, one promise of what the viewer gets.</div></div></div>'+
      '<div style="display:flex;gap:10px;align-items:flex-start;">'+
      '<div style="width:22px;height:22px;border-radius:50%;background:var(--body-bg);border:1px solid var(--body-border);display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:700;color:var(--body-c);flex-shrink:0;margin-top:1px;">3</div>'+
      '<div><div style="font-size:.8rem;font-weight:600;color:var(--text);">Main Body</div><div style="font-size:.72rem;color:var(--muted);line-height:1.55;">The value. Can be multiple paragraphs   each separated by a blank line.</div></div></div>'+
      '<div style="display:flex;gap:10px;align-items:flex-start;">'+
      '<div style="width:22px;height:22px;border-radius:50%;background:var(--cta-bg);border:1px solid var(--cta-border);display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:700;color:var(--cta);flex-shrink:0;margin-top:1px;">4</div>'+
      '<div><div style="font-size:.8rem;font-weight:600;color:var(--text);">CTA</div><div style="font-size:.72rem;color:var(--muted);line-height:1.55;">Your call to action. Subscribe, comment, watch next   with a reason.</div></div></div>'+
      '<div style="display:flex;gap:10px;align-items:flex-start;">'+
      '<div style="width:22px;height:22px;border-radius:50%;background:var(--out-bg);border:1px solid var(--out-border);display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:700;color:var(--out);flex-shrink:0;margin-top:1px;">5</div>'+
      '<div><div style="font-size:.8rem;font-weight:600;color:var(--text);">Outro</div><div style="font-size:.72rem;color:var(--muted);line-height:1.55;">Close the loop. Send the viewer somewhere. Make the ending feel earned.</div></div></div>'+
      '</div>'+
      '<div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:.72rem;color:var(--muted);line-height:1.65;margin-bottom:16px;">'+
      'Separate each section with a blank line. If your script is one block of text, paste it anyway   we will split and tag it automatically.'+
      '</div>'+
      '<button class="btn-p" onclick="closeMoForce()">Got it</button>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  if(type==='privacy'){
    html+='<div class="modal-title" style="margin-bottom:14px;">Privacy Policy</div>'+
      '<div class="long-body">'+
      '<h4>What we collect</h4><p>When you sign in with Google, we collect your name, email address and profile photo to personalise your experience. Your scripts and writing session data are stored locally on your device. If you are signed in, this data is synced to our secure cloud storage (Google Firestore) so you can access it across devices.</p>'+
      '<h4>How we use your data</h4><p>Your data is used solely to provide and improve Scripora. We do not sell, licence or share your personal data with third parties. We do not use your script content for advertising, model training or any purpose beyond storage and delivery back to you.</p>'+
      '<h4>AI and analysis</h4><p>Scripora Version 1 does not use AI or any analysis engine. No script content is processed, analysed or transmitted for any purpose other than syncing your own data to your own account. If AI-assisted features are introduced in a future version, they will be clearly disclosed and opt-in.</p>'+
      '<h4>Analytics</h4><p>We use Google Analytics to understand aggregate usage patterns — which features are used, how often, and on what devices. This data is anonymous. Your script content is never included in analytics events.</p>'+
      '<h4>Local storage</h4><p>Scripora stores your scripts, preferences and writing session data in your browser\'s local storage. This data does not leave your device unless you are signed in and syncing is active. Clearing your browser data will remove locally stored scripts.</p>'+
      '<h4>Your rights</h4><p>You can delete your account and all associated cloud data at any time from Profile → Delete Account. Local data can be cleared through your browser or device settings. To request data deletion by email, contact us at support@scripora.app.</p>'+
      '<p style="font-size:.7rem;margin-top:12px;">Last updated: July 2026 &nbsp;&middot;&nbsp; Contact: support@scripora.app</p>'+
      '</div>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  if(type==='terms'){
    html+='<div class="modal-title" style="margin-bottom:14px;">Terms of Use</div>'+
      '<div class="long-body">'+
      '<h4>Using Scripora</h4><p>Scripora is a scriptwriting tool for YouTube creators. By using it you agree to these terms. You may use Scripora for personal and commercial creative work. You may not use it to produce content that is illegal, harmful, abusive or that infringes on the intellectual property rights of others.</p>'+
      '<h4>Your content</h4><p>You retain full ownership of everything you write in Scripora. By enabling cloud sync, you grant Selerii a limited, non-exclusive licence to store and transmit your content solely for the purpose of delivering it back to you. We do not claim any rights over your scripts.</p>'+
      '<h4>Account termination</h4><p>You may delete your account at any time from the Profile tab. We reserve the right to suspend accounts that violate these terms.</p>'+
      '<h4>Limitation of liability</h4><p>Scripora is provided as-is without warranties of any kind. Selerii is not liable for loss of data, loss of revenue, missed opportunities or any indirect damages arising from use of this app.</p>'+
      '<p style="font-size:.7rem;margin-top:12px;">Last updated: July 2026 &nbsp;&middot;&nbsp; Contact: support@scripora.app</p>'+
      '</div>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  modal.innerHTML=html;mo.classList.add('open');
}

function closeMo(evt){
  if(evt&&evt.target!==document.getElementById('mo'))return;
  if(_modalNoBackdropClose)return;
  _modalOpen=false;
  document.getElementById('mo').classList.remove('open');
}
function closeMoTouch(evt){
  if(!evt||evt.target!==document.getElementById('mo'))return;
  if(_modalNoBackdropClose)return;
  evt.preventDefault();
  _modalOpen=false;
  document.getElementById('mo').classList.remove('open');
}
function closeMoForce(){_modalNoBackdropClose=false;document.getElementById('mo').classList.remove('open');}

function checkDeleteConfirm(inp){
  var btn=document.getElementById('deleteBtn');
  if(btn)btn.classList.toggle('active',inp.value==='DELETE');
}

// ── Modal actions ──
function togglePasteArea(){
  var wrap=document.getElementById('pasteAreaWrap');
  var chev=document.getElementById('pasteChevron');
  if(!wrap)return;
  var open=wrap.style.display==='none'||wrap.style.display==='';
  wrap.style.display=open?'block':'none';
  if(chev)chev.style.transform=open?'rotate(90deg)':'';
  if(open){setTimeout(function(){var ta=document.getElementById('newScriptPaste');if(ta)ta.focus();},80);}
}

function createScript(){
  var inp=document.getElementById('newScriptTitle');
  var title=(inp?inp.value:'').trim();
  if(!title){showToast('Enter a title first','error');return;}
  var pasteEl=document.getElementById('newScriptPaste');
  var pastedText=pasteEl?pasteEl.value.trim():'';
  var startParas=[];
  if(pastedText){
    var guessed=guessParagraphs(pastedText);
    startParas=guessed.map(function(p){return{id:uid(),tag:p.tag,text:p.text};});
  }
  var id=uid();
  S.scripts.unshift({id:id,title:title,status:'Draft',paragraphs:startParas,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),notes:{facts:[],ideas:[],links:[],notes:[]}});
  S.activeId=id;save();syncToCloud();
  closeMoForce();goScreen('write');
  if(pastedText&&startParas.length){
    showToast('Script formatted into '+startParas.length+' sections. Adjust tags as needed.','success');
  } else {
    showToast('Script created','success');
  }
  safeGtag('event','script_created');
}

function addParagraph(tag){
  var script=getActive();if(!script)return;
  if(!script.paragraphs)script.paragraphs=[];
  script.paragraphs.push({id:uid(),tag:tag,text:''});
  script.updatedAt=new Date().toISOString();
  save();setTimeout(function(){
    renderWrite();
    // Scroll the new paragraph's wrapper into view once.
    // We target the parent .pb div, not the textarea itself, so Android
    // Chrome cannot implicitly focus the input and open the keyboard.
    setTimeout(function(){
      var pbs=document.querySelectorAll('.pb');
      if(pbs.length){pbs[pbs.length-1].scrollIntoView({block:'end',behavior:'smooth'});}
    },80);
  },0);
}

function saveNote(tab){
  var inp=document.getElementById('noteText');
  var val=(inp?inp.value:'').trim();
  if(!val){showToast('Write something first','error');return;}
  var script=getActive();if(!script)return;
  if(!script.notes)script.notes={facts:[],ideas:[],links:[],notes:[]};
  if(!script.notes[tab])script.notes[tab]=[];
  script.notes[tab].unshift(val);
  save();closeMoForce();setTimeout(renderDrawerTab,0);
  showToast('Added','success');
}

function saveLink(){
  var url=(document.getElementById('linkUrl')?document.getElementById('linkUrl').value:'').trim();
  var label=(document.getElementById('linkLabel')?document.getElementById('linkLabel').value:'').trim();
  if(!url){showToast('Enter a URL','error');return;}
  var script=getActive();if(!script)return;
  if(!script.notes)script.notes={facts:[],ideas:[],links:[],notes:[]};
  if(!script.notes.links)script.notes.links=[];
  script.notes.links.push({url:url,label:label||url});
  save();closeMoForce();setTimeout(renderDrawerTab,0);
  showToast('Link added','success');
}
function editLink(i){
  var script=getActive();if(!script||!script.notes||!script.notes.links)return;
  var link=script.notes.links[i];if(!link)return;
  var html='<div class="mhandle"></div>';
  html+='<div class="modal-title">Edit Link</div>';
  html+='<div style="font-size:.72rem;color:var(--muted);margin-bottom:4px;">Label</div>';
  html+='<input id="editLinkLabel" class="modal-inp" value="'+escHtml(link.label||'')+'" placeholder="Link label"/>';
  html+='<div style="font-size:.72rem;color:var(--muted);margin-bottom:4px;">URL</div>';
  html+='<input id="editLinkUrl" class="modal-inp" value="'+escHtml(link.url||'')+'" placeholder="https://..." style="margin-bottom:14px;"/>';
  html+='<div class="modal-acts"><button class="btn-g" onclick="closeMoForce()">Cancel</button><button class="btn-p" onclick="saveEditLink('+i+')">Save</button></div>';
  openModal('_raw',html);
}
function saveEditLink(i){
  var script=getActive();if(!script||!script.notes||!script.notes.links)return;
  var label=(document.getElementById('editLinkLabel')?document.getElementById('editLinkLabel').value:'').trim();
  var url=(document.getElementById('editLinkUrl')?document.getElementById('editLinkUrl').value:'').trim();
  if(!url){showToast('URL is required','error');return;}
  script.notes.links[i]={url:url,label:label||url};
  save();closeMoForce();setTimeout(renderDrawerTab,0);
  showToast('Link updated','success');
}

function saveProfile(){
  var name=(document.getElementById('editName')?document.getElementById('editName').value:'').trim();
  if(!name||!S.currentUser)return;
  S.currentUser.updateProfile({displayName:name}).then(function(){closeMo();setTimeout(renderProfile,0);showToast('Profile updated','success');}).catch(function(){showToast('Update failed','error');});
}

function sendContact(){
  var typeEl=document.getElementById('contactType');
  var msgEl=document.getElementById('contactMsg');
  var type=typeEl?typeEl.value:'feedback';
  var msg=msgEl?msgEl.value.trim():'';
  if(!msg){showToast('Write a message first','error');return;}
  if(typeof emailjs==='undefined'){showToast('Email service not loaded. Try support@scripora.app','error');return;}
  var btn=document.querySelector('.btn-p');
  if(btn){btn.textContent='Sending...';btn.disabled=true;}
  emailjs.init({publicKey:EMAILJS_KEY});
  var user=S.currentUser;
  emailjs.send(EMAILJS_SVC,EMAILJS_TPL,{
    from_name:user?user.displayName:'Guest User',
    from_email:user?user.email:'guest@scripora.app',
    message:'['+type.toUpperCase()+'] '+msg,
    reply_to:user?user.email:'no-reply@scripora.app'
  }).then(function(){
    closeMoForce();
    showToast('Message sent. Thank you!','success');
  }).catch(function(err){
    if(btn){btn.textContent='Send';btn.disabled=false;}
    showToast('Could not send. Email support@scripora.app directly','error');
  });
}

function deleteAccount(){
  var btn=document.getElementById('deleteBtn');
  if(!btn||!btn.classList.contains('active'))return;
  if(!S.currentUser)return;
  db.collection('users').doc(S.currentUser.uid).delete().catch(function(){});
  S.currentUser.delete().then(function(){
    localStorage.removeItem(SK);localStorage.removeItem('sp_pro');
    S.scripts=[];S.currentUser=null;
    closeMo();showLogin();
    showToast('Account deleted','default');
  }).catch(function(err){
    if(err.code==='auth/requires-recent-login'){showToast('Please sign out and sign in again first','error');}
    else{showToast('Delete failed   contact support@scripora.app','error');}
  });
}

// ── Firebase Auth listener ──
if(auth){
  auth.onAuthStateChanged(function(user){
    if(user){
      S.currentUser=user;S.isGuest=false;
      load();
      applyTheme(currentThemeId());
      showApp();
      loadFromCloud();
      safeGtag('event','login',{method:'google'});
    }else{
      if(!S.isGuest&&!S.appShown){
        S.currentUser=null;
        load();
        applyTheme(currentThemeId());
        if(S.scripts&&S.scripts.length>0){showApp();}
        else{showLogin();}
      }
    }
  });
}

// ── Init ──
// ── PWA Install   silent capture, profile button only ──
var pwaInstallPrompt=null;
// ── Keyboard handling ──

window.addEventListener('online',function(){
  var d=document.getElementById('syncDot');
  if(d)d.style.background='var(--s-high)';
});
window.addEventListener('offline',function(){
  var d=document.getElementById('syncDot');
  if(d)d.style.background='var(--muted)';
});
window.addEventListener('beforeinstallprompt',function(e){
  e.preventDefault();
  pwaInstallPrompt=e;
});
window.addEventListener('appinstalled',function(){
  showToast('Scripora installed','success');
  safeGtag('event','pwa_installed');
});
function openInstallGuide(){
  var html='<div class="mhandle"></div>';
  html+='<div class="modal-title">Get Scripora</div>';
  html+='<div class="modal-sub">Install Scripora on your device.</div>';

  // Option 1: Chrome install prompt
  html+='<div class="inst-opt" onclick="closeMoForce();installPWA();">';
  html+='<div class="inst-opt-ico" style="background:var(--accent-soft);border-color:var(--accent-border);">';
  html+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:20px;height:20px;stroke:var(--accent);"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg></div>';
  html+='<div class="inst-opt-info"><div class="inst-opt-title">Install from Chrome</div>';
  html+='<div class="inst-opt-sub">'+(pwaInstallPrompt?'Tap to install now':'Open in Chrome and use the three-dot menu')+'</div></div>';
  html+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:16px;height:16px;color:var(--faint);flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div>';

  // Option 2: Native app — coming soon
  html+='<div class="inst-opt" style="opacity:.55;pointer-events:none;">';
  html+='<div class="inst-opt-ico" style="background:rgba(255,255,255,.04);border-color:var(--border);">';
  html+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:20px;height:20px;stroke:var(--muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>';
  html+='<div class="inst-opt-info"><div class="inst-opt-title">Native App</div>';
  html+='<div class="inst-opt-sub">Coming Soon</div></div>';
  html+='</div>';

  html+='<button class="btn-g" onclick="closeMoForce()" style="width:100%;margin-top:10px;">Close</button>';
  openModal('_raw',html);
}
function installPWA(){
  if(pwaInstallPrompt){
    pwaInstallPrompt.prompt();
    pwaInstallPrompt.userChoice.then(function(r){
      if(r.outcome==='accepted')showToast('Scripora installed','success');
      pwaInstallPrompt=null;
    });
    return;
  }
  // No prompt available - show manual instructions
  var isAndroid=navigator.userAgent.toLowerCase().indexOf('android')>=0;
  var isIOS=/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  var msg='';
  if(isAndroid)msg='Tap the three-dot menu in Chrome, then tap "Add to Home Screen"';
  else if(isIOS)msg='Tap the Share button in Safari, then tap "Add to Home Screen"';
  else msg='Open Scripora in Chrome on your phone to install it';
  openModal('_raw','<div class="mhandle"></div><div class="modal-title">Install Scripora</div>'+
    '<div class="ob-icon" style="margin:0 auto 14px;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg></div>'+
    '<p style="font-size:.82rem;color:var(--muted);line-height:1.65;text-align:center;margin-bottom:16px;">'+msg+'</p>'+
    '<button class="btn-p" onclick="closeMoForce()">Got it</button>');
}
function dismissPWA(){}

(function init(){
  load();applyTheme(currentThemeId());
  // If the user already has local scripts, show the app immediately
  // without waiting for Firebase — eliminates the landing-screen flash on resume.
  // Firebase auth will still resolve in the background and sync cloud data.
  if(S.scripts&&S.scripts.length>0){
    S.appShown=true;
    document.getElementById('loginScreen').classList.add('hide');
    document.getElementById('app').classList.remove('hide');
    goScreen('scripts');
    setTimeout(initOnboarding,800);
  }
  // Service worker
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').then(function(reg){
      reg.addEventListener('updatefound',function(){
        var newSW=reg.installing;
        if(newSW){
          newSW.addEventListener('statechange',function(){
            if(newSW.state==='installed'&&navigator.serviceWorker.controller){
              showToast('Update available -- reload to apply','default');
            }
          });
        }
      });
    }).catch(function(err){console.warn('SW registration failed:',err);});
  }
  // Fallback: if Firebase auth doesn't respond in 3s, show login screen
  // This handles offline/local preview mode
  setTimeout(function(){
    if(!S.appShown&&!S.isGuest){
      if(S.scripts&&S.scripts.length>0){showApp();}
      else{
        document.getElementById('loginScreen').classList.remove('hide');
        document.getElementById('app').classList.add('hide');
      }
    }
  },3000);

})();