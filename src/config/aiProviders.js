import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

let geminiClient = null;
const getGeminiClient = () => {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
    });
  }
  return geminiClient;
};

let groqClient = null;
const getGroqClient = () => {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY || "",
    });
  }
  return groqClient;
};

// Helper: Pause execution for delay ms
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Normalizes Gemini model names
const normalizeGeminiModel = (name) => {
  if (!name || name === "gemini-2.5-flash" || name === "gemini-2.0-flash" || name.includes("1.5")) {
    return "gemini-3.5-flash";
  }
  return name;
};

/**
 * 1. OpenRouter Provider (Claude, DeepSeek, GPT-4o Mini, Llama 3.3, Qwen)
 */
export const generateOpenRouterResponse = async (prompt, modelName = "openai/gpt-4o-mini", image = null) => {
  const openRouterKey = process.env.OPENROUTER_API_KEY || "";

  if (!openRouterKey) {
    console.warn("[OpenRouter] OPENROUTER_API_KEY missing. Trying Groq fallback.");
    return await generateGroqResponse(prompt, "qwen/qwen3.8-27b");
  }

  // Normalize model slug to active OpenRouter models
  let activeModel = modelName;
  if (!activeModel || activeModel === "gemini-3.5-flash") {
    activeModel = "openai/gpt-4o-mini";
  } else if (activeModel.includes("deepseek")) {
    activeModel = "deepseek/deepseek-chat";
  } else if (activeModel.includes("claude")) {
    activeModel = "anthropic/claude-haiku-4.5";
  } else if (activeModel.includes("llama")) {
    activeModel = "meta-llama/llama-3.3-70b-instruct";
  }

  // Build message content (multimodal if image is attached)
  let messageContent = prompt;
  if (image && image.data && image.mimeType) {
    messageContent = [
      { type: "text", text: prompt || "Analyze this image and describe what you see." },
      {
        type: "image_url",
        image_url: {
          url: `data:${image.mimeType};base64,${image.data}`,
        },
      },
    ];
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "ADS 251 AI Platform",
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: "user", content: messageContent }],
        max_tokens: 2048,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "OpenRouter Request Failed");
    }

    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.warn(`[OpenRouter Error on ${activeModel}] ${error.message}. Falling back to Groq.`);
    return await generateGroqResponse(prompt, "qwen/qwen3.8-27b");
  }
};

/**
 * 2. Groq Provider (Fast LPU inference)
 */
export const generateGroqResponse = async (prompt, modelName = "qwen/qwen3.8-27b") => {
  const groqKey = process.env.GROQ_API_KEY || "";

  if (!groqKey || !groqKey.startsWith("gsk_")) {
    console.warn("[Groq] Invalid Groq key. Falling back to OpenRouter GPT-4o Mini.");
    return await generateOpenRouterResponse(prompt, "openai/gpt-4o-mini");
  }

  const client = getGroqClient();

  // Active Groq models on account
  let targetModel = modelName;
  if (!targetModel || targetModel.includes("llama") || targetModel.includes("gemini")) {
    targetModel = "qwen/qwen3.8-27b";
  }

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: targetModel,
      temperature: 0.7,
      max_tokens: 2048,
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.warn(`[Groq Error on ${targetModel}] ${error.message}. Falling back to OpenRouter.`);
    return await generateOpenRouterResponse(prompt, "openai/gpt-4o-mini");
  }
};

/**
 * 3. Gemini Provider (Google) with Multimodal Image Support and Quota Auto-Fallback
 */
export const generateGeminiResponse = async (
  prompt,
  modelName = "gemini-3.5-flash",
  image = null
) => {
  const client = getGeminiClient();
  const primaryModel = normalizeGeminiModel(modelName);

  // Prepare multimodal content if image is attached
  let contents = prompt;
  if (image && image.data && image.mimeType) {
    contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: image.mimeType,
              data: image.data,
            },
          },
          { text: prompt || "Analyze this image in detail and answer any relevant questions." },
        ],
      },
    ];
  }

  try {
    const response = await client.models.generateContent({
      model: primaryModel,
      contents,
    });
    if (response && response.text) {
      return response.text;
    }
  } catch (error) {
    const isExhausted =
      error?.status === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("Quota exceeded") ||
      error?.message?.includes("RESOURCE_EXHAUSTED");

    if (isExhausted) {
      console.warn("[Gemini Quota Exceeded] Google Free Tier daily limit reached. Seamlessly routing through OpenRouter GPT-4o Mini.");
      return await generateOpenRouterResponse(prompt, "openai/gpt-4o-mini", image);
    }

    console.warn(`[Gemini Error on ${primaryModel}] ${error.message}. Trying OpenRouter fallback.`);
    return await generateOpenRouterResponse(prompt, "openai/gpt-4o-mini", image);
  }

  return await generateOpenRouterResponse(prompt, "openai/gpt-4o-mini", image);
};
