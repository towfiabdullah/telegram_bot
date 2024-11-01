const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN);

const problems = [
    "https://leetcode.com/problems/two-sum/",
    "https://codeforces.com/problemset/problem/1/A",
    "https://www.hackerrank.com/challenges/solve-me-first"
];

// Middleware to parse incoming requests
app.use(bodyParser.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
    const chatId = req.body.message.chat.id;

    // Send a reminder every 30 seconds
    setInterval(() => {
        const message = `Reminder: Solve at least 2 problems today!\n${problems.slice(0, 2).join('\n')}`;
        bot.sendMessage(chatId, message).catch(error => {
            console.error('Error sending message:', error);
        });
    }, 30000);

    res.sendStatus(200);
});


// GET endpoint for root
app.get('/', (req, res) => {
    res.send('Welcome to the Telegram Bot API!'); // or any message you prefer
});



// Set webhook URL
bot.setWebHook(`${process.env.VERCEL_URL}/webhook`);

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
