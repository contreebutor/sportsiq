import { Router, Request, Response } from "express";
import {
  sharedHead,
  registrationHTML,
  registrationScript,
  pointsBarHTML,
  gameHeaderHTML,
  gameHeaderScript,
  pointsPollingScript,
  successOverlayHTML,
  successScript,
} from "../utils/webGameHTML";

const router = Router();

const PREDICTOR_BG = "#110E2A";
const BINGO_BG = "#0a0718";

// ─── Predictor Web App ─────────────────────────────────────────────
router.get("/predictor/:id", (_req: Request, res: Response) => {
  const html = `${sharedHead("SportsIQ — Predictor", PREDICTOR_BG)}
<body>
<div class="container">
  <div id="loading" class="loading"><div class="spinner"></div></div>
  ${registrationHTML(PREDICTOR_BG)}

  <div id="game-ui" class="hidden" style="display:none;flex-direction:column;flex:1;">
    ${pointsBarHTML()}
    ${gameHeaderHTML()}

    <div id="categories" style="flex:1;overflow-y:auto;padding:4px 0 80px;"></div>

    <div class="submit-area">
      <button id="submit-btn" class="btn btn-primary" disabled onclick="submitPredictions()">Submit</button>
      <div id="dots" class="dots"></div>
    </div>
  </div>

  ${successOverlayHTML()}
</div>

<script>
${registrationScript("predictor")}
${gameHeaderScript()}
${pointsPollingScript("predictor")}
${successScript(PREDICTOR_BG)}

var predictorInfo = null;
var selections = {};
var currentQI = 0;
var quarters = [];
var submitted = false;

window.addEventListener('DOMContentLoaded', function() {
  initRegistration();
  if (contestUserId) {
    document.getElementById('reg-screen').classList.add('hidden');
    startGame();
  } else {
    document.getElementById('loading').classList.add('hidden');
  }
});

async function startGame() {
  try {
    var res = await fetch('/v1/contest/fetch-predictor-info-by-id?id=' + CONTEST_ID);
    var json = await res.json();
    predictorInfo = json.data;
    if (!predictorInfo) { alert('Contest not found.'); return; }

    var away = predictorInfo.game.away_team;
    var home = predictorInfo.game.home_team;
    renderGameHeader(away, home, getTimeString(predictorInfo.game.date_time));

    quarters = getUniqueQuarters();
    currentQI = 0;

    // Load existing predictions
    if (contestUserId) {
      try {
        var pRes = await fetch('/v1/contest/retrieve-predictions', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ predictor_id: CONTEST_ID, user_id: contestUserId })
        });
        var pJson = await pRes.json();
        if (pJson.data && Array.isArray(pJson.data)) {
          pJson.data.forEach(function(qp) {
            if (qp.predictions) qp.predictions.forEach(function(p) {
              var parts = p.split(':');
              if (parts.length === 2) selections[qp.quarter + ':' + parts[0]] = parts[1];
            });
          });
          submitted = pJson.data.length > 0;
        }
      } catch(e) {}
    }

    startPointsPolling();
    renderQuarter();
    renderDots();

    document.getElementById('loading').classList.add('hidden');
    var ui = document.getElementById('game-ui');
    ui.classList.remove('hidden');
    ui.style.display = 'flex';
  } catch(e) { alert('Error: ' + e.message); }
}

function getUniqueQuarters() {
  var set = {};
  predictorInfo.settings.forEach(function(s) { set[String(s.quarter)] = true; });
  return Object.keys(set).sort();
}

function getSettingsForQuarter(q) {
  return predictorInfo.settings.filter(function(s) { return String(s.quarter) === q; });
}

function renderDots() {
  var el = document.getElementById('dots');
  el.innerHTML = quarters.map(function(_, i) {
    return '<div class="dot' + (i === currentQI ? ' active' : '') + '" onclick="goToQuarter(' + i + ')"></div>';
  }).join('');
}

function goToQuarter(i) {
  currentQI = i;
  renderQuarter();
  renderDots();
}

function renderQuarter() {
  var q = quarters[currentQI];
  var titleInfo = predictorInfo.titles ? predictorInfo.titles[q] : null;
  var settings = getSettingsForQuarter(q);

  var html = '<div class="quarter-header">'
    + '<div class="title">' + (titleInfo ? titleInfo.quarter : ('Q' + q)) + '</div>'
    + (titleInfo && titleInfo.prize ? '<div class="prize">' + titleInfo.prize + '</div>' : '')
    + '<div class="count">Predict ' + settings.length + ' outcomes</div></div>';

  settings.forEach(function(s) {
    var teamKey = s.team_key === 'TOTAL' ? 'COMBINED' : s.team_key;
    var selKey = q + ':' + s.id;
    var sel = selections[selKey] || null;

    html += '<div class="cat-card"><div class="cat-title">' + teamKey + ' ' + s.category.label + '</div><div class="options">';

    [['under','Under',s.points.under], ['exact','Exactly',s.points.exact], ['over','Over',s.points.over]].forEach(function(opt) {
      var key = opt[0], label = opt[1], pts = opt[2];
      var isSelected = sel === key;
      var cls = 'opt-btn';
      if (isSelected) cls += key === 'exact' ? ' sel-yellow' : ' sel-green';

      html += '<div class="' + cls + '" onclick="selectOption(\\'' + q + '\\',' + s.id + ',\\'' + key + '\\')">'
        + '<span>' + label + '</span>'
        + '<span class="opt-value">' + s.value + '</span>'
        + '<span class="opt-badge">+' + pts.toLocaleString() + '</span></div>';
    });

    html += '</div></div>';
  });

  document.getElementById('categories').innerHTML = html;
  updateSubmitBtn();
}

function selectOption(quarter, catId, option) {
  if (submitted) return;
  selections[quarter + ':' + catId] = option;
  renderQuarter();
}

function updateSubmitBtn() {
  var btn = document.getElementById('submit-btn');
  if (submitted) { btn.disabled = true; btn.textContent = 'Submitted'; return; }
  var allSelected = quarters.every(function(q) {
    return getSettingsForQuarter(q).every(function(s) {
      return !!selections[q + ':' + s.id];
    });
  });
  btn.disabled = !allSelected;
}

async function submitPredictions() {
  if (submitted) return;
  var btn = document.getElementById('submit-btn');
  btn.disabled = true; btn.textContent = 'Submitting...';

  var predictions = quarters.map(function(q) {
    var preds = getSettingsForQuarter(q).map(function(s) {
      var opt = selections[q + ':' + s.id];
      return opt ? (s.id + ':' + opt) : null;
    }).filter(Boolean);
    return { quarter: q, predictions: preds };
  });

  try {
    var res = await fetch('/v1/contest/register-predictions', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contest_predictor_id: CONTEST_ID, contest_user_id: contestUserId, predictions: predictions })
    });
    if (!res.ok) throw new Error('Failed');
    submitted = true;
    showSuccess();
    setTimeout(function() { updateSubmitBtn(); }, 5000);
  } catch(e) {
    alert('Error: ' + e.message);
    btn.disabled = false; btn.textContent = 'Submit';
  }
}
</script>
</body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// ─── Bingo Web App ─────────────────────────────────────────────────
router.get("/bingo/:id", (_req: Request, res: Response) => {
  const html = `${sharedHead("SportsIQ — Bingo", BINGO_BG)}
<body>
<div class="container">
  <div id="loading" class="loading"><div class="spinner"></div></div>
  ${registrationHTML(BINGO_BG)}

  <!-- Home / Reveal screen -->
  <div id="home-screen" class="hidden reveal-wrap">
    <div class="bingo-title">B I N G O</div>
    ${gameHeaderHTML()}
    <div style="padding:12px;">
      <div class="bingo-grid" id="placeholder-grid"></div>
    </div>
    <div style="padding:12px;width:100%;">
      <button class="btn btn-primary" onclick="revealCards()">Reveal My Bingo Card</button>
    </div>
  </div>

  <!-- Cards screen -->
  <div id="cards-screen" class="hidden" style="display:none;flex-direction:column;flex:1;">
    <div class="bingo-title">B I N G O</div>
    ${pointsBarHTML()}
    <div id="card-header"></div>
    <div id="card-tabs" class="tabs"></div>
    <div id="bingo-board" style="flex:1;overflow-y:auto;padding-bottom:20px;"></div>
  </div>
</div>

<script>
${registrationScript("bingo")}
${gameHeaderScript()}
${pointsPollingScript("bingo")}

var gameInfo = null;
var bingoCards = [];
var currentCardIdx = 0;
var gameStatus = '';

window.addEventListener('DOMContentLoaded', function() {
  initRegistration();
  if (contestUserId) {
    document.getElementById('reg-screen').classList.add('hidden');
    startGame();
  } else {
    document.getElementById('loading').classList.add('hidden');
  }
});

async function startGame() {
  try {
    await fetchGameInfo();
    if (contestUserId && gameInfo) {
      await fetchCards();
      showCardsScreen();
    } else if (gameInfo) {
      showHomeScreen();
    }
    document.getElementById('loading').classList.add('hidden');
  } catch(e) { alert('Error: ' + e.message); }
}

async function fetchGameInfo() {
  var res = await fetch('/v1/contest/fetch-game-info-by-bingo-id?id=' + CONTEST_ID);
  var json = await res.json();
  gameInfo = json.data;
  if (gameInfo) gameStatus = gameInfo.status || '';
}

async function fetchCards() {
  var res = await fetch('/v1/contest/get-bingo-cards', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ contest_bingo_id: CONTEST_ID, contest_user_id: contestUserId })
  });
  var json = await res.json();
  bingoCards = json.data || [];
}

