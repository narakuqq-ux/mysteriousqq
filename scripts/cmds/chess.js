if (!global.GoatBot.chessGames) global.GoatBot.chessGames = new Map();
if (!global.GoatBot.chessPending) global.GoatBot.chessPending = new Map();
const chessGames = global.GoatBot.chessGames;
const chessPending = global.GoatBot.chessPending;

const SYM = {
  K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙',
  k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟'
};
const FILES = 'abcdefgh';
const isW = p => !!(p && p === p.toUpperCase() && p !== p.toLowerCase());
const isB = p => !!(p && p === p.toLowerCase() && p !== p.toUpperCase());
const toRC = sq => {
  const c = FILES.indexOf((sq[0]||'').toLowerCase()), r = 8 - parseInt(sq[1]);
  return (c < 0 || c > 7 || r < 0 || r > 7 || isNaN(r)) ? null : [r, c];
};
const toSq = (r, c) => FILES[c] + (8 - r);
const clone = b => b.map(row => [...row]);

function drawBoard(game) {
  const { board, wTurn, wName, bName, lastMove } = game;
  const lines = [
    `♟ CHESS GAME ♙`,
    `⬜ ${wName}  VS  ${bName} ⬛`,
    `Turn: ${wTurn ? `⬜ ${wName}` : `⬛ ${bName}`}`,
    lastMove ? `Last: ${lastMove}` : null,
    `  a b c d e f g h`
  ].filter(Boolean);
  for (let r = 0; r < 8; r++) {
    let row = `${8 - r} `;
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      row += (p ? SYM[p] : ((r + c) % 2 === 0 ? '░' : '·')) + ' ';
    }
    row += `${8 - r}`;
    lines.push(row);
  }
  lines.push(`  a b c d e f g h`);
  return lines.join('\n');
}

function startBoard() {
  return [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R'],
  ];
}

function kingPos(board, white) {
  const k = white ? 'K' : 'k';
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === k) return [r, c];
  return [0, 0];
}

function isAttacked(board, r, c, byWhite) {
  const mine = byWhite ? isW : isB;
  const pr = r + (byWhite ? 1 : -1);
  if (pr >= 0 && pr < 8) {
    for (const dc of [-1, 1]) {
      const pc = c + dc;
      if (pc >= 0 && pc < 8) {
        const p = board[pr][pc];
        if (p && mine(p) && p.toLowerCase() === 'p') return true;
      }
    }
  }
  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const nr = r+dr, nc = c+dc;
    if (nr>=0&&nr<8&&nc>=0&&nc<8&&board[nr][nc]&&mine(board[nr][nc])&&board[nr][nc].toLowerCase()==='n') return true;
  }
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    let nr = r+dr, nc = c+dc;
    while (nr>=0&&nr<8&&nc>=0&&nc<8) {
      const p = board[nr][nc];
      if (p) { if (mine(p)&&(p.toLowerCase()==='r'||p.toLowerCase()==='q')) return true; break; }
      nr += dr; nc += dc;
    }
  }
  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    let nr = r+dr, nc = c+dc;
    while (nr>=0&&nr<8&&nc>=0&&nc<8) {
      const p = board[nr][nc];
      if (p) { if (mine(p)&&(p.toLowerCase()==='b'||p.toLowerCase()==='q')) return true; break; }
      nr += dr; nc += dc;
    }
  }
  for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
    const nr = r+dr, nc = c+dc;
    if (nr>=0&&nr<8&&nc>=0&&nc<8&&board[nr][nc]&&mine(board[nr][nc])&&board[nr][nc].toLowerCase()==='k') return true;
  }
  return false;
}

function inCheck(board, white) {
  const [kr, kc] = kingPos(board, white);
  return isAttacked(board, kr, kc, !white);
}

