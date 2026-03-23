// ════════════════════════════════════════════════════════════════════
// SCRIPORA — FEEDBACK COMPOSER v1.0
// ════════════════════════════════════════════════════════════════════
//
// ARCHITECTURE
// ─────────────────────────────────────────────────────────────────
// Each feedback entry has three components:
//   observation  — what the engine detected in the text
//   consequence  — what that means for the viewer's attention
//   direction    — what to do about it
//
// Each component has multiple VARIANTS so the same signal never
// produces the same sentence twice. The composer picks a variant
// based on a hash of the paragraph text, ensuring consistency
// within a session but variation across different scripts.
//
// ADDING NEW ENTRIES
// ─────────────────────────────────────────────────────────────────
// 1. Pick the correct section object: FB.hook, FB.ctx, FB.body,
//    FB.cta, or FB.out
// 2. Add a new key describing the condition (e.g. 'noQuestion')
// 3. Provide: observation[], consequence[], direction[]
//    — minimum 4 variants per array for good variation
//    — keep each variant to 1 sentence max
//    — write from the viewer's perspective, not the creator's
// 4. Register the condition in the getConditions() function at
//    the bottom of this file so the composer knows when to use it
//
// INTENSITY LEVELS
// ─────────────────────────────────────────────────────────────────
// Each entry can have a 'level' property: 'high', 'mid', or 'low'
// High = score below 40, Mid = 40-65, Low = above 65
// The composer selects entries appropriate to the score level
//
// ════════════════════════════════════════════════════════════════════

var FB = {};

