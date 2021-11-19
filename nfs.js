const axios = require("axios");
const cheerio = require("cheerio");
const xpath = require("xpath");
const dom = require("xmldom").DOMParser;
async function getNinjaPrice() {
  const html = (await axios.get("https://market.ninjafantasy.io/index.php"))
    .data;
  const $ = cheerio.load(html);
  const price = $(
    "body > div > div.hero-main-dark > div > div > div > div.col-lg-6.col-content-otr > div > div:nth-child(3) > div > h3"
  ).text();
  return price;
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

    const ninjaPrice = await getNinjaPrice();
    bot.sendMessage(msg.chat.id, `NFS Ninja price: ${ninjaPrice}`, opts);
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
      const ninjaPrice = await getNinjaPrice();
      const text = `NFS Ninja price: ${ninjaPrice}`;
      if (text.trim() !== msg.text.trim()) {
        bot.editMessageText(text, opts);
      }
    }
  });
};
