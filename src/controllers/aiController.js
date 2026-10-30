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
      { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", badge: "Smart & Fast", status: "Available", category: "General" },
      { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "Anthropic", badge: "Coding", status: "Available", category: "Code & Logic" },
      { id: "deepseek/deepseek-chat", name: "DeepSeek V3", provider: "DeepSeek", badge: "Reasoning", status: "Available", category: "Math & Reasoning" },
      { id: "qwen/qwen3.8-27b", name: "Qwen 3.8 27B", provider: "Groq", badge: "0.5s Ultra Fast", status: "Available", category: "LPU Engine" },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", provider: "Meta", badge: "Speed", status: "Available", category: "Open Source" },
      { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "Google", badge: "Multimodal", status: "Available", category: "Vision & General" },
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
        message: "Prompt or image is required.",
      });
    }

    // 1. Handle Image Generation mode
    if (mode === "image" || prompt?.toLowerCase().startsWith("/image ") || prompt?.toLowerCase().startsWith("generate image:")) {
      const cleanPrompt = prompt.replace(/^\/image\s+/i, "").replace(/^generate image:\s*/i, "").trim();
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

    // 2. Routing logic
    if (model.includes("qwen") && !model.includes("qwen-2.5")) {
      reply = await generateGroqResponse(prompt, model);
    } else if (model.startsWith("gemini") && !image) {
      reply = await generateGeminiResponse(prompt, model, image);
    } else {
      // Handles GPT-4o Mini, Claude Haiku, DeepSeek, Llama, and multimodal images via OpenRouter
      reply = await generateOpenRouterResponse(prompt, model, image);
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
