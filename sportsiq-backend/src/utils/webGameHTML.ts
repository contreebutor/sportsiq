/**
 * Shared HTML/CSS/JS helpers for the self-contained web contest games.
 * Styled to match the mobile app's ContestScreen exactly.
 */

export const sharedStyles = (): string => `
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; }
  .container { max-width: 480px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
  .hidden { display: none !important; }

  /* Loading */
  .loading { flex: 1; display: flex; align-items: center; justify-content: center; }
  .spinner { width: 36px; height: 36px; border: 3px solid rgba(85,69,211,0.3); border-top-color: #5545D3; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Registration */
  .reg-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .reg-card { background: #1D1A35; border: 1px solid rgba(85,69,211,0.25); border-radius: 16px; padding: 28px 20px; width: 100%; }
  .reg-card .logo { font-size: 28px; font-weight: 900; text-align: center; margin-bottom: 4px; color: #f8fafc; }
  .reg-card .logo span { color: #5545D3; }
  .reg-card .subtitle { text-align: center; color: #64748b; font-size: 12px; letter-spacing: 2px; margin-bottom: 20px; }
  .reg-card label { display: block; color: #94a3b8; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
  .reg-card input { width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 12px 14px; color: #f8fafc; font-size: 15px; outline: none; margin-bottom: 12px; }
  .reg-card input:focus { border-color: #5545D3; }
  .reg-card .error { color: #ef4444; font-size: 12px; min-height: 18px; margin-bottom: 6px; }

  /* Buttons */
  .btn { display: block; width: 100%; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; cursor: pointer; border: none; text-decoration: none; color: #fff; }
  .btn-primary { background: #4f46e5; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Points bar — matches PointsBar.tsx */
  .points-bar { padding: 0 16px; }
  .points-bar-inner { display: flex; align-items: center; justify-content: center; gap: 12px; background: rgba(79,70,229,0.5); border-radius: 8px 8px 0 0; padding: 8px; font-size: 14px; font-weight: 500; color: #fff; }

  /* Game header — matches ContestGameHeader.tsx gradient */
  .game-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; }
  .team-col { display: flex; align-items: center; gap: 8px; flex: 1; }
  .team-col.right { justify-content: flex-end; }
  .team-col.right .team-info { text-align: right; }
  .team-col img { width: 48px; height: 48px; object-fit: contain; }
  .team-info .key { font-size: 18px; font-weight: 600; line-height: 1.2; }
  .team-info .record { font-size: 16px; font-weight: 300; }
  .game-time { font-size: 16px; font-weight: 500; color: #fff; text-align: center; white-space: nowrap; padding: 0 8px; }

  /* Quarter dots (predictor) */
  .dots { display: flex; justify-content: center; gap: 6px; padding: 8px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #4f46e5; }
  .dot.active { background: #14b8a6; }

  /* Quarter tabs */
  .tabs { display: flex; gap: 6px; padding: 8px 12px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tabs::-webkit-scrollbar { display: none; }
  .tab-btn { flex-shrink: 0; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid rgba(79,70,229,0.4); background: transparent; color: #94a3b8; cursor: pointer; }
  .tab-btn.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }

  /* Category card — matches CategoryCard.tsx #1D1A35 bg */
  .cat-card { background: #1D1A35; border-radius: 4px; padding: 12px 12px 24px; margin: 0 8px 10px; }
  .cat-card .cat-title { color: #fff; text-align: center; font-size: 16px; font-weight: 500; margin-bottom: 8px; }
  .cat-card .options { display: flex; gap: 8px; }

  /* Prediction button — matches PredictionButton color logic */
  .opt-btn { flex: 1; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 8px 20px; border-radius: 6px; min-height: 60px; cursor: pointer; border: 2px solid transparent; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); font-size: 14px; }
  .opt-btn .opt-value { font-size: 16px; font-weight: 600; }
  .opt-btn .opt-badge { position: absolute; bottom: -12px; background: #423F55; border: 2px solid #1D1A35; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 500; color: #fff; }
  /* Selected states */
  .opt-btn.sel-green { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.5); color: #4ade80; }
  .opt-btn.sel-green .opt-badge { background: #1F5F47; }
  .opt-btn.sel-yellow { background: rgba(234,179,8,0.15); border-color: rgba(234,179,8,0.5); color: #facc15; }
  .opt-btn.sel-yellow .opt-badge { background: #775929; }

  /* Quarter header (predictor) */
  .quarter-header { padding: 12px 16px 4px; }
  .quarter-header .title { font-size: 15px; font-weight: 800; letter-spacing: 2px; color: #f8fafc; }
  .quarter-header .prize { font-size: 12px; color: #22c55e; font-weight: 600; }
  .quarter-header .count { font-size: 11px; color: #64748b; margin-top: 2px; }

  /* Bingo */
  .bingo-title { text-align: center; font-size: 24px; font-weight: 700; letter-spacing: 8px; color: #fff; padding: 12px; }
  .bingo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 0 12px; }
  .bingo-sq { position: relative; background: #1D1A35; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 6px; display: flex; flex-direction: column; align-items: center; text-align: center; overflow: hidden; min-height: 100px; }
  .bingo-sq.completed { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.3); }
  .bingo-sq .sq-fill { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(79,70,229,0.2); transition: height 0.3s; }
  .bingo-sq .sq-top { position: relative; display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 10px; color: #94a3b8; margin-bottom: 4px; }
  .bingo-sq .sq-top img { width: 18px; height: 18px; object-fit: contain; }
  .bingo-sq .sq-desc { position: relative; flex: 1; display: flex; align-items: center; font-size: 11px; font-weight: 600; color: #f8fafc; line-height: 1.3; }
  .bingo-sq .sq-pts { position: relative; font-size: 10px; font-weight: 700; color: #5545D3; margin-top: 4px; }
  .bingo-sq.placeholder { opacity: 0.3; }

  /* Swap card button */
  .swap-btn { margin: 12px; padding: 12px; border-radius: 8px; border: none; background: #4f46e5; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; text-align: center; width: calc(100% - 24px); }

  /* Submit area */
  .submit-area { padding: 12px 16px; }

  /* Success overlay — matches SuccessOverlay.tsx */
  .success-overlay { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; padding: 32px; }
  .success-icon { width: 96px; height: 96px; border: 4px solid #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 56px; margin-bottom: 12px; }
  .success-title { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 8px; }
  .success-msg { font-size: 16px; font-weight: 500; color: #fff; text-align: center; line-height: 1.5; margin-bottom: 24px; }
  .progress-track { width: 100%; height: 8px; background: rgba(79,70,229,0.3); border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; background: #4f46e5; border-radius: 4px; transition: width 0.1s linear; }

  /* Bingo home reveal screen */
  .reveal-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; padding-top: 24px; }
`;