// ─────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────
FB.hook = {

  // Hook opens with creator rather than viewer
  creatorFirst: {
    level: 'low',
    observation: [
      "This hook opens with the creator before it opens with the viewer.",
      "The first word positions you at the centre of the opening, not the person watching.",
      "The hook leads with your experience before it leads with their problem.",
      "You introduce yourself before you introduce a reason to care."
    ],
    consequence: [
      "A viewer who does not yet trust you has no reason to process your credentials in the first sentence.",
      "When the opening is about you, the viewer has to decide whether to care about you before they decide whether to care about the topic.",
      "Viewers who do not know you will not invest attention in your story until you have given them a reason to.",
      "The psychological pull that keeps a viewer watching comes from their own problem, not from yours."
    ],
    direction: [
      "Rewrite the first sentence so it names something the viewer already feels, fears, or wants.",
      "Replace the opening 'I' with 'You' or a direct question about the viewer's situation.",
      "Lead with the problem before you introduce the person who solved it.",
      "Open with a claim or a question that forces the viewer to measure it against their own experience."
    ]
  },

  // Hook makes a statement with no open loop
  noTension: {
    level: 'high',
    observation: [
      "This hook makes a statement but does not create a question in the viewer's mind.",
      "The opening declares something without leaving anything unresolved.",
      "There is no open loop here — the sentence completes itself before the viewer has a reason to continue.",
      "The hook announces rather than provokes."
    ],
    consequence: [
      "Without an unresolved question, the viewer has no psychological pull toward the next sentence.",
      "A statement that completes itself removes the reason to keep watching.",
      "Attention is held by tension, and this opening creates none.",
      "The viewer can process this sentence and feel finished, which is the opposite of what a hook should do."
    ],
    direction: [
      "Rewrite the first sentence as a direct question or a bold claim that demands verification.",
      "Introduce an idea that is surprising enough to make the viewer want to know more.",
      "End the hook on something unresolved — a promise, a contradiction, or a provocative half-statement.",
      "Create a gap between what the viewer knows and what the script is about to tell them."
    ]
  },

  // Hook resolves its own tension
  selfResolving: {
    level: 'high',
    observation: [
      "This hook raises a question and then answers it in the same breath.",
      "The tension is created and collapsed within the same sentence.",
      "The opening introduces curiosity and immediately satisfies it.",
      "The hook poses a problem and resolves it before the viewer has time to feel it."
    ],
    consequence: [
      "Curiosity that is immediately resolved gives the viewer no reason to stay for what comes next.",
      "When the hook answers its own question, the psychological pull disappears at the exact moment it should be strongest.",
      "A viewer who already has the answer will not stay for the explanation.",
      "Resolving the tension in the hook trades the viewer's attention for a moment of clarity they did not need yet."
    ],
    direction: [
      "Keep the question open. Let the answer live later in the script.",
      "Split the hook into the problem and move the resolution to the end of the context section.",
      "Create a bigger question from the answer — let the revelation generate more curiosity, not less.",
      "If you must tease the answer, make it incomplete enough that the viewer still needs the full explanation."
    ]
  },

  // Hook is a question — strong signal
  hasQuestion: {
    level: 'low',
    observation: [
      "This hook opens with a direct question.",
      "The opening sentence puts a question to the viewer immediately.",
      "The hook frames its opening as a question the viewer is invited to answer.",
      "The first sentence asks something before it tells anything."
    ],
    consequence: [
      "A direct question activates the viewer's own thinking and creates a mild obligation to stay for the answer.",
      "Questions are harder to ignore than statements because they require a cognitive response.",
      "The viewer automatically begins forming an answer, which means their attention is engaged before they have consciously decided to watch.",
      "Opening with a question signals that this video is about the viewer, not just the creator."
    ],
    direction: [
      "Make sure the rest of the script delivers an answer that justifies the question.",
      "The question works best when the viewer suspects they might be getting the answer wrong.",
      "Follow the question with a claim that makes the viewer doubt their initial response.",
      "Keep the question specific enough that the viewer can picture themselves in it."
    ]
  },

  // Hook is strong overall
  strong: {
    level: 'low',
    observation: [
      "This hook creates tension and does not resolve it.",
      "The opening sentence earns attention without giving it away.",
      "The hook leaves something unresolved that the viewer will want answered.",
      "The opening creates a gap between what the viewer knows and what the script is about to deliver."
    ],
    consequence: [
      "The viewer enters the context section already committed to finding the answer.",
      "Attention earned in the first sentence carries forward — the viewer is already invested.",
      "A strong hook means the rest of the script has an easier job of keeping the viewer.",
      "The open loop created here will sustain attention through the early part of the video."
    ],
    direction: [
      "Protect this momentum — the next sentence should increase tension, not relieve it.",
      "Make sure the context delivers on the promise this hook created.",
      "Do not resolve the hook's tension too early in the context section.",
      "The strength of this opening sets a standard the rest of the script needs to meet."
    ]
  },

  // Hook is too long
  tooLong: {
    level: 'mid',
    observation: [
      "This hook is longer than a single clear idea needs to be.",
      "The opening section covers more ground than a hook should.",
      "The hook is doing the work of multiple sections in one block.",
      "There is more information here than a viewer can hold in the first few seconds."
    ],
    consequence: [
      "A hook that runs long risks losing the viewer before the real tension is established.",
      "Every extra sentence in a hook is a moment where the viewer can decide the video is not for them.",
      "Long openings can feel like the creator is warming up rather than starting.",
      "The viewer's attention is at its most fragile in the opening ten seconds — density here costs more than it does later."
    ],
    direction: [
      "Cut the hook to the single most provocative idea and move everything else to the context section.",
      "Identify the one sentence that creates the most tension and lead with that alone.",
      "Treat the hook as a single sharp cut, not an introduction.",
      "Everything that explains should be in context. Everything that provokes should be in the hook."
    ]
  },

  // Hook has no viewer address
  noViewerAddress: {
    level: 'mid',
    observation: [
      "This hook does not address the viewer directly.",
      "The opening sentence speaks about a topic without connecting it to the person watching.",
      "There is no 'you' in this hook — the viewer is watching from a distance.",
      "The hook describes a situation without placing the viewer inside it."
    ],
    consequence: [
      "A viewer who cannot see themselves in the hook has no personal reason to stay.",
      "Attention is easiest to earn when the viewer feels the opening is specifically about them.",
      "Without a personal connection in the first sentence, the viewer remains a spectator rather than a participant.",
      "Viewers who feel addressed are more likely to feel that the answer is for them."
    ],
    direction: [
      "Add 'you' or 'your' to the first sentence to place the viewer inside the scenario.",
      "Reframe the hook as something the viewer is experiencing right now, not something that exists in the world.",
      "Ask the viewer a question or make a claim about their situation specifically.",
      "The strongest hooks make the viewer think: this is about me."
    ]
  }
};

