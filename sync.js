// ════════════════════════════════════════════════════════════════════
// SCRIPORA — SYNC.JS
// Firebase auth, Firestore sync
// ════════════════════════════════════════════════════════════════════

function syncToCloud(){
  if(!db||!S.currentUser||S.isGuest)return;
  db.collection('users').doc(S.currentUser.uid).set({
    data:JSON.stringify(S.scripts),
    updatedAt:new Date().toISOString()
  },{merge:true}).catch(function(){});
}
function loadFromCloud(){
  if(!db||!S.currentUser||S.isGuest)return;
  db.collection('users').doc(S.currentUser.uid).get().then(function(doc){
    if(doc.exists&&doc.data().data){
      var cloud=JSON.parse(doc.data().data||'[]');
      if(cloud.length>S.scripts.length){S.scripts=cloud;save();setTimeout(renderScripts,0);}
    }
  }).catch(function(){});
}

// ── Toast ──