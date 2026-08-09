import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Atlas backend server is running on port ${PORT}`);
    console.log('Bot is actively listening to Telegram messages...');
});