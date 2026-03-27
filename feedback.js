// ════════════════════════════════════════════════════════════════════
// SCRIPORA — FEEDBACK LIBRARY v2.0
// ════════════════════════════════════════════════════════════════════
//
// ARCHITECTURE
// Three layers:
//   1. UNIVERSAL ENGINE  — FB.hook / ctx / body / cta / out
//      Applies to every script. 10 variants per component.
//   2. TYPE PROFILES     — FB.types
//      Type-specific overrides: tutorial, story, opinion,
//      listicle, review, documentary, sport
//   3. STATS + PATTERNS  — FB.stats / FB.patterns
//
// ADDING NEW CONTENT
// Universal: FB.hook.newCondition = { level, observation[], consequence[], direction[] }
// Type override: FB.types.tutorial.hook.newCondition = { ...same }
// New type: FB.types.mytype = { label, description, supported, hook, ctx, body, cta, out, patterns }
// ════════════════════════════════════════════════════════════════════

var FB = {};

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL HOOK
// ─────────────────────────────────────────────────────────────────

FB.hook = {
  noTension: {
    level: 'high',
    observation: [
      'This hook makes a statement but does not create a question in the viewer\'s mind.',
      'The opening declares something without leaving anything unresolved.',
      'There is no open loop here — the sentence completes itself before the viewer has a reason to continue.',
      'The hook announces rather than provokes.',
      'The opening tells the viewer something without making them need to know more.',
      'This sentence closes itself. Nothing is left unresolved for the viewer to stay for.',
      'The hook introduces an idea and immediately satisfies it, removing the pull.',
      'A statement without a question gives the viewer permission to stop watching.',
      'The opening is informative but not compelling — it tells rather than hooks.',
      'The first sentence delivers its payload immediately, leaving nothing for the viewer to wait for.'
    ],
    consequence: [
      'Without an unresolved question, the viewer has no psychological pull toward the next sentence.',
      'A statement that completes itself removes the reason to keep watching.',
      'Attention is held by tension, and this opening creates none.',
      'The viewer can process this sentence and feel finished, which is the opposite of what a hook should do.',
      'When the opening resolves itself, the viewer has no unfinished business with the video.',
      'A hook without tension is a title, not an entry point. The viewer has no reason to stay.',
      'The first sentence should create a debt. This one does not.',
      'Viewers who feel complete after the first sentence will not stay for the second.',
      'Without forward momentum in the hook, the context section has to do double work.',
      'The psychological pull that keeps a viewer past the first ten seconds requires an unresolved idea. This hook does not provide one.'
    ],
    direction: [
      'Rewrite the first sentence as a direct question or a bold claim that demands verification.',
      'Introduce an idea that is surprising enough to make the viewer want to know more.',
      'End the hook on something unresolved — a promise, a contradiction, or a provocative half-statement.',
      'Create a gap between what the viewer knows and what the script is about to tell them.',
      'Replace the statement with a question that puts the viewer in the scenario.',
      'Make a claim that the viewer will want to test against their own experience.',
      'Turn the statement into a prediction: "Most people get this completely wrong."',
      'Open with the consequence of not knowing the information, not the information itself.',
      'Ask the viewer to imagine a specific scenario that makes the topic personally relevant.',
      'Lead with the most surprising or counterintuitive thing your script reveals.'
    ]
  },
  creatorFirst: {
    level: 'mid',
    observation: [
      'This hook opens with the creator before it opens with the viewer.',
      'The first word positions you at the centre of the opening, not the person watching.',
      'The hook leads with your experience before it leads with their problem.',
      'You introduce yourself before you introduce a reason to care.',
      'The opening is about the creator\'s journey, not the viewer\'s situation.',
      'The script begins in the creator\'s world before earning the right to take the viewer there.',
      'Opening with "I" or "my" places the creator\'s story ahead of the viewer\'s need.',
      'The first sentence is autobiographical where it should be viewer-facing.',
      'The hook establishes the creator as the subject before the viewer has a reason to care.',
      'Personal narrative in the opening is a tool for the context section, not the hook.'
    ],
    consequence: [
      'A viewer who does not yet trust you has no reason to process your credentials in the first sentence.',
      'When the opening is about you, the viewer has to decide whether to care about you before they decide whether to care about the topic.',
      'Viewers who do not know you will not invest attention in your story until you have given them a reason to.',
      'The psychological pull that keeps a viewer watching comes from their own problem, not from yours.',
      'Creator-first openings require the viewer to extend trust before it has been earned.',
      'Most viewers who see a creator-first hook will decide in the first three seconds whether they care about that creator. Most will not.',
      'An opening that begins with the creator\'s experience delays the moment the viewer sees themselves in the content.',
      'The viewer came for themselves, not for you. A creator-first hook makes them wait for relevance.',
      'When the hook is about the creator, the viewer is a spectator rather than a participant from the first sentence.',
      'Creator-first openings work only for creators the viewer already knows. For everyone else, they are a barrier.'
    ],
    direction: [
      'Rewrite the first sentence so it names something the viewer already feels, fears, or wants.',
      'Replace the opening "I" with "You" or a direct question about the viewer\'s situation.',
      'Lead with the problem before you introduce the person who solved it.',
      'Open with a claim or a question that forces the viewer to measure it against their own experience.',
      'Move the personal story to the context section where it works as a credential.',
      'Start with the viewer\'s situation: "If you have ever tried to..." instead of "I tried to..."',
      'Ask yourself: what does the viewer want from this video? Open with that.',
      'The creator\'s story is powerful context. It is not a hook. Move it down and open with the viewer.',
      'Replace the first sentence entirely with a question the viewer would ask themselves.',
      'Make the viewer the subject of the first sentence. Every word should be about them, not you.'
    ]
  },
  selfResolving: {
    level: 'high',
    observation: [
      'This hook raises a question and then answers it in the same breath.',
      'The tension is created and collapsed within the same sentence.',
      'The opening introduces curiosity and immediately satisfies it.',
      'The hook poses a problem and resolves it before the viewer has time to feel it.',
      'Curiosity is opened and closed in the same moment, leaving nothing for the viewer to stay for.',
      'The first sentence does all the work — it creates the pull and destroys it.',
      'The hook functions as a complete thought where it should be an incomplete one.',
      'The opening creates a gap and immediately fills it, removing the viewer\'s reason to continue.',
      'Both the question and the answer appear in the hook, leaving the body with nothing to deliver.',
      'The resolution comes too early. The viewer receives the payoff before they have invested any attention.'
    ],
    consequence: [
      'Curiosity that is immediately resolved gives the viewer no reason to stay for what comes next.',
      'When the hook answers its own question, the psychological pull disappears at the exact moment it should be strongest.',
      'A viewer who already has the answer will not stay for the explanation.',
      'Resolving the tension in the hook trades the viewer\'s attention for a moment of clarity they did not need yet.',
      'The open loop is the most powerful retention tool in a YouTube script. Closing it in the hook removes it entirely.',
      'Viewers who feel the video has already told them the main thing will leave before the good content begins.',
      'A self-resolving hook converts potential long-term viewers into ten-second viewers.',
      'The body section has nothing to deliver to a viewer who already received the point in the hook.',
      'Early resolution is the structural equivalent of giving away the ending in the trailer.',
      'The viewer\'s commitment to the video is built on unresolved tension. This hook removes that commitment immediately.'
    ],
    direction: [
      'Keep the question open. Let the answer live later in the script.',
      'Split the hook into the problem and move the resolution to the end of the context section.',
      'Create a bigger question from the answer — let the revelation generate more curiosity, not less.',
      'If you must tease the answer, make it incomplete enough that the viewer still needs the full explanation.',
      'Cut everything after the first comma or semicolon and see if the hook is stronger without the resolution.',
      'The hook should end with the viewer leaning forward, not sitting back.',
      'Identify which half of the hook is the question and which is the answer. Delete the answer.',
      'Replace the resolution with a consequence: not the answer, but why not having the answer matters.',
      'Turn the completed thought into a half-thought: "Most creators never figure this out — " and stop there.',
      'The hook is a debt the rest of the script repays. Do not repay it in the first sentence.'
    ]
  },
  hasQuestion: {
    level: 'low',
    observation: [
      'This hook opens with a direct question.',
      'The opening sentence puts a question to the viewer immediately.',
      'The hook frames its opening as a question the viewer is invited to answer.',
      'The first sentence asks something before it tells anything.',
      'A question is front-loaded into the opening, which immediately engages the viewer\'s own thinking.',
      'The hook leads with interrogation rather than declaration, which creates active engagement.',
      'The viewer is asked a question in the first sentence, making them a participant rather than a spectator.',
      'Opening with a question signals that this video is about the viewer\'s situation.',
      'The first sentence activates the viewer\'s cognitive response before they have decided whether to watch.',
      'A question-first hook is one of the most reliable structures for earning the first thirty seconds.'
    ],
    consequence: [
      'A direct question activates the viewer\'s own thinking and creates a mild obligation to stay for the answer.',
      'Questions are harder to ignore than statements because they require a cognitive response.',
      'The viewer automatically begins forming an answer, which means their attention is engaged before they have consciously decided to watch.',
      'Opening with a question signals that this video is about the viewer, not just the creator.',
      'A question in the hook creates cognitive dissonance — the viewer feels incomplete until they have an answer.',
      'Questions place the viewer inside the scenario, which makes the content feel personally relevant from the first word.',
      'The viewer who answers the question in their head is already invested in finding out whether they were right.',
      'Question-first hooks convert passive scrollers into active participants within the first sentence.',
      'A well-formed question makes the viewer feel the video was made specifically for them.',
      'The obligation to answer a question is one of the oldest attention mechanics in communication. It works.'
    ],
    direction: [
      'Make sure the rest of the script delivers an answer that justifies the question.',
      'The question works best when the viewer suspects they might be getting the answer wrong.',
      'Follow the question with a claim that makes the viewer doubt their initial response.',
      'Keep the question specific enough that the viewer can picture themselves in it.',
      'Make sure the answer the viewer assumes is wrong. That gap is where the video\'s value lives.',
      'The more personal the question, the stronger the pull. "Do you know why..." beats "Do people know why..."',
      'After the question, do not give the answer immediately. Build the stakes of not knowing first.',
      'Consider whether the question could be made more specific. Specificity makes the pull stronger.',
      'The question should be easy to understand and hard to answer confidently.',
      'Protect the question by not resolving it in the hook. Let the context section build toward the answer.'
    ]
  },
  strong: {
    level: 'low',
    observation: [
      'This hook creates tension and does not resolve it.',
      'The opening sentence earns attention without giving it away.',
      'The hook leaves something unresolved that the viewer will want answered.',
      'The opening creates a gap between what the viewer knows and what the script is about to deliver.',
      'The first sentence generates forward momentum without spending it.',
      'The hook opens a loop it does not close, which is structurally correct.',
      'Tension is created and held — the viewer has a reason to continue.',
      'The opening is provocative enough to earn the context section.',
      'The hook is doing its job: creating the need to watch, not satisfying it.',
      'This is the kind of opening that makes viewers stop scrolling.'
    ],
    consequence: [
      'The viewer enters the context section already committed to finding the answer.',
      'Attention earned in the first sentence carries forward — the viewer is already invested.',
      'A strong hook means the rest of the script has an easier job of keeping the viewer.',
      'The open loop created here will sustain attention through the early part of the video.',
      'Viewers who are hooked in the first sentence give the context section more patience.',
      'The hook has done the hardest part of the script\'s work. The viewer is already leaning in.',
      'A well-formed hook makes the drop-off in the first thirty seconds significantly lower.',
      'The psychological contract between this hook and the viewer is strong. Do not break it.',
      'This opening creates the kind of viewer commitment that carries through a long body section.',
      'A strong hook is the best possible start. Everything that follows needs to justify it.'
    ],
    direction: [
      'Protect this momentum — the next sentence should increase tension, not relieve it.',
      'Make sure the context delivers on the promise this hook created.',
      'Do not resolve the hook\'s tension too early in the context section.',
      'The strength of this opening sets a standard the rest of the script needs to meet.',
      'Keep the open loop alive through the context section. The answer should arrive in the body.',
      'Consider whether the hook could be even more specific. Specificity makes strong hooks stronger.',
      'Build on this by making the context section\'s promise as specific as the hook\'s tension.',
      'The viewer is ready. Do not make them wait too long for the context section to earn its place.',
      'This hook earns a patient viewer. Use that patience in the context section to build deep credibility.',
      'A strong hook that is not answered is worse than a weak one. Protect the delivery.'
    ]
  },
  tooLong: {
    level: 'mid',
    observation: [
      'This hook is longer than a single clear idea needs to be.',
      'The opening section covers more ground than a hook should.',
      'The hook is doing the work of multiple sections in one block.',
      'There is more information here than a viewer can hold in the first few seconds.',
      'The hook runs past the point of maximum tension into explanation.',
      'A hook that needs multiple sentences to make its point has already lost some viewers.',
      'The opening paragraph is attempting setup, context, and tension simultaneously.',
      'The hook has expanded into the territory of the context section.',
      'This opening is trying to do too much. A hook has one job.',
      'Multiple ideas compete in this hook where only one should exist.'
    ],
    consequence: [
      'A hook that runs long risks losing the viewer before the real tension is established.',
      'Every extra sentence in a hook is a moment where the viewer can decide the video is not for them.',
      'Long openings can feel like the creator is warming up rather than starting.',
      'The viewer\'s attention is at its most fragile in the opening ten seconds.',
      'The longer the hook, the more chances the viewer has to disengage before the tension is established.',
      'Viewers who survive a long hook arrive at the context section with less patience than they started with.',
      'A hook that takes too long to land its single provocative idea has already spent the goodwill it was trying to earn.',
      'Length in a hook signals uncertainty. The creator is not sure which sentence is the real hook.',
      'By the time a long hook makes its point, some viewers have already made their decision to leave.',
      'The most valuable seconds of viewer patience are spent before the tension is clear in a long hook.'
    ],
    direction: [
      'Cut the hook to the single most provocative idea and move everything else to the context section.',
      'Identify the one sentence that creates the most tension and lead with that alone.',
      'Treat the hook as a single sharp cut, not an introduction.',
      'Everything that explains should be in context. Everything that provokes should be in the hook.',
      'Read only the first sentence of the hook. If it creates enough tension alone, cut the rest.',
      'Apply a one-sentence rule to the hook and see what survives.',
      'Find the sharpest idea in the hook and delete everything around it.',
      'The hook is the most compressed part of the script. Each word needs to earn its place.',
      'If the hook needs two sentences, the second must raise the stakes of the first. If it does not, cut it.',
      'Move the explanatory sentences to the context section where they function as setup rather than dilution.'
    ]
  },
  noViewerAddress: {
    level: 'mid',
    observation: [
      'This hook does not address the viewer directly.',
      'The opening sentence speaks about a topic without connecting it to the person watching.',
      'There is no "you" in this hook — the viewer is watching from a distance.',
      'The hook describes a situation without placing the viewer inside it.',
      'The opening treats the viewer as an audience rather than a participant.',
      'The hook is about something happening in the world, not something happening to the viewer.',
      'Third-person framing in the hook keeps the viewer at one remove from the content.',
      'The opening describes without connecting. The viewer sees the topic but does not feel it.',
      'The hook establishes a subject without making the viewer the subject.',
      'There is no personal stake established for the viewer in this opening.'
    ],
    consequence: [
      'A viewer who cannot see themselves in the hook has no personal reason to stay.',
      'Attention is easiest to earn when the viewer feels the opening is specifically about them.',
      'Without a personal connection in the first sentence, the viewer remains a spectator rather than a participant.',
      'Viewers who feel addressed are more likely to feel that the answer is for them.',
      'Third-person hooks create intellectual interest but not personal investment.',
      'The difference between a viewer watching and a viewer engaged is usually whether they feel addressed.',
      'A hook about "people" or "creators" is easier to dismiss than one that says "you".',
      'Viewer address is the fastest way to make a general topic feel personally relevant.',
      'Without "you", the viewer can always decide the content is for someone else.',
      'A hook that does not address the viewer leaves the conversion to chance.'
    ],
    direction: [
      'Add "you" or "your" to the first sentence to place the viewer inside the scenario.',
      'Reframe the hook as something the viewer is experiencing right now.',
      'Ask the viewer a question or make a claim about their situation specifically.',
      'The strongest hooks make the viewer think: this is about me.',
      'Replace "most people" or "many creators" with "you" and see if the hook becomes more powerful.',
      'Make the viewer the subject of the first sentence. Their situation, their problem, their experience.',
      'Convert the third-person observation into a second-person question.',
      'The word "you" is the most attention-holding word in the English language when used early in a hook.',
      'Place the viewer inside the scenario by naming something they have felt or experienced.',
      'Think about what the viewer is hoping this video will do for them and make that the first sentence.'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL CONTEXT
// ─────────────────────────────────────────────────────────────────

FB.ctx = {
  credentialNoPayoff: {
    level: 'mid',
    observation: [
      'There is a credential here but no viewer benefit attached to it.',
      'This section establishes authority without explaining what it means for the person watching.',
      'The experience or qualification is stated but the transfer of value to the viewer is missing.',
      'The context proves something about you without connecting it to something the viewer gains.',
      'Authority is claimed without being connected to the viewer\'s outcome.',
      'The credential stands alone. It answers "who are you?" but not "so what does that mean for me?"',
      'Experience is stated but its relevance to the viewer\'s situation is not made explicit.',
      'The proof of expertise is present but the bridge to the viewer\'s benefit is missing.',
      'A credential without a payoff is a statement about the creator, not a promise to the viewer.',
      'The context section earns trust but does not convert it into a reason to keep watching.'
    ],
    consequence: [
      'Viewers do not care about your credentials — they care about what your credentials mean for them.',
      'Authority without a viewer payoff lands as background information rather than a reason to trust.',
      'The viewer hears your experience and thinks: so what does that mean for me?',
      'A credential that does not answer "so you can" is a missed opportunity to convert trust into attention.',
      'Trust earned in the context section evaporates unless it is immediately converted into a viewer benefit.',
      'Credentials without payoffs make the context section feel like a CV rather than a commitment.',
      'The viewer who processes your credential without seeing its relevance will not give it full weight.',
      'Authority that cannot answer "therefore you will be able to..." is not useful to the viewer.',
      'The context section earns the right to be believed. Without a viewer benefit, that right is spent without being used.',
      'A credential not connected to the viewer\'s outcome is a missed conversion opportunity at the highest-attention moment.'
    ],
    direction: [
      'After your credential, add the words "which means that you..." and complete the sentence.',
      'Connect your experience directly to the outcome the viewer is hoping for.',
      'Turn the credential into a promise: not just what you have done, but what that means you can now show them.',
      'Make the viewer feel that your experience is specifically useful to their situation.',
      'Add one sentence after the credential that names what the viewer will be able to do because of it.',
      'The formula is: credential + bridge + viewer outcome. The bridge is usually "which means" or "so you can".',
      'Ask yourself: why should the viewer care that I have this experience? The answer is your missing sentence.',
      'Replace the credential with a credential plus a promise. The promise is what the viewer came for.',
      'Name the specific viewer benefit: "I have done X, which means I can show you exactly how to Y."',
      'The context section is most powerful when it ends with a sentence that makes the viewer think: this is what I came for.'
    ]
  },
  noCredential: {
    level: 'high',
    observation: [
      'This context section does not establish any reason to trust what follows.',
      'There is no credential, no proof, and no specific experience mentioned here.',
      'The section moves directly into the topic without earning the viewer\'s trust first.',
      'No authority is established in the context — the viewer is asked to keep watching on faith alone.',
      'The context section is missing its primary function: establishing why this creator should be believed.',
      'Trust is required for the body section to land. This context section does not build any.',
      'The viewer has no evidence that what follows is more reliable than a random opinion.',
      'Without a credential of any kind, the body section is asking for trust it has not earned.',
      'The context section exists to answer one question: why should I believe you? This one does not answer it.',
      'No authority signal is present. The body section will have to work significantly harder to be believed.'
    ],
    consequence: [
      'Without a reason to trust the source, viewers treat the information as opinion rather than expertise.',
      'Skipping the credential means the main body has to work harder to be believed.',
      'The viewer\'s willingness to accept your framing drops significantly when you have not earned it.',
      'A script with no authority signal in the context relies entirely on the hook to keep viewers, and hooks fade fast.',
      'Information without authority is just assertion. The viewer can dismiss it without cost.',
      'The absence of a credential shifts the viewer from engaged to skeptical. Skeptical viewers leave faster.',
      'Without authority established in the context, every claim in the body section is unanchored.',
      'Viewers who have no reason to trust the source apply much higher scrutiny to everything that follows.',
      'The body section is the most credibility-demanding part of the script. Starting it without credentials is starting it in debt.',
      'No credential means the viewer must decide on their own whether the creator knows what they are talking about.'
    ],
    direction: [
      'Add one specific, verifiable claim about your experience — a number, a result, or a named outcome.',
      'State something you have done or seen that makes you uniquely positioned to explain this topic.',
      'Even a brief credential — one sentence — is enough to shift the viewer from skeptical to open.',
      'If you have no personal experience, cite a source or a result that grounds the coming information.',
      'The credential does not need to be impressive. It needs to be specific.',
      'Name something you have built, reviewed, studied, or experienced that makes this topic personally real for you.',
      'One sentence of evidence is worth ten sentences of assertion. Add the evidence first.',
      'If you cannot establish personal authority, establish the authority of the information: cite a study, a creator, or data.',
      'A credential is not bragging. It is evidence. The viewer needs evidence before they can give you trust.',
      'Name the specific thing that qualifies you to speak on this. One sentence. Then move to the promise.'
    ]
  },
  promisePresent: {
    level: 'low',
    observation: [
      'This context section makes a specific promise to the viewer.',
      'The section tells the viewer what they will have by the end.',
      'A clear outcome is stated for the viewer before the main content begins.',
      'The context commits to delivering something specific.',
      'A forward commitment to the viewer is present and explicit.',
      'The context names what the viewer will walk away with, which is the correct function of this section.',
      'A promise is made that creates a contract between the creator and the viewer.',
      'The viewer is told what they are working toward, which gives them a reason to keep watching.',
      'This section earns trust and converts it into a direction. Both jobs are done.',
      'The promise is stated clearly enough that the viewer will know when it has been delivered.'
    ],
    consequence: [
      'A promise creates a contract with the viewer — they now have a specific reason to stay until the end.',
      'Viewers who know what they are working toward are more tolerant of the setup required to get there.',
      'The promise sets a standard the main body must meet, which is productive pressure.',
      'Attention during the body section is partially maintained by the unresolved promise made here.',
      'A specific promise gives the viewer something to measure the body section against.',
      'Viewers who have been promised something specific watch with more intention than viewers who have not.',
      'The promise made here creates a thread that runs through the body and needs to be closed in the outro.',
      'A well-stated promise makes the viewer an active watcher rather than a passive one.',
      'The contract created by this promise is the strongest retention tool available after the hook.',
      'Viewers who feel a promise was made and kept are significantly more likely to subscribe.'
    ],
    direction: [
      'Make sure the main body delivers on this promise explicitly — name it when you do.',
      'If the promise is vague, sharpen it so the viewer knows exactly what success looks like.',
      'Callback to this promise in the outro to close the loop cleanly.',
      'Do not introduce a second promise elsewhere in the script without delivering the first one.',
      'Make the delivery of this promise the climax of the body section.',
      'The promise works best when it is specific enough that the viewer could describe it to someone else.',
      'Consider whether the promise could be made more personal: not "you will learn" but "you will be able to".',
      'Protect this promise — every sentence in the body should be moving toward its delivery.',
      'Name the promise again when you deliver it. The explicit callback is what closes the loop.',
      'After the promise, do not delay the body. The viewer is ready and waiting.'
    ]
  },
  vague: {
    level: 'high',
    observation: [
      'This context section is general where it should be specific.',
      'The claims made here lack any concrete evidence or example to anchor them.',
      'The section makes broad statements without supporting detail.',
      'There are no numbers, results, or named examples to give the claims weight.',
      'The credentials claimed here are asserted rather than demonstrated.',
      'General experience is mentioned but no specific example of it is given.',
      'The context is impressionistic rather than evidential.',
      'Claims are made at the level of assertion rather than proof.',
      'The authority signals here are vague enough to apply to almost anyone.',
      'There is nothing in this context that could not be claimed by someone with no relevant experience.'
    ],
    consequence: [
      'Vague context sounds like every other video on the topic — it does not distinguish this creator.',
      'Without specifics, the viewer has no way to measure whether the authority being claimed is real.',
      'General claims are easy to make and therefore easy to dismiss.',
      'The credibility established by a vague context is thin enough to collapse at the first difficult idea in the body.',
      'A viewer who cannot verify the credential will not give it full weight.',
      'Vague authority signals are processed by viewers as marketing language rather than genuine evidence.',
      'The more general the claim, the less trustworthy it sounds. Specificity is the currency of credibility.',
      'Viewers who have heard "I have helped many creators" from many creators will not find it compelling here.',
      'General credentials create general trust. General trust is not enough to carry a viewer through a specific claim.',
      'Vague context sets up the body section to be questioned rather than accepted.'
    ],
    direction: [
      'Replace at least one general claim with a specific number, a named result, or a concrete example.',
      'The more specific the credential, the more credible it sounds — even if the number is modest.',
      'Name a real outcome: not "many creators" but "over 400 scripts from creators with under 10,000 subscribers".',
      'Specificity is not bragging — it is evidence, and evidence is what earns trust.',
      'Find the most specific thing you can say about your experience and lead with that.',
      'Replace any sentence that uses "many", "several", or "lots of" with a sentence that uses a number.',
      'Name one specific result. Not "I helped creators grow" but "I helped one creator go from 200 to 12,000 subscribers in four months."',
      'If you cannot be specific about your own experience, be specific about the information: name the study, the creator, or the data.',
      'One specific detail does more credibility work than five vague claims.',
      'Read the context and ask: could someone with no experience say this? If yes, make it more specific.'
    ]
  },
  noPromise: {
    level: 'mid',
    observation: [
      'The context establishes authority but does not commit to delivering anything specific.',
      'There is no promise here — the viewer does not know what they will have at the end.',
      'The section earns credibility but does not convert it into a direction.',
      'The viewer is given a reason to trust the creator but not a reason to keep watching.',
      'Trust is built but not channeled. The viewer has no specific outcome to wait for.',
      'The context section does only half its job — credibility without promise.',
      'Authority is established but the forward commitment to the viewer is missing.',
      'The viewer leaves the context knowing who you are but not what you are going to give them.',
      'Credibility without direction is a foundation without a building.',
      'The context section earns patience. Without a promise, that patience has nowhere to go.'
    ],
    consequence: [
      'Without a promise, the viewer enters the main body without knowing what they are working toward.',
      'Trust without direction creates passive watching rather than engaged attention.',
      'The main body will have to work harder to maintain attention because there is no unresolved commitment pulling the viewer forward.',
      'Viewers who do not know what they are waiting for are easier to lose to distraction.',
      'Passive viewers can leave at any point because they have no specific reason to stay until a particular moment.',
      'Without a promise, the viewer\'s attention in the body is general rather than directed.',
      'A credibility signal without a forward commitment is like a foundation with no plans for the building.',
      'The viewer who enters the body without a promise has no reason to stay until the end.',
      'Trust built without a destination tends to decay across the body section.',
      'Without a viewer-facing commitment, the body section has to generate its own forward momentum from scratch.'
    ],
    direction: [
      'End the context section with a single clear statement of what the viewer will walk away with.',
      'The promise does not need to be elaborate — one sentence that names the outcome is enough.',
      'Frame the promise around the viewer: not "I will show you" but "by the end of this you will know".',
      'A promise made in the context creates a thread that runs through the body and closes in the outro.',
      'The most effective promise is specific, viewer-facing, and achievable within the length of the video.',
      'Add one sentence that begins "By the end of this..." and name exactly what the viewer will have.',
      'The promise converts trust into commitment. Add it at the end of the context section.',
      'Make the promise as specific as possible. "You will understand X" is weaker than "You will be able to do Y."',
      'The promise is the reason the viewer stays through the body. Make it worth staying for.',
      'If you cannot state a specific viewer outcome, your body section may not have a clear enough purpose.'
    ]
  },
  viewerAddressed: {
    level: 'low',
    observation: [
      'The context section addresses the viewer directly.',
      'This section connects the credential to something the viewer will experience.',
      'The viewer is spoken to as a participant, not an observer.',
      'The context is framed around the viewer\'s situation, not just the creator\'s experience.',
      'Direct address is present in the context, which personalises the credibility being established.',
      'The viewer\'s situation is referenced in the context, which makes the credential feel relevant.',
      'This context speaks to the viewer rather than about the topic.',
      'The credential is connected to the viewer\'s benefit, which is the correct function of context.',
      'The viewer is made central to the context section rather than incidental to it.',
      'This section earns trust and immediately converts it into relevance for the viewer.'
    ],
    consequence: [
      'A viewer who feels addressed is more likely to accept that this video is for them specifically.',
      'Direct address converts general information into personal relevance.',
      'When the context connects to the viewer\'s experience, the promise becomes something they can picture receiving.',
      'Viewer-addressed context builds trust faster because it removes the gap between the creator\'s world and the viewer\'s.',
      'The viewer who feels spoken to in the context section carries that engagement into the body.',
      'Personal address in the context converts authority into relevance. That combination is very hard to dismiss.',
      'A viewer who sees their own situation described in the context will give the body more attention.',
      'Direct address signals that the creator understands the viewer\'s experience.',
      'Viewer-addressed context makes the promise that follows feel personal rather than generic.',
      'The viewer who feels addressed in the context section is already half-sold before the body begins.'
    ],
    direction: [
      'Maintain this throughout the body — do not shift from viewer-focused to creator-focused mid-script.',
      'Make sure the promise attached to this viewer address is kept explicitly in the main body.',
      'The more specifically you can describe the viewer\'s situation, the stronger this connection becomes.',
      'Consider naming a specific type of viewer this applies to — it makes the rest feel more targeted.',
      'Carry this direct address into the CTA — it should feel like the same conversation.',
      'The viewer address established here is an asset. Protect it by keeping the body section viewer-focused.',
      'Build on this by making the body section\'s language as direct and personal as the context.',
      'The viewer who feels addressed in context will notice if the body stops addressing them.',
      'Use this viewer-focused framing to make every claim in the body feel like advice rather than information.',
      'This context has done something most creators do not manage. Protect it by not switching to creator-focus in the body.'
    ]
  },
  tooLong: {
    level: 'mid',
    observation: [
      'The context section is longer than the credibility it is building requires.',
      'This section continues past the point where the viewer\'s trust has been established.',
      'The context covers ground that belongs in the main body.',
      'More is being said here than is needed to earn the right to be believed.',
      'The context section has expanded beyond its function.',
      'Trust is usually established in one or two sentences. This context takes significantly longer.',
      'The section is building more context than the viewer needs before the value begins.',
      'The context runs past the point of established authority into explanation.',
      'A context section that is longer than the hook is almost always doing the body\'s work for it.',
      'The viewer\'s patience for setup is limited. This context section is spending it faster than it is earning it.'
    ],
    consequence: [
      'A long context delays the value the viewer came for and increases the risk of drop-off.',
      'Viewers who came for the answer, not the backstory, may leave during an extended setup.',
      'The context section earns patience — it does not spend it. Running long here spends what has not yet been earned.',
      'Every sentence in the context that is not building trust or making a promise is reducing the viewer\'s tolerance.',
      'An overly long context makes the body feel like it is arriving late.',
      'Viewers who survive a long context arrive at the body with less goodwill than they started with.',
      'A context that runs too long signals the creator is not confident the body will hold attention on its own.',
      'The longer the context, the higher the bar the body has to clear to justify the wait.',
      'Extended context tests the patience of viewers who came for value, not biography.',
      'The viewer still in the context section after thirty seconds has been kept waiting. Most will not wait much longer.'
    ],
    direction: [
      'Trim the context to credential plus promise — one of each is enough.',
      'Move any explanatory content to the main body where the viewer expects it.',
      'Test each sentence in the context: is it building trust or making a promise? If neither, cut it.',
      'The shorter and sharper the context, the faster the viewer arrives at the value they came for.',
      'Apply a two-sentence rule to the context: credential in one, promise in the other.',
      'Everything in the context should earn its place by either establishing authority or committing to a viewer outcome.',
      'Read the context and identify the earliest point at which the viewer would trust you enough to continue. Cut everything after that.',
      'The context section is a bridge, not a room. It should not be longer than the crossing requires.',
      'Move the interesting background material to the body where it functions as evidence rather than setup.',
      'A tight context section makes the body feel like the main event rather than an afterthought.'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL BODY
// ─────────────────────────────────────────────────────────────────

FB.body = {
  noExamples: {
    level: 'mid',
    observation: [
      'The main body makes claims without grounding them in a concrete example.',
      'The ideas here are stated as fact without showing the viewer what they look like in practice.',
      'The section explains a principle without illustrating it.',
      'There are no named scenarios, cases, or demonstrations — just the assertion.',
      'Abstract explanation continues without a concrete anchor.',
      'The body is making its case at the level of principle without ever showing the principle in action.',
      'Claims are stated without the example that would make them believable.',
      'The section tells the viewer what to think without showing them why.',
      'Concepts are presented without the grounding example that would make them stick.',
      'The viewer is asked to accept a principle they have never seen applied.'
    ],
    consequence: [
      'Claims without examples ask the viewer to take your word for it, which requires more trust than most viewers will extend.',
      'Abstract explanations fade from memory. Specific examples survive it.',
      'When a viewer cannot picture what you are describing, their attention drifts to something they can picture.',
      'The insight may be correct, but without an example it feels like an opinion rather than a finding.',
      'Principles without examples are harder to apply. Viewers who cannot apply the content leave feeling they learned something vague.',
      'Without an example, the viewer has no way to test whether they understand the concept correctly.',
      'Abstract content without concrete anchors has a significantly shorter retention half-life.',
      'The viewer who cannot picture the principle cannot use it. Content that cannot be used does not drive subscriptions.',
      'Examples are the evidence that turns claims into knowledge. Without them, claims remain claims.',
      'A body section full of principled statements but no examples will be described as "interesting but not very practical".'
    ],
    direction: [
      'Follow each key claim with a named scenario: "for example" or "this is what it looks like in practice".',
      'Use a creator story, a before-and-after, or a specific result to make the point tangible.',
      'The example does not need to be long — a single sentence that makes the idea concrete is enough.',
      'If you cannot think of an example, that is a signal the idea needs more development before filming.',
      'For every principle you state, ask: what does this look like when someone actually does it?',
      'Name a specific person, channel, result, or moment that proves the principle works.',
      'The example does not need to be yours. A well-chosen third-party example is just as effective.',
      'Before-and-after examples are among the most powerful: this is what happens without the principle, this is what happens with it.',
      'Even a hypothetical example is better than no example: "Imagine a creator who tries this..."',
      'The test for whether an example is good: can the viewer picture it? If yes, use it. If no, find one they can picture.'
    ]
  },
  highInsight: {
    level: 'low',
    observation: [
      'This section delivers new information consistently without repeating itself.',
      'The body introduces a distinct insight in each paragraph.',
      'The value density here is high — each sentence moves the viewer forward.',
      'The section earns its length by rewarding the viewer with new information throughout.',
      'Each paragraph advances the idea rather than restating it.',
      'The body is working at a high level of insight density.',
      'New value is delivered at a consistent rate across this section.',
      'The body does not have flat spots. Each paragraph adds something.',
      'This section rewards patient viewers with consistently new insight.',
      'The rate of idea delivery here is high enough to justify the viewer\'s continued attention.'
    ],
    consequence: [
      'High insight density keeps the viewer engaged because they are always getting something new.',
      'Viewers who are consistently rewarded stay committed to the end.',
      'A body section that keeps delivering raises the perceived value of the whole video.',
      'This kind of pacing creates the feeling that the video is worth finishing.',
      'Consistent delivery of new insights is the most reliable way to hold attention across a long body section.',
      'Viewers who keep receiving new information feel that staying was the right decision.',
      'High insight density reduces the window for distraction because the viewer always has something to process.',
      'A body section that consistently rewards the viewer\'s patience is the foundation of a subscribe-worthy channel.',
      'Viewers who experience high insight density describe the video as "packed" — one of the best things a viewer can say.',
      'The insight rate here means the viewer arrives at the CTA with their trust at its highest point.'
    ],
    direction: [
      'Maintain this through to the end of the body — do not let the pace drop in the final paragraphs.',
      'Make sure each insight connects to the promise made in the context.',
      'Consider whether any of these insights deserves its own example to make it stick.',
      'End the body on the strongest insight so the viewer arrives at the CTA with their trust at its highest.',
      'Protect this rate in future scripts — it is one of the hardest things to sustain.',
      'Check that the insights escalate in significance toward the end of the body.',
      'The final insight before the CTA should be the most valuable one. Make sure it is.',
      'A body at this density level sets a subscriber expectation. Future videos will need to meet it.',
      'Consider whether the body could add one more concrete example without breaking the pace.',
      'This body section is doing what body sections should do. The same discipline applied to the hook and CTA would make the whole script exceptional.'
    ]
  },
  repetitive: {
    level: 'high',
    observation: [
      'The same idea appears more than once in this section without adding new dimension.',
      'This section restates earlier points rather than building on them.',
      'The body is covering ground it has already covered.',
      'Multiple sentences here are making the same observation in different words.',
      'The section is circling a single idea rather than advancing from it.',
      'Ideas that were already established are being restated rather than deepened.',
      'The body returns to points it made earlier without adding new evidence or dimension.',
      'Several paragraphs are making the same structural argument with different surface language.',
      'The section would be tighter and stronger if the repeated content were removed.',
      'The body is padding with restatement where it should be advancing with new insight.'
    ],
    consequence: [
      'Repetition signals to the viewer that the video has run out of new things to say.',
      'Once a viewer recognises repetition, they begin skipping forward or leaving.',
      'Restating an idea without advancing it wastes the attention the context section earned.',
      'The feeling that a video is padding is almost always caused by repetition in the body.',
      'Viewers who notice repetition lose trust in the creator\'s depth of knowledge.',
      'Repetition in the body converts a viewer who was paying attention into one who is skimming.',
      'The viewer who feels they are being told the same thing twice will wonder how much of the video is genuinely new.',
      'Repeated content lowers the perceived value of the entire video in the viewer\'s assessment.',
      'A body section with repetition runs longer than its insight density justifies.',
      'Viewers who leave because of repetition rarely return, because their exit reason was that the content was not worth their time.'
    ],
    direction: [
      'Identify the repeated idea and keep only the version that is most specific and most concrete.',
      'Replace the repeated sentence with something that builds on the first statement rather than echoing it.',
      'If the idea needs to be stated twice, the second version must add a new dimension — an example, a consequence, or a counterpoint.',
      'A body section where every paragraph advances the idea feels shorter and smarter than one that restates.',
      'Read through the body and mark every sentence that makes a point already made elsewhere. Cut or replace each one.',
      'Restatement is usually a sign that the creator is uncertain whether the idea landed the first time. Trust it. Remove the restatement.',
      'If an idea is worth stating twice, the second version should be more specific, more proven, or more personal than the first.',
      'Each paragraph in the body should cover territory the previous one did not. If it does not, cut it.',
      'The test: could the viewer learn anything from this sentence that they could not have learned from the previous one? If no, cut it.',
      'Remove the repeated content and test whether the body feels tighter or looser. It will feel tighter. Keep the cuts.'
    ]
  },
  flatPacing: {
    level: 'mid',
    observation: [
      'The sentences in this section are all roughly the same length.',
      'There is no variation in rhythm here — the pacing is uniform throughout.',
      'The section reads at a consistent pace without any acceleration or pause.',
      'Long sentences follow long sentences without a short one to reset the rhythm.',
      'The sentence length pattern is monotonous — every sentence occupies a similar amount of space.',
      'Pacing variation is absent from this section.',
      'The rhythm does not change between explanatory and emphatic sentences.',
      'Each sentence in this section is the same size as the ones around it.',
      'There is no short sentence in this section to create emphasis or signal a key point.',
      'The body runs at a constant pace where it should accelerate and pause.'
    ],
    consequence: [
      'Uniform sentence length creates a monotonous reading experience that reduces retention.',
      'Pacing variation is what makes a script feel like it has energy — without it, the viewer\'s attention flattens.',
      'The brain responds to contrast. When sentence length never changes, the content feels harder to absorb.',
      'Flat pacing is one of the most common reasons a viewer describes a video as "fine but not engaging".',
      'Without rhythm, all content is weighted equally — which means nothing feels important.',
      'A viewer listening to uniform pacing will find their attention naturally drifting.',
      'Flat pacing is the audio equivalent of a monotone voice. The information is there but the delivery is not.',
      'When sentence length never changes, the viewer cannot tell which sentences carry the key ideas.',
      'Uniform pacing makes complex information harder to process because there are no natural rest points.',
      'The viewer who experiences flat pacing will remember less of the content because nothing anchors the important moments.'
    ],
    direction: [
      'After every two or three long explanatory sentences, add one short sentence that punctuates the point.',
      'Short sentences create emphasis. Use them at the moment of the key insight.',
      'Vary the rhythm deliberately: setup, setup, punchline. The punchline should be the shortest sentence.',
      'Read the section aloud — where you naturally want to pause or accelerate is where the sentence length should change.',
      'Find the most important sentence in each paragraph and shorten it to six words or fewer.',
      'The contrast between a long setup sentence and a short punch sentence is more powerful than either alone.',
      'Try this: rewrite the final sentence of each paragraph to be half the length of the previous one.',
      'Identify the three most important ideas in the body and make each of them a single short sentence.',
      'A section that alternates between long and short sentences will feel more intelligent than the same content in uniform length.',
      'The rhythm of a script is as important as its content. Apply the same care to pacing as you do to the ideas themselves.'
    ]
  },
  goodPacing: {
    level: 'low',
    observation: [
      'The sentence length varies throughout this section.',
      'The rhythm here moves between longer explanatory sentences and shorter emphatic ones.',
      'The pacing creates a natural reading flow with contrast built in.',
      'Short and long sentences alternate in a way that feels deliberate.',
      'Rhythm variation is present and functional in this section.',
      'The body moves between different sentence lengths, which creates emphasis and relief.',
      'The pacing is not uniform — some sentences drive and some pause, which is exactly right.',
      'This section has a rhythm that makes it easy to follow.',
      'The pacing creates natural emphasis at the right moments.',
      'Sentence length variation gives this body section energy that uniform pacing cannot create.'
    ],
    consequence: [
      'Good pacing makes the content easier to absorb because the brain gets natural breaks.',
      'Rhythm variation keeps the viewer\'s attention active rather than passive.',
      'A well-paced body section sounds confident when read aloud — it commands attention rather than asking for it.',
      'Viewers do not notice good pacing consciously, but they feel it as the sense that a video is well-made.',
      'Pacing variation signals to the viewer which sentences are the important ones.',
      'Good pacing makes complex information more digestible because the rhythm guides the viewer\'s processing.',
      'A body section with rhythm variation holds attention through longer content than flat pacing can sustain.',
      'Viewers who experience good pacing often describe the content as "easy to follow" without being able to say why.',
      'Rhythm creates emphasis, and emphasis creates memory. Well-paced content is better retained.',
      'The energy in a well-paced body section carries through to the CTA, which benefits from arriving on momentum.'
    ],
    direction: [
      'Keep this rhythm through to the end of the body — do not let it flatten in the final paragraphs.',
      'Make sure the shortest sentence in the section carries the most important idea.',
      'Consider whether the pacing accelerates toward the end — the body should feel like it is building.',
      'Apply this same rhythm discipline to the CTA, where pacing matters most for conversion.',
      'Check that the rhythm variation is consistent across all paragraphs, not just the first few.',
      'If any paragraph in the body runs without a short sentence, add one to match the rhythm established elsewhere.',
      'The final paragraph of the body should have the sharpest rhythm, since it is leading into the CTA.',
      'This pacing is working. The discipline that created it should be applied to every script.',
      'Consider whether the short sentences in the body are landing on the right ideas.',
      'Good pacing is a significant advantage. Scripts with rhythm hold attention longer at the same content quality.'
    ]
  },
  noMomentum: {
    level: 'high',
    observation: [
      'The main body does not build toward anything — it presents information without escalating.',
      'Each paragraph in this section is self-contained rather than building on what came before.',
      'The section covers its points but does not create a sense of progression.',
      'The body explains without driving — the viewer arrives at the end without feeling pulled forward.',
      'The paragraphs are parallel rather than sequential — each could be in any order.',
      'There is no escalation in the body. The final paragraph is not more important than the first.',
      'The body presents information as a collection rather than building it as an argument.',
      'There is no narrative arc through the body section — it accumulates rather than builds.',
      'The section feels like a list of points rather than a journey through an idea.',
      'The body covers its territory without creating the sense that it is heading somewhere specific.'
    ],
    consequence: [
      'A body section with no forward momentum feels complete at any point, which means the viewer can stop at any point.',
      'When each paragraph could be the last, none of them feels essential.',
      'Without escalation, the viewer experiences the script as a list rather than a journey.',
      'The CTA has no momentum to ride if the body does not build toward it.',
      'A body that does not escalate does not create urgency. Viewers without urgency leave before the end.',
      'The viewer who does not feel the body building toward something has no reason to stay for the arrival.',
      'A body without momentum makes the CTA feel disconnected — it arrives without the buildup it needs.',
      'Viewers who have watched a flat body arrive at the CTA with significantly less goodwill.',
      'Without progression, the viewer has no sense of achievement at reaching the end of the body.',
      'A body that does not build makes the promise from the context feel like it was never really kept.'
    ],
    direction: [
      'Structure the body so each paragraph raises the stakes of the one before it.',
      'End each paragraph with something unresolved that the next paragraph answers.',
      'Build from the simple version of the idea to the complex, or from the common mistake to the correct approach.',
      'The last paragraph of the body should be the most important — the viewer should feel the video is reaching its point.',
      'Add a single connective sentence at the end of each paragraph that signals what the next one will reveal.',
      'Think of the body as a case being built rather than points being listed.',
      'The final paragraph before the CTA should feel like the revelation the hook was leading to.',
      'Reorder the paragraphs so each one depends on the previous. If they can be reordered without losing meaning, the body lacks progression.',
      'The body should feel like it is accelerating. The last thing the viewer hears before the CTA should be the most important.',
      'Add forward momentum by ending each paragraph with a consequence or a question that the next paragraph answers.'
    ]
  },
  passiveVoice: {
    level: 'mid',
    observation: [
      'Several sentences in this section use passive construction.',
      'The language here removes the actor from the action, creating distance.',
      'The passive voice is used where active voice would be more direct.',
      'Things happen in this section without clear ownership of who is doing them.',
      'Passive constructions are creating a clinical distance where directness is needed.',
      'Multiple sentences in this section describe results without naming the actor.',
      'The passive voice is reducing the energy and directness of the body section.',
      'Events are described as happening to people rather than being done by them.',
      'The passive construction is making claims feel less certain and less useful.',
      'The body section would be more direct and more credible if the passive voice were removed.'
    ],
    consequence: [
      'Passive voice makes content feel academic rather than immediate, which works against viewer engagement.',
      'Active voice creates movement. Passive voice describes results without the action that produced them.',
      'Viewers process active sentences faster and retain them longer.',
      'The distance created by passive construction reduces the sense that the creator is speaking directly to the viewer.',
      'Passive voice is associated with formal writing, which creates a gap between the creator and the viewer.',
      'A body section full of passive voice feels like a report rather than a conversation.',
      'Passive constructions reduce the creator\'s apparent authority — they describe outcomes without claiming ownership.',
      'Viewers who encounter passive voice in an educational video feel at a greater remove from the information.',
      'Passive voice reduces urgency, which is the last thing a body section needs.',
      'The more passive the voice, the more the content feels abstract. Abstraction is the enemy of retention.'
    ],
    direction: [
      'Rewrite passive constructions by naming who is doing what: not "mistakes are made" but "most creators make this mistake".',
      'Test each sentence: can you add "by someone" after the verb? If so, it is passive and should be rewritten.',
      'Active voice does not need to be aggressive — it just needs to name the actor.',
      'Even technical content sounds more credible in active voice because it implies the creator knows who is responsible.',
      'Convert each passive sentence: find who did the action and make them the subject.',
      'Read the section aloud and notice where the energy drops. Passive constructions are usually the cause.',
      'The active equivalent of almost every passive sentence is shorter and more direct. Use it.',
      'Passive voice is a habit, not a choice. Review the body looking for "was", "were", "is", and "are" followed by a past participle.',
      'Making a sentence active requires naming the actor. If you do not know who the actor is, that is a content problem.',
      'Every passive sentence in a body section is an opportunity to be more direct, more credible, and more engaging.'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL CTA
// ─────────────────────────────────────────────────────────────────

FB.cta = {
  noAction: {
    level: 'high',
    observation: [
      'The CTA does not name a specific action for the viewer to take.',
      'There is no clear instruction here — the viewer is left to decide what to do next.',
      'The call to action calls for nothing in particular.',
      'This section ends the video\'s momentum without directing it anywhere.',
      'No specific action is named. The viewer has no instruction.',
      'The CTA is present as a section but absent as a directive.',
      'What the viewer is supposed to do after this video is not stated.',
      'The closing section makes an appeal without naming what the appeal is asking for.',
      'The viewer reaches the end of this CTA without knowing what next step to take.',
      'A call to action without an action is a closure without a direction.'
    ],
    consequence: [
      'A viewer who is not told what to do will not do anything — the decision to act requires less friction than the decision to figure out what to do.',
      'All the trust built across the video dissolves at the final moment if there is no specific ask.',
      'Without a named action, the viewer closes the tab having experienced the content but committed to nothing.',
      'The CTA is the only moment in the video where asking directly for something is expected — missing it is a structural failure.',
      'Viewers who reach a CTA with no instruction default to whatever they were going to do anyway, which is usually leave.',
      'A CTA that does not ask for anything is an ending, not a conversion.',
      'The viewer who watched this far is willing to take an action. Without a specific ask, that willingness is wasted.',
      'No action means no conversion. No conversion means the video contributed to awareness but not to growth.',
      'The most engaged viewers in the world will not subscribe if they are not asked to.',
      'Without an action, the viewer has no way to signal that they found the video valuable.'
    ],
    direction: [
      'Name one specific action: subscribe, comment, watch the next video, download the resource.',
      'One clear ask converts better than two vague ones — choose the action that matters most and ask only for that.',
      'Make the action as low-friction as possible: the easier it is to do, the more likely it is to happen.',
      'State the action directly: not "you might want to" but "hit subscribe".',
      'The simplest CTA in the world is still more effective than no CTA: "Subscribe for more."',
      'Ask for the single action that would do the most for the channel at this moment. Name only that.',
      'The action should be so clear that a viewer who was only half-listening could still follow it.',
      'Name the action, then immediately give a reason. The reason converts reluctant viewers.',
      'Choose between subscribe, comment, like, or watch next — pick the one that matters most and ask clearly.',
      'A specific ask respects the viewer\'s time by not making them figure out what you want.'
    ]
  },
  actionNoReason: {
    level: 'mid',
    observation: [
      'The CTA names an action but does not give a reason to take it.',
      'There is an ask here without the justification that makes it worth responding to.',
      'The section tells the viewer what to do but not why they should care.',
      'The action is named but the benefit of taking it is not.',
      'An instruction without a reason is a command. A command without authority tends to be ignored.',
      'The ask is clear but the "why" is missing.',
      'The viewer knows what you want but not what they get from giving it to you.',
      'The CTA makes a request without completing the exchange — action in exchange for what?',
      'The action is named. The viewer benefit is not.',
      'A request without a reason leaves the conversion to chance.'
    ],
    consequence: [
      'An ask without a reason sounds like a transaction with no upside for the viewer.',
      'Viewers who are not given a reason to act treat the CTA as background noise.',
      'The difference between a CTA that converts and one that does not is almost always the presence of a specific reason.',
      'Without a why, the viewer\'s default answer to any ask is no.',
      'An action without a reason is easy to ignore because there is nothing at stake for the viewer.',
      'The viewer who is asked to subscribe without being told why has a perfectly rational reason to decline.',
      'A reason converts a request into a value proposition. Without the reason, there is no proposition.',
      'Asking without giving a reason puts the entire burden of motivation on the viewer.',
      'The viewer who subscribed without a reason is less likely to watch the next video.',
      'A reason-free ask is a weak close on a strong script. It is a missed opportunity at the highest-trust moment.'
    ],
    direction: [
      'After the action, add "because" and complete the sentence from the viewer\'s perspective.',
      'The reason should be specific: not "subscribe for more content" but "subscribe because I post every Tuesday and next week I am covering..."',
      'Frame the reason around what the viewer gets, not what the channel produces.',
      'A future promise — here is what is coming next — is one of the most effective reasons to subscribe.',
      'Complete this sentence: "Subscribe because ___." The blank is your missing reason.',
      'The reason does not need to be elaborate. One specific sentence is enough.',
      'Make the reason forward-facing: what will the viewer get from taking the action in the future?',
      'The most effective reasons are specific, time-bound, and viewer-facing: "because I post every Thursday and next week..."',
      'Tell the viewer what they are signing up for. That is all the reason needs to be.',
      'Add one sentence that answers the viewer\'s unspoken question: "What do I get if I do this?"'
    ]
  },
  strong: {
    level: 'low',
    observation: [
      'This CTA names a specific action and gives the viewer a reason to take it.',
      'The ask is clear and the benefit is stated.',
      'The section directs the viewer and tells them why it matters.',
      'The CTA completes the trust arc of the video with a specific, justified request.',
      'Action and reason are both present, which is the complete CTA structure.',
      'The viewer is told what to do and why it is worth doing it.',
      'The CTA makes a specific ask and backs it with a specific reason.',
      'The closing section converts the trust built across the video into a clear, motivated action.',
      'The CTA is doing both its jobs: naming an action and making it worth taking.',
      'This CTA treats the viewer\'s decision as a genuine one and gives them the information they need.'
    ],
    consequence: [
      'A CTA with a clear action and a reason converts significantly better than one with either alone.',
      'The viewer who reaches a strong CTA is ready to act — this gives them the information they need to do so.',
      'A justified ask respects the viewer\'s time and signals that the creator understands the exchange.',
      'This kind of CTA closes the relationship the hook opened — the viewer who acts feels they made a good decision.',
      'An action plus a reason is a value proposition. Viewers respond to value propositions.',
      'A well-structured CTA makes the viewer feel that taking the action is in their interest, not just the creator\'s.',
      'The viewer who acts on a reason-backed CTA is more likely to watch the next video.',
      'A strong CTA is the final trust signal in a well-structured video.',
      'Conversion rate on this kind of CTA is measurably higher than on a CTA with the action alone.',
      'This CTA closes the video\'s argument cleanly. The viewer was given a reason to come, a reason to stay, and a reason to return.'
    ],
    direction: [
      'Make sure the action is the most valuable one for this particular video.',
      'Consider whether the reason is specific enough to create urgency.',
      'If you are asking for a subscribe, tell them what is coming next — this is the single most effective reason.',
      'Keep this CTA short — it has already done its job, and more words dilute it.',
      'Test the CTA by reading only the action and the reason. If those two elements are clear, the CTA is complete.',
      'Make sure the action named here is the same action reinforced by the video\'s content.',
      'If the reason is forward-facing, make it specific enough to be compelling.',
      'The CTA is the final impression. Protect it by not adding more requests or apologies after it.',
      'Apply the same precision to future CTAs. This structure is the one that converts.',
      'This CTA is a model. The only improvement is to make the reason more specific if it is not already.'
    ]
  },
  tooLong: {
    level: 'mid',
    observation: [
      'The CTA runs longer than a single clear ask requires.',
      'This section makes multiple asks where one would be more effective.',
      'The CTA spreads its request across too many sentences.',
      'Multiple calls to action appear here, competing with each other.',
      'The CTA covers more ground than a closing section should.',
      'Several different asks are made within a single CTA, diluting each one.',
      'The CTA is long enough to feel like a second body section.',
      'The closing section asks for too many things and therefore earns fewer of them.',
      'A CTA that runs for multiple sentences is usually asking for multiple things.',
      'The CTA has expanded beyond its purpose. A single directed close is what is needed.'
    ],
    consequence: [
      'The more options a viewer is given, the less likely they are to choose any of them.',
      'A CTA that runs long signals uncertainty — the creator is not sure which action matters most.',
      'Multiple asks dilute each individual ask and reduce the total conversion rate.',
      'When the viewer is deciding which action to take, they are no longer deciding whether to act.',
      'A long CTA leaves the viewer in decision paralysis rather than action.',
      'Every additional ask after the first reduces the conversion rate of the first.',
      'Viewers who are given multiple instructions tend to follow none of them.',
      'A CTA that does not know what it wants will not convert viewers who do not know what to give.',
      'The longer the CTA, the more likely the viewer is to disengage before the most important ask.',
      'Multiple asks at the end of a video feel needy rather than confident. Neither converts well.'
    ],
    direction: [
      'Choose one action. The most important one. Ask only for that.',
      'If multiple actions are genuinely necessary, lead with the one that matters most.',
      'Every additional ask after the first reduces the conversion rate of the first — fewer is almost always better.',
      'A short CTA that gets one action taken is worth more than a long one that gets none.',
      'Read the CTA and identify the single most valuable action the viewer could take. Remove everything else.',
      'The confidence of a single clear ask converts better than the completeness of multiple vague ones.',
      'If you need to make two asks, lead with subscribe and follow with comment. Never lead with comment.',
      'A CTA should feel like punctuation — definitive, brief, and complete.',
      'Test the CTA by removing every sentence but the one that names the action and the reason.',
      'Compress the CTA into a single clear sentence: action + reason. Nothing else is necessary.'
    ]
  },
  disconnected: {
    level: 'mid',
    observation: [
      'The CTA does not connect to the content that came before it.',
      'The ask appears without any reference to the value the viewer just received.',
      'The transition from the main body to the call to action is abrupt.',
      'The CTA feels added at the end rather than earned by the video.',
      'The closing section makes its ask without connecting it to the video\'s content.',
      'There is no bridge between the body and the CTA.',
      'The ask arrives as if from a different video than the one the viewer just watched.',
      'The CTA is disconnected from the content it is supposed to close.',
      'The viewer is asked to act without a reminder of why this video earned that ask.',
      'The closing section feels generic — it could appear at the end of any video on any topic.'
    ],
    consequence: [
      'A CTA that appears without context feels like an interruption rather than a conclusion.',
      'The viewer who was engaged with the content is pulled out of that engagement by an ask that does not connect.',
      'Trust built in the body drops when the CTA does not feel like a natural result of what was just said.',
      'Disconnected CTAs are the ones viewers describe as "that part at the end where they ask for stuff".',
      'A CTA that is not connected to the content it closes misses the highest-trust moment available.',
      'The viewer who senses a gear-shift into CTA mode is reminded that the video is a product, not a conversation.',
      'A disconnected CTA makes the whole video feel more transactional in retrospect.',
      'When the CTA does not reference what was just delivered, the ask feels unearned.',
      'Viewers are more willing to take action immediately after receiving value than they are after a gear-shift.',
      'A disconnected CTA converts less because it arrives when trust is lowest, not highest.'
    ],
    direction: [
      'Begin the CTA by referencing what the viewer just learned — create a bridge from the content to the ask.',
      'Use the language of the video\'s core idea in the CTA.',
      'Frame the ask as a continuation of the value: "if this helped you, here is what happens when you..."',
      'The CTA earns permission to ask by reminding the viewer what they received — do not skip that step.',
      'Connect the action to the content: "now that you know X, the next step is Y — subscribe so you get it when it comes out."',
      'Reference the video\'s main promise or insight in the CTA before making the ask.',
      'The viewer who just received value is ready to act. The CTA just needs to name the action while that readiness is active.',
      'Make the CTA feel like the natural next step in the viewer\'s journey, not a pivot to marketing.',
      'One sentence that bridges the body to the ask is all that is needed.',
      'The best CTAs feel inevitable: of course you would subscribe, because of course you would want more of what you just received.'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL OUTRO
// ─────────────────────────────────────────────────────────────────

FB.out = {
  abrupt: {
    level: 'high',
    observation: [
      'The outro ends the video without closing the loop opened in the hook.',
      'The script stops rather than ends — there is no sense of completion.',
      'The final section does not return to where the video began.',
      'The outro is present in length but absent in function.',
      'The video ends without a moment of resolution.',
      'The final section does not close the contract opened by the hook.',
      'The script arrives at its end without signaling that it has reached its destination.',
      'The outro does not acknowledge where the video started.',
      'The ending feels unfinished — the video stops when it runs out of content.',
      'There is no closure signal in this outro. The video simply ends.'
    ],
    consequence: [
      'A viewer who reaches an abrupt ending carries a mild sense of incompleteness away from the video.',
      'The hook created an expectation. If the outro does not resolve it, the viewer leaves with a debt the creator owes them.',
      'Endings that feel earned make the whole video feel better in retrospect. Abrupt endings make even good content feel unfinished.',
      'The last thing a viewer experiences is the most memorable — a weak ending overwrites a strong middle.',
      'A viewer who leaves feeling the video was incomplete is less likely to return.',
      'Abrupt endings reduce the shareability of otherwise strong content.',
      'The viewer who does not feel the video ended well will not describe it positively to others.',
      'An incomplete ending reduces the perceived value of the entire video.',
      'The outro is the final opportunity to convert a good viewing experience into a subscription. An abrupt one misses it.',
      'Viewers who feel a video ended abruptly often cannot articulate why they did not subscribe. This is usually the reason.'
    ],
    direction: [
      'Return to the idea, question, or tension from the hook and close it explicitly.',
      'The outro does not need to be long — one sentence that connects back to the opening is enough to create resolution.',
      'Name what the viewer now has that they did not have at the start of the video.',
      'The feeling of completion at the end of a video is what makes it feel worth sharing.',
      'Add one sentence that acknowledges the journey: "Now you know X, which means you can Y."',
      'Close the loop explicitly: reference the hook\'s question or claim and state its resolution.',
      'The simplest effective outro: resolve the hook, name what the viewer has, point forward.',
      'Read the hook and the outro side by side. If the outro does not acknowledge the hook, it is incomplete.',
      'The outro should feel like the last line of a story, not the last entry in a list.',
      'One sentence of resolution makes the difference between a video that felt finished and one that did not.'
    ]
  },
  forward: {
    level: 'low',
    observation: [
      'The outro directs the viewer to what they should do or watch next.',
      'The final section sends the viewer forward rather than simply ending.',
      'The outro creates a next step for the viewer after this video.',
      'The script ends by opening a new door rather than closing the current one.',
      'A forward direction is built into the outro.',
      'The outro is doing its secondary job: sending the viewer to the next step.',
      'The viewer is pointed forward at the end, which converts a single view into a session.',
      'This outro gives the viewer a destination after the video, one of the most effective retention strategies.',
      'The ending creates momentum into the next video rather than leaving the viewer to decide.',
      'The outro is working as a funnel — the video ends but the viewer\'s journey on the channel does not.'
    ],
    consequence: [
      'An outro that sends the viewer forward extends the relationship beyond this single video.',
      'Viewers who are directed to the next step are significantly more likely to take it.',
      'Forward momentum at the end converts casual viewers into returning ones.',
      'A strong outro turns a view into a session — the viewer stays on the channel rather than leaving the platform.',
      'Directing the viewer forward is the most reliable way to convert a subscriber who has not yet subscribed.',
      'Viewers who follow the forward direction are the most valuable: they are watching by recommendation.',
      'A forward outro creates session depth, which is one of the most powerful signals YouTube uses to recommend content.',
      'The viewer who follows the forward direction is significantly more likely to subscribe during or after the next video.',
      'A well-placed forward direction at the end of a strong video is one of the most efficient growth tools available.',
      'Sending the viewer forward respects their investment — they came for value and the outro delivers more by showing where the next value is.'
    ],
    direction: [
      'Make sure the next step you are sending viewers toward is genuinely relevant to what they just watched.',
      'Name the specific video, playlist, or resource — vague next steps are almost never taken.',
      'If you are sending viewers to another video, tease what they will get from it in one sentence.',
      'The outro\'s job is to make staying feel like the obvious choice.',
      'The forward direction is most effective when it feels like the next chapter of the same story.',
      'Name what the viewer will have after watching the next video that they do not have now.',
      'Link the forward direction to the video\'s core topic.',
      'Make the forward direction feel inevitable: of course you would watch the next one.',
      'The specific video title or topic is more compelling than "more videos". Name it.',
      'A well-placed forward direction is worth more than a subscribe ask in many contexts. Use it deliberately.'
    ]
  },
  tooLong: {
    level: 'mid',
    observation: [
      'The outro runs longer than it needs to.',
      'This section continues past the point of resolution.',
      'The ending says more than the closing requires.',
      'The outro keeps adding after the video has already finished its job.',
      'The outro is spending time that should have been spent in the body.',
      'The ending has expanded beyond its function.',
      'The outro continues past the moment when a strong ending could have been made.',
      'Multiple closing statements are made where one would be stronger.',
      'The outro is adding information that belongs in the body section.',
      'The video ends several times before it actually ends.'
    ],
    consequence: [
      'Viewers who have already received the value will not wait for an extended wind-down.',
      'A long outro gives the viewer time to make the decision to leave before the outro has finished.',
      'The outro\'s value is in its finality — length undermines the sense of a clean ending.',
      'Every extra sentence after the resolution is a second opinion the viewer did not ask for.',
      'An outro that runs too long reduces the impact of the resolution it contains.',
      'Viewers who feel the video has ended multiple times before it actually ends become impatient.',
      'The longer the outro, the more likely the viewer is to leave before the CTA or the forward direction.',
      'A long outro can retroactively make the body feel longer than it was.',
      'Viewers who are kept in an outro past the natural endpoint will not remember it positively.',
      'An extended outro signals that the creator does not know when the video is over. Clean endings signal confidence.'
    ],
    direction: [
      'Close the loop in one sentence, send them forward in one sentence, and stop.',
      'The outro should feel like punctuation — definitive and brief.',
      'Anything that needs more than two sentences in the outro probably belongs in the body.',
      'Test the outro by reading only the last sentence — if it could be the end, cut everything before it.',
      'Find the earliest point in the outro where the video could cleanly end. End there.',
      'Apply a two-sentence rule: resolution and direction. Everything else is surplus.',
      'The shorter the outro, the more decisive it feels. Decisive endings are better remembered.',
      'Remove every sentence in the outro that is not either closing the loop or pointing forward.',
      'An outro that ends on its first strong sentence is better than one that ends on its fifth weak one.',
      'Compress the outro to its essential function: the viewer now has X, go watch Y next.'
    ]
  },
  noCallback: {
    level: 'mid',
    observation: [
      'The outro does not reference the opening question or claim from the hook.',
      'The script ends without connecting back to where it started.',
      'The tension opened in the hook is never explicitly closed.',
      'The outro treats the video as a series of sections rather than a single journey.',
      'There is no callback to the hook in the closing section.',
      'The opening loop is left open at the end.',
      'The viewer who remembered the hook arrives at the outro without the explicit resolution they were waiting for.',
      'The script does not complete its own structural arc.',
      'The ending closes the body but not the video\'s opening question.',
      'There is a structural gap between the hook\'s tension and the outro\'s conclusion.'
    ],
    consequence: [
      'A video without a callback feels structurally loose — the beginning and the end do not know about each other.',
      'The viewer who remembered the hook arrives at the outro wondering if the answer was buried somewhere.',
      'Without resolution of the hook\'s tension, the viewer\'s sense of completion is incomplete.',
      'Callback outros signal craft, which makes the whole video feel more considered.',
      'The absence of a callback is felt even by viewers who cannot articulate it.',
      'A script that opens a question and does not explicitly close it leaves the viewer in mild cognitive debt.',
      'The loop opened in the hook creates an obligation in the outro. Not closing it breaks the structural contract.',
      'Viewers who do not receive an explicit resolution to the hook\'s tension rate the video less positively.',
      'Without a callback, the hook\'s investment in creating tension does not pay the return it was designed to.',
      'A video that starts and ends in different places feels less like a video and more like a collection of ideas.'
    ],
    direction: [
      'In the outro, restate the question or claim from the hook and deliver a one-sentence resolution.',
      'The callback does not need to be clever — it just needs to be there.',
      'If the hook asked a question, the outro should answer it in plain terms.',
      'A simple callback structure: name the problem from the hook, name the solution from the body, send them forward.',
      'Read the hook and write one sentence for the outro that references it directly.',
      'The callback is the simplest way to make a video feel complete.',
      'Connect the outro to the hook by repeating one key word or phrase from the opening.',
      'Name the hook\'s tension in the outro and declare it resolved.',
      'The callback is not a summary. It is a single acknowledgment that the journey was intentional.',
      'Ask yourself: if someone read only the hook and the outro, would they feel the video was complete? If not, add the callback.'
    ]
  },
  strong: {
    level: 'low',
    observation: [
      'The outro closes the loop opened in the hook and directs the viewer forward.',
      'This section provides resolution and a next step.',
      'The ending connects back to the beginning and creates a sense of completion.',
      'The outro earns its place by doing both jobs — closing and forwarding.',
      'Resolution and direction are both present in the outro.',
      'The outro closes the structural arc of the video and opens a new one.',
      'The final section acknowledges the journey and sends the viewer on the next one.',
      'The hook\'s tension is resolved and the viewer is pointed to what comes next.',
      'The outro is doing everything a strong outro should: resolution, direction, completion.',
      'This ending makes the whole video feel more considered and more intentional.'
    ],
    consequence: [
      'A viewer who reaches a strong outro leaves the video feeling it was worth their time.',
      'Completion signals satisfaction, and satisfaction is what drives sharing and returning.',
      'The outro is the last data point in the viewer\'s assessment of the creator — a strong one improves everything that came before.',
      'A well-structured ending creates the kind of experience the viewer describes to others.',
      'Viewers who feel a video ended well are significantly more likely to watch the next one.',
      'A strong outro is the final reinforcement of the creator\'s credibility.',
      'The viewer who leaves after a strong outro feels the creator knows what they are doing.',
      'Completion at the end of a video is the trigger for the "this was worth it" assessment.',
      'A strong outro converts the video\'s value into a subscriber-level relationship rather than a single-view one.',
      'The viewer who experiences a strong outro carries a positive impression into the next video.'
    ],
    direction: [
      'Make sure the forward direction is specific enough to be actionable.',
      'If there is a next video to watch, name it — do not just say "check out my other videos".',
      'Consider whether the resolution could be phrased as something the viewer now has.',
      'This outro sets a standard — apply the same structure to every video.',
      'Protect the forward direction by making it specific.',
      'The outro is a model for future videos. The same structure — resolution plus specific forward direction — is the right one.',
      'Make sure the callback to the hook is explicit enough that a viewer who forgot the opening will still recognise it.',
      'Consider whether the outro could be tighter. A strong outro that is one sentence shorter is often stronger still.',
      'Apply this outro structure consistently. Viewers who experience it multiple times develop a positive expectation.',
      'The outro is the final impression. It is strong. Protect it by not adding caveats, apologies, or additional asks after it.'
    ]
  }
};
