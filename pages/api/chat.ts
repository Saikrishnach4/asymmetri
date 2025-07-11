import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4o";
const token = process.env.GITHUB_TOKEN;
if (!token) {
  throw new Error("GITHUB_TOKEN environment variable is not set");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { message, userId } = req.body;
  if (!message || !userId) {
    return res.status(400).json({ error: "User ID and message are required" });
  }

  try {
    const client = ModelClient(endpoint, new AzureKeyCredential(token as string));
    const response = await client.path("/chat/completions").post({
      body: {
        model,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI that generates valid HTML and CSS code."
          },
          {
            role: "user",
            content: `Generate a complete HTML and CSS code snippet for: ${message}. \nEnsure the response is wrapped inside <style> and <html> properly.`
          }
        ],
        temperature: 0.7,
        top_p: 1
      }
    });

    if (isUnexpected(response)) {
      console.error("Model API returned unexpected response:", response.body);
      throw response.body.error;
    }

    console.log("Model API response body:", response.body);
    const aiMessage = response.body.choices[0].message.content;
    if (!aiMessage) {
      throw new Error("No message content returned from model");
    }

    // Store chat in the database
    await prisma.chat.create({
      data: {
        userId,
        message,
        response: aiMessage,
      },
    });

    res.status(200).json({ message: aiMessage });
  } catch (error) {
    console.error("API Error (full object):", error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message, stack: error.stack });
    } else {
      res.status(500).json({ error: JSON.stringify(error) });
    }
  }
}
