// ════════════════════════════════════════════════════════════════════
// SCRIPORA — ENGINE.JS
// Intelligence engine: sentence analysis, scoring, pattern detection
// ════════════════════════════════════════════════════════════════════

function splitSentences(text){
  var raw=text.match(/[^.!?]+[.!?]+/g)||[text];
  return raw.map(function(s){return s.trim();}).filter(function(s){return s.length>3;});
}
function getWords(text){return text.toLowerCase().split(/\s+/).filter(function(w){return w.length>0;});}
function wc(text){return text?text.trim().split(/\s+/).filter(function(w){return w.length>0;}).length:0;}
function countNumbers(text){return (text.match(/\b\d[\d,.]*/g)||[]).length;}
function countSpecifics(text){
  return countNumbers(text)+
    (text.match(/[$£€%]/g)||[]).length+
    (text.match(/\b(years?|months?|days?|hours?|minutes?|seconds?|weeks?)\b/gi)||[]).length;
}

// ── Tension signals ──
var CURIOSITY_OPENERS=['what if','imagine','most people','the reason','here is why','did you know','have you ever','you are about to','this is why','stop doing','never do','always do','the truth about','what nobody','i made a mistake','i failed','i lost','i gained','i discovered'];
var TENSION_WORDS=['wrong','mistake','fail','secret','truth','nobody','everyone','surprising','shocking','actually','real reason','never told','hidden','exposed','myth','lied','misunderstood'];
var RESOLUTION_WORDS=['because','so','which means','that is why','this is why','the answer is','the reason is','here is how','the solution'];

function signalCuriosityOpened(sentence){
  var l=sentence.toLowerCase();
  if(l.match(/\?/))return true;
  for(var i=0;i<CURIOSITY_OPENERS.length;i++){if(l.indexOf(CURIOSITY_OPENERS[i])>=0)return true;}
  for(var i=0;i<TENSION_WORDS.length;i++){if(l.indexOf(TENSION_WORDS[i])>=0)return true;}
  return false;
}
function signalCuriosityCollapsed(sentence){
  var l=sentence.toLowerCase();
  // Same sentence opens AND resolves tension
  var opens=signalCuriosityOpened(sentence);
  var resolves=false;
  for(var i=0;i<RESOLUTION_WORDS.length;i++){if(l.indexOf(RESOLUTION_WORDS[i])>=0){resolves=true;break;}}
  return opens&&resolves;
}
function signalTensionLanguage(sentence){
  var l=sentence.toLowerCase();
  for(var i=0;i<TENSION_WORDS.length;i++){if(l.indexOf(TENSION_WORDS[i])>=0)return true;}
  return false;
}

// ── Credibility signals ──
var CREDENTIAL_VERBS=['spent','built','made','tested','tried','studied','tracked','learned','discovered','worked','ran','grew','lost','gained','earned','created','launched','failed','succeeded','interviewed','analyzed','researched'];
var VAGUE_AUTHORITY=['i know','i think','i believe','in my opinion','i feel like','as someone who','i have experience'];

function signalAuthorityProven(sentence){
  var l=sentence.toLowerCase();
  for(var i=0;i<CREDENTIAL_VERBS.length;i++){
    if(l.match(new RegExp('\\bi '+CREDENTIAL_VERBS[i]+'\\b')))return true;
  }
  return countSpecifics(sentence)>=2;
}
function signalAuthorityVague(sentence){
  var l=sentence.toLowerCase();
  for(var i=0;i<VAGUE_AUTHORITY.length;i++){if(l.indexOf(VAGUE_AUTHORITY[i])>=0)return true;}
  return false;
}
function signalViewerBenefit(sentence){
  var l=sentence.toLowerCase();
  return !!(l.match(/\b(you will|you can|you.?ll|by the end|after this|you.?re going to|this will help|you.?ll learn|you.?ll know|you.?ll be able)\b/));
}

// ── Pacing signals ──
function signalShortSentence(sentence){return wc(sentence)<=8;}
function signalLongSentence(sentence){return wc(sentence)>=30;}
function signalPassiveVoice(sentence){
  return !!(sentence.match(/\b(was|were|is|are|been|being)\s+\w+ed\b/i));
}
var FILLER=['basically','literally','you know','sort of','kind of','actually','i guess','as i mentioned','like i said','so yeah'];
function signalFiller(sentence){
  var l=sentence.toLowerCase();
  for(var i=0;i<FILLER.length;i++){if(l.indexOf(FILLER[i])>=0)return true;}
  return false;
}
function signalHighDensity(sentence){
  // Many specifics relative to length
  return countSpecifics(sentence)>=2&&wc(sentence)>=10;
}

