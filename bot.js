const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const botToken = process.env.BOT_TOKEN; // Set this in Vercel later
const chatId = process.env.CHAT_ID;     // Set this in Vercel later

const bot = new TelegramBot(botToken, { polling: true });

const problems = [
    "https://leetcode.com/problems/two-sum/",
    "https://codeforces.com/problemset/problem/1/A",
    "https://www.hackerrank.com/challenges/solve-me-first"
];

const sendNotification = () => {
    const message = `Reminder: Solve at least 2 problems today!\n${problems.slice(0, 2).join('\n')}`;
    bot.sendMessage(chatId, message);
};

setInterval(sendNotification, 30000);