function legalMoves(board, fr, fc, enP, castling) {
  const piece = board[fr][fc];
  if (!piece) return [];
  const white = isW(piece);
  const type = piece.toLowerCase();
  const moves = [];

  const try_ = (tr, tc) => {
    if (tr < 0 || tr >= 8 || tc < 0 || tc >= 8) return;
    const target = board[tr][tc];
    if (target && white === isW(target)) return;
    const nb = clone(board);
    if (type === 'p' && tc !== fc && !target && enP && tr === enP[0] && tc === enP[1])
      nb[fr][tc] = null;
    if (type === 'k' && Math.abs(tc - fc) === 2) {
      if (white) {
        if (tc === 6) { nb[7][5] = 'R'; nb[7][7] = null; }
        else          { nb[7][3] = 'R'; nb[7][0] = null; }
      } else {
        if (tc === 6) { nb[0][5] = 'r'; nb[0][7] = null; }
        else          { nb[0][3] = 'r'; nb[0][0] = null; }
      }
    }
    let mp = piece;
    if (type === 'p' && (tr === 0 || tr === 7)) mp = white ? 'Q' : 'q';
    nb[tr][tc] = mp; nb[fr][fc] = null;
    if (!inCheck(nb, white)) moves.push([tr, tc]);
  };

  if (type === 'p') {
    const dir = white ? -1 : 1, start = white ? 6 : 1;
    const fwd = fr + dir;
    if (fwd >= 0 && fwd < 8 && !board[fwd][fc]) {
      try_(fwd, fc);
      const fwd2 = fr + 2 * dir;
      if (fr === start && fwd2 >= 0 && fwd2 < 8 && !board[fwd2][fc]) try_(fwd2, fc);
    }
    for (const dc of [-1, 1]) {
      const tr = fr + dir, tc = fc + dc;
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
        const t = board[tr][tc];
        if ((t && white !== isW(t)) || (enP && tr === enP[0] && tc === enP[1])) try_(tr, tc);
      }
    }
  } else if (type === 'n') {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) try_(fr+dr, fc+dc);
  } else if (type === 'b') {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      let nr = fr+dr, nc = fc+dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) { try_(nr, nc); if (board[nr][nc]) break; nr += dr; nc += dc; }
    }
  } else if (type === 'r') {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let nr = fr+dr, nc = fc+dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) { try_(nr, nc); if (board[nr][nc]) break; nr += dr; nc += dc; }
    }
  } else if (type === 'q') {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) {
      let nr = fr+dr, nc = fc+dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) { try_(nr, nc); if (board[nr][nc]) break; nr += dr; nc += dc; }
    }
  } else if (type === 'k') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) try_(fr+dr, fc+dc);
    if (white && fr === 7 && fc === 4 && !inCheck(board, true)) {
      if (castling.wK && !board[7][5] && !board[7][6] && !isAttacked(board,7,5,false) && !isAttacked(board,7,6,false)) try_(7, 6);
      if (castling.wQ && !board[7][3] && !board[7][2] && !board[7][1] && !isAttacked(board,7,3,false) && !isAttacked(board,7,2,false)) try_(7, 2);
    }
    if (!white && fr === 0 && fc === 4 && !inCheck(board, false)) {
      if (castling.bK && !board[0][5] && !board[0][6] && !isAttacked(board,0,5,true) && !isAttacked(board,0,6,true)) try_(0, 6);
      if (castling.bQ && !board[0][3] && !board[0][2] && !board[0][1] && !isAttacked(board,0,3,true) && !isAttacked(board,0,2,true)) try_(0, 2);
    }
  }
  return moves;
}

function hasAnyLegal(board, white, enP, castling) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || (white ? !isW(p) : !isB(p))) continue;
      if (legalMoves(board, r, c, enP, castling).length > 0) return true;
    }
  return false;
}