function showHomeScreen() {
  document.getElementById('home-screen').classList.remove('hidden');
  var away = { key: gameInfo.away_team_key, logo_url: gameInfo.away_team_logo_url, primary_color: gameInfo.away_team_primary_color, wins: gameInfo.away_team_wins, losses: gameInfo.away_team_losses };
  var home = { key: gameInfo.home_team_key, logo_url: gameInfo.home_team_logo_url, primary_color: gameInfo.home_team_primary_color, wins: gameInfo.home_team_wins, losses: gameInfo.home_team_losses };
  renderGameHeader(away, home, getTimeString(gameInfo.date_time));

  // Placeholder grid
  var ph = '';
  for (var i = 0; i < 9; i++) ph += '<div class="bingo-sq placeholder"><div class="sq-desc">?</div></div>';
  document.getElementById('placeholder-grid').innerHTML = ph;
}

function showCardsScreen() {
  document.getElementById('home-screen').classList.add('hidden');
  var cs = document.getElementById('cards-screen');
  cs.classList.remove('hidden');
  cs.style.display = 'flex';
  renderCardHeader();
  renderCardTabs();
  startPointsPolling();
  startGamePolling();
}

async function revealCards() {
  if (!contestUserId) return;
  await fetchCards();
  showCardsScreen();
}

