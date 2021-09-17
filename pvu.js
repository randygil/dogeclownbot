function getLeProduction(days, LeToPVU, NFTs) {
  // Sapplings cycle

  // CONSTANTS, NOT EDIT
  const SAPPLINGS = 5;
  const MOTHERS = 1;

  const sapplings =
    SAPPLINGS - NFTs.reduce((acc, nft) => (!nft.mother ? acc + 1 : acc), 0);
  const mother =
    MOTHERS - NFTs.reduce((acc, nft) => (nft.mother ? acc + 1 : acc), 0);

  let total = 0;
  let daysAcum = 0;
  for (let i = 0; i <= Math.round(days / 6); i++) {
    const potCost = sapplings * 100 + mother * 50;
    const sapplingsCost = sapplings * 200;
    const motherCost = mother * 200;
    const sapplingsRevenue = sapplings * 500;
    const motherRevenue = mother * 850;
    const totalCost = potCost + sapplingsCost + motherCost;
    const totalRevenue = sapplingsRevenue + motherRevenue;
    const profit = totalRevenue - totalCost;
    total += profit;

    NFTs.forEach((nft) => {
      const LePerHour = (nft.LE / nft.hours).toFixed(2);
      const LeGenerated = (LePerHour * 24 * 6).toFixed(2);
      const potCost = Math.round(days / 30) * 100;
      total += Math.round(LeGenerated - potCost);
    });

    daysAcum += 6;
  }
  return total / LeToPVU;
}

let days = 32;
let LeToPVU = 150;
  

module.exports = async (bot) => {
  bot.onText(/\/pvuprod/, async (msg, match) => {
    const chatId = msg.chat.id
    const firstParam = match.input.split(' ')[1];
    if (!firstParam) {
        bot.sendMessage(
            chatId,
            'Bad sintax: /pvuprod <NFTLE:NFTHour:IsMother>, example: /pvuprod 1098:120,4336:448:true',
        );
        return
    }
    let params = match.input.split(' ')
    // Delete first item
    params.shift();
    // Split every item by ',' and add to array
    let newValue = []
    params.forEach(param => {
        newValue = [...param.split(',')]
    })
    params = newValue
    let finalArray = []
    params = params.map(param => {
        // Check if param match LE:Hour or
        let paramArray = param.split(':')
        const lastItem = paramArray[paramArray.length - 1]
        let mother = false
        if (['true', 'false'].includes(lastItem)) {
            mother = lastItem === 'true'
            // remove last item
            paramArray.pop()
        }
        const match = paramArray.join(':').match(/^(\d+):(\d+)$/);
        if (match) {
            finalArray.push({
                LE: parseInt(paramArray[0]),
                hours: parseInt(paramArray[1]),
                mother
            })
        } else {
            bot.sendMessage(
                chatId,
                'Bad sintax: /pvuprod <NFTLE:NFTHour>, example: /pvuprod 1098:120,4336:448',
            );
            return
        }
    })
    const NFTs = finalArray
    const result = getLeProduction(days, LeToPVU, NFTs)
    bot.sendMessage(chatId, `Production for ${days} days is ${result}`)
  });
  
};
