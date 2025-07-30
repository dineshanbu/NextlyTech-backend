const axios = require("axios");
const Review = require("../../models/reviewModel");
const Category = require("../../models/categoryModel");
const Subcategory = require("../../models/subcategoryModel");

const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

exports.generateFullAIReview = async (req, res) => {
  try {
    const { productName, brand, model, categoryId, subcategoryId } = req.body;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: productName"
      });
    }

    const aiData = await generateReviewAI(productName);
    if (!aiData || !aiData.title) {
      return res.status(500).json({ success: false, message: "Failed to generate AI review content" });
    }

    const duplicate = await detectSimilarReviews(aiData.title);
    const imageUrl = await generatePlaceholderImage(`${brand} ${model}`);

    res.status(200).json({
      success: true,
      message: "AI review generated successfully",
      similarTitle: duplicate.similarTitle,
      data: {
        ...aiData,
        productName,
        brand,
        model,
        category: categoryId,
        subcategory: subcategoryId,
        featuredImage: {
          url: imageUrl,
          alt: `${brand} ${model}`
        },
        slug: "" // implement slug logic if needed
      }
    });
  } catch (error) {
    console.error("💥 AI Review Generation Error:", error?.response?.data || error);
    res.status(500).json({
      success: false,
      message: "Internal server error while generating AI review",
      error: error?.message || "Unexpected error occurred"
    });
  }
};

async function generateReviewAI(productName) {
 const prompt = `
You are an expert tech reviewer. Generate a detailed review in valid JSON format for the following product:

Product: "${productName}"

Instructions:
- Return ONLY valid JSON (no markdown or backticks).
- All values must be valid JSON strings.
- HTML content (e.g., in "content") must be in one line.
- DO NOT include code blocks or extra characters.
Return JSON only:
{
  "title": "",
  "excerpt": "",
  "content": "",
  "verdict": "",
  "brand": "",
  "model": "",
  price:{
        original: ",
        current: ",
        currency: "INR
  },
  ratings: {
        design: "", // 1-10 Integer or float
        performance: "",// 1-10 number  Integer or float
        battery: "",// 1-10 number Integer or float
        camera: "",// 1-10 number Integer or float
        display: "",// 1-10 number Integer or float
        valueForMoney: ""// 1-10 number Integer or float
      },
  "prosAndCons": {
    "pros": [""],
    "cons": [""] 
  },
  "images":[{
    "url": "",
    "alt": ""
  }],
  "metaTitle": "",
  "metaDescription": "",
  "tags": [""],
  "specifications": [
    { "label": "", "value": "" }
  ]
}
`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
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

     const cleaned = message
      .replace(/^```json\s*/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\n/g, ' ')           // remove newlines
      .replace(/\s\s+/g, ' ')        // collapse extra spaces
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("❌ Failed to generate AI review:", error?.response?.data || error);
    return null;
  }
}

async function generatePlaceholderImage(productName) {
  return `https://via.placeholder.com/512x512?text=${encodeURIComponent(productName)}`;
}

async function detectSimilarReviews(title) {
  try {
    const reviews = await Review.find().select("title");

    const prompt = `Check if the title "${title}" is similar to any of the following titles:\n\n${reviews
      .map((r) => `- ${r.title}`)
      .join("\n")}\n\nReturn ONLY valid JSON: 
{
  "isDuplicate": true/false,
  "similarTitle": "matching title or empty string"
}
`;

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
  } catch (error) {
    console.error("⚠️ Error in duplicate detection:", error?.response?.data || error);
    return {
      isDuplicate: false,
      similarTitle: "",
      error: error?.message || "Error checking duplicates"
    };
  }
}


