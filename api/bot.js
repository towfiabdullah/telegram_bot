const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs'); // Keep only this declaration
require('dotenv').config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN);

// Array of problem links, loaded from a file
let problems = [];
let problemIndex = 0;

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Path to the JSON file that stores chat IDs
const chatFilePath = './chat_ids.json';
const problemsFilePath = './problems.txt';

// Load problems from text file
const loadProblems = () => {
  try {
    const data = fs.readFileSync(problemsFilePath, 'utf-8');
    problems = data.trim().split('\n').filter(line => line); // Each line is a problem link
  } catch (error) {
    console.error('Error loading problems:', error);
  }
};

// Load chat IDs from JSON
const loadChatIds = () => {
  if (!fs.existsSync(chatFilePath)) {
    fs.writeFileSync(chatFilePath, JSON.stringify([]));
    return [];
  }

  const data = fs.readFileSync(chatFilePath, 'utf-8');
  return data.trim() ? JSON.parse(data) : [];
};

// Save chat IDs to JSON
const saveChatIds = (chatIds) => {
  fs.writeFileSync(chatFilePath, JSON.stringify(chatIds, null, 2));
};

// Function to send reminders with the next two problems
const sendReminders = () => {
  console.log("Fetching users for sending reminders...");
  const chatIds = loadChatIds();
  console.log(`Found ${chatIds.length} users in the JSON file.`);

  const selectedProblems = [];
  for (let i = 0; i < 2; i++) {
    if (problemIndex >= problems.length) {
      problemIndex = 0;
    }
    selectedProblems.push(problems[problemIndex]);
    problemIndex++;
  }

  const message = `Reminder: Solve at least 2 problems today!\n${selectedProblems.join('\n')}`;
  chatIds.forEach(chatId => {
    bot.sendMessage(chatId, message).catch(error => {
      console.error('Error sending message:', error);
    });
  });
};

// Load problems at startup
loadProblems();

// Webhook endpoint to register new users and receive messages
app.post('/webhook', (req, res) => {
  console.log('Webhook triggered:', req.body);

  const chatId = req.body.message?.chat?.id;
  if (!chatId) {
    return res.sendStatus(400);
  }

  // Register the user
  let chatIds = loadChatIds();
  if (!chatIds.includes(chatId)) {
    chatIds.push(chatId);
    saveChatIds(chatIds);
    bot.sendMessage(chatId, "You have been registered for reminders!");
  }

  res.sendStatus(200);
});

// Trigger reminders every 30 seconds
setInterval(() => {
  console.log("Starting scheduled reminder task...");
  sendReminders();
}, 30000);

// Vercel-friendly server
app.get('/', (req, res) => {
  res.send("Welcome to the Telegram Bot API!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Set webhook for Telegram
  const url = `${process.env.VERCEL_URL || `http://localhost:${PORT}`}/api/webhook`;
  await bot.setWebHook(url);
  console.log(`Webhook set to ${url}`);
});
