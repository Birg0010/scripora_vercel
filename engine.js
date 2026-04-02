// Scripora Intelligence Engine v4 - Viewer State Simulation Model

function splitSentences(text){
  if(!text||!text.trim())return[];
  return text.replace(/([.!?])\s+/g,'$1\x01').split('\x01').map(function(s){return s.trim();}).filter(function(s){return s.length>3;});
}
function getWords(text){
  if(!text)return[];
  return text.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(function(w){return w.length>0;});
}
function wc(text){return getWords(text).length;}
function clamp(v,mn,mx){return Math.min(mx,Math.max(mn,v));}
function norm(v){return clamp(v,0,1);}

// ── Feature Extraction ──
function extractSpecificity(s){
  if(!s)return 0;
  var score=0;
  var nums=s.match(/\d+(\.\d+)?(%|x|k|m|b)?\b/g)||[];
  score+=Math.min(0.4,nums.length*0.15);
  var pw=['exactly','specifically','precisely','every','always','never','first','second','third','within','after','before','since','until','including'];
  var words=getWords(s);
  var pc=0;pw.forEach(function(w){if(words.indexOf(w)>=0)pc++;});
  score+=Math.min(0.3,pc*0.12);
  var ne=s.match(/\b[A-Z][a-z]{2,}\b/g)||[];
  score+=Math.min(0.3,ne.length*0.1);
  return norm(score);
}
function extractNovelty(s,prev){
  if(!s)return 0;
  if(!prev)return 0.7;
  var sw=['the','a','an','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','this','that','it','its','and','or','but','so','in','on','at','to','of','by','with','from','as','not','no'];
  var cw=getWords(s).filter(function(w){return w.length>3&&sw.indexOf(w)<0;});
  var pw=getWords(prev).filter(function(w){return w.length>3&&sw.indexOf(w)<0;});
  if(cw.length===0)return 0.3;
  var ov=0;cw.forEach(function(w){if(pw.indexOf(w)>=0)ov++;});
  return norm(1-(ov/cw.length));
}
function extractClarity(s){
  if(!s)return 0;
  var wds=getWords(s);var wc2=wds.length;
  var ls;
  if(wc2<=8)ls=0.9;else if(wc2<=16)ls=1.0;else if(wc2<=25)ls=0.7;else if(wc2<=35)ls=0.4;else ls=0.1;
  var pp=/\b(is|are|was|were|been|being)\s+(being\s+)?\w+ed\b/i.test(s)?0.2:0;
  var lw=wds.filter(function(w){return w.length>10;}).length;
  return norm(ls-pp-Math.min(0.3,lw*0.08));
}
function extractProgression(s,prev){
  if(!s)return 0;
  if(!prev)return 0.8;
  var pm=['but','however','yet','now','next','then','so','therefore','because','since','which means','that means','here','first','second','third','finally','most importantly','what this means','the reason','the problem','the answer'];
  var lower=s.toLowerCase();
  var hm=pm.some(function(m){return lower.indexOf(m)===0||lower.indexOf('. '+m)>=0;});
  var nov=extractNovelty(s,prev);
  return norm((hm?0.7:0.4)+(nov*0.3));
}
function extractPayoff(s,prevSents){
  if(!s)return 0;
  var lower=s.toLowerCase();
  var pw=["that's why","here's why","the answer","the reason","it turns out","what actually","the truth","this means","so here","which is why","the secret","the key","the result","the fix"];
  var hp=pw.some(function(p){return lower.indexOf(p)>=0;});
  var rc=(prevSents||[]).slice(-3).join(' ').toLowerCase();
  var hs=/\?|why |how |what if |imagine |think about |you.ll |i.ll show/.test(rc);
  if(hp&&hs)return 0.85;
  if(hp)return 0.5;
  if(hs&&/because|since|so|therefore|as a result/.test(lower))return 0.6;
  return 0.1;
}
function extractCredibility(s){
  if(!s)return 0;
  var score=0;var lower=s.toLowerCase();
  if(/\d+/.test(s))score+=0.25;
  var dw=['i built','i created','i made','i tested','i tried','i spent','i ran','i worked','i studied','we built','we tested','we found','results showed','data shows','research shows','studies show','according to','based on'];
  dw.forEach(function(d){if(lower.indexOf(d)>=0)score+=0.2;});
  var ew=['proof','evidence','result','outcome','finding','experiment','test','data','study','report'];
  ew.forEach(function(e){if(lower.indexOf(e)>=0)score+=0.1;});
  return norm(score);
}
function extractDirectness(s){
  if(!s)return 0;
  var lower=s.toLowerCase();
  var total=Math.max(1,getWords(s).length);
  var dw=["you","your","you're","you've","you'll","yourself","we","our","let's","if you","when you","for you","imagine you","think about"];
  var cnt=0;dw.forEach(function(d){if(lower.indexOf(d)>=0)cnt++;});
  return norm(cnt/Math.max(1,total*0.3));
}