// ─────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────
FB.ctx = {

  // Context has a credential but no viewer benefit
  credentialNoPayoff: {
    level: 'mid',
    observation: [
      "There is a credential here but no viewer benefit attached to it.",
      "This section establishes authority without explaining what it means for the person watching.",
      "The experience or qualification is stated but the transfer of value to the viewer is missing.",
      "The context proves something about you without connecting it to something the viewer gains."
    ],
    consequence: [
      "Viewers do not care about your credentials — they care about what your credentials mean for them.",
      "Authority without a viewer payoff lands as background information rather than a reason to trust.",
      "The viewer hears your experience and thinks: so what does that mean for me?",
      "A credential that does not answer 'so you can' is a missed opportunity to convert trust into attention."
    ],
    direction: [
      "After your credential, add the words 'which means that you...' and complete the sentence.",
      "Connect your experience directly to the outcome the viewer is hoping for.",
      "Turn the credential into a promise: not just what you have done, but what that means you can now show them.",
      "Make the viewer feel that your experience is specifically useful to their situation."
    ]
  },

  // Context has no credential at all
  noCredential: {
    level: 'high',
    observation: [
      "This context section does not establish any reason to trust what follows.",
      "There is no credential, no proof, and no specific experience mentioned here.",
      "The section moves directly into the topic without earning the viewer's trust first.",
      "No authority is established in the context — the viewer is asked to keep watching on faith alone."
    ],
    consequence: [
      "Without a reason to trust the source, viewers treat the information as opinion rather than expertise.",
      "Skipping the credential means the main body has to work harder to be believed.",
      "The viewer's willingness to accept your framing drops significantly when you have not earned it.",
      "A script with no authority signal in the context relies entirely on the hook to keep viewers, and hooks fade fast."
    ],
    direction: [
      "Add one specific, verifiable claim about your experience — a number, a result, or a named outcome.",
      "State something you have done or seen that makes you uniquely positioned to explain this topic.",
      "Even a brief credential — one sentence — is enough to shift the viewer from skeptical to open.",
      "If you have no personal experience, cite a source or a result that grounds the coming information."
    ]
  },

  // Context makes a promise
  promisePresent: {
    level: 'low',
    observation: [
      "This context section makes a specific promise to the viewer.",
      "The section tells the viewer what they will have by the end.",
      "A clear outcome is stated for the viewer before the main content begins.",
      "The context commits to delivering something specific."
    ],
    consequence: [
      "A promise creates a contract with the viewer — they now have a specific reason to stay until the end.",
      "Viewers who know what they are working toward are more tolerant of the setup required to get there.",
      "The promise sets a standard the main body must meet, which is productive pressure.",
      "Attention during the body section is partially maintained by the unresolved promise made here."
    ],
    direction: [
      "Make sure the main body delivers on this promise explicitly — name it when you do.",
      "If the promise is vague, sharpen it so the viewer knows exactly what success looks like.",
      "Callback to this promise in the outro to close the loop cleanly.",
      "Do not introduce a second promise elsewhere in the script without delivering the first one."
    ]
  },

  // Context is vague — no specific numbers or outcomes
  vague: {
    level: 'high',
    observation: [
      "This context section is general where it should be specific.",
      "The claims made here lack any concrete evidence or example to anchor them.",
      "The section makes broad statements without supporting detail.",
      "There are no numbers, results, or named examples to give the claims weight."
    ],
    consequence: [
      "Vague context sounds like every other video on the topic — it does not distinguish this creator.",
      "Without specifics, the viewer has no way to measure whether the authority being claimed is real.",
      "General claims are easy to make and therefore easy to dismiss.",
      "The credibility established by a vague context is thin enough to collapse at the first difficult idea in the body."
    ],
    direction: [
      "Replace at least one general claim with a specific number, a named result, or a concrete example.",
      "The more specific the credential, the more credible it sounds — even if the number is modest.",
      "Name a real outcome: not 'many creators' but 'over 400 scripts from creators with under 10,000 subscribers'.",
      "Specificity is not bragging — it is evidence, and evidence is what earns trust."
    ]
  },

  // Context is too long
  tooLong: {
    level: 'mid',
    observation: [
      "The context section is longer than the credibility it is building requires.",
      "This section continues past the point where the viewer's trust has been established.",
      "The context covers ground that belongs in the main body.",
      "More is being said here than is needed to earn the right to be believed."
    ],
    consequence: [
      "A long context delays the value the viewer came for and increases the risk of drop-off before the main body begins.",
      "Viewers who came for the answer, not the backstory, may leave during an extended setup.",
      "The context section earns patience — it does not spend it. Running long here spends what has not yet been earned.",
      "Every sentence in the context that is not building trust or making a promise is reducing the viewer's tolerance for what comes next."
    ],
    direction: [
      "Trim the context to credential plus promise — one of each is enough.",
      "Move any explanatory content to the main body where the viewer expects it.",
      "Test each sentence in the context: is it building trust or making a promise? If neither, cut it.",
      "The shorter and sharper the context, the faster the viewer arrives at the value they came for."
    ]
  },

  // Context has viewer address — strong
  viewerAddressed: {
    level: 'low',
    observation: [
      "The context section addresses the viewer directly.",
      "This section connects the credential to something the viewer will experience.",
      "The viewer is spoken to as a participant, not an observer.",
      "The context is framed around the viewer's situation, not just the creator's experience."
    ],
    consequence: [
      "A viewer who feels addressed is more likely to accept that this video is for them specifically.",
      "Direct address converts general information into personal relevance.",
      "When the context connects to the viewer's experience, the promise becomes something they can picture themselves receiving.",
      "Viewer-addressed context builds trust faster because it removes the gap between the creator's world and the viewer's."
    ],
    direction: [
      "Maintain this throughout the body — do not shift from viewer-focused to creator-focused mid-script.",
      "Make sure the promise attached to this viewer address is kept explicitly in the main body.",
      "The more specifically you can describe the viewer's situation, the stronger this connection becomes.",
      "Consider naming a specific type of viewer this applies to — it makes the rest feel more targeted."
    ]
  },

  // Context has no promise
  noPromise: {
    level: 'mid',
    observation: [
      "The context establishes authority but does not commit to delivering anything specific.",
      "There is no promise here — the viewer does not know what they will have at the end.",
      "The section earns credibility but does not convert it into a direction.",
      "The viewer is given a reason to trust the creator but not a reason to keep watching."
    ],
    consequence: [
      "Without a promise, the viewer enters the main body without knowing what they are working toward.",
      "Trust without direction creates passive watching rather than engaged attention.",
      "The main body will have to work harder to maintain attention because there is no unresolved commitment pulling the viewer forward.",
      "Viewers who do not know what they are waiting for are easier to lose to distraction."
    ],
    direction: [
      "End the context section with a single clear statement of what the viewer will walk away with.",
      "The promise does not need to be elaborate — one sentence that names the outcome is enough.",
      "Frame the promise around the viewer: not 'I will show you' but 'by the end of this you will know'.",
      "A promise made in the context creates a thread that runs through the body and closes in the outro."
    ]
  }
};

