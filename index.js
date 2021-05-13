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

  const binance = new Binance().options({
    APIKEY: process.env.BINANCE_API_KEY,
    APISECRET: process.env.BINANCE_SECRET_KEY,
  });

  const areYaWinningSon = (msg) => {
    let chatId = msg;
    if (typeof msg === "object") {
      chatId = msg.chat.id;
    }
    const photo = `./son.jpg`;
    bot.sendPhoto(chatId, photo, {
      caption: "?",
    });
  };

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
    const now = extractVariablesFromTick(ticks[ticks.length - 1]);
    if (ticks.length < 2) {
      return { change: null };
    }
    const before = extractVariablesFromTick(ticks[ticks.length - 2]);
    const change = ((now.close - before.open) * 100) / before.open;
    return { change, up: now.close >= before.open };
  };
  const getMessage = async ({
    hour = true,
    day = false,
    week = false,
    market = "DOGEUSDT",
  } = {}) => {
    const oneHourData = await getData({ market });
    const oneHourChange = getChangesFromTicks(oneHourData);
    const last_tick = extractVariablesFromTick(
      oneHourData[oneHourData.length - 1]
    );
    let message = `▸ Market: ${market}\n`;
    message = `${message}▸ Price: ${
      lastPriceNotified >= last_tick.close ? "↓" : "↑"
    } ${last_tick.close} USD\n`;
    if (hour && oneHourChange.change) {
      message = `${message}▸ ${
        oneHourChange.up ? "↑" : "↓"
      } 1h,  ${oneHourChange.change.toFixed(2)}%`;
    }

    if (day) {
      const dayData = await getData({ market, interval: "1d" });
      const dayChange = getChangesFromTicks(dayData);
      if (dayChange.change) {
        message = `${message} ${
          dayChange.up ? "↑" : "↓"
        } 24h, ${dayChange.change.toFixed(2)}%`;
      }
    }
    if (week) {
      const weekData = await getData({ market, interval: "1w" });
      const weekChange = getChangesFromTicks(weekData);
      if (weekChange.change) {
        message = `${message} ${
          weekChange.up ? "↑" : "↓"
        } 7d, ${weekChange.change.toFixed(2)}%`;
      }
    }

    return { message, price: last_tick.close };
  };

  const getData = async ({ market = "DOGEUSDT", interval = "1h" } = {}) => {
    const data = await binance.candlesticks(market, interval, null, {
      limit: 60,
    });
    return data;
  };

  setInterval(async () => {
    const { message, price } = await getMessage();

    if (Math.abs(price - lastPriceNotified) > 0.03) {
      if (lastPriceNotified) {
        chatsToNotify.forEach((chatId) => {
          //bot.sendMessage(chatId, `Are ya winnin' son?`);
          areYaWinningSon(chatId);

          bot.sendMessage(chatId, message);
        });
      }
      lastPriceNotified = price;
    }
  }, 15000);

  bot.onText(/jotaro/, (msg, match) => {
    bot.sendMessage(msg.chat.id, `DIO`, {
      reply_to_message_id: msg.message_id,
    });
  });

  bot.onText(/ora/, (msg, match) => {
    for (var i = 0; i < 5; i++) {
      setTimeout(function () {
        bot.sendMessage(msg.chat.id, `MUDA`, {
          reply_to_message_id: msg.message_id,
        });
      }, 500 * i);
    }
  });

  bot.onText(/areyawinningson/, (msg, match) => {
    areYaWinningSon(msg);
  });

  // Matches "/echo [whatever]"
  bot.onText(/\/doge/, async (msg, match) => {
    const chatId = msg.chat.id;

    const { message, price } = await getMessage({
      hour: true,
      day: true,
      week: true,
    });
    bot.sendMessage(chatId, message, { reply_to_message_id: msg.message_id });
  });

  bot.onText(/\/shiba/, async (msg, match) => {
    const chatId = msg.chat.id;
    const { message, price } = await getMessage({
      hour: true,
      day: true,
      week: true,
      market: "SHIBUSDT",
    });
    bot.sendMessage(chatId, message, { reply_to_message_id: msg.message_id });
  });

  bot.onText(/\/cardano/, async (msg, match) => {
    const chatId = msg.chat.id;
    const { message, price } = await getMessage({
      hour: true,
      day: true,
      week: true,
      market: "ADAUSDT",
    });
    bot.sendMessage(chatId, message, { reply_to_message_id: msg.message_id });
  });

  bot.on("polling_error", console.log);

  bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    // send a message to the chat acknowledging receipt of their message
    //  bot.sendMessage(chatId, 'Received your message');
  });
})();
