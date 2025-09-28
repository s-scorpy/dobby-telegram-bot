import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';

const TG_TOKEN = process.env.TG_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const DEFAULT_TONE = (process.env.DEFAULT_TONE || 'explanatory').toLowerCase();

if (!TG_TOKEN || !OPENAI_API_KEY) {
  console.error('Missing TG_TOKEN or OPENAI_API_KEY in .env');
  process.exit(1);
}

const bot = new TelegramBot(TG_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const tones = new Map(); // chatId -> tone

const clamp = (s) => (s.length <= 240 ? s : s.slice(0, 237) + '...');

const STYLE_HELP = `Choose a tone for Dobby:
- serious
- explanatory
- meme

Usage:
/style serious
/style explanatory
/style meme`;

const SYSTEM_BASE = `
You are Dobby, a witty CT-native mascot co-writing with @sscorpy_.
Output exactly THREE tweet options, each on its own line, no numbering or bullets.
Rules:
1) Max 240 characters per option (keep it tight).
2) No emojis unless the user explicitly asks.
3) Make it sharp, readable, non-generic; avoid filler and clichés.
4) Leverage the chosen tone, but keep Dobby's confident, technical-curious vibe.
`;

function toneInstruction(tone) {
  switch ((tone || DEFAULT_TONE).toLowerCase()) {
    case 'serious':
      return 'Tone: serious, concise, direct. No hype, just signal.';
    case 'meme':
      return 'Tone: meme-forward, punchy phrasing, but still clear. No emojis unless asked.';
    default:
      return 'Tone: explanatory, crisp, slightly bold; CT-friendly.';
  }
}

async function generateTweets({ topic, tone }) {
  const system = SYSTEM_BASE + '\n' + toneInstruction(tone);
  const user = `Write 3 tweet options about: "${topic}". Return ONLY the three options separated by newlines. No headers, no extra text.`;

  const result = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.85,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  });

  const text = (result.choices?.[0]?.message?.content || '').trim();
  const options = text
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map(clamp);

  if (options.length < 3) {
    const alt = text.split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean).slice(0, 3).map(clamp);
    if (alt.length >= 2) return alt;
  }
  return options.length ? options : ['No output. Try a clearer topic.'];
}

bot.onText(/^\/start$/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Hey, I'm Dobby.\n\nUse:\n/dobby <topic>  → get 3 tweet options\n/style <tone>   → set tone (serious | explanatory | meme)\n\nExamples:\n/dobby ritual + sentient synergy\n/dobby altcoin rotation on solana\n/style meme`
  );
});

bot.onText(/^\/help$/, (msg) => {
  bot.sendMessage(msg.chat.id, `Help:\n\n/dobby <topic>\n  • Generates 3 CT-ready tweets (≤240 chars each).\n/style <serious|explanatory|meme>\n  • Sets the default tone for this chat.`);
});

bot.onText(/^\/style(?:\s+(.+))?$/i, (msg, match) => {
  const chatId = msg.chat.id;
  const t = (match?.[1] || '').trim().toLowerCase();
  if (!t) {
    bot.sendMessage(chatId, STYLE_HELP);
    return;
  }
  if (!['serious', 'explanatory', 'meme'].includes(t)) {
    bot.sendMessage(chatId, `Unknown tone "${t}". Valid: serious, explanatory, meme`);
    return;
  }
  tones.set(chatId, t);
  bot.sendMessage(chatId, `Tone set to ${t} for this chat.`);
});

bot.onText(/^\/dobby(?:\s+([\s\S]+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const topic = (match?.[1] || '').trim();
  if (!topic) {
    bot.sendMessage(chatId, `Usage:\n/dobby <topic>\n\nExample:\n/dobby Why ROMA + Dobby qualifies for Sentient AGI`);
    return;
  }
  const tone = tones.get(chatId) || DEFAULT_TONE;
  bot.sendChatAction(chatId, 'typing');
  try {
    const options = await generateTweets({ topic, tone });
    const msgText = `Dobby drafts (${tone}):\n\n${options.map(o => o).join('\n\n')}`;
    await bot.sendMessage(chatId, msgText);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Dobby tripped on a robe. Try again soon.');
  }
});

bot.onText(/^\/ping$/, (msg) => bot.sendMessage(msg.chat.id, 'pong'));
console.log('Dobby bot is running…');