/**
 * DESTROYERS CRICKET CLUB (DES) — APPLICATION CONTROLLER
 * Atal Bihari Vajpayee Memorial Tournament • Rewa (RDCA)
 */

(function () {
  'use strict';

  const { matches, squad, stats } = window.DESTROYERS_DATA || { matches: [], squad: [], stats: {} };

  // App State
  const state = {
    formatFilter: 'all',
    seasonFilter: 'all',
    resultFilter: 'all',
    searchQuery: '',
    sortBy: 'latest',
    viewMode: 'grid',
    squadRoleFilter: 'all',
    activeMatchModal: null,
    activePlayerModal: null
  };

  // DOM Elements
  const matchesContainer = document.getElementById('matches-container');
  const squadContainer = document.getElementById('squad-container');
  const searchInput = document.getElementById('match-search-input');
  const matchCountElem = document.getElementById('filtered-match-count');
  const seasonSelect = document.getElementById('season-select');
  const sortSelect = document.getElementById('sort-select');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContainer = document.getElementById('modal-container');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');

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

  // Escape HTML helper
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

      // Search
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const venueName = (m.venue && m.venue.name) ? m.venue.name.toLowerCase() : '';
        const matchResult = (m.resultText || '').toLowerCase();
        const stage = (m.stage || '').toLowerCase();

        // Check player names involved in match
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
        // Score difference heuristic
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
      matchCountElem.textContent = `${sorted.length} ${sorted.length === 1 ? 'Match' : 'Matches'}`;
    }

    if (sorted.length === 0) {
      matchesContainer.innerHTML = `
        <div style="grid-column: 1/-1; padding: 4rem 2rem; text-align: center; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-med);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🏏</div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: var(--text-pure); margin-bottom: 0.5rem;">No Rivalry Clashes Found</h3>
          <p style="color: var(--text-muted); font-size: 0.875rem; max-width: 42ch; margin: 0 auto 1.5rem;">No matches match your current filter selection. Try resetting filters or changing the search keyword.</p>
          <button id="reset-filter-btn" class="btn btn-secondary">Reset All Filters</button>
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
          document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
          const defaultPill = document.querySelector('.filter-pill[data-filter="all"]');
          if (defaultPill) defaultPill.classList.add('active');
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

    const desInnings = m.innings.find((i) => i.teamShort === 'DES') || { runs: 0, wickets: 0, overs: 0 };
    const deInnings = m.innings.find((i) => i.teamShort === 'DE') || { runs: 0, wickets: 0, overs: 0 };

    return `
      <div class="match-card ${isFinal ? 'is-final' : ''}">
        <div class="match-card-top">
          <span class="match-format-pill ${m.format.toLowerCase()}">${esc(m.format)} • Season ${esc(m.seasonYear)}</span>
          ${isFinal ? '<span class="match-stage-tag">🏆 CHAMPIONSHIP FINAL</span>' : '<span style="font-size:0.6875rem; color:var(--text-muted); font-weight:600;">Match #' + esc(m.matchNumber) + '</span>'}
        </div>

        <div class="match-meta-line">
          <span>${formatDate(m.matchDate)}</span>
          <span class="dot">•</span>
          <span>${esc(m.venue ? m.venue.name : 'Rewa')}</span>
        </div>

        <div class="match-scores-block">
          <div class="team-score-row">
            <div class="team-score-identity">
              <div class="team-circle des">DES</div>
              <span class="team-score-name ${isDesWinner ? 'winner-team' : ''}">Destroyers</span>
            </div>
            <div class="team-score-figures tabular">
              ${desInnings.runs}/${desInnings.wickets}
              <span class="team-overs-figure">(${desInnings.overs} ov)</span>
            </div>
          </div>

          <div class="team-score-row">
            <div class="team-score-identity">
              <div class="team-circle de">DE</div>
              <span class="team-score-name ${!isDesWinner ? 'winner-team' : ''}">DE</span>
            </div>
            <div class="team-score-figures tabular">
              ${deInnings.runs}/${deInnings.wickets}
              <span class="team-overs-figure">(${deInnings.overs} ov)</span>
            </div>
          </div>
        </div>

        <div class="match-result-badge ${isDesWinner ? 'des-win' : 'de-win'}">
          <span>${isDesWinner ? '🏆' : '⚡'}</span>
          <span>${esc(m.resultText)}</span>
        </div>

        ${m.topBat || m.topBowl ? `
          <div class="match-performers">
            ${m.topBat ? `
              <div class="performer-line">
                <span class="performer-name">🏏 ${esc(m.topBat.playerName)} (${esc(m.topBat.team)})</span>
                <span class="performer-stat tabular">${esc(m.topBat.runs)} runs (${esc(m.topBat.balls)}b)</span>
              </div>
            ` : ''}
            ${m.topBowl ? `
              <div class="performer-line">
                <span class="performer-name">🎯 ${esc(m.topBowl.playerName)} (${esc(m.topBowl.team)})</span>
                <span class="performer-stat tabular">${esc(m.topBowl.wickets)}/${esc(m.topBowl.runs)} (${esc(m.topBowl.overs)} ov)</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <button class="scorecard-btn" data-match-id="${esc(m.id)}">
          <span>View Full Scorecard</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    `;
  }

  function renderMatchListItem(m) {
    const isDesWinner = m.winner === 'DES';
    const desInnings = m.innings.find((i) => i.teamShort === 'DES') || { runs: 0, wickets: 0, overs: 0 };
    const deInnings = m.innings.find((i) => i.teamShort === 'DE') || { runs: 0, wickets: 0, overs: 0 };

    return `
      <div class="match-list-item">
        <div>
          <span class="match-format-pill ${m.format.toLowerCase()}">${esc(m.format)}</span>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">${formatDate(m.matchDate)}</div>
        </div>

        <div>
          <div style="font-weight: 700; font-size: 0.875rem; color: ${isDesWinner ? 'var(--text-pure)' : 'var(--text-med)'};">
            Destroyers: <span class="tabular font-bold">${desInnings.runs}/${desInnings.wickets}</span> (${desInnings.overs} ov)
          </div>
        </div>

        <div>
          <div style="font-weight: 700; font-size: 0.875rem; color: ${!isDesWinner ? 'var(--text-pure)' : 'var(--text-med)'};">
            DE: <span class="tabular font-bold">${deInnings.runs}/${deInnings.wickets}</span> (${deInnings.overs} ov)
          </div>
        </div>

        <div>
          <span class="match-result-badge ${isDesWinner ? 'des-win' : 'de-win'}" style="margin-bottom: 0; padding: 0.3rem 0.6rem; font-size: 0.75rem;">
            ${esc(m.resultText)}
          </span>
        </div>

        <div style="text-align: right;">
          <button class="scorecard-btn" style="margin-top: 0; padding: 0.4rem 0.8rem;" data-match-id="${esc(m.id)}">
            Scorecard
          </button>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------
  // SCORECARD MODAL LOGIC
  // ------------------------------------------------------------
  function openScorecardModal(matchId) {
    const m = matches.find((match) => match.id === matchId);
    if (!m || !modalContainer || !modalOverlay) return;

    state.activeMatchModal = m;

    const inn1 = m.innings[0];
    const inn2 = m.innings[1];

    let inn1TabActive = true;

    function buildInningsHtml(inn) {
      if (!inn) return '<p style="color: var(--text-muted); padding: 1rem;">No innings recorded.</p>';

      const batRows = (inn.batting || []).map((b) => `
        <tr>
          <td style="font-weight: 700; color: var(--text-pure);">${esc(b.playerName)}</td>
          <td style="color: var(--text-muted); font-size: 0.75rem;">${esc(b.dismissal)}</td>
          <td class="num tabular font-bold" style="color: var(--text-pure);">${esc(b.runs)}</td>
          <td class="num tabular">${esc(b.balls)}</td>
          <td class="num tabular">${esc(b.fours)}</td>
          <td class="num tabular">${esc(b.sixes)}</td>
          <td class="num tabular" style="color: var(--crimson-light);">${esc(b.strikeRate)}</td>
        </tr>
      `).join('');

      const bowlRows = (inn.bowling || []).map((bo) => `
        <tr>
          <td style="font-weight: 700; color: var(--text-pure);">${esc(bo.playerName)}</td>
          <td class="num tabular">${esc(bo.overs)}</td>
          <td class="num tabular">${esc(bo.maidens)}</td>
          <td class="num tabular">${esc(bo.runs)}</td>
          <td class="num tabular font-bold" style="color: var(--emerald);">${esc(bo.wickets)}</td>
          <td class="num tabular" style="color: var(--gold);">${esc(bo.economy)}</td>
        </tr>
      `).join('');

      return `
        <div style="margin-bottom: 2rem;">
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
            <h4 style="font-family: var(--font-display); font-size: 1.125rem; font-weight: 800; color: var(--text-pure);">
              ${esc(inn.teamName)} Innings
            </h4>
            <div class="tabular" style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 800; color: var(--text-pure);">
              ${inn.runs}/${inn.wickets} <span style="font-size: 0.8125rem; color: var(--text-muted);">(${inn.overs} ov • RR ${inn.runRate})</span>
            </div>
          </div>

          <div class="table-wrap" style="margin-bottom: 1.5rem;">
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

          <h5 style="font-family: var(--font-display); font-size: 0.875rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">
            Bowling
          </h5>
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
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span class="match-format-pill ${m.format.toLowerCase()}">${esc(m.format)} • Season ${esc(m.seasonYear)}</span>
            <span style="font-size: 0.75rem; color: var(--gold); font-weight: 700;">${esc(m.stage || 'League')}</span>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: var(--text-pure);">
            Destroyers vs DE
          </h3>
          <p style="font-size: 0.75rem; color: var(--text-muted);">
            ${formatDate(m.matchDate)} • ${esc(m.venue ? m.venue.name : 'Rewa')}
          </p>
        </div>
        <button id="modal-close" class="modal-close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div class="match-result-badge ${m.winner === 'DES' ? 'des-win' : 'de-win'}" style="font-size: 0.9375rem; padding: 0.75rem 1rem; margin-bottom: 1.5rem;">
          <span>${m.winner === 'DES' ? '🏆' : '⚡'}</span>
          <span>Result: ${esc(m.resultText)}</span>
        </div>

        <div class="scorecard-innings-tabs">
          <button id="tab-inn-1" class="scorecard-tab ${inn1TabActive ? 'active' : ''}">
            1st Inn: ${esc(inn1 ? inn1.teamShort : 'Team 1')} (${inn1 ? inn1.runs + '/' + inn1.wickets : ''})
          </button>
          <button id="tab-inn-2" class="scorecard-tab ${!inn1TabActive ? 'active' : ''}">
            2nd Inn: ${esc(inn2 ? inn2.teamShort : 'Team 2')} (${inn2 ? inn2.runs + '/' + inn2.wickets : ''})
          </button>
        </div>

        <div id="innings-content">
          ${buildInningsHtml(inn1)}
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Modal Close
    document.getElementById('modal-close').addEventListener('click', closeModal);

    // Tab switching
    const tab1 = document.getElementById('tab-inn-1');
    const tab2 = document.getElementById('tab-inn-2');
    const innContent = document.getElementById('innings-content');

    if (tab1 && tab2 && innContent) {
      tab1.addEventListener('click', () => {
        tab1.classList.add('active');
        tab2.classList.remove('active');
        innContent.innerHTML = buildInningsHtml(inn1);
      });
      tab2.addEventListener('click', () => {
        tab2.classList.add('active');
        tab1.classList.remove('active');
        innContent.innerHTML = buildInningsHtml(inn2);
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
  // SQUAD RENDERING & PLAYER MODAL
  // ------------------------------------------------------------
  function filterSquad() {
    if (state.squadRoleFilter === 'all') return squad;
    const q = state.squadRoleFilter.toLowerCase();
    return squad.filter((p) => {
      const role = (p.role || '').toLowerCase();
      if (q === 'all-rounder') return role.includes('all-rounder');
      if (q === 'batter') return role.includes('bat') && !role.includes('all-rounder');
      if (q === 'bowler') return role.includes('bowl');
      if (q === 'wicketkeeper') return role.includes('wicketkeeper');
      return true;
    });
  }

  function renderSquad() {
    if (!squadContainer) return;

    const filtered = filterSquad();

    squadContainer.innerHTML = filtered.map((p) => {
      const initials = p.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
      const isTopStar = p.batting.runs > 300 || p.bowling.wickets > 10;

      return `
        <div class="player-card" data-player-id="${esc(p.id)}">
          <span class="player-role-badge">${esc(p.role || 'Player')}</span>
          <div class="player-header">
            <div class="player-avatar">${initials}</div>
            <div>
              <h4 class="player-name">${esc(p.name)}</h4>
              <span class="player-sub">${p.matches} Rivalry Matches vs DE</span>
            </div>
          </div>

          <div class="player-stats-mini">
            <div>
              <div class="mini-stat-label">Runs</div>
              <div class="mini-stat-val tabular">${esc(p.batting.runs)}</div>
            </div>
            <div>
              <div class="mini-stat-label">HS</div>
              <div class="mini-stat-val tabular">${esc(p.batting.highestScore)}</div>
            </div>
            <div>
              <div class="mini-stat-label">Wkts</div>
              <div class="mini-stat-val tabular">${esc(p.bowling.wickets)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to open player modal
    document.querySelectorAll('[data-player-id]').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-player-id');
        openPlayerModal(id);
      });
    });
  }

  function openPlayerModal(playerId) {
    const p = squad.find((player) => player.id === playerId);
    if (!p || !modalContainer || !modalOverlay) return;

    state.activePlayerModal = p;

    // Find all matches where this player batted or bowled against DE
    const playerMatchLogs = [];
    matches.forEach((m) => {
      let batLog = null;
      let bowlLog = null;

      m.innings.forEach((inn) => {
        const b = inn.batting.find((item) => item.playerId === playerId);
        if (b) batLog = { ...b, team: inn.teamShort };

        const bo = inn.bowling.find((item) => item.playerId === playerId);
        if (bo) bowlLog = { ...bo, opposingTeam: inn.teamShort };
      });

      if (batLog || bowlLog) {
        playerMatchLogs.push({
          match: m,
          batting: batLog,
          bowling: bowlLog
        });
      }
    });

    const initials = p.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

    const logRows = playerMatchLogs.map((item) => `
      <tr>
        <td style="font-weight: 600; color: var(--text-pure);">${formatDate(item.match.matchDate)}</td>
        <td><span class="match-format-pill ${item.match.format.toLowerCase()}">${esc(item.match.format)}</span></td>
        <td class="num tabular font-bold" style="color: var(--text-pure);">
          ${item.batting ? `${item.batting.runs} (${item.batting.balls}b)` : '—'}
        </td>
        <td style="font-size: 0.75rem; color: var(--text-muted);">${item.batting ? esc(item.batting.dismissal) : 'DNB'}</td>
        <td class="num tabular font-bold" style="color: var(--emerald);">
          ${item.bowling ? `${item.bowling.wickets}/${item.bowling.runs} (${item.bowling.overs} ov)` : '—'}
        </td>
        <td>
          <span class="match-result-badge ${item.match.winner === 'DES' ? 'des-win' : 'de-win'}" style="margin: 0; padding: 0.2rem 0.5rem; font-size: 0.6875rem;">
            ${item.match.winner === 'DES' ? 'DES Win' : 'DE Win'}
          </span>
        </td>
      </tr>
    `).join('');

    modalContainer.innerHTML = `
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="player-avatar" style="width: 48px; height: 48px; font-size: 1rem;">${initials}</div>
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: var(--text-pure);">${esc(p.name)}</h3>
              <span class="player-role-badge" style="position: static;">${esc(p.role)}</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-muted);">
              Destroyers Cricket Club • Atal Bihari Vajpayee Tournament, Rewa
            </p>
          </div>
        </div>
        <button id="modal-close" class="modal-close-btn">&times;</button>
      </div>

      <div class="modal-body">
        ${p.bio ? `<p style="font-size: 0.875rem; color: var(--text-med); margin-bottom: 1.5rem; line-height: 1.6;">${esc(p.bio)}</p>` : ''}

        <h4 style="font-family: var(--font-display); font-size: 1rem; font-weight: 800; color: var(--text-pure); margin-bottom: 0.75rem;">
          Rivalry Career Telemetry (vs DE)
        </h4>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 2rem;">
          <div class="metric-pill">
            <div class="metric-label">Matches</div>
            <div class="metric-value tabular">${p.matches}</div>
          </div>
          <div class="metric-pill">
            <div class="metric-label">Total Runs</div>
            <div class="metric-value tabular" style="color: var(--crimson-light);">${esc(p.batting.runs)}</div>
          </div>
          <div class="metric-pill">
            <div class="metric-label">Highest Score</div>
            <div class="metric-value tabular">${esc(p.batting.highestScore)}</div>
          </div>
          <div class="metric-pill">
            <div class="metric-label">Batting Avg</div>
            <div class="metric-value tabular">${esc(p.batting.average)}</div>
          </div>
          <div class="metric-pill">
            <div class="metric-label">Strike Rate</div>
            <div class="metric-value tabular">${esc(p.batting.strikeRate)}</div>
          </div>
          <div class="metric-pill">
            <div class="metric-label">50s / 100s</div>
            <div class="metric-value tabular">${esc(p.batting.fifties)} / ${esc(p.batting.hundreds)}</div>
          </div>
          <div class="metric-pill">
            <div class="metric-label">Wickets</div>
            <div class="metric-value tabular" style="color: var(--emerald);">${esc(p.bowling.wickets)}</div>
          </div>
          <div class="metric-pill">
            <div class="metric-label">Best Bowling</div>
            <div class="metric-value tabular">${esc(p.bowling.bestBowling)}</div>
          </div>
          <div class="metric-pill">
            <div class="metric-label">Economy</div>
            <div class="metric-value tabular">${esc(p.bowling.economy)}</div>
          </div>
        </div>

        <h4 style="font-family: var(--font-display); font-size: 1rem; font-weight: 800; color: var(--text-pure); margin-bottom: 0.75rem;">
          Match-by-Match Logs vs DE
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
              ${logRows.length ? logRows : '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No logs available.</td></tr>'}
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
  // EVENT LISTENERS & INITIALIZATION
  // ------------------------------------------------------------
  function setupEventListeners() {
    // Format Filter Pills
    document.querySelectorAll('[data-filter]').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        state.formatFilter = pill.getAttribute('data-filter');
        renderMatches();
      });
    });

    // Result Filter Pills
    document.querySelectorAll('[data-result-filter]').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('[data-result-filter]').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        state.resultFilter = pill.getAttribute('data-result-filter');
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

    // View Toggle
    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-view]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.viewMode = btn.getAttribute('data-view');
        renderMatches();
      });
    });

    // Squad Role Filter Pills
    document.querySelectorAll('[data-squad-role]').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('[data-squad-role]').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        state.squadRoleFilter = pill.getAttribute('data-squad-role');
        renderSquad();
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

    // Mobile Navigation Drawer Toggle
    if (mobileMenuBtn && mobileNavDrawer) {
      mobileMenuBtn.addEventListener('click', () => {
        const isHidden = mobileNavDrawer.style.display === 'none' || !mobileNavDrawer.style.display;
        mobileNavDrawer.style.display = isHidden ? 'flex' : 'none';
      });
      mobileNavDrawer.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          mobileNavDrawer.style.display = 'none';
        });
      });
    }
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderMatches();
    renderSquad();
  });

})();