// ─────────────────────────────────────────────────────────────────
// MAIN BODY
// ─────────────────────────────────────────────────────────────────
FB.body = {

  // Body lacks concrete examples
  noExamples: {
    level: 'mid',
    observation: [
      "The main body makes claims without grounding them in a concrete example.",
      "The ideas here are stated as fact without showing the viewer what they look like in practice.",
      "The section explains a principle without illustrating it.",
      "There are no named scenarios, cases, or demonstrations — just the assertion."
    ],
    consequence: [
      "Claims without examples ask the viewer to take your word for it, which requires more trust than most viewers are willing to extend.",
      "Abstract explanations fade from memory. Specific examples survive it.",
      "When a viewer cannot picture what you are describing, their attention drifts to something they can picture.",
      "The insight may be correct, but without an example it feels like an opinion rather than a finding."
    ],
    direction: [
      "Follow each key claim with a named scenario: 'for example' or 'this is what it looks like in practice'.",
      "Use a creator story, a before-and-after, or a specific result to make the point tangible.",
      "The example does not need to be long — a single sentence that makes the idea concrete is enough.",
      "If you cannot think of an example, that is a signal the idea needs more development before filming."
    ]
  },

  // Body has good insight density
  highInsight: {
    level: 'low',
    observation: [
      "This section delivers new information consistently without repeating itself.",
      "The body introduces a distinct insight in each paragraph.",
      "The value density here is high — each sentence moves the viewer forward.",
      "The section earns its length by rewarding the viewer with new information throughout."
    ],
    consequence: [
      "High insight density keeps the viewer engaged because they are always getting something new.",
      "Viewers who are consistently rewarded stay committed to the end.",
      "A body section that keeps delivering raises the perceived value of the whole video.",
      "This kind of pacing creates the feeling that the video is worth finishing."
    ],
    direction: [
      "Maintain this through to the end of the body — do not let the pace drop in the final paragraphs.",
      "Make sure each insight connects to the promise made in the context.",
      "Consider whether any of these insights deserves its own example to make it stick.",
      "End the body on the strongest insight so the viewer arrives at the CTA with their trust at its highest."
    ]
  },

  // Body is repetitive
  repetitive: {
    level: 'high',
    observation: [
      "The same idea appears more than once in this section without adding new dimension.",
      "This section restates earlier points rather than building on them.",
      "The body is covering ground it has already covered.",
      "Multiple sentences here are making the same observation in different words."
    ],
    consequence: [
      "Repetition signals to the viewer that the video has run out of new things to say.",
      "Once a viewer recognises repetition, they begin skipping forward or leaving.",
      "Restating an idea without advancing it wastes the attention the context section earned.",
      "The feeling that a video is padding is almost always caused by repetition in the body."
    ],
    direction: [
      "Identify the repeated idea and keep only the version that is most specific and most concrete.",
      "Replace the repeated sentence with something that builds on the first statement rather than echoing it.",
      "If the idea needs to be stated twice, make sure the second version adds a new dimension — an example, a consequence, or a counterpoint.",
      "A body section where every paragraph advances the idea feels shorter and smarter than one that restates."
    ]
  },

  // Body has flat pacing
  flatPacing: {
    level: 'mid',
    observation: [
      "The sentences in this section are all roughly the same length.",
      "There is no variation in rhythm here — the pacing is uniform throughout.",
      "The section reads at a consistent pace without any acceleration or pause.",
      "Long sentences follow long sentences without a short one to reset the rhythm."
    ],
    consequence: [
      "Uniform sentence length creates a monotonous reading experience that reduces retention.",
      "Pacing variation is what makes a script feel like it has energy — without it, the viewer's attention flattens.",
      "The brain responds to contrast. When sentence length never changes, the content feels harder to absorb.",
      "Flat pacing is one of the most common reasons a viewer describes a video as 'fine but not engaging'."
    ],
    direction: [
      "After every two or three long explanatory sentences, add one short sentence that punctuates the point.",
      "Short sentences create emphasis. Use them at the moment of the key insight.",
      "Vary the rhythm deliberately: setup, setup, punchline. The punchline should be the shortest sentence.",
      "Read the section aloud — where you naturally want to pause or accelerate is where the sentence length should change."
    ]
  },

  // Body has good pacing
  goodPacing: {
    level: 'low',
    observation: [
      "The sentence length varies throughout this section.",
      "The rhythm here moves between longer explanatory sentences and shorter emphatic ones.",
      "The pacing creates a natural reading flow with contrast built in.",
      "Short and long sentences alternate in a way that feels deliberate."
    ],
    consequence: [
      "Good pacing makes the content easier to absorb because the brain gets natural breaks.",
      "Rhythm variation keeps the viewer's attention active rather than passive.",
      "A well-paced body section sounds confident when read aloud — it commands attention rather than asking for it.",
      "Viewers do not notice good pacing consciously, but they feel it as the sense that a video is well-made."
    ],
    direction: [
      "Keep this rhythm through to the end of the body — do not let it flatten in the final paragraphs.",
      "Make sure the shortest sentence in the section carries the most important idea.",
      "Consider whether the pacing accelerates toward the end — the body should feel like it is building.",
      "Apply this same rhythm discipline to the CTA, where pacing matters most for conversion."
    ]
  },

  // Body lacks forward momentum
  noMomentum: {
    level: 'high',
    observation: [
      "The main body does not build toward anything — it presents information without escalating.",
      "Each paragraph in this section is self-contained rather than building on what came before.",
      "The section covers its points but does not create a sense of progression.",
      "The body explains without driving — the viewer arrives at the end of it without feeling pulled forward."
    ],
    consequence: [
      "A body section with no forward momentum feels complete at any point, which means the viewer can stop at any point.",
      "When each paragraph could be the last, none of them feels essential.",
      "Without escalation, the viewer experiences the script as a list rather than a journey.",
      "The CTA has no momentum to ride if the body does not build toward it."
    ],
    direction: [
      "Structure the body so each paragraph raises the stakes of the one before it.",
      "End each paragraph with something unresolved that the next paragraph answers.",
      "Build from the simple version of the idea to the complex, or from the common mistake to the correct approach.",
      "The last paragraph of the body should be the most important — the viewer should feel that the video is reaching its point."
    ]
  },

  // Body has passive voice
  passiveVoice: {
    level: 'mid',
    observation: [
      "Several sentences in this section use passive construction.",
      "The language here removes the actor from the action, creating distance.",
      "The passive voice is used where active voice would be more direct.",
      "Things happen in this section without clear ownership of who is doing them."
    ],
    consequence: [
      "Passive voice makes content feel academic rather than immediate, which works against viewer engagement.",
      "Active voice creates movement. Passive voice describes results without the action that produced them.",
      "Viewers process active sentences faster and retain them longer.",
      "The distance created by passive construction reduces the sense that the creator is speaking directly to the viewer."
    ],
    direction: [
      "Rewrite passive constructions by naming who is doing what: not 'mistakes are made' but 'most creators make this mistake'.",
      "Test each sentence: can you add 'by someone' after the verb? If so, it is passive and should be rewritten.",
      "Active voice does not need to be aggressive — it just needs to name the actor.",
      "Even technical content sounds more credible in active voice because it implies the creator knows who is responsible."
    ]
  }
};

