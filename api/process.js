export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { skill, input } = req.body;

  const prompts = {
    listing: `You are an expert real estate copywriter specializing in Annapolis, Maryland. Given the property details below, write a compelling MLS listing description (400-600 characters). Then output:
- Character count
- Top SEO keywords used
Format clearly with labeled sections.

Property details:
${input}`,
    contract: `You are a real estate transaction coordinator. Extract and summarize the key terms from this purchase agreement. Include: sale price, earnest money & deadline, closing date, contingencies (inspection, financing, appraisal), inclusions/exclusions, and any red flags that need immediate action. Be concise and use clear labels.

Contract:
${input}`,
    comps: `You are a real estate appraiser. Analyze these comparable sales and produce a CMA for the subject property. Include: avg price per sq ft, valuation range (low/mid/high), recommended list price, avg days on market, and any outliers to exclude. Show your reasoning briefly.

Data:
${input}`,
    disclosure: `You are a real estate attorney reviewing a seller disclosure. Identify: system ages and condition, any red flags requiring action before closing, items that need permit verification, and items the buyer should test or inspect. Rate each flag as 🔴 critical or 🟡 advisory.

Disclosure:
${input}`,
    followup: `You are a top-producing real estate agent. Write a personalized follow-up email to the clients after their showing. Use their specific concerns, timeline, and preferences. Keep it warm, concise (under 150 words), and end with a clear next step. Also output: Tone and Word count.

Showing notes:
${input}`
  };

  const prompt = prompts[skill];
  if (!prompt) return res.status(400).json({ error: 'Invalid skill' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'API error' });

    res.json({ result: data.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
