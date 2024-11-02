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
    console.log("Attempting to connect to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB successfully.");
    return client.db("yourDatabaseName"); // Specify your database name
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

// Function to send reminders to all users
const sendReminders = async (db) => {
  try {
    console.log("Fetching users from MongoDB for sending reminders...");
    const users = await db.collection('users').find().toArray();
    console.log(`Found ${users.length} users in the database.`);
    
    const message = `Reminder: Solve at least 2 problems today!\n${problems.slice(0, 2).join('\n')}`;
    users.forEach(user => {
      console.log(`Sending message to user with chat ID: ${user.chatId}`);
      bot.sendMessage(user.chatId, message).catch(error => {
        console.error('Error sending message:', error);
      });
    });
  } catch (error) {
    console.error('Error in sendReminders function:', error);
  }
};

// Send reminders every 30 seconds
setInterval(async () => {
  console.log("Starting scheduled reminder task...");
  const db = await connectToDatabase();
  if (db) {
    await sendReminders(db);
  } else {
    console.error("Skipping reminders: No database connection available.");
  }
}, 30000);

// Webhook endpoint to register new users
app.post('/webhook', async (req, res) => {
    const chatId = req.body.message.chat.id;
    console.log(`Received webhook request with chat ID: ${chatId}`);

    // Attempt to connect to the database
    const db = await connectToDatabase();
    if (!db) {
        console.error('Database connection failed. Aborting webhook processing.');
        return res.status(500).send('Database connection failed.');
    }

    try {
        console.log(`Checking if user with chat ID ${chatId} exists in the database...`);
        const userExists = await db.collection('users').findOne({ chatId });
        
        if (!userExists) {
            await db.collection('users').insertOne({ chatId });
            console.log(`Added new user with chat ID: ${chatId}`);
        } else {
            console.log(`User with chat ID ${chatId} already exists.`);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET endpoint for root
app.get('/', (req, res) => {
  console.log("Received request on root endpoint.");
  res.send('Welcome to the Telegram Bot API!');
});

// Set webhook URL
bot.setWebHook(`${process.env.VERCEL_URL}/webhook`)
  .then(() => console.log("Webhook set successfully."))
  .catch(error => console.error("Error setting webhook:", error));

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