// ─────────────────────────────────────────────────────────────────
// CTA
// ─────────────────────────────────────────────────────────────────
FB.cta = {

  // CTA has no action verb
  noAction: {
    level: 'high',
    observation: [
      "The CTA does not name a specific action for the viewer to take.",
      "There is no clear instruction here — the viewer is left to decide what to do next.",
      "The call to action calls for nothing in particular.",
      "This section ends the video's momentum without directing it anywhere."
    ],
    consequence: [
      "A viewer who is not told what to do will not do anything — the decision to act requires less friction than the decision to figure out what to do.",
      "All the trust built across the video dissolves at the final moment if there is no specific ask.",
      "Without a named action, the viewer closes the tab having experienced the content but having committed to nothing.",
      "The CTA is the only moment in the video where asking directly for something is expected — missing it is a structural failure."
    ],
    direction: [
      "Name one specific action: subscribe, comment, watch the next video, download the resource.",
      "One clear ask converts better than two vague ones — choose the action that matters most and ask only for that.",
      "Make the action as low-friction as possible: the easier it is to do, the more likely it is to happen.",
      "State the action directly: not 'you might want to' but 'hit subscribe'."
    ]
  },

  // CTA has action but no reason
  actionNoReason: {
    level: 'mid',
    observation: [
      "The CTA names an action but does not give a reason to take it.",
      "There is an ask here without the justification that makes it worth responding to.",
      "The section tells the viewer what to do but not why they should care.",
      "The action is named but the benefit of taking it is not."
    ],
    consequence: [
      "An ask without a reason sounds like a transaction with no upside for the viewer.",
      "Viewers who are not given a reason to act treat the CTA as background noise.",
      "The difference between a CTA that converts and one that does not is almost always the presence of a specific reason.",
      "Without a why, the viewer's default answer to any ask is no."
    ],
    direction: [
      "After the action, add 'because' and complete the sentence from the viewer's perspective.",
      "The reason should be specific: not 'subscribe for more content' but 'subscribe because I post every Tuesday and next week I am covering...'.",
      "Frame the reason around what the viewer gets, not what the channel produces.",
      "A future promise — here is what is coming next — is one of the most effective reasons to subscribe."
    ]
  },

  // CTA is strong — action and reason present
  strong: {
    level: 'low',
    observation: [
      "This CTA names a specific action and gives the viewer a reason to take it.",
      "The ask is clear and the benefit is stated.",
      "The section directs the viewer and tells them why it matters.",
      "The CTA completes the trust arc of the video with a specific, justified request."
    ],
    consequence: [
      "A CTA with a clear action and a reason converts significantly better than one with either alone.",
      "The viewer who reaches a strong CTA is ready to act — this gives them the information they need to do so.",
      "A justified ask respects the viewer's time and signals that the creator understands the exchange.",
      "This kind of CTA closes the relationship the hook opened — the viewer who acts feels they made a good decision."
    ],
    direction: [
      "Make sure the action is the most valuable one for this particular video — not every video needs the same CTA.",
      "Consider whether the reason is specific enough to create urgency or specificity.",
      "If you are asking for a subscribe, tell them what is coming next — this is the single most effective reason.",
      "Keep this CTA short — it has already done its job, and more words dilute it."
    ]
  },

  // CTA is too long
  tooLong: {
    level: 'mid',
    observation: [
      "The CTA runs longer than a single clear ask requires.",
      "This section makes multiple asks where one would be more effective.",
      "The CTA spreads its request across too many sentences.",
      "Multiple calls to action appear here, competing with each other."
    ],
    consequence: [
      "The more options a viewer is given, the less likely they are to choose any of them.",
      "A CTA that runs long signals uncertainty — the creator is not sure which action matters most.",
      "Multiple asks dilute each individual ask and reduce the total conversion rate.",
      "When the viewer is deciding which action to take, they are no longer deciding whether to act — that split focus costs more than it saves."
    ],
    direction: [
      "Choose one action. The most important one. Ask only for that.",
      "If multiple actions are genuinely necessary, prioritise them and lead with the one that matters most.",
      "Every additional ask after the first reduces the conversion rate of the first — fewer is almost always better.",
      "A short CTA that gets one action taken is worth more than a long one that gets none."
    ]
  },

  // CTA feels disconnected from the video
  disconnected: {
    level: 'mid',
    observation: [
      "The CTA does not connect to the content that came before it.",
      "The ask appears without any reference to the value the viewer just received.",
      "The transition from the main body to the call to action is abrupt.",
      "The CTA feels added at the end rather than earned by the video."
    ],
    consequence: [
      "A CTA that appears without context feels like an interruption rather than a conclusion.",
      "The viewer who was engaged with the content is pulled out of that engagement by an ask that does not connect to it.",
      "Trust built in the body drops when the CTA does not feel like a natural result of what was just said.",
      "Disconnected CTAs are the ones viewers describe as 'that part at the end where they ask for stuff'."
    ],
    direction: [
      "Begin the CTA by referencing what the viewer just learned — create a bridge from the content to the ask.",
      "Use the language of the video's core idea in the CTA: if the video was about hooks, the CTA should feel like a hook too.",
      "Frame the ask as a continuation of the value: 'if this helped you, here is what happens when you...'.",
      "The CTA earns permission to ask by reminding the viewer what they received — do not skip that step."
    ]
  }
};