// ── Direction signals ──
var PROMISE_PHRASES=['in this video','today i will','i.?m going to show','you will learn','by the end','i.?ll teach','we.?re going to cover','this video will','let me show you'];
var DELIVERY_PHRASES=['so that.?s','as you can see','as i showed','as we covered','which is why i said','going back to','remember when i said','that.?s exactly what','and that.?s how'];
var DRIFT_PHRASES=['actually','by the way','speaking of','on a different note','this reminds me','unrelated but'];

function signalPromiseIntroduced(sentence){
  var l=sentence.toLowerCase();
  for(var i=0;i<PROMISE_PHRASES.length;i++){if(l.match(new RegExp(PROMISE_PHRASES[i])))return true;}
  return false;
}
function signalPromiseDelivered(sentence){
  var l=sentence.toLowerCase();
  for(var i=0;i<DELIVERY_PHRASES.length;i++){if(l.match(new RegExp(DELIVERY_PHRASES[i])))return true;}
  return false;
}
function signalTopicDrift(sentence){
  var l=sentence.toLowerCase();
  for(var i=0;i<DRIFT_PHRASES.length;i++){if(l.indexOf(DRIFT_PHRASES[i])>=0)return true;}
  return false;
}

// ── Reward signals ──
var INSIGHT_PHRASES=['the reason is','what this means','the key insight','what most people miss','here.?s the thing','the difference is','what actually happens','the real issue','what this tells us','the pattern i noticed'];
function signalNewInsight(sentence){
  var l=sentence.toLowerCase();
  for(var i=0;i<INSIGHT_PHRASES.length;i++){if(l.match(new RegExp(INSIGHT_PHRASES[i])))return true;}
  return countSpecifics(sentence)>=2&&signalCuriosityOpened(sentence);
}

// ── Per-sentence signal analysis ──
function analyseSentence(sentence,idx,total){
  var signals={
    curiosityOpened:signalCuriosityOpened(sentence),
    curiosityCollapsed:signalCuriosityCollapsed(sentence),
    tensionLanguage:signalTensionLanguage(sentence),
    authorityProven:signalAuthorityProven(sentence),
    authorityVague:signalAuthorityVague(sentence),
    viewerBenefit:signalViewerBenefit(sentence),
    short:signalShortSentence(sentence),
    long:signalLongSentence(sentence),
    passive:signalPassiveVoice(sentence),
    filler:signalFiller(sentence),
    highDensity:signalHighDensity(sentence),
    promiseIntroduced:signalPromiseIntroduced(sentence),
    promiseDelivered:signalPromiseDelivered(sentence),
    topicDrift:signalTopicDrift(sentence),
    newInsight:signalNewInsight(sentence),
    position:idx/(Math.max(total-1,1)),
    wordCount:wc(sentence)
  };
  // Attention state: 1=high, 0=neutral, -1=risk
  var attention=0;
  if(signals.curiosityOpened&&!signals.curiosityCollapsed)attention+=1;
  if(signals.newInsight)attention+=1;
  if(signals.viewerBenefit)attention+=0.5;
  if(signals.authorityProven)attention+=0.5;
  if(signals.curiosityCollapsed)attention-=1.5;
  if(signals.filler)attention-=0.5;
  if(signals.passive)attention-=0.3;
  if(signals.topicDrift)attention-=0.8;
  signals.attention=Math.max(-2,Math.min(2,attention));
  return signals;
}