function renderCardHeader() {
  if (!gameInfo) return;
  var away = { key: gameInfo.away_team_key, logo_url: gameInfo.away_team_logo_url, primary_color: gameInfo.away_team_primary_color, wins: gameInfo.away_team_wins, losses: gameInfo.away_team_losses };
  var home = { key: gameInfo.home_team_key, logo_url: gameInfo.home_team_logo_url, primary_color: gameInfo.home_team_primary_color, wins: gameInfo.home_team_wins, losses: gameInfo.home_team_losses };
  var card = bingoCards[currentCardIdx];
  var title = getTimeString(gameInfo.date_time);
  if (gameInfo.status === 'InProgress' && card && gameInfo.quarter === card.quarter) {
    var m = gameInfo.time_remaining_minutes || 0;
    var s = gameInfo.time_remaining_seconds || 0;
    title = m + ':' + String(s).padStart(2, '0');
  }
  var el = document.getElementById('card-header');
  el.innerHTML = '<div id="game-header" class="game-header"></div>';
  renderGameHeader(away, home, title);
}

function renderCardTabs() {
  if (bingoCards.length === 0) {
    document.getElementById('bingo-board').innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;">No bingo cards yet.</div>';
    return;
  }
  if (currentCardIdx >= bingoCards.length) currentCardIdx = 0;

  var tabsEl = document.getElementById('card-tabs');
  if (bingoCards.length > 1) {
    tabsEl.innerHTML = bingoCards.map(function(c, i) {
      var label = getQuarterText(c.quarter, gameInfo ? gameInfo.game_type : null);
      return '<button class="tab-btn' + (i === currentCardIdx ? ' active' : '') + '" onclick="switchCard(' + i + ')">' + label + '</button>';
    }).join('');
  } else { tabsEl.innerHTML = ''; }

  renderCard();
}