// ─────────────────────────────────────────────────────────────────
// OUTRO
// ─────────────────────────────────────────────────────────────────
FB.out = {

  // Outro closes abruptly
  abrupt: {
    level: 'high',
    observation: [
      "The outro ends the video without closing the loop opened in the hook.",
      "The script stops rather than ends — there is no sense of completion.",
      "The final section does not return to where the video began.",
      "The outro is present in length but absent in function."
    ],
    consequence: [
      "A viewer who reaches an abrupt ending carries a mild sense of incompleteness away from the video.",
      "The hook created an expectation. If the outro does not resolve it, the viewer leaves with a debt the creator owes them.",
      "Endings that feel earned make the whole video feel better in retrospect. Abrupt endings make even good content feel unfinished.",
      "The last thing a viewer experiences is the most memorable — a weak ending overwrites a strong middle."
    ],
    direction: [
      "Return to the idea, question, or tension from the hook and close it explicitly.",
      "The outro does not need to be long — one sentence that connects back to the opening is enough to create resolution.",
      "Name what the viewer now has that they did not have at the start of the video.",
      "The feeling of completion at the end of a video is what makes it feel worth sharing."
    ]
  },

  // Outro sends viewer forward
  forward: {
    level: 'low',
    observation: [
      "The outro directs the viewer to what they should do or watch next.",
      "The final section sends the viewer forward rather than simply ending.",
      "The outro creates a next step for the viewer after this video.",
      "The script ends by opening a new door rather than closing the current one."
    ],
    consequence: [
      "An outro that sends the viewer forward extends the relationship beyond this single video.",
      "Viewers who are directed to the next step are significantly more likely to take it than viewers who are left to decide for themselves.",
      "Forward momentum at the end converts casual viewers into returning ones.",
      "A strong outro turns a view into a session — the viewer stays on the channel rather than leaving the platform."
    ],
    direction: [
      "Make sure the next step you are sending viewers toward is genuinely relevant to what they just watched.",
      "Name the specific video, playlist, or resource — vague next steps are almost never taken.",
      "If you are sending viewers to another video, tease what they will get from it in one sentence.",
      "The outro's job is to make staying feel like the obvious choice."
    ]
  },

  // Outro is too long
  tooLong: {
    level: 'mid',
    observation: [
      "The outro runs longer than it needs to.",
      "This section continues past the point of resolution.",
      "The ending says more than the closing requires.",
      "The outro keeps adding after the video has already finished its job."
    ],
    consequence: [
      "Viewers who have already received the value will not wait for an extended wind-down.",
      "A long outro gives the viewer time to make the decision to leave before the outro has finished.",
      "The outro's value is in its finality — length undermines the sense of a clean ending.",
      "Every extra sentence after the resolution is a second opinion the viewer did not ask for."
    ],
    direction: [
      "Close the loop in one sentence, send them forward in one sentence, and stop.",
      "The outro should feel like punctuation — definitive and brief.",
      "Anything that needs more than two sentences in the outro probably belongs in the body.",
      "Test the outro by reading only the last sentence — if it could be the end, cut everything before it."
    ]
  },

  // Outro has no callback to hook
  noCallback: {
    level: 'mid',
    observation: [
      "The outro does not reference the opening question or claim from the hook.",
      "The script ends without connecting back to where it started.",
      "The tension opened in the hook is never explicitly closed.",
      "The outro treats the video as a series of sections rather than a single journey."
    ],
    consequence: [
      "A video without a callback feels structurally loose — the beginning and the end do not know about each other.",
      "The viewer who remembered the hook arrives at the outro wondering if the answer was buried somewhere.",
      "Without resolution of the hook's tension, the viewer's sense of completion is incomplete.",
      "Callback outros make editors feel good — they signal craft, which makes the whole video feel more considered."
    ],
    direction: [
      "In the outro, restate the question or claim from the hook and deliver a one-sentence resolution.",
      "The callback does not need to be clever — it just needs to be there.",
      "If the hook asked a question, the outro should answer it in plain terms.",
      "A simple callback structure: name the problem from the hook, name the solution from the body, send them forward."
    ]
  },

  // Outro is strong
  strong: {
    level: 'low',
    observation: [
      "The outro closes the loop opened in the hook and directs the viewer forward.",
      "This section provides resolution and a next step.",
      "The ending connects back to the beginning and creates a sense of completion.",
      "The outro earns its place by doing both jobs — closing and forwarding."
    ],
    consequence: [
      "A viewer who reaches a strong outro leaves the video feeling it was worth their time.",
      "Completion signals satisfaction, and satisfaction is what drives sharing and returning.",
      "The outro is the last data point in the viewer's assessment of the creator — a strong one improves everything that came before.",
      "A well-structured ending creates the kind of experience the viewer describes to others."
    ],
    direction: [
      "Make sure the forward direction is specific enough to be actionable.",
      "If there is a next video to watch, name it — do not just say 'check out my other videos'.",
      "Consider whether the resolution could be phrased as something the viewer now has, rather than something the creator has said.",
      "This outro sets a standard — apply the same structure to every video."
    ]
  }
};

