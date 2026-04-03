const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const checkCooldown = require('./utils/mediaCooldown');

const symbols = ["🍒", "🍋", "🍇", "💎", "7⃣", "🍉"];
const colors = { red: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36], black: [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35] };
const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const rouletteNumbers = [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, 0, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2];

function drawCardCanvas(ctx, card, x, y, width, height) {
    const suit = card.slice(-1);
    const value = card.slice(0, -1);
    const color = (suit === '♥' || suit === '♦') ? '#B91C1C' : '#111827';
    
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = `bold ${width/3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, x + width * 0.25, y + height * 0.25);
    ctx.fillText(suit, x + width * 0.25, y + height * 0.5);
}

async function createBlackjackCanvas(playerHand, dealerHand, status) {
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');

    const grd = ctx.createRadialGradient(400, 250, 0, 400, 250, 500);
    grd.addColorStop(0, '#059669');
    grd.addColorStop(1, '#047857');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 800, 500);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 24px Arial';
    ctx.fillText("Dealer's Hand", 400, 40);
    
    const cardWidth = 80, cardHeight = 120, cardGap = 20;
    const dealerStartX = 400 - (dealerHand.length * (cardWidth + cardGap) - cardGap) / 2;
    dealerHand.forEach((card, i) => {
        if(card === 'facedown'){
            ctx.fillStyle = '#B91C1C';
            ctx.beginPath();
            ctx.roundRect(dealerStartX + i * (cardWidth + cardGap), 70, cardWidth, cardHeight, 10);
            ctx.fill();
        } else {
            drawCardCanvas(ctx, card, dealerStartX + i * (cardWidth + cardGap), 70, cardWidth, cardHeight);
        }
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 24px Arial';
    ctx.fillText("Your Hand", 400, 280);
    const playerStartX = 400 - (playerHand.length * (cardWidth + cardGap) - cardGap) / 2;
    playerHand.forEach((card, i) => {
        drawCardCanvas(ctx, card, playerStartX + i * (cardWidth + cardGap), 310, cardWidth, cardHeight);
    });

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(status, 400, 470);

    const outputPath = path.join(__dirname, 'cache', `blackjack_${Date.now()}.png`);
    await fs.ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
    return outputPath;
}


module.exports = {
  config: {
    name: "casino",
    version: "2.4.78",
    author: "Mahi-- | enhanced by ST",
    shortDescription: { en: "Casino world with slots, blackjack, roulette" },
    longDescription: { en: "Play Slots, Blackjack (image), and Roulette (GIF)." },
    category: "Games",
    guide: { en: "{pn} slots <amount>\n{pn} blackjack <amount>\n{pn} roulette <color> <amount>" }
  },

  ST: async function ({ message, event, args, usersData, api }) {
    const { senderID } = event;
    if (!await checkCooldown("casino", senderID, api, event.threadID)) return;
    const user = await usersData.get(senderID) || { money: 0 };
    const game = (args[0] || "").toLowerCase();

    if (!["slots", "blackjack", "roulette"].includes(game)) {
      return message.reply("🎲 Use:\n- casino slots <amount>\n- casino blackjack <amount>\n- casino roulette <color> <amount>");
    }
    
    if (game === "slots") {
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0) return message.reply("🎰 Please enter a valid amount.");
        if (user.money < bet) return message.reply("🎰 You don't have enough money!");

        const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
        const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
        const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

        let multiplier = 0;
        if (slot1 === slot2 && slot2 === slot3) multiplier = 5;
        else if (slot1 === slot2 || slot2 === slot3) multiplier = 2;
        else multiplier = -1;

        const earnings = bet * multiplier;
        user.money += earnings;
        await usersData.set(senderID, { money: user.money });

        return message.reply(`🎰  𝗖𝗔𝗦𝗜𝗡𝗢 𝗪𝗢𝗥𝗟𝗗 🎲\n━━━━━━━━━━━\n[ ${slot1} | ${slot2} | ${slot3} ]\n\n${multiplier > 0 ? `🎉 You won $${earnings.toLocaleString()}` : `😢 You lost $${bet.toLocaleString()}`}\nBalance: $${user.money.toLocaleString()}`);
    }

    if (game === "blackjack") {
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0) return message.reply("🃏 Enter valid amount!");
        if (user.money < bet) return message.reply("🃏 Not enough money!");

        const playerHand = [drawCard(), drawCard()];
        const dealerHand = [drawCard(), drawCard()];
        const total = handValue(playerHand);
        
        await global.blackjackData.set(senderID, { bet, playerHand, dealerHand, state: "playing" });

        const canvasPath = await createBlackjackCanvas(playerHand, [dealerHand[0], 'facedown'], `Your Total: ${total}`);
        return message.reply({ body: "Reply 'hit' to draw or 'stand' to stay.", attachment: fs.createReadStream(canvasPath) }, (err, info) => {
            fs.unlinkSync(canvasPath);
            global.SizuBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        });
    }

    if (game === "roulette") {
        const color = (args[1] || "").toLowerCase();
        const betRoulette = parseInt(args[2]);
        if (!["red", "black"].includes(color)) return message.reply("🎡 Choose color: red or black.");
        if (isNaN(betRoulette) || betRoulette <= 0) return message.reply("🎡 Enter valid bet amount.");
        if (user.money < betRoulette) return message.reply("🎡 You don't have enough money!");
        
        const processingMessage = await message.reply("🎡 Spinning the roulette wheel...");

        const ball = Math.floor(Math.random() * 37);
        const ballColor = colors.red.includes(ball) ? "red" : colors.black.includes(ball) ? "black" : "green";
        let payout = (ballColor === color) ? betRoulette : -betRoulette;

        user.money += payout;
        await usersData.set(senderID, { money: user.money });

        await message.unsend(processingMessage.messageID);
        return message.reply(`🎡 𝗥𝗢𝗨𝗟𝗘𝗧𝗧𝗘 𝗚𝗔𝗠𝗘\n━━━━━━━━━━━\nThe ball lands on: ${ball} ${ballColor === "red" ? "🔴" : ballColor === "black" ? "⚫" : "🟢"}\n\n${payout > 0 ? `🎉 You won $${payout.toLocaleString()}` : `😢 You lost $${betRoulette.toLocaleString()}`}\nBalance: $${user.money.toLocaleString()}`);
    }
  },

  onReply: async function ({ message, event, usersData, Reply }) {
    const { senderID, body } = event;
    if(senderID !== Reply.author) return;
    const data = await global.blackjackData.get(senderID);
    if (!data || data.state !== "playing") return;

    const move = body.toLowerCase();
    if (!["hit", "stand"].includes(move)) return;

    message.unsend(Reply.messageID);

    if (move === "hit") {
        data.playerHand.push(drawCard());
        const playerTotal = handValue(data.playerHand);

        if (playerTotal > 21) {
            const user = await usersData.get(senderID) || { money: 0 };
            user.money -= data.bet;
            await usersData.set(senderID, { money: user.money });
            await global.blackjackData.delete(senderID);
            
            const canvasPath = await createBlackjackCanvas(data.playerHand, data.dealerHand, `BUST! You lose $${data.bet.toLocaleString()}`);
            return message.reply({ body: `Your new balance: $${user.money.toLocaleString()}`, attachment: fs.createReadStream(canvasPath)}, () => fs.unlinkSync(canvasPath));
        }

        await global.blackjackData.set(senderID, data);
        const canvasPath = await createBlackjackCanvas(data.playerHand, [data.dealerHand[0], 'facedown'], `Your Total: ${playerTotal}`);
        return message.reply({ body: "Reply 'hit' or 'stand'.", attachment: fs.createReadStream(canvasPath)}, (err, info) => {
            fs.unlinkSync(canvasPath);
            global.SizuBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        });
    }

    if (move === "stand") {
        const dealerDraw = [...data.dealerHand];
        while (handValue(dealerDraw) < 17) dealerDraw.push(drawCard());

        const playerTotal = handValue(data.playerHand);
        const dealerTotal = handValue(dealerDraw);

        let resultMessage = "";
        const user = await usersData.get(senderID) || { money: 0 };

        if (dealerTotal > 21 || playerTotal > dealerTotal) {
            user.money += data.bet;
            resultMessage = `YOU WIN! (+$${data.bet.toLocaleString()})`;
        } else if (playerTotal === dealerTotal) {
            resultMessage = `PUSH! (Bet returned)`;
        } else {
            user.money -= data.bet;
            resultMessage = `DEALER WINS! (-$${data.bet.toLocaleString()})`;
        }

        await usersData.set(senderID, { money: user.money });
        await global.blackjackData.delete(senderID);

        const canvasPath = await createBlackjackCanvas(data.playerHand, dealerDraw, resultMessage);
        return message.reply({ body: `Your new balance: $${user.money.toLocaleString()}`, attachment: fs.createReadStream(canvasPath)}, () => fs.unlinkSync(canvasPath));
    }
  }
};

function drawCard() {
  const suit = suits[Math.floor(Math.random() * suits.length)];
  const value = values[Math.floor(Math.random() * values.length)];
  return `${value}${suit}`;
}

function handValue(hand) {
  let total = 0, aces = 0;
  for (const card of hand) {
    if(typeof card !== 'string') continue;
    const value = card.slice(0, -1);
    if (value === "A") { aces++; total += 11; } 
    else if (["K", "Q", "J"].includes(value)) { total += 10; } 
    else { total += parseInt(value); }
  }
  while (total > 21 && aces-- > 0) total -= 10;
  return total;
}

if (!global.blackjackData) global.blackjackData = new Map();