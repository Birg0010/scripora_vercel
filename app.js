// ════════════════════════════════════════════════════════════════════
// SCRIPORA  -  APP.JS
// State, constants, utilities, UI handlers, init
// Load order: feedback.js -> engine.js -> sync.js -> app.js
// ════════════════════════════════════════════════════════════════════

// ── SECTION 1: State & Constants ──
// ═══════════════════════════════════════
// SCRIPORA   Full Engine
// ═══════════════════════════════════════
// ── Core state   declared first so nothing can crash before these exist ──
var SK='sp1',THEME_KEY='sp_theme',PRO_KEY='sp_pro',STATS_KEY='sp_stats';
var FREE_LIMIT=10;
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

var S={scripts:[],activeId:null,currentUser:null,isGuest:false,appShown:false,activeHubTab:'stats',statsFilter:'all',drawerTab:'facts',analyseHistory:[],hubPillOpen:false,bulkMode:false,bulkSelected:[],analysing:false,syncEnabled:false,_liveIntel:null,_currentResultId:null,_aSearch:'',_ahSort:'date',_ahQ:'',_pasteTitle:''};


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
function isPro(){return localStorage.getItem(PRO_KEY)==='true';}
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
function loadAnalyseHistory(){try{S.analyseHistory=JSON.parse(localStorage.getItem('sp_ah')||'[]');}catch(e){S.analyseHistory=[];}}
function saveAnalyseHistory(){localStorage.setItem('sp_ah',JSON.stringify(S.analyseHistory));}

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
var screens=['scripts','write','hub','profile'];
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
  if(name==='hub'){S.hubPillOpen=false;renderHub();}
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
  }else if(screen==='hub'){
    right.innerHTML=buildHubPillHTML();
  }
}

