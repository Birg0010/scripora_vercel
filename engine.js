// Scripora Paragraph Utilities

// ── Paste-to-script paragraph tagging ──
function guessParagraphs(text){
  if(!text||!text.trim())return[];
  var tags=['hook','ctx','body','cta','out'];
  var blocks=text.split(/\n\n+/).filter(function(b){return b.trim().length>10;});
  return blocks.map(function(block,i){
    var tag=tags[Math.min(i,tags.length-1)];
    if(blocks.length>=4&&i>1&&i<blocks.length-2)tag='body';
    if(blocks.length>=4&&i===blocks.length-2)tag='cta';
    if(blocks.length>=3&&i===blocks.length-1)tag='out';
    return{id:'g'+i,tag:tag,text:block.trim()};
  });
}