// ── Viewer State ──
function initialState(){return{curiosity:0.5,reward:0.3,tension:0.4,trust:0.4,clarity:0.6,fatigue:0.1};}

function updateState(state,f){
  var d=0.15;
  var curiosity=state.curiosity*(1-d)+f.novelty*0.35+f.payoff*(-0.20)+f.directness*0.10+f.progression*0.10;
  var reward=state.reward*(1-d)+f.specificity*0.35+f.payoff*0.40+f.credibility*0.15+f.directness*0.10;
  var tension=state.tension*(1-d)+f.novelty*0.25+f.progression*0.15+f.payoff*(-0.35)+f.credibility*(-0.05);
  var trust=state.trust*(1-d)+f.credibility*0.45+f.specificity*0.25+f.clarity*0.10+f.payoff*0.10;
  var clarityS=state.clarity*(1-d)+f.clarity*0.60+f.specificity*0.10+f.directness*0.10;
  var stim=(f.novelty+f.progression)/2;
  var fatigue=state.fatigue*(1-d)+(1-stim)*0.25+(stim>0.5?-0.15:0);
  return{curiosity:norm(curiosity),reward:norm(reward),tension:norm(tension),trust:norm(trust),clarity:norm(clarityS),fatigue:norm(fatigue)};
}

function deriveAttention(state){
  var raw=(state.curiosity*0.30)+(state.reward*0.25)+(state.tension*0.20)+(state.trust*0.10)+(state.clarity*0.05)-(state.fatigue*0.30);
  return norm(raw);
}

// ── Simulation Loop ──
function simulateScript(paragraphs){
  var all=[];
  paragraphs.forEach(function(p){
    if(!p.text||!p.text.trim())return;
    splitSentences(p.text).forEach(function(s){all.push({text:s,tag:p.tag,paraId:p.id});});
  });
  if(all.length===0)return{sentences:[],attentionCurve:[]};
  var state=initialState();var results=[];var prevSents=[];
  all.forEach(function(item,idx){
    var prev=idx>0?all[idx-1].text:'';
    var f={
      specificity:extractSpecificity(item.text),
      novelty:extractNovelty(item.text,prev),
      clarity:extractClarity(item.text),
      progression:extractProgression(item.text,prev),
      payoff:extractPayoff(item.text,prevSents),
      credibility:extractCredibility(item.text),
      directness:extractDirectness(item.text)
    };
    state=updateState(state,f);
    var att=deriveAttention(state);
    results.push({text:item.text,tag:item.tag,paraId:item.paraId,idx:idx,features:f,state:{curiosity:state.curiosity,reward:state.reward,tension:state.tension,trust:state.trust,clarity:state.clarity,fatigue:state.fatigue},attention:Math.round(att*100)});
    prevSents.push(item.text);if(prevSents.length>5)prevSents.shift();
  });
  return{sentences:results,attentionCurve:results.map(function(r){return r.attention;})};
}

