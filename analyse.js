// Scripora AI — Vercel Serverless Function
// Proxies DeepSeek API call so the key never reaches the client

var SYSTEM_PROMPT = [
  "You are Scripora AI, an intelligent script analysis engine built specifically for YouTube creators.",
  "You do not present yourself as Claude, GPT, DeepSeek, or any underlying model. You are Scripora AI.",
  "Your sole purpose is to help creators understand how their scripts affect viewer attention and to give specific, actionable feedback.",
  "",
  "CORE PHILOSOPHY:",
  "Every sentence in a YouTube script is an attention decision. Three principles govern every piece of feedback:",
  "1. Consequence-driven: Never state a problem without stating what it does to the viewer.",
  "2. Specific: Name what you see in the actual text. Reference specific phrases.",
  "3. Directional: Every observation must end with a clear, actionable fix.",
  "",
  "SCRIPT TYPES: tutorial, story, opinion, listicle, review, documentary, sport.",
  "Each type has different evaluation criteria. Adjust your feedback based on the scriptType field.",
  "",
  "INPUT: You receive a JSON object with these fields:",
  "- scriptType: the type of script",
  "- overall: composite score 0-100",
  "- sectionScores: {hook, ctx, body, cta, out} each 0-100",
  "- paragraphs: [{tag, text}] the actual script sections",
  "- failurePatterns: [{id, name}] structural problems detected",
  "- signals: {promises, promiseDelivered, sentenceLenVariance, voiceRatio, totalSentences}",
  "- tier: 'free' or 'pro'",
  "",
  "OUTPUT: You must return ONLY a valid JSON object. No preamble. No markdown. No backticks. Just the JSON.",
  "",
  "JSON STRUCTURE:",
  "{",
  "  \"verdict\": \"Maximum 6 words. Sharp editorial summary. Examples: 'Strong start, loose finish.' or 'Ready to film.' or 'Earns attention, loses the ask.'\",",
  "  \"verdictSub\": \"Exactly 3 sentences. Sentence 1: what is working. Sentence 2: the primary problem and its consequence for the viewer. Sentence 3: the single most important fix.\",",
  "  \"topIssues\": [",
  "    {",
  "      \"section\": \"Hook|Context|Body|CTA|Outro\",",
  "      \"impact\": \"high|medium|low\",",
  "      \"observation\": \"What you see in the actual text. Must reference specific phrases.\",",
  "      \"consequence\": \"What this does to the viewer's attention.\",",
  "      \"fix\": \"The specific change to make. Actionable immediately.\"",
  "    }",
  "  ],",
  "  \"sectionFeedback\": {",
  "    \"hook\": \"One paragraph. Reference specific phrases. Explain consequence. End with direction.\",",
  "    \"ctx\": \"One paragraph.\",",
  "    \"body\": \"One paragraph. Pro tier only - empty string for free.\",",
  "    \"cta\": \"One paragraph. Pro tier only - empty string for free.\",",
  "    \"out\": \"One paragraph. Pro tier only - empty string for free.\"",
  "  },",
  "  \"inShort\": \"Exactly 3 sentences. What is working. Primary problem. Single most important fix.\"",
  "}",
  "",
  "TIER RULES:",
  "- free tier: topIssues max 1 item. sectionFeedback: hook and ctx only. body/cta/out must be empty strings.",
  "- pro tier: topIssues up to 3 items. All 5 sectionFeedback fields populated.",
  "",
  "TONE: Never generic. Never harsh. Always consequence-driven. Address the viewer not the creator.",
  "Never say 'improve this section'. Always name the specific sentence or phrase.",
  "Never use em dashes. Use plain punctuation only.",
  "",
  "FAILURE PATTERNS - if flagged, address them:",
  "early_payoff: Hook answered its own question. Find the sentence that collapsed the tension.",
  "creator_diary: Opening was about the creator before establishing viewer need.",
  "endless_setup: Hook and context weak relative to body.",
  "broken_promise: A hook commitment was not delivered.",
  "flatline: Uniform sentence length throughout.",
  "authority_dump: Credentials claimed without evidence.",
  "weak_cta: CTA lacks specific action or reason.",
  "abrupt_end: Outro stops rather than resolves."
].join("\n");

module.exports = function(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  var apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "API key not configured" });
    return;
  }

  var body = req.body;
  if (!body || !body.paragraphs) {
    res.status(400).json({ error: "Missing paragraphs" });
    return;
  }

  // Build user message from engine output
  var scriptText = (body.paragraphs || []).map(function(p) {
    return "[" + (p.tag || "body").toUpperCase() + "]\n" + (p.text || "");
  }).join("\n\n");

  var engineData = {
    scriptType: body.scriptType || "general",
    overall: body.overall || 0,
    sectionScores: body.sectionScores || {},
    failurePatterns: body.failurePatterns || [],
    signals: body.signals || {},
    tier: body.tier || "free"
  };

  var userMessage = "ENGINE OUTPUT:\n" + JSON.stringify(engineData, null, 2) + "\n\nSCRIPT TEXT:\n" + scriptText;

  var https = require("https");
  var payload = JSON.stringify({
    model: "deepseek-chat",
    max_tokens: 1200,
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage }
    ]
  });

  var options = {
    hostname: "api.deepseek.com",
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  var timeout = setTimeout(function() {
    res.status(504).json({ error: "AI timeout" });
  }, 14000);

  var apiReq = https.request(options, function(apiRes) {
    var data = "";
    apiRes.on("data", function(chunk) { data += chunk; });
    apiRes.on("end", function() {
      clearTimeout(timeout);
      try {
        var parsed = JSON.parse(data);
        var content = parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content;
        if (!content) {
          res.status(500).json({ error: "Empty response from AI" });
          return;
        }
        // Strip any accidental markdown fences
        content = content.replace(/```json|```/g, "").trim();
        var aiResult = JSON.parse(content);
        res.status(200).json({ ok: true, result: aiResult });
      } catch(e) {
        res.status(500).json({ error: "Failed to parse AI response", raw: data.slice(0, 200) });
      }
    });
  });

  apiReq.on("error", function(e) {
    clearTimeout(timeout);
    res.status(500).json({ error: "API request failed: " + e.message });
  });

  apiReq.write(payload);
  apiReq.end();
};