function switchCard(idx) {
  currentCardIdx = idx;
  renderCardHeader();
  renderCardTabs();
}

function getQuarterText(quarter, gameType) {
  if (gameType === 'cbb') { return quarter === '1' ? '1ST HALF' : '2ND HALF'; }
  if (gameType === 'nhl') { var n = parseInt(quarter); if (!isNaN(n)) return n + (n===1?'ST':n===2?'ND':'RD') + ' PERIOD'; }
  if (gameType === 'mlb') { var n2 = parseInt(quarter); if (!isNaN(n2)) return n2 + (n2===1?'ST':n2===2?'ND':n2===3?'RD':'TH') + ' INNING'; }
  if (quarter === '1') return '1ST QUARTER';
  if (quarter === '2') return '2ND QUARTER';
  if (quarter === '3') return '3RD QUARTER';
  if (quarter === '4') return '4TH QUARTER';
  return 'FULL GAME';
}

function renderCard() {
  var card = bingoCards[currentCardIdx];
  if (!card || !card.squares) return;

  var html = '<div style="padding:4px 12px 0;"><div style="font-size:13px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-align:center;margin-bottom:6px;">'
    + getQuarterText(card.quarter, gameInfo ? gameInfo.game_type : null) + '</div></div>';

  html += '<div class="bingo-grid">';
  for (var i = 1; i <= 9; i++) {
    var sq = card.squares[i] || card.squares[String(i)];
    if (!sq) { html += '<div class="bingo-sq placeholder"><div class="sq-desc">-</div></div>'; continue; }
    var pct = sq.total > 0 ? Math.min(100, Math.round((sq.done / sq.total) * 100)) : 0;
    html += '<div class="bingo-sq' + (sq.completed ? ' completed' : '') + '">'
      + '<div class="sq-fill" style="height:' + pct + '%"></div>'
      + '<div class="sq-top"><span>' + (sq.team_key || '') + '</span><span>' + sq.done + '/' + sq.total + '</span></div>'
      + '<div class="sq-desc">' + (sq.description || '') + '</div>'
      + '<div class="sq-pts">+' + (sq.points || 0) + '</div>'
      + '</div>';
  }
  html += '</div>';

  if (card.retryable) {
    html += '<button class="swap-btn" onclick="swapCard(\\'' + card.id + '\\')">Get another card</button>';
  }

  document.getElementById('bingo-board').innerHTML = html;
}

async function swapCard(cardId) {
  try {
    var res = await fetch('/v1/contest/get-another-bingo-card', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contest_bingo_card_id: cardId })
    });
    var json = await res.json();
    if (json.data) { bingoCards[currentCardIdx] = json.data; renderCard(); }
  } catch(e) { alert('Could not swap card.'); }
}

function startGamePolling() {
  async function poll() {
    if (document.hidden) return;
    try {
      await fetchGameInfo();
      renderCardHeader();
      if (gameStatus === 'InProgress' && contestUserId) {
        await fetchCards();
        renderCard();
      }
    } catch(e) {}
  }
  setInterval(function() { poll(); }, gameStatus === 'InProgress' ? 5000 : 60000);
  document.addEventListener('visibilitychange', function() { if (!document.hidden) poll(); });
}
</script>
</body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

export default router;
