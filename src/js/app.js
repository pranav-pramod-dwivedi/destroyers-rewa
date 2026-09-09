/**
 * DESTROYERS CRICKET CLUB (DES) — APPLICATION ENGINE
 * Atal Bihari Vajpayee Memorial Tournament • Rewa (RDCA)
 */

(function () {
  'use strict';

  const { matches, squad, rivals, stats } = window.DESTROYERS_DATA || { matches: [], squad: [], rivals: [], stats: {} };

  // App State
  const state = {
    formatFilter: 'all',
    seasonFilter: 'all',
    resultFilter: 'all',
    searchQuery: '',
    sortBy: 'latest',
    viewMode: 'grid',
    activeRosterTab: 'destroyers', // 'destroyers' or 'rivals'
    rosterRoleFilter: 'all',
    activeMatchModal: null,
    activePlayerModal: null
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

  // Format date helper: "2021-08-01" -> "01 Aug 2021"
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
  // MATCH FILTERING & RENDERING
  // ------------------------------------------------------------
  function filterMatches() {
    return matches.filter((m) => {
      // Format
      if (state.formatFilter !== 'all' && m.format.toLowerCase() !== state.formatFilter) {
        return false;
      }

      // Season
      if (state.seasonFilter !== 'all' && m.seasonYear !== state.seasonFilter) {
        return false;
      }

      // Result
      if (state.resultFilter === 'des-win' && m.winner !== 'DES') return false;
      if (state.resultFilter === 'de-win' && m.winner !== 'DE') return false;

      // Search Query
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
    if (state.sortBy === 'latest') {
      sorted.sort((a, b) => b.matchDate.localeCompare(a.matchDate));
    } else if (state.sortBy === 'oldest') {
      sorted.sort((a, b) => a.matchDate.localeCompare(b.matchDate));
    } else if (state.sortBy === 'highest-total') {
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
        <div style="grid-column: 1/-1; padding: 4rem 2rem; text-align: center; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-med);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🏏</div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: var(--text-pure); margin-bottom: 0.5rem; text-transform: uppercase;">No Rivalry Clashes Found</h3>
          <p style="color: var(--text-muted); font-size: 0.875rem; max-width: 42ch; margin: 0 auto 1.5rem;">No matches match your current filter selection. Try resetting filters or changing your search query.</p>
          <button id="reset-filter-btn" class="btn-ghost">Reset All Filters</button>
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
          document.querySelectorAll('.filter-btn').forEach((p) => p.classList.remove('active'));
          const defaultBtn = document.querySelector('.filter-btn[data-filter="all"]');
          if (defaultBtn) defaultBtn.classList.add('active');
          renderMatches();
        });
      }
      return;
    }

    if (state.viewMode === 'grid') {
      matchesContainer.className = 'matches-grid';
      matchesContainer.innerHTML = sorted.map((m) => renderMatchCard(m)).join('');
    } else {
      matchesContainer.className = 'matches-list';
      matchesContainer.innerHTML = sorted.map((m) => renderMatchListItem(m)).join('');
    }

    // Attach click listeners for scorecard buttons
    document.querySelectorAll('[data-match-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-match-id');
        openScorecardModal(id);
      });
    });
  }

  function renderMatchCard(m) {
    const isDesWinner = m.winner === 'DES';
    const isFinal = m.stage && m.stage.toLowerCase().includes('final');

    const deInnings = m.innings[0] || { runs: 0, wickets: 0, overs: 0 };
    const desInnings = m.innings[1] || { runs: 0, wickets: 0, overs: 0 };

    return `
      <div class="match-card ${isFinal ? 'is-final' : ''}">
        <div class="card-top">
          <span class="fmt-pill ${m.format.toLowerCase()}">${esc(m.format)} • SEASON ${esc(m.seasonYear)}</span>
          ${isFinal ? '<span style="font-family:var(--font-display); font-size:0.6875rem; font-weight:900; color:var(--gold); letter-spacing:0.06em;">🏆 2022 CHAMPIONSHIP FINAL</span>' : '<span style="font-family:var(--font-mono); font-size:0.6875rem; color:var(--text-muted); font-weight:700;">MATCH #' + esc(m.matchNumber) + '</span>'}
        </div>

        <div class="card-date-line">
          <span style="font-weight:700; color:var(--text-high);">${formatDate(m.matchDate)}</span>
          <span>•</span>
          <span>${esc(m.venue ? m.venue.name : 'Rewa')}</span>
        </div>

        <div class="card-scoreboard">
          <div class="score-row">
            <div class="score-team">
              <div class="team-badge des">DES</div>
              <span class="team-title ${isDesWinner ? 'winner' : ''}">Destroyers</span>
            </div>
            <div class="score-figures tabular">
              ${desInnings.runs}/${desInnings.wickets}
              <span class="score-overs">(${desInnings.overs} ov)</span>
            </div>
          </div>

          <div class="score-row">
            <div class="score-team">
              <div class="team-badge de">DE</div>
              <span class="team-title ${!isDesWinner ? 'winner' : ''}">DE (Rival)</span>
            </div>
            <div class="score-figures tabular">
              ${deInnings.runs}/${deInnings.wickets}
              <span class="score-overs">(${deInnings.overs} ov)</span>
            </div>
          </div>
        </div>

        <div class="card-outcome-banner ${isDesWinner ? 'des-win' : 'de-win'}">
          <span>${isDesWinner ? '🏆' : '⚡'}</span>
          <span>${esc(m.resultText)}</span>
        </div>

        ${m.topBat || m.topBowl ? `
          <div class="card-performers">
            ${m.topBat ? `
              <div class="performer-entry">
                <span>🏏 ${esc(m.topBat.playerName)} <span style="color:var(--text-dim); font-size:0.7rem;">(${esc(m.topBat.team)})</span></span>
                <span class="tabular" style="font-family:var(--font-mono); font-weight:800; color:var(--text-pure);">${esc(m.topBat.runs)} runs (${esc(m.topBat.balls)}b)</span>
              </div>
            ` : ''}
            ${m.topBowl ? `
              <div class="performer-entry">
                <span>🎯 ${esc(m.topBowl.playerName)} <span style="color:var(--text-dim); font-size:0.7rem;">(${esc(m.topBowl.team)})</span></span>
                <span class="tabular" style="font-family:var(--font-mono); font-weight:800; color:var(--emerald);">${esc(m.topBowl.wickets)}/${esc(m.topBowl.runs)} (${esc(m.topBowl.overs)} ov)</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <button class="btn-scorecard-reveal" data-match-id="${esc(m.id)}">
          <span>Inspect Full Scorecard</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    `;
  }

  function renderMatchListItem(m) {
    const isDesWinner = m.winner === 'DES';
    const deInnings = m.innings[0] || { runs: 0, wickets: 0, overs: 0 };
    const desInnings = m.innings[1] || { runs: 0, wickets: 0, overs: 0 };

    return `
      <div class="match-list-item">
        <div>
          <span class="fmt-pill ${m.format.toLowerCase()}">${esc(m.format)}</span>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem; font-weight: 600;">${formatDate(m.matchDate)}</div>
        </div>

        <div>
          <div style="font-weight: 800; font-size: 0.875rem; color: ${isDesWinner ? 'var(--text-pure)' : 'var(--text-med)'}; font-family:var(--font-display);">
            Destroyers: <span class="tabular font-bold" style="color:var(--text-pure);">${desInnings.runs}/${desInnings.wickets}</span> (${desInnings.overs} ov)
          </div>
        </div>

        <div>
          <div style="font-weight: 800; font-size: 0.875rem; color: ${!isDesWinner ? 'var(--text-pure)' : 'var(--text-med)'}; font-family:var(--font-display);">
            DE: <span class="tabular font-bold" style="color:var(--text-pure);">${deInnings.runs}/${deInnings.wickets}</span> (${deInnings.overs} ov)
          </div>
        </div>

        <div>
          <span class="card-outcome-banner ${isDesWinner ? 'des-win' : 'de-win'}" style="margin-bottom: 0; padding: 0.35rem 0.7rem; font-size: 0.75rem;">
            ${esc(m.resultText)}
          </span>
        </div>

        <div style="text-align: right;">
          <button class="btn-scorecard-reveal" style="margin-top: 0; padding: 0.45rem 0.9rem;" data-match-id="${esc(m.id)}">
            Scorecard
          </button>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------
  // SCORECARD MODAL
  // ------------------------------------------------------------
  function openScorecardModal(matchId) {
    const m = matches.find((match) => match.id === matchId);
    if (!m || !modalContainer || !modalOverlay) return;

    state.activeMatchModal = m;

    const innDE = m.innings[0]; // 1st innings (DE batting, Destroyers bowling)
    const innDES = m.innings[1]; // 2nd innings (Destroyers batting, DE bowling)

    let currentTab = 2; // Show Destroyers innings first

    function buildInningsHtml(inn, battingTeam, bowlingTeam) {
      if (!inn) return '<p style="color: var(--text-muted); padding: 1.5rem;">Innings data unavailable.</p>';

      const batRows = (inn.batting || []).map((b) => `
        <tr>
          <td style="font-weight: 800; color: var(--text-pure); font-family:var(--font-display);">${esc(b.playerName)}</td>
          <td style="color: var(--text-muted); font-size: 0.75rem;">${esc(b.dismissal)}</td>
          <td class="num tabular font-bold" style="color: var(--text-pure); font-size:0.9375rem;">${esc(b.runs)}</td>
          <td class="num tabular">${esc(b.balls)}</td>
          <td class="num tabular">${esc(b.fours)}</td>
          <td class="num tabular">${esc(b.sixes)}</td>
          <td class="num tabular" style="color: var(--gold); font-weight:700;">${esc(b.strikeRate)}</td>
        </tr>
      `).join('');

      const bowlRows = (inn.bowling || []).map((bo) => `
        <tr>
          <td style="font-weight: 800; color: var(--text-pure); font-family:var(--font-display);">${esc(bo.playerName)}</td>
          <td class="num tabular">${esc(bo.overs)}</td>
          <td class="num tabular">${esc(bo.maidens)}</td>
          <td class="num tabular">${esc(bo.runs)}</td>
          <td class="num tabular font-bold" style="color: var(--emerald); font-size:0.9375rem;">${esc(bo.wickets)}</td>
          <td class="num tabular" style="color: var(--ember-bright); font-weight:700;">${esc(bo.economy)}</td>
        </tr>
      `).join('');

      return `
        <div style="margin-bottom: 2rem;">
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.6rem;">
            <div>
              <span style="font-family:var(--font-mono); font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.06em;">Batting Squad: ${esc(battingTeam)}</span>
              <h4 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 900; color: var(--text-pure);">
                ${esc(inn.teamName)} Innings
              </h4>
            </div>
            <div class="tabular" style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 900; color: var(--text-pure);">
              ${inn.runs}/${inn.wickets} <span style="font-size: 0.875rem; color: var(--text-muted); font-weight:500;">(${inn.overs} ov • RR ${inn.runRate})</span>
            </div>
          </div>

          <div class="table-wrap" style="margin-bottom: 2rem;">
            <table class="cricket-table">
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

          <div style="margin-bottom: 0.6rem;">
            <span style="font-family:var(--font-mono); font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.06em;">Bowling Attack: ${esc(bowlingTeam)}</span>
            <h5 style="font-family: var(--font-display); font-size: 1rem; font-weight: 900; text-transform: uppercase; color: var(--text-pure);">
              Bowling Scorecard
            </h5>
          </div>
          <div class="table-wrap">
            <table class="cricket-table">
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
      <div class="modal-header">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
            <span class="fmt-pill ${m.format.toLowerCase()}">${esc(m.format)} • Season ${esc(m.seasonYear)}</span>
            <span style="font-family:var(--font-mono); font-size: 0.75rem; color: var(--gold); font-weight: 800; text-transform:uppercase;">${esc(m.stage || 'League Match')}</span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 900; color: var(--text-pure); text-transform:uppercase;">
            Destroyers vs DE
          </h3>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-top:0.2rem;">
            ${formatDate(m.matchDate)} • ${esc(m.venue ? m.venue.name : 'Rewa')}
          </p>
        </div>
        <button id="modal-close" class="modal-close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div class="card-outcome-banner ${m.winner === 'DES' ? 'des-win' : 'de-win'}" style="font-size: 1rem; padding: 0.85rem 1.25rem; margin-bottom: 1.75rem;">
          <span>${m.winner === 'DES' ? '🏆' : '⚡'}</span>
          <span>Result: ${esc(m.resultText)}</span>
        </div>

        <div style="display:flex; gap:0.6rem; margin-bottom:1.5rem;">
          <button id="tab-inn-des" class="scorecard-tab active">
            Destroyers Innings (${innDES.runs}/${innDES.wickets})
          </button>
          <button id="tab-inn-de" class="scorecard-tab">
            DE Innings (${innDE.runs}/${innDE.wickets})
          </button>
        </div>

        <div id="innings-display">
          ${buildInningsHtml(innDES, "Destroyers", "DE (Opponents)")}
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.getElementById('modal-close').addEventListener('click', closeModal);

    const tabDES = document.getElementById('tab-inn-des');
    const tabDE = document.getElementById('tab-inn-de');
    const display = document.getElementById('innings-display');

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
    state.activeMatchModal = null;
    state.activePlayerModal = null;
  }

  // ------------------------------------------------------------
  // ROSTER & DUEL PLAYERS
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

    rosterContainer.innerHTML = filtered.map((p) => {
      const initials = p.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
      const isDestroyer = state.activeRosterTab === 'destroyers';

      return `
        <div class="player-card" data-player-id="${esc(p.id)}" data-player-team="${isDestroyer ? 'DES' : 'DE'}">
          <span class="player-card-role">${esc(p.role)}</span>
          <div class="player-header">
            <div class="player-avatar" style="${!isDestroyer ? 'border-color:#38455e;' : ''}">${initials}</div>
            <div>
              <h4 class="player-name">${esc(p.name)}</h4>
              <span class="player-meta">${isDestroyer ? 'Destroyers Squad' : 'DE Opponent Squad'} • ${p.matches} Clashes</span>
            </div>
          </div>

          <div class="player-telemetry-strip">
            <div>
              <div class="telemetry-title">Runs</div>
              <div class="telemetry-data tabular" style="color:var(--gold);">${esc(p.batting.runs)}</div>
            </div>
            <div>
              <div class="telemetry-title">HS</div>
              <div class="telemetry-data tabular">${esc(p.batting.highestScore)}</div>
            </div>
            <div>
              <div class="telemetry-title">Wickets</div>
              <div class="telemetry-data tabular" style="color:var(--emerald);">${esc(p.bowling.wickets)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listener for player details
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

    state.activePlayerModal = p;

    // Find all matches for this player
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

    const initials = p.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

    const logRows = logs.map((item) => `
      <tr>
        <td style="font-weight: 700; color: var(--text-pure); font-family:var(--font-display);">${formatDate(item.match.matchDate)}</td>
        <td><span class="fmt-pill ${item.match.format.toLowerCase()}">${esc(item.match.format)}</span></td>
        <td class="num tabular font-bold" style="color: var(--text-pure);">
          ${item.batting ? `${item.batting.runs} (${item.batting.balls}b)` : '—'}
        </td>
        <td style="font-size: 0.75rem; color: var(--text-muted);">${item.batting ? esc(item.batting.dismissal) : 'DNB'}</td>
        <td class="num tabular font-bold" style="color: var(--emerald);">
          ${item.bowling ? `${item.bowling.wickets}/${item.bowling.runs} (${item.bowling.overs} ov)` : '—'}
        </td>
        <td>
          <span class="card-outcome-banner ${item.match.winner === 'DES' ? 'des-win' : 'de-win'}" style="margin: 0; padding: 0.25rem 0.55rem; font-size: 0.6875rem;">
            ${item.match.winner === 'DES' ? 'DES Win' : 'DE Win'}
          </span>
        </td>
      </tr>
    `).join('');

    modalContainer.innerHTML = `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 1.1rem;">
          <div class="player-avatar" style="width: 52px; height: 52px; font-size: 1.1rem;">${initials}</div>
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <h3 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 900; color: var(--text-pure); text-transform:uppercase;">${esc(p.name)}</h3>
              <span class="player-card-role" style="position: static;">${esc(p.role)}</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-muted); font-family:var(--font-mono); margin-top:0.2rem;">
              ${team === 'DES' ? 'DESTROYERS CRICKET CLUB' : 'DE OPPONENT SQUAD'} • ATAL BIHARI VAJPAYEE TOURNAMENT
            </p>
          </div>
        </div>
        <button id="modal-close" class="modal-close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.85rem; margin-bottom: 2rem;">
          <div class="talisman-box" style="padding:0.85rem; text-align:center;">
            <div class="telemetry-title">Matches</div>
            <div class="telemetry-data tabular">${p.matches}</div>
          </div>
          <div class="talisman-box" style="padding:0.85rem; text-align:center;">
            <div class="telemetry-title">Total Runs</div>
            <div class="telemetry-data tabular" style="color:var(--gold);">${esc(p.batting.runs)}</div>
          </div>
          <div class="talisman-box" style="padding:0.85rem; text-align:center;">
            <div class="telemetry-title">Highest Score</div>
            <div class="telemetry-data tabular">${esc(p.batting.highestScore)}</div>
          </div>
          <div class="talisman-box" style="padding:0.85rem; text-align:center;">
            <div class="telemetry-title">Batting Avg</div>
            <div class="telemetry-data tabular">${esc(p.batting.average)}</div>
          </div>
          <div class="talisman-box" style="padding:0.85rem; text-align:center;">
            <div class="telemetry-title">Strike Rate</div>
            <div class="telemetry-data tabular">${esc(p.batting.strikeRate)}</div>
          </div>
          <div class="talisman-box" style="padding:0.85rem; text-align:center;">
            <div class="telemetry-title">50s / 100s</div>
            <div class="telemetry-data tabular">${esc(p.batting.fifties)} / ${esc(p.batting.hundreds)}</div>
          </div>
          <div class="talisman-box" style="padding:0.85rem; text-align:center;">
            <div class="telemetry-title">Wickets</div>
            <div class="telemetry-data tabular" style="color:var(--emerald);">${esc(p.bowling.wickets)}</div>
          </div>
          <div class="talisman-box" style="padding:0.85rem; text-align:center;">
            <div class="telemetry-title">Best Bowling</div>
            <div class="telemetry-data tabular">${esc(p.bowling.bestBowling)}</div>
          </div>
        </div>

        <h4 style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 900; color: var(--text-pure); margin-bottom: 0.85rem; text-transform:uppercase;">
          Individual Match Logs in DE vs DES Clashes
        </h4>

        <div class="table-wrap">
          <table class="cricket-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fmt</th>
                <th class="num">Runs (Balls)</th>
                <th>Dismissal</th>
                <th class="num">Bowling</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              ${logRows.length ? logRows : '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No logs available.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.getElementById('modal-close').addEventListener('click', closeModal);
  }

  // ------------------------------------------------------------
  // SETUP CONTROLS & LISTENERS
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

    // Live Search
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        renderMatches();
      });
    }

    // View Mode Toggle
    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-view]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.viewMode = btn.getAttribute('data-view');
        renderMatches();
      });
    });

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

    // ESC Key to close modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderMatches();
    renderRoster();
  });

})();
