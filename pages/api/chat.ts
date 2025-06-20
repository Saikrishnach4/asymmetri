import { AzureKeyCredential } from "@azure/core-auth";
import ModelClient from "@azure-rest/ai-inference";
import { isUnexpected } from "@azure-rest/ai-inference";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const endpoint = "https://models.github.ai/inference"; // ✅ Your Azure-hosted endpoint
const model = "openai/gpt-4.1"; // ✅ New model reference
const client = ModelClient(endpoint, new AzureKeyCredential(process.env.AZURE_MODEL_KEY));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { message, userId } = req.body;
  if (!message || !userId) {
    return res.status(400).json({ error: "User ID and message are required" });
  }

  try {
    const response = await client.path("/chat/completions").post({
      body: {
        model,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI that generates valid HTML and CSS code.",
          },
          {
            role: "user",
            content: `Generate a complete HTML and CSS code snippet for: ${message}. 
            Ensure the response is wrapped inside <style> and <html> properly.`,
          },
        ],
        temperature: 0.7,
        top_p: 1,
      },
    });

    if (isUnexpected(response)) {
      console.error("Azure API Error:", response.body.error);
      return res.status(500).json({ error: "AI model response error" });
    }

    const aiMessage = response.body.choices[0].message.content;

    // Save to DB
    await prisma.chat.create({
      data: {
        userId,
        message,
        response: aiMessage,
      },
    });

    res.status(200).json({ message: aiMessage });
  } catch (error) {
    console.error("Handler Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