// ── Analyse full script ──
function analyseScript(paragraphs){
  var allSentences=[];
  var paraMap=[];
  paragraphs.forEach(function(p,pi){
    var sents=splitSentences(p.text||'');
    sents.forEach(function(s,si){
      allSentences.push(s);
      paraMap.push({paraIdx:pi,tag:p.tag});
    });
  });
  var n=allSentences.length;
  var sentenceData=allSentences.map(function(s,i){
    var sig=analyseSentence(s,i,n);
    sig.sentence=s;
    sig.tag=paraMap[i]?paraMap[i].tag:'body';
    sig.paraIdx=paraMap[i]?paraMap[i].paraIdx:0;
    return sig;
  });

  // Section scores using signals
  var tagGroups={hook:[],ctx:[],body:[],cta:[],out:[]};
  sentenceData.forEach(function(sd){if(tagGroups[sd.tag])tagGroups[sd.tag].push(sd);});

  var sectionScores={};
  Object.keys(tagGroups).forEach(function(tag){
    sectionScores[tag]=calcSectionScore(tag,tagGroups[tag],paragraphs);
  });

  // Overall score weighted by section
  var weights={hook:30,ctx:20,body:25,cta:15,out:10};
  var tw=0,ts=0;
  Object.keys(sectionScores).forEach(function(tag){
    var w=weights[tag]||10;
    tw+=w;ts+=sectionScores[tag]*w;
  });
  var overall=tw>0?Math.round(ts/tw):0;

  // Attention curve (group into 10 buckets)
  var curve=[];
  for(var b=0;b<10;b++){
    var start=Math.floor(b/10*n);
    var end2=Math.floor((b+1)/10*n);
    var bucket=sentenceData.slice(start,end2);
    var avg=bucket.length?bucket.reduce(function(a,sd){return a+sd.attention;},0)/bucket.length:0;
    curve.push(parseFloat(avg.toFixed(2)));
  }

  // Promise tracking
  var promises=[];
  var promiseDelivered=false;
  sentenceData.forEach(function(sd){
    if(sd.promiseIntroduced)promises.push(sd.sentence.substring(0,60));
    if(sd.promiseDelivered)promiseDelivered=true;
  });

  // Pacing data
  var sentLens=sentenceData.map(function(sd){return sd.wordCount;});
  var avgLen=sentLens.length?sentLens.reduce(function(a,b){return a+b;},0)/sentLens.length:0;
  var variance=sentLens.length?Math.sqrt(sentLens.reduce(function(a,b){return a+Math.pow(b-avgLen,2);},0)/sentLens.length):0;

  // Reward density (new insights per 100 words)
  var totalWc=paragraphs.reduce(function(a,p){return a+wc(p.text||'');},0);
  var insightCount=sentenceData.filter(function(sd){return sd.newInsight;}).length;
  var rewardDensity=totalWc>0?Math.round((insightCount/totalWc)*100*10)/10:0;

  // Failure patterns
  var failurePatterns=detectFailurePatterns(sentenceData,sectionScores,promises,promiseDelivered);

  // Top issues
  var issues=buildTopIssues(sectionScores,sentenceData,failurePatterns,promises,promiseDelivered,variance);

  return {
    overall:overall,
    sectionScores:sectionScores,
    curve:curve,
    sentenceData:sentenceData,
    promises:promises,
    promiseDelivered:promiseDelivered,
    avgSentenceLen:Math.round(avgLen),
    sentenceLenVariance:Math.round(variance*10)/10,
    rewardDensity:rewardDensity,
    failurePatterns:failurePatterns,
    issues:issues,
    totalSentences:n,
    totalWords:totalWc
  };
}

function calcSectionScore(tag,sentences,paragraphs){
  if(!sentences||!sentences.length)return 0;
  var score=30;
  var para=paragraphs.find(function(p){return p.tag===tag;});
  var text=para?para.text:'';
  var l=text.toLowerCase();
  if(tag==='hook'){
    if(!l.match(/^i[\s,]/))score+=15;
    var collapses=sentences.filter(function(s){return s.curiosityCollapsed;}).length;
    var opens=sentences.filter(function(s){return s.curiosityOpened;}).length;
    if(opens>0&&collapses===0)score+=25;
    else if(collapses>0)score-=20;
    if(countSpecifics(text)>=1)score+=15;
    if(l.match(/\?/))score+=15;
  }else if(tag==='ctx'){
    var proven=sentences.filter(function(s){return s.authorityProven;}).length;
    var vague=sentences.filter(function(s){return s.authorityVague;}).length;
    score+=proven*15-vague*8;
    var benefits=sentences.filter(function(s){return s.viewerBenefit;}).length;
    score+=benefits*12;
    if(countSpecifics(text)>=2)score+=10;
  }else if(tag==='body'){
    var insights=sentences.filter(function(s){return s.newInsight;}).length;
    score+=Math.min(insights*10,25);
    var passives=sentences.filter(function(s){return s.passive;}).length;
    score-=passives*6;
    var fillers=sentences.filter(function(s){return s.filler;}).length;
    score-=fillers*8;
    if(wc(text)>=50)score+=10;
    var lens=sentences.map(function(s){return s.wordCount;});
    var avg=lens.reduce(function(a,b){return a+b;},0)/(lens.length||1);
    var vari=Math.sqrt(lens.reduce(function(a,b){return a+Math.pow(b-avg,2);},0)/(lens.length||1));
    if(vari>=4)score+=10;
  }else if(tag==='cta'){
    var ctaText=l;
    var hasVerb=!!ctaText.match(/\b(subscribe|follow|comment|like|share|click|watch|join|download|check out|hit the|tap)\b/);
    var hasReason=!!ctaText.match(/\b(because|so that|if you|to get|for more|every week|new video|coming)\b/);
    if(hasVerb)score+=25;
    if(hasReason)score+=25;
    if(hasVerb&&hasReason)score+=10;
  }else if(tag==='out'){
    var hasRes=!!l.match(/\b(so there|that.?s it|to wrap|in summary|now you know|hope this|until next|see you)\b/);
    var hasFwd=!!l.match(/\b(next video|next one|watch next|see you|coming up|linked)\b/);
    var hasCB=!!l.match(/\b(remember|back to|started with|from the beginning|full circle)\b/);
    if(hasRes)score+=20;
    if(hasFwd)score+=20;
    if(hasCB)score+=15;
  }
  return Math.min(Math.max(score,0),100);
}