// ── Section Scoring ──
function scoreSectionFromSim(tag,sentences){
  var t=sentences.filter(function(s){return s.tag===tag;});
  if(t.length===0)return 0;
  var score;
  if(tag==='hook'){
    var early=t.slice(0,3).reduce(function(a,s){return a+s.attention;},0)/Math.min(3,t.length);
    var ac=t.reduce(function(a,s){return a+s.state.curiosity;},0)/t.length;
    var at=t.reduce(function(a,s){return a+s.state.tension;},0)/t.length;
    score=(early*0.5)+(ac*100*0.3)+(at*100*0.2);
  }else if(tag==='ctx'){
    var atr=t.reduce(function(a,s){return a+s.state.trust;},0)/t.length;
    var acr=t.reduce(function(a,s){return a+s.features.credibility;},0)/t.length;
    var acl=t.reduce(function(a,s){return a+s.state.clarity;},0)/t.length;
    score=(atr*100*0.45)+(acr*100*0.35)+(acl*100*0.20);
  }else if(tag==='body'){
    var aa=t.reduce(function(a,s){return a+s.attention;},0)/t.length;
    var ar=t.reduce(function(a,s){return a+s.state.reward;},0)/t.length;
    var ap=t.reduce(function(a,s){return a+s.features.progression;},0)/t.length;
    var av=t.map(function(s){return s.attention;});
    var am=aa;
    var av2=av.reduce(function(a,v){return a+Math.pow(v-am,2);},0)/av.length;
    score=(aa*0.40)+(ar*100*0.35)+(ap*100*0.15)+(av2<200?10:-5)+10;
  }else if(tag==='cta'){
    var at2=t.reduce(function(a,s){return a+s.state.trust;},0)/t.length;
    var ad=t.reduce(function(a,s){return a+s.features.directness;},0)/t.length;
    var ac2=t.reduce(function(a,s){return a+s.state.clarity;},0)/t.length;
    score=(at2*100*0.40)+(ad*100*0.40)+(ac2*100*0.20);
  }else if(tag==='out'){
    var ft=t[t.length-1].state.tension;
    var apy=t.reduce(function(a,s){return a+s.features.payoff;},0)/t.length;
    var atr2=t.reduce(function(a,s){return a+s.state.trust;},0)/t.length;
    score=((1-ft)*100*0.40)+(apy*100*0.35)+(atr2*100*0.25);
  }else{
    score=t.reduce(function(a,s){return a+s.attention;},0)/t.length;
  }
  return Math.round(clamp(score,0,100));
}

// ── Pattern Detection ──
function detectPatterns(sentences,sectionScores){
  var patterns=[];
  if(!sentences||sentences.length===0)return patterns;
  var av=sentences.map(function(s){return s.attention;});
  var avg=av.reduce(function(a,v){return a+v;},0)/av.length;
  var fh=av.slice(0,Math.floor(av.length/2));
  var sh=av.slice(Math.floor(av.length/2));
  var fa=fh.reduce(function(a,v){return a+v;},0)/Math.max(1,fh.length);
  var sa=sh.reduce(function(a,v){return a+v;},0)/Math.max(1,sh.length);
  if(fa-sa>18)patterns.push({id:'attention_dropoff',name:'Attention Drop-off',severity:'high',desc:'Viewer engagement consistently declines through the second half.'});
  var hs=sentences.filter(function(s){return s.tag==='hook';});
  var hc=hs.length>0?hs.reduce(function(a,s){return a+s.state.curiosity;},0)/hs.length:0;
  var ar=sentences.reduce(function(a,s){return a+s.state.reward;},0)/sentences.length;
  if(hc>0.65&&ar<0.35)patterns.push({id:'clickbait',name:'Promise Not Delivered',severity:'high',desc:'The hook creates high curiosity but the script does not deliver enough value.'});
  var ac=sentences.reduce(function(a,s){return a+s.state.curiosity;},0)/sentences.length;
  if(ar>0.6&&ac<0.35)patterns.push({id:'info_dump',name:'Information Overload',severity:'medium',desc:'High value content but curiosity stays low. Feels like a lecture.'});
  var cs=sentences.filter(function(s){return s.tag==='ctx';});
  var acr=cs.length>0?cs.reduce(function(a,s){return a+s.features.credibility;},0)/cs.length:0;
  var at=sentences.reduce(function(a,s){return a+s.state.trust;},0)/sentences.length;
  if(at<0.35&&acr<0.25)patterns.push({id:'trust_gap',name:'Authority Gap',severity:'high',desc:'Claims are made without evidence. Trust stays low throughout.'});
  var variance=av.reduce(function(a,v){return a+Math.pow(v-avg,2);},0)/av.length;
  if(variance<80&&sentences.length>6)patterns.push({id:'flatline',name:'Flat Engagement',severity:'medium',desc:'No attention peaks or drops. The script lacks tension and payoff cycles.'});
  var os=sentences.slice(0,Math.min(3,sentences.length));
  var oa=os.reduce(function(a,s){return a+s.attention;},0)/Math.max(1,os.length);
  if(oa<40)patterns.push({id:'weak_opening',name:'Weak Opening',severity:'high',desc:'First three sentences score low. Most viewers decide in the first 30 seconds.'});
  var ls=sentences.slice(-3);
  var lt=ls.reduce(function(a,s){return a+s.state.tension;},0)/Math.max(1,ls.length);
  if(lt>0.55)patterns.push({id:'unresolved_tension',name:'Unresolved Loop',severity:'medium',desc:'Script ends with high tension. A hook question or promise was not closed.'});
  var hd=hs.length>0?hs.reduce(function(a,s){return a+s.features.directness;},0)/hs.length:0;
  var hsp=hs.length>0?hs.reduce(function(a,s){return a+s.features.specificity;},0)/hs.length:0;
  if(hd<0.2&&hsp<0.25&&hs.length>0)patterns.push({id:'creator_diary',name:'Creator-First Opening',severity:'medium',desc:'Hook focuses on the creator rather than establishing a viewer benefit.'});
  return patterns;
}

