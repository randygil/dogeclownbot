const axios = require("axios");
const cheerio = require("cheerio");
const { getPrice } = require("./tokenInfo");

async function getNinjaPrice() {
  const html = (await axios.get("https://market.ninjafantasy.io/index.php"))
    .data;
  const $ = cheerio.load(html);
  const price = $(
    "body > div > div.hero-main-dark > div > div > div > div.col-lg-6.col-content-otr > div > div:nth-child(3) > div > h3"
  ).text();
  return price;
}

async function getMessage() {
  const ninjaPrice = await getNinjaPrice();
  const { usd, bnb } = await getPrice(
    "0x64815277c6caf24c1c2b55b11c78ef393237455c"
  );
  const calculated =
    parseFloat(ninjaPrice.replace("NFS", "").replace(" ", "")) *
    parseFloat(usd);
  const text = `NFS Ninja price: ${ninjaPrice} (${calculated.toFixed(2)}$) `;
  return text;
}

module.exports = async (bot) => {
  bot.onText(/^\/ninja$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const opts = {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔄 Refresh 🔄",
              callback_data: `refreshninjaprice`,
            },
          ],
        ],
      },
    };

    const text = await getMessage();
    bot.sendMessage(msg.chat.id, text, opts);
  });

  bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const opts = {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔄 Refresh 🔄",
              callback_data: `refreshninjaprice`,
            },
          ],
        ],
      },
    };
    if (action === "refreshninjaprice") {
      const text = await getMessage();

      if (text.trim() !== msg.text.trim()) {
        bot.editMessageText(text, opts);
      }
    }
  });
};
