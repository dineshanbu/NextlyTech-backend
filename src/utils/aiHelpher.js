const axios = require("axios");
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const checkSimilarCategoryAI = async (name, nameList, groupContext = "") => {
  const prompt = `
You are a smart validator for new tech category creation.

📌 New Category:
- Name: "${name}"
- Group: "${groupContext}"

📚 Existing Categories:
${nameList.map((cat) => `- ${cat.name} (Group: ${cat.group || "None"})`).join("\n")}

🎯 Task:
1. Compare the new category ONLY with other categories in the **same group** ("${groupContext}").
2. If any existing category has a **very similar name or meaning**, mark it as a duplicate.

✅ Examples to Reject:
- "Mobile Comparison" vs "Mobile Comparisons"
- "Smartphone Comparison" vs "Mobile Comparison"
- "Tabv Reviews" vs "Tablet Reviews"
- "Mobile Comparsion" vs "Mobile Comparison"
- Spelling differences like "Comparsion" vs "Comparison"

❌ Examples to Allow:
- Same name in **different group**
- Different device types: e.g. "Tablet Comparisons" vs "Mobile Comparisons"


✅ Return only valid JSON:
{
  "isDuplicate": true/false,
  "similarName": "Exact or near duplicate name (if any)"
}
`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const message = response.data.choices[0].message.content;
    const jsonText = message
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return JSON.parse(jsonText);
  } catch (err) {
    console.error("AI Similar Category Check Error:", err?.response?.data || err);
    return { isDuplicate: false, similarName: "" }; // fallback to allow
  }
};



const checkGroupIntentAI = async (name, selectedGroup, allGroups = []) => {
  const prompt = `
A new category is being created:
- Name: "${name}"
- Selected Group: "${selectedGroup}"

Available groups:
${allGroups.map((g) => `- ${g}`).join('\n')}

Task:
1. Determine the correct group **based on the topic or keywords in the name** (e.g. "Mobile", "Comparison", "Review", "Tablet", "News").
2. If the selected group does **not** make sense for the name, return isCorrectGroup: false and suggest a better group.
3. DO NOT allow unrelated group mappings. For example:
   - A name like "Mobile Comparison" → must belong to "Comparisons"
   - A name like "iPhone Reviews" → must belong to "Reviews"
   - A name like "Tech Startup Launch" → can belong to "News"
4. Be strict. If you're unsure, return false.

Respond in valid JSON only:
{
  "isCorrectGroup": true/false,
  "suggestedGroup": "CorrectGroupName or empty"
}
`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const message = response.data.choices[0].message.content;

    const jsonText = message
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return JSON.parse(jsonText);
  } catch (err) {
    console.error("AI Group Intent Check Error:", err?.response?.data || err);
    return { isCorrectGroup: true, suggestedGroup: "" }; // fallback to allow
  }
};

const checkCategoryNameQualityAI = async (name) => {
  const prompt = `
Check the following category name for spelling errors or non-standard words:
- "${name}"

Return only valid JSON:
{
  "isValid": true/false,
  "reason": "Reason if invalid, else empty"
}
If it contains a typo like "comparsion" instead of "comparison", or "tabv" instead of "tablet", mark isValid: false.
`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const message = response.data.choices[0].message.content;
    const jsonText = message
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return JSON.parse(jsonText);
  } catch (err) {
    console.error("AI Name Quality Check Error:", err?.response?.data || err);
    return { isValid: true, reason: "" }; // fallback
  }
};



const generateMetaForEntity = async (type, name, group) => {
  let prompt="";
  if(group){
    prompt =  `
        Generate:
        1. SEO-friendly meta title (under 100 characters)
        2. A compelling meta description (under 300 characters)
        3. A 1-paragraph description (under 500 characters)

        For a ${type} named "${name}" under the group "${group}". Avoid promotional terms.

        Return JSON only:
        {
        "metaTitle": "",
        "metaDescription": "",
        "description": ""
        }`;
  }
  else{
    prompt =  `
        Generate:
        1. SEO-friendly meta title (under 100 characters)
        2. A compelling meta description (under 300 characters)
        3. A 1-paragraph description (under 500 characters)

        For a ${type} named "${name}". Avoid promotional terms.

        Return JSON only:
        {
        "metaTitle": "",
        "metaDescription": "",
        "description": ""
        }`;
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const message = response.data.choices[0].message.content;
    const jsonText = message
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Meta generation failed:", err?.response?.data || err);
    return null;
  }
};

const validateSubcategoryContextAI = async (subcategoryName, categoryName) => {
  const prompt = `
You are validating content hierarchy.

Category: "${categoryName}"
Proposed Subcategory: "${subcategoryName}"

Determine if the subcategory is appropriate and relevant **under this category**.

Return strict JSON only:
{
  "isRelevant": true/false,
  "reason": "short explanation"
}
`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = response.data.choices[0].message.content;
    const json = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return JSON.parse(json);
  } catch (err) {
    console.error("AI Context Validation Error:", err?.response?.data || err);
    return { isRelevant: true, reason: "Fallback to true due to AI failure" };
  }
};

/**
 * Generate full static page content using AI
 * @param {String} pageType (e.g. about-us, privacy-policy)
 * @returns {Object} { title, content, excerpt, metaTitle, metaDescription }
 */
const generateStaticPageContent = async (pageType) => {
  const prompt = `
You are a professional website content writer. Based on the page type below, write:

1. A clear and SEO-friendly Title
2. A full HTML content block (2–4 paragraphs)
3. A 300-character excerpt
4. A Meta Title (under 100 characters)
5. A Meta Description (under 300 characters)

Avoid keyword stuffing, AI phrases, and write naturally.

Page Type: "${pageType}"

Return JSON like:
{
  "title": "",
  "content": "<p>...</p><p>...</p>",
  "excerpt": "",
  "metaTitle": "",
  "metaDescription": ""
}
`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let message = response?.data?.choices?.[0]?.message?.content || '';

    // Cleanup formatting and smart quotes
    message = message
      .replace(/```json|```/gi, '')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();

    // Try normal JSON parse
    try {
      return JSON.parse(message);
    } catch (parseErr) {
      // Try fallback using regex if direct parsing fails
      const match = message.match(/({[\s\S]*})/);
      if (match) {
        return JSON.parse(match[1]
          .replace(/\n/g, '') // Remove newlines
          .replace(/\r/g, '') // Remove carriage returns
        );
      }

      // Final fallback
      console.error("AI static page fallback parse failed. Raw:", message);
      throw new Error("AI response not in JSON format.");
    }
  } catch (err) {
    console.error('AI Static Page Generation Error:', err?.message || err);
    return {
      title: '',
      content: '',
      excerpt: '',
      metaTitle: '',
      metaDescription: ''
    };
  }
};

const detectAIStaticContent = async (text) => {
  const prompt = `
    Is the following content written by AI or a human? Give your best guess based on tone, patterns, and structure.
    Return JSON only:
    {
      "isAI": true/false,
      "confidence": "High/Medium/Low",
      "reason": "Brief reason"
    }
    Content:
    ${text}`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0].message.content;
    const cleanJson = result
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('AI Detection Error:', err.message);
    return { isAI: false, confidence: 'Low', reason: 'Unable to verify' };
  }
};


module.exports = { 
  checkSimilarCategoryAI , 
  generateMetaForEntity ,
  validateSubcategoryContextAI , 
  generateStaticPageContent,
  detectAIStaticContent,
  checkGroupIntentAI,
  checkCategoryNameQualityAI
};