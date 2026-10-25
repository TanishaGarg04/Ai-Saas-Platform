import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { connectDB } from "./db.js";
import Chat from "./models/Chat.js";
import atsRoutes from "./routes/atsRoutes.js";
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/ats", atsRoutes);
app.post("/chat/new", async (req, res) => {
  try {
    const { userEmail } = req.body;

    const chat = await Chat.create({
      userEmail,
      title: "New Chat",
      messages: [],
    });

    res.json(chat);
  } catch {
    res.status(500).json({ error: "Failed to create chat" });
  }
});

app.get("/chat/list/:email", async (req, res) => {
  try {
    const chats = await Chat.find({ userEmail: req.params.email })
      .sort({ updatedAt: -1 })
      .select("_id title updatedAt");

    res.json(chats);
  } catch {
    res.json([]);
  }
});

app.get("/chat/:id", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    res.json(chat);
  } catch {
    res.status(500).json({ error: "Failed to load chat" });
  }
});

app.post("/ai", async (req, res) => {
  try {
    let { prompt, type, userEmail, chatId } = req.body;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ result: "Please enter a message." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        result: "AI is not configured on the server. Set GROQ_API_KEY and restart the backend.",
      });
    }

    let finalPrompt = prompt;

    if (type === "blog") {
      finalPrompt = `Write a complete, useful blog post about the topic below. Follow these instructions:
- Write in the same language as the topic or request.
- Start with an engaging, specific title, then a short introduction that explains why the topic matters.
- Organize the article into 4–6 clearly named sections using Markdown ## headings.
- Explain ideas clearly with practical examples and actionable advice where relevant.
- End with a concise conclusion. Do not add an FAQ unless the topic calls for one.
- Keep the tone natural and informative; avoid filler, repeated points, and clickbait.
- Do not invent statistics, citations, quotes, or facts. If a detail is uncertain, leave it out.
- Return only the finished blog post in Markdown.

Topic or requirements:
${prompt}`;
    }

    if (type === "email") {
      finalPrompt = "Write a professional email properly formatted with subject and body: " + prompt;
    }

    if (type === "caption") {
      finalPrompt = "Write a clean social media caption with good formatting: " + prompt;
    }

    if (type === "code") {
      finalPrompt =
        "Analyze this code. Detect the language. Give improvements. Format properly using headings and code blocks:\n" +
        prompt;
    }

    if (type === "format") {
      finalPrompt =
        "Format the following code with proper indentation and style. Preserve language syntax and return only formatted code:\n" +
        prompt;
    }

    if (type === "grammar") {
      finalPrompt =
        "Correct the grammar, spelling, and clarity of this text without changing its meaning:\n" +
        prompt;
    }

    if (type === "summarize") {
      finalPrompt =
        "Summarize the following content in a concise and clear format, using short paragraphs or bullet points:\n" +
        prompt;
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        messages: [{ role: "user", content: finalPrompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply = response.data.choices[0].message.content;

    // A database outage should not discard an otherwise successful AI answer.
    try {
      if (chatId) {
        const chat = await Chat.findById(chatId);

        if (chat) {
          chat.messages.push(
            { role: "user", content: prompt },
            { role: "assistant", content: aiReply }
          );

          if (!chat.title || chat.title === "New Chat") {
            chat.title = prompt.slice(0, 35);
          }

          await chat.save();
        }
      } else if (userEmail) {
        await Chat.create({
          userEmail,
          title: prompt.slice(0, 35),
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: aiReply },
          ],
        });
      }
    } catch (saveError) {
      console.error("CHAT SAVE ERROR:", saveError.message);
    }

    res.json({ result: aiReply });
  } catch (error) {
    console.log("ERROR:", error.response?.data || error.message);
    const providerMessage = error.response?.data?.error?.message;
    res.status(error.response?.status || 500).json({
      result: providerMessage || "The AI service could not complete your request. Check the backend logs for details.",
    });
  }
});

app.get("/stats/:email", async (req, res) => {
  try {
    const chats = await Chat.find({ userEmail: req.params.email });

    const totalChats = chats.length;
    const totalMessages = chats.reduce(
      (total, chat) => total + chat.messages.length,
      0
    );

    const lastChat = chats.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    )[0];

    res.json({
      totalChats,
      totalMessages,
      lastActivity: lastChat?.updatedAt || null,
    });
  } catch {
    res.json({
      totalChats: 0,
      totalMessages: 0,
      lastActivity: null,
    });
  }
});

app.delete("/chat/:id", async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ message: "Chat deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

app.put("/chat/:id", async (req, res) => {
  try {
    const { title } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
  req.params.id,
  { title },
  { returnDocument: "after" }
);

    if (!updatedChat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json(updatedChat);
  } catch (error) {
    console.log("UPDATE ERROR:", error.message);
    res.status(500).json({ error: "Failed to update chat" });
  }
});


// 🔥 ADMIN STATS
app.get("/admin/stats", async (req, res) => {
  try {
    const totalChats = await Chat.countDocuments();

    const chats = await Chat.find();

    const totalMessages = chats.reduce(
      (acc, chat) => acc + chat.messages.length,
      0
    );

    const users = [...new Set(chats.map((c) => c.userEmail))];

    res.json({
      totalChats,
      totalMessages,
      totalUsers: users.length,
    });
  } catch {
    res.status(500).json({ error: "Admin stats error" });
  }
});


app.get("/admin/chats", async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 });
    res.json(chats);
  } catch {
    res.status(500).json([]);
  }
});

app.post("/admin/login", (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});

app.get("/admin/analytics", async (req, res) => {
  try {
    const chats = await Chat.find();

    const dailyMap = {};
    const userMap = {};

    chats.forEach((chat) => {
      const date = new Date(chat.createdAt).toLocaleDateString();

      dailyMap[date] = (dailyMap[date] || 0) + 1;

      if (chat.userEmail) {
        userMap[chat.userEmail] = (userMap[chat.userEmail] || 0) + 1;
      }
    });

    const dailyUsage = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    }));

    const chatsPerUser = Object.entries(userMap).map(([email, count]) => ({
      email,
      count,
    }));

    const mostActiveUser =
      chatsPerUser.sort((a, b) => b.count - a.count)[0] || null;

    res.json({
      dailyUsage,
      chatsPerUser,
      mostActiveUser,
    });
  } catch (error) {
    res.status(500).json({ error: "Analytics error" });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
