require("dotenv").config();
const Binance = require("node-binance-api");
const TelegramBot = require("node-telegram-bot-api");

(async (_) => {
  // replace the value below with the Telegram token you receive from @BotFather
  const token = process.env.TELEGRAM_BOT_API_KEY;

  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(token, { polling: true });

  const chatsToNotify = ["-1001282532821"];

  let lastPriceNotified = null;
  let lastOneHourChange = null;
  let fullPrice = null;

  const binance = new Binance().options({
    APIKEY: process.env.BINANCE_API_KEY,
    APISECRET: process.env.BINANCE_SECRET_KEY,
  });

  const extractVariablesFromTick = (tick) => {
    const [
      time,
      open,
      high,
      low,
      close,
      volume,
      closeTime,
      assetVolume,
      trades,
      buyBaseVolume,
      buyAssetVolume,
      ignored,
    ] = tick;
    return {
      time,
      open,
      high,
      low,
      close,
      volume,
      closeTime,
      assetVolume,
      trades,
      buyBaseVolume,
      buyAssetVolume,
      ignored,
    };
  };


  const getChangesFromTicks = (ticks) => {

    const now = extractVariablesFromTick(ticks[ticks.length - 1])
    const before = extractVariablesFromTick(ticks[ticks.length - 2])
    const change =
    ((now.close - before.open) * 100) /
    before.open;
    return { change, up: now.close >= before.open }

  }
  const getMessage = async ({
    hour = true,
    day = false,
    week = false
  } = {}) => {
    const oneHourData = await getData()
    const oneHourChange = getChangesFromTicks(oneHourData)
    const last_tick = extractVariablesFromTick(oneHourData[oneHourData.length - 1])
    let message = `▸ Price: ${lastPriceNotified >= last_tick.close ? "↓" : "↑"} ${last_tick.close} USD\n`
    if (hour) {
      message = `${message}▸ ${ oneHourChange.up ? "↑" : "↓" } 1h,  ${oneHourChange.change.toFixed(2)}%`
    }

    if (day) {
      const dayData = await getData("1d")
      const dayChange = getChangesFromTicks(dayData)
      message = `${message} ${ dayChange.up ? "↑" : "↓" } 24h, ${dayChange.change.toFixed(2)}%`
    }
    if (week) {
      const weekData = await getData("1w")
      const weekChange = getChangesFromTicks(weekData)
      message = `${message} ${ weekChange.up ? "↑" : "↓" } 7d, ${weekChange.change.toFixed(2)}%`
    }
    
    return { message, price: last_tick.close };
  };

  const getData = async (interval = "1h") => {
    const data = await binance.candlesticks("DOGEUSDT", interval, null, {
      limit: 60,
    });
    return data
  };

  setInterval(async () => {
    const { message, price } = await getMessage();

    if (Math.abs(price - lastPriceNotified) > 0.01) {
        if (lastPriceNotified) {
          chatsToNotify.forEach((chatId) => {
            bot.sendMessage(chatId, message);
          });
        }
        lastPriceNotified = price;
      }
    // binance.prices('DOGEUSDT', (error, ticker) => {
    //     if (!ticker) {
    //         return
    //     }
    //     const { DOGEUSDT } = ticker
    // });
  }, 1500);

  bot.onText(/jotaro/, (msg, match) => {
    bot.sendMessage(msg.chat.id, `DIO`);
  });
  // Matches "/echo [whatever]"
  bot.onText(/\/doge/, async (msg, match) => {
    const chatId = msg.chat.id;
    const { message, price } = await getMessage({
      hour: true,
      day: true,
      week: true
    });
    bot.sendMessage(chatId, message);
  });

  bot.on("polling_error", console.log);

  bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    console.log(chatId);

    // send a message to the chat acknowledging receipt of their message
    //  bot.sendMessage(chatId, 'Received your message');
  });
})();
