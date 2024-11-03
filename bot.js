const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs'); // Keep only this declaration
require('dotenv').config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Path to the JSON file that stores chat IDs
const chatFilePath = './chat_ids.json';

// Path to the text file with problem links
const problemsFilePath = './problems.txt';

// Array to store problem links loaded from the file
let problems = [];
let problemIndex = 0; // Track the next problem to send

// Load problems from the text file
const loadProblems = () => {
  try {
    const data = fs.readFileSync(problemsFilePath, 'utf-8');
    problems = data.trim().split('\n').filter(line => line); // Each line is a problem link
  } catch (error) {
    console.error('Error loading problems:', error);
  }
};

// Function to load chat IDs from JSON
const loadChatIds = () => {
  if (!fs.existsSync(chatFilePath)) {
    fs.writeFileSync(chatFilePath, JSON.stringify([]));
    return [];
  }

  const data = fs.readFileSync(chatFilePath, 'utf-8');
  return data.trim() ? JSON.parse(data) : [];
};

// Function to save chat IDs to the JSON file
const saveChatIds = (chatIds) => {
  fs.writeFileSync(chatFilePath, JSON.stringify(chatIds, null, 2));
};

// Function to send reminders with the next two problems
const sendReminders = () => {
  console.log("Fetching users for sending reminders...");
  const chatIds = loadChatIds();
  console.log(`Found ${chatIds.length} users in the JSON file.`);

  // Select the next two problems without repetition
  const selectedProblems = [];
  for (let i = 0; i < 2; i++) {
    if (problemIndex >= problems.length) {
      problemIndex = 0; // Reset index if we've reached the end
    }
    selectedProblems.push(problems[problemIndex]);
    problemIndex++;
  }

  const message = `Reminder: Solve at least 2 problems today!\n${selectedProblems.join('\n')}`;
  chatIds.forEach(chatId => {
    console.log(`Sending message to user with chat ID: ${chatId}`);
    bot.sendMessage(chatId, message).catch(error => {
      console.error('Error sending message:', error);
    });
  });
};

// Load problems from file at startup
loadProblems();

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