function applyMove(game, fr, fc, tr, tc) {
  const b = clone(game.board);
  const piece = b[fr][fc];
  const white = isW(piece);
  const type = piece.toLowerCase();
  const cas = { ...game.castling };
  let enP = null;

  if (type === 'k') {
    if (white) { cas.wK = false; cas.wQ = false; }
    else        { cas.bK = false; cas.bQ = false; }
    if (Math.abs(tc - fc) === 2) {
      if (white) {
        if (tc === 6) { b[7][5] = 'R'; b[7][7] = null; }
        else          { b[7][3] = 'R'; b[7][0] = null; }
      } else {
        if (tc === 6) { b[0][5] = 'r'; b[0][7] = null; }
        else          { b[0][3] = 'r'; b[0][0] = null; }
      }
    }
  }
  if (type === 'r') {
    if (white) { if (fr===7&&fc===7) cas.wK=false; if (fr===7&&fc===0) cas.wQ=false; }
    else       { if (fr===0&&fc===7) cas.bK=false; if (fr===0&&fc===0) cas.bQ=false; }
  }
  const cap = b[tr][tc];
  if (cap === 'R') { if (tr===7&&tc===7) cas.wK=false; if (tr===7&&tc===0) cas.wQ=false; }
  if (cap === 'r') { if (tr===0&&tc===7) cas.bK=false; if (tr===0&&tc===0) cas.bQ=false; }
  if (type === 'p' && tc !== fc && !b[tr][tc]) b[fr][tc] = null;
  if (type === 'p' && Math.abs(tr - fr) === 2) enP = [(fr + tr) / 2, tc];
  let mp = piece;
  if (type === 'p' && (tr === 0 || tr === 7)) mp = white ? 'Q' : 'q';
  b[tr][tc] = mp; b[fr][fc] = null;

  return {
    ...game,
    board: b,
    castling: cas,
    enPassant: enP,
    wTurn: !game.wTurn,
    lastMove: `${toSq(fr,fc)}→${toSq(tr,tc)}${mp !== piece ? '=♕' : ''}`
  };
}

