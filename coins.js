const { getPrice } = require("./tokenInfo");
const coins = require("./data/pancakecoins.json");
const axios = require("axios");
const fs = require("fs");
function getTokenBySymbol(symbol) {
  // loop over keys in coins object and return key if symbol matches the symbol property
  for (let key in coins) {
    if (coins[key]) {
      if (coins[key].symbol.toLowerCase() === symbol.toLowerCase()) {
        return { token: key, data: coins[key] };
      }
    }
  }
}

function addTokenToJson(data) {
  const { token, symbol, name } = data;
  coins[token] = {
    symbol,
    name,
  };
  fs.writeFileSync("./data/pancakecoins.json", JSON.stringify(coins, null, 2));
}
async function getPriceText(tokenInfo, amount) {
  const { data: coinData, token } = tokenInfo;

  const { usd, bnb } = await getPrice(token);

  let message = `${coinData.name} (${
    coinData.symbol
  }) is currently trading at ${parseFloat(usd).toFixed(4)} USD`;
  const calculated = parseFloat(amount) * parseFloat(usd);
  // If amount is number, calculate
  if (amount && !isNaN(amount)) {
    message += `\n${amount} ${coinData.symbol} is worth ${calculated.toFixed(
      4
    )} USD`;
  }
  return message;
}

module.exports = async (bot) => {
  // Match exact word /coin
  bot.onText(/^\/d$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const coin = match.input.split(" ")[1];
    const amount = match.input.split(" ")[2];

    if (!coin) {
      return;
    }
    const tokenInfo = getTokenBySymbol(coin);
    if (tokenInfo) {
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 Refresh 🔄",
                callback_data: `refresh:${coin}:${amount}`,
              },
              {
                text: "📈 Charts 📈",
                url: `https://poocoin.app/tokens/${tokenInfo.token}`,
              },
            ],
            [
              {
                text: "Contract",
                callback_data: `contract:${tokenInfo.token}`,
              },
            ],
          ],
        },
      };
      const message = await getPriceText(tokenInfo, amount);
      bot.sendMessage(chatId, message, opts);
      bot.deleteMessage(chatId, msg.message_id);
    } else {
      bot.sendMessage(chatId, `${coin} is not a valid token`);
    }
  });

  // Add command to calculate arithmetical expressions
  bot.onText(/^\/a$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    let expression = match.input.split(" ")[1].replace(" ", "");

    // Check if expression is valid
    if (expression) {
      try {
        const result = eval(expression);
        bot.sendMessage(chatId, `${expression} = ${result}`, {
          reply_to_message_id: msg.message_id,
        });
      } catch (error) {
        bot.sendMessage(chatId, `${expression} is not a valid expression`);
      }
    } else {
      bot.sendMessage(chatId, `${expression} is not a valid expression`);
    }
  });

  // on any text
  bot.onText(/^\/\w+/g, async (msg, match) => {
    const chatId = msg.chat.id;
    const coin = match.input.split(" ")[0].replace("/", "");
    const amount = match.input.split(" ")[1];
    const tokenInfo = getTokenBySymbol(coin);
    if (!coin) {
      return;
    }
    if (tokenInfo) {
      const priceText = await getPriceText(tokenInfo, amount);
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔄 Refresh 🔄",
                callback_data: `refresh:${coin}:${amount}`,
              },
              {
                text: "📈 Charts 📈",
                url: `https://poocoin.app/tokens/${tokenInfo.token}`,
              },
            ],
            [
              {
                text: "Contract",
                callback_data: `contract:${tokenInfo.token}`,
              },
            ],
          ],
        },
      };
      bot.sendMessage(chatId, priceText, opts);
      bot.deleteMessage(chatId, msg.message_id);
    } else {
      //  bot.sendMessage(chatId, `${coin} is not a valid token`);
    }
  });

  bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;

    // Check if action is refresh
    if (action.startsWith("contract:")) {
      const coin = action.split(":")[1];
      bot.sendMessage(msg.chat.id, coin, {
        reply_to_message_id: msg.message_id,
      });
    }
    if (action.startsWith("refresh:")) {
      const coin = action.split(":")[1];
      const amount = action.split(":")[2];
      const tokenInfo = getTokenBySymbol(coin);
      if (tokenInfo) {
        const priceText = await getPriceText(tokenInfo, amount);
        const opts = {
          chat_id: msg.chat.id,
          message_id: msg.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔄 Refresh 🔄",
                  callback_data: `refresh:${coin}:${amount}`,
                },
                {
                  text: "📈 Charts 📈",
                  url: `https://poocoin.app/tokens/${tokenInfo.token}`,
                },
              ],
              [
                {
                  text: "Contract",
                  callback_data: `contract:${tokenInfo.token}`,
                },
              ],
            ],
          },
        };
        // If priceText is the same as the message text, don't send a new message
        if (priceText !== msg.text) {
          bot.editMessageText(priceText, opts);
        }
      }
    }
  });

  bot.onText(/^\/add_token$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const args = match.input.split(" ")[1] || "";
    if (!args || args.split("|").length !== 3) {
      bot.sendMessage(
        chatId,
        "Invalid syntax. Try /add_token <token>|<symbol>|<name>"
      );
      return;
    }
    const args2 = args.split("|");
    const token = args2[0];
    const symbol = args2[1];
    const name = args2[2];

    // Check if token if 0x
    if (token.substring(0, 2) !== "0x") {
      bot.sendMessage(chatId, "Token must start with 0x");
      return;
    }
    bot.getChatMember(msg.chat.id, msg.from.id).then(function (data) {
      if (
        data.status == "creator" ||
        data.status == "administrator" ||
        process.env.ADMIN_ID == msg.from.id
      ) {
        addTokenToJson({ token, symbol, name });
        bot.sendMessage(chatId, `${token} added to list of tokens`);
      } else {
        bot.sendMessage(chatId, "Sáquese");
      }
    });
  });
};