function getPatternConsequence(id){
  var m={attention_dropoff:'Viewers who make it past the hook are still leaving before the end.',clickbait:'The viewer feels cheated. High expectations are not met.',info_dump:'Without curiosity cycles, the script feels like a lecture and viewers drop off.',trust_gap:'Without evidence, viewers mentally discount every claim.',flatline:'No emotional peaks or valleys. The content becomes forgettable.',weak_opening:'Most viewers leave before the content even starts.',unresolved_tension:'The viewer finishes with an open loop, which feels unsatisfying.',creator_diary:'Viewers come for their own benefit. An opening that does not establish that loses them immediately.'};
  return m[id]||'This pattern reduces overall viewer engagement.';
}

function getPatternFix(id){
  var m={attention_dropoff:'Add a re-hook or new information where attention starts declining.',clickbait:'Ensure the body delivers on the specific promise made in the hook.',info_dump:'Introduce questions before answers. Every insight needs a reason to want it.',trust_gap:'Add one specific, verifiable result or piece of evidence in the context section.',flatline:'Vary sentence length. Short after long creates rhythm. Add a contrast mid-body.',weak_opening:'Rewrite the first sentence to create an unresolved question or viewer benefit.',unresolved_tension:'Return to the hook question in the outro and close it in one sentence.',creator_diary:'Reframe the opening to establish the viewer problem before the creator angle.'};
  return m[id]||'Address this in the relevant section.';
}

// ── Script Type Detection ──
function detectScriptType(paragraphs){
  var allText=paragraphs.map(function(p){return p.text||'';}).join(' ').toLowerCase();
  var types={
    tutorial:['step','how to','you need','you should','make sure','tip','trick','method','guide','learn','tutorial','first','second','third'],
    story:['i was','i had','i remember','i felt','one day','back then','at the time','i decided','i realized','years ago','when i was'],
    opinion:['i think','i believe','in my opinion','the truth is','the problem is','actually','in fact','unpopular opinion','change my mind','most people'],
    listicle:['number one','#1','top ','list','ways to','reasons why','things that','mistakes','tips','secrets','facts','signs'],
    review:['review','worth it','pros','cons','tested','after using','verdict','recommend','compared to','is it good'],
    sport:['match','game','season','player','team','goal','score','win','loss','coach','league','club','champion','tournament','football','basketball','cricket'],
    documentary:['discovered','investigation','revealed','the story of','what really happened','history of','the truth about','nobody knew','mystery','case','evidence']
  };
  var scores={};var best='general';var bestScore=0;
  Object.keys(types).forEach(function(type){
    var hits=types[type].filter(function(w){return allText.indexOf(w)>=0;}).length;
    scores[type]=hits/types[type].length;
    if(scores[type]>bestScore){bestScore=scores[type];best=type;}
  });
  return{type:best,confidence:Math.min(100,Math.round(bestScore*300))};
}

