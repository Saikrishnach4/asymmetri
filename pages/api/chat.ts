import { PrismaClient } from "@prisma/client";
import axios, { AxiosError } from "axios";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { message, userId } = req.body;
  if (!message || !userId) {
    return res.status(400).json({ error: "User ID and message are required" });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo-0613",
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
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Asymmetri Landing Page Generator",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      return res.status(500).json({ error: "Invalid API response structure" });
    }

    const aiMessage = response.data.choices[0].message.content;

    // Store chat in the database
    await prisma.chat.create({
      data: {
        userId,
        message,
        response: aiMessage,
      },
    });

    res.status(200).json({ message: aiMessage });
  } catch (error: unknown) {
    const err = error as AxiosError;

    console.error("API Error:", err.response?.data || err.message);

    res.status(500).json({ error: "Internal server error" });
  }
}
