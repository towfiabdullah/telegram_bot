import telegram
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()

# Get the bot token from the environment file
BOT_TOKEN = os.getenv("BOT_TOKEN")
bot = telegram.Bot(token=BOT_TOKEN)

async def get_chat_ids():
    updates = await bot.get_updates()
    
    if not updates:
        print("No new updates found. Please send a message to your bot and try again.")
    else:
        with open("chat_ids.txt", "w") as file:
            for update in updates:
                chat_id = update.message.chat_id
                file.write(f"{chat_id}\n")  # Write each chat ID on a new line
                print("Your Chat ID is:", chat_id)

# Run the async function
asyncio.run(get_chat_ids())
