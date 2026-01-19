export const METRIC_CONFIG = [
  { key: "impact", label: "Impact", icon: "í²¥", colorClass: "from-orange-400 to-red-500", defaultValue: 5 },
  { key: "brevity", label: "Brevity", icon: "âœ‚ï¸", colorClass: "from-blue-400 to-cyan-500", defaultValue: 5 },
  { key: "style", label: "Style", icon: "í¾¨", colorClass: "from-purple-400 to-pink-500", defaultValue: 5 },
  { key: "structure", label: "Structure", icon: "í¿—ï¸", colorClass: "from-emerald-400 to-green-500", defaultValue: 5 },
];

export const ANALYZE_RESUME_PROMPT = `
You are an expert resume critic. Analyze the following resume text.
Return the response in strictly valid JSON format with this exact structure:
{
  "overallScore": "number (0-10)",
  "summary": "string (executive summary of the candidate)",
  "strengths": ["string", "string", "string"],
  "improvements": ["string", "string", "string"],
  "performanceMetrics": {
    "impact": number (0-10),
    "brevity": number (0-10),
    "style": number (0-10),
    "structure": number (0-10)
  },
  "actionItems": ["string", "string", "string"],
  "proTips": ["string", "string"],
  "keywords": ["string", "string", "string"]
}

Resume Text:
{{DOCUMENT_TEXT}}
`;

export const buildPresenceChecklist = (text) => {
  const lowerText = text.toLowerCase();
  return [
    { label: "Contact Info", present: lowerText.includes("@") || lowerText.match(/\d{10}/) },
    { label: "LinkedIn", present: lowerText.includes("linkedin.com") },
    { label: "Education", present: lowerText.includes("education") || lowerText.includes("university") || lowerText.includes("college") },
    { label: "Experience", present: lowerText.includes("experience") || lowerText.includes("employment") || lowerText.includes("work history") },
    { label: "Skills", present: lowerText.includes("skills") || lowerText.includes("technologies") },
  ];
};

export default { METRIC_CONFIG, ANALYZE_RESUME_PROMPT, buildPresenceChecklist };
