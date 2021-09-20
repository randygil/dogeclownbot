
let pvuPrice = {
  price: 0,
  high: 0,
  low: 0,
  change: 0
}
 
let LeToPVU = 150;

setTimeout(updatePrice, 5000)
const axios = require('axios');
async function updatePrice() {
  // Get price from API

  try {
    
    const { data } = (await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=plant-vs-undead-token',
      ));

    const [pvuData] = data;
    const { current_price, high_24h, low_24h, price_change_percentage_24h } = pvuData;
    pvuPrice = {
      price: current_price,
      high: high_24h,
      low: low_24h,
      change: price_change_percentage_24h
    }
    } catch(error) {

    }

}

function parseNFTParams(params, chatId) {
  
  params.shift();
  // Delete first item
  // Split every item by ',' and add to array
  // let newValue = []
  // params.forEach(param => {
  //     newValue = [...param.split(',')]
  // })
  // params = newValue
  let finalArray = []
  let days = 32 

  // Find a param that match days:number, extract and delete it from array
  params.forEach(param => {
    if (param.match(/days:/)) {
      days = param.replace(/days:/, '')
      params.splice(params.indexOf(param), 1)
    }
  })
 
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
              type: 'NFT',
              mother
          })
      } else {
          // bot.sendMessage(
          //     chatId,
          //     'Bad sintax: /pvuprod <NFTLE:NFTHour>, example: /pvuprod 1098:120,4336:448',
          // );
          // return
      }
  })
  return { NFTs: finalArray, days }
}
function getLeProductionEstimation(days, LeToPVU, NFTs) {
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


function getRealLEProduction(days, NFTs, sapplings = 5, mothers = 1) {

  const sapplingCount =
   sapplings - NFTs.reduce((acc, nft) => (!nft.mother ? acc + 1 : acc), 0);
  const motherCount =
   mothers - NFTs.reduce((acc, nft) => (nft.mother ? acc + 1 : acc), 0);

 let total = 0;
 let cost = 0;

 let plants = [];
 // Add to plants sapplings as many of sapplings value
 for (let i = 0; i < sapplingCount; i++) {
   plants.push({
     type: 'sunflower',
     LE: 250,
     hours: 72,
     mother: false
   })
 }

  // Add to plants mothers as many of mothers value
  for (let i = 0; i < motherCount; i++) {
   plants.push({
     type: 'sunflower',
     LE: 850,
     hours: 144,
     mother: true
   })
 }

 plants = [...plants, ...NFTs]

 const plantPlant = (plant) => {
   const { LE, hours, mother, type } = plant;
   const potCost = type === 'sunflower' ? 50 : 100
   const seedCost = type === 'sunflower' ? mother ? 200 : 100 : 0
   plant.planted = true
   plant.farmHours = hours
   plant.potDuration = type === 'sunflower' ? 10 * 24 : 30 * 24
   return potCost + seedCost
 }


 for (let i = 0; i <= days; i++) {
   let subcost = 0
   let subtotal = 0
   plants.forEach((plant) => {
     const { LE, hours, mother, type } = plant
     if (!plant.cycles) {
        plant.cycles = 0
     }
     if (!plant.cost) {
        plant.cost = 0
     }
     let perPlantCost = 0;
     if (!plant.planted) {
       perPlantCost += plantPlant(plant)
     } else {
       plant.potDuration-=24
       plant.farmHours-=24
       if (plant.farmHours <= 0) {
         subtotal= subtotal + LE
         if (type === 'sunflower') {
           const cost = plantPlant(plant)
           perPlantCost+= cost
         } else {
           plant.farmHours = hours
         }
         plant.cycles+=1
       }
       if (plant.potDuration <= 0) {
         perPlantCost += type === 'sunflower' ? mother ? 200 : 100 : 0
         plant.potDuration = type === 'sunflower' ? 10 * 24 : 30 * 24
       }

       plant.cost+=perPlantCost
       subcost+=perPlantCost
     }
   })
   cost+=subcost
   total+=subtotal
 }
 const finalTotal = total-cost
 return { total: finalTotal, plants };
}

// const { total, plants } = getRealLEProduction([{ 
//   LE: 1098,
//   hours: 120,
//   mother: false
// }])
// const { total, plants } = getRealLEProduction([], 0, 1)


// console.log(msj)

module.exports = async (bot) => {
  bot.onText(/\/estimation/, async (msg, match) => {
    const chatId = msg.chat.id
    const firstParam = match.input.split(' ')[1];
    if (!firstParam) {
        bot.sendMessage(
            chatId,
            'Bad sintax: /estimation <NFTLE:NFTHour:IsMother>, example: /estimation 1098:120,4336:448:true',
        );
        return
    }
    const { NFTs, days } = parseNFTParams(match.input.split(' '), chatId)
    const result = getLeProductionEstimation(32, LeToPVU, NFTs)
    let msj = `Production for ${days} days is ${result}`
    const totalInUSD = result * pvuPrice.price
    msj += `\nUSD: ${totalInUSD}`
    bot.sendMessage(chatId, msj)
  });

  bot.onText(/\/prod/, async (msg, match) => {
    const chatId = msg.chat.id
    const firstParam = match.input.split(' ')[1];
    if (!firstParam) {
        bot.sendMessage(
            chatId,
            'Bad sintax: /prod <NFTLE:NFTHour:IsMother>, example: /prod 1098:120,4336:448:true',
        );
        return
    }
    const { NFTs, days } = parseNFTParams(match.input.split(' '), chatId)

    const { total, plants } = getRealLEProduction(days, NFTs)
    const totalInUSD = ((total/LeToPVU) * pvuPrice.price).toFixed(2)
    let msj = `Producción de ${days} días es ${total} LE (${(total/LeToPVU).toFixed(2)} PVU) - ${totalInUSD}$ \n\n`
    msj+=`Plantas:\n\n`
    plants.forEach((plant,index) => {
      const { LE, hours, farmHours, cycles, cost } = plant
      if (plant.type !== 'sunflower') {
       msj+=`LE: ${LE}/${hours} (${(LE/hours).toFixed(2)}/h) | Ciclos: ${cycles} | Ganancia: ${(LE*cycles)-cost} | Restaba: ${farmHours} horas\n`
      }
    })
    // Sum all LE from plants of type sunflower
    const sunflowerLE = plants.reduce((acc, plant) => (plant.type === 'sunflower' ? acc + (plant.LE*plant.cycles)-plant.cost : acc), 0)
    msj+=`\nProducción de Plantas Temporales: ${sunflowerLE} LE`
    bot.sendMessage(chatId, msj)
  });
  
};