// ════════════════════════════════════════════════════════════════════
// COMPOSER
// Selects and assembles feedback from the library above
// ════════════════════════════════════════════════════════════════════

function pickVariant(arr, seed) {
  if (!arr || !arr.length) return '';
  var idx = Math.abs(seed) % arr.length;
  return arr[idx];
}

function textSeed(text) {
  // Deterministic hash of text so same paragraph always gets same variant
  var h = 0;
  for (var i = 0; i < text.length; i++) {
    h = ((h << 5) - h) + text.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}

function composeFeedback(tag, text, sc, signals) {
  var section = FB[tag];
  if (!section) return null;

  var seed = textSeed(text);
  var level = sc >= 65 ? 'low' : sc >= 40 ? 'mid' : 'high';
  var conditions = getConditions(tag, text, sc, signals || {});

  // Pick the most relevant condition for this text and score
  var entry = null;
  var conditionKey = null;

  // Try to find a condition that matches the score level
  for (var i = 0; i < conditions.length; i++) {
    var key = conditions[i];
    if (section[key]) {
      var entryLevel = section[key].level || 'mid';
      if (entryLevel === level) {
        entry = section[key];
        conditionKey = key;
        break;
      }
    }
  }

  // Fall back to any matching condition
  if (!entry) {
    for (var j = 0; j < conditions.length; j++) {
      if (section[conditions[j]]) {
        entry = section[conditions[j]];
        conditionKey = conditions[j];
        break;
      }
    }
  }

  if (!entry) return null;

  var obs = pickVariant(entry.observation, seed);
  var cons = pickVariant(entry.consequence, seed + 1);
  var dir = pickVariant(entry.direction, seed + 2);

  return obs + ' ' + cons + ' ' + dir;
}

function getConditions(tag, text, sc, signals) {
  var t = text.toLowerCase();
  var conditions = [];

  if (tag === 'hook') {
    if (signals.curiosityCollapsed) conditions.push('selfResolving');
    if (/^(i |my |i've |i'm |i was |i have )/i.test(text.trim())) conditions.push('creatorFirst');
    if (sc >= 65) conditions.push('strong');
    if (/\?/.test(text)) conditions.push('hasQuestion');
    if (text.split(/\s+/).length > 60) conditions.push('tooLong');
    if (!/\byou\b/i.test(text)) conditions.push('noViewerAddress');
    if (sc < 40) conditions.push('noTension');
    conditions.push('noTension'); // fallback
  }

  if (tag === 'ctx') {
    var hasNumbers = /\b\d+\b/.test(text);
    var hasCredential = /\b(year|month|experience|work|built|created|studied|wrote|helped|review|client|project)\b/i.test(text);
    var hasViewer = /\byou\b/i.test(text);
    var hasPromise = /\b(will|by the end|walk away|learn|show you|teach|cover|explain|give you)\b/i.test(text);
    var wordLen = text.split(/\s+/).length;

    if (hasCredential && !hasViewer) conditions.push('credentialNoPayoff');
    if (!hasCredential) conditions.push('noCredential');
    if (hasCredential && !hasNumbers) conditions.push('vague');
    if (hasPromise) conditions.push('promisePresent');
    if (!hasPromise && sc < 65) conditions.push('noPromise');
    if (hasViewer) conditions.push('viewerAddressed');
    if (wordLen > 80) conditions.push('tooLong');
    conditions.push('noCredential'); // fallback
  }

  if (tag === 'body') {
    var sentences = text.replace(/([.!?])\s+/g, '$1\x01').split('\x01').filter(function(s) { return s.length > 3; });
    var hasExample = /\b(for example|for instance|such as|like when|imagine|picture this|here is|consider|take|case)\b/i.test(text);
    var lens = sentences.map(function(s) { return s.split(/\s+/).length; });
    var avgLen = lens.reduce(function(a, b) { return a + b; }, 0) / (lens.length || 1);
    var variance = Math.sqrt(lens.reduce(function(a, b) { return a + Math.pow(b - avgLen, 2); }, 0) / (lens.length || 1));
    var passiveCount = (text.match(/\b(was|were|is|are|been|being)\s+\w+ed\b/gi) || []).length;

    if (!hasExample && sc < 65) conditions.push('noExamples');
    if (sc >= 70) conditions.push('highInsight');
    if (variance < 2.5 && sentences.length >= 4) conditions.push('flatPacing');
    if (variance >= 3.5) conditions.push('goodPacing');
    if (passiveCount >= 2) conditions.push('passiveVoice');
    if (sc < 40) conditions.push('noMomentum');
    conditions.push('noExamples'); // fallback
  }

  if (tag === 'cta') {
    var hasActionVerb = /\b(subscribe|comment|like|share|click|tap|watch|download|sign up|join|follow|visit|check out|grab|get|save|turn on)\b/i.test(text);
    var hasReason = /\b(because|so that|to get|so you|which means|you will|you can|to help)\b/i.test(text);
    var ctaWords = text.split(/\s+/).length;

    if (!hasActionVerb) conditions.push('noAction');
    if (hasActionVerb && !hasReason) conditions.push('actionNoReason');
    if (hasActionVerb && hasReason) conditions.push('strong');
    if (ctaWords > 60) conditions.push('tooLong');
    if (sc < 40 && hasActionVerb) conditions.push('disconnected');
    conditions.push('noAction'); // fallback
  }

  if (tag === 'out') {
    var hasForward = /\b(next|watch|check|link|video|playlist|resource|below|here|comment|follow)\b/i.test(text);
    var hasCallback = /\b(started|began|opened|asked|mentioned|said|promised|earlier|beginning|hook)\b/i.test(text);
    var outWords = text.split(/\s+/).length;

    if (sc >= 65 && hasForward) conditions.push('strong');
    if (hasForward) conditions.push('forward');
    if (!hasCallback && sc < 65) conditions.push('noCallback');
    if (outWords > 60) conditions.push('tooLong');
    if (sc < 40) conditions.push('abrupt');
    conditions.push('abrupt'); // fallback
  }

  return conditions;
}

// ════════════════════════════════════════════════════════════════════
// PUBLIC API
// Called from getParagraphFeedback in app.js
// ════════════════════════════════════════════════════════════════════

function getComposedFeedback(tag, text, sc, signals) {
  try {
    var result = composeFeedback(tag, text, sc, signals || {});
    return result || null;
  } catch (e) {
    return null;
  }
}