// ── Hub pill ──
function buildHubPillHTML(){
  var labels={stats:'Stats',analyse:'Analyse',workspace:'Workspace'};
  var label=labels[S.activeHubTab]||'Stats';
  var dotsIcon='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:14px;height:14px;"><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></svg>';
  if(!S.hubPillOpen){
    return '<div class="hub-pill-wrap"><div class="hub-pill" onclick="toggleHubPill()"><span class="hub-pill-text">'+label+'</span>'+dotsIcon+'</div></div>';
  }
  function tabBtn(tab,iconPath,dim){
    return '<button class="hub-tab-btn'+(S.activeHubTab===tab?' on':'')+(dim?' dim':'')+'" onclick="setHubTab(\''+tab+'\')" title="'+labels[tab]+'"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:15px;height:15px;">'+iconPath+'</svg></button>';
  }
  var statsIco='<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>';
  var analyseIco='<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>';
  var wsIco='<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>';
  var div='<div class="hub-pill-div"></div>';
  return '<div class="hub-pill-wrap"><span class="hub-label" style="color:var(--accent)">'+label+'</span><div class="hub-pill-expanded">'+tabBtn('stats',statsIco,false)+div+tabBtn('analyse',analyseIco,false)+div+tabBtn('workspace',wsIco,true)+'</div></div>';
}
function toggleHubPill(){S.hubPillOpen=!S.hubPillOpen;document.getElementById('headerRight').innerHTML=buildHubPillHTML();}
function setHubTab(tab){
  S.activeHubTab=tab;S.hubPillOpen=false;
  document.getElementById('headerRight').innerHTML=buildHubPillHTML();
  ['stats','analyse','workspace'].forEach(function(t){
    var id='hub'+t.charAt(0).toUpperCase()+t.slice(1);
    var el=document.getElementById(id);
    if(el)el.classList.toggle('hide',t!==tab);
  });
  if(tab==='stats')setTimeout(renderStats,0);
  if(tab==='analyse')setTimeout(renderAnalyse,0);
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
      el.innerHTML='<div class="empty-state"><div class="eico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></div><h3>Your first script is waiting</h3><p>Structure your Hook, build your Context, nail your CTA. Every great video starts here.</p><button class="add-btn" id="emptyCreateBtn"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>Write your first script</button><div class="empty-hint">Scripts save automatically as you write.<br/>Sign in anytime to back them up.</div></div>';
    }else{
      el.innerHTML='<div class="empty-state"><div class="eico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div><h3>No matches</h3><p>Try a different search or filter.</p></div>';
    }
    return;
  }
  setTimeout(function(){var eb=document.getElementById('emptyCreateBtn');if(eb)eb.onclick=function(){openModal('newScript');};},0);
  var statusCls={Draft:'draft','In Progress':'progress',Ready:'ready',Filmed:'filmed'};
  el.innerHTML=list.map(function(s){
    var wc=totalWords(s),pc=(s.paragraphs||[]).length,sc=s.lastScore;
    var chipHTML=sc!=null?'<span class="score-chip '+scoreLevel(sc)+'"><span class="score-chip-dot"></span>'+sc+'</span>':'';
    return '<div class="scard'+(S.bulkMode&&S.bulkSelected.indexOf(s.id)>=0?' selected':'')+' " id="sc_'+s.id+'" ontouchstart="onScardTouchStart(\''+s.id+'\',event)" ontouchend="onScardTouchEnd()" ontouchmove="onScardTouchMove()">'+
      '<div class="scard-inner" onclick="openScript(\''+s.id+'\')">'+
      '<div class="scard-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>'+
      '<div class="scard-info"><div class="scard-name">'+escHtml(s.title)+'</div>'+
      '<div class="scard-meta">'+wc+' words &nbsp;&middot;&nbsp; '+pc+' '+(pc===1?'section':'sections')+' &nbsp;&middot;&nbsp; '+timeAgo(s.updatedAt)+'</div>'+
      '<div class="scard-row"><span class="sbadge '+(statusCls[s.status]||'draft')+'" onclick="event.stopPropagation();cycleStatus(\''+s.id+'\');" style="cursor:pointer;"><span class="sbadge-dot"></span>'+(s.status||'Draft')+'</span>'+chipHTML+'</div></div>'+
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
  pbList.innerHTML=script.paragraphs.map(function(p){
    var tag=TAGS[p.tag]||TAGS.hook;
    var sc=scoreText(p.tag,p.text);
    var wc=wordCount(p.text);
    return '<div class="pb '+tag.cls+'" id="pb_'+p.id+'">'+
      '<div class="pb-hd">'+
      '<span class="pb-tag">'+tag.label+'</span>'+
      '</div>'+
      '<div class="pb-body"><textarea class="pb-ta" rows="3" placeholder="Write your '+tag.label.toLowerCase()+'..." onblur="saveParagraph(\''+p.id+'\',this.value)" oninput="autoResize(this);liveScore(\''+p.id+'\',\''+p.tag+'\',this.value)">'+escHtml(p.text)+'</textarea></div>'+
      '<div class="pb-ft"><span class="pb-wc" id="wc_'+p.id+'">'+wc+' words</span>'+
      '<div class="pb-actions">'+
      '<button class="pb-action" onclick="moveParagraph(\''+p.id+'\',-1)" title="Move up"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg></button>'+
      '<button class="pb-action" onclick="moveParagraph(\''+p.id+'\',1)" title="Move down"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg></button>'+
      '<button class="pb-action" onclick="changeParagraphTag(\''+p.id+'\')" title="Change tag"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg></button>'+
      '<button class="pb-action" onclick="confirmDeleteParagraph(\''+p.id+'\')" title="Delete" style="color:var(--s-low)"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>'+
      '</div></div></div>';
  }).join('');
  document.querySelectorAll('.pb-ta').forEach(function(ta){autoResize(ta);});
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

function autoResize(ta){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';}

var _liveSyncTimer=null;
function liveScore(pid,tag,text){
  var wcel=document.getElementById('wc_'+pid);
  if(wcel)wcel.textContent=wordCount(text)+' words';
  // Debounced live sync - only if Pro and enabled
  if(S.syncEnabled&&isPro()){
    if(_liveSyncTimer)clearTimeout(_liveSyncTimer);
    _liveSyncTimer=setTimeout(runLiveSync,1500);
  }
}

function saveParagraph(pid,text){
  var script=getActive();if(!script)return;
  script.paragraphs.forEach(function(p){if(p.id===pid){p.text=text;p.score=scoreText(p.tag,text);}});
  script.updatedAt=new Date().toISOString();
  script.lastScore=overallScore(script.paragraphs);
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
  script.lastScore=overallScore(script.paragraphs);
  save();setTimeout(renderWrite,0);
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
  script.paragraphs.forEach(function(p){if(p.id===pid){p.tag=tag;p.score=scoreText(tag,p.text);}});
  script.updatedAt=new Date().toISOString();save();setTimeout(renderWrite,0);
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
      return '<div class="fact-item"><div class="fact-dot"></div><div class="fact-text">'+escHtml(txt)+'</div>'+
      '<button class="fact-del" onclick="deleteNote(\''+tab+'\','+i+')"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>';
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
  if(!isPro()){openProSheet();return;}
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

// ── Stats helpers ──
function calcStreak(sessions){
  if(!sessions||!sessions.length)return 0;
  var dates=Array.from(new Set(sessions.map(function(s){return s.date;}))).sort().reverse();
  var streak=0,today=new Date().toISOString().split('T')[0],check=today;
  for(var i=0;i<dates.length;i++){
    if(dates[i]===check){streak++;var d=new Date(check);d.setDate(d.getDate()-1);check=d.toISOString().split('T')[0];}
    else if(dates[i]<check)break;
  }
  return streak;
}
function getLast7(sessions){
  var days=[];
  for(var i=6;i>=0;i--){
    var d=new Date();d.setDate(d.getDate()-i);
    var ds=d.toISOString().split('T')[0];
    var active=sessions.some(function(s){return s.date===ds;});
    days.push({label:ds,active:active});
  }
  return days;
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

// ── Stats render ──
function renderHub(){setHubTab(S.activeHubTab);}

var statsFilterVal='all';
function setStatsFilter(btn){
  statsFilterVal=btn.dataset.sf;
  document.querySelectorAll('.sseg-btn').forEach(function(b){b.classList.toggle('on',b===btn);});
  setTimeout(renderStats,0);
}

function renderStats(){
  var el=document.getElementById('statsBody');if(!el)return;
  var raw=JSON.parse(localStorage.getItem(STATS_KEY)||'{}');
  var sessions=raw.sessions||[];
  var now=new Date();
  var filtered=sessions.filter(function(s){
    if(statsFilterVal==='week'){return (now-new Date(s.date))<7*864e5;}
    if(statsFilterVal==='month'){return (now-new Date(s.date))<30*864e5;}
    return true;
  });
  var streak=calcStreak(sessions);
  var last7=getLast7(sessions);
  var statuses={Draft:0,'In Progress':0,Ready:0,Filmed:0};
  S.scripts.forEach(function(s){var k=s.status||'Draft';statuses[k]=(statuses[k]||0)+1;});
  var totalSc=S.scripts.length;
  var totalWd=S.scripts.reduce(function(a,s){return a+totalWords(s);},0);
  var totalPg=S.scripts.reduce(function(a,s){return a+(s.paragraphs?s.paragraphs.length:0);},0);
  var done=statuses.Ready+statuses.Filmed;
  var compPct=totalSc>0?Math.round((done/totalSc)*100):0;
  var tagCounts={hook:0,ctx:0,body:0,cta:0,out:0};
  S.scripts.forEach(function(s){(s.paragraphs||[]).forEach(function(p){if(tagCounts[p.tag]!=null)tagCounts[p.tag]++;});});
  var tagTotal=Object.values(tagCounts).reduce(function(a,b){return a+b;},0)||1;
  var dayCounts=[0,0,0,0,0,0,0];
  filtered.forEach(function(s){var d=(new Date(s.date)).getDay();dayCounts[d]++;});
  var maxDay=Math.max.apply(null,dayCounts)||1;
  var dayLbls=['S','M','T','W','T','F','S'];
  var peakDay=dayCounts.indexOf(Math.max.apply(null,dayCounts));
  var timeCounts={morning:0,afternoon:0,evening:0};
  filtered.forEach(function(s){timeCounts[s.slot]=(timeCounts[s.slot]||0)+1;});
  var peakSlot=Object.keys(timeCounts).reduce(function(a,b){return timeCounts[a]>=timeCounts[b]?a:b;},'morning');
  var activeDays=new Set(filtered.map(function(s){return s.date;})).size;
  var spanDays=statsFilterVal==='week'?7:statsFilterVal==='month'?30:Math.max(30,sessions.length>0?Math.ceil((now-new Date(sessions[0].date))/864e5):30);
  var consPct=Math.min(100,Math.round((activeDays/spanDays)*100));
  var circ=2*Math.PI*30,dashOff=circ-(consPct/100)*circ;
  var bestSess=raw.bestSession;
  var avgWd=totalSc>0?Math.round(totalWd/totalSc):0;
  var html='';

  // Overview
  html+='<div class="stat-card"><div class="stat-card-title">Overview</div>'+
    '<div class="hero-grid">'+
    '<div class="hcell streak"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/></svg><div class="hcell-num">'+streak+'</div><div class="hcell-lbl">day streak</div></div>'+
    '<div class="hcell"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><div class="hcell-num">'+totalSc+'</div><div class="hcell-lbl">scripts</div></div>'+
    '<div class="hcell"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg><div class="hcell-num">'+(totalWd>999?(totalWd/1000).toFixed(1)+'k':totalWd)+'</div><div class="hcell-lbl">words</div></div>'+
    '</div><div class="hero-grid" style="margin-top:8px;">'+
    '<div class="hcell"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><div class="hcell-num">'+filtered.length+'</div><div class="hcell-lbl">sessions</div></div>'+
    '<div class="hcell"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><div class="hcell-num">'+totalPg+'</div><div class="hcell-lbl">sections</div></div>'+
    '<div class="hcell"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg><div class="hcell-num">'+avgWd+'</div><div class="hcell-lbl">avg words</div></div>'+
    '</div>'+
    '<div class="streak-dots" style="margin-top:14px;">'+last7.map(function(d,i){return '<div class="sdot'+(d.active?' f':'')+(i===6?' t':'')+'" title="'+d.label+'"></div>';}).join('')+'</div>'+
    '<div style="height:1px;background:var(--border);margin:12px 0 8px;"></div>'+
    '<div class="status-pills">'+
    ['Draft','In Progress','Ready','Filmed'].map(function(st){var cls={Draft:'draft','In Progress':'progress',Ready:'ready',Filmed:'filmed'}[st];return '<span class="sbadge '+cls+'"><span class="sbadge-dot"></span>'+(statuses[st]||0)+' '+st+'</span>';}).join('')+
    '</div>'+
    (tagTotal>0?'<div style="height:1px;background:var(--border);margin:10px 0 8px;"></div>'+
    '<div class="tag-bar">'+Object.entries(tagCounts).map(function(e){return '<div class="tag-seg" style="width:'+Math.round(e[1]/tagTotal*100)+'%;background:'+(TAGS[e[0]]||TAGS.hook).color+'"></div>';}).join('')+'</div>'+
    '<div class="tag-legend">'+Object.entries(tagCounts).map(function(e){var lbl={hook:'Hook',ctx:'Ctx',body:'Body',cta:'CTA',out:'Outro'}[e[0]]||e[0];return '<div class="tleg-item"><div class="tleg-dot" style="background:'+(TAGS[e[0]]||TAGS.hook).color+'"></div><div class="tleg-pct">'+Math.round(e[1]/tagTotal*100)+'%</div><div class="tleg-name">'+lbl+'</div></div>';}).join('')+'</div>':'')+
    '</div>';

  // Consistency
  html+='<div class="stat-card"><div class="stat-card-title">Consistency</div><div class="ring-row">'+
    '<div class="ring-wrap"><svg viewBox="0 0 72 72"><circle class="ring-track" cx="36" cy="36" r="30"/><circle class="ring-fill" cx="36" cy="36" r="30" stroke-dasharray="'+circ+'" stroke-dashoffset="'+dashOff+'"/></svg><div class="ring-lbl"><div class="ring-pct">'+consPct+'%</div><div class="ring-sub">active</div></div></div>'+
    '<div><div class="ring-info-title">'+activeDays+' active day'+(activeDays===1?'':'s')+'</div><div class="ring-info-sub">Out of the last '+Math.round(spanDays)+' days. Keep the momentum going.</div></div>'+
    '</div></div>';

  // Activity by day
  html+='<div class="stat-card"><div class="stat-card-title">Activity by Day</div><div class="bar-chart">'+
    dayCounts.map(function(c,i){var h=Math.round((c/maxDay)*58);return '<div class="bar-col"><div class="bar-outer"><div class="bar-inner '+(i===peakDay?'peak':'rest')+'" style="height:'+Math.max(h,3)+'px"></div></div><div class="bar-lbl">'+dayLbls[i]+'</div></div>';}).join('')+
    '</div></div>';

  // When you write
  var timeIcos={morning:'☀',afternoon:'⛅',evening:'☽'};
  html+='<div class="stat-card"><div class="stat-card-title">When You Write</div><div class="time-row">'+
    Object.keys(timeCounts).map(function(slot){return '<div class="time-block'+(slot===peakSlot?' peak':'')+'"><div class="time-ico">'+timeIcos[slot]+'</div><div class="time-lbl">'+slot.charAt(0).toUpperCase()+slot.slice(1)+'</div><div class="time-count">'+(timeCounts[slot]||0)+' sessions</div></div>';}).join('')+
    '</div></div>';

  // Completion ratio
  html+='<div class="stat-card"><div class="stat-card-title">Scripts Started vs Completed</div><div class="ratio-row">'+
    '<div class="ratio-pct">'+compPct+'%</div>'+
    '<div class="ratio-bars">'+
    '<div class="ratio-item"><div class="ratio-lbl">Started</div><div class="ratio-track"><div class="ratio-fill started" style="width:100%"></div></div><div class="ratio-num">'+totalSc+'</div></div>'+
    '<div class="ratio-item"><div class="ratio-lbl">Completed</div><div class="ratio-track"><div class="ratio-fill done" style="width:'+(totalSc?Math.round(done/totalSc*100):0)+'%"></div></div><div class="ratio-num">'+done+'</div></div>'+
    '</div></div></div>';

  // Best session
  if(bestSess&&bestSess.words>0){
    html+='<div class="stat-card"><div class="stat-card-title">Best Writing Session</div><div class="best-row">'+
      '<div class="best-num">'+bestSess.words+'</div>'+
      '<div><div class="best-lbl">Words</div><div class="best-date">'+new Date(bestSess.date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})+'</div><div class="best-sub">Your personal record</div></div>'+
      '</div></div>';
  }

  // Pro locked teaser
  html+='<div style="background:linear-gradient(135deg,var(--accent-soft),rgba(184,115,51,.04));border:1px solid var(--accent-border);border-radius:14px;padding:16px;margin-top:4px;">'+
    '<div style="font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:6px;">Coming with Pro</div>'+
    '<div style="font-size:.84rem;font-weight:600;color:var(--text);margin-bottom:5px;">Score Trends Over Time</div>'+
    '<div style="font-size:.72rem;color:var(--muted);line-height:1.6;margin-bottom:12px;">See how your Hook, CTA and overall script scores move across every video you write. Spot your consistent weak spots and track real improvement.</div>'+
    '<button onclick="openProSheet()" style="padding:8px 18px;border-radius:8px;background:var(--accent);color:#0A0D14;border:none;font-size:.76rem;font-weight:700;cursor:pointer;">See Pro Features</button>'+
    '</div>';

  el.innerHTML=html;
}

// ── Analyse tab ──
function renderAnalyse(){
  var el=document.getElementById('analyseScroll');if(!el)return;
  loadAnalyseHistory();
  var hist=S.analyseHistory;
  if(!hist||!hist.length){
    el.innerHTML='<div class="analyse-empty">'+
      '<div class="eico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg></div>'+
      '<h3 style="display:flex;align-items:center;gap:6px;">Analyse your script<button onclick="openModal(\'analyseHelp\')" style="background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:15px;height:15px;color:var(--muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.12 2.6-2.842 3.183C12.405 13.546 12 14.02 12 14.5V15m0 3.5v.5"/><circle cx="12" cy="12" r="10"/></svg></button></h3>'+
      '<p>Paste your script below or pick one you have already written to see how it scores.</p>'+
      '<input id="pasteTitle" placeholder="Script title (optional)" value="'+(S._pasteTitle||'')+'" oninput="S._pasteTitle=this.value" style="display:block;width:100%;box-sizing:border-box;background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:.78rem;color:var(--text);margin-bottom:8px;outline:none;"/>'+
      '<textarea class="paste-area" id="pasteArea" placeholder="Paste your script text here..." rows="4"></textarea>'+
      '<div class="analyse-btns">'+
      '<button class="abtn-p" onclick="runAnalyseFromPaste()">Analyse</button>'+
      '<button class="abtn-g" onclick="openModal(\'pickScript\')">My Scripts</button>'+
      '</div></div>';
  }else{
    var q=(S._aSearch||'').toLowerCase().trim();
    var filtered=q?hist.filter(function(h){return (h.title||'').toLowerCase().indexOf(q)>=0;}):hist;
    var recent=filtered.slice(-3).reverse();
    el.innerHTML='<div class="analyse-compact-card">'+
      '<div class="analyse-compact-title" style="display:flex;align-items:center;gap:6px;">Analyse a script<button onclick="openModal(\'analyseHelp\')" style="background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:15px;height:15px;color:var(--muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.12 2.6-2.842 3.183C12.405 13.546 12 14.02 12 14.5V15m0 3.5v.5"/><circle cx="12" cy="12" r="10"/></svg></button></div>'+
      '<input id="pasteTitle" placeholder="Script title (optional)" value="'+(S._pasteTitle||'')+'" oninput="S._pasteTitle=this.value" style="display:block;width:100%;box-sizing:border-box;background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:9px 12px;font-size:.78rem;color:var(--text);margin-bottom:7px;outline:none;"/>'+
      '<textarea class="paste-area" id="pasteArea" placeholder="Paste script text..." rows="3"></textarea>'+
      '<div class="analyse-btns">'+
      '<button class="abtn-p" onclick="runAnalyseFromPaste()">Analyse</button>'+
      '<button class="abtn-g" onclick="openModal(\'pickScript\')">My Scripts</button>'+
      '</div></div>'+
      
      '<div class="history-label">Recent Analyses</div>'+
      recent.map(function(h){
        return '<div class="history-card" onclick="openAnalyseResult(\''+h.id+'\')">'+
          '<div class="hscore '+scoreLevel(h.score)+'">'+h.score+'</div>'+
          '<div class="hinfo"><div class="htitle">'+escHtml(h.title)+'</div><div class="hmeta">'+timeAgo(h.date)+'</div></div>'+
          '<button class="pb-action" onclick="event.stopPropagation();renameAnalyseSession(\''+h.id+'\');" title="Rename" style="color:var(--faint);padding:6px;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button><button class="pb-action" onclick="event.stopPropagation();deleteAnalyseSession(\''+h.id+'\');" title="Remove" style="color:var(--faint);padding:6px;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>';
      }).join('')+
      (hist.length>2?'<button class="view-all-btn" onclick="openModal(\'allHistory\')">View all sessions</button>':'');
  }
}

function runAnalyseFromPaste(){
  var ta=document.getElementById('pasteArea');
  if(!ta||!ta.value||!ta.value.trim()){showToast('Paste some script text first','error');return;}
  var text=ta.value.trim();
  var wct=wordCount(text);
  if(wct<20){showToast('Add more text. Need at least 20 words','error');return;}
  var titleEl=document.getElementById('pasteTitle');
  S._pasteTitle=(titleEl&&titleEl.value.trim())||'';
  var btn=document.querySelector('.abtn-p');
  if(btn){
    btn.innerHTML='<svg viewBox="0 0 24 24" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;" fill="none" class="spinning"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10" stroke-linecap="round"/></svg>Analysing...';
    btn.disabled=true;
  }
  var minDelay=wct>200?5000:3000;
  var started=Date.now();
  aiTagAndAnalyse(text,function(){
    var elapsed=Date.now()-started;
    var remaining=Math.max(0,minDelay-elapsed);
    setTimeout(function(){
      if(btn){btn.innerHTML='Analyse';btn.disabled=false;}
      S._pasteTitle='';
    },remaining);
  },S._pasteTitle);
}

function aiTagAndAnalyse(text,onDone,title){
  // AI call removed - rule engine handles analysis
  // AI-powered analysis will be introduced as a Pro feature with proper API proxy
  if(onDone)onDone();
  runAnalyse(text,title||'Pasted Script');
}
function runAnalyseForScript(id){
  var s=S.scripts.find(function(x){return x.id===id;});
  if(!s)return;
  var text=(s.paragraphs||[]).map(function(p){return p.text;}).join('\n\n');
  closeMo();
  runAnalyse(text,s.title,id,s.paragraphs);
}

function runAnalyse(text,title,scriptId,paragraphs){
  // Build pseudo-paragraphs if just raw text
  var paras=paragraphs||guessParagraphs(text);
  var sectionScores={};
  var tagOrder=['hook','ctx','body','cta','out'];
  tagOrder.forEach(function(tag){
    var p=paras.find(function(x){return x.tag===tag;});
    sectionScores[tag]=p?scoreText(tag,p.text):0;
  });
  var overall=overallScore(paras);
  var result={
    id:uid(),title:title||'Script Analysis',date:new Date().toISOString(),
    score:overall,sectionScores:sectionScores,paragraphs:paras,scriptId:scriptId||null
  };
  loadAnalyseHistory();
  S.analyseHistory.push(result);
  if(S.analyseHistory.length>20)S.analyseHistory=S.analyseHistory.slice(-20);
  saveAnalyseHistory();
  safeGtag('event','script_analysed',{score:overall});
  // Small delay so the analysing state is visible before results appear
  var _resultId=result.id;
  setTimeout(function(){openAnalyseResult(_resultId);},200);
}


function getScriptVerdict(scores,overall){
  var hookSc=scores.hook||0,ctaSc=scores.cta||0,bodySc=scores.body||0;
  var seed=Math.round(overall+hookSc);
  function pv(arr){return arr[Math.abs(seed)%arr.length];}
  if(overall>=80)return pv(['Ready to film.','This script is ready.','Strong across every section.','Built to hold attention.']);
  if(overall>=70)return pv(['Nearly there.','One or two fixes from strong.','Good structure, sharpen the edges.','Close to ready.']);
  if(overall>=60&&hookSc>=65)return pv(['Strong start, loose finish.','Good opening, weak close.','Hook earns it, CTA loses it.','Starts well, ends softly.']);
  if(overall>=60&&hookSc<45)return pv(['Good content, weak entry.','Strong middle, soft opening.','Content is there, hook is not.','The body works, the hook does not.']);
  if(hookSc>=70&&ctaSc<40)return pv(['Earns attention, loses the ask.','Hook lands, CTA does not.','Strong open, no close.','Attention earned, action lost.']);
  if(hookSc<40&&overall>=50)return pv(['The content works, the opening does not.','Good ideas, wrong start.','Structure is there, entry is not.','Substance without a hook.']);
  if(ctaSc<35&&overall>=50)return pv(['No clear ask at the close.','Ends without direction.','Strong through the body, no finish.','Good content, no call to action.']);
  if(overall>=45)return pv(['Not ready to film.','Structural gaps throughout.','Needs work before filming.','The foundation is there but incomplete.']);
  return pv(['Not ready to film.','Significant gaps in structure.','Rebuild before filming.','The script needs substantial work.']);
}
function getScriptVerdictSub(scores,overall,tags){
  var hookSc=scores.hook||0,ctaSc=scores.cta||0,bodySc=scores.body||0;
  var ctxSc=scores.ctx||0,outSc=scores.out||0;
  var seed=Math.round(overall+hookSc);
  function pv(arr,s){if(!arr||!arr.length)return '';return arr[Math.abs(s||seed)%arr.length];}
  if(typeof FB==='undefined')return '';

  var weakest='hook',weakestSc=hookSc;
  if(ctaSc>0&&ctaSc<weakestSc){weakest='cta';weakestSc=ctaSc;}
  if(bodySc>0&&bodySc<weakestSc){weakest='body';weakestSc=bodySc;}
  if(ctxSc>0&&ctxSc<weakestSc){weakest='ctx';weakestSc=ctxSc;}
  if(outSc>0&&outSc<weakestSc){weakest='out';weakestSc=outSc;}

  var s1='';
  if(hookSc>=65){s1=pv(['The hook creates a genuine open loop and earns the viewer\'s attention.','The opening lands well and gives the viewer a reason to stay.','The hook does its job: it creates tension without resolving it.'],seed);}
  else if(bodySc>=65){s1=pv(['The main body delivers real value and maintains attention through the middle.','The content in the body is strong and consistently rewards the viewer.','The body section works well and justifies the viewer\'s patience.'],seed);}
  else if(ctxSc>=65){s1=pv(['The context earns credibility early and sets a clear promise.','Strong context means the viewer enters the body with trust already built.','The context section establishes authority and gives the viewer direction.'],seed);}
  else{s1=pv(['The structure has the right sections in the right order.','The core components are present, though each needs sharpening.','The foundation of a strong video is here.'],seed);}

  var s2='';
  var entryMap={hook:[hookSc<40?FB.hook.noTension:FB.hook.creatorFirst],cta:[ctaSc<40?FB.cta.noAction:FB.cta.actionNoReason],ctx:[ctxSc<40?FB.ctx.noCredential:FB.ctx.credentialNoPayoff],body:[FB.body.noMomentum],out:[FB.out.abrupt]};
  var e2=entryMap[weakest]?entryMap[weakest][0]:null;
  if(e2)s2=pv(e2.consequence,seed+1);
  if(!s2)s2=pv(['The weakest section is pulling the overall score down significantly.','One section is costing the script more than all the others combined.','The gaps are concentrated and fixable with targeted edits.'],seed+1);

  var s3='';
  var fixMap={hook:[hookSc<40?FB.hook.noTension:FB.hook.noViewerAddress],cta:[ctaSc<40?FB.cta.noAction:FB.cta.actionNoReason],ctx:[ctxSc<40?FB.ctx.noCredential:FB.ctx.credentialNoPayoff],body:[bodySc<40?FB.body.noMomentum:FB.body.noExamples],out:[FB.out.noCallback]};
  var e3=fixMap[weakest]?fixMap[weakest][0]:null;
  if(e3)s3=pv(e3.direction,seed+2);
  if(!s3)s3=pv(['Fix the weakest section first before adjusting anything else.','One focused rewrite of the lowest-scoring section will move the overall score more than any other change.','Prioritise the section with the lowest score and address it with a single targeted edit.'],seed+2);

  return s1+' '+s2+' '+s3;
}
function openAnalyseResult(id){
  loadAnalyseHistory();
  var result=S.analyseHistory.find(function(h){return h.id===id;});
  if(!result)return;
  S._currentResultId=id;

  document.getElementById('analyseResultsScreen').classList.remove('hide');
  var titleEl=document.getElementById('resTitle');
  if(titleEl)titleEl.textContent=result.title||'Analysis';
  var dateEl=document.getElementById('resDate');
  if(dateEl)dateEl.textContent=result.date?new Date(result.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'';

  // Run full intelligence
  var paras=result.paragraphs||[];
  var intel=analyseScript(paras);
  var scores=intel.sectionScores;
  var overall=intel.overall||result.score||0;
  var level=scoreLevel(overall);
  var tagNames={hook:'Hook',ctx:'Context',body:'Main Body',cta:'CTA',out:'Outro'};
  var tagOrder=['hook','ctx','body','cta','out'];

  // Build all three panels
  var circ=Math.PI*2*28;
  var fill=Math.round(circ*(1-overall/100)*10)/10;
  var colMap={high:'var(--s-high)',mid:'var(--s-mid)',low:'var(--s-low)'};
  var col=colMap[level];

  // ── HERO (shared across all tabs) ──
  var hero='<div class="res-hero">';
  hero+='<div class="res-hero-top">';
  hero+='<div class="res-score-ring"><svg viewBox="0 0 72 72"><circle class="res-ring-track" cx="36" cy="36" r="28"/>';
  hero+='<circle class="res-ring-fill '+level+'" cx="36" cy="36" r="28" stroke-dasharray="'+circ+'" stroke-dashoffset="'+fill+'"/></svg>';
  hero+='<div class="res-score-num"><span class="res-score-val '+level+'">'+overall+'</span><span class="res-score-lbl">score</span></div></div>';
  hero+='<div class="res-hero-info"><div class="res-verdict">'+getScriptVerdict(scores,overall)+'</div>';
  hero+='<div class="res-summary">'+getScriptVerdictSub(scores,overall,Object.keys(scores))+'</div></div></div>';
  hero+='<div class="res-section-bars">';
  tagOrder.forEach(function(tag){
    var sc=scores[tag];
    if(!sc&&sc!==0)return;
    if(!paras.find(function(p){return p.tag===tag;}))return;
    var lv=scoreLevel(sc);
    hero+='<div class="res-sbar"><span class="res-sbar-name">'+tagNames[tag]+'</span>';
    hero+='<div class="res-sbar-track"><div class="res-sbar-fill '+lv+'" style="width:'+sc+'%"></div></div>';
    hero+='<span class="res-sbar-val '+lv+'">'+sc+'</span></div>';
  });
  hero+='</div></div>';

  // ── OVERVIEW PANEL ──
  var ov='';

  // Top issue
  if(intel.issues&&intel.issues.length){
    var issue=intel.issues[0];
    ov+='<div class="top-issue-card">';
    ov+='<div class="top-issue-hd"><span class="tih-label">Top Issue</span><span class="tih-section">'+issue.section+'</span>';
    ov+='<span class="tih-impact '+issue.impact+'">'+issue.impact+' impact</span></div>';
    ov+='<div class="tih-body">';
    ov+='<div class="tih-row"><div class="tih-dot obs"></div><div class="tih-text obs">'+issue.observation+'</div></div>';
    ov+='<div class="tih-row"><div class="tih-dot cons"></div><div class="tih-text">'+issue.consequence+'</div></div>';
    ov+='<div class="tih-row"><div class="tih-dot fix"></div><div class="tih-text fix">'+issue.fix+'</div></div>';
    ov+='</div></div>';
  }

  // Attention curve
  ov+='<div class="res-curve-card"><div class="res-card-title" style="display:flex;align-items:center;gap:5px;">Attention Curve';
  ov+='<button onclick="showStatHelp(\'curve\')" style="background:none;border:none;color:var(--faint);font-size:.6rem;cursor:pointer;">[?]</button></div>';
  ov+='<div class="res-curve">';
  var curve=intel.curve||[];
  var maxAbs=Math.max(0.1,Math.max.apply(null,curve.map(function(v){return Math.abs(v);})));
  curve.forEach(function(v){
    var pct=Math.round(((v+maxAbs)/(maxAbs*2))*100);
    var h=Math.max(8,Math.round((pct/100)*48));
    var cls=v>0.3?'pos':v<-0.3?'neg':'neu';
    ov+='<div class="res-curve-bar '+cls+'" style="height:'+h+'px"></div>';
  });
  ov+='</div><div class="res-curve-labels"><span class="res-curve-lbl">0%</span><span class="res-curve-lbl">50%</span><span class="res-curve-lbl">100%</span></div></div>';

  // Stats row
  ov+='<div class="res-stats-row">';
  ov+='<div class="res-stat-chip"><div class="res-stat-num">'+intel.totalWords+'</div><div class="res-stat-lbl">Words</div></div>';
  ov+='<div class="res-stat-chip"><div class="res-stat-num">'+intel.totalSentences+'</div><div class="res-stat-lbl">Sentences</div></div>';
  ov+='<div class="res-stat-chip" onclick="showStatHelp(\'pace\','+intel.sentenceLenVariance+')" style="cursor:pointer;"><div class="res-stat-num">'+intel.sentenceLenVariance+'</div><div class="res-stat-lbl">Pace Var ?</div></div>';
  ov+='<div class="res-stat-chip" onclick="showStatHelp(\'insight\','+intel.rewardDensity+')" style="cursor:pointer;"><div class="res-stat-num">'+intel.rewardDensity+'</div><div class="res-stat-lbl">Insight ?</div></div>';
  ov+='</div>';

  // Promise + Voice tracking
  var promiseStatus=intel.promises&&intel.promises.length?(intel.promiseDelivered?'Delivered':'Not delivered'):'None made';
  var promiseCol=intel.promises&&intel.promises.length?(intel.promiseDelivered?'var(--s-high)':'var(--s-low)'):'var(--muted)';
  var totalSents=intel.sentenceData?intel.sentenceData.length:1;
  var youCount=intel.sentenceData?intel.sentenceData.filter(function(s){return s.viewerBenefit>0||(/you/i.test(s.sentence));}).length:0;
  var voiceRatio=totalSents>0?Math.round((youCount/totalSents)*100):0;
  var voiceCol=voiceRatio>=40?'var(--s-high)':voiceRatio>=25?'var(--s-mid)':'var(--s-low)';
  ov+='<div style="display:flex;gap:6px;padding:10px 14px 0;">';
  ov+='<div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;">';
  ov+='<div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:5px;">Promise <button onclick="showStatHelp(\'promise\')" style="background:none;border:none;color:var(--faint);font-size:.55rem;cursor:pointer;">[?]</button></div>';
  ov+='<div style="font-size:.8rem;font-weight:600;color:'+promiseCol+';">'+promiseStatus+'</div></div>';
  ov+='<div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;">';
  ov+='<div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:5px;">Voice <button onclick="showStatHelp(\'voice\')" style="background:none;border:none;color:var(--faint);font-size:.55rem;cursor:pointer;">[?]</button></div>';
  ov+='<div style="font-size:.8rem;font-weight:600;color:'+voiceCol+';">Viewer '+voiceRatio+'%</div></div></div>';

  // Section balance
  ov+='<div style="margin:10px 14px 0;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;">';
  ov+='<div style="font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Section Balance</div>';
  ov+='<div style="display:flex;gap:3px;height:28px;border-radius:6px;overflow:hidden;margin-bottom:6px;">';
  var tagColors={hook:'var(--hook)',ctx:'var(--ctx)',body:'var(--body-c)',cta:'var(--cta)',out:'var(--out)'};
  var tagBgs={hook:'var(--hook-bg)',ctx:'var(--ctx-bg)',body:'var(--body-bg)',cta:'var(--cta-bg)',out:'var(--out-bg)'};
  var totalWds=Math.max(1,paras.reduce(function(a,p){return a+wc(p.text||'');},0));
  tagOrder.forEach(function(tag){
    var tagParas=paras.filter(function(p){return p.tag===tag;});
    if(!tagParas.length)return;
    var tagWds=tagParas.reduce(function(a,p){return a+wc(p.text||'');},0);
    var pct=Math.max(5,Math.round((tagWds/totalWds)*100));
    ov+='<div style="flex:'+pct+';background:'+tagBgs[tag]+';border:1px solid '+tagColors[tag]+';opacity:.8;display:flex;align-items:center;justify-content:center;font-size:.48rem;font-weight:700;color:'+tagColors[tag]+';">'+tagNames[tag].split(' ')[0]+'</div>';
  });
  // Balance insight from library
  var balanceKey='wellBalanced';
  var ctaWds2=paras.filter(function(p){return p.tag==='cta';}).reduce(function(a,p){return a+wc(p.text||'');},0);
  var hookWds2=paras.filter(function(p){return p.tag==='hook';}).reduce(function(a,p){return a+wc(p.text||'');},0);
  var bodyWds2=paras.filter(function(p){return p.tag==='body';}).reduce(function(a,p){return a+wc(p.text||'');},0);
  if(ctaWds2>0&&ctaWds2<15)balanceKey='ctaLight';
  else if(hookWds2>0&&hookWds2<10)balanceKey='hookLight';
  else if(totalWds>0&&bodyWds2/totalWds>0.72)balanceKey='bodyHeavy';
  if(typeof getStatInsight==='function'){
    var balTxt=getStatInsight('balance',balanceKey);
    if(balTxt)ov+='<div style="font-size:.68rem;color:var(--muted);line-height:1.55;margin-top:6px;">'+balTxt+'</div>';
  }
  ov+='</div></div>';

  // In short
  ov+='<div class="res-inshort"><div class="res-inshort-tag">In short</div>';
  ov+='<div class="res-inshort-verdict">'+getScriptVerdict(scores,overall)+'</div>';
  ov+='<div class="res-inshort-body">'+getScriptVerdictSub(scores,overall,Object.keys(scores))+'</div></div>';

  // Actions
  ov+='<div style="display:flex;flex-direction:column;gap:8px;padding:16px 14px 28px;">';
  ov+='<button class="res-export-btn" onclick="openAsNewScript(\''+id+'\')" style="width:100%;justify-content:center;">';
  ov+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-4-4m0 0l4-4m-4 4h14M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/></svg>';
  ov+=(result.scriptId?'Open Script':'Open as New Script')+'</button>';
  ov+='<button class="res-export-btn" onclick="downloadAnalysisResults()" style="width:100%;justify-content:center;">';
  ov+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>';
  ov+='Download Report</button></div>';

  // ── SECTIONS PANEL ──
  var sec='';var _si=0;
  paras.forEach(function(p){
    if(!p.text||!p.text.trim())return;
    var sc=scores[p.tag]||scoreText(p.tag,p.text);
    var lv=scoreLevel(sc);
    var fb=getParagraphFeedback(p.tag,p.text,sc);
    var fbCls=sc>=70?'pos':sc<45?'neg':'';
    sec+='<div class="res-anno-block tag-'+p.tag+(_si===0?' open':'')+' " style="margin:10px 14px 0;" onclick="toggleAnnoBlock(this)">'; _si++;
    sec+='<div class="res-anno-hd"><span class="res-anno-tag">'+( tagNames[p.tag]||p.tag)+'</span>';
    sec+='<span class="score-pill '+lv+'"><span class="score-pill-dot"></span>'+sc+'</span>';
    sec+='<svg style="width:14px;height:14px;color:var(--faint);flex-shrink:0;transition:transform .2s;margin-left:4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg></div>';
    sec+='<div class="res-anno-sec-body">';
    sec+='<div class="res-anno-text">'+escHtml(p.text)+'</div>';
    sec+='<div class="res-anno-fb '+fbCls+'">'+fb+'</div></div></div>';
  });
  sec+='<div style="display:flex;flex-direction:column;gap:8px;padding:16px 14px 28px;">';
  sec+='<button class="res-export-btn" onclick="downloadAnalysisResults()" style="width:100%;justify-content:center;">';
  sec+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Download Report</button></div>';

  // ── DEEP PANEL ──
  var deep='';
  deep+='<div style="margin:12px 14px 0;padding:11px 13px;background:var(--accent-soft);border:1px solid var(--accent-border);border-radius:10px;font-size:.72rem;color:var(--muted);line-height:1.6;">';
  deep+='<strong style="color:var(--accent);">Hook and Context</strong> show full per-sentence feedback. Upgrade to <strong style="color:var(--accent);">Pro</strong> to unlock Body, CTA and Outro at the same depth.</div>';

  // Per-sentence for hook and ctx
  var freeTags=['hook','ctx'];
  var proTags=['body','cta','out'];
  freeTags.forEach(function(tag){
    var tagParas=paras.filter(function(p){return p.tag===tag;});
    tagParas.forEach(function(p){
      if(!p.text||!p.text.trim())return;
      var sents=p.text.replace(/([.!?])\s+/g,'$1').split('').filter(function(s){return s.trim().length>3;});
      sents.forEach(function(s,si){
        var sc=scoreText(tag,s);
        var lv=scoreLevel(sc);
        var fb=getParagraphFeedback(tag,s,sc);
        var fbCls=sc>=70?'pos':sc<45?'neg':'';
        deep+='<div class="res-anno-block tag-'+tag+'" style="margin:'+(si===0?'10px':'4px')+' 14px 0;">';
        deep+='<div class="res-anno-hd"><span class="res-anno-tag">'+tagNames[tag]+' '+( sents.length>1?'&middot; '+(si+1):'')+'</span>';
        deep+='<span class="score-pill '+lv+'"><span class="score-pill-dot"></span>'+sc+'</span></div>';
        deep+='<div class="res-anno-text">'+escHtml(s)+'</div>';
        deep+='<div class="res-anno-fb '+fbCls+'">'+fb+'</div></div>';
      });
    });
  });

  // Pro gate
  var hasProContent=proTags.some(function(tag){return paras.some(function(p){return p.tag===tag&&p.text&&p.text.trim();});});
  if(hasProContent){
    deep+='<div style="margin:10px 14px 0;border:1px solid var(--accent-border);border-radius:12px;background:var(--accent-soft);padding:14px;">';
    deep+='<div style="font-size:.56rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:5px;">Pro feature</div>';
    deep+='<div style="font-size:.84rem;font-weight:700;color:var(--text);margin-bottom:4px;">Per-sentence feedback for Body, CTA and Outro</div>';
    deep+='<div style="font-size:.7rem;color:var(--muted);line-height:1.6;margin-bottom:12px;">See exactly which sentences are costing you retention and what to replace them with.</div>';
    deep+='<button onclick="openProSheet()" style="padding:8px 18px;border-radius:8px;background:var(--accent);color:#0A0D14;border:none;font-size:.76rem;font-weight:700;cursor:pointer;">See Pro Features</button></div>';
  }

  // Failure patterns  -  all shown, detail is the value
  if(intel.failurePatterns&&intel.failurePatterns.length){
    intel.failurePatterns.forEach(function(fp){
      var fpSeed=fp.id?fp.id.length*7+fp.id.charCodeAt(0):42;
      var libEntry=typeof getPatternEntry==='function'?getPatternEntry(fp.id):null;
      var fpDesc=libEntry&&typeof getPatternDescription==='function'?getPatternDescription(fp.id,fpSeed):fp.desc;
      var fpCons=libEntry&&typeof getPatternConsequence==='function'?getPatternConsequence(fp.id,fpSeed+1):'';
      var fpEx=libEntry&&typeof getPatternExample==='function'?getPatternExample(fp.id,fpSeed+2):'';
      deep+='<div style="margin:10px 14px 0;border:1px solid rgba(192,90,90,.25);border-radius:12px;background:rgba(139,58,58,.08);padding:12px 14px;">';
      deep+='<div style="font-size:.56rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--s-low);margin-bottom:4px;">Pattern detected</div>';
      deep+='<div style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:5px;">'+fp.name+'</div>';
      deep+='<div style="font-size:.7rem;color:var(--muted);line-height:1.6;margin-bottom:6px;">'+fpDesc+'</div>';
      if(fpCons){deep+='<div style="font-size:.7rem;color:rgba(192,90,90,.85);line-height:1.6;margin-bottom:8px;padding:7px 10px;background:rgba(139,58,58,.1);border-radius:8px;">'+fpCons+'</div>';}
      if(fpEx){
        deep+='<div style="padding:8px 10px;background:rgba(255,255,255,.03);border-radius:8px;border-left:2px solid var(--s-high);">';
        deep+='<div style="font-size:.56rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--s-high);margin-bottom:4px;">What good looks like</div>';
        deep+='<div style="font-size:.7rem;color:var(--muted);line-height:1.6;">'+fpEx+'</div></div>';
      }
      deep+='</div>';
    });
  }


  deep+='<div style="display:flex;flex-direction:column;gap:8px;padding:16px 14px 28px;">';
  deep+='<button class="res-export-btn" onclick="openAsNewScript(\''+id+'\')" style="width:100%;justify-content:center;">';
  deep+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-4-4m0 0l4-4m-4 4h14M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/></svg>';
  deep+=(result.scriptId?'Open Script':'Open as New Script')+'</button>';
  deep+='<button class="res-export-btn" onclick="downloadAnalysisResults()" style="width:100%;justify-content:center;">';
  deep+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Download Report</button>';
  deep+='<div style="text-align:center;font-size:.58rem;color:var(--faint);padding-top:8px;">Scripora v3.9 &middot; by Selerii</div></div>';

  // Render hero into fixed div above panels
  var heroEl=document.getElementById('resHero');
  if(heroEl){
    heroEl.innerHTML=hero;
    // Force repaint on Android Chrome
    heroEl.style.display='none';
    heroEl.offsetHeight; // trigger reflow
    heroEl.style.display='';
  }

  // Store panels (without hero) and render Overview by default
  S._resPanels={overview:ov,sections:sec,deep:deep};
  switchResTab('overview', document.getElementById('rtab-overview'));
}

function switchResTab(name,btn){
  if(!btn)btn=document.getElementById('rtab-'+name);
  document.querySelectorAll('.res-tab').forEach(function(t){t.classList.remove('on');});
  if(btn)btn.classList.add('on');
  var panel=S._resPanels?S._resPanels[name]:'';
  var body=document.getElementById('resBody');
  if(body){
    body.innerHTML=panel;
    body.scrollTop=0;
  }
}

function getSectionNote(tag,sc){
  var notes={
    hook:{
      high:'Opens a loop the viewer needs to close. Attention earned.',
      mid:'The opening creates interest but does not fully lock the viewer in.',
      low:'This does not give the viewer a reason to stay past the first few seconds.'
    },
    ctx:{
      high:'Establishes credibility and promises clear value viewer trust is building.',
      mid:'Credibility is present but the payoff for the viewer is not clearly defined.',
      low:'The viewer still does not know why your voice on this topic is worth their time.'
    },
    body:{
      high:'Delivers on the promise. Specificity and structure hold attention.',
      mid:'The content is there but is not landing with full weight yet.',
      low:'This section delays or diffuses the value the viewer came for.'
    },
    cta:{
      high:'The ask is earned and specific follow-through probability is high.',
      mid:'The action is named but the viewer has not been given a strong reason to act.',
      low:'No clear direction. The viewer finishes the video and moves on.'
    },
    out:{
      high:'Closes the loop and gives the viewer somewhere to go next.',
      mid:'Functional ending but it does not reinforce what the viewer just watched.',
      low:'The video stops rather than ends. No reason to stay in your world.'
    }
  };
  return (notes[tag]&&notes[tag][scoreLevel(sc)])||'';
}


function highlightText(text){
  // Highlight filler words in amber/red, strong words in green
  var safe=escHtml(text);
  var fillers=['basically','literally','you know','like i said','sort of','kind of','actually'];
  fillers.forEach(function(f){safe=safe.replace(new RegExp('\\b'+f+'\\b','gi'),function(m){return '<span class="hl-bad">'+m+'</span>';});});
  return safe;
}

function scheduleRenderAnalyse(){setTimeout(renderAnalyse,0);}
function renameAnalyseSession(id){
  loadAnalyseHistory();
  var h=S.analyseHistory.find(function(x){return x.id===id;});
  if(!h)return;
  openModal('_raw','<div class="mhandle"></div><div class="modal-title">Rename</div>'+
    '<input class="modal-inp" id="renameAInp" value="'+escHtml(h.title||'')+'" placeholder="Script title" style="margin-bottom:12px;"/>'+
    '<div class="modal-acts">'+
    '<button class="btn-g" onclick="closeMoForce()">Cancel</button>'+
    '<button class="btn-a active" onclick="event.stopPropagation();(function(){var v=document.getElementById(\'renameAInp\').value.trim();if(!v)return;loadAnalyseHistory();var hh=S.analyseHistory.find(function(x){return x.id===\''+id+'\';});if(hh){hh.title=v;saveAnalyseHistory();}closeMoForce();setTimeout(renderAnalyse,0);showToast(\'Renamed\',\'success\');})();">Save</button>'+
    '</div>');
  setTimeout(function(){var i=document.getElementById('renameAInp');if(i){i.focus();i.select();}},180);
}
function deleteAnalyseSession(id){
  loadAnalyseHistory();
  S.analyseHistory=S.analyseHistory.filter(function(h){return h.id!==id;});
  saveAnalyseHistory();
  setTimeout(renderAnalyse,0);
  showToast('Removed','default');
}
function openAsNewScript(resultId){
  loadAnalyseHistory();
  var result=S.analyseHistory.find(function(h){return h.id===resultId;});
  if(!result)return;
  // If this analysis came from an existing script, just open that script
  if(result.scriptId){
    var existing=S.scripts.find(function(s){return s.id===result.scriptId;});
    if(existing){
      S.activeId=existing.id;
      closeAnalyseResults();goScreen('write');
      showToast('Opened in Write','success');
      return;
    }
  }
  // Otherwise create a new script from the pasted analysis
  if(!isPro()&&S.scripts.length>=FREE_LIMIT){
    showToast('10 script limit reached. Upgrade to Pro for unlimited scripts.','error');
    return;
  }
  var newId=uid();
  var script={
    id:newId,
    title:result.title==='Pasted Script'?'Script from Analysis':result.title,
    status:'Draft',
    paragraphs:result.paragraphs.map(function(p){return {id:uid(),tag:p.tag,text:p.text,score:p.score};}),
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString(),
    notes:{facts:[],ideas:[],links:[],notes:[]},
    lastScore:result.score
  };
  S.scripts.push(script);S.activeId=newId;save();syncToCloud();
  closeAnalyseResults();goScreen('write');
  showToast('Opened as new script','success');
}

function downloadAnalysisResults(){
  loadAnalyseHistory();
  var result=S.analyseHistory[S.analyseHistory.length-1];
  if(!result)return;
  var tagNames={hook:'Hook',ctx:'Context',body:'Main Body',cta:'CTA',out:'Outro'};
  var date=result.date?new Date(result.date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'';
  var lines=[];
  lines.push('SCRIPORA ANALYSIS REPORT');
  lines.push(''.padEnd(40,'='));
  lines.push('');
  lines.push('Script:  '+( result.title||'Untitled'));
  lines.push('Date:    '+date);
  lines.push('Score:   '+result.score+' / 100  ('+scoreVerdict(result.score)+')');
  lines.push('');
  lines.push(''.padEnd(40,'-'));
  lines.push('SECTION SCORES');
  lines.push(''.padEnd(40,'-'));
  var order=['hook','ctx','body','cta','out'];
  order.forEach(function(tag){
    var sc=result.sectionScores[tag];
    if(!sc&&sc!==0)return;
    var name=tagNames[tag]||tag;
    var bar='';
    var filled=Math.round(sc/5);
    for(var i=0;i<20;i++)bar+=i<filled?'#':'-';
    lines.push(name.padEnd(12)+' '+bar+' '+sc);
  });
  lines.push('');
  lines.push(''.padEnd(40,'-'));
  lines.push('SECTION FEEDBACK');
  lines.push(''.padEnd(40,'-'));
  (result.paragraphs||[]).filter(function(p){return p.text&&p.text.trim();}).forEach(function(p){
    var sc=result.sectionScores[p.tag]||0;
    var fb=getParagraphFeedback(p.tag,p.text,sc);
    lines.push('');
    lines.push('['+( tagNames[p.tag]||p.tag).toUpperCase()+']  Score: '+sc);
    lines.push(p.text);
    lines.push('');
    lines.push('Feedback:');
    lines.push(fb);
    lines.push('');
  });
  lines.push(''.padEnd(40,'-'));
  lines.push('Generated by Scripora  scripora.vercel.app');
  lines.push(''.padEnd(40,'='));
  var txt=lines.join('\n');
  var a=document.createElement('a');
  a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);
  a.download=(result.title||'analysis').replace(/[^a-z0-9]/gi,'_')+'_scripora_report.txt';
  a.style.cssText='position:fixed;top:0;left:0;opacity:0;';
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);},200);
  showToast('Report downloaded','success');
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
  ['start','write','analyse','account'].forEach(function(t){
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
      {q:'What is Scripora?',a:'Scripora is a script planning app for YouTube creators. It helps you structure your Hook, Context, Main Body, CTA and Outro, then analyses what each section does to viewer attention.'},
      {q:'How do I create my first script?',a:'Go to the Scripts tab and tap the + button at the top right. Give your script a title and you will be taken straight to the Write tab.'},
      {q:'Do I need to sign in?',a:'No. You can write and save scripts without an account. Sign in with Google to back up your scripts to the cloud and access them on any device.'},
      {q:'What does the score mean?',a:'Each section is scored on signals the engine detects: tension, credibility, pacing, direction and reward. A score above 70 is strong. Below 45 needs work. The overall score is a weighted average across all sections.'}
    ]},
    {title:'Script Structure',items:[
      {q:'What are Hook, Context, Body, CTA and Outro?',a:'These are the five sections of a YouTube script. Hook grabs attention in the first few seconds. Context builds credibility and sets the promise. Main Body delivers the value. CTA directs the viewer. Outro closes the loop and sends them forward.'},
      {q:'Do I have to use all five sections?',a:'No. The engine works with whatever sections you have. A complete script with all five gets the most detailed analysis.'}
    ]}
  ];
  if(tab==='write')return [
    {title:'Writing',items:[
      {q:'How do I add sections?',a:'Tap the + button at the bottom of the Write screen. Choose a tag (Hook, Context etc) and type your paragraph.'},
      {q:'Can I reorder sections?',a:'Yes. Each paragraph has up and down arrows to move it.'},
      {q:'What is the Notes drawer?',a:'Tap the clipboard icon in the Write header to open a notes drawer with four tabs: Facts, Ideas, Links and Notes. Use it to store research and reference material while writing.'},
      {q:'What does the chart icon do?',a:'The chart icon opens a condensed Script Report drawer showing your last analysis result for this script, including top issues and the fix for each one.'},
      {q:'How do I rename a script?',a:'Tap the script title at the top of the Write screen to rename it.'}
    ]},
    {title:'Export',items:[
      {q:'How do I copy my script?',a:'Tap the eye icon in the Write header to open View Script. From there you can copy the full text or download it as a plain text file.'},
      {q:'What is Portfolio export?',a:'Portfolio is a Pro feature that exports your script as a formatted HTML document with colour-coded sections.'}
    ]}
  ];
  if(tab==='analyse')return [
    {title:'Using the Analyser',items:[
      {q:'How does the analyser work?',a:'Paste your script text and tap Analyse. The engine reads every sentence and detects signals across five categories: tension, credibility, pacing, direction and reward. It maps them onto an attention timeline and generates a full report.'},
      {q:'What is the Attention Curve?',a:'The curve shows how viewer engagement is predicted to move through your script. Green bars mean attention is rising. Grey is neutral. Red signals a risk point where viewers may drop off.'},
      {q:'What is Pace Variance?',a:'Pace variance measures how much your sentence lengths vary. Above 4 means good rhythm. Below 2 means uniform sentence length, which creates a flat, hard-to-follow experience.'},
      {q:'What is Insight Density?',a:'Insight density counts new insights per 100 words. It measures how often you reward the viewer with something new. Low density means repetition without escalation.'},
      {q:'What are Failure Patterns?',a:'Failure patterns are named archetypes describing a common structural mistake. Examples: Early Payoff Trap means the hook resolves itself. Creator Diary means the script opens with the creator rather than the viewer. Flatline Pacing means uniform sentence length throughout.'},
      {q:'Can I rename an analysis?',a:'Yes. Tap the edit icon on any history card, or tap the title on a results page.'}
    ]},
    {title:'History',items:[
      {q:'How do I find an old analysis?',a:'Use the search bar above your recent sessions. It filters by script title in real time.'},
      {q:'Can I open an analysed script in Write?',a:'Yes. On any result page, tap Open Script or Open as New Script to bring it into the Write tab.'}
    ]}
  ];
  if(tab==='account')return [
    {title:'Account and Sync',items:[
      {q:'How does cloud sync work?',a:'When signed in, your scripts sync automatically after every change. You can access them from any device by signing in with the same Google account.'},
      {q:'What is Scripora Pro?',a:'Pro unlocks unlimited scripts (free tier has 10), Portfolio export, and future features including the AI writing assistant and advanced analytics.'},
      {q:'How do I unlock Pro?',a:'Go to Profile and enter a promo code in the Pro section, or purchase through the link provided.'},
      {q:'How do I delete my account?',a:'Go to Profile, scroll to the bottom, tap Delete Account, and type DELETE to confirm. This removes all your data permanently.'}
    ]},
    {title:'Privacy',items:[
      {q:'What data does Scripora store?',a:'Your scripts and analysis history are stored locally on your device and optionally synced to Firebase if you are signed in. Scripora does not sell or share your data.'},
      {q:'Does Scripora use AI?',a:'The analysis engine is rule-based and runs entirely in your browser. No script content is sent to any server. An AI layer using the Claude API is planned as a Pro feature in a future update.'}
    ]}
  ];
  return [];
}

// ── Report Drawer ──
function toggleAnnoBlock(el){el.classList.toggle('open');}
function showStatHelp(type,value){
  var title='About this stat';
  var body='';
  if(type==='curve'){
    title='Attention Curve';
    body='The attention curve maps predicted viewer engagement across your script in 10 time buckets. Green bars mean attention is rising. Grey is neutral. Red signals a predicted drop-off point where viewers are likely to leave.';
  }else if(type==='pace'){
    title='Pace Variance';
    body=(typeof getStatInsight==='function'?getStatInsight('pace',parseFloat(value)||0):'')||'Pace variance measures sentence length variation. Above 4 is strong rhythm. Below 2 is flat.';
  }else if(type==='insight'){
    title='Insight Density';
    body=(typeof getStatInsight==='function'?getStatInsight('insight',parseFloat(value)||0):'')||'Insight density counts new insights per 100 words. Low means repetition without escalation.';
  }else if(type==='promise'){
    title='Promise Tracking';
    body=(typeof getStatInsight==='function'?getStatInsight('promise',value||'none'):'')||'Promise tracking checks whether a commitment made in the opening is delivered later.';
  }else if(type==='voice'){
    title='Voice Ratio';
    body=(typeof getStatInsight==='function'?getStatInsight('voice',parseFloat(value)||0):'')||'Voice ratio measures how often the script addresses the viewer directly.';
  }else if(type==='sync'){
    title='Live Sync';
    body='Live Sync keeps your analysis up to date as you write. Every edit triggers a fresh analysis. Pro only.';
  }
  openModal('_raw','<div class="mhandle"></div><div class="modal-title" style="font-size:.9rem;">'+title+'</div><p style="font-size:.78rem;color:var(--muted);line-height:1.65;margin-bottom:16px;">'+body+'</p><button class="btn-g" onclick="closeMoForce()">Got it</button>');
}

// ── Onboarding ──
var _obSlide=0;
var _obData=[
  {icon:'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',title:'Write with structure',body:'Every great YouTube video starts with a script. Scripora gives you five building blocks: Hook, Context, Main Body, CTA and Outro. Each one has a job. Together they hold the viewer from open to close.'},
  {icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',title:'Understand what your script does',body:'The Analyse tab reads your script sentence by sentence and maps it as a viewer attention timeline. You see where attention spikes, where it drops, and exactly what to fix before you film.'},
  {icon:'M13 10V3L4 14h7v7l9-11h-7z',title:'Write with intention',body:'Scripora does not check grammar or count keywords. It simulates what a viewer experiences, second by second, and tells you what happens if you do not change it.'}
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
  [0,1,2].forEach(function(i){var dot=document.getElementById('od'+i);if(dot)dot.classList.toggle('on',i===n);});
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

// ══════════════════════════════════════════
// WRITE TAB REPORT DRAWER
// ══════════════════════════════════════════

function openWriteReport(){
  var script=getActive();
  if(!script){
    // Try to find any script
    if(S.scripts&&S.scripts.length){
      S.activeId=S.scripts[S.scripts.length-1].id;
      script=getActive();
    }
    if(!script){showToast('Open a script first','error');return;}
  }
  if(!script.paragraphs||!script.paragraphs.length){showToast('Add some content to analyse','default');return;}

  // Run analysis on current paragraphs
  var intel=analyseScript(script.paragraphs);
  S._liveIntel=intel;

  // Populate header
  var overall=intel.overall||0;
  var level=scoreLevel(overall);
  var colMap={high:'var(--s-high)',mid:'var(--s-mid)',low:'var(--s-low)'};
  var scoreEl=document.getElementById('wrScore');
  if(scoreEl){scoreEl.textContent=overall;scoreEl.style.color=colMap[level]||'var(--muted)';}
  var verdictEl=document.getElementById('wrVerdict');
  if(verdictEl){verdictEl.textContent=getScriptVerdict(intel.sectionScores,overall);}

  // Update sync toggle state
  updateSyncToggleUI();

  // Render body
  renderWriteReportBody(intel,script);

  // Open drawer - requestAnimationFrame ensures transition fires after display:none removed
  var wd=document.getElementById('wrDrawer');
  var wov=document.getElementById('wrDov');
  wd.classList.remove('hide');
  wov.classList.remove('hide');
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      wd.classList.add('open');
      wov.classList.add('open');
    });
  });
}

