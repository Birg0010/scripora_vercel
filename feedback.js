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