// ── Build Attention Curve (10 buckets) ──
function buildCurve(sentences){
  if(sentences.length===0)return[];
  var bsz=Math.ceil(sentences.length/10);var curve=[];
  for(var b=0;b<10;b++){
    var start=b*bsz;var end=Math.min(start+bsz,sentences.length);
    var bucket=sentences.slice(start,end);
    if(bucket.length===0){curve.push(50);continue;}
    curve.push(Math.round(bucket.reduce(function(a,s){return a+s.attention;},0)/bucket.length));
  }
  return curve;
}

// ── Build Top Issues ──
function buildTopIssues(patterns,sectionScores,sentences){
  var issues=[];
  var tagNames={hook:'Hook',ctx:'Context',body:'Body',cta:'CTA',out:'Outro'};
  patterns.forEach(function(p){
    if(issues.length>=5)return;
    var secMap={attention_dropoff:'Body',clickbait:'Context',trust_gap:'Context',info_dump:'Body',flatline:'Body',weak_opening:'Hook',unresolved_tension:'Outro',creator_diary:'Hook'};
    issues.push({section:secMap[p.id]||'General',impact:p.severity,observation:p.desc,consequence:getPatternConsequence(p.id),fix:getPatternFix(p.id)});
  });
  if(issues.length<3){
    var sorted=Object.keys(sectionScores).sort(function(a,b){return sectionScores[a]-sectionScores[b];});
    sorted.forEach(function(tag){
      if(issues.length>=3)return;
      if((sectionScores[tag]||0)<50){
        issues.push({section:tagNames[tag]||tag,impact:(sectionScores[tag]||0)<30?'high':'medium',observation:'The '+(tagNames[tag]||tag)+' section scores below average.',consequence:'Viewer states are not being adequately engaged at this point in the script.',fix:'Review the '+(tagNames[tag]||tag)+' section in the Deep tab for sentence-level guidance.'});
      }
    });
  }
  return issues.slice(0,5);
}

// ── Main Entry Point ──
function analyseScript(paragraphs){
  if(!paragraphs||paragraphs.length===0){
    return{overall:0,sectionScores:{},curve:[],sentenceData:[],promises:[],promiseDelivered:false,avgSentenceLen:0,sentenceLenVariance:0,rewardDensity:0,failurePatterns:[],issues:[],totalSentences:0,totalWords:0,attentionCurve:[],viewerStateTrajectory:[],openingStrength:0,closingStrength:0,tensionScore:0,voiceRatio:0,paceVariance:0,insightDensity:0,scriptType:'general',scriptTypeConfidence:0,weakestPoints:[],paragraphs:[]};
  }
  var sim=simulateScript(paragraphs);
  var sentences=sim.sentences;
  var tags=['hook','ctx','body','cta','out'];
  var sectionScores={};
  tags.forEach(function(tag){sectionScores[tag]=scoreSectionFromSim(tag,sentences);});
  var weights={hook:0.30,ctx:0.20,body:0.25,cta:0.15,out:0.10};
  var tw=0;var ts=0;
  tags.forEach(function(tag){
    if(paragraphs.some(function(p){return p.tag===tag;})){
      ts+=(sectionScores[tag]||0)*weights[tag];tw+=weights[tag];
    }
  });
  var overall=tw>0?Math.round(ts/tw):0;
  var patterns=detectPatterns(sentences,sectionScores);
  var typeResult=detectScriptType(paragraphs);
  var curve=buildCurve(sentences);
  var issues=buildTopIssues(patterns,sectionScores,sentences);
  var os=sentences.slice(0,Math.min(3,sentences.length));
  var openingStrength=os.length>0?Math.round(os.reduce(function(a,s){return a+s.attention;},0)/os.length):0;
  var cls=sentences.slice(-3);
  var closingStrength=cls.length>0?Math.round(cls.reduce(function(a,s){return a+s.attention;},0)/cls.length):0;
  var tensionScore=sentences.length>0?Math.round(sentences.reduce(function(a,s){return a+s.state.tension;},0)/sentences.length*100):0;
  var voiceRatio=sentences.length>0?Math.round(sentences.reduce(function(a,s){return a+s.features.directness;},0)/sentences.length*100):0;
  var lengths=sentences.map(function(s){return wc(s.text);});
  var lmean=lengths.length>0?lengths.reduce(function(a,v){return a+v;},0)/lengths.length:0;
  var paceVariance=lengths.length>1?Math.round(Math.sqrt(lengths.reduce(function(a,v){return a+Math.pow(v-lmean,2);},0)/lengths.length)*10)/10:0;
  var insights=sentences.filter(function(s){return s.features.novelty>0.6&&s.state.reward>0.5;}).length;
  var insightDensity=sentences.length>0?Math.round((insights/sentences.length)*1000)/10:0;
  var hookSents=sentences.filter(function(s){return s.tag==='hook';});
  var hadPromise=hookSents.some(function(s){return/\?|will show|going to|you.ll|today i.ll|by the end/.test(s.text.toLowerCase());});
  var hadDelivery=sentences.filter(function(s){return s.tag!=='hook';}).some(function(s){return s.features.payoff>0.5;});
  var weakest=sentences.slice().sort(function(a,b){return a.attention-b.attention;}).slice(0,3).map(function(s){return{text:s.text,tag:s.tag,attention:s.attention,idx:s.idx};});
  var totalWords=paragraphs.reduce(function(a,p){return a+wc(p.text||'');},0);
  var totalSentences=sentences.length;
  var avgSentenceLen=totalSentences>0?Math.round(totalWords/totalSentences):0;
  return{
    overall:overall,sectionScores:sectionScores,curve:curve,
    sentenceData:sentences.map(function(s){return{text:s.text,tag:s.tag,attention:s.attention,features:s.features,state:s.state};}),
    promises:hadPromise?['promise detected']:[],promiseDelivered:hadDelivery,
    avgSentenceLen:avgSentenceLen,sentenceLenVariance:paceVariance,rewardDensity:insightDensity,
    failurePatterns:patterns,issues:issues,totalSentences:totalSentences,totalWords:totalWords,
    attentionCurve:sim.attentionCurve,viewerStateTrajectory:sentences.map(function(s){return s.state;}),
    openingStrength:openingStrength,closingStrength:closingStrength,
    tensionScore:tensionScore,voiceRatio:voiceRatio,paceVariance:paceVariance,insightDensity:insightDensity,
    scriptType:typeResult.type,scriptTypeConfidence:typeResult.confidence,
    weakestPoints:weakest,paragraphs:paragraphs
  };
}

