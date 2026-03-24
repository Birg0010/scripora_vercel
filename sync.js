// ════════════════════════════════════════════════════════════════════
// SCRIPORA — SYNC.JS
// Firebase auth, Firestore sync, pro code validation
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
      if(doc.data().pro){
        localStorage.setItem(PRO_KEY,'true');
        if(typeof refreshProState==='function')refreshProState();
      }
    }
  }).catch(function(){});
}
function checkProCode(code){
  if(!code)return;
  var c=code.toUpperCase().trim();
  // Dev bypass
  if(c==='DEVMODE'||c==='SELERII'){
    localStorage.setItem(PRO_KEY,'true');
    showToast('Pro unlocked','success');
    if(typeof refreshProState==='function')refreshProState();
    return;
  }
  if(!db){showToast('Sign in to use promo codes','error');return;}
  db.collection('promo_codes').doc(c).get().then(function(doc){
    if(!doc.exists||doc.data().used){showToast('Invalid or used code','error');return;}
    db.collection('promo_codes').doc(c).update({used:true,used_by:S.currentUser?S.currentUser.uid:'guest',used_at:new Date().toISOString()}).then(function(){
      localStorage.setItem(PRO_KEY,'true');
      if(S.currentUser){db.collection('users').doc(S.currentUser.uid).set({pro:true,pro_code:c,pro_unlocked_at:new Date().toISOString()},{merge:true});}
      showToast('Pro unlocked! Welcome.','success');
      if(typeof refreshProState==='function')refreshProState();
      safeGtag('event','pro_unlock',{method:'coupon'});
    });
  }).catch(function(){showToast('Could not verify code','error');});
}

// ── Toast ──