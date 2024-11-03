const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs'); // Keep only this declaration
require('dotenv').config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Array of problem links
const problems = [
  "https://leetcode.com/problems/two-sum/",
  "https://codeforces.com/problemset/problem/1/A",
  "https://www.hackerrank.com/challenges/solve-me-first"
];

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Path to the JSON file that stores chat IDs
const chatFilePath = './chat_ids.json';

const loadChatIds = () => {
  if (!fs.existsSync(chatFilePath)) {
    fs.writeFileSync(chatFilePath, JSON.stringify([]));
    return [];
  }

  const data = fs.readFileSync(chatFilePath, 'utf-8');
  if (data.trim() === '') {
    return [];
  }

  return JSON.parse(data);
};

// Function to save chat IDs to the JSON file
const saveChatIds = (chatIds) => {
  fs.writeFileSync(chatFilePath, JSON.stringify(chatIds, null, 2));
};

// Function to send reminders to all users
const sendReminders = () => {
  console.log("Fetching users for sending reminders...");
  const chatIds = loadChatIds();
  console.log(`Found ${chatIds.length} users in the JSON file.`);

  const message = `Reminder: Solve at least 2 problems today!\n${problems.slice(0, 2).join('\n')}`;
  chatIds.forEach(chatId => {
    console.log(`Sending message to user with chat ID: ${chatId}`);
    bot.sendMessage(chatId, message).catch(error => {
      console.error('Error sending message:', error);
    });
  });
};

// Send reminders every 30 seconds
setInterval(() => {
  console.log("Starting scheduled reminder task...");
  sendReminders();
}, 30000);

// Listen for messages and register new users
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(`Received chat ID: ${chatId}`);

  // Load the current chat IDs from the JSON file
  let chatIds = loadChatIds();
  console.log("Existing chat IDs:", chatIds);

  if (!chatIds.includes(chatId)) {
    chatIds.push(chatId);
    saveChatIds(chatIds);
    console.log(`Added new chat ID to JSON file: ${chatId}`);
    bot.sendMessage(chatId, "You have been registered for reminders!");
  } else {
    console.log(`Chat ID ${chatId} already exists.`);
  }
});

// GET endpoint for root
app.get('/', (req, res) => {
  console.log("Received request on root endpoint.");
  res.send('Welcome to the Telegram Bot API!');
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
