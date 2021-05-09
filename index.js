
require('dotenv').config()
const Binance = require('node-binance-api');

const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_BOT_API_KEY;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

const chatsToNotify = ['-1001282532821']

let lastPriceNotified = null
let fullPrice = null

const binance = new Binance().options({
    APIKEY: process.env.BINANCE_API_KEY,
    APISECRET: process.env.BINANCE_SECRET_KEY
});

setInterval(() => {
    binance.prices('DOGEUSDT', (error, ticker) => {
        if (!ticker) {
            return
        }
        const { DOGEUSDT } = ticker
        chatsToNotify.forEach(chatId => {
            if (Math.abs(DOGEUSDT-lastPriceNotified)>0.01) {
                const msg = `DOGE ${lastPriceNotified >= DOGEUSDT ? 'DOWN' : 'UP'}: ${DOGEUSDT}`
                console.log(msg)
                if (lastPriceNotified) {
                    bot.sendMessage(chatId, msg);
                }
                lastPriceNotified = DOGEUSDT
            }
            fullPrice = DOGEUSDT
            
        })
    });

}, 1500)

// Matches "/echo [whatever]"
bot.onText(/\/doge/, (msg, match) => {

  if (!fullPrice) {
    bot.sendMessage(chatId, `I dont have data yet :(`);
    return
  }

  const chatId = msg.chat.id;
  const resp = `DOGE PRICE: ${fullPrice}`; // the captured "whatever"
  console.log(chatId, resp)
  bot.sendMessage(chatId, resp);
});

bot.on("polling_error", console.log);

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(chatId)

  // send a message to the chat acknowledging receipt of their message
  //  bot.sendMessage(chatId, 'Received your message');
});