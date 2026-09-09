/**
 * PRODUCTION STATIC SITE GENERATOR (SSG) FOR DESTROYERS CRICKET CLUB (DES)
 * Generates 100% pre-rendered, SEO-optimized, accessible HTML pages.
 * Captain: Pranav Dwivedi (1,341 runs, 63 wickets)
 * Arch-rivals: Dread Eleven (DE), led by Akhil Mishra
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = process.env.SITE_URL || 'https://destroyerscricket.in';

// Load Datasets
const tournament = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/tournament.json'), 'utf8'));
const teams = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/teams.json'), 'utf8'));
const squad = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/squad.json'), 'utf8'));
const rivals = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/rivals.json'), 'utf8'));
const matches = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/matches.json'), 'utf8'));
const news = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/news.json'), 'utf8'));
const pointsTable = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/pointsTable.json'), 'utf8'));

// Helper: Ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

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
// GLOBAL HTML TEMPLATE BLOCKS
// ------------------------------------------------------------
function renderHead({ title, description, canonicalUrl, ogType = 'website', ogImage = '/public/inspo1.jpg', jsonLd = null, breadcrumbs = null }) {
  const fullCanonical = canonicalUrl ? `${BASE_URL}${canonicalUrl}` : BASE_URL;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`;

  const jsonLdList = [];
  if (jsonLd) {
    if (Array.isArray(jsonLd)) {
      jsonLdList.push(...jsonLd);
    } else {
      jsonLdList.push(jsonLd);
    }
  }

  if (breadcrumbs && breadcrumbs.length > 0) {
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.name,
        item: b.item.startsWith('http') ? b.item : `${BASE_URL}${b.item}`
      }))
    });
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${fullCanonical}">
  <meta name="theme-color" content="#0b0b0b">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${esc(ogType)}">
  <meta property="og:url" content="${fullCanonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${fullOgImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Destroyers Cricket Club (DES)">
  <meta property="og:locale" content="en_IN">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${fullCanonical}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${fullOgImage}">
  <meta name="twitter:site" content="@DestroyersRewa">

  <!-- Icons & PWA -->
  <link rel="icon" type="image/svg+xml" href="/public/favicon.svg">
  <link rel="apple-touch-icon" href="/public/favicon.svg">
  <link rel="manifest" href="/manifest.json">

  <!-- Google Fonts Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,700;1,900&family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;600;700;800;900&family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800;900&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/src/css/styles.css">

  ${jsonLdList.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join('\n  ')}
</head>
<body>
  <canvas id="ambient-canvas" aria-hidden="true"></canvas>
  <div class="content-wrapper">
  `;
}

function renderHeader(activeNav = '') {
  const links = [
    { label: 'Home', href: '/', key: 'home' },
    { label: 'Squad', href: '/players', key: 'squad' },
    { label: 'Fixtures', href: '/fixtures', key: 'fixtures' },
    { label: 'Results', href: '/results', key: 'results' },
    { label: 'Points Table', href: '/points-table', key: 'table' },
    { label: 'Stats', href: '/stats', key: 'stats' },
    { label: 'News', href: '/news', key: 'news' },
    { label: 'About', href: '/about', key: 'about' },
    { label: 'Contact', href: '/contact', key: 'contact' }
  ];

  return `
  <!-- IPLT20 Top Broadcast Score Carousel Strip -->
  <div class="broadcast-ticker-bar" aria-label="Recent Match Carousel">
    <div class="broadcast-match-track">
      ${matches.filter((m) => m.status === 'completed').slice(-6).map((m) => {
        const isDesWin = m.winner === 'DES';
        const innDES = (m.innings || []).find(i => i.teamId === 'DES' || i.teamName?.includes('Destroyers')) || m.innings?.[0] || { runs: 0, wickets: 0 };
        const innDE = (m.innings || []).find(i => i.teamId === 'DE' || i.teamName?.includes('Dread Eleven')) || m.innings?.[1] || { runs: 0, wickets: 0 };
        return `
          <a href="/matches/${m.slug}" class="broadcast-match-chip">
            <div class="chip-status-tag ${isDesWin ? 'win' : 'loss'}">
              <span>${esc(m.format)} • ${m.seasonYear}</span>
              <span>${isDesWin ? 'DES WON' : 'DE WON'}</span>
            </div>
            <div class="chip-team-row">
              <span>DES</span>
              <span class="chip-score tabular ${isDesWin ? 'lead' : ''}">${innDES.runs}/${innDES.wickets}</span>
            </div>
            <div class="chip-team-row">
              <span>DE</span>
              <span class="chip-score tabular ${!isDesWin ? 'lead' : ''}">${innDE.runs}/${innDE.wickets}</span>
            </div>
          </a>
        `;
      }).join('')}
    </div>
  </div>

  <!-- Header Navigation -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="brand-block" aria-label="Destroyers Cricket Club Home">
        <div class="brand-crest-monogram">DES</div>
        <div class="brand-title-group">
          <span class="brand-franchise-name">DESTROYERS <span style="color:var(--c-ember-bright);">CC</span></span>
          <span class="brand-subline">Atal Bihari Vajpayee Tournament • Rewa</span>
        </div>
      </a>

      <nav class="header-nav" aria-label="Main Navigation">
        ${links.map((l) => `
          <a href="${l.href}" class="header-nav-link ${activeNav === l.key ? 'active' : ''}" ${activeNav === l.key ? 'aria-current="page"' : ''}>
            ${esc(l.label)}
          </a>
        `).join('')}
      </nav>

      <div class="header-status-badge">
        <span class="live-dot"></span>
        <span>CAPT. PRANAV DWIVEDI</span>
      </div>
    </div>
  </header>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-columns">
          <div>
            <div class="brand-franchise-name" style="font-size: 2rem;">
              DESTROYERS <span style="color:var(--c-ember-bright);">CRICKET CLUB</span>
            </div>
            <p style="font-size:0.875rem; color:var(--c-gray-400); max-width:48ch; margin-top:0.75rem; line-height:1.7;">
              Official pro franchise website for Destroyers Cricket Club (DES), captained by Pranav Dwivedi. 
              Competing in the prestigious Atal Bihari Vajpayee Memorial Tournament under the Rewa Division Cricket Association (RDCA).
            </p>
          </div>

          <div>
            <h4 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Match Center</h4>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:0.5rem; font-size:0.875rem; color:var(--c-gray-400);">
              <li><a href="/fixtures" style="color:inherit;">Tournament Fixtures &amp; Schedule</a></li>
              <li><a href="/results" style="color:inherit;">Completed Match Archive (2021–24)</a></li>
              <li><a href="/points-table" style="color:inherit;">Tournament Points Table</a></li>
              <li><a href="/stats" style="color:inherit;">All-Time Records & Stats</a></li>
            </ul>
          </div>

          <div>
            <h4 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Franchise & Venues</h4>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:0.5rem; font-size:0.875rem; color:var(--c-gray-400);">
              <li><a href="/players" style="color:inherit;">Destroyers Squad (48 Players)</a></li>
              <li><a href="/about" style="color:inherit;">About Destroyers & 2024 Title</a></li>
              <li><a href="/news" style="color:inherit;">News & Press Releases</a></li>
              <li><a href="/contact" style="color:inherit;">Contact RDCA & Venues</a></li>
            </ul>
          </div>

          <div>
            <h4 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Legal & Policies</h4>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:0.5rem; font-size:0.875rem; color:var(--c-gray-400);">
              <li><a href="/privacy" style="color:inherit;">Privacy Policy</a></li>
              <li><a href="/terms" style="color:inherit;">Terms & Conditions</a></li>
              <li><a href="/about" style="color:inherit;">Editorial Policy & E-E-A-T</a></li>
              <li><a href="/contact" style="color:inherit;">Grievances & Inquiries</a></li>
            </ul>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--b-subtle); padding-top:2rem; font-size:0.75rem; color:var(--c-gray-600); flex-wrap:wrap; gap:1rem;">
          <div>&copy; 2021–2026 Destroyers Cricket Club (DES). All rights reserved.</div>
          <div style="display:flex; gap:1.25rem; align-items:center;">
            <a href="https://instagram.com/destroyersrewa" target="_blank" rel="noopener noreferrer" style="color:var(--c-gray-400); text-decoration:none;">Instagram</a>
            <span style="color:var(--c-gray-600);">•</span>
            <a href="https://x.com/DestroyersRewa" target="_blank" rel="noopener noreferrer" style="color:var(--c-gray-400); text-decoration:none;">X / Twitter</a>
            <span style="color:var(--c-gray-600);">•</span>
            <a href="https://youtube.com/@destroyersrewa" target="_blank" rel="noopener noreferrer" style="color:var(--c-gray-400); text-decoration:none;">YouTube</a>
          </div>
          <div>Rewa Division Cricket Association (RDCA) • Madhya Pradesh</div>
        </div>
      </div>
    </footer>
  </div>

  <script src="/src/js/app.js"></script>
</body>
</html>
  `;
}

// ------------------------------------------------------------
// 1. HOME PAGE GENERATOR (/)
// ------------------------------------------------------------
function generateHomePage() {
  const completedMatches = matches.filter((m) => m.status === 'completed');
  const upcomingMatches = matches.filter((m) => m.status === 'upcoming');
  const nextMatch = upcomingMatches[0];
  const featuredNews = news.slice(0, 3);
  const featuredSquad = squad.slice(0, 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: 'Destroyers Cricket Club',
    alternateName: 'Destroyers',
    sport: 'Cricket',
    memberOf: {
      '@type': 'SportsOrganization',
      name: 'Rewa Division Cricket Association (RDCA)'
    },
    location: {
      '@type': 'Place',
      name: 'Awadhesh Pratap Singh University (APSU) Stadium',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Rewa',
        addressRegion: 'Madhya Pradesh',
        addressCountry: 'India'
      }
    },
    coach: {
      '@type': 'Person',
      name: 'Pranav Dwivedi',
      jobTitle: 'Captain & Franchise Icon'
    }
  };

  const html = `
${renderHead({
  title: 'Destroyers Cricket Club (DES) — Official Website | Capt. Pranav Dwivedi | Rewa',
  description: 'Official pro franchise website for Destroyers Cricket Club (DES), captained by Pranav Dwivedi. Complete match archives against Dread Eleven (DE), squad directory, Atal Bihari Vajpayee Memorial Tournament fixtures, and tournament stats.',
  canonicalUrl: '/',
  jsonLd
})}
${renderHeader('home')}

<!-- Hero Section -->
<section class="hero-section" id="home">
  <div class="hero-watermark" aria-hidden="true">DESTROYERS</div>
  <div class="container hero-grid-layout">
    <div>
      <div class="hero-eyebrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>Official Franchise Citadel • Rewa Division (RDCA)</span>
      </div>

      <h1 class="hero-headline-massive">
        FORGED IN REWA. <br>
        <span class="hero-gradient-text">DRIVEN TO CONQUER.</span> <br>
        DESTROYERS CRICKET CLUB.
      </h1>

      <p class="hero-statement">
        The official digital fortress of <strong>Destroyers Cricket Club (DES)</strong>, led by all-round powerhouse and skipper <strong>Pranav Dwivedi</strong> (1,341 runs, 63 wickets). 
        Dominating the <strong>Atal Bihari Vajpayee Memorial Tournament</strong> with a 4–1 series conquest over arch-rivals <strong>Dread Eleven (DE)</strong> in 2024.
      </p>

      <div class="hero-cta-row">
        <a href="/fixtures" class="btn-athletic btn-athletic-primary">
          <span>View Fixtures &amp; Schedule</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <a href="/players" class="btn-athletic btn-athletic-outline">
          <span>Meet The Squad (48)</span>
        </a>
        <a href="/results" class="btn-athletic btn-athletic-outline">
          <span>Match Results</span>
        </a>
      </div>
    </div>

    <!-- Match Day HUD -->
    <div class="battle-hud-card">
      <div class="hud-topline">
        <span class="hud-tag">Rivalry Series Telemetry (2021–2024)</span>
        <span class="hud-status-tag" style="color:var(--c-emerald); background:rgba(0,230,118,0.12);">2024 SERIES: DES WON 4–1</span>
      </div>

      <div class="hud-clash-display">
        <div class="hud-team-column">
          <div class="hud-team-emblem des">DES</div>
          <div class="hud-team-name" style="color:var(--c-ember-bright);">DESTROYERS</div>
          <div style="font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase; font-family:var(--f-mono);">Capt. Pranav Dwivedi</div>
          <div class="hud-win-count tabular" style="color:var(--c-emerald);">11</div>
        </div>

        <div class="hud-vs-badge">VS</div>

        <div class="hud-team-column">
          <div class="hud-team-emblem de">DE</div>
          <div class="hud-team-name" style="color:var(--c-gray-300);">DREAD ELEVEN</div>
          <div style="font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase; font-family:var(--f-mono);">Capt. Akhil Mishra</div>
          <div class="hud-win-count tabular" style="color:var(--c-gray-400);">13</div>
        </div>
      </div>

      <div class="hud-dominance-bar" title="45.8% Destroyers vs 54.2% Dread Eleven">
        <div class="hud-bar-des" style="width:45.8%;"></div>
        <div class="hud-bar-de" style="width:54.2%;"></div>
      </div>

      <!-- Live Match Countdown Widget -->
      <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1.25rem; margin-top:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
          <span style="font-family:var(--f-mono); font-size:0.6875rem; color:var(--c-gold); text-transform:uppercase; font-weight:800; letter-spacing:0.1em;">Next Clash Countdown</span>
          <span class="live-dot"></span>
        </div>
        <div id="match-countdown" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:0.5rem; text-align:center;">
          <div style="background:#0a0a0a; border:1px solid var(--b-subtle); padding:0.5rem;"><div style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white);" id="cd-days">182</div><div style="font-size:0.625rem; color:var(--c-gray-400); font-family:var(--f-mono); text-transform:uppercase;">Days</div></div>
          <div style="background:#0a0a0a; border:1px solid var(--b-subtle); padding:0.5rem;"><div style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white);" id="cd-hours">14</div><div style="font-size:0.625rem; color:var(--c-gray-400); font-family:var(--f-mono); text-transform:uppercase;">Hours</div></div>
          <div style="background:#0a0a0a; border:1px solid var(--b-subtle); padding:0.5rem;"><div style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white);" id="cd-mins">35</div><div style="font-size:0.625rem; color:var(--c-gray-400); font-family:var(--f-mono); text-transform:uppercase;">Mins</div></div>
          <div style="background:#0a0a0a; border:1px solid var(--b-subtle); padding:0.5rem;"><div style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-ember-bright);" id="cd-secs">48</div><div style="font-size:0.625rem; color:var(--c-gray-400); font-family:var(--f-mono); text-transform:uppercase;">Secs</div></div>
        </div>
      </div>


      <!-- Latest Championship Climax (2024 Finale) -->
      <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1.25rem;">
        <div style="font-family:var(--f-mono); font-size:0.6875rem; color:var(--c-gold); text-transform:uppercase; font-weight:800; letter-spacing:0.1em; margin-bottom:0.4rem;">
          Latest Derby Climax (2024 Finale)
        </div>
        <div style="font-family:var(--f-athletic); font-size:1.35rem; color:var(--c-white); text-transform:uppercase;">
          Destroyers def. Dread Eleven by 8 runs
        </div>
        <div style="font-size:0.75rem; color:var(--c-gray-400); margin-top:0.2rem;">
          20 Sep 2024 • APSU Stadium, Rewa • 2024 Series Decider
        </div>
        <a href="/matches/destroyers-vs-dread-eleven-2024-09-20" style="display:inline-flex; align-items:center; gap:0.4rem; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-ember-bright); font-weight:700; margin-top:0.6rem;">
          <span>Inspect 2024 Finale Scorecard &rarr;</span>
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Latest Result & 2024 Series Victory Banner -->
<section class="spotlight-banner-section">
  <div class="container">
    <div class="spotlight-card-wrapper">
      <div>
        <div class="spotlight-tagline">2024 Season Triumph • 50-Over Series</div>
        <h2 class="spotlight-headline">DESTROYERS CLINCH 2024 SERIES 4–1 OVER DREAD ELEVEN</h2>
        <p class="spotlight-prose">
          In a scintillating display of clutch cricket at APSU Stadium, Destroyers captured four straight victories to close the 2024 season, 
          defending targets with nerve and aggression behind captain Pranav Dwivedi’s dual masterclass with bat and ball.
        </p>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <a href="/matches/destroyers-vs-dread-eleven-2024-09-20" class="btn-athletic btn-athletic-primary">
            <span>2024 Finale Scorecard</span>
          </a>
          <a href="/about" class="btn-athletic btn-athletic-outline">
            <span>Read Franchise History</span>
          </a>
        </div>
      </div>

      <div class="spotlight-stats-panel">
        <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); font-weight:800; text-transform:uppercase;">2024 FINALE RESULT</div>
        <div class="spotlight-final-score tabular">
          <span style="color:var(--c-ember-bright);">DES 233/6</span> <span style="font-size:1.4rem; color:var(--c-gray-600);">DEF</span> <span style="color:var(--c-gray-400);">DE 225/9</span>
        </div>
        <div style="font-size:0.875rem; color:var(--c-emerald); font-weight:700; text-transform:uppercase; font-family:var(--f-athletic);">
          Destroyers won by 8 runs
        </div>
        <div style="font-size:0.75rem; color:var(--c-gray-400); margin-top:0.4rem; font-family:var(--f-mono);">
          APSU Stadium, Rewa • 50-Over Series Decider
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Featured Squad Pillars -->
<section class="players-marquee-section">
  <div class="container">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">The Leaders</p>
        <h2 class="section-bigtitle">Destroyers Core Pillars</h2>
        <p style="color:var(--c-gray-400); font-size:0.9375rem; max-width:60ch; margin-top:0.4rem;">
          Key performers anchoring Destroyers Cricket Club in the Atal Bihari Vajpayee Memorial Tournament.
        </p>
      </div>
      <a href="/players" class="btn-athletic btn-athletic-outline">
        <span>View All 48 Squad Members</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </div>

    
    <!-- Interactive Role Filter -->
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:2rem;" id="squad-filter-controls">
      <button type="button" class="btn-athletic btn-athletic-primary role-btn" data-filter="all" style="padding:0.45rem 1rem; font-size:0.75rem;">All (48)</button>
      <button type="button" class="btn-athletic btn-athletic-outline role-btn" data-filter="Batter" style="padding:0.45rem 1rem; font-size:0.75rem;">Batters</button>
      <button type="button" class="btn-athletic btn-athletic-outline role-btn" data-filter="All-rounder" style="padding:0.45rem 1rem; font-size:0.75rem;">All-Rounders</button>
      <button type="button" class="btn-athletic btn-athletic-outline role-btn" data-filter="Bowler" style="padding:0.45rem 1rem; font-size:0.75rem;">Bowlers</button>
      <button type="button" class="btn-athletic btn-athletic-outline role-btn" data-filter="Wicketkeeper" style="padding:0.45rem 1rem; font-size:0.75rem;">Wicketkeepers</button>
    </div>

    <div class="players-cards-grid" id="players-grid">
      ${featuredSquad.map((p) => `
        <a href="/players/${p.slug}" class="jersey-player-card" data-role="${esc(p.role)}" style="text-decoration:none;">
          <div class="jersey-big-number">${p.jerseyNumber}</div>
          <div class="jersey-player-role">${esc(p.role)}</div>
          <h3 class="jersey-player-name">#${p.jerseyNumber} ${esc(p.name)}</h3>
          <div class="jersey-player-subtitle">Destroyers Squad • ${p.matches} Clashes</div>
          <div class="jersey-stats-strip">
            <div><div class="jersey-stat-val tabular" style="color:var(--c-gold);">${esc(p.batting.runs)}</div><div class="jersey-stat-lbl">Runs</div></div>
            <div><div class="jersey-stat-val tabular">${esc(p.batting.average)}</div><div class="jersey-stat-lbl">Avg</div></div>
            <div><div class="jersey-stat-val tabular" style="color:var(--c-emerald);">${esc(p.bowling.wickets)}</div><div class="jersey-stat-lbl">Wkts</div></div>
          </div>
        </a>
      `).join('')}
    </div>
  </div>
</section>

<!-- Latest News -->
<section class="spotlight-banner-section" style="background:#080808;">
  <div class="container">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">Tournament Press</p>
        <h2 class="section-bigtitle">Latest News &amp; Features</h2>
      </div>
      <a href="/news" class="btn-athletic btn-athletic-outline">All News Articles</a>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:2rem;">
      ${featuredNews.map((n) => `
        <article style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:1.75rem; display:flex; flex-direction:column;">
          <div style="font-family:var(--f-mono); font-size:0.6875rem; color:var(--c-gold); text-transform:uppercase; font-weight:800; margin-bottom:0.6rem;">${esc(n.category)} • ${formatDate(n.publishedAt.slice(0, 10))}</div>
          <h3 style="font-family:var(--f-athletic); font-size:1.7rem; color:var(--c-white); text-transform:uppercase; line-height:1.05; margin-bottom:0.75rem;">
            <a href="/news/${n.slug}" style="color:inherit; text-decoration:none;">${esc(n.title)}</a>
          </h3>
          <p style="font-size:0.875rem; color:var(--c-gray-400); line-height:1.6; margin-bottom:1.5rem;">${esc(n.summary)}</p>
          <a href="/news/${n.slug}" style="margin-top:auto; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-ember-bright); font-weight:800; text-transform:uppercase; text-decoration:none;">
            Read Full Article &rarr;
          </a>
        </article>
      `).join('')}
    </div>
  </div>
</section>

${renderFooter()}
  `;

  fs.writeFileSync(path.join(rootDir, 'index.html'), html);
  console.log('Generated index.html (Home)');
}

// ------------------------------------------------------------
// 2. SQUAD DIRECTORY (/players) & INDIVIDUAL PLAYERS (/players/[slug])
// ------------------------------------------------------------
function generateSquadPages() {
  const playersDir = path.join(rootDir, 'players');
  ensureDir(playersDir);

  const jsonLdDirectory = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Destroyers Cricket Club Squad Directory',
    itemListElement: squad.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/players/${p.slug}`,
      name: p.name
    }))
  };

  const directoryHtml = `
${renderHead({
  title: 'Squad Roster (48 Players) | Destroyers Cricket Club (DES)',
  description: 'Official squad directory for Destroyers Cricket Club, captained by Pranav Dwivedi (1,341 runs, 63 wickets) in the Atal Bihari Vajpayee Tournament, Rewa. Verified career averages, runs, wickets, and individual player pages.',
  canonicalUrl: '/players',
  jsonLd: jsonLdDirectory,
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: 'Squad', item: '/players' }
  ]
})}
${renderHeader('squad')}

<section class="players-marquee-section" style="padding-top:4rem;">
  <div class="container">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">Franchise Roster</p>
        <h1 class="section-bigtitle">Destroyers Squad Directory (48 Players)</h1>
        <p style="color:var(--c-gray-400); font-size:1rem; max-width:68ch; margin-top:0.4rem;">
          Verified tournament records for every Destroyers player in encounters against Dread Eleven. Led by captain <strong>Pranav Dwivedi</strong>.
        </p>
      </div>
    </div>

    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); border-left:4px solid var(--c-gold); padding:1.25rem 1.5rem; margin-bottom:2.5rem;">
      <div style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-gold); letter-spacing:0.04em; text-transform:uppercase; margin-bottom:0.25rem;">
        Franchise Star &amp; Participation Notice
      </div>
      <p style="font-size:0.8125rem; color:var(--c-gray-300); line-height:1.6;">
        Destroyers skipper <strong>Pranav Dwivedi</strong> has contested all 24 clashes (scoring 1,341 runs at 55.9 avg and taking 63 wickets). Rotational squad members featured in 4–14 matches. Click any player card below to view their dedicated profile and match-by-match performances.
      </p>
    </div>

    <div class="players-cards-grid">
      ${squad.map((p) => `
        <a href="/players/${p.slug}" class="jersey-player-card" style="text-decoration:none;">
          <div class="jersey-big-number">${p.jerseyNumber}</div>
          <div class="jersey-player-role">${esc(p.role)}</div>
          <h2 class="jersey-player-name">#${p.jerseyNumber} ${esc(p.name)}</h2>
          <div class="jersey-player-subtitle">Destroyers Squad • ${p.matches} Clashes</div>

          <div class="jersey-stats-strip">
            <div>
              <div class="jersey-stat-val tabular" style="color:var(--c-gold);">${esc(p.batting.runs)}</div>
              <div class="jersey-stat-lbl">Runs</div>
            </div>
            <div>
              <div class="jersey-stat-val tabular">${esc(p.batting.average)}</div>
              <div class="jersey-stat-lbl">Avg</div>
            </div>
            <div>
              <div class="jersey-stat-val tabular" style="color:var(--c-emerald);">${esc(p.bowling.wickets)}</div>
              <div class="jersey-stat-lbl">Wkts</div>
            </div>
          </div>
        </a>
      `).join('')}
    </div>
  </div>
</section>

${renderFooter()}
  `;

  fs.writeFileSync(path.join(playersDir, 'index.html'), directoryHtml);

  // Generate each player's dedicated profile
  squad.forEach((p) => {
    const playerDir = path.join(playersDir, p.slug);
    ensureDir(playerDir);

    // Find all match appearances for this player
    const playerLogs = [];
    matches.forEach((m) => {
      if (!m.innings || !m.innings.length) return;
      const desInn = m.innings.find(i => i.teamId === 'DES' || i.teamName?.includes('Destroyers'));
      const oppInn = m.innings.find(i => i.teamId === 'DE' || i.teamName?.includes('Dread Eleven'));

      const b = (desInn?.batting || []).find((x) => x.playerId === p.id || (x.playerName && x.playerName.toLowerCase() === p.name.toLowerCase()));
      // Bowling is conducted during the opponent's batting innings
      const bo = (oppInn?.bowling || []).find((x) => x.playerId === p.id || (x.playerName && x.playerName.toLowerCase() === p.name.toLowerCase()));

      if (b || bo) {
        playerLogs.push({ match: m, batting: b, bowling: bo });
      }
    });

    const playerJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: p.name,
      jobTitle: `${p.role} for Destroyers Cricket Club`,
      worksFor: {
        '@type': 'SportsTeam',
        name: 'Destroyers Cricket Club'
      },
      description: p.bio,
      identifier: `DES-${p.jerseyNumber}`
    };

    const playerHtml = `
${renderHead({
  title: `${p.name} (#${p.jerseyNumber}) — Destroyers Cricket Club Profile`,
  description: `${p.name} official profile for Destroyers Cricket Club in the Atal Bihari Vajpayee Tournament, Rewa. ${p.batting.runs} runs, ${p.bowling.wickets} wickets, career stats, and match log.`,
  canonicalUrl: `/players/${p.slug}`,
  jsonLd: playerJsonLd,
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: 'Squad', item: '/players' },
    { name: `#${p.jerseyNumber} ${p.name}`, item: `/players/${p.slug}` }
  ]
})}
${renderHeader('squad')}

<section class="players-marquee-section" style="padding-top:4rem;">
  <div class="container">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" style="margin-bottom:1.5rem; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400);">
      <a href="/" style="color:inherit;">Home</a> / <a href="/players" style="color:inherit;">Squad</a> / <span style="color:var(--c-gold);">${esc(p.name)}</span>
    </nav>

    <!-- Player Masthead -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-bottom:3rem; position:relative; overflow:hidden;">
      <div class="jersey-big-number" style="font-size:10rem; right:1.5rem; top:0;">${p.jerseyNumber}</div>
      <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
        <span class="pro-fmt-tag t20">JERSEY #${p.jerseyNumber}</span>
        <span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); font-weight:800; text-transform:uppercase;">${esc(p.role)}</span>
      </div>

      <h1 class="section-bigtitle" style="font-size:clamp(2.8rem, 6vw, 4.5rem); margin-bottom:0.5rem;">
        #${p.jerseyNumber} ${esc(p.name)}
      </h1>
      <p style="font-family:var(--f-mono); font-size:0.875rem; color:var(--c-gray-400); margin-bottom:1.5rem;">
        ${esc(p.battingStyle)} • ${esc(p.bowlingStyle)} • Destroyers Cricket Club
      </p>

      <p style="font-size:1rem; color:var(--c-gray-300); max-width:72ch; line-height:1.7; margin-bottom:2rem;">
        ${esc(p.bio)}
      </p>

      <!-- Key Telemetry Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:1rem;">
        <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1rem; text-align:center;">
          <div class="jersey-stat-lbl">Matches</div>
          <div class="jersey-stat-val tabular">${p.matches}</div>
        </div>
        <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1rem; text-align:center;">
          <div class="jersey-stat-lbl">Runs</div>
          <div class="jersey-stat-val tabular" style="color:var(--c-gold);">${esc(p.batting.runs)}</div>
        </div>
        <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1rem; text-align:center;">
          <div class="jersey-stat-lbl">Highest Score</div>
          <div class="jersey-stat-val tabular">${esc(p.batting.highestScore)}</div>
        </div>
        <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1rem; text-align:center;">
          <div class="jersey-stat-lbl">Batting Avg</div>
          <div class="jersey-stat-val tabular">${esc(p.batting.average)}</div>
        </div>
        <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1rem; text-align:center;">
          <div class="jersey-stat-lbl">Strike Rate</div>
          <div class="jersey-stat-val tabular">${esc(p.batting.strikeRate)}</div>
        </div>
        <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1rem; text-align:center;">
          <div class="jersey-stat-lbl">50s / 100s</div>
          <div class="jersey-stat-val tabular">${esc(p.batting.fifties)} / ${esc(p.batting.hundreds)}</div>
        </div>
        <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1rem; text-align:center;">
          <div class="jersey-stat-lbl">Wickets</div>
          <div class="jersey-stat-val tabular" style="color:var(--c-emerald);">${esc(p.bowling.wickets)}</div>
        </div>
        <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1rem; text-align:center;">
          <div class="jersey-stat-lbl">Best Bowling</div>
          <div class="jersey-stat-val tabular">${esc(p.bowling.bestBowling)}</div>
        </div>
      </div>
    </div>

    <!-- Match Appearances Table -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
      <h2 style="font-family:var(--f-athletic); font-size:1.8rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.25rem;">
        Match-by-Match Derby Telemetry vs Dread Eleven
      </h2>

      <div style="overflow-x:auto;">
        <table class="scorecard-data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Format</th>
              <th>Match Hub</th>
              <th class="num">Batting</th>
              <th>Dismissal</th>
              <th class="num">Bowling</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            ${playerLogs.length ? playerLogs.map((item) => `
              <tr>
                <td style="font-weight:700; color:var(--c-white);">${formatDate(item.match.matchDate)}</td>
                <td><span class="pro-fmt-tag ${item.match.format.toLowerCase()}">${esc(item.match.format)}</span></td>
                <td><a href="/matches/${item.match.slug}" style="color:var(--c-ember-bright); font-weight:700;">Scorecard &rarr;</a></td>
                <td class="num tabular font-bold" style="color:var(--c-white);">${item.batting ? `${item.batting.runs} (${item.batting.balls}b)` : '—'}</td>
                <td style="font-size:0.75rem; color:var(--c-gray-400);">${item.batting ? esc(item.batting.dismissal) : 'Did Not Bat'}</td>
                <td class="num tabular font-bold" style="color:var(--c-emerald);">${item.bowling ? `${item.bowling.wickets}/${item.bowling.runs} (${item.bowling.overs} ov)` : '—'}</td>
                <td><span class="pro-result-strip ${item.match.winner === 'DES' ? 'des-victory' : 'de-victory'}" style="margin:0; padding:0.25rem 0.6rem; font-size:0.75rem;">${item.match.winner === 'DES' ? 'DES Win' : 'DE Win'}</span></td>
              </tr>
            `).join('') : '<tr><td colspan="7" style="text-align:center; color:var(--c-gray-400); padding:2rem;">No individual match appearances recorded.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

${renderFooter()}
    `;

    fs.writeFileSync(path.join(playerDir, 'index.html'), playerHtml);
  });

  console.log(`Generated /players directory and ${squad.length} individual player pages.`);
}

// ------------------------------------------------------------
// 3. FIXTURES (/fixtures) & RESULTS (/results) & MATCH PAGES (/matches/[slug])
// ------------------------------------------------------------
function generateMatchPages() {
  const matchesDir = path.join(rootDir, 'matches');
  const fixturesDir = path.join(rootDir, 'fixtures');
  const resultsDir = path.join(rootDir, 'results');

  ensureDir(matchesDir);
  ensureDir(fixturesDir);
  ensureDir(resultsDir);

  const t20Count = matches.filter((m) => m.format === 'T20').length;
  const odiCount = matches.filter((m) => m.format === 'ODI' || m.format === 'One-Day').length;
  const desWinsCount = matches.filter((m) => m.winner === 'DES').length;
  const deWinsCount = matches.filter((m) => m.winner === 'DE').length;
  const upcomingCount = matches.filter((m) => m.status === 'upcoming').length;

  function renderMatchListSection(isResultsPage) {
    const listMatches = isResultsPage ? matches.filter(m => m.status === 'completed') : matches;
    return `
<section class="match-arena-section" style="padding-top:4rem;">
  <div class="container">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">${isResultsPage ? 'HISTORICAL ARCHIVE' : 'TOURNAMENT SCHEDULE'}</p>
        <h1 class="section-bigtitle">${isResultsPage ? `Match Results Archive (${listMatches.length} Matches)` : `Destroyers T20 &amp; One Day Fixtures (${listMatches.length} Matches)`}</h1>
        <p style="color:var(--c-gray-400); font-size:1rem; max-width:64ch; margin-top:0.4rem;">
          Official Atal Bihari Vajpayee Memorial Tournament fixtures between Destroyers and Dread Eleven in Rewa.
        </p>
      </div>
      <div>
        <span class="tabular font-bold" style="font-family:var(--f-mono); font-size:1.1rem; color:var(--c-gold);">
          SHOWING <span id="filter-matches-count">${listMatches.length}</span> MATCHES
        </span>
      </div>
    </div>

    <!-- Advanced Multi-Tier Filter Toolbar -->
    <div class="filter-toolbar" style="display:flex; flex-direction:column; gap:0.75rem; background:var(--c-card-bg); border:1px solid var(--b-medium); padding:1.25rem; margin-bottom:2.5rem;">
      <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem;">
        <span class="filter-group-label" style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase;">Format:</span>
        <button type="button" class="filter-pill active format-filter-btn" data-format="all">All (${listMatches.length})</button>
        <button type="button" class="filter-pill format-filter-btn" data-format="T20">T20 (${t20Count})</button>
        <button type="button" class="filter-pill format-filter-btn" data-format="ODI">ODI (${odiCount})</button>

        <span class="filter-group-label" style="margin-left:1rem; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase;">Result:</span>
        <button type="button" class="filter-pill active result-filter-btn" data-result="all">All</button>
        <button type="button" class="filter-pill result-filter-btn" data-result="win">DES Wins (${desWinsCount})</button>
        <button type="button" class="filter-pill result-filter-btn" data-result="loss">DE Wins (${deWinsCount})</button>
        ${upcomingCount > 0 ? `<button type="button" class="filter-pill result-filter-btn" data-result="upcoming">Upcoming (${upcomingCount})</button>` : ''}
      </div>

      <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem;">
        <span class="filter-group-label" style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase;">Season:</span>
        <button type="button" class="filter-pill active season-filter-btn" data-season="all">All Seasons</button>
        <button type="button" class="filter-pill season-filter-btn" data-season="2024">2024</button>
        <button type="button" class="filter-pill season-filter-btn" data-season="2023">2023</button>
        <button type="button" class="filter-pill season-filter-btn" data-season="2022">2022</button>
        <button type="button" class="filter-pill season-filter-btn" data-season="2021">2021</button>
      </div>

      <div style="display:flex; gap:1rem; align-items:center; margin-top:0.25rem;">
        <div style="flex:1; position:relative;">
          <input type="text" id="pro-match-search" placeholder="Search by venue, stage, or player of match..." style="width:100%; background:var(--c-dark-surface); border:1px solid var(--b-subtle); color:var(--c-white); padding:0.6rem 1rem; font-family:var(--f-body); font-size:0.875rem; outline:none;" />
        </div>
        <button type="button" id="filter-reset-btn" class="filter-pill" style="white-space:nowrap; padding:0.6rem 1rem;">Reset Filters</button>
      </div>
    </div>

    <div class="matches-pro-grid">
      ${listMatches.map((m) => {
        const isCompleted = m.status === 'completed';
        const isDesWinner = m.winner === 'DES';
        const isFinal = m.stage && m.stage.toLowerCase().includes('final');
        const desInnings = (m.innings || []).find(i => i.teamId === 'DES' || i.teamName?.includes('Destroyers')) || m.innings?.[0] || { runs: 0, wickets: 0, overs: 0 };
        const deInnings = (m.innings || []).find(i => i.teamId === 'DE' || i.teamName?.includes('Dread Eleven')) || m.innings?.[1] || { runs: 0, wickets: 0, overs: 0 };
        const resultAttr = isCompleted ? (isDesWinner ? 'win' : 'loss') : 'upcoming';

        return `
          <div class="pro-match-card ${isFinal ? 'is-final-match' : ''}" data-format="${esc(m.format)}" data-season="${esc(m.seasonYear)}" data-result="${resultAttr}">
            <div class="pro-match-header">
              <span class="pro-fmt-tag ${m.format.toLowerCase()}">${esc(m.format)} • SEASON ${esc(m.seasonYear)}</span>
              ${isFinal ? '<span style="font-family:var(--f-athletic); font-size:1.1rem; color:var(--c-gold);">2022 CHAMPIONSHIP FINAL</span>' : `<span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400);">${isCompleted ? `MATCH #${esc(m.matchNumber)}` : 'SCHEDULED'}</span>`}
            </div>

            <div style="font-size:0.75rem; color:var(--c-gray-400); margin-bottom:1rem;">
              <span style="font-weight:700; color:var(--c-white);">${formatDate(m.matchDate)}</span> • <span>${esc(m.venue?.name || 'APSU Stadium, Rewa')}</span>
            </div>

            ${isCompleted ? `
              <div class="pro-scoreboard-box">
                <div class="pro-score-entry">
                  <div class="pro-team-ident">
                    <div class="pro-team-circle des">DES</div>
                    <span class="pro-team-name ${isDesWinner ? 'winner' : ''}">Destroyers</span>
                  </div>
                  <div class="pro-score-numbers tabular">
                    ${desInnings.runs}/${desInnings.wickets} <span class="pro-overs-sub">(${desInnings.overs} ov)</span>
                  </div>
                </div>

                <div class="pro-score-entry">
                  <div class="pro-team-ident">
                    <div class="pro-team-circle de">DE</div>
                    <span class="pro-team-name ${!isDesWinner ? 'winner' : ''}">Dread Eleven</span>
                  </div>
                  <div class="pro-score-numbers tabular">
                    ${deInnings.runs}/${deInnings.wickets} <span class="pro-overs-sub">(${deInnings.overs} ov)</span>
                  </div>
                </div>
              </div>

              <div class="pro-result-strip ${isDesWinner ? 'des-victory' : 'de-victory'}">
                <span>${esc(m.resultText)}</span>
              </div>

              ${m.playerOfTheMatch ? `
                <div style="font-size:0.75rem; color:var(--c-gray-400); margin-bottom:1rem; border-top:1px solid var(--b-subtle); padding-top:0.6rem;">
                  Player of Match: <strong style="color:var(--c-gold);">${esc(m.playerOfTheMatch.name)}</strong> (${esc(m.playerOfTheMatch.reason)})
                </div>
              ` : ''}
            ` : `
              <div class="pro-scoreboard-box" style="padding:1.5rem 1rem; text-align:center;">
                <div style="font-family:var(--f-mono); font-size:0.875rem; color:var(--c-gold); font-weight:800; letter-spacing:0.1em; margin-bottom:0.4rem;">
                  UPCOMING DERBY FIXTURE
                </div>
                <div style="color:var(--c-gray-300); font-size:0.8125rem;">
                  ${esc(m.stage)} • ${esc(m.time || '09:30 IST')}
                </div>
              </div>

              <div class="pro-result-strip" style="background:var(--c-dark-surface); border:1px dashed var(--b-medium); color:var(--c-gray-400);">
                <span>Scheduled • Awaiting Toss</span>
              </div>
            `}

            <a href="/matches/${m.slug}" class="btn-inspect-scorecard" style="text-decoration:none;">
              <span>Inspect Full Match Hub &rarr;</span>
            </a>
          </div>
        `;
      }).join('')}
    </div>
  </div>
</section>
    `;
  }

  // A. Generate /fixtures/index.html
  const fixturesHtml = `
${renderHead({
  title: 'One Day & T20 Fixtures | Destroyers Cricket Club (DES)',
  description: 'Official One Day and T20 match schedule for Destroyers Cricket Club in the Atal Bihari Vajpayee Tournament, Rewa. Interactive format and season filters.',
  canonicalUrl: '/fixtures',
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: 'Fixtures', item: '/fixtures' }
  ]
})}
${renderHeader('fixtures')}
${renderMatchListSection(false)}
${renderFooter()}
  `;
  fs.writeFileSync(path.join(fixturesDir, 'index.html'), fixturesHtml);

  // B. Generate /results/index.html
  const resultsHtml = `
${renderHead({
  title: 'Match Results Archive (2021–2024) | Destroyers Cricket Club (DES)',
  description: 'Certified match results and scorecards for encounters between Destroyers Cricket Club and Dread Eleven in Rewa. Complete batting and bowling scorecards.',
  canonicalUrl: '/results',
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: 'Results', item: '/results' }
  ]
})}
${renderHeader('results')}
${renderMatchListSection(true)}
${renderFooter()}
  `;
  fs.writeFileSync(path.join(resultsDir, 'index.html'), resultsHtml);

  // C. Generate each individual match page (/matches/[slug])
  matches.forEach((m) => {
    const matchPageDir = path.join(matchesDir, m.slug);
    ensureDir(matchPageDir);

    const isCompleted = m.status === 'completed';
    const isDesWinner = m.winner === 'DES';
    const inn1 = m.innings?.[0];
    const inn2 = m.innings?.[1];

    const matchJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `Destroyers Cricket Club vs Dread Eleven (${m.format})`,
      startDate: `${m.matchDate}T${m.time.includes('09') ? '09:30:00' : '14:00:00'}Z`,
      location: {
        '@type': 'Place',
        name: m.venue.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: m.venue.city,
          addressRegion: 'Madhya Pradesh',
          addressCountry: 'India'
        }
      },
      competitor: [
        { '@type': 'SportsTeam', name: 'Destroyers Cricket Club' },
        { '@type': 'SportsTeam', name: 'Dread Eleven' }
      ]
    };

    function renderInningsTable(inn, battingTeam, bowlingTeam) {
      if (!inn || !inn.batting || !inn.batting.length) {
        return '<p style="color:var(--c-gray-400); padding:1rem;">Innings not yet contested.</p>';
      }

      const batRows = inn.batting.map((b) => `
        <tr>
          <td style="font-weight:800; color:var(--c-white); font-family:var(--f-athletic); font-size:1.15rem;">${esc(b.playerName)}</td>
          <td style="color:var(--c-gray-400); font-size:0.75rem;">${esc(b.dismissal)}</td>
          <td class="num tabular font-bold" style="color:var(--c-white); font-size:1.05rem;">${esc(b.runs)}</td>
          <td class="num tabular">${esc(b.balls)}</td>
          <td class="num tabular">${esc(b.fours)}</td>
          <td class="num tabular">${esc(b.sixes)}</td>
          <td class="num tabular" style="color:var(--c-gold); font-weight:700;">${esc(b.strikeRate)}</td>
        </tr>
      `).join('');

      const bowlRows = (inn.bowling || []).map((bo) => `
        <tr>
          <td style="font-weight:800; color:var(--c-white); font-family:var(--f-athletic); font-size:1.15rem;">${esc(bo.playerName)}</td>
          <td class="num tabular">${esc(bo.overs)}</td>
          <td class="num tabular">${esc(bo.maidens)}</td>
          <td class="num tabular">${esc(bo.runs)}</td>
          <td class="num tabular font-bold" style="color:var(--c-emerald); font-size:1.05rem;">${esc(bo.wickets)}</td>
          <td class="num tabular" style="color:var(--c-ember-bright); font-weight:700;">${esc(bo.economy)}</td>
        </tr>
      `).join('');

      return `
        <div style="margin-bottom:2.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px solid var(--b-medium); padding-bottom:0.75rem; margin-bottom:1rem;">
            <div>
              <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase;">Batting Squad: ${esc(battingTeam)}</div>
              <h3 style="font-family:var(--f-athletic); font-size:1.8rem; color:var(--c-white); text-transform:uppercase;">
                ${esc(inn.teamName)} Innings
              </h3>
            </div>
            <div class="tabular" style="font-family:var(--f-mono); font-size:1.8rem; font-weight:900; color:var(--c-white);">
              ${inn.runs}/${inn.wickets} <span style="font-size:0.875rem; color:var(--c-gray-400); font-weight:500;">(${inn.overs} ov • RR ${inn.runRate})</span>
            </div>
          </div>

          <div style="overflow-x:auto; margin-bottom:2rem;">
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
              <tbody>${batRows}</tbody>
            </table>
          </div>

          <h4 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
            Bowling Attack (${esc(bowlingTeam)})
          </h4>
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
              <tbody>${bowlRows}</tbody>
            </table>
          </div>
        </div>
      `;
    }

    const matchHtml = `
${renderHead({
  title: `Destroyers vs Dread Eleven (${formatDate(m.matchDate)}) — Official Match Hub`,
  description: `Official match report & scorecard for Destroyers Cricket Club vs Dread Eleven on ${formatDate(m.matchDate)} at ${m.venue.name}, Rewa. Complete ball-by-ball performance records.`,
  canonicalUrl: `/matches/${m.slug}`,
  jsonLd: matchJsonLd,
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: isCompleted ? 'Results' : 'Fixtures', item: isCompleted ? '/results' : '/fixtures' },
    { name: `${m.teamA} vs ${m.teamB} (${formatDate(m.matchDate)})`, item: `/matches/${m.slug}` }
  ]
})}
${renderHeader('results')}

<section class="match-arena-section" style="padding-top:4rem;">
  <div class="container">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" style="margin-bottom:1.5rem; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400);">
      <a href="/" style="color:inherit;">Home</a> / <a href="${isCompleted ? '/results' : '/fixtures'}" style="color:inherit;">${isCompleted ? 'Results' : 'Fixtures'}</a> / <span style="color:var(--c-gold);">${formatDate(m.matchDate)}</span>
    </nav>

    <!-- Match Header Banner -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-bottom:3rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:1rem;">
        <span class="pro-fmt-tag ${m.format.toLowerCase()}">${esc(m.format)} • Season ${esc(m.seasonYear)}</span>
        <span style="font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-gold); font-weight:800; text-transform:uppercase;">${esc(m.stage)}</span>
      </div>

      <h1 class="section-bigtitle" style="font-size:clamp(2.5rem, 5vw, 4rem); margin-bottom:0.75rem;">
        Destroyers vs Dread Eleven
      </h1>

      <div style="font-size:0.875rem; color:var(--c-gray-400); margin-bottom:1.5rem;">
        <span>${formatDate(m.matchDate)}</span> • <span>${esc(m.time)}</span> • <span>${esc(m.venue.name)}, ${esc(m.venue.city)}</span>
      </div>

      ${m.toss ? `
        <div style="font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-gray-300); margin-bottom:1.5rem; background:var(--c-dark-surface); padding:0.75rem 1rem; border:1px solid var(--b-subtle);">
          Toss: <strong>${esc(m.toss.winner)}</strong> won the toss and ${esc(m.toss.decision)}.
        </div>
      ` : ''}

      <div class="pro-result-strip ${isDesWinner ? 'des-victory' : (isCompleted ? 'de-victory' : '')}" style="font-size:1.15rem; padding:0.9rem 1.25rem;">
        <span>${esc(m.resultText)}</span>
      </div>

      ${m.playerOfTheMatch ? `
        <div style="margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--b-subtle); display:flex; align-items:center; gap:0.75rem;">
          <span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-transform:uppercase; font-weight:800;">Player of the Match:</span>
          <strong style="color:var(--c-white); font-family:var(--f-athletic); font-size:1.25rem;">${esc(m.playerOfTheMatch.name)}</strong>
          <span style="color:var(--c-gray-400); font-size:0.8125rem;">(${esc(m.playerOfTheMatch.team)} • ${esc(m.playerOfTheMatch.reason)})</span>
        </div>
      ` : ''}
    </div>

    ${isCompleted ? `
      <!-- Scorecard Content -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h2 style="font-family:var(--f-athletic); font-size:2rem; color:var(--c-white); text-transform:uppercase; margin-bottom:2rem;">
          Official Innings Scorecards
        </h2>

        ${inn1 ? renderInningsTable(inn1, inn1.teamName || (inn1.teamId === 'DES' ? 'Destroyers Cricket Club' : 'Dread Eleven'), inn1.teamId === 'DES' ? 'Dread Eleven' : 'Destroyers Cricket Club') : ''}

        ${inn2 ? renderInningsTable(inn2, inn2.teamName || (inn2.teamId === 'DES' ? 'Destroyers Cricket Club' : 'Dread Eleven'), inn2.teamId === 'DES' ? 'Dread Eleven' : 'Destroyers Cricket Club') : ''}
      </div>
    ` : `
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:3rem; text-align:center;">
        <h2 style="font-family:var(--f-athletic); font-size:2rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
          Fixture Scheduled
        </h2>
        <p style="color:var(--c-gray-400); font-size:0.9375rem; max-width:54ch; margin:0 auto 1.5rem;">
          This fixture is slated for the upcoming tournament cycle. Live scorecards, toss verification, and player performances will populate immediately following the match.
        </p>
        <a href="/fixtures" class="btn-athletic btn-athletic-outline">Back to Full Fixtures Schedule</a>
      </div>
    `}
  </div>
</section>

${renderFooter()}
    `;

    fs.writeFileSync(path.join(matchPageDir, 'index.html'), matchHtml);
  });

  console.log(`Generated /fixtures, /results, and ${matches.length} individual match pages.`);
}

// ------------------------------------------------------------
// 4. POINTS TABLE (/points-table)
// ------------------------------------------------------------
function generatePointsTablePage() {
  const tableDir = path.join(rootDir, 'points-table');
  ensureDir(tableDir);

  const html = `
${renderHead({
  title: 'Tournament Points Table & Standings | Destroyers Cricket Club (DES)',
  description: 'Official standings and points table for the Atal Bihari Vajpayee Memorial Tournament, Rewa. Destroyers Cricket Club and Dread Eleven season rankings, wins, losses, and net run rates.',
  canonicalUrl: '/points-table'
})}
${renderHeader('table')}

<section class="spotlight-banner-section" style="padding-top:4rem; background:#080808;">
  <div class="container">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">Tournament Standings</p>
        <h1 class="section-bigtitle">Tournament Points Table</h1>
        <p style="color:var(--c-gray-400); font-size:1rem; max-width:64ch; margin-top:0.4rem;">
          Sanctioned standings across all editions of the Atal Bihari Vajpayee Memorial Tournament in Rewa.
        </p>
      </div>
    </div>

    <!-- All-Time Master Standings -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-bottom:3rem;">
      <h2 style="font-family:var(--f-athletic); font-size:1.85rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.5rem;">
        All-Time Derby Table (2021–2024 • 24 Encounters)
      </h2>

      <div style="overflow-x:auto;">
        <table class="scorecard-data-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Franchise Team</th>
              <th class="num">P</th>
              <th class="num">W</th>
              <th class="num">L</th>
              <th class="num">T</th>
              <th class="num">NR</th>
              <th class="num">NRR</th>
              <th class="num">Pts</th>
            </tr>
          </thead>
          <tbody>
            ${pointsTable.allTime.map((row) => `
              <tr>
                <td style="font-weight:800; font-family:var(--f-mono); color:${row.rank === 1 ? 'var(--c-gold)' : 'var(--c-white)'};">${row.rank}</td>
                <td style="font-weight:800; color:var(--c-white); font-family:var(--f-athletic); font-size:1.3rem;">
                  ${esc(row.team)}
                </td>
                <td class="num tabular font-bold">${row.played}</td>
                <td class="num tabular font-bold" style="color:var(--c-emerald);">${row.won}</td>
                <td class="num tabular" style="color:var(--c-ruby);">${row.lost}</td>
                <td class="num tabular">${row.tied}</td>
                <td class="num tabular">${row.nr}</td>
                <td class="num tabular" style="font-family:var(--f-mono); font-weight:700;">${row.nrr}</td>
                <td class="num tabular font-bold" style="color:var(--c-gold); font-size:1.25rem;">${row.points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Season by Season Standings Grid -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2.5rem;">
      <!-- 2024 Season (Destroyers Champions 4-1) -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Season 2024 (Destroyers 4–1 Series Win)</h3>
        <table class="scorecard-data-table">
          <thead>
            <tr><th>Team</th><th class="num">P</th><th class="num">W</th><th class="num">L</th><th class="num">NRR</th><th class="num">Pts</th></tr>
          </thead>
          <tbody>
            ${pointsTable['2024'].map((r) => `
              <tr>
                <td style="font-weight:700; color:var(--c-white);">${esc(r.team)}</td>
                <td class="num tabular">${r.played}</td>
                <td class="num tabular" style="color:var(--c-emerald); font-weight:700;">${r.won}</td>
                <td class="num tabular" style="color:var(--c-ruby);">${r.lost}</td>
                <td class="num tabular font-mono">${r.nrr}</td>
                <td class="num tabular font-bold" style="color:var(--c-gold);">${r.points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 2023 Season -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Season 2023 (50-Over ODI)</h3>
        <table class="scorecard-data-table">
          <thead>
            <tr><th>Team</th><th class="num">P</th><th class="num">W</th><th class="num">L</th><th class="num">NRR</th><th class="num">Pts</th></tr>
          </thead>
          <tbody>
            ${pointsTable['2023'].map((r) => `
              <tr>
                <td style="font-weight:700; color:var(--c-white);">${esc(r.team)}</td>
                <td class="num tabular">${r.played}</td>
                <td class="num tabular" style="color:var(--c-emerald); font-weight:700;">${r.won}</td>
                <td class="num tabular" style="color:var(--c-ruby);">${r.lost}</td>
                <td class="num tabular font-mono">${r.nrr}</td>
                <td class="num tabular font-bold" style="color:var(--c-gold);">${r.points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 2022 Season -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Season 2022 (T20 &amp; ODI)</h3>
        <table class="scorecard-data-table">
          <thead>
            <tr><th>Team</th><th class="num">P</th><th class="num">W</th><th class="num">L</th><th class="num">NRR</th><th class="num">Pts</th></tr>
          </thead>
          <tbody>
            ${pointsTable['2022'].map((r) => `
              <tr>
                <td style="font-weight:700; color:var(--c-white);">${esc(r.team)}</td>
                <td class="num tabular">${r.played}</td>
                <td class="num tabular" style="color:var(--c-emerald); font-weight:700;">${r.won}</td>
                <td class="num tabular" style="color:var(--c-ruby);">${r.lost}</td>
                <td class="num tabular font-mono">${r.nrr}</td>
                <td class="num tabular font-bold" style="color:var(--c-gold);">${r.points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 2021 Inaugural Year -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Season 2021 (Inaugural T20)</h3>
        <table class="scorecard-data-table">
          <thead>
            <tr><th>Team</th><th class="num">P</th><th class="num">W</th><th class="num">L</th><th class="num">NRR</th><th class="num">Pts</th></tr>
          </thead>
          <tbody>
            ${pointsTable['2021'].map((r) => `
              <tr>
                <td style="font-weight:700; color:var(--c-white);">${esc(r.team)}</td>
                <td class="num tabular">${r.played}</td>
                <td class="num tabular" style="color:var(--c-emerald); font-weight:700;">${r.won}</td>
                <td class="num tabular" style="color:var(--c-ruby);">${r.lost}</td>
                <td class="num tabular font-mono">${r.nrr}</td>
                <td class="num tabular font-bold" style="color:var(--c-gold);">${r.points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

${renderFooter()}
  `;

  fs.writeFileSync(path.join(tableDir, 'index.html'), html);
  console.log('Generated /points-table/index.html');
}

// ------------------------------------------------------------
// 5. STATS & RECORDS (/stats)
// ------------------------------------------------------------
function generateStatsPage() {
  const statsDir = path.join(rootDir, 'stats');
  ensureDir(statsDir);

  const topRunScorers = [...squad].sort((a, b) => b.batting.runs - a.batting.runs).slice(0, 10);
  const topWicketTakers = [...squad].sort((a, b) => b.bowling.wickets - a.bowling.wickets).slice(0, 10);
  const highestScores = [...squad].filter((p) => p.batting.runs > 50).sort((a, b) => parseInt(b.batting.highestScore) - parseInt(a.batting.highestScore)).slice(0, 8);
  const topAverages = [...squad].filter((p) => p.matches >= 5 && p.batting.average > 20).sort((a, b) => b.batting.average - a.batting.average);

  const html = `
${renderHead({
  title: 'Stats & Records Leaderboard | Destroyers Cricket Club (DES)',
  description: 'Certified statistics and tournament records for Destroyers Cricket Club in Rewa. Top run scorers, leading wicket-takers, best averages, and highest individual scores.',
  canonicalUrl: '/stats'
})}
${renderHeader('stats')}

<section class="spotlight-banner-section" style="padding-top:4rem; background:#080808;">
  <div class="container">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">The Record Books</p>
        <h1 class="section-bigtitle">Destroyers All-Time Statistics</h1>
        <p style="color:var(--c-gray-400); font-size:1rem; max-width:64ch; margin-top:0.4rem;">
          Verified tournament records across all 24 clashes against Dread Eleven in Rewa.
        </p>
      </div>
    </div>

    <!-- Top Run Scorers & Leading Wicket Takers Grid -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2.5rem; margin-bottom:3rem;">
      <!-- Top Run Scorers -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h2 style="font-family:var(--f-athletic); font-size:1.75rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.25rem;">
          Top Destroyers Run Scorers
        </h2>
        <table class="scorecard-data-table">
          <thead>
            <tr><th>Player</th><th class="num">Mat</th><th class="num">Runs</th><th class="num">Avg</th><th class="num">SR</th><th class="num">50s</th></tr>
          </thead>
          <tbody>
            ${topRunScorers.map((p) => `
              <tr>
                <td style="font-weight:800; color:var(--c-white);"><a href="/players/${p.slug}" style="color:inherit;">${esc(p.name)}</a></td>
                <td class="num tabular">${p.matches}</td>
                <td class="num tabular font-bold" style="color:var(--c-gold); font-size:1rem;">${esc(p.batting.runs)}</td>
                <td class="num tabular">${esc(p.batting.average)}</td>
                <td class="num tabular">${esc(p.batting.strikeRate)}</td>
                <td class="num tabular">${esc(p.batting.fifties)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Leading Wicket Takers -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h2 style="font-family:var(--f-athletic); font-size:1.75rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.25rem;">
          Top Destroyers Wicket Takers
        </h2>
        <table class="scorecard-data-table">
          <thead>
            <tr><th>Bowler</th><th class="num">Mat</th><th class="num">Wkts</th><th class="num">Overs</th><th class="num">BBI</th><th class="num">Eco</th></tr>
          </thead>
          <tbody>
            ${topWicketTakers.map((p) => `
              <tr>
                <td style="font-weight:800; color:var(--c-white);"><a href="/players/${p.slug}" style="color:inherit;">${esc(p.name)}</a></td>
                <td class="num tabular">${p.matches}</td>
                <td class="num tabular font-bold" style="color:var(--c-emerald); font-size:1rem;">${esc(p.bowling.wickets)}</td>
                <td class="num tabular">${esc(p.bowling.overs)}</td>
                <td class="num tabular font-mono">${esc(p.bowling.bestBowling)}</td>
                <td class="num tabular">${esc(p.bowling.economy)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Rate Statistics: Highest Averages & Highest Scores -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2.5rem;">
      <!-- Highest Batting Averages -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
          Best Batting Averages (Min. 5 Matches)
        </h3>
        <table class="scorecard-data-table">
          <thead>
            <tr><th>Player</th><th class="num">Mat</th><th class="num">Runs</th><th class="num">Average</th><th class="num">SR</th></tr>
          </thead>
          <tbody>
            ${topAverages.map((p) => `
              <tr>
                <td style="font-weight:800; color:var(--c-white);"><a href="/players/${p.slug}" style="color:inherit;">${esc(p.name)}</a></td>
                <td class="num tabular">${p.matches}</td>
                <td class="num tabular">${esc(p.batting.runs)}</td>
                <td class="num tabular font-bold" style="color:var(--c-gold); font-size:1rem;">${esc(p.batting.average)}</td>
                <td class="num tabular">${esc(p.batting.strikeRate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Highest Individual Scores -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
          Highest Individual Scores
        </h3>
        <table class="scorecard-data-table">
          <thead>
            <tr><th>Player</th><th class="num">High Score</th><th class="num">Strike Rate</th><th class="num">Total Runs</th></tr>
          </thead>
          <tbody>
            ${highestScores.map((p) => `
              <tr>
                <td style="font-weight:800; color:var(--c-white);"><a href="/players/${p.slug}" style="color:inherit;">${esc(p.name)}</a></td>
                <td class="num tabular font-bold" style="color:var(--c-ember-bright); font-size:1.1rem;">${esc(p.batting.highestScore)}</td>
                <td class="num tabular">${esc(p.batting.strikeRate)}</td>
                <td class="num tabular">${esc(p.batting.runs)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

${renderFooter()}
  `;

  fs.writeFileSync(path.join(statsDir, 'index.html'), html);
  console.log('Generated /stats/index.html');
}

// ------------------------------------------------------------
// 6. NEWS DIRECTORY (/news) & ARTICLE PAGES (/news/[slug])
// ------------------------------------------------------------
function generateNewsPages() {
  const newsDir = path.join(rootDir, 'news');
  ensureDir(newsDir);

  const directoryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Destroyers Cricket Club News & Features',
    itemListElement: news.map((n, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/news/${n.slug}`,
      name: n.title
    }))
  };

  const directoryHtml = `
${renderHead({
  title: 'News & Press Releases | Destroyers Cricket Club (DES)',
  description: 'Official announcements, match reports, and player updates for Destroyers Cricket Club in the Atal Bihari Vajpayee Memorial Tournament, Rewa.',
  canonicalUrl: '/news',
  jsonLd: directoryJsonLd,
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: 'News', item: '/news' }
  ]
})}
${renderHeader('news')}

<section class="spotlight-banner-section" style="padding-top:4rem; background:#080808;">
  <div class="container">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">Official Bulletins</p>
        <h1 class="section-bigtitle">News &amp; Press Center</h1>
        <p style="color:var(--c-gray-400); font-size:1rem; max-width:64ch; margin-top:0.4rem;">
          Official updates on squad preparations, match analyses, and tournament developments in Rewa.
        </p>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:2.5rem;">
      ${news.map((n) => `
        <article style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem; display:flex; flex-direction:column;">
          <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-transform:uppercase; font-weight:800; margin-bottom:0.75rem;">
            ${esc(n.category)} • ${formatDate(n.publishedAt.slice(0, 10))}
          </div>
          <h2 style="font-family:var(--f-athletic); font-size:1.9rem; color:var(--c-white); text-transform:uppercase; line-height:1.05; margin-bottom:0.85rem;">
            <a href="/news/${n.slug}" style="color:inherit; text-decoration:none;">${esc(n.title)}</a>
          </h2>
          <p style="font-size:0.9375rem; color:var(--c-gray-300); line-height:1.6; margin-bottom:2rem;">
            ${esc(n.summary)}
          </p>
          <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--b-subtle); padding-top:1rem;">
            <span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400);">${esc(n.readTime)}</span>
            <a href="/news/${n.slug}" style="font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-ember-bright); font-weight:800; text-transform:uppercase; text-decoration:none;">
              Read Full Story &rarr;
            </a>
          </div>
        </article>
      `).join('')}
    </div>
  </div>
</section>

${renderFooter()}
  `;

  fs.writeFileSync(path.join(newsDir, 'index.html'), directoryHtml);

  // Generate individual news article pages
  news.forEach((n) => {
    const articleDir = path.join(newsDir, n.slug);
    ensureDir(articleDir);

    const related = news.filter((x) => x.slug !== n.slug).slice(0, 2);

    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: n.title,
      description: n.summary,
      datePublished: n.publishedAt,
      dateModified: n.updatedAt,
      author: {
        '@type': 'Person',
        name: n.author.name,
        jobTitle: n.author.role
      },
      publisher: {
        '@type': 'Organization',
        name: 'Destroyers Cricket Club (DES)',
        url: BASE_URL
      }
    };

    const articleHtml = `
${renderHead({
  title: `${n.title} | Destroyers Cricket Club News`,
  description: n.summary,
  canonicalUrl: `/news/${n.slug}`,
  ogType: 'article',
  ogImage: n.heroImage,
  jsonLd: articleJsonLd,
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: 'News', item: '/news' },
    { name: n.title, item: `/news/${n.slug}` }
  ]
})}
${renderHeader('news')}

<article class="spotlight-banner-section" style="padding-top:4rem; background:#080808;">
  <div class="container" style="max-width:880px;">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" style="margin-bottom:1.5rem; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400);">
      <a href="/" style="color:inherit;">Home</a> / <a href="/news" style="color:inherit;">News</a> / <span style="color:var(--c-gold);">${esc(n.category)}</span>
    </nav>

    <div style="font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-gold); text-transform:uppercase; font-weight:800; margin-bottom:0.75rem;">
      ${esc(n.category)} • Published ${formatDate(n.publishedAt.slice(0, 10))} • ${esc(n.readTime)}
    </div>

    <h1 class="section-bigtitle" style="font-size:clamp(2.4rem, 5vw, 3.8rem); line-height:1; margin-bottom:1.5rem;">
      ${esc(n.title)}
    </h1>

    <div style="display:flex; align-items:center; gap:0.85rem; border-top:1px solid var(--b-subtle); border-bottom:1px solid var(--b-subtle); padding:1rem 0; margin-bottom:2.5rem; font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-gray-400);">
      <span>By <strong style="color:var(--c-white);">${esc(n.author.name)}</strong></span>
      <span>•</span>
      <span>${esc(n.author.role)}</span>
    </div>

    <div style="font-size:1.0625rem; line-height:1.8; color:var(--c-gray-300); margin-bottom:3.5rem;">
      ${n.body}
    </div>

    <!-- Related Articles -->
    <div style="border-top:1px solid var(--b-medium); padding-top:2.5rem; margin-top:3rem;">
      <h3 style="font-family:var(--f-athletic); font-size:1.75rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.5rem;">
        Related News &amp; Features
      </h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
        ${related.map((r) => `
          <div style="background:var(--c-card-bg); border:1px solid var(--b-subtle); padding:1.5rem;">
            <div style="font-family:var(--f-mono); font-size:0.6875rem; color:var(--c-gold); text-transform:uppercase; margin-bottom:0.5rem;">${esc(r.category)}</div>
            <h4 style="font-family:var(--f-athletic); font-size:1.35rem; text-transform:uppercase; line-height:1.1; margin-bottom:0.5rem;">
              <a href="/news/${r.slug}" style="color:var(--c-white); text-decoration:none;">${esc(r.title)}</a>
            </h4>
            <a href="/news/${r.slug}" style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-ember-bright); font-weight:800;">Read &rarr;</a>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</article>

${renderFooter()}
    `;

    fs.writeFileSync(path.join(articleDir, 'index.html'), articleHtml);
  });

  console.log(`Generated /news and ${news.length} individual news articles.`);
}

// ------------------------------------------------------------
// 7. ABOUT (/about) & CONTACT (/contact) & 404 (/404.html)
// ------------------------------------------------------------
function generateAboutPage() {
  const aboutDir = path.join(rootDir, 'about');
  ensureDir(aboutDir);

  const html = `
${renderHead({
  title: 'About Destroyers Cricket Club & Rewa Tournament Heritage',
  description: 'Official history of Destroyers Cricket Club (DES), captained by Pranav Dwivedi, the Atal Bihari Vajpayee Memorial Tournament, and the Rewa Division Cricket Association (RDCA).',
  canonicalUrl: '/about'
})}
${renderHeader('about')}

<section class="spotlight-banner-section" style="padding-top:4rem; background:#080808;">
  <div class="container">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">The Franchise Dossier</p>
        <h1 class="section-bigtitle">About Destroyers Cricket Club</h1>
        <p style="color:var(--c-gray-400); font-size:1rem; max-width:64ch; margin-top:0.4rem;">
          Established in 2021 to compete at the peak of divisional trial cricket in Madhya Pradesh under the Rewa Division Cricket Association (RDCA).
        </p>
      </div>
    </div>

    <!-- Foundation & Mission -->
    <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:3rem; margin-bottom:3.5rem;">
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h2 style="font-family:var(--f-athletic); font-size:2rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.25rem;">
          The Crucible of Rewa Cricket
        </h2>
        <div style="font-size:0.9375rem; color:var(--c-gray-300); line-height:1.8; display:flex; flex-direction:column; gap:1rem;">
          <p>
            <strong>Destroyers Cricket Club (DES)</strong> was founded in 2021 as a premier divisional franchise created to test elite talent from Rewa, Jabalpur, Bhopal, and the broader Madhya Pradesh state pool in high-pressure derby cricket.
          </p>
          <p>
            Competing in the annual <strong>Atal Bihari Vajpayee Memorial Tournament</strong> under captain <strong>Pranav Dwivedi</strong>, Destroyers forged an immediate, ferocious rivalry with <strong>Dread Eleven (DE)</strong>, led by Akhil Mishra.
          </p>
          <p>
            The franchise enjoyed a defining high in September 2024, clinching the 50-Over Series 4–1 at APSU Stadium, with captain Pranav Dwivedi sealing the finale by defending 233 in a tense 8-run triumph.
          </p>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
          <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-transform:uppercase; font-weight:800;">Accreditation</div>
          <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin:0.35rem 0 0.75rem;">
            RDCA, MPCA &amp; BCCI Affiliation
          </h3>
          <p style="font-size:0.8125rem; color:var(--c-gray-400); line-height:1.6;">
            Sanctioned under the Rewa Division Cricket Association (RDCA), affiliated with the Madhya Pradesh Cricket Association (MPCA) and the Board of Control for Cricket in India (BCCI).
          </p>
        </div>

        <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
          <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-ember-bright); text-transform:uppercase; font-weight:800;">Venues</div>
          <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin:0.35rem 0 0.75rem;">
            APSU Stadium &amp; Martand Ground
          </h3>
          <p style="font-size:0.8125rem; color:var(--c-gray-400); line-height:1.6;">
            Matches are hosted at the iconic Awadhesh Pratap Singh University Stadium (10,000 capacity turf) and historic Martand School Ground No. 3 in Rewa.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

${renderFooter()}
  `;

  fs.writeFileSync(path.join(aboutDir, 'index.html'), html);
  console.log('Generated /about/index.html');
}

function generateContactPage() {
  const contactDir = path.join(rootDir, 'contact');
  ensureDir(contactDir);

  const html = `
${renderHead({
  title: 'Contact & Venues | Destroyers Cricket Club (DES)',
  description: 'Official contact information, trial registration inquiries, and venue directions for Destroyers Cricket Club in Rewa, Madhya Pradesh.',
  canonicalUrl: '/contact'
})}
${renderHeader('contact')}

<section class="spotlight-banner-section" style="padding-top:4rem; background:#080808;">
  <div class="container" style="max-width:960px;">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">Inquiries &amp; Administration</p>
        <h1 class="section-bigtitle">Contact Destroyers Cricket Club</h1>
        <p style="color:var(--c-gray-400); font-size:1rem; max-width:64ch; margin-top:0.4rem;">
          Official inquiries regarding the Atal Bihari Vajpayee Memorial Tournament, match ticketing, and divisional trial dates.
        </p>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2.5rem; margin-bottom:3rem;">
      <!-- Administrative Headquarters -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.25rem;">
          Rewa Administrative Desk
        </h2>
        <div style="display:flex; flex-direction:column; gap:1rem; font-size:0.875rem; color:var(--c-gray-300);">
          <div>
            <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-transform:uppercase;">Sanctioning Office</div>
            <p>Rewa Division Cricket Association (RDCA) Pavilion Desk</p>
          </div>
          <div>
            <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-transform:uppercase;">Primary Stadium</div>
            <p>Awadhesh Pratap Singh University (APSU) Stadium, Rewa, MP 486003</p>
          </div>
          <div>
            <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-transform:uppercase;">Email Inquiries</div>
            <p style="font-family:var(--f-mono);">admin@destroyers-rewa.cricket</p>
          </div>
        </div>
      </div>

      <!-- Inquiries Form -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.25rem;">
          Send An Official Inquiry
        </h2>
        <form onsubmit="event.preventDefault(); alert('Inquiry received. RDCA desk will respond within 24 business hours.');" style="display:flex; flex-direction:column; gap:1rem;">
          <div>
            <label style="display:block; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); margin-bottom:0.35rem; text-transform:uppercase;">Full Name</label>
            <input type="text" required placeholder="Your name" style="width:100%; background:#181818; border:1px solid var(--b-medium); color:#fff; padding:0.65rem 0.9rem; font-family:var(--f-body); font-size:0.875rem;">
          </div>
          <div>
            <label style="display:block; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); margin-bottom:0.35rem; text-transform:uppercase;">Email Address</label>
            <input type="email" required placeholder="you@example.com" style="width:100%; background:#181818; border:1px solid var(--b-medium); color:#fff; padding:0.65rem 0.9rem; font-family:var(--f-body); font-size:0.875rem;">
          </div>
          <div>
            <label style="display:block; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); margin-bottom:0.35rem; text-transform:uppercase;">Message</label>
            <textarea rows="4" required placeholder="Tournament or ticket inquiry..." style="width:100%; background:#181818; border:1px solid var(--b-medium); color:#fff; padding:0.65rem 0.9rem; font-family:var(--f-body); font-size:0.875rem; resize:vertical;"></textarea>
          </div>
          <button type="submit" class="btn-athletic btn-athletic-primary" style="margin-top:0.5rem;">
            Submit Inquiry
          </button>
        </form>
      </div>
    </div>
  </div>
</section>

${renderFooter()}
  `;

  fs.writeFileSync(path.join(contactDir, 'index.html'), html);
  console.log('Generated /contact/index.html');
}

function generatePrivacyPage() {
  const privacyDir = path.join(rootDir, 'privacy');
  ensureDir(privacyDir);

  const html = `
${renderHead({
  title: 'Privacy Policy | Destroyers Cricket Club (DES)',
  description: 'Official privacy policy for Destroyers Cricket Club, detailing data protection standards, tournament newsletter processing, and visitor rights under Rewa Division Cricket Association regulations.',
  canonicalUrl: '/privacy',
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: 'Privacy Policy', item: '/privacy' }
  ]
})}
${renderHeader('')}

<section class="spotlight-banner-section" style="padding-top:4rem; padding-bottom:5rem; background:#080808;">
  <div class="container" style="max-width:880px;">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" style="margin-bottom:1.5rem; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400);">
      <a href="/" style="color:inherit;">Home</a> / <span style="color:var(--c-gold);">Privacy Policy</span>
    </nav>

    <div class="section-masthead" style="margin-bottom:2.5rem;">
      <div>
        <p class="section-pretitle">Governance &amp; Data Trust</p>
        <h1 class="section-bigtitle">Privacy Policy</h1>
        <p style="color:var(--c-gray-400); font-size:0.95rem; margin-top:0.5rem; font-family:var(--f-mono);">
          Effective Date: 1 January 2026 • Last Updated: 9 September 2026
        </p>
      </div>
    </div>

    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; display:flex; flex-direction:column; gap:2rem; line-height:1.75; color:var(--c-gray-300); font-size:0.95rem;">
      <div>
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
          1. Commitment to Fan &amp; Athlete Data Privacy
        </h2>
        <p>
          Destroyers Cricket Club (&ldquo;DES&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) operates in full compliance with Indian Information Technology (IT) laws and Digital Personal Data Protection standards. This Privacy Policy governs the collection, storage, and processing of telemetry, analytics, and inquiry correspondence across the official franchise domain (<code>destroyerscricket.in</code>).
        </p>
      </div>

      <div>
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
          2. Information We Collect
        </h2>
        <ul style="padding-left:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
          <li><strong>Tournament Inquiries:</strong> When submitting forms through our Contact desk, your name, email address, and inquiry text are logged solely to fulfill match-day inquiries and trial scheduling.</li>
          <li><strong>Aggregated Site Telemetry:</strong> Anonymized Core Web Vitals, page visit counts, device classifications, and regional bandwidth telemetry to maintain 60 FPS client rendering.</li>
          <li><strong>Cookies &amp; Local Storage:</strong> Essential session preferences such as filter toolbar states (T20 vs. ODI) and theme caching. No tracking pixels are sold or shared with third-party data brokers.</li>
        </ul>
      </div>

      <div>
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
          3. Player Data &amp; Official Scorecards
        </h2>
        <p>
          All player statistics, averages, and historical scorecards presented on this website are certified public tournament records sanctioned by the Rewa Division Cricket Association (RDCA) for the Atal Bihari Vajpayee Memorial Tournament.
        </p>
      </div>

      <div>
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
          4. Contact Our Data Protection Officer
        </h2>
        <p>
          For privacy inquiries or deletion requests regarding newsletter subscriptions, contact our administration desk at:
          <br>
          <strong style="color:var(--c-gold); font-family:var(--f-mono);">privacy@destroyerscricket.in</strong>
          <br>
          RDCA Pavilion, Awadhesh Pratap Singh University Stadium, Rewa, Madhya Pradesh 486003.
        </p>
      </div>
    </div>
  </div>
</section>

${renderFooter()}
  `;

  fs.writeFileSync(path.join(privacyDir, 'index.html'), html);
  console.log('Generated /privacy/index.html');
}

function generateTermsPage() {
  const termsDir = path.join(rootDir, 'terms');
  ensureDir(termsDir);

  const html = `
${renderHead({
  title: 'Terms & Conditions | Destroyers Cricket Club (DES)',
  description: 'Official terms and conditions, match ticketing rules, stadium conduct policies, and intellectual property rights for Destroyers Cricket Club in Rewa.',
  canonicalUrl: '/terms',
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: 'Terms & Conditions', item: '/terms' }
  ]
})}
${renderHeader('')}

<section class="spotlight-banner-section" style="padding-top:4rem; padding-bottom:5rem; background:#080808;">
  <div class="container" style="max-width:880px;">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" style="margin-bottom:1.5rem; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400);">
      <a href="/" style="color:inherit;">Home</a> / <span style="color:var(--c-gold);">Terms &amp; Conditions</span>
    </nav>

    <div class="section-masthead" style="margin-bottom:2.5rem;">
      <div>
        <p class="section-pretitle">Legal Framework</p>
        <h1 class="section-bigtitle">Terms &amp; Conditions</h1>
        <p style="color:var(--c-gray-400); font-size:0.95rem; margin-top:0.5rem; font-family:var(--f-mono);">
          Effective Date: 1 January 2026 • Sanctioned by Rewa Division Cricket Association
        </p>
      </div>
    </div>

    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; display:flex; flex-direction:column; gap:2rem; line-height:1.75; color:var(--c-gray-300); font-size:0.95rem;">
      <div>
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using the official digital portal of Destroyers Cricket Club (<code>destroyerscricket.in</code>), you agree to be bound by these Terms and Conditions and all applicable RDCA and MPCA tournament bylaws.
        </p>
      </div>

      <div>
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
          2. Intellectual Property &amp; Scorecard Data
        </h2>
        <p>
          All trademarks, logos, team crests, player portraits, match analytics, and editorial reports published on this website are the proprietary property of Destroyers Cricket Club and its content licensors. Scorecard feeds may be referenced for journalistic purposes with appropriate attribution and canonical links.
        </p>
      </div>

      <div>
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
          3. Venue Code of Conduct
        </h2>
        <p>
          Spectators attending Destroyers home matches at APSU Stadium or Rewa divisional grounds must comply with zero-tolerance spectator decency rules, anti-corruption regulations, and venue security standards.
        </p>
      </div>

      <div>
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
          4. Governing Law
        </h2>
        <p>
          These Terms are governed by and construed under the laws of the State of Madhya Pradesh, India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Rewa, MP.
        </p>
      </div>
    </div>
  </div>
</section>

${renderFooter()}
  `;

  fs.writeFileSync(path.join(termsDir, 'index.html'), html);
  console.log('Generated /terms/index.html');
}

function generate404Page() {
  const html = `
${renderHead({
  title: '404 — Page Not Found | Destroyers Cricket Club',
  description: 'Looks like this ball went straight into the stands. Explore fixtures, squad profiles, or match results on the official Destroyers portal.',
  canonicalUrl: '/404',
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: '404 Page Not Found', item: '/404' }
  ]
})}
${renderHeader('')}

<section class="spotlight-banner-section" style="padding:8rem 0; text-align:center; background:#080808;">
  <div class="container" style="max-width:680px;">
    <div style="font-family:var(--f-athletic); font-size:8rem; color:var(--c-ember-bright); line-height:0.8; margin-bottom:1rem;">404</div>
    <h1 style="font-family:var(--f-athletic); font-size:2.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
      404 — Page Not Found
    </h1>
    <p style="color:var(--c-gray-400); font-size:1.25rem; margin-bottom:2.5rem; line-height:1.6;">
      Looks like this ball went straight into the stands.
    </p>
    <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
      <a href="/" class="btn-athletic btn-athletic-primary">Go Home</a>
      <a href="/fixtures" class="btn-athletic" style="background:#1c1c1c; color:#fff; border:1px solid #333; padding:0.8rem 1.4rem; font-family:var(--f-athletic); font-size:1.15rem; text-decoration:none; text-transform:uppercase;">View Fixtures</a>
      <a href="/players" class="btn-athletic" style="background:#1c1c1c; color:#fff; border:1px solid #333; padding:0.8rem 1.4rem; font-family:var(--f-athletic); font-size:1.15rem; text-decoration:none; text-transform:uppercase;">View Squad</a>
      <a href="/news" class="btn-athletic" style="background:#1c1c1c; color:#fff; border:1px solid #333; padding:0.8rem 1.4rem; font-family:var(--f-athletic); font-size:1.15rem; text-decoration:none; text-transform:uppercase;">Latest News</a>
    </div>
  </div>
</section>

${renderFooter()}
  `;

  fs.writeFileSync(path.join(rootDir, '404.html'), html);
  console.log('Generated 404.html');
}

// ------------------------------------------------------------
// 8. SITEMAP.XML & ROBOTS.TXT
// ------------------------------------------------------------
function generateSitemapAndRobots() {
  const lastmod = '2026-09-09T21:45:00+05:30';

  const urls = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/players', changefreq: 'daily', priority: '0.9' },
    { loc: '/fixtures', changefreq: 'daily', priority: '0.9' },
    { loc: '/results', changefreq: 'weekly', priority: '0.8' },
    { loc: '/points-table', changefreq: 'weekly', priority: '0.8' },
    { loc: '/stats', changefreq: 'weekly', priority: '0.8' },
    { loc: '/news', changefreq: 'weekly', priority: '0.8' },
    { loc: '/about', changefreq: 'monthly', priority: '0.7' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.6' },
    { loc: '/privacy', changefreq: 'yearly', priority: '0.5' },
    { loc: '/terms', changefreq: 'yearly', priority: '0.5' }
  ];

  // Add all player pages (48 players)
  squad.forEach((p) => {
    urls.push({
      loc: `/players/${p.slug}`,
      changefreq: 'weekly',
      priority: '0.8'
    });
  });

  // Add all match pages (24 matches)
  matches.forEach((m) => {
    urls.push({
      loc: `/matches/${m.slug}`,
      changefreq: 'weekly',
      priority: '0.8'
    });
  });

  // Add all news articles
  news.forEach((n) => {
    urls.push({
      loc: `/news/${n.slug}`,
      changefreq: 'monthly',
      priority: '0.7'
    });
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemapXml);

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;

  fs.writeFileSync(path.join(rootDir, 'robots.txt'), robotsTxt);

  // Generate Netlify/Cloudflare redirects file for clean canonical paths
  const redirectsContent = `/squad /players 301
/match/* /matches/:splat 301
/standing /points-table 301
/standings /points-table 301
`;
  fs.writeFileSync(path.join(rootDir, '_redirects'), redirectsContent);

  console.log(`Generated sitemap.xml with ${urls.length} indexable canonical URLs (with lastmod), robots.txt, and _redirects.`);
}

// ------------------------------------------------------------
// MAIN BUILD EXECUTION
// ------------------------------------------------------------
function main() {
  console.log('=== BUILDING DESTROYERS CRICKET CLUB PRODUCTION SUITE (CAPT. PRANAV DWIVEDI) ===');
  generateHomePage();
  generateSquadPages();
  generateMatchPages();
  generatePointsTablePage();
  generateStatsPage();
  generateNewsPages();
  generateAboutPage();
  generateContactPage();
  generatePrivacyPage();
  generateTermsPage();
  generate404Page();
  generateSitemapAndRobots();
  console.log('=== BUILD COMPLETE! ALL PAGES GENERATED WITH CORRECT TEAM ASSIGNMENTS ===');
}

main();
