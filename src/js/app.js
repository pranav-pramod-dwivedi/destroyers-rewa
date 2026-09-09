/**
 * DESTROYERS CRICKET CLUB (DES) — APPLICATION ENGINE
 * Pro Sports Franchise Edition • Atal Bihari Vajpayee Memorial Tournament (Rewa)
 */

(function () {
  'use strict';

  const { matches, squad, rivals, stats } = window.DESTROYERS_DATA || { matches: [], squad: [], rivals: [], stats: {} };

  // Known / Iconic Jersey Numbers for top players (or hash-derived)
  const JERSEY_NUMBERS = {
    'p-akhil-mishra': 1,
    'p-kuldeep-sen': 7,
    'p-kumar-kartikeya': 19,
    'p-ashwin-das': 23,
    'p-avesh-khan': 99,
    'p-anubhav-agarwal': 11,
    'p-venkatesh-iyer': 77,
    'p-ritesh-shakya': 12,
    'p-yash-dubey': 18,
    'p-saransh-jain': 24,
    'p-prithviraj-singh-tomar': 10,
    'p-anant-verma': 5,
    'p-subhranshu-senapati': 8,
    'p-prabhanshu-shukla': 4,
    'p-rohit-rajawat': 14,
    'p-pranav-dwivedi': 33, // DE Marquee
    'p-aryan-deshmukh': 9,
    'p-harsh-gawli': 17,
    'p-shivam-shukla': 21,
    'p-rahul-batham': 6
  };

  function getJerseyNumber(p, idx) {
    if (JERSEY_NUMBERS[p.id]) return JERSEY_NUMBERS[p.id];
    // deterministic fallback 2..98
    let hash = 0;
    for (let i = 0; i < p.name.length; i++) hash = (hash << 5) - hash + p.name.charCodeAt(i);
    return Math.abs(hash % 88) + 2;
  }

  // App State
  const state = {
    formatFilter: 'all',
    seasonFilter: 'all',
    resultFilter: 'all',
    searchQuery: '',
    sortBy: 'latest',
    activeRosterTab: 'destroyers', // 'destroyers' or 'rivals'
    rosterRoleFilter: 'all'
  };

  // DOM Elements
  const matchesContainer = document.getElementById('matches-container');
  const rosterContainer = document.getElementById('roster-container');
  const searchInput = document.getElementById('match-search-input');
  const matchCountElem = document.getElementById('filtered-match-count');
  const seasonSelect = document.getElementById('season-select');
  const sortSelect = document.getElementById('sort-select');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContainer = document.getElementById('modal-container');

  function formatDate(str) {
    if (!str) return '';
    const parts = str.split('-');
    if (parts.length !== 3) return str;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = parts[2];
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  }

  function esc(text) {
    if (!text && text !== 0) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ------------------------------------------------------------
  // 60FPS AMBIENT EMBER PARTICLE CANVAS
  // ------------------------------------------------------------
  function initAmbientCanvas() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 45; // lightweight, smooth 60fps

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.8 - 0.3,
        alpha: Math.random() * 0.6 + 0.2,
        decay: Math.random() * 0.003 + 0.001,
        color: Math.random() > 0.4 ? '245, 111, 0' : '255, 195, 0' // ember orange or gold
      });
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.01) * 0.2;
        p.alpha -= p.decay;

        if (p.y < 0 || p.alpha <= 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
          p.alpha = Math.random() * 0.6 + 0.2;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${p.color}, 0.5)`;
        ctx.fill();
      }

      requestAnimationFrame(render);
    }

    render();
  }

  // ------------------------------------------------------------
  // MATCH ARENA FILTERING & RENDERING
  // ------------------------------------------------------------
  function filterMatches() {
    return matches.filter((m) => {
      if (state.formatFilter !== 'all' && m.format.toLowerCase() !== state.formatFilter) return false;
      if (state.seasonFilter !== 'all' && m.seasonYear !== state.seasonFilter) return false;
      if (state.resultFilter === 'des-win' && m.winner !== 'DES') return false;
      if (state.resultFilter === 'de-win' && m.winner !== 'DE') return false;

      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const venueName = (m.venue && m.venue.name) ? m.venue.name.toLowerCase() : '';
        const matchResult = (m.resultText || '').toLowerCase();
        const stage = (m.stage || '').toLowerCase();

        const hasPlayer = m.innings.some((inn) => {
          return inn.batting.some((b) => b.playerName.toLowerCase().includes(q)) ||
                 inn.bowling.some((bo) => bo.playerName.toLowerCase().includes(q));
        });

        const matchesBasic = venueName.includes(q) || matchResult.includes(q) || stage.includes(q) || m.seasonYear.includes(q);
        if (!hasPlayer && !matchesBasic) return false;
      }

      return true;
    });
  }

  function sortMatchesList(list) {
    const sorted = [...list];
    if (state.sortBy === 'latest') sorted.sort((a, b) => b.matchDate.localeCompare(a.matchDate));
    else if (state.sortBy === 'oldest') sorted.sort((a, b) => a.matchDate.localeCompare(b.matchDate));
    else if (state.sortBy === 'highest-total') {
      sorted.sort((a, b) => {
        const maxA = Math.max(...a.innings.map((i) => i.runs || 0));
        const maxB = Math.max(...b.innings.map((i) => i.runs || 0));
        return maxB - maxA;
      });
    } else if (state.sortBy === 'closest') {
      sorted.sort((a, b) => {
        const diffA = a.innings.length === 2 ? Math.abs((a.innings[0].runs || 0) - (a.innings[1].runs || 0)) : 999;
        const diffB = b.innings.length === 2 ? Math.abs((b.innings[0].runs || 0) - (b.innings[1].runs || 0)) : 999;
        return diffA - diffB;
      });
    }
    return sorted;
  }

  function renderMatches() {
    if (!matchesContainer) return;

    const filtered = filterMatches();
    const sorted = sortMatchesList(filtered);

    if (matchCountElem) {
      matchCountElem.textContent = `${sorted.length} ${sorted.length === 1 ? 'CLASH' : 'CLASHES'}`;
    }

    if (sorted.length === 0) {
      matchesContainer.innerHTML = `
        <div style="grid-column: 1/-1; padding: 4rem 2rem; text-align: center; background: var(--c-card-bg); border: 1px dashed var(--b-medium);">
          <h3 style="font-family: var(--f-athletic); font-size: 2rem; color: var(--c-white); margin-bottom: 0.5rem; text-transform: uppercase;">No Rivalry Clashes Found</h3>
          <p style="color: var(--c-gray-400); font-size: 0.875rem; max-width: 44ch; margin: 0 auto 1.5rem;">No matches match your filter. Reset search or select all formats.</p>
          <button id="reset-filter-btn" class="btn-athletic btn-athletic-outline">Reset All Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filter-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.formatFilter = 'all';
          state.seasonFilter = 'all';
          state.resultFilter = 'all';
          state.searchQuery = '';
          if (searchInput) searchInput.value = '';
          if (seasonSelect) seasonSelect.value = 'all';
          document.querySelectorAll('.filter-chip').forEach((p) => p.classList.remove('active'));
          const defaultBtn = document.querySelector('.filter-chip[data-filter="all"]');
          if (defaultBtn) defaultBtn.classList.add('active');
          renderMatches();
        });
      }
      return;
    }

    matchesContainer.innerHTML = sorted.map((m) => {
      const isDesWinner = m.winner === 'DES';
      const isFinal = m.stage && m.stage.toLowerCase().includes('final');

      const deInnings = m.innings[0] || { runs: 0, wickets: 0, overs: 0 };
      const desInnings = m.innings[1] || { runs: 0, wickets: 0, overs: 0 };

      return `
        <div class="pro-match-card ${isFinal ? 'is-final-match' : ''}">
          <div class="pro-match-header">
            <span class="pro-fmt-tag ${m.format.toLowerCase()}">${esc(m.format)} • SEASON ${esc(m.seasonYear)}</span>
            ${isFinal ? '<span style="font-family:var(--f-athletic); font-size:1.1rem; color:var(--c-gold); letter-spacing:0.04em;">2022 CHAMPIONSHIP FINAL</span>' : '<span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); font-weight:700;">MATCH #' + esc(m.matchNumber) + '</span>'}
          </div>

          <div style="font-size:0.75rem; color:var(--c-gray-400); margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem;">
            <span style="font-weight:700; color:var(--c-white);">${formatDate(m.matchDate)}</span>
            <span>•</span>
            <span>${esc(m.venue ? m.venue.name : 'Rewa')}</span>
          </div>

          <div class="pro-scoreboard-box">
            <div class="pro-score-entry">
              <div class="pro-team-ident">
                <div class="pro-team-circle des">DES</div>
                <span class="pro-team-name ${isDesWinner ? 'winner' : ''}">Destroyers</span>
              </div>
              <div class="pro-score-numbers tabular">
                ${desInnings.runs}/${desInnings.wickets}
                <span class="pro-overs-sub">(${desInnings.overs} ov)</span>
              </div>
            </div>

            <div class="pro-score-entry">
              <div class="pro-team-ident">
                <div class="pro-team-circle de">DE</div>
                <span class="pro-team-name ${!isDesWinner ? 'winner' : ''}">DE (Rival)</span>
              </div>
              <div class="pro-score-numbers tabular">
                ${deInnings.runs}/${deInnings.wickets}
                <span class="pro-overs-sub">(${deInnings.overs} ov)</span>
              </div>
            </div>
          </div>

          <div class="pro-result-strip ${isDesWinner ? 'des-victory' : 'de-victory'}">
            <span>${esc(m.resultText)}</span>
          </div>

          ${m.topBat || m.topBowl ? `
            <div style="font-size:0.75rem; color:var(--c-gray-400); margin-bottom:1.25rem; display:flex; flex-direction:column; gap:0.35rem; padding-top:0.75rem; border-top:1px solid var(--b-subtle);">
              ${m.topBat ? `
                <div style="display:flex; justify-content:space-between;">
                  <span>Batting Star: ${esc(m.topBat.playerName)} (${esc(m.topBat.team)})</span>
                  <span class="tabular font-bold" style="color:var(--c-white); font-family:var(--f-mono);">${esc(m.topBat.runs)} runs (${esc(m.topBat.balls)}b)</span>
                </div>
              ` : ''}
              ${m.topBowl ? `
                <div style="display:flex; justify-content:space-between;">
                  <span>Bowling Star: ${esc(m.topBowl.playerName)} (${esc(m.topBowl.team)})</span>
                  <span class="tabular font-bold" style="color:var(--c-emerald); font-family:var(--f-mono);">${esc(m.topBowl.wickets)}/${esc(m.topBowl.runs)}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <button class="btn-inspect-scorecard" data-match-id="${esc(m.id)}">
            <span>Inspect Full Scorecard</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      `;
    }).join('');

    // Attach click listeners for scorecard buttons
    document.querySelectorAll('[data-match-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-match-id');
        openScorecardModal(id);
      });
    });
  }

  // ------------------------------------------------------------
  // SCORECARD MODAL
  // ------------------------------------------------------------
  function openScorecardModal(matchId) {
    const m = matches.find((match) => match.id === matchId);
    if (!m || !modalContainer || !modalOverlay) return;

    const innDE = m.innings[0]; // 1st inn (DE bat, DES bowl)
    const innDES = m.innings[1]; // 2nd inn (DES bat, DE bowl)

    function buildInningsHtml(inn, battingTeam, bowlingTeam) {
      if (!inn) return '<p style="color: var(--c-gray-400); padding: 1.5rem;">Innings details unavailable.</p>';

      const batRows = (inn.batting || []).map((b) => `
        <tr>
          <td style="font-weight: 800; color: var(--c-white); font-family:var(--f-athletic); font-size:1.15rem; letter-spacing:0.04em;">${esc(b.playerName)}</td>
          <td style="color: var(--c-gray-400); font-size: 0.75rem;">${esc(b.dismissal)}</td>
          <td class="num tabular font-bold" style="color: var(--c-white); font-size:1.05rem;">${esc(b.runs)}</td>
          <td class="num tabular">${esc(b.balls)}</td>
          <td class="num tabular">${esc(b.fours)}</td>
          <td class="num tabular">${esc(b.sixes)}</td>
          <td class="num tabular" style="color: var(--c-gold); font-weight:700;">${esc(b.strikeRate)}</td>
        </tr>
      `).join('');

      const bowlRows = (inn.bowling || []).map((bo) => `
        <tr>
          <td style="font-weight: 800; color: var(--c-white); font-family:var(--f-athletic); font-size:1.15rem; letter-spacing:0.04em;">${esc(bo.playerName)}</td>
          <td class="num tabular">${esc(bo.overs)}</td>
          <td class="num tabular">${esc(bo.maidens)}</td>
          <td class="num tabular">${esc(bo.runs)}</td>
          <td class="num tabular font-bold" style="color: var(--c-emerald); font-size:1.05rem;">${esc(bo.wickets)}</td>
          <td class="num tabular" style="color: var(--c-ember-bright); font-weight:700;">${esc(bo.economy)}</td>
        </tr>
      `).join('');

      return `
        <div style="margin-bottom: 2rem;">
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid var(--b-medium); padding-bottom: 0.75rem;">
            <div>
              <span style="font-family:var(--f-mono); font-size:0.75rem; text-transform:uppercase; color:var(--c-gray-400); letter-spacing:0.1em;">Batting Squad: ${esc(battingTeam)}</span>
              <h4 style="font-family: var(--f-athletic); font-size: 1.85rem; font-weight: 900; color: var(--c-white); text-transform:uppercase;">
                ${esc(inn.teamName)} Innings
              </h4>
            </div>
            <div class="tabular" style="font-family: var(--f-mono); font-size: 1.75rem; font-weight: 900; color: var(--c-white);">
              ${inn.runs}/${inn.wickets} <span style="font-size: 0.875rem; color: var(--c-gray-400); font-weight:500;">(${inn.overs} ov • RR ${inn.runRate})</span>
            </div>
          </div>

          <div style="overflow-x:auto; margin-bottom: 2.25rem;">
            <table class="scorecard-data-table">
              <thead>
                <tr>
                  <th>Batter</th>
                  <th>Dismissal</th>
                  <th class="num">R</th>
                  <th class="num">B</th>
                  <th class="num">4s</th>
                  <th class="num">6s</th>
                  <th class="num">SR</th>
                </tr>
              </thead>
              <tbody>
                ${batRows}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 0.75rem;">
            <span style="font-family:var(--f-mono); font-size:0.75rem; text-transform:uppercase; color:var(--c-gray-400); letter-spacing:0.1em;">Bowling Attack: ${esc(bowlingTeam)}</span>
            <h5 style="font-family: var(--f-athletic); font-size: 1.4rem; text-transform: uppercase; color: var(--c-white);">
              Bowling Attack Performance
            </h5>
          </div>
          <div style="overflow-x:auto;">
            <table class="scorecard-data-table">
              <thead>
                <tr>
                  <th>Bowler</th>
                  <th class="num">O</th>
                  <th class="num">M</th>
                  <th class="num">R</th>
                  <th class="num">W</th>
                  <th class="num">Eco</th>
                </tr>
              </thead>
              <tbody>
                ${bowlRows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    modalContainer.innerHTML = `
      <div class="modal-head">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
            <span class="pro-fmt-tag ${m.format.toLowerCase()}">${esc(m.format)} • Season ${esc(m.seasonYear)}</span>
            <span style="font-family:var(--f-mono); font-size: 0.75rem; color: var(--c-gold); font-weight: 800; text-transform:uppercase;">${esc(m.stage || 'League Match')}</span>
          </div>
          <h3 style="font-family: var(--f-athletic); font-size: 2rem; letter-spacing:0.04em; color: var(--c-white); text-transform:uppercase;">
            Destroyers vs DE Match Scorecard
          </h3>
          <p style="font-size: 0.75rem; color: var(--c-gray-400); font-family:var(--f-mono);">
            ${formatDate(m.matchDate)} • ${esc(m.venue ? m.venue.name : 'Rewa')}
          </p>
        </div>
        <div id="modal-close-btn" class="modal-close-icon">&times;</div>
      </div>

      <div class="modal-content-area">
        <div class="pro-result-strip ${m.winner === 'DES' ? 'des-victory' : 'de-victory'}" style="font-size: 1.2rem; padding: 0.9rem 1.4rem; margin-bottom: 2rem;">
          <span>Result: ${esc(m.resultText)}</span>
        </div>

        <div style="display:flex; gap:0.6rem; margin-bottom:1.75rem;">
          <button id="modal-tab-des" class="roster-btn active" style="font-size:1.15rem; padding:0.6rem 1.25rem;">
            Destroyers Innings (${innDES.runs}/${innDES.wickets})
          </button>
          <button id="modal-tab-de" class="roster-btn" style="font-size:1.15rem; padding:0.6rem 1.25rem;">
            DE Innings (${innDE.runs}/${innDE.wickets})
          </button>
        </div>

        <div id="modal-innings-container">
          ${buildInningsHtml(innDES, "Destroyers", "DE (Opponents)")}
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);

    const tabDES = document.getElementById('modal-tab-des');
    const tabDE = document.getElementById('modal-tab-de');
    const display = document.getElementById('modal-innings-container');

    if (tabDES && tabDE && display) {
      tabDES.addEventListener('click', () => {
        tabDES.classList.add('active');
        tabDE.classList.remove('active');
        display.innerHTML = buildInningsHtml(innDES, "Destroyers", "DE (Opponents)");
      });
      tabDE.addEventListener('click', () => {
        tabDE.classList.add('active');
        tabDES.classList.remove('active');
        display.innerHTML = buildInningsHtml(innDE, "DE (Opponents)", "Destroyers");
      });
    }
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ------------------------------------------------------------
  // ROSTER & JERSEY CARDS RENDERING
  // ------------------------------------------------------------
  function renderRoster() {
    if (!rosterContainer) return;

    const list = state.activeRosterTab === 'destroyers' ? squad : rivals;

    const filtered = list.filter((p) => {
      if (state.rosterRoleFilter === 'all') return true;
      const r = (p.role || '').toLowerCase();
      if (state.rosterRoleFilter === 'batsman') return r.includes('bat') && !r.includes('all-rounder');
      if (state.rosterRoleFilter === 'all-rounder') return r.includes('all-rounder');
      if (state.rosterRoleFilter === 'bowler') return r.includes('bowl');
      if (state.rosterRoleFilter === 'wicketkeeper') return r.includes('wicketkeeper');
      return true;
    });

    rosterContainer.innerHTML = filtered.map((p, idx) => {
      const jerseyNum = getJerseyNumber(p, idx);
      const isDestroyer = state.activeRosterTab === 'destroyers';

      return `
        <div class="jersey-player-card" data-player-id="${esc(p.id)}" data-player-team="${isDestroyer ? 'DES' : 'DE'}">
          <div class="jersey-big-number">${jerseyNum}</div>
          <div class="jersey-player-role">${esc(p.role)}</div>
          <h3 class="jersey-player-name">#${jerseyNum} ${esc(p.name)}</h3>
          <div class="jersey-player-subtitle">${isDestroyer ? 'Destroyers Squad' : 'DE Opponent Squad'} • ${p.matches} Rivalry Clashes</div>

          <div class="jersey-stats-strip">
            <div>
              <div class="jersey-stat-val tabular" style="color:var(--c-gold);">${esc(p.batting.runs)}</div>
              <div class="jersey-stat-lbl">Runs</div>
            </div>
            <div>
              <div class="jersey-stat-val tabular">${esc(p.batting.highestScore)}</div>
              <div class="jersey-stat-lbl">HS</div>
            </div>
            <div>
              <div class="jersey-stat-val tabular" style="color:var(--c-emerald);">${esc(p.bowling.wickets)}</div>
              <div class="jersey-stat-lbl">Wkts</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listener for player modal
    document.querySelectorAll('[data-player-id]').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-player-id');
        const team = card.getAttribute('data-player-team');
        openPlayerModal(id, team);
      });
    });
  }

  function openPlayerModal(playerId, team) {
    const list = team === 'DES' ? squad : rivals;
    const p = list.find((player) => player.id === playerId);
    if (!p || !modalContainer || !modalOverlay) return;

    const jerseyNum = getJerseyNumber(p, 0);

    const logs = [];
    matches.forEach((m) => {
      let batLog = null;
      let bowlLog = null;

      m.innings.forEach((inn) => {
        const b = inn.batting.find((item) => item.playerId === playerId);
        if (b) batLog = { ...b, team: inn.teamShort };

        const bo = inn.bowling.find((item) => item.playerId === playerId);
        if (bo) bowlLog = { ...bo, against: inn.teamShort };
      });

      if (batLog || bowlLog) {
        logs.push({ match: m, batting: batLog, bowling: bowlLog });
      }
    });

    const logRows = logs.map((item) => `
      <tr>
        <td style="font-weight: 700; color: var(--c-white); font-family:var(--f-athletic); font-size:1.15rem;">${formatDate(item.match.matchDate)}</td>
        <td><span class="pro-fmt-tag ${item.match.format.toLowerCase()}">${esc(item.match.format)}</span></td>
        <td class="num tabular font-bold" style="color: var(--c-white);">
          ${item.batting ? `${item.batting.runs} (${item.batting.balls}b)` : '—'}
        </td>
        <td style="font-size: 0.75rem; color: var(--c-gray-400);">${item.batting ? esc(item.batting.dismissal) : 'DNB'}</td>
        <td class="num tabular font-bold" style="color: var(--c-emerald);">
          ${item.bowling ? `${item.bowling.wickets}/${item.bowling.runs} (${item.bowling.overs} ov)` : '—'}
        </td>
        <td>
          <span class="pro-result-strip ${item.match.winner === 'DES' ? 'des-victory' : 'de-victory'}" style="margin: 0; padding: 0.35rem 0.65rem; font-size: 0.8125rem;">
            ${item.match.winner === 'DES' ? 'DES Win' : 'DE Win'}
          </span>
        </td>
      </tr>
    `).join('');

    modalContainer.innerHTML = `
      <div class="modal-head">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem;">
            <span class="pro-fmt-tag t20">JERSEY #${jerseyNum}</span>
            <span style="font-family:var(--f-mono); font-size: 0.75rem; color: var(--c-gold); font-weight: 800; text-transform:uppercase;">${esc(p.role)}</span>
          </div>
          <h3 style="font-family: var(--f-athletic); font-size: 2.25rem; color: var(--c-white); text-transform:uppercase; letter-spacing:0.04em;">
            #${jerseyNum} ${esc(p.name)}
          </h3>
          <p style="font-size: 0.75rem; color: var(--c-gray-400); font-family:var(--f-mono);">
            ${team === 'DES' ? 'DESTROYERS CRICKET CLUB' : 'DE OPPONENT SQUAD'} • 24 RIVALRY CLASH RECORD
          </p>
        </div>
        <div id="modal-close-btn" class="modal-close-icon">&times;</div>
      </div>

      <div class="modal-content-area">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 2.5rem;">
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-medium); padding:1rem; text-align:center;">
            <div class="jersey-stat-lbl">Matches</div>
            <div class="jersey-stat-val tabular">${p.matches}</div>
          </div>
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-medium); padding:1rem; text-align:center;">
            <div class="jersey-stat-lbl">Total Runs</div>
            <div class="jersey-stat-val tabular" style="color:var(--c-gold);">${esc(p.batting.runs)}</div>
          </div>
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-medium); padding:1rem; text-align:center;">
            <div class="jersey-stat-lbl">Highest Score</div>
            <div class="jersey-stat-val tabular">${esc(p.batting.highestScore)}</div>
          </div>
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-medium); padding:1rem; text-align:center;">
            <div class="jersey-stat-lbl">Batting Avg</div>
            <div class="jersey-stat-val tabular">${esc(p.batting.average)}</div>
          </div>
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-medium); padding:1rem; text-align:center;">
            <div class="jersey-stat-lbl">Strike Rate</div>
            <div class="jersey-stat-val tabular">${esc(p.batting.strikeRate)}</div>
          </div>
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-medium); padding:1rem; text-align:center;">
            <div class="jersey-stat-lbl">50s / 100s</div>
            <div class="jersey-stat-val tabular">${esc(p.batting.fifties)} / ${esc(p.batting.hundreds)}</div>
          </div>
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-medium); padding:1rem; text-align:center;">
            <div class="jersey-stat-lbl">Wickets</div>
            <div class="jersey-stat-val tabular" style="color:var(--c-emerald);">${esc(p.bowling.wickets)}</div>
          </div>
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-medium); padding:1rem; text-align:center;">
            <div class="jersey-stat-lbl">Best Bowling</div>
            <div class="jersey-stat-val tabular">${esc(p.bowling.bestBowling)}</div>
          </div>
        </div>

        <h4 style="font-family: var(--f-athletic); font-size: 1.5rem; color: var(--c-white); margin-bottom: 1rem; text-transform:uppercase;">
          DE vs DES Individual Match Logs
        </h4>

        <div style="overflow-x:auto;">
          <table class="scorecard-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fmt</th>
                <th class="num">Runs (Balls)</th>
                <th>Dismissal</th>
                <th class="num">Bowling</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              ${logRows.length ? logRows : '<tr><td colspan="6" style="text-align:center; color:var(--c-gray-400);">No match appearances recorded.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  }

  // ------------------------------------------------------------
  // SETUP EVENT LISTENERS
  // ------------------------------------------------------------
  function setupEventListeners() {
    // Format Filters
    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.formatFilter = btn.getAttribute('data-filter');
        renderMatches();
      });
    });

    // Result Filters
    document.querySelectorAll('[data-result-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-result-filter]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.resultFilter = btn.getAttribute('data-result-filter');
        renderMatches();
      });
    });

    // Season Dropdown
    if (seasonSelect) {
      seasonSelect.addEventListener('change', (e) => {
        state.seasonFilter = e.target.value;
        renderMatches();
      });
    }

    // Sort Dropdown
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderMatches();
      });
    }

    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        renderMatches();
      });
    }

    // Roster Tab Switch (Destroyers vs Rivals)
    document.querySelectorAll('[data-roster-tab]').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-roster-tab]').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeRosterTab = tab.getAttribute('data-roster-tab');
        renderRoster();
      });
    });

    // Roster Role Filter
    document.querySelectorAll('[data-roster-role]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-roster-role]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.rosterRoleFilter = btn.getAttribute('data-roster-role');
        renderRoster();
      });
    });

    // Modal Background Click
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAmbientCanvas();
    setupEventListeners();
    renderMatches();
    renderRoster();
  });

})();


  // --- Franchise Countdown Timer ---
  function initCountdown() {
    const targetDate = new Date("2025-09-10T14:00:00+05:30").getTime();
    const dEl = document.getElementById("cd-days");
    const hEl = document.getElementById("cd-hours");
    const mEl = document.getElementById("cd-mins");
    const sEl = document.getElementById("cd-secs");
    if (!dEl || !hEl || !mEl || !sEl) return;

    function update() {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      dEl.textContent = days;
      hEl.textContent = String(hours).padStart(2, "0");
      mEl.textContent = String(mins).padStart(2, "0");
      sEl.textContent = String(secs).padStart(2, "0");
    }
    update();
    setInterval(update, 1000);
  }

  // --- Franchise Squad Role Filter ---
  function initSquadFilter() {
    const container = document.getElementById("squad-filter-controls");
    const grid = document.getElementById("players-grid");
    if (!container || !grid) return;

    const buttons = container.querySelectorAll(".role-btn");
    const cards = grid.querySelectorAll(".jersey-player-card");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => {
          b.classList.remove("btn-athletic-primary");
          b.classList.add("btn-athletic-outline");
        });
        btn.classList.remove("btn-athletic-outline");
        btn.classList.add("btn-athletic-primary");

        const filter = btn.getAttribute("data-filter");
        cards.forEach((card) => {
          const role = card.getAttribute("data-role") || "";
          if (filter === "all" || role.toLowerCase().includes(filter.toLowerCase())) {
            card.style.display = "";
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    initCountdown();
    initSquadFilter();
  });

/* Format & Season Filters for One Day & T20 Fixtures */
document.addEventListener('DOMContentLoaded', () => {
  const formatButtons = document.querySelectorAll('.format-filter-btn');
  const seasonButtons = document.querySelectorAll('.season-filter-btn');
  const matchCards = document.querySelectorAll('.pro-match-card');
  if (!matchCards.length) return;

  let activeFormat = 'all';
  let activeSeason = 'all';

  function applyFilters() {
    let visibleCount = 0;
    matchCards.forEach((card) => {
      const format = (card.getAttribute('data-format') || '').toUpperCase();
      const season = card.getAttribute('data-season') || '';

      const matchFormat = activeFormat === 'all' || 
        (activeFormat === 'T20' && format.includes('T20')) || 
        (activeFormat === 'ODI' && (format.includes('ODI') || format.includes('ONE-DAY')));

      const matchSeason = activeSeason === 'all' || season === activeSeason;

      if (matchFormat && matchSeason) {
        card.style.display = 'flex';
        card.style.opacity = '1';
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.style.opacity = '0';
      }
    });

    const countDisplay = document.getElementById('filter-matches-count');
    if (countDisplay) {
      countDisplay.textContent = visibleCount;
    }
  }

  formatButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      formatButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFormat = btn.getAttribute('data-format');
      applyFilters();
    });
  });

  seasonButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      seasonButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeSeason = btn.getAttribute('data-season');
      applyFilters();
    });
  });
});