function detectFailurePatterns(sentenceData,scores,promises,promiseDelivered){
  var patterns=[];
  var hookScore=scores.hook||0,bodyScore=scores.body||0;
  var ctaScore=scores.cta||0,ctxScore=scores.ctx||0,outScore=scores.out||0;

  // Early Payoff Trap
  var firstFive=sentenceData.slice(0,Math.min(5,sentenceData.length));
  if(firstFive.filter(function(s){return s.curiosityCollapsed;}).length>=1){
    patterns.push({id:'early_payoff',name:'Early Payoff Trap',
      desc:'The hook resolves its own tension before the viewer has a reason to stay. Curiosity collapses in the opening sentences.'});
  }

  // Creator Diary
  var hookSents=sentenceData.filter(function(s){return s.tag==='hook';});
  if(hookSents.length>0&&hookSents[0].sentence.trim().toLowerCase().match(/^(i |my |i've |i'm |i was |i have )/)){
    patterns.push({id:'creator_diary',name:'Creator Diary Opening',
      desc:'The script opens with the creator before the viewer has a reason to care. Lead with the viewer problem first.'});
  }

  // Endless Setup
  if(hookScore<45&&ctxScore<45&&bodyScore>=60){
    patterns.push({id:'endless_setup',name:'Endless Setup',
      desc:'Strong content is buried under a weak opening. Viewers may not reach the value because the hook and context do not earn their patience.'});
  }

  // Broken Promise
  if(promises.length>0&&!promiseDelivered){
    patterns.push({id:'broken_promise',name:'Promise Not Delivered',
      desc:'A promise made early in the script has no clear delivery point. Viewers who stayed for the payoff will feel let down.'});
  }

  // Flatline Pacing
  var lens=sentenceData.map(function(s){return s.wordCount;});
  var avg=lens.reduce(function(a,b){return a+b;},0)/(lens.length||1);
  var vari=Math.sqrt(lens.reduce(function(a,b){return a+Math.pow(b-avg,2);},0)/(lens.length||1));
  if(vari<3&&sentenceData.length>=6){
    patterns.push({id:'flatline',name:'Flatline Pacing',
      desc:'Sentence length is uniform throughout. Mix short punchy sentences with longer explanatory ones to create rhythm.'});
  }

  // Authority Without Evidence
  var ctxSents=sentenceData.filter(function(s){return s.tag==='ctx';});
  if(ctxSents.length>=2){
    var vague=ctxSents.filter(function(s){return s.authorityVague;}).length;
    var proven=ctxSents.filter(function(s){return s.authorityProven;}).length;
    if(vague>proven){
      patterns.push({id:'authority_dump',name:'Authority Without Evidence',
        desc:'The context claims experience without specific proof. Add a number, a result, or a named example to make it credible.'});
    }
  }

  // Weak CTA
  if(ctaScore<35&&sentenceData.some(function(s){return s.tag==='cta';})){
    patterns.push({id:'weak_cta',name:'Vague Call to Action',
      desc:'The CTA does not name a specific action or give a reason to take it. All the trust built in the video dissolves here.'});
  }

  // Abrupt Ending
  if(sentenceData.some(function(s){return s.tag==='out';})&&outScore<35){
    patterns.push({id:'abrupt_end',name:'Abrupt Ending',
      desc:'The video stops rather than ends. No resolution, no forward direction. Add one sentence to close the loop and send the viewer somewhere.'});
  }

  return patterns;
}

