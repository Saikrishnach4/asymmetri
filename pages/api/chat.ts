import { AzureKeyCredential } from "@azure/core-auth";
import ModelClient from "@azure-rest/ai-inference";
import { isUnexpected } from "@azure-rest/ai-inference";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";
const apiKey = process.env.AZURE_MODEL_KEY;

if (!apiKey) {
  throw new Error("❌ AZURE_MODEL_KEY is not defined in environment variables");
}

const client = ModelClient(endpoint, new AzureKeyCredential(apiKey));

// ✅ Required for Vercel Edge Functions
export const config = {
  runtime: "edge",
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
      status: 405,
    });
  }

  const { message, userId } = await req.json();

  if (!message || !userId) {
    return new Response(JSON.stringify({ error: "User ID and message are required" }), {
      status: 400,
    });
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
        temperature: 0.3,
        top_p: 1,
      },
    });

    if (isUnexpected(response)) {
      console.error("Azure API Error:", response.body.error);
      return new Response(JSON.stringify({ error: "AI model response error" }), {
        status: 500,
      });
    }

    const aiMessage = response.body.choices[0]?.message?.content;

    if (!aiMessage || typeof aiMessage !== "string") {
      return new Response(JSON.stringify({ error: "Invalid response from AI model" }), {
        status: 500,
      });
    }

    await prisma.chat.create({
      data: {
        userId,
        message,
        response: aiMessage,
      },
    });

    return new Response(JSON.stringify({ response: aiMessage }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Handler Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
