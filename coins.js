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

module.exports = async (bot) => {
  bot.onText(/\/d/, async (msg, match) => {
    const chatId = msg.chat.id;
    const coin = match.input.split(" ")[1];
    const amount = match.input.split(" ")[2];

    const tokenInfo = getTokenBySymbol(coin);
    if (tokenInfo) {
      const { data: coinData, token } = tokenInfo;
      const {
        data: { data },
      } = await axios.get(
        `https://api.pancakeswap.info/api/v2/tokens/${token}`
      );

      let message = `${coinData.name} (${
        coinData.symbol
      }) is currently trading at ${parseFloat(data.price).toFixed(4)} USD`;

      const calculated = parseFloat(amount) * parseFloat(data.price);
      // If amount is number, calculate
      if (amount && !isNaN(amount)) {
        message += `\n${amount} ${
          coinData.symbol
        } is worth ${calculated.toFixed(4)} USD`;
      }

      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, `${coin} is not a valid token`);
    }
  });

  // Add command to calculate arithmetical expressions
  bot.onText(/\/a/, async (msg, match) => {
    const chatId = msg.chat.id;
    const expression = match.input.split(" ")[1];

    // Check if expression is valid
    if (expression) {
      try {
        const result = eval(expression);
        bot.sendMessage(chatId, `${expression} = ${result}`,  { reply_to_message_id: msg.message_id });
      } catch (error) {
        bot.sendMessage(chatId, `${expression} is not a valid expression`);
      }
    } else {
      bot.sendMessage(chatId, `${expression} is not a valid expression`);
    }
  });

  bot.onText(/\/add_token/, async (msg, match) => {
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
    console.log(args2);
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
