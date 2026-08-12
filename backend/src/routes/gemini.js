const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { db } = require('../db.js');
const { v4: uuidv4 } = require('uuid');

const SYSTEM_PROMPT = `You are an AI assistant for a smart queue management system called QueueIQ.
Your task is to parse a user's free-form service request text and extract structured information.

Return ONLY a valid JSON object (no markdown, no explanation) with these exact fields:
{
  "service_type": "string — short name of the service needed (e.g., 'Blood Test', 'Haircut', 'Cash Deposit')",
  "urgency": "low | medium | high — based on language cues (words like 'urgent', 'emergency', 'not urgent', 'when possible')",
  "request_category": "walk-in | appointment | service_request — walk-in means unscheduled, appointment means they have a prior booking, service_request means a specific task/document",
  "estimated_service_duration_mins": "number — realistic estimate in minutes for this type of service",
  "notes": "string — any additional context, preferences, or constraints the user mentioned"
}

Examples:
Input: "I need to get my blood test done, not urgent"
Output: {"service_type":"Blood Test","urgency":"low","request_category":"walk-in","estimated_service_duration_mins":10,"notes":"Routine blood test, no urgency"}

Input: "Walk-in for haircut, prefer quick service"
Output: {"service_type":"Haircut","urgency":"medium","request_category":"walk-in","estimated_service_duration_mins":15,"notes":"Prefers quick service"}

Input: "Appointment follow-up for dentist, was told to come after 3pm"
Output: {"service_type":"Dental Follow-up","urgency":"medium","request_category":"appointment","estimated_service_duration_mins":20,"notes":"Follow-up appointment, instructed to arrive after 3pm"}

Input: "URGENT chest pain need to see doctor immediately"
Output: {"service_type":"Emergency Consultation","urgency":"high","request_category":"walk-in","estimated_service_duration_mins":20,"notes":"Emergency - chest pain, needs immediate attention"}
`;

// POST /api/gemini/parse — parse free-text request with Gemini
router.post('/parse', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'text is required' });
  }

  // Fallback if no API key
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('⚠️  No Gemini API key found — using rule-based fallback parser');
    const fallback = ruleBasedParser(text);
    return res.json({ success: true, data: fallback, source: 'fallback' });
  }

  // Model cascade: lite → standard → fallback parser
  const MODEL_CASCADE = ['gemini-flash-lite-latest', 'gemini-flash-latest'];

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    let result;
    let usedModel;
    for (const modelName of MODEL_CASCADE) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nParse this request:\n"${text}"` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
        });
        usedModel = modelName;
        console.log(`✅ Gemini parse via ${modelName}`);
        break;
      } catch (modelErr) {
        console.warn(`⚠️  ${modelName} failed: ${modelErr.status || modelErr.message.substring(0, 60)}`);
        if (modelName === MODEL_CASCADE[MODEL_CASCADE.length - 1]) throw modelErr;
      }
    }

    const responseText = result.response.text().trim();

    // Strip markdown code blocks if present
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate and normalize
    const normalized = {
      service_type: parsed.service_type || 'General Service',
      urgency: ['low', 'medium', 'high'].includes(parsed.urgency) ? parsed.urgency : 'medium',
      request_category: ['walk-in', 'appointment', 'service_request'].includes(parsed.request_category)
        ? parsed.request_category : 'walk-in',
      estimated_service_duration_mins: Number(parsed.estimated_service_duration_mins) || 10,
      notes: parsed.notes || '',
    };

    res.json({ success: true, data: normalized, source: 'gemini' });
  } catch (err) {
    console.error('Gemini error:', err.message);
    // Graceful fallback
    const fallback = ruleBasedParser(text);
    res.json({ success: true, data: fallback, source: 'fallback', warning: 'Gemini unavailable, using fallback parser' });
  }
});

// Rule-based fallback parser when Gemini is unavailable
function ruleBasedParser(text) {
  const lower = text.toLowerCase();

  // Urgency detection
  let urgency = 'medium';
  if (/urgent|emergency|immediately|asap|critical|severe|acute/.test(lower)) urgency = 'high';
  else if (/not urgent|whenever|low priority|when possible|routine|regular|follow.?up/.test(lower)) urgency = 'low';

  // Category detection
  let request_category = 'walk-in';
  if (/appointment|booked|scheduled|follow.?up|pre-?book/.test(lower)) request_category = 'appointment';
  else if (/form|document|certificate|request|renewal|cheque|passbook/.test(lower)) request_category = 'service_request';

  // Service type detection
  let service_type = 'General Service';
  let estimated_service_duration_mins = 10;

  if (/blood|test|lab|pathology/.test(lower)) { service_type = 'Blood Test'; estimated_service_duration_mins = 10; }
  else if (/haircut|hair cut|trim|beard|styling|salon/.test(lower)) { service_type = 'Haircut'; estimated_service_duration_mins = 20; }
  else if (/doctor|physician|consult|clinic|fever|pain/.test(lower)) { service_type = 'Medical Consultation'; estimated_service_duration_mins = 15; }
  else if (/dental|dentist|teeth|tooth/.test(lower)) { service_type = 'Dental Consultation'; estimated_service_duration_mins = 20; }
  else if (/bank|cash|deposit|withdraw|account|loan|emi|fd|cheque|passbook/.test(lower)) { service_type = 'Banking Service'; estimated_service_duration_mins = 12; }
  else if (/prescription|medicine|pharmacy/.test(lower)) { service_type = 'Prescription'; estimated_service_duration_mins = 5; }

  return {
    service_type,
    urgency,
    request_category,
    estimated_service_duration_mins,
    notes: text.length > 100 ? text.substring(0, 100) + '...' : text,
  };
}

// POST /api/gemini/help — AI help center chatbot
router.post('/help', async (req, res) => {
  const { text, userId, userName } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'text is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are a helpful customer support AI for WAITLESS (a queue management & booking platform).
The user is asking: "${text}"

Answer their question politely and concisely.
IMPORTANT: At the very end of your response, output a boolean flag indicating if this issue requires human admin attention (e.g. they want a refund, they are very angry, they have a bug).
Format your entire output exactly like this JSON:
{
  "reply": "Your helpful response here.",
  "needs_admin": true/false
}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    });

    const responseText = result.response.text().trim();
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch(e) {
      // Fallback if AI didn't return JSON
      parsed = { reply: responseText, needs_admin: false };
    }

    if (parsed.needs_admin && userId) {
      db.prepare(`
        INSERT INTO support_tickets (id, user_id, user_name, question, ai_response, status)
        VALUES (?, ?, ?, ?, ?, 'open')
      `).run(uuidv4(), userId, userName || 'User', text, parsed.reply);
    }

    res.json({ success: true, reply: parsed.reply, forwarded: parsed.needs_admin });
  } catch (err) {
    console.error('Gemini Help Error:', err.message);
    res.json({ success: true, reply: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.", forwarded: false });
  }
});

module.exports = router;