function goToFullReport(){closeWriteReport();goScreen('hub');setTimeout(function(){var pill=document.querySelector('.hub-pill[data-tab="analyse"]');if(pill)setHubTab(pill,'analyse');},120);}
function closeWriteReport(){
  document.getElementById('wrDrawer').classList.remove('open');
  document.getElementById('wrDov').classList.remove('open');
  setTimeout(function(){
    document.getElementById('wrDrawer').classList.add('hide');
    document.getElementById('wrDov').classList.add('hide');
  },250);
}

function renderWriteReportBody(intel,script){
  var out='';
  var tagOrder=['hook','ctx','body','cta','out'];
  var tagNames={hook:'Hook',ctx:'Context',body:'Main Body',cta:'CTA',out:'Outro'};
  var scores=intel.sectionScores;

  // Section bars
  out+='<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;">';
  tagOrder.forEach(function(tag){
    var sc=scores[tag];
    if(!sc&&sc!==0)return;
    if(!script.paragraphs.find(function(p){return p.tag===tag;}))return;
    var lv=scoreLevel(sc);
    out+='<div style="display:flex;align-items:center;gap:8px;">';
    out+='<span style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;width:52px;flex-shrink:0;color:var(--muted);">'+tagNames[tag]+'</span>';
    out+='<div style="flex:1;height:4px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;">';
    out+='<div style="width:'+sc+'%;height:100%;border-radius:2px;background:var(--'+( lv==='high'?'s-high':lv==='mid'?'s-mid':'s-low')+');"></div></div>';
    out+='<span style="font-size:.6rem;font-weight:700;width:22px;text-align:right;color:var(--'+( lv==='high'?'s-high':lv==='mid'?'s-mid':'s-low')+');">'+sc+'</span>';
    out+='</div>';
  });
  out+='</div>';

  // Top issue
  if(intel.issues&&intel.issues.length){
    var issue=intel.issues[0];
    out+='<div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:10px;">';
    out+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">';
    out+='<span style="font-size:.66rem;font-weight:700;color:var(--text);">'+issue.section+'</span>';
    var ic=issue.impact==='high'?'background:rgba(139,58,58,.15);color:var(--s-low)':'background:var(--s-mid-bg);color:var(--s-mid)';
    out+='<span style="font-size:.56rem;font-weight:700;padding:2px 6px;border-radius:20px;'+ic+'">'+issue.impact+' impact</span></div>';
    out+='<div style="font-size:.74rem;color:var(--text);line-height:1.55;margin-bottom:4px;">'+issue.observation+'</div>';
    out+='<div style="font-size:.72rem;color:var(--s-high);line-height:1.55;">'+issue.fix+'</div>';
    out+='</div>';
  }

  // Full report link
    out+='<button onclick="goToFullReport()" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:10px;border-radius:10px;background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent);font-size:.8rem;font-weight:600;cursor:pointer;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>Full Report on Hub</button>';

  var body=document.getElementById('wrBody');
  if(body)body.innerHTML=out;
}

