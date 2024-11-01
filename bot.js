const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// MongoDB connection URI
const uri = process.env.MONGODB_URI; // Ensure your .env has this variable set
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Array of problem links
const problems = [
    "https://leetcode.com/problems/two-sum/",
    "https://codeforces.com/problemset/problem/1/A",
    "https://www.hackerrank.com/challenges/solve-me-first"
];

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Function to connect to MongoDB
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    return client.db("yourDatabaseName"); // Specify your database name
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

// Function to send reminders to all users
const sendReminders = async (db) => {
  const message = `Reminder: Solve at least 2 problems today!\n${problems.slice(0, 2).join('\n')}`;
  const users = await db.collection('users').find().toArray();
  users.forEach(user => {
    bot.sendMessage(user.chatId, message).catch(error => {
      console.error('Error sending message:', error);
    });
  });
};

// Send reminders every 30 seconds
setInterval(async () => {
  const db = await connectToDatabase();
  await sendReminders(db);
}, 30000);

// Webhook endpoint to register new users
app.post('/webhook', async (req, res) => {
    const chatId = req.body.message.chat.id;

    // Attempt to connect to the database
    const db = await connectToDatabase();
    if (!db) {
        console.error('Database connection failed. Aborting webhook processing.');
        return res.status(500).send('Database connection failed.');
    }

    try {
        const userExists = await db.collection('users').findOne({ chatId });
        if (!userExists) {
            await db.collection('users').insertOne({ chatId });
            console.log(`Added new user with chat ID: ${chatId}`);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET endpoint for root
app.get('/', (req, res) => {
  res.send('Welcome to the Telegram Bot API!');
});

// Set webhook URL
bot.setWebHook(`${process.env.VERCEL_URL}/webhook`);

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