export const sharedHead = (title: string, bgColor: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${title}</title>
  <style>${sharedStyles()} body { background: ${bgColor}; color: #f8fafc; }</style>
</head>`;

export const registrationHTML = (bgColor: string): string => `
  <div id="reg-screen" class="reg-wrap" style="background:${bgColor};">
    <div class="reg-card">
      <div class="logo">Sports<span>IQ</span></div>
      <div class="subtitle">JOIN THE GAME</div>
      <label for="reg-phone">Phone Number</label>
      <input id="reg-phone" type="tel" placeholder="(123) 456-7890" inputmode="tel" autocomplete="tel" />
      <label for="reg-name">Nickname</label>
      <input id="reg-name" type="text" placeholder="Your display name" autocomplete="name" maxlength="20" />
      <div id="reg-error" class="error"></div>
      <button id="reg-submit" class="btn btn-primary" onclick="submitRegistration()">Join</button>
    </div>
  </div>`;

export const registrationScript = (type: "predictor" | "bingo"): string => `
  var CONTEST_ID = location.pathname.split('/').pop();
  var STORAGE_KEY = 'siq_user_${type}_' + CONTEST_ID;
  var contestUserId = sessionStorage.getItem(STORAGE_KEY);

  function formatPhoneInput(el) {
    var d = el.value.replace(/\\D/g, '').slice(0, 10);
    el.dataset.digits = d;
    if (d.length <= 3) el.value = d.length ? '(' + d : '';
    else if (d.length <= 6) el.value = '(' + d.slice(0,3) + ') ' + d.slice(3);
    else el.value = '(' + d.slice(0,3) + ') ' + d.slice(3,6) + '-' + d.slice(6);
  }

  function initRegistration() {
    var phoneEl = document.getElementById('reg-phone');
    phoneEl.addEventListener('input', function() { formatPhoneInput(this); });
  }

  async function submitRegistration() {
    var phoneEl = document.getElementById('reg-phone');
    var nameEl = document.getElementById('reg-name');
    var errEl = document.getElementById('reg-error');
    var digits = (phoneEl.dataset.digits || phoneEl.value.replace(/\\D/g, ''));
    var nickname = nameEl.value.trim();
    errEl.textContent = '';

    if (digits.length < 10) { errEl.textContent = 'Please enter a valid phone number.'; return; }
    if (!nickname) { errEl.textContent = 'Please enter a nickname.'; return; }

    var btn = document.getElementById('reg-submit');
    btn.disabled = true; btn.textContent = 'Joining...';

    try {
      var endpoint = '${type}' === 'predictor'
        ? '/v1/contest/create-user-for-predictor'
        : '/v1/contest/create-user-for-bingo';
      var bodyKey = '${type}' === 'predictor'
        ? 'contest_predictor_id'
        : 'contest_bingo_id';
      var body = { phone: '+1' + digits, nickname: nickname };
      body[bodyKey] = CONTEST_ID;

      var res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      var json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Registration failed');
      contestUserId = json.data.contest_user_id;
      sessionStorage.setItem(STORAGE_KEY, contestUserId);
      document.getElementById('reg-screen').classList.add('hidden');
      startGame();
    } catch (e) {
      errEl.textContent = e.message || 'Something went wrong.';
      btn.disabled = false; btn.textContent = 'Join';
    }
  }
`;

export const gameHeaderScript = (): string => `
  function getReversedColor(bgColor) {
    var hex = (bgColor || '#1e293b').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function(x){return x+x;}).join('');
    var num = parseInt(hex, 16);
    var r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    var lum = (299*r + 587*g + 114*b) / 1000;
    return lum > 180 ? '#222222' : '#ffffff';
  }

  function renderGameHeader(away, home, title) {
    var hdr = document.getElementById('game-header');
    var awayColor = away.primary_color || '#1e293b';
    var homeColor = home.primary_color || '#1e293b';
    var awayText = getReversedColor(awayColor);
    var homeText = getReversedColor(homeColor);
    hdr.style.background = 'linear-gradient(90deg, ' + awayColor + ', ' + homeColor + ')';
    hdr.innerHTML =
      '<div class="team-col">' +
        '<img src="' + (away.logo_url||'') + '" onerror="this.style.display=\\'none\\'" />' +
        '<div class="team-info"><div class="key" style="color:' + awayText + '">' + (away.key||'') + '</div>' +
        '<div class="record" style="color:' + awayText + '">' + (away.wins??0) + '-' + (away.losses??0) + '</div></div>' +
      '</div>' +
      '<div class="game-time">' + (title||'') + '</div>' +
      '<div class="team-col right">' +
        '<div class="team-info"><div class="key" style="color:' + homeText + '">' + (home.key||'') + '</div>' +
        '<div class="record" style="color:' + homeText + '">' + (home.wins??0) + '-' + (home.losses??0) + '</div></div>' +
        '<img src="' + (home.logo_url||'') + '" onerror="this.style.display=\\'none\\'" />' +
      '</div>';
  }

  function getTimeString(dateTime) {
    try {
      var d = new Date(dateTime + (dateTime.indexOf('Z') < 0 && dateTime.indexOf('+') < 0 ? '-05:00' : ''));
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch(e) { return ''; }
  }
`;

export const pointsPollingScript = (type: "predictor" | "bingo"): string => `
  function startPointsPolling() {
    async function poll() {
      if (document.hidden || !contestUserId) return;
      try {
        var [iq, bar] = await Promise.all([
          fetch('/v1/contest/fetch-sportsiq-points', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ contest_user_id: contestUserId })
          }).then(function(r){return r.json();}),
          fetch('/v1/contest/fetch-bar-points', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ contest_user_id: contestUserId, id: CONTEST_ID, type: '${type}' })
          }).then(function(r){return r.json();})
        ]);
        var iqEl = document.getElementById('iq-pts');
        var barEl = document.getElementById('bar-pts');
        if (iqEl) iqEl.textContent = iq.data ?? 0;
        if (barEl) barEl.textContent = bar.data ?? 0;
      } catch(e) {}
    }
    poll();
    setInterval(poll, 60000);
    document.addEventListener('visibilitychange', function() { if (!document.hidden) poll(); });
  }`;

export const pointsBarHTML = (): string => `
  <div class="points-bar">
    <div class="points-bar-inner">
      <span>Points</span>
      <span>-</span>
      <span>IQ <span id="iq-pts">0</span></span>
      <span>|</span>
      <span>Bar <span id="bar-pts">0</span></span>
    </div>
  </div>`;

export const gameHeaderHTML = (): string =>
  `<div id="game-header" class="game-header"></div>`;

export const successOverlayHTML = (): string => `
  <div id="success" class="success-overlay hidden">
    <div class="success-icon">✓</div>
    <div class="success-title">YOU'RE IN!</div>
    <div class="success-msg">Your predictions have been locked in.<br/>Good luck! Watch the live leaderboard on screen to see if you win!</div>
    <div class="progress-track"><div id="success-fill" class="progress-fill" style="width:0%"></div></div>
  </div>`;

export const successScript = (bgColor: string): string => `
  function showSuccess() {
    var el = document.getElementById('success');
    el.style.background = '${bgColor}';
    el.classList.remove('hidden');
    var fill = document.getElementById('success-fill');
    var pct = 0;
    var iv = setInterval(function() {
      pct += 1;
      fill.style.width = pct + '%';
      if (pct >= 100) clearInterval(iv);
    }, 50);
    setTimeout(function() {
      el.classList.add('hidden');
    }, 5000);
  }
`;
