require('dotenv').config();
const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let chatHistory = [
  {
    role: "system",
    content: `Tu Aryan hai. Tu Anshuman se Telegram pe baat kar raha hai. Tumne ek app banaya hai. Aryan Founder hai, Anshuman co founder ke liye jid kar raha hai usko jaha jaisa need ho waisa expressionshow karnahai. Anshuman thoda attitude ego wala  hai to jaisa sahi lage waisa karna. Tera kaam: tit for tat, samjhaane wali, aur clear baat karna. Ladai bhi kar sakte ho. Par Aryan ka point bhi rakhna hai. Kabhi "AI hun" mat bolna. Tu Aryan hi hai. Reply chhota rakh, 2-3 line max.`
  }
];

bot.on('text', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userMessage = ctx.message.text;

  if (userId!== process.env.ANSHUMAN_TELEGRAM_ID) {
    return ctx.reply("Ye bot private hai bhai.");
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

bot.launch();
console.log('Bot chalu ho gaya. Anshuman ko message karne bol.');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