function toggleLiveSync(){
  if(!isPro()){
    openProSheet();
    return;
  }
  S.syncEnabled=!S.syncEnabled;
  updateSyncToggleUI();
  if(S.syncEnabled){
    showToast('Live Sync on','success');
    runLiveSync();
  }else{
    showToast('Live Sync off','default');
  }
  save();
}

function updateSyncToggleUI(){
  var toggle=document.getElementById('wrSyncToggle');
  var knob=document.getElementById('wrSyncKnob');
  var sub=document.getElementById('wrSyncSub');
  if(!toggle)return;
  if(S.syncEnabled&&isPro()){
    toggle.style.background='var(--accent)';
    toggle.style.borderColor='var(--adk)';
    if(knob)knob.style.transform='translateX(18px)';
    if(sub)sub.textContent='Syncing as you write';
  }else{
    toggle.style.background='rgba(255,255,255,.1)';
    toggle.style.borderColor='var(--border)';
    if(knob)knob.style.transform='translateX(0)';
    if(sub)sub.textContent='Updates analysis as you write';
  }
}

function runLiveSync(){
  var script=getActive();
  if(!script||!S.syncEnabled||!isPro())return;
  var intel=analyseScript(script.paragraphs);
  S._liveIntel=intel;
  // Update script's last score silently
  script.lastScore=intel.overall;
  save();
  // If drawer is open, refresh the display
  if(!document.getElementById('wrDrawer').classList.contains('hide')){
    var overall=intel.overall;
    var level=scoreLevel(overall);
    var colMap={high:'var(--s-high)',mid:'var(--s-mid)',low:'var(--s-low)'};
    var scoreEl=document.getElementById('wrScore');
    if(scoreEl){scoreEl.textContent=overall;scoreEl.style.color=colMap[level]||'var(--muted)';}
    var verdictEl=document.getElementById('wrVerdict');
    if(verdictEl)verdictEl.textContent=getScriptVerdict(intel.sectionScores,overall);
    renderWriteReportBody(intel,script);
  }
}