function buildTopIssues(scores,sentenceData,patterns,promises,promiseDelivered,variance){
  var issues=[];
  var hookSc=scores.hook||0,ctaSc=scores.cta||0,bodySc=scores.body||0;
  var ctxSc=scores.ctx||0,outSc=scores.out||0;

  function pv(arr,s){if(!arr||!arr.length)return '';return arr[Math.abs(s)%arr.length];}
  function sd(tag){var h=0;for(var i=0;i<tag.length;i++){h=((h<<5)-h)+tag.charCodeAt(i);h=h&h;}return Math.abs(h);}

  if(typeof FB==='undefined')return [];

  if(hookSc<55&&hookSc>0){
    var s=sd('hook'+hookSc);
    var e=hookSc<40?FB.hook.noTension:FB.hook.creatorFirst;
    if(e)issues.push({section:'Hook',impact:hookSc<40?'high':'medium',observation:pv(e.observation,s),consequence:pv(e.consequence,s+1),fix:pv(e.direction,s+2)});
  }
  if(ctaSc<55&&ctaSc>0){
    var s=sd('cta'+ctaSc);
    var e=ctaSc<40?FB.cta.noAction:FB.cta.actionNoReason;
    if(e)issues.push({section:'CTA',impact:ctaSc<40?'high':'medium',observation:pv(e.observation,s),consequence:pv(e.consequence,s+1),fix:pv(e.direction,s+2)});
  }
  if(ctxSc<55&&ctxSc>0){
    var s=sd('ctx'+ctxSc);
    var e=ctxSc<40?FB.ctx.noCredential:FB.ctx.credentialNoPayoff;
    if(e)issues.push({section:'Context',impact:ctxSc<40?'high':'medium',observation:pv(e.observation,s),consequence:pv(e.consequence,s+1),fix:pv(e.direction,s+2)});
  }
  if(outSc<50&&outSc>0){
    var s=sd('out'+outSc);
    var e=FB.out.abrupt;
    if(e)issues.push({section:'Outro',impact:outSc<35?'high':'medium',observation:pv(e.observation,s),consequence:pv(e.consequence,s+1),fix:pv(e.direction,s+2)});
  }
  if(bodySc<50&&bodySc>0){
    var s=sd('body'+bodySc);
    var e=bodySc<40?FB.body.noMomentum:FB.body.noExamples;
    if(e)issues.push({section:'Main Body',impact:bodySc<40?'high':'medium',observation:pv(e.observation,s),consequence:pv(e.consequence,s+1),fix:pv(e.direction,s+2)});
  }
  if(promises&&promises.length&&!promiseDelivered){
    var s=sd('promise');
    var obs=['A promise made in the opening has no clear delivery point.','The script commits to something early that is never explicitly fulfilled.','An expectation set for the viewer is not resolved in the body or outro.'];
    var cons=['Viewers who stayed for that payoff will feel let down. This erodes trust beyond this video.','The unresolved promise is the last thing the viewer carries away from an otherwise strong script.','When a promise is not delivered, the viewer questions whether the rest of the content can be trusted.'];
    var fix=['Add one delivery sentence in the body that directly references the original promise.','Name the promise again in the body and show how the content fulfils it.','End the main body with a sentence that explicitly answers the hook commitment.'];
    issues.push({section:'Structure',impact:'high',observation:pv(obs,s),consequence:pv(cons,s+1),fix:pv(fix,s+2)});
  }
  if(variance<3&&sentenceData&&sentenceData.length>=8){
    var s=sd('pace'+Math.round(variance*10));
    var e=FB.body.flatPacing;
    if(e)issues.push({section:'Pacing',impact:'medium',observation:pv(e.observation,s),consequence:pv(e.consequence,s+1),fix:pv(e.direction,s+2)});
  }
  issues.sort(function(a,b){var w={high:0,medium:1,low:2};return (w[a.impact]||1)-(w[b.impact]||1);});
  return issues.slice(0,3);
}

// ── Keep original scoring functions for Write tab pills ──
function scoreText(tag,text){
  if(!text||text.trim().length<5)return 0;
  var sents=splitSentences(text);
  var n=sents.length;
  var sentData=sents.map(function(s,i){return analyseSentence(s,i,n);});
  var p={tag:tag,text:text};
  return calcSectionScore(tag,sentData,[p]);
}
function scoreLevel(n){return n>=70?'high':n>=45?'mid':'low';}
function scoreVerdict(n){return n>=70?'Strong':n>=45?'Needs Work':'Weak';}
function scorePillHTML(n){var l=scoreLevel(n);return '<span class="score-pill '+l+'"><span class="score-pill-dot"></span>'+n+' &middot; '+scoreVerdict(n)+'</span>';}
function overallScore(paras){
  if(!paras||!paras.length)return 0;
  var weights={hook:30,ctx:20,body:25,cta:15,out:10},tw=0,ts=0;
  paras.forEach(function(p,pi){var w=weights[p.tag]||10,sc=scoreText(p.tag,p.text);tw+=w;ts+=sc*w;});
  return tw>0?Math.round(ts/tw):0;
}

// ── Feedback   reads the actual text ──

