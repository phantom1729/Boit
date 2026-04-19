 const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// your existing bot code below
console.log('Bot chalu ho gaya. Auto-reply on hai.'); require('dotenv').config();
const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Yahan Anshuman ki chat history save hogi
let chatHistory = [
  {
    role: "system",
    content: `Tu Aryan hai. Tu Anshuman se Telegram pe baat kar raha hai.
    Tum dono ek app bana rahe ho. Aryan Founder ceo hai, Anshumanbas sath raha suport me  hai.
    Anshuman thoda insecure hai aur izzat chahta hai.
    Tera kaam: Hamesha naram, samjhaane wali, aur clear baat karna.
    Ladai nahi karni. Par Aryan ka point bhi rakhna hai.
    Kabhi "AI hun" mat bolna. Tu Aryan hi hai.
    Reply chhota rakh, 2-3 line max. WhatsApp style mein.`
  }
];

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;

  // Sirf Anshuman ko auto-reply. Baaki ko normal.
  if (userId!= process.env.ANSHUMAN_TELEGRAM_ID) {
    return ctx.reply("Bhai ye bot sirf Anshuman ke liye hai.");
  }

  try {
    // Typing dikhao taaki real lage
    await ctx.sendChatAction('typing');

    // History mein naya message jodo
    chatHistory.push({ role: "user", content: userMessage });

    // History lambi na ho isliye last 10 message hi rakho
    if (chatHistory.length > 11) {
      chatHistory = [chatHistory[0],...chatHistory.slice(-10)];
    }

    // AI se reply mangao
    const chatCompletion = await groq.chat.completions.create({
      messages: chatHistory,
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });

    const aiReply = chatCompletion.choices[0]?.message?.content || "Hmm samjha.";

    // History mein AI ka reply bhi save karo
    chatHistory.push({ role: "assistant", content: aiReply });

    // Seedha bhej do Anshuman ko. Koi approval nahi.
    await ctx.reply(aiReply);

  } catch (error) {
    console.error("Error:", error);
    await ctx.reply("Network issue hai bhai, 2 min baad try kar.");
  }
});

bot.launch();
console.log('Bot chalu ho gaya. Auto-reply on hai.');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