function closeAnalyseResults(){
  document.getElementById('analyseResultsScreen').classList.add('hide');
  // Re-render analyse tab so history shows new session without refresh
  if(S.activeHubTab==='analyse'){
    setTimeout(renderAnalyse,0);
  }
}

// ── Profile ──
function renderProfile(){
  var el=document.getElementById('profileContent');
  if(!S.currentUser||S.isGuest){
    el.innerHTML='<div class="prof-guest">'+
      '<div class="prof-guest-logo"><em>S</em></div>'+
      '<h2>Your writing, protected</h2>'+
      '<p class="prof-guest-sub">Sign in to back up your scripts, sync across devices and unlock Hub.</p>'+
      '<div class="benefits">'+
      '<div class="benefit"><div class="benefit-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg></div><div class="benefit-txt"><strong>Cloud backup</strong>Your scripts are safe even if you lose your phone.</div></div>'+
      '<div class="benefit"><div class="benefit-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4s8 1.79 8 4"/></svg></div><div class="benefit-txt"><strong>Multi-device sync</strong>Start on mobile, finish on any device.</div></div>'+
      '<div class="benefit"><div class="benefit-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div><div class="benefit-txt"><strong>Full Hub access</strong>Track your stats, writing streaks and analyse your scripts.</div></div>'+
      '</div>'+
      '<button class="ls-google" onclick="signInGoogle()" style="margin-bottom:12px;">'+
      '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>'+
      'Sign in with Google</button>'+
      '<div class="prof-legal"><span onclick="openModal(\'privacy\')">Privacy Policy</span><span style="color:rgba(255,255,255,.1)">·</span><span onclick="openModal(\'terms\')">Terms</span></div>'+
      '</div>';
    return;
  }

  var u=S.currentUser;
  var initials=(u.displayName||'U').split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase();
  var html='<div class="prof-hero">'+
    '<div class="prof-av">'+(u.photoURL?'<img src="'+u.photoURL+'" alt="avatar"/>':initials)+'</div>'+
    '<div class="prof-name">'+(u.displayName||'Creator')+'</div>'+
    '<div class="prof-email">'+u.email+'</div>'+
    '<div class="prof-sync"><span class="sync-dot"></span>Synced</div>'+
    '</div>';

  // Account
  html+='<div class="prof-sec">Account</div>';
  html+='<div class="prof-row" onclick="openModal(\'editProfile\')">'+
    '<div class="prof-row-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>'+
    '<div class="prof-row-info"><div class="prof-row-lbl">Edit Profile</div></div>'+
    '<div class="prof-row-right"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div></div>';

  // Pro
  html+='<div class="prof-sec">Pro</div>';
  if(isPro()){
    html+='<div class="pro-box"><span class="pro-badge"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:11px;height:11px;"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3l14 9-14 9V3z"/></svg>Pro Member</span><div style="font-size:.74rem;color:var(--muted);margin-top:6px;line-height:1.55;">You have access to all Pro features. Thank you for supporting Scripora.</div></div>';
  }else{
    html+='<div class="pro-box">'+
      '<div style="font-size:.82rem;font-weight:600;color:var(--text);margin-bottom:4px;">Unlock Pro</div>'+
      '<div style="font-size:.72rem;color:var(--muted);margin-bottom:10px;">Portfolio export, advanced analytics and AI writing assistant coming soon.</div>'+
      '<button style="width:100%;padding:10px;border-radius:8px;background:var(--accent);color:#0A0D14;border:none;font-size:.82rem;font-weight:700;cursor:pointer;" onclick="openProSheet()">Get Pro &middot; $9.99</button>'+
      '<div class="coupon-row"><input class="coupon-inp" id="couponInpProfile" placeholder="Have a promo code?"/><button class="coupon-apply" onclick="checkProCode(document.getElementById(\'couponInpProfile\').value)">Apply</button></div>'+
      '</div>';
  }

  // App
  html+='<div class="prof-sec">App</div>';
  if(!window.matchMedia('(display-mode: standalone)').matches){
    html+='<div class="prof-row" onclick="openInstallGuide()">'+
      '<div class="prof-row-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg></div>'+
      '<div class="prof-row-info"><div class="prof-row-lbl">Get the App</div><div class="prof-row-sub">Install Scripora on your device</div></div>'+
      '<div class="prof-row-right"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div></div>'
  }
  html+='<div class="prof-row" onclick="openModal(\'themes\')">'+
    '<div class="prof-row-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg></div>'+
    '<div class="prof-row-info"><div class="prof-row-lbl">Themes</div><div class="prof-row-sub">'+THEMES.find(function(t){return t.id===currentThemeId();}).name+'</div></div>'+
    '<div class="prof-row-right"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div></div>';

  // Up Next
  html+='<div class="prof-sec">Up Next</div>';
  html+='<div class="prof-row" onclick="openHelp()">'+
    '<div class="prof-row-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.12 2.6-2.842 3.183C12.405 13.546 12 14.02 12 14.5V15m0 3.5v.5"/><circle cx="12" cy="12" r="10"/></svg></div>'+
    '<div class="prof-row-info"><div class="prof-row-lbl">Help &amp; Guide</div><div class="prof-row-sub">How Scripora works, features and tips</div></div>'+
    '<div class="prof-row-right"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div></div>';
  html+='<div class="prof-row" onclick="openModal(\'contact\')">'+
    '<div class="prof-row-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>'+
    '<div class="prof-row-info"><div class="prof-row-lbl">Contact Developer</div><div class="prof-row-sub">Feedback, bugs and feature requests</div></div>'+
    '<div class="prof-row-right"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div></div>';
  // Sign out / delete
  html+='<div style="height:16px;"></div>';
  html+='<div class="signout-row" onclick="signOut()">'+
    '<div class="signout-ico"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg></div>'+
    '<div class="signout-lbl red">Sign Out</div></div>';
  html+='<div class="signout-row" onclick="openModal(\'deleteAccount\')">'+
    '<div class="signout-ico" style="background:rgba(139,58,58,.08);"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></div>'+
    '<div class="signout-lbl" style="color:var(--faint);font-size:.78rem;">Delete Account</div></div>';

  html+='<div class="prof-btm"><span onclick="openModal(\'privacy\')">Privacy Policy</span><span class="prof-btm-dot">&middot;</span><span onclick="openModal(\'terms\')">Terms</span></div>';
  html+='<div class="prof-version">Scripora v3.4 &nbsp;&middot;&nbsp; by Selerii</div>';
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
  load();loadAnalyseHistory();applyTheme(currentThemeId());
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
function toggleAhSort(){S._ahSort=S._ahSort==='name'?'date':'name';openModal('allHistory');}
function getAhSortLabel(){return (S._ahSort||'date')==='name'?'Sort: Name':'Sort: Date';}
var _modalOpen=false;
function openModal(type,data){
  // Cancel any pending long-press timer
  if(_lpTimer){clearTimeout(_lpTimer);_lpTimer=null;}
  _modalOpen=true;
  var mo=document.getElementById('mo');
  var modal=document.getElementById('modal');
  var xBtn='<button onclick="closeMoForce()" style="position:absolute;top:10px;right:12px;background:none;border:none;color:var(--muted);padding:4px;cursor:pointer;display:flex;z-index:2;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>';
  var html='<div class="mhandle"></div>'+xBtn;

  if(type==='_raw'){html=data||'';modal.innerHTML=html;mo.classList.add('open');return;}

  if(type==='newScript'){
    html+='<div class="modal-title">New Script</div>'+
      '<div class="modal-sub">Give your script a working title.</div>'+
      '<input class="modal-inp" id="newScriptTitle" placeholder="e.g. How I Built a YouTube Channel..." maxlength="120" onkeydown="if(event.key===\'Enter\')createScript()"/>'+
      '<div class="modal-hint">You can change this at any time.</div>'+
      '<div class="modal-acts"><button class="btn-g" onclick="closeMo()">Cancel</button><button class="btn-p" onclick="createScript()">Create</button></div>';
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

  if(type==='pickScript'){
    var list=S.scripts.map(function(s){return '<div class="history-card" onclick="runAnalyseForScript(\''+s.id+'\')"><div class="hinfo"><div class="htitle">'+escHtml(s.title)+'</div><div class="hmeta">'+totalWords(s)+' words &middot; '+timeAgo(s.updatedAt)+'</div></div><div class="harrow"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:14px;height:14px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div></div>';}).join('');
    html+='<div class="modal-title">Pick a Script</div>'+
      (list||'<p style="font-size:.8rem;color:var(--muted);padding:8px 0;">No scripts yet.</p>')+
      '<button class="btn-g" style="width:100%;margin-top:10px;" onclick="closeMo()">Cancel</button>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  if(type==='allHistory'){
    loadAnalyseHistory();
    var ahSort=S._ahSort||'date';
    var ahQ=(S._ahQ||'').toLowerCase().trim();
    var allH=(S.analyseHistory||[]).slice();
    if(ahSort==='name')allH.sort(function(a,b){return (a.title||'').localeCompare(b.title||'');});
    else allH.reverse();
    if(ahQ)allH=allH.filter(function(h){return (h.title||'').toLowerCase().indexOf(ahQ)>=0;});
    var histList=allH.map(function(h){
      return '<div class="history-card" onclick="closeMoForce();openAnalyseResult(\''+h.id+'\')">'+
        '<div class="hscore '+scoreLevel(h.score)+'">'+h.score+'</div>'+
        '<div class="hinfo"><div class="htitle">'+escHtml(h.title)+'</div><div class="hmeta">'+timeAgo(h.date)+'</div></div>'+
        '<button class="pb-action" onclick="event.stopPropagation();deleteAnalyseSession(\''+h.id+'\');scheduleRenderAnalyse();" title="Remove" style="color:var(--faint);padding:6px;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>';
    }).join('');
    html+='<div class="modal-title">All Analyses</div>'+
      '<div style="display:flex;gap:6px;margin-bottom:10px;">'+
      '<input placeholder="Search..." oninput="S._ahQ=this.value;closeMoForce();openModal(\'allHistory\')" style="flex:1;background:var(--s2);border:1px solid var(--border);border-radius:8px;padding:7px 10px;font-size:.76rem;color:var(--text);"/>'+
      '<button onclick="toggleAhSort()" style="padding:7px 10px;background:var(--s2);border:1px solid var(--border);border-radius:8px;font-size:.7rem;color:var(--muted);white-space:nowrap;">'+getAhSortLabel()+'</button>'+
      '</div>'+
      (histList||'<p style="font-size:.8rem;color:var(--muted);">No history yet.</p>')+
      '<button class="btn-g" style="width:100%;margin-top:10px;" onclick="closeMo()">Close</button>';
    modal.innerHTML=html;mo.classList.add('open');return;
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
      '<select class="contact-sel" id="contactType"><option value="feedback">General feedback</option><option value="bug">Bug report</option><option value="feature">Feature request</option><option value="pro">Pro / billing</option></select>'+
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
    html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><div class="modal-title" style="margin-bottom:0;">Privacy Policy</div><button onclick="closeMoForce()" style="background:none;border:none;padding:4px;color:var(--muted);display:flex;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>'+
      '<div class="long-body">'+
      '<h4>What we collect</h4><p>When you sign in with Google, we collect your name, email address and profile photo to personalise your experience. Your scripts and writing session data are stored locally on your device. If you are signed in, this data is synced to our secure cloud storage (Google Firestore) so you can access it across devices.</p>'+
      '<h4>How we use your data</h4><p>Your data is used solely to provide and improve Scripora. We do not sell, licence or share your personal data with third parties. We do not use your script content for advertising, model training or any purpose beyond storage and delivery back to you.</p>'+
      '<h4>Script analysis</h4><p>The Analyse feature uses a local rule-based engine that runs entirely in your browser. No script content is sent to any external server during analysis. An AI-assisted layer is planned for future Pro users and will be clearly disclosed when active.</p>'+
      '<h4>Analytics</h4><p>We use Google Analytics to understand aggregate usage patterns   which features are used, how often, and on what devices. This data is anonymous. Your script content is never included in analytics events.</p>'+
      '<h4>Local storage</h4><p>Scripora stores your scripts, preferences and writing stats in your browser&#39;s local storage. This data does not leave your device unless you are signed in and syncing is active. Clearing your browser data will remove locally stored scripts.</p>'+
      '<h4>Your rights</h4><p>You can delete your account and all associated cloud data at any time from Profile → Delete Account. Local data can be cleared through your browser or device settings. To request data deletion by email, contact us at support@scripora.app.</p>'+
      '<p style="font-size:.7rem;margin-top:12px;">Last updated: March 2026 &nbsp;&middot;&nbsp; Contact: support@scripora.app</p>'+
      '</div>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  if(type==='terms'){
    html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><div class="modal-title" style="margin-bottom:0;">Terms of Use</div><button onclick="closeMoForce()" style="background:none;border:none;padding:4px;color:var(--muted);display:flex;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>'+
      '<div class="long-body">'+
      '<h4>Using Scripora</h4><p>Scripora is a scriptwriting tool for YouTube creators. By using it you agree to these terms. You may use Scripora for personal and commercial creative work. You may not use it to produce content that is illegal, harmful, abusive or that infringes on the intellectual property rights of others.</p>'+
      '<h4>Your content</h4><p>You retain full ownership of everything you write in Scripora. By enabling cloud sync, you grant Selerii a limited, non-exclusive licence to store and transmit your content solely for the purpose of delivering it back to you. We do not claim any rights over your scripts.</p>'+
      '<h4>Script scoring and analysis</h4><p><strong>Important notice:</strong> Script scores, structural analysis and all feedback provided by Scripora   whether generated by rule-based logic or AI assistance   are estimates based on language patterns and structural signals. They are not guarantees of video performance, audience retention or commercial outcomes. Scores should be used as guidance to support your creative decisions, not as definitive assessments of quality. Scripora is not responsible for outcomes resulting from reliance on score data.</p>'+
      '<h4>AI-assisted features</h4><p>Scripora uses a rule-based engine to analyse scripts. Feedback is generated from structural signals in your writing and is provided to support your creative decisions. A Claude API-powered layer is planned as a future Pro feature.</p>'+
      '<h4>Pro membership</h4><p>Pro features are provided as described at the time of purchase via Gumroad. Pro is a one-time payment for lifetime access to current Pro features. We reserve the right to add, modify or remove features with reasonable notice. Refunds are handled on a case-by-case basis   contact support@scripora.app within 14 days of purchase.</p>'+
      '<h4>Account termination</h4><p>You may delete your account at any time from the Profile tab. We reserve the right to suspend accounts that violate these terms.</p>'+
      '<h4>Limitation of liability</h4><p>Scripora is provided as-is without warranties of any kind. Selerii is not liable for loss of data, loss of revenue, missed opportunities or any indirect damages arising from use of this app.</p>'+
      '<p style="font-size:.7rem;margin-top:12px;">Last updated: March 2026 &nbsp;&middot;&nbsp; Contact: support@scripora.app</p>'+
      '</div>';
    modal.innerHTML=html;mo.classList.add('open');return;
  }

  modal.innerHTML=html;mo.classList.add('open');
}

function closeMo(evt){
  if(evt&&evt.target!==document.getElementById('mo'))return;
  _modalOpen=false;
  document.getElementById('mo').classList.remove('open');
}
function closeMoTouch(evt){
  if(!evt||evt.target!==document.getElementById('mo'))return;
  evt.preventDefault();
  _modalOpen=false;
  document.getElementById('mo').classList.remove('open');
}
function closeMoForce(){document.getElementById('mo').classList.remove('open');}

function checkDeleteConfirm(inp){
  var btn=document.getElementById('deleteBtn');
  if(btn)btn.classList.toggle('active',inp.value==='DELETE');
}

// ── Modal actions ──
function createScript(){
  var inp=document.getElementById('newScriptTitle');
  var title=(inp?inp.value:'').trim();
  if(!title){showToast('Enter a title first','error');return;}
  if(!isPro()&&S.scripts.length>=FREE_LIMIT){closeMo();openProSheet();return;}
  var id=uid();
  S.scripts.unshift({id:id,title:title,status:'Draft',paragraphs:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),notes:{facts:[],ideas:[],links:[],notes:[]},lastScore:null});
  S.activeId=id;save();syncToCloud();
  closeMoForce();goScreen('write');
  showToast('Script created','success');
  safeGtag('event','script_created');
}

function addParagraph(tag){
  var script=getActive();if(!script)return;
  if(!script.paragraphs)script.paragraphs=[];
  script.paragraphs.push({id:uid(),tag:tag,text:'',score:0});
  script.updatedAt=new Date().toISOString();
  save();setTimeout(renderWrite,0);
  // Focus the new textarea
  setTimeout(function(){var tas=document.querySelectorAll('.pb-ta');if(tas.length)tas[tas.length-1].focus();},80);
}

function saveNote(tab){
  var inp=document.getElementById('noteText');
  var val=(inp?inp.value:'').trim();
  if(!val){showToast('Write something first','error');return;}
  var script=getActive();if(!script)return;
  if(!script.notes)script.notes={facts:[],ideas:[],links:[],notes:[]};
  if(!script.notes[tab])script.notes[tab]=[];
  script.notes[tab].push(val);
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
  html+='<label class="modal-label">Label</label>';
  html+='<input id="editLinkLabel" class="modal-input" value="'+escHtml(link.label||'')+'" placeholder="Link label"/>';
  html+='<label class="modal-label">URL</label>';
  html+='<input id="editLinkUrl" class="modal-input" value="'+escHtml(link.url||'')+'" placeholder="https://..." style="margin-bottom:14px;"/>';
  html+='<button class="btn-p" onclick="saveEditLink('+i+')">Save</button>';
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
    localStorage.removeItem(SK);localStorage.removeItem(PRO_KEY);
    S.scripts=[];S.currentUser=null;
    closeMo();showLogin();
    showToast('Account deleted','default');
  }).catch(function(err){
    if(err.code==='auth/requires-recent-login'){showToast('Please sign out and sign in again first','error');}
    else{showToast('Delete failed   contact support@scripora.app','error');}
  });
}