module.exports = {
  config: {
    name: "chess",
    version: "1.0.0",
    author: "Siegfried Samá",
    countDown: 5,
    role: 0,
    description: { en: "Laro ng chess sa group chat" },
    category: "fun",
    guide: { en: "{pn} @mention | {pn} accept | {pn} e2e4 | {pn} board | {pn} resign" }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const { threadID, senderID, mentions } = event;
    const sub = (args[0] || '').toLowerCase().trim();

    if (sub === 'accept') {
      const pending = chessPending.get(threadID);
      if (!pending) return message.reply("❌ Walang chess challenge dito ngayon.");
      if (pending.challenged !== senderID) return message.reply("❌ Hindi para sayo ang challenge na ito.");
      chessPending.delete(threadID);
      const bName = await usersData.getName(senderID);
      const game = {
        board: startBoard(),
        wTurn: true,
        wID: pending.challenger,
        bID: pending.challenged,
        wName: pending.challengerName,
        bName,
        castling: { wK: true, wQ: true, bK: true, bQ: true },
        enPassant: null,
        lastMove: null
      };
      chessGames.set(threadID, game);
      return message.reply(`♟ Chess game nagsimula!\n\n${drawBoard(game)}\n\n⬜ ${game.wName} ang magsisimula.\nGalaw: !chess e2e4`);
    }

    if (sub === 'board') {
      const game = chessGames.get(threadID);
      if (!game) return message.reply("❌ Walang aktibong chess game dito.");
      return message.reply(drawBoard(game));
    }

    if (sub === 'resign') {
      const game = chessGames.get(threadID);
      if (!game) return message.reply("❌ Walang aktibong chess game dito.");
      if (game.wID !== senderID && game.bID !== senderID) return message.reply("❌ Hindi ka kalaro sa game na ito.");
      const rName = game.wID === senderID ? game.wName : game.bName;
      const wName = game.wID === senderID ? game.bName : game.wName;
      chessGames.delete(threadID);
      return message.reply(`🏳️ ${rName} ay sumuko!\n🏆 ${wName} ang nanalo!`);
    }

    const mentionIDs = Object.keys(mentions || {});
    if (mentionIDs.length > 0) {
      if (chessGames.has(threadID)) return message.reply("❌ May umaandar pang chess game dito. Tapusin muna o i-resign.");
      const challenged = mentionIDs[0];
      if (challenged === senderID) return message.reply("❌ Hindi mo kayang i-challenge ang sarili mo.");
      const challengerName = await usersData.getName(senderID);
      const challengedName = await usersData.getName(challenged);
      chessPending.set(threadID, { challenger: senderID, challengerName, challenged, challengedName });
      return message.reply(`♟ Chess Challenge!\n\n⬜ ${challengerName} ay hahamon kay ${challengedName} sa chess!\n\n${challengedName}, i-type ang:\n!chess accept — para tanggapin\n\n⬜ ${challengerName} = white (magsisimula)\n⬛ ${challengedName} = black`);
    }

    const game = chessGames.get(threadID);
    if (!game) return message.reply(
      `♟ Chess Command\n\n` +
      `!chess @mention — hamon ng kalaro\n` +
      `!chess accept — tanggapin ang challenge\n` +
      `!chess e2e4 — galaw (from→to)\n` +
      `!chess board — tingnan ang board\n` +
      `!chess resign — sumuko\n\n` +
      `Halimbawa ng galaw: e2e4, d7d5, g1f3`
    );

    const moveStr = sub === 'move'
      ? (args[1] || '').toLowerCase().replace(/\s+/g,'')
      : sub.replace(/\s+/g,'');

    if (!moveStr || moveStr.length < 4) return message.reply("❌ Mali ang format. Halimbawa: !chess e2e4");

    const isCurrentWhite = game.wTurn;
    const currentID = isCurrentWhite ? game.wID : game.bID;
    if (senderID !== currentID) {
      const whose = isCurrentWhite ? `⬜ ${game.wName}` : `⬛ ${game.bName}`;
      return message.reply(`❌ Hindi pa ikaw. Ikaw naman ${whose}.`);
    }

    const from = toRC(moveStr.slice(0, 2));
    const to   = toRC(moveStr.slice(2, 4));
    if (!from || !to) return message.reply("❌ Mali ang square. Halimbawa: e2e4");

    const [fr, fc] = from, [tr, tc] = to;
    const piece = game.board[fr][fc];
    if (!piece) return message.reply(`❌ Walang piraso sa ${moveStr.slice(0,2)}.`);
    if (isCurrentWhite && !isW(piece)) return message.reply("❌ Hindi mo piraso iyan. Ikaw ay ⬜ white.");
    if (!isCurrentWhite && !isB(piece)) return message.reply("❌ Hindi mo piraso iyan. Ikaw ay ⬛ black.");

    const legal = legalMoves(game.board, fr, fc, game.enPassant, game.castling);
    if (!legal.some(([r, c]) => r === tr && c === tc))
      return message.reply(`❌ Illegal na galaw: ${moveStr}. Subukan mo ng ibang galaw.`);

    const newGame = applyMove(game, fr, fc, tr, tc);
    const nextWhite = newGame.wTurn;
    const check     = inCheck(newGame.board, nextWhite);
    const anyMoves  = hasAnyLegal(newGame.board, nextWhite, newGame.enPassant, newGame.castling);

    if (!anyMoves) {
      chessGames.delete(threadID);
      if (check) {
        const winner = nextWhite ? game.bName : game.wName;
        const loser  = nextWhite ? game.wName : game.bName;
        return message.reply(`${drawBoard(newGame)}\n\n♟ CHECKMATE!\n🏆 ${winner} ang nanalo!\n💀 ${loser} natalo!`);
      }
      return message.reply(`${drawBoard(newGame)}\n\n🤝 STALEMATE — Draw!`);
    }

    chessGames.set(threadID, newGame);
    const checkMsg = check
      ? `\n\n⚠️ CHECK! ${nextWhite ? game.wName : game.bName} ay naka-check.`
      : '';
    return message.reply(`${drawBoard(newGame)}${checkMsg}`);
  }
};