// ── Text helpers used by getParagraphFeedback ──
function openingWord(text){var m=text.trim().match(/^([A-Za-z']+)/);return m?m[1].toLowerCase():'';}
function hasQuestion(text){return text.indexOf('?')>=0;}
function getFirstSentence(text){var m=text.match(/^[^.!?]+[.!?]/);return m?m[0].trim():text.substring(0,Math.min(text.length,120));}
function getLastSentence(text){var s=text.replace(/([.!?])\s+/g,'$1\x01').split('\x01').map(function(x){return x.trim();}).filter(function(x){return x.length>4;});return s.length?s[s.length-1]:'';}
function hasCredential(text){return !!(text.toLowerCase().match(/\bi (spent|built|made|tested|tried|studied|tracked|learned|discovered|worked|ran|grew|lost|gained|earned|created|launched|failed|succeeded)\b/));}
function hasViewerAddress(text){return (text.match(/\byou\b/gi)||[]).length;}
function hasCTAVerb(text){var l=text.toLowerCase();var verbs=['subscribe','follow','comment','like','share','click','watch','join','download','check out','hit the','tap the','turn on'];for(var i=0;i<verbs.length;i++){if(l.indexOf(verbs[i])>=0)return verbs[i];}return null;}
function hasCTAReason(text){return !!(text.toLowerCase().match(/\b(because|so that|if you want|to get|for more|every week|every (mon|tue|wed|thu|fri)|new video|coming out|dropping)\b/));}
function hasResolution(text){return !!(text.toLowerCase().match(/\b(so there you have it|that.?s it|that.?s all|to wrap|in summary|to sum up|bottom line|the takeaway|now you know|hope that helps|hope this helped|as always|until next time|see you|next video|full circle)\b/));}
function hasCallbackToHook(text){return !!(text.toLowerCase().match(/\b(remember (when|what|how|that)|back to|started with|began with|opened with|at the start|from the beginning|full circle|comes back)\b/));}
function hasForwardMomentum(text){return !!(text.toLowerCase().match(/\b(next video|next one|next week|see you|until next|linked|check out|coming up|dropping|watch this|watch next|up next|related)\b/));}
function structureSignals(text){var l=text.toLowerCase();var s=0;if(l.match(/\b(first|firstly|number one|step one)\b/))s++;if(l.match(/\b(second|secondly|number two|step two)\b/))s++;if(l.match(/\b(third|finally|lastly)\b/))s++;if(l.match(/\b(next|then|after that|moving on)\b/))s++;return s;}
function fillerWords(text){var l=text.toLowerCase();var found=[];var fillers=['basically','literally','you know','sort of','kind of','actually','i guess','as i mentioned','like i said','so yeah','to be honest','at the end of the day'];fillers.forEach(function(f){if(l.indexOf(f)>=0)found.push(f);});return found;}
function sentenceLengthVariance(text){var ss=text.replace(/([.!?])\s+/g,'$1\x01').split('\x01').map(function(s){return s.trim();}).filter(function(s){return s.length>4;});if(ss.length<2)return 0;var lens=ss.map(function(s){return s.split(/\s+/).length;});var avg=lens.reduce(function(a,b){return a+b;},0)/lens.length;var v=lens.reduce(function(a,b){return a+Math.pow(b-avg,2);},0)/lens.length;return Math.sqrt(v);}
function longestSentence(text){var ss=text.replace(/([.!?])\s+/g,'$1\x01').split('\x01').map(function(s){return s.trim();}).filter(function(s){return s.length>4;});if(!ss.length)return {text:'',words:0};var sorted=ss.slice().sort(function(a,b){return b.split(/\s+/).length-a.split(/\s+/).length;});return {text:sorted[0],words:sorted[0].split(/\s+/).length};}
function countPassive(text){return (text.match(/\b(was|were|is|are|been|being)\s+\w+ed\b/gi)||[]).length;}

function selfResolves(text){
  var first=text.trim().match(/^[^.!?]+[.!?]/);
  if(!first)return false;
  var f=first[0].toLowerCase();
  var hasHook=!!(f.match(/\b(why|how|what|secret|truth|mistake|wrong|never|always|if you)\b/));
  var hasAnswer=!!(f.match(/\b(because|so|which means|that is why|this is why|the reason|here is)\b/));
  return hasHook&&hasAnswer;
}
function hasTransition(text){
  var last=text.replace(/([.!?])\s+/g,'$1\x01').split('\x01').pop()||'';
  return !!(last.toLowerCase().match(/\b(let me|let.?s|so today|in this video|here is what|that is exactly|what i found|i.?ll show|i will show|and that means|which brings|so here)\b/));
}
function getParagraphFeedback(tag,text,sc,signals){
  if(!text||text.trim().length<5)return 'No content written for this section yet.';
  // Try the new modular feedback composer first
  if(typeof getComposedFeedback==='function'){
    var composed=getComposedFeedback(tag,text,sc,signals||{});
    if(composed)return composed;
  }
  var l=text.toLowerCase();
  var op=openingWord(text);
  var first=getFirstSentence(text);
  var last=getLastSentence(text);
  var wc=wordCount(text);
  var specs=countSpecifics(text);
  var fillers=fillerWords(text);
  var passive=countPassive(text);
  var ctaVerb=hasCTAVerb(text);

  if(tag==='hook'){
    // Priority order name the most damaging thing first
    if(op==='i'){
      return 'Opening with "I" puts you at the centre before the viewer has a reason to care. The first word should be about them, a problem, or a claim not you.';
    }
    if(selfResolves(text)){
      var hw=first.match(/\b(why|how|what|secret|truth|mistake|wrong)\b/i);
      var hw2=hw?'"'+hw[0]+'"':'the tension';
      return 'The hook raises '+hw2+' and answers it in the same sentence. The viewer has nothing to stay for the loop closed before it opened.';
    }
    if(!hasQuestion(text)&&!text.match(/\b(wrong|mistake|fail|stop|never|always|secret|truth|nobody|everyone|surprising)\b/i)){
      return 'This makes a statement but does not create urgency. A question or a bold claim something the viewer needs to verify gives them a reason to keep watching.';
    }
    if(specs===0&&wc>10){
      return 'The hook is directional but vague. One specific detail a number, a named scenario, a concrete outcome would make staying feel necessary rather than optional.';
    }
    if(!hasTransition(text)&&sc>=70){
      return 'Strong open. The tension is clear and it earns the next section. Make sure the context section references what was just promised.';
    }
    if(sc>=70)return 'This hook creates an open loop and holds it. The viewer has a reason to stay.';
    if(wc<8)return 'This is too brief to create any pull. A hook needs enough words to raise something even one sentence of genuine tension is more than this.';
    return 'The opening makes no specific promise and creates no tension. The viewer has no reason to stay past the first sentence. Start with a problem the viewer is already feeling, or a claim they cannot ignore.';
  }

  if(tag==='ctx'){
    if(!hasCredential(text)&&specs<2){
      return 'This section has not established why your voice on this topic matters. One specific credential time spent, result achieved, thing built earns the viewer\'s attention for the rest of the video.';
    }
    if(hasCredential(text)&&specs===0){
      var credMatch=text.match(/\bi (spent|built|made|tested|tried|studied|tracked|learned|discovered|worked|ran|grew|lost|gained|earned|created|launched)\b/i);
      var credWord=credMatch?credMatch[1]:'did this';
      return 'You mention you '+credWord+' something but leave it vague. Add the specific number, result or timeframe "I '+credWord+' [X amount/time]" lands far harder than the same sentence without it.';
    }
    if(!hasViewerAddress(text)){
      return 'This section is about you, not the viewer. Translate your credential into their outcome not just what you did, but what that means they can skip, learn faster, or avoid.';
    }
    if(fillers.length>0){
      return 'The word "'+fillers[0]+'" is doing nothing here except softening the sentence. Cut it the credential underneath is stronger without the padding.';
    }
    if(sc>=70)return 'Credibility established quickly with specifics, and the viewer\'s payoff is clear. This section does its job.';
    return 'The context is present but not landing with weight. Specificity is what converts a credential into trust.';
  }

  if(tag==='body'){
    var longest=longestSentence(text);
    if(passive>1){
      var passiveMatch=text.match(/\b(was|were|is|are|been|being)\s+\w+ed\b/i);
      var passiveEx=passiveMatch?'"'+passiveMatch[0]+'"':'a passive construction';
      return 'Passive voice appears '+passive+' times including '+passiveEx+'. Rewrite in active voice and the section immediately sounds more authoritative.';
    }
    if(fillers.length>1){
      return 'The words "'+fillers.slice(0,2).join('" and "')+'" appear here. Each one signals uncertainty and drains authority from the sentences around them.';
    }
    if(longest.words>40){
      var preview=longest.text.substring(0,40)+'...';
      return 'One sentence runs to '+longest.words+' words "'+preview+'" by the time a viewer finishes it the point has dissolved. Break it into two.';
    }
    if(specs<2&&wc>60){
      return 'The section has length but lacks specificity. Viewers remember specific things a number, a named tool, a concrete example. Without them this section will not stick.';
    }
    if(structureSignals(text)===0&&wc>100){
      return 'This section is dense without visible structure. Adding one signal "first", "the key thing", "here is the difference" gives viewers a handhold and makes the section feel easier to follow.';
    }
    var variance=sentenceLengthVariance(text);
    if(variance<3&&wc>50){
      return 'Every sentence here is roughly the same length. That creates a flat rhythm that works against engagement. Mix short punchy sentences with longer explanatory ones.';
    }
    if(sc>=70)return 'Specific, structured and addresses the viewer directly. This section delivers on the promise of the hook.';
    return 'The substance is there but it needs more specificity or clearer structure to land with full weight.';
  }

  if(tag==='cta'){
    if(!ctaVerb){
      return 'The video ends with no ask. The viewer has nowhere to go and the momentum built across the whole script evaporates here. Name one specific action, subscribe, comment, or watch next, and give one reason to take it.';
    }
    if(ctaVerb&&!hasCTAReason(text)){
      return '"'+ctaVerb.charAt(0).toUpperCase()+ctaVerb.slice(1)+'" is named but there is no reason to do it. "Subscribe because we post every Tuesday" converts better than "subscribe" alone give them the why.';
    }
    if(wc>60){
      return 'The CTA is too long. By the time the viewer reaches the ask it has lost its directness. Say the action, say the reason, stop.';
    }
    if(!hasViewerAddress(text)){
      return 'The CTA talks about the action rather than directing the viewer to take it. Address them directly "if you want X, do Y" not "it would be great if people subscribed."';
    }
    if(sc>=70)return 'The ask is specific, reasoned and directed at the viewer. This CTA earns its follow-through.';
    return 'The CTA is present but not compelling enough to act on. Specific ask plus a real reason is the formula.';
  }

  if(tag==='out'){
    if(!hasResolution(text)&&!hasCallbackToHook(text)){
      return 'The video stops rather than ends. There is no resolution and no forward direction. Acknowledge what was just covered, close the loop from the hook, and point the viewer to what comes next.';
    }
    if(!hasForwardMomentum(text)){
      return 'The outro resolves the video but does not send the viewer anywhere. Without forward momentum a next video, a linked resource, a reason to stay in your world this is where the session ends.';
    }
    if(hasCallbackToHook(text)&&hasForwardMomentum(text)&&sc>=70){
      return 'The outro closes the loop opened in the hook and moves the viewer forward. This is exactly how an outro should work.';
    }
    if(wc<10){
      return 'The outro is too abrupt. Even one sentence of resolution acknowledging what was covered and where to go next is enough to make the ending feel complete.';
    }
    if(sc>=70)return 'Clean resolution. The video feels complete and the viewer has somewhere to go next.';
    return 'The outro needs either a callback to the opening or a clear direction forward ideally both.';
  }
  return '';
}

// ── Smart paragraph splitting ──
function splitBySentenceSignals(text){
  // Split a single block into sections by recognising sentence-level boundaries
  var sentences=text.match(/[^.!?]+[.!?]+/g)||[text];
  if(sentences.length<=2)return [text];
  var sections=[],current='';
  var CTX_SIGNALS=/\b(let me|today i|in this video|what i found|i('ve| have) (spent|built|tested|studied)|i('m going| will) show)/i;
  var CTA_SIGNALS=/\b(subscribe|follow|comment|hit the|tap the|if you (want|enjoyed)|smash that)/i;
  var OUTRO_SIGNALS=/\b(so there you have it|that('s| is) it|to wrap|in summary|until next|see you|hope (this|that) helped)/i;
  sentences.forEach(function(s,i){
    current+=s;
    var atEnd=i===sentences.length-1;
    // Break before context signals (when we already have content)
    if(!atEnd&&current.trim().length>30){
      var next=sentences[i+1]||'';
      if(CTX_SIGNALS.test(next)||CTA_SIGNALS.test(next)||OUTRO_SIGNALS.test(next)){
        sections.push(current.trim());
        current='';
      }
    }
  });
  if(current.trim())sections.push(current.trim());
  return sections.length>1?sections:[text];
}
function guessParagraphs(text){
  // Split on blank lines first   respects natural writing structure
  var blocks=text.split(/\n\s*\n/).map(function(b){return b.trim();}).filter(function(b){return b.length>0;});
  // Fall back to single newlines
  if(blocks.length===1){
    var single=text.split(/\n/).map(function(b){return b.trim();}).filter(function(b){return b.length>0;});
    if(single.length>1)blocks=single;
  }
  // If still one block, try to split by sentence-level section signals
  if(blocks.length===1&&wordCount(blocks[0])>60){
    blocks=splitBySentenceSignals(blocks[0]);
  }
  if(!blocks.length)blocks=[text.trim()];
  var n=blocks.length;

  return blocks.map(function(b,i){
    var tag=assignTag(b,i,n,blocks);
    return {id:uid(),tag:tag,text:b,score:scoreText(tag,b)};
  });
}

function assignTag(block,idx,total,allBlocks){
  var l=block.toLowerCase();
  var wc=wordCount(block);

  // Outro signals are reliable regardless of position
  if(hasResolution(block)){return 'out';}
  if(hasForwardMomentum(block)&&idx===total-1){return 'out';}

  // Hook: first block, under 80 words, no credential
  if(idx===0&&wc<80&&!hasCredential(block)){return 'hook';}

  // Context: credential verb with specificity, in first third of script
  if(hasCredential(block)&&countSpecifics(block)>=1&&idx<=Math.ceil(total/3)){return 'ctx';}

  // CTA: requires strong evidence to avoid false positives
  // Must have action verb AND a reason AND appear in the second half AND be short
  var ctaVerb=hasCTAVerb(block);
  if(ctaVerb&&hasCTAReason(block)&&idx>=Math.floor(total*0.5)&&wc<80){return 'cta';}
  // Very obvious CTA: short, late, viewer-addressed, has action verb
  if(ctaVerb&&wc<40&&idx>=Math.floor(total*0.7)&&hasViewerAddress(block)){return 'cta';}

  // Position fallback
  if(total===1)return 'body';
  if(total===2)return idx===0?'hook':'out';
  if(total===3){var map=['hook','body','out'];return map[idx]||'body';}
  if(total===4){var map4=['hook','ctx','body','out'];return map4[idx]||'body';}
  if(idx===0)return 'hook';
  if(idx===1)return 'ctx';
  if(idx===total-1)return 'out';
  if(idx===total-2)return 'cta';
  return 'body';
}



