const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN);

// Array to hold chat IDs of users who have interacted with the bot
let chatIds = [];

// Middleware to parse incoming requests
app.use(bodyParser.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
    const chatId = req.body.message.chat.id;

    // Check if chatId is already in the array, if not, add it
    if (!chatIds.includes(chatId)) {
        chatIds.push(chatId);
    }

    // Send a reminder to all users every 30 seconds
    setInterval(() => {
        const message = `Reminder: Solve at least 2 problems today!\n${problems.slice(0, 2).join('\n')}`;
        chatIds.forEach(id => {
            bot.sendMessage(id, message).catch(error => {
                console.error('Error sending message:', error);
            });
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