// ── Compatibility layer (app.js still calls these) ──
function scoreText(tag,text){
  if(!text||!text.trim())return 0;
  var result=analyseScript([{id:'tmp',tag:tag,text:text}]);
  return result.sectionScores[tag]||0;
}
function scoreLevel(n){return n>=70?'high':n>=45?'mid':'low';}
function scoreVerdict(n){return n>=70?'Strong':n>=45?'Needs Work':'Weak';}
function scorePillHTML(n){var l=scoreLevel(n);return '<span class="score-pill '+l+'"><span class="score-pill-dot"></span>'+n+' &middot; '+scoreVerdict(n)+'</span>';}
function overallScore(paras){if(!paras||!paras.length)return 0;return analyseScript(paras).overall;}
function getParagraphFeedback(tag,text,sc){
  if(!text||!text.trim())return'';
  var l=scoreLevel(sc||0);
  if(l==='high')return'This sentence is working well.';
  if(l==='mid')return'This sentence has room to improve.';
  return'This sentence needs attention -- consider the structure or specificity.';
}
function guessParagraphs(text){
  if(!text||!text.trim())return[];
  var tags=['hook','ctx','body','cta','out'];
  var blocks=text.split(/\n\n+/).filter(function(b){return b.trim().length>10;});
  return blocks.map(function(block,i){
    var tag=tags[Math.min(i,tags.length-1)];
    if(blocks.length>=4&&i>1&&i<blocks.length-2)tag='body';
    if(blocks.length>=4&&i===blocks.length-2)tag='cta';
    if(blocks.length>=3&&i===blocks.length-1)tag='out';
    return{id:'g'+i,tag:tag,text:block.trim(),score:0};
  });
}
function assignTag(text,index,total){
  if(total<=1)return'body';
  var r=index/(total-1);
  if(r<0.15)return'hook';if(r<0.30)return'ctx';if(r<0.75)return'body';if(r<0.90)return'cta';return'out';
}
