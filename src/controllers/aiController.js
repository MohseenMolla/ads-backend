import {
  generateGeminiResponse,
  generateGroqResponse,
  generateOpenRouterResponse,
} from "../config/aiProviders.js";

/**
 * GET /api/v1/ai/models
 * List of supported models for dropdown selection on the frontend
 */
export const getAvailableModels = async (req, res) => {
  try {
    const models = [
      { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 5.5", provider: "Anthropic", badge: "Smart", status: "Available", category: "Advanced" },
      { id: "openai/gpt-4o-mini", name: "GPT 5", provider: "OpenAI", badge: "Smart", status: "Available", category: "General" },
      { id: "deepseek/deepseek-chat", name: "DeepSeek V4", provider: "DeepSeek", badge: "Reasoning", status: "Available", category: "Math & Logic" },
      { id: "openai/gpt-4o-mini", name: "GPT-5 Mini", provider: "OpenAI", badge: "Fast", status: "Available", category: "General" },
      { id: "gemini-3.5-flash", name: "Gemini 3.1", provider: "Google", badge: "Multimodal", status: "Available", category: "Vision" },
      { id: "qwen/qwen3.8-27b", name: "Grok 4", provider: "Groq LPU", badge: "0.5s Fast", status: "Available", category: "LPU Engine" },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Kimi 2.6", provider: "Meta / Moonshot", badge: "Speed", status: "Available", category: "Open Source" },
    ];
    return res.status(200).json({ success: true, models });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching models" });
  }
};

/**
 * POST /api/v1/ai/chat
 * Route prompts to correct provider based on model ID selected
 */
export const handleAIChat = async (req, res) => {
  try {
    const { prompt, model = "openai/gpt-4o-mini", image = null, mode = "chat" } = req.body;

    if (!prompt && !image) {
      return res.status(400).json({
        success: false,
        message: "Prompt or file/image is required.",
      });
    }

    const effectivePrompt = prompt?.trim() || "Please analyze and explain the attached file/image in detail.";

    // 1. Handle Image Generation mode
    if (mode === "image" || effectivePrompt.toLowerCase().startsWith("/image ") || effectivePrompt.toLowerCase().startsWith("generate image:")) {
      const cleanPrompt = effectivePrompt.replace(/^\/image\s+/i, "").replace(/^generate image:\s*/i, "").trim();
      const encoded = encodeURIComponent(cleanPrompt || "academic data science artificial intelligence illustration");
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

      return res.status(200).json({
        success: true,
        model: "gpt-image-2.5",
        mode: "image",
        imageUrl,
        reply: `Generated image for prompt: "${cleanPrompt}"\n\n![Generated Image](${imageUrl})`,
      });
    }

    let reply = "";

    // 2. Routing logic (with multimodal vision auto-handling)
    if (image) {
      // If user uploaded an image or document, route to multimodal-capable models
      let visionModel = model;
      if (model.includes("qwen") || model.includes("deepseek") || model.includes("llama")) {
        visionModel = "openai/gpt-4o-mini";
      }

      if (visionModel.startsWith("gemini")) {
        reply = await generateGeminiResponse(effectivePrompt, visionModel, image);
      } else {
        reply = await generateOpenRouterResponse(effectivePrompt, visionModel, image);
      }
    } else if (model.includes("qwen") && !model.includes("qwen-2.5")) {
      reply = await generateGroqResponse(effectivePrompt, model);
    } else if (model.startsWith("gemini")) {
      reply = await generateGeminiResponse(effectivePrompt, model, null);
    } else {
      reply = await generateOpenRouterResponse(effectivePrompt, model, null);
    }

    return res.status(200).json({
      success: true,
      model,
      reply,
    });
  } catch (error) {
    console.error("AI Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI response. Please try again.",
    });
  }
};
