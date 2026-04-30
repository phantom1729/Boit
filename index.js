const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Aryan Bot is Running'));
app.listen(PORT, () => console.log(`Dummy server running on ${PORT}`));

// इसके नीचे तेरा बॉट वाला कोड जैसे का तैसा
require('dotenv').config();
const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ANSHUMAN_ID = process.env.ANSHUMAN_TELEGRAM_ID;

let chatHistory = [
  {
    role: "system",
    content: `Tu assitant hai aryan ka jaisa wo log bolta hai waisa kro koi extra thing nhi lana wo log jo information diya hai utana pe hi help karna jaisa bole waissa karna  har batt mannna  batana mat ki ai ho bolna main Aryan patel ke dwara banaya gaya hu.`
  }
];

// ===== PART 1: ANSHUMAN REPLY KARE TO BOT REPLY KAREGA =====
bot.on('text', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userMessage = ctx.message.text;

  // Sirf Anshuman ko reply
  if (userId!== ANSHUMAN_ID) {
    return; // Chup reh, kisi aur ko reply nahi
  }

  try {
    await ctx.sendChatAction('typing');
    chatHistory.push({ role: "user", content: userMessage });

    if (chatHistory.length > 11) {
      chatHistory = [chatHistory[0],...chatHistory.slice(-10)];
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: chatHistory,
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });

    const aiReply = chatCompletion.choices[0]?.message?.content || "Thik hai.";
    chatHistory.push({ role: "assistant", content: aiReply });
    await ctx.reply(aiReply);

  } catch (error) {
    console.error("Error:", error);
    await ctx.reply("Thoda network issue hai, ruk ja.");
  }
});

// ===== PART 2: BOT KHUD SE MESSAGE MAAREGA =====

// Function: Crock khud se Groq se puchke message bheje
async function crockAutoSend(reason) {
  try {
    const prompt = `
    Tu Aryan hai. Abhi situation: ${reason}
    Time: ${new Date().toLocaleTimeString('en-IN', {timeZone: 'Asia/Kolkata'})}
    Anshuman ko 1 line ka message bhejna hai. Tone: casual, founder wala, supportive.
    Sirf message de, extra kuch nahi.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
    });

    const autoMsg = chatCompletion.choices[0]?.message?.content || "Kaam pe lag ja bhai";

    // Sirf Anshuman ko bhejo
    await bot.telegram.sendMessage(ANSHUMAN_ID, `🤖 ${autoMsg}`);
    console.log('Auto message sent:', autoMsg);

  } catch (error) {
    console.error("Auto send error:", error);
  }
}

// Trigger 1: Bot start hote hi 1 message
setTimeout(() => {
  crockAutoSend("Bot abhi start hua hai, Anshuman ko good morning bol");
}, 5000); // 5 sec baad

// Trigger 2: Har 6 ghante mein reminder
setInterval(() => {
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 21) { // Din mein 9 AM se 9 PM tak hi
    crockAutoSend("6 ghante ho gaye, Anshuman ko kaam ka reminder de");
  }
}, 6 * 60 * 60 * 1000); // 6 ghante

// Trigger 3: Roz raat 10 baje daily update maang
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 22 && now.getMinutes() === 0) { // Raat 10:00
    crockAutoSend("Raat 10 baj gaye, Anshuman se aaj ka update maang");
  }
}, 60 * 1000); // Har minute check karo 10 baje hai ya nahi

bot.launch();
console.log('Aryan Anshuman Bot chalu. Reply + Auto dono mode ON.');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