// ── Pro Sheet ──
function openProSheet(){
  var ov=document.getElementById('proSheetOv');
  var sheet=document.getElementById('proSheet');
  var feats=[
    {name:'Unlimited Scripts',cls:'ready',ico:'<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>',tag:''},
    {name:'Portfolio Export',cls:'ready',ico:'<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>',tag:''},
    {name:'Script Score Trends',cls:'ready',ico:'<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>',tag:''},
    {name:'AI Writing Assistant',cls:'soon',ico:'<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',tag:'Soon'},
    {name:'Premium Themes',cls:'soon',ico:'<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',tag:'Soon'}
  ];
  var featHTML=feats.map(function(f){
    return '<div class="pro-feat"><div class="pro-feat-ico '+f.cls+'"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">'+f.ico+'</svg></div>'+
      '<div class="pro-feat-name'+(f.cls==='soon'?' dim':'')+'">'+f.name+'</div>'+
      (f.tag?'<div class="pro-feat-tag">'+f.tag+'</div>':'')+
      '</div>';
  }).join('');
  sheet.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><div class="mhandle" style="margin:0;"></div><button onclick="closeProSheet(null)" style="background:none;border:none;padding:4px;color:var(--muted);display:flex;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>'+
    '<div style="font-family:\'Playfair Display\',serif;font-size:1.1rem;color:var(--text);margin-bottom:4px;">Scripora Pro</div>'+
    '<div style="font-size:.74rem;color:var(--muted);margin-bottom:16px;">Everything you need to write with intention.</div>'+
    '<div class="pro-features">'+featHTML+'</div>'+
    '<div class="pro-price-box"><div><div class="pro-price-num">$9.99</div><div class="pro-price-sub">Lifetime access &nbsp;&middot;&nbsp; One-time payment</div></div><div class="pro-price-badge">Founder\'s Price</div></div>'+
    '<button class="pro-cta-btn" onclick="openGumroad()">Get Pro</button>'+
    '<div class="coupon-row" style="margin-top:6px;"><input class="coupon-inp" id="couponInpSheet" placeholder="Have a promo code?"/><button class="coupon-apply" onclick="checkProCode(document.getElementById(\'couponInpSheet\').value)">Apply</button></div>'+
    '<div style="font-size:.62rem;color:var(--faint);text-align:center;margin-top:10px;">Secure payment via Gumroad. No subscription.</div>';
  ov.classList.add('open');
}
function closeProSheet(evt){if(evt!==null&&evt&&evt.target!==document.getElementById('proSheetOv'))return;document.getElementById('proSheetOv').classList.remove('open');}
function openGumroad(){window.open('https://selerii.gumroad.com/l/scripora-pro','_blank');}

