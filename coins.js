const coins = require("./data/pancakecoins.json");
const axios = require("axios");

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
      }) is currently trading at ${parseFloat(data.price).toFixed(2)} USD`

      const calculated = parseFloat(amount) * parseFloat(data.price);
      // If amount is number, calculate
      if (amount && !isNaN(amount)) {
        message+=`\n${amount} ${coinData.symbol} is worth ${calculated.toFixed(2)} USD`
      }

      bot.sendMessage(
        chatId,
        message
      );
    } else {
      bot.sendMessage(chatId, `${coin} is not a valid token`);
    }
  });


};