// ── Firebase Auth listener ──
if(auth){
  auth.onAuthStateChanged(function(user){
    if(user){
      S.currentUser=user;S.isGuest=false;
      load();loadAnalyseHistory();
      applyTheme(currentThemeId());
      showApp();
      loadFromCloud();
      safeGtag('event','login',{method:'google'});
    }else{
      if(!S.isGuest&&!S.appShown){
        S.currentUser=null;
        load();loadAnalyseHistory();
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
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',function(){
    var active=document.activeElement;
    if(!active||(active.tagName!=='TEXTAREA'&&active.tagName!=='INPUT'))return;
    // Give layout time to settle then scroll active element into view above keyboard
    setTimeout(function(){
      var rect=active.getBoundingClientRect();
      var vvh=window.visualViewport.height;
      // Only scroll if element is hidden below keyboard
      if(rect.bottom>vvh-20){
        active.scrollIntoView({block:'center',behavior:'smooth'});
      }
    },100);
  });
  // Also handle scroll events on viewport (covers the forward-typing case)
  window.visualViewport.addEventListener('scroll',function(){
    var active=document.activeElement;
    if(!active||(active.tagName!=='TEXTAREA'&&active.tagName!=='INPUT'))return;
    setTimeout(function(){
      var rect=active.getBoundingClientRect();
      var vvh=window.visualViewport.height;
      if(rect.bottom>vvh-20){
        active.scrollIntoView({block:'center',behavior:'smooth'});
      }
    },50);
  });
}
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
  var isAndroid=/android/i.test(navigator.userAgent);
  var isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  var html='<div class="mhandle"></div>';
  html+='<div class="modal-title">Get Scripora</div>';
  html+='<div class="modal-sub">Three ways to install Scripora on your device.</div>';

  // Option 1: Chrome install prompt
  html+='<div class="inst-opt" onclick="closeMoForce();installPWA();">';
  html+='<div class="inst-opt-ico" style="background:var(--accent-soft);border-color:var(--accent-border);">';
  html+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:20px;height:20px;stroke:var(--accent);"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg></div>';
  html+='<div class="inst-opt-info"><div class="inst-opt-title">Install from Chrome</div>';
  html+='<div class="inst-opt-sub">'+(pwaInstallPrompt?'Tap to install now':'Open in Chrome and use the three-dot menu')+'</div></div>';
  html+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:16px;height:16px;color:var(--faint);flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div>';

  // Option 2: APKPure listing
  html+='<div class="inst-opt" onclick="window.open(\'https://apkpure.com/scripora\',\'_blank\');closeMoForce();">';
  html+='<div class="inst-opt-ico" style="background:rgba(90,126,201,.12);border-color:rgba(90,126,201,.3);">';
  html+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:20px;height:20px;stroke:var(--body-c);"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>';
  html+='<div class="inst-opt-info"><div class="inst-opt-title">APKPure</div>';
  html+='<div class="inst-opt-sub">Download the Android app from APKPure</div></div>';
  html+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:16px;height:16px;color:var(--faint);flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div>';

  // Option 3: Direct APK download
  html+='<div class="inst-opt" onclick="window.open(\'https://scripora.vercel.app/scripora.apk\',\'_blank\');closeMoForce();">';
  html+='<div class="inst-opt-ico" style="background:rgba(106,175,130,.12);border-color:rgba(106,175,130,.3);">';
  html+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" style="width:20px;height:20px;stroke:var(--s-high);"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>';
  html+='<div class="inst-opt-info"><div class="inst-opt-title">Direct APK Download</div>';
  html+='<div class="inst-opt-sub">Download and install the APK file directly</div></div>';
  html+='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width:16px;height:16px;color:var(--faint);flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></div>';

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
  load();loadAnalyseHistory();applyTheme(currentThemeId());
  // Service worker
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(function(){});
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