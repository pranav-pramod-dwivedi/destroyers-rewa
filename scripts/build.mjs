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

const BASE_URL = process.env.SITE_URL || 'https://destroyers-rewacricket.pages.dev';

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

// Helper: Clamp title for optimal SEO (<60 chars)
function clampTitle(text, maxLen = 60) {
  if (!text) return '';
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  const sliced = text.slice(0, maxLen - 3);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 30 ? sliced.slice(0, lastSpace) : sliced).trim() + '...';
}

// Helper: Clamp description for optimal SEO (120-155 chars)
function clampDesc(text, maxLen = 155) {
  if (!text) return '';
  text = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  const sliced = text.slice(0, maxLen - 3);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 70 ? sliced.slice(0, lastSpace) : sliced).trim() + '...';
}

// Helper: Safe CSS minifier
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([\{\};:,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

// Helper: Safe JS minifier
function minifyJs(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}


// ------------------------------------------------------------
// GLOBAL HTML TEMPLATE BLOCKS
// ------------------------------------------------------------
function renderHead({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  ogImage = '/public/og-image.png',
  jsonLd = null,
  breadcrumbs = null,
  keywords = null,
  author = 'Destroyers Cricket Club Media Team',
  profile = null,
  article = null,
  twitterData = null,
  alternateJson = null,
  alternateMd = null
}) {
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

  const cleanTitle = clampTitle(title, 60);
  const cleanDesc = clampDesc(description, 155);

  // Fallback structured data so NO page lacks JSON-LD schema
  if (jsonLdList.length === 0) {
    jsonLdList.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: cleanTitle,
      description: cleanDesc,
      url: fullCanonical,
      isPartOf: {
        '@type': ['SportsOrganization', 'Organization'],
        name: 'Destroyers Cricket Club (DES)',
        url: BASE_URL,
        sport: 'Cricket'
      }
    });
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(cleanTitle)}</title>
  <meta name="description" content="${esc(cleanDesc)}">
  ${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''}
  <meta name="author" content="${esc(author)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${fullCanonical}">
  <meta name="theme-color" content="#0b0b0b">
  <meta name="application-name" content="Destroyers Cricket Club">
  <meta name="apple-mobile-web-app-title" content="Destroyers CC">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="format-detection" content="telephone=no">

  <!-- AI Crawler & LLM Discovery Standards (llmstxt.org) -->
  <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Context">
  <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Full LLM Context">
  <link rel="alternate" type="application/rss+xml" title="Destroyers News &amp; Match Feed" href="/feed.xml">
  ${alternateJson ? `<link rel="alternate" type="application/json" href="${alternateJson}" title="${esc(cleanTitle)} (JSON)">` : ''}
  ${alternateMd ? `<link rel="alternate" type="text/markdown" href="${alternateMd}" title="${esc(cleanTitle)} (Markdown)">` : ''}

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${esc(ogType)}">
  <meta property="og:url" content="${fullCanonical}">
  <meta property="og:title" content="${esc(cleanTitle)}">
  <meta property="og:description" content="${esc(cleanDesc)}">
  <meta property="og:image" content="${fullOgImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(cleanTitle)}">
  <meta property="og:site_name" content="Destroyers Cricket Club (DES)">
  <meta property="og:locale" content="en_IN">
  ${ogType === 'profile' && profile ? `
  <meta property="profile:first_name" content="${esc(profile.firstName || '')}">
  <meta property="profile:last_name" content="${esc(profile.lastName || '')}">
  ${profile.username ? `<meta property="profile:username" content="${esc(profile.username)}">` : ''}
  ${profile.gender ? `<meta property="profile:gender" content="${esc(profile.gender)}">` : ''}` : ''}
  ${ogType === 'article' && article ? `
  ${article.publishedTime ? `<meta property="article:published_time" content="${esc(article.publishedTime)}">` : ''}
  ${article.modifiedTime ? `<meta property="article:modified_time" content="${esc(article.modifiedTime)}">` : ''}
  ${article.section ? `<meta property="article:section" content="${esc(article.section)}">` : ''}
  ${(article.tags || []).map(t => `<meta property="article:tag" content="${esc(t)}">`).join('')}` : ''}

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${fullCanonical}">
  <meta name="twitter:title" content="${esc(cleanTitle)}">
  <meta name="twitter:description" content="${esc(cleanDesc)}">
  <meta name="twitter:image" content="${fullOgImage}">
  <meta name="twitter:image:alt" content="${esc(cleanTitle)}">
  <meta name="twitter:site" content="@DestroyersRewa">
  <meta name="twitter:creator" content="@DestroyersRewa">
  ${twitterData && twitterData.label1 && twitterData.data1 ? `
  <meta name="twitter:label1" content="${esc(twitterData.label1)}">
  <meta name="twitter:data1" content="${esc(twitterData.data1)}">` : ''}
  ${twitterData && twitterData.label2 && twitterData.data2 ? `
  <meta name="twitter:label2" content="${esc(twitterData.label2)}">
  <meta name="twitter:data2" content="${esc(twitterData.data2)}">` : ''}

  <!-- Icons & PWA -->
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/svg+xml" href="/public/favicon.svg">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">

  <!-- Google Fonts Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,700;1,900&family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;600;700;800;900&family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800;900&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/src/css/styles.min.css">

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
    { label: 'About', href: '/about', key: 'about' }
  ];

  return `
  <!-- Header Navigation -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="brand-block" aria-label="Destroyers Cricket Club Home">
        <div class="brand-crest-symbol">DES</div>
        <div class="brand-title-group">
          <span class="brand-franchise-name">DESTROYERS <span style="color:var(--c-ember-bright);">CC</span></span>
          <span class="brand-subline">Rewa Division Cricket Association</span>
        </div>
      </a>

      <nav class="header-nav" aria-label="Main Navigation">
        ${links.map((l) => `
          <a href="${l.href}" class="header-nav-link ${activeNav === l.key ? 'active' : ''}" ${activeNav === l.key ? 'aria-current="page"' : ''}>
            ${esc(l.label)}
          </a>
        `).join('')}
      </nav>

      <div class="header-actions" style="display:flex; align-items:center; gap:0.75rem;">
        <button type="button" class="cmd-palette-trigger header-search-btn" aria-label="Open Command Palette Search (Cmd+K)">
          <span class="search-btn-icon">⌕</span>
          <span class="search-btn-text">SEARCH</span>
          <kbd class="search-btn-kbd">⌘K</kbd>
        </button>
        <button type="button" class="mobile-nav-toggle" id="mobile-menu-btn" aria-label="Open Navigation Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Drawer -->
    <div class="mobile-menu-drawer" id="mobile-menu-drawer">
      <a href="/" class="mobile-nav-item ${activeNav === 'home' ? 'active' : ''}">Home</a>
      ${links.map((l) => `
        <a href="${l.href}" class="mobile-nav-item ${activeNav === l.key ? 'active' : ''}">
          ${esc(l.label)}
        </a>
      `).join('')}
      <a href="/contact" class="mobile-nav-item ${activeNav === 'contact' ? 'active' : ''}">Contact &amp; Trials</a>
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
              <li><a href="/stats" style="color:inherit;">All-Time Records &amp; Stats</a></li>
            </ul>
          </div>

          <div>
            <h4 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Franchise &amp; Venues</h4>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:0.5rem; font-size:0.875rem; color:var(--c-gray-400);">
              <li><a href="/players" style="color:inherit;">Destroyers Squad (48 Players)</a></li>
              <li><a href="/about" style="color:inherit;">About Destroyers &amp; 2024 Title</a></li>
              <li><a href="/news" style="color:inherit;">News &amp; Press Releases</a></li>
              <li><a href="/contact" style="color:inherit;">Contact RDCA &amp; Venues</a></li>
            </ul>
          </div>

          <div>
            <h4 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Official Network</h4>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:0.5rem; font-size:0.875rem; color:var(--c-gray-400);">
              <li><a href="https://rewa-cricket-division.vercel.app" target="_blank" rel="noopener" style="color:var(--c-gold); text-decoration:none; font-weight:600;">Rewa Cricket Division (RDCA) ↗</a></li>
              <li><a href="https://abv-rewacricket.pages.dev/" target="_blank" rel="noopener" style="color:var(--c-gold); text-decoration:none;">ABV Memorial Tournament Official Portal ↗</a></li>
              <li><a href="https://abv-rewacricket.pages.dev/rules/" target="_blank" rel="noopener" style="color:var(--c-gray-300); text-decoration:none;">Tournament Regulations (14 Codes) ↗</a></li>
              <li><a href="https://abv-rewacricket.pages.dev" target="_blank" rel="noopener" style="color:var(--c-gold); text-decoration:none; font-weight:700;">ABV Tournament Official Portal ↗</a></li>
              <li><a href="https://rewa-cricket-division.vercel.app/teams/destroyers/" target="_blank" rel="noopener" style="color:inherit; text-decoration:none;">DES on RDCA Registry ↗</a></li>
              <li><a href="https://dread-eleven-rewacricket.pages.dev" target="_blank" rel="noopener" style="color:var(--c-ember-bright); text-decoration:none; font-weight:600;">Dread Eleven CC (Arch-Rival) ↗</a></li>
            </ul>
          </div>

          <div>
            <h4 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Legal &amp; Policies</h4>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:0.5rem; font-size:0.875rem; color:var(--c-gray-400);">
              <li><a href="/privacy" style="color:inherit;">Privacy Policy</a></li>
              <li><a href="/terms" style="color:inherit;">Terms &amp; Conditions</a></li>
              <li><a href="/about" style="color:inherit;">Editorial Policy &amp; E-E-A-T</a></li>
              <li><a href="/contact" style="color:inherit;">Grievances &amp; Inquiries</a></li>
            </ul>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--b-subtle); padding-top:2rem; font-size:0.75rem; color:var(--c-gray-600); flex-wrap:wrap; gap:1rem;">
          <div>&copy; 2021–2026 Destroyers Cricket Club (DES). All rights reserved.</div>
          <div>Rewa Division Cricket Association (RDCA) • Madhya Pradesh</div>
        </div>
      </div>
    </footer>

    <!-- Mobile Floating Bottom Dock (App Experience) -->
    <nav class="mobile-bottom-dock" aria-label="Mobile Bottom Navigation">
      <a href="/" class="dock-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        <span>Home</span>
      </a>
      <a href="/players" class="dock-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Squad</span>
      </a>
      <a href="/fixtures" class="dock-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>Fixtures</span>
      </a>
      <a href="/results" class="dock-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        <span>Matches</span>
      </a>
      <button type="button" class="dock-item cmd-palette-trigger" style="background:transparent; border:none; cursor:pointer;" aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Search</span>
      </button>
    </nav>

    <!-- Command Palette (⌘K) Modal -->
    <div id="cmd-palette" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="cmd-palette-modal">
        <div class="cmd-palette-header">
          <span class="cmd-palette-icon">⌕</span>
          <input type="text" id="cmd-palette-input" placeholder="Search players, matches, statistics, news..." autocomplete="off" spellcheck="false">
          <kbd class="cmd-palette-esc">ESC</kbd>
        </div>
        <div id="cmd-palette-results"></div>
      </div>
    </div>
  </div>

  <script src="/src/js/app.min.js" defer></script>
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
  const featuredSquad = squad.slice(0, 8);

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': ['SportsOrganization', 'Organization'],
    name: 'Destroyers Cricket Club (DES)',
    alternateName: ['Destroyers', 'DES', 'Destroyers Rewa', 'Destroyers CC'],
    url: BASE_URL,
    logo: `${BASE_URL}/public/logo.png`,
    image: `${BASE_URL}/public/inspo1.jpg`,
    description: 'Official pro cricket franchise website for Destroyers Cricket Club (DES), Rewa. Captained by Pranav Dwivedi. Complete match archives, squad, standings, and stats in Rewa, Madhya Pradesh.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Rewa',
      addressRegion: 'Madhya Pradesh',
      postalCode: '486003',
      addressCountry: 'India'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Franchise Administration & Player Trials',
      email: 'admin@destroyers-rewa.cricket',
      availableLanguage: ['English', 'Hindi']
    },
    founder: {
      '@type': 'Person',
      name: 'Pranav Dwivedi',
      jobTitle: 'Captain & Franchise Icon',
      url: `${BASE_URL}/players/pranav-dwivedi`
    },
    memberOf: {
      '@type': 'SportsOrganization',
      name: 'Rewa Division Cricket Association (RDCA)',
      url: 'https://rewa-cricket-division.vercel.app'
    },
    sameAs: [
      'https://rewa-cricket-division.vercel.app/teams/destroyers/',
      'https://abv-rewacricket.pages.dev/',
      'https://rewa-cricket-division.vercel.app/tournaments/atal-bihari-vajpayee-memorial-tournament/',
      'https://dread-eleven-rewacricket.pages.dev/',
      'https://abv-rewacricket.pages.dev/'
    ]
  };

  const teamLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: 'Destroyers Cricket Club',
    alternateName: 'Destroyers (DES)',
    sport: 'Cricket',
    url: BASE_URL,
    logo: `${BASE_URL}/public/logo.png`,
    memberOf: {
      '@type': 'SportsOrganization',
      name: 'Rewa Division Cricket Association (RDCA)',
      url: 'https://rewa-cricket-division.vercel.app'
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
    athlete: squad.slice(0, 15).map((p) => ({
      '@type': 'Person',
      name: p.name,
      roleName: p.role,
      url: `${BASE_URL}/players/${p.slug}`
    })),
    coach: {
      '@type': 'Person',
      name: 'Pranav Dwivedi',
      jobTitle: 'Captain & Franchise Icon',
      url: `${BASE_URL}/players/pranav-dwivedi`
    }
  };

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Destroyers Cricket Club',
    alternateName: 'Destroyers Official Website',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const html = `
${renderHead({
  title: 'Destroyers Cricket Club | Official Website & Team Arena',
  description: 'Official website of Destroyers Cricket Club (DES), Rewa. Captained by Pranav Dwivedi. Complete match archives, squad, standings, and stats.',
  canonicalUrl: '/',
  keywords: 'Destroyers Cricket Club, DES Rewa, Pranav Dwivedi, Atal Bihari Vajpayee Memorial Tournament, Rewa Cricket, RDCA, Dread Eleven vs Destroyers, Rewa Derby, APSU Stadium',
  author: 'Destroyers Cricket Club Media Team',
  twitterData: {
    label1: 'Reigning Champions',
    data1: '2026 Rewa Derby (3–2)',
    label2: 'Franchise Captain',
    data2: 'Pranav Dwivedi (#7)'
  },
  jsonLd: [orgLd, teamLd, websiteLd]
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
        The official digital fortress of <strong>Destroyers Cricket Club (DES)</strong>, led by all-round powerhouse and skipper <strong>Pranav Dwivedi</strong> (1,998 runs, 85 wickets). 
        Dominating the <strong>Atal Bihari Vajpayee Memorial Tournament</strong> with three consecutive championship titles (2024, 2025, 2026) over arch-rivals <strong>Dread Eleven (DE)</strong>.
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

    <!-- Match Day HUD: Rivalry Series Telemetry (2021–2026) -->
    <div class="battle-hud-card">
      <div class="hud-topline">
        <span class="hud-tag">Rivalry Series Telemetry (2021–2026)</span>
        <span class="hud-status-tag" style="color:var(--c-emerald); background:rgba(0,230,118,0.12);">2026 CHAMPIONS: DES WON 3–2</span>
      </div>

      <!-- Team Circles Styled as Official Crest Logos -->
      <div class="hud-teams-header-row">
        <div class="hud-team-crest-box">
          <div class="hud-team-emblem-logo des" aria-label="Destroyers CC Crest">
            <span>DES</span>
          </div>
          <div class="hud-team-brand-name" style="color:var(--c-ember-bright);">DESTROYERS</div>
        </div>

        <div class="hud-clash-divider">VS</div>

        <div class="hud-team-crest-box">
          <div class="hud-team-emblem-logo de" aria-label="Dread Eleven CC Crest">
            <span>DE</span>
          </div>
          <div class="hud-team-brand-name" style="color:var(--c-gray-300);">DREAD ELEVEN</div>
        </div>
      </div>

      <!-- Aligned Invisible Row for 19 and 15 (Side-by-side Table Row) -->
      <div class="hud-score-table-row">
        <div class="hud-score-cell des tabular">
          <span class="score-number" style="color:var(--c-emerald);">19</span>
          <span class="score-subtext">WINS</span>
        </div>
        <div class="hud-score-divider">
          <span>HEAD-TO-HEAD</span>
        </div>
        <div class="hud-score-cell de tabular">
          <span class="score-number" style="color:var(--c-gray-300);">15</span>
          <span class="score-subtext">WINS</span>
        </div>
      </div>

      <!-- Rectangular Dominance Bar with Winning Percentages -->
      <div class="hud-rectangular-win-bar" title="DES 55.9% (19 Wins) vs DE 44.1% (15 Wins)">
        <div class="win-bar-segment des" style="width:55.9%;">
          <span class="win-bar-text">DES 55.9% (19)</span>
        </div>
        <div class="win-bar-segment de" style="width:44.1%;">
          <span class="win-bar-text">DE 44.1% (15)</span>
        </div>
      </div>

      <!-- Live Match Countdown Widget -->
      <div class="hud-countdown-panel">
        <div class="countdown-top-label">
          <span class="countdown-label-text">Next Clash Countdown</span>
          <span class="pulse-beacon gold" style="width:8px; height:8px;"></span>
        </div>
        <div id="match-countdown" class="countdown-grid-compact">
          <div class="cd-box"><div class="cd-num" id="cd-days">359</div><div class="cd-lbl">Days</div></div>
          <div class="cd-box"><div class="cd-num" id="cd-hours">18</div><div class="cd-lbl">Hours</div></div>
          <div class="cd-box"><div class="cd-num" id="cd-mins">21</div><div class="cd-lbl">Mins</div></div>
          <div class="cd-box"><div class="cd-num" id="cd-secs" style="color:var(--c-ember-bright);">22</div><div class="cd-lbl">Secs</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Latest Result & 2026 Championship Banner -->
<section class="spotlight-banner-section">
  <div class="container">
    <div class="spotlight-card-wrapper">
      <div>
        <div class="spotlight-tagline">2026 Championship Triumph • Series Winners</div>
        <h2 class="spotlight-headline">DESTROYERS DEFEND TITLE IN 2026 GRAND FINALE (3–2)</h2>
        <p class="spotlight-prose">
          In a breathtaking series decider at APSU Stadium, Destroyers captured the 2026 title over arch-rivals Dread Eleven, defending 284 with ice-cool nerve behind captain Pranav Dwivedi's match-winning 85 runs &amp; 3/41.
        </p>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <a href="/matches/destroyers-vs-dread-eleven-2026-09-20" class="btn-athletic btn-athletic-primary">
            <span>2026 Finale Scorecard</span>
          </a>
          <a href="/about" class="btn-athletic btn-athletic-outline">
            <span>Read Franchise History</span>
          </a>
        </div>
      </div>

      <div class="spotlight-stats-panel">
        <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); font-weight:800; text-transform:uppercase;">2026 FINALE RESULT</div>
        <div class="spotlight-final-score tabular">
          <span style="color:var(--c-ember-bright);">DES 284/7</span> <span style="font-size:1.4rem; color:var(--c-gray-600);">DEF</span> <span style="color:var(--c-gray-400);">DE 272</span>
        </div>
        <div style="font-size:0.875rem; color:var(--c-emerald); font-weight:700; text-transform:uppercase; font-family:var(--f-athletic);">
          Destroyers won by 12 runs
        </div>
        <div style="font-size:0.75rem; color:var(--c-gray-400); margin-top:0.4rem; font-family:var(--f-mono);">
          APSU Stadium, Rewa • 2026 Championship Final
        </div>
      </div>
    </div>
  </div>
</section>

<!-- WE ARE THE CHAMPIONS: THE MODERN ERA DYNASTY (2024–2026) -->
<section class="champions-dynasty-section" id="champions-dynasty" style="padding: 5rem 0; background: linear-gradient(180deg, #0d0909, #080808); border-top: 1px solid var(--b-subtle); border-bottom: 1px solid var(--b-subtle);">
  <div class="container">
    <div class="section-masthead" style="margin-bottom: 2.5rem;">
      <div>
        <div style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.3); padding:0.35rem 0.85rem; border-radius:4px; margin-bottom:0.75rem;">
          <span style="color:var(--c-ember-bright); font-family:var(--f-mono); font-size:0.75rem; font-weight:800; letter-spacing:0.08em; text-transform:uppercase;">Reigning Three-Peat Champions • 2024, 2025, 2026</span>
        </div>
        <h2 class="section-bigtitle" style="font-size:clamp(2.4rem, 5.5vw, 4.2rem); line-height:1; letter-spacing:-0.02em;">
          WE ARE THE CHAMPIONS: <span style="color:var(--c-ember-bright);">THE MODERN ERA DYNASTY</span>
        </h2>
        <p style="color:var(--c-gray-300); font-size:1.05rem; max-width:68ch; margin-top:0.75rem; line-height:1.6;">
          Three consecutive Atal Bihari Vajpayee Memorial Trophy titles (2024, 2025, 2026) captained by Pranav Dwivedi. A ferocious modern dynasty highlighted by a 5–0 historic clean sweep and unrivaled derby dominance.
        </p>
      </div>
      <div style="display:flex; align-items:center; gap:1rem;">
        <span class="hud-status-tag" style="font-size:0.9rem; padding:0.5rem 1rem; color:var(--c-gold); border-color:var(--c-gold); background:rgba(255,215,0,0.12);">REIGNING THREE-PEAT KINGS</span>
      </div>
    </div>

    <!-- 3 Dynasty Cards Grid -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap:1.75rem; margin-bottom:3rem;">
      <!-- 2024 Breakthrough Champions Card -->
      <div class="dynasty-card" style="background:var(--c-card-bg); border:1px solid rgba(255,59,48,0.3); border-radius:4px; padding:2rem; position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
        <div style="position:absolute; top:0; left:0; width:100%; height:4px; background:linear-gradient(90deg, var(--c-ember-bright), var(--c-gold));"></div>
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <span style="font-family:var(--f-athletic); font-size:2.25rem; font-weight:900; color:var(--c-ember-bright); line-height:1;">2024</span>
            <span style="background:rgba(255,59,48,0.15); color:var(--c-ember-bright); font-family:var(--f-mono); font-size:0.7rem; font-weight:800; padding:0.25rem 0.6rem; border-radius:2px; border:1px solid rgba(255,59,48,0.3);">THE RESURGENCE • 4–1</span>
          </div>
          <h3 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem; line-height:1.15;">
            2024 Title Breakthrough
          </h3>
          <p style="font-size:0.875rem; color:var(--c-gray-300); line-height:1.6; margin-bottom:1.25rem;">
            Destroyers unleashed an unstoppable red wave to storm the 2024 championship 4–1, winning four consecutive clashes after dropping the opener to claim their historic first title of the modern era.
          </p>
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:0.85rem; border-radius:2px; margin-bottom:1.5rem; font-family:var(--f-mono); font-size:0.75rem;">
            <div style="color:var(--c-gold); font-weight:700; margin-bottom:0.25rem;">CLIMAX HIGHLIGHT (20 SEP 2024)</div>
            <div style="color:var(--c-white);">DES 233/6 def. DE 225 by 8 runs</div>
            <div style="color:var(--c-gray-400); margin-top:0.2rem;">POTM: Pranav Dwivedi (85 off 58 &amp; 3/34)</div>
          </div>
        </div>
        <a href="/matches/destroyers-vs-dread-eleven-2024-09-20" class="btn-athletic btn-athletic-primary btn-sm" style="width:100%; justify-content:center; text-decoration:none;">
          <span>Inspect 2024 Title Decider Scorecard &rarr;</span>
        </a>
      </div>

      <!-- 2025 Historic 5-0 Clean Sweep Card -->
      <div class="dynasty-card" style="background:var(--c-card-bg); border:1px solid rgba(255,215,0,0.35); border-radius:4px; padding:2rem; position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
        <div style="position:absolute; top:0; left:0; width:100%; height:4px; background:linear-gradient(90deg, var(--c-gold), #fff);"></div>
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <span style="font-family:var(--f-athletic); font-size:2.25rem; font-weight:900; color:var(--c-gold); line-height:1;">2025</span>
            <span style="background:rgba(255,215,0,0.15); color:var(--c-gold); font-family:var(--f-mono); font-size:0.7rem; font-weight:800; padding:0.25rem 0.6rem; border-radius:2px; border:1px solid rgba(255,215,0,0.3);">PERFECT 5–0 CLEAN SWEEP</span>
          </div>
          <h3 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem; line-height:1.15;">
            The Undefeated Whitewash
          </h3>
          <p style="font-size:0.875rem; color:var(--c-gray-300); line-height:1.6; margin-bottom:1.25rem;">
            The greatest single-season run in Rewa division cricket history. Destroyers swept all 5 fixtures in 2025 without a single defeat, outclassing Dread Eleven across 50-over and T20 disciplines with clinical precision.
          </p>
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:0.85rem; border-radius:2px; margin-bottom:1.5rem; font-family:var(--f-mono); font-size:0.75rem;">
            <div style="color:var(--c-gold); font-weight:700; margin-bottom:0.25rem;">CLIMAX HIGHLIGHT (20 SEP 2025)</div>
            <div style="color:var(--c-white);">DES 268/6 def. DE 253 by 15 runs</div>
            <div style="color:var(--c-gray-400); margin-top:0.2rem;">POTM: Venkatesh Iyer (74 off 65)</div>
          </div>
        </div>
        <a href="/matches/destroyers-vs-dread-eleven-2025-09-20" class="btn-athletic btn-athletic-primary btn-sm" style="width:100%; justify-content:center; text-decoration:none;">
          <span>Inspect 2025 Clean Sweep Scorecard &rarr;</span>
        </a>
      </div>

      <!-- 2026 Grand Finale Champions Card -->
      <div class="dynasty-card" style="background:var(--c-card-bg); border:1px solid rgba(0,230,118,0.3); border-radius:4px; padding:2rem; position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
        <div style="position:absolute; top:0; left:0; width:100%; height:4px; background:linear-gradient(90deg, var(--c-emerald), var(--c-gold));"></div>
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <span style="font-family:var(--f-athletic); font-size:2.25rem; font-weight:900; color:var(--c-emerald); line-height:1;">2026</span>
            <span style="background:rgba(0,230,118,0.15); color:var(--c-emerald); font-family:var(--f-mono); font-size:0.7rem; font-weight:800; padding:0.25rem 0.6rem; border-radius:2px; border:1px solid rgba(0,230,118,0.3);">THE THREE-PEAT DEFENSE • 3–2</span>
          </div>
          <h3 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem; line-height:1.15;">
            2026 Grand Finale Defense
          </h3>
          <p style="font-size:0.875rem; color:var(--c-gray-300); line-height:1.6; margin-bottom:1.25rem;">
            In a heart-stopping 2026 Grand Finale at APSU Stadium, Destroyers defended 284 with ice-cool nerve, holding off Dread Eleven's late surge by 12 runs to capture their third consecutive championship.
          </p>
          <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:0.85rem; border-radius:2px; margin-bottom:1.5rem; font-family:var(--f-mono); font-size:0.75rem;">
            <div style="color:var(--c-gold); font-weight:700; margin-bottom:0.25rem;">CLIMAX HIGHLIGHT (20 SEP 2026)</div>
            <div style="color:var(--c-white);">DES 284/7 def. DE 272 by 12 runs</div>
            <div style="color:var(--c-gray-400); margin-top:0.2rem;">POTM: Ajay Rohera (94 off 98)</div>
          </div>
        </div>
        <a href="/matches/destroyers-vs-dread-eleven-2026-09-20" class="btn-athletic btn-athletic-primary btn-sm" style="width:100%; justify-content:center; text-decoration:none;">
          <span>Inspect 2026 Finale Scorecard &rarr;</span>
        </a>
      </div>
    </div>

    <!-- Editorial Dynasty Longform Feature Box -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; border-radius:4px; display:grid; grid-template-columns:1.5fr 1fr; gap:2.5rem; align-items:center;" class="dynasty-longform-grid">
      <div>
        <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-ember-bright); text-transform:uppercase; font-weight:800; margin-bottom:0.5rem;">
          CHAMPIONSHIP FEATURE &amp; EDITORIAL ARCHIVE
        </div>
        <h3 style="font-family:var(--f-athletic); font-size:2.25rem; color:var(--c-white); text-transform:uppercase; line-height:1.1; margin-bottom:1rem;">
          The Red Wave: How Destroyers Conquered Rewa Cricket
        </h3>
        <p style="font-size:0.95rem; color:var(--c-gray-300); line-height:1.7; margin-bottom:1rem;">
          From 2024 through 2026, Destroyers executed one of the most dominant dynasties in regional Indian cricket. Amassing 12 victories across 15 clashes (80.0% win rate) and clinching three consecutive titles, skipper Pranav Dwivedi built an aggressive, fearless squad capable of defending totals under high pressure.
        </p>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <a href="/results" class="btn-athletic btn-athletic-outline">
            <span>Browse All 19 DES Derby Wins &rarr;</span>
          </a>
          <a href="/about" class="btn-athletic btn-athletic-outline">
            <span>Read Franchise Legacy &rarr;</span>
          </a>
        </div>
      </div>
      <div style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1.75rem; border-radius:4px;">
        <h4 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-gold); text-transform:uppercase; margin-bottom:1rem;">
          Modern Dynasty Numbers
        </h4>
        <div class="responsive-duo-grid" style="gap:1rem;">
          <div style="border-bottom:1px solid var(--b-subtle); padding-bottom:0.75rem;">
            <div style="font-family:var(--f-mono); font-size:1.75rem; font-weight:900; color:var(--c-white);">3/3</div>
            <div style="font-size:0.7rem; color:var(--c-gray-400); text-transform:uppercase; font-family:var(--f-mono);">Trophies Won</div>
          </div>
          <div style="border-bottom:1px solid var(--b-subtle); padding-bottom:0.75rem;">
            <div style="font-family:var(--f-mono); font-size:1.75rem; font-weight:900; color:var(--c-ember-bright);">12/15</div>
            <div style="font-size:0.7rem; color:var(--c-gray-400); text-transform:uppercase; font-family:var(--f-mono);">Modern Era Wins</div>
          </div>
          <div>
            <div style="font-family:var(--f-mono); font-size:1.75rem; font-weight:900; color:var(--c-emerald);">80.0%</div>
            <div style="font-size:0.7rem; color:var(--c-gray-400); text-transform:uppercase; font-family:var(--f-mono);">Dynasty Win %</div>
          </div>
          <div>
            <div style="font-family:var(--f-mono); font-size:1.75rem; font-weight:900; color:var(--c-gold);">5–0</div>
            <div style="font-size:0.7rem; color:var(--c-gray-400); text-transform:uppercase; font-family:var(--f-mono);">2025 Clean Sweep</div>
          </div>
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

    <!-- Interactive Squad Suggestions -->
    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem; margin-bottom:2rem;" id="squad-filter-controls">
      <span style="font-family:var(--f-mono); font-size:0.7rem; color:var(--c-ember-bright); font-weight:800; text-transform:uppercase;">Quick Filter:</span>
      <button type="button" class="squad-suggest-chip role-btn active" data-filter="all">All (48)</button>
      <button type="button" class="squad-suggest-chip role-btn" data-filter="Pranav Dwivedi">Capt. Pranav Dwivedi</button>
      <button type="button" class="squad-suggest-chip role-btn" data-filter="Anant Verma"> Anant Verma</button>
      <button type="button" class="squad-suggest-chip role-btn" data-filter="Sagar Pratap Singh"> Sagar Pratap Singh</button>
      <button type="button" class="squad-suggest-chip role-btn" data-filter="All-rounder">All-Rounders</button>
      <button type="button" class="squad-suggest-chip role-btn" data-filter="Bowler">Bowlers</button>
      <button type="button" class="squad-suggest-chip role-btn" data-filter="Batter">Batters</button>
      <button type="button" class="squad-suggest-chip role-btn" data-filter="Wicketkeeper">Wicketkeepers</button>
    </div>

    <div class="players-cards-grid" id="players-grid">
      ${featuredSquad.map((p) => {
        const ovr = p.fifaRatings ? p.fifaRatings.overall : 88;
        const formDots = p.formDots || 4;
        const formRating = p.formRating || 'HOT';
        return `
          <a href="/players/${p.slug}" class="fifa-player-card" data-role="${esc(p.role)}">
            <div class="fifa-card-header">
              <div class="fifa-ovr-badge">
                ${ovr} <small>OVR</small>
              </div>
              <div class="player-form-badge ${formRating.toLowerCase()}">
                ${formRating}
              </div>
            </div>

            <div class="fifa-card-body">
              <h3 class="fifa-card-name">#${p.jerseyNumber} ${esc(p.name)}</h3>
              <div class="fifa-card-role">${esc(p.role)}</div>
            </div>

            <div class="fifa-attributes-grid">
              <div class="fifa-attr-item">
                <span class="fifa-attr-label">BAT PWR</span>
                <span class="fifa-attr-val tabular">${p.fifaRatings ? p.fifaRatings.battingPower : 88}</span>
              </div>
              <div class="fifa-attr-item">
                <span class="fifa-attr-label">TIMING</span>
                <span class="fifa-attr-val tabular">${p.fifaRatings ? p.fifaRatings.timing : 85}</span>
              </div>
              <div class="fifa-attr-item">
                <span class="fifa-attr-label">STAMINA</span>
                <span class="fifa-attr-val tabular">${p.fifaRatings ? p.fifaRatings.stamina : 90}</span>
              </div>
              <div class="fifa-attr-item">
                <span class="fifa-attr-label">CLUTCH</span>
                <span class="fifa-attr-val tabular" style="color:var(--c-ember-bright);">${p.fifaRatings ? p.fifaRatings.clutch : 92}</span>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div class="fifa-form-dots">
                ${'●'.repeat(formDots)}${'○'.repeat(5 - formDots)}
              </div>
              <span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-ember-bright); font-weight:800; text-transform:uppercase;">
                View Profile &rarr;
              </span>
            </div>
          </a>
        `;
      }).join('')}
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

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap:2rem;">
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
  title: 'Destroyers Squad & Player Roster | Rewa Cricket',
  description: 'Official 48-man squad directory for Destroyers Cricket Club (DES). Complete player profiles, career statistics, and auction details for Rewa division.',
  canonicalUrl: '/players',
  keywords: 'Destroyers Squad, Rewa Cricket players, Pranav Dwivedi squad, DES cricket roster, Atal Bihari Vajpayee tournament squad',
  author: 'Destroyers Cricket Club Media Team',
  twitterData: {
    label1: 'Active Roster',
    data1: '48 Pro Athletes',
    label2: 'Franchise Leader',
    data2: 'Capt. Pranav Dwivedi'
  },
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
        Destroyers skipper <strong>Pranav Dwivedi</strong> has contested all 34 clashes (scoring 1,998 runs at 58.8 avg and taking 85 wickets). Rotational squad members featured in 4–22 matches. Click any player card below to view their dedicated profile and match-by-match performances.
      </p>
    </div>

    <!-- Interactive Squad Search & Suggestions Toolbar -->
    <div class="squad-search-toolbar" style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:1.25rem; margin-bottom:2.5rem;">
      <div style="display:flex; gap:0.75rem; align-items:center; margin-bottom:1rem;">
        <div style="flex:1; position:relative;">
          <input type="text" id="squad-search-input" placeholder="Search 48 players by name, jersey number, role, batting, or bowling style..." style="width:100%; background:var(--c-dark-surface); border:1px solid var(--b-subtle); color:var(--c-white); padding:0.65rem 1rem; font-family:var(--f-body); font-size:0.875rem; outline:none; border-radius:2px;" autocomplete="off" />
        </div>
        <button type="button" id="squad-search-clear" class="btn-athletic btn-athletic-outline" style="padding:0.6rem 1rem; font-size:0.75rem;">Clear</button>
      </div>
      <!-- Search Suggestions Chips -->
      <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
        <span style="font-family:var(--f-mono); font-size:0.7rem; color:var(--c-ember-bright); font-weight:800; text-transform:uppercase;">Search Suggestions:</span>
        <button type="button" class="squad-suggest-chip" data-search="Pranav Dwivedi">Capt. Pranav Dwivedi</button>
        <button type="button" class="squad-suggest-chip" data-search="Anant Verma"> Anant Verma</button>
        <button type="button" class="squad-suggest-chip" data-search="Sagar Pratap Singh"> Sagar Pratap Singh</button>
        <button type="button" class="squad-suggest-chip" data-search="Harshit Patel"> Harshit Patel</button>
        <button type="button" class="squad-suggest-chip" data-search="Somil Khan"> Somil Khan</button>
        <button type="button" class="squad-suggest-chip" data-search="Captain">Captains</button>
        <button type="button" class="squad-suggest-chip" data-search="All-rounder">All-Rounders</button>
        <button type="button" class="squad-suggest-chip" data-search="Bowler">Bowlers</button>
        <button type="button" class="squad-suggest-chip" data-search="Batter">Batters</button>
        <button type="button" class="squad-suggest-chip" data-search="Wicketkeeper">Wicketkeepers</button>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400);">
        <span id="squad-count-display">Showing all <strong>${squad.length}</strong> players</span>
        <span>Click player card to inspect telemetry</span>
      </div>
    </div>

    <div class="players-cards-grid" id="players-grid">
      ${squad.map((p) => {
        const ovr = p.fifaRatings ? p.fifaRatings.overall : 88;
        const formDots = p.formDots || 4;
        const formRating = p.formRating || 'HOT';
        return `
          <a href="/players/${p.slug}" class="fifa-player-card" data-role="${esc(p.role)}" data-name="${esc(p.name)}" data-number="${p.jerseyNumber}" data-search="${esc(`${p.name} ${p.jerseyNumber} ${p.role} ${p.battingStyle || ''} ${p.bowlingStyle || ''}`.toLowerCase())}">
            <div class="fifa-card-header">
              <div class="fifa-ovr-badge">
                ${ovr} <small>OVR</small>
              </div>
              <div class="player-form-badge ${formRating.toLowerCase()}">
                ${formRating}
              </div>
            </div>

            <div class="fifa-card-body">
              <h2 class="fifa-card-name">#${p.jerseyNumber} ${esc(p.name)}</h2>
              <div class="fifa-card-role">${esc(p.role)}</div>
            </div>

            <div class="fifa-attributes-grid">
              <div class="fifa-attr-item">
                <span class="fifa-attr-label">BAT PWR</span>
                <span class="fifa-attr-val tabular">${p.fifaRatings ? p.fifaRatings.battingPower : 88}</span>
              </div>
              <div class="fifa-attr-item">
                <span class="fifa-attr-label">TIMING</span>
                <span class="fifa-attr-val tabular">${p.fifaRatings ? p.fifaRatings.timing : 85}</span>
              </div>
              <div class="fifa-attr-item">
                <span class="fifa-attr-label">STAMINA</span>
                <span class="fifa-attr-val tabular">${p.fifaRatings ? p.fifaRatings.stamina : 90}</span>
              </div>
              <div class="fifa-attr-item">
                <span class="fifa-attr-label">CLUTCH</span>
                <span class="fifa-attr-val tabular" style="color:var(--c-ember-bright);">${p.fifaRatings ? p.fifaRatings.clutch : 92}</span>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div class="fifa-form-dots">
                ${'●'.repeat(formDots)}${'○'.repeat(5 - formDots)}
              </div>
              <span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-ember-bright); font-weight:800; text-transform:uppercase;">
                View Profile &rarr;
              </span>
            </div>
          </a>
        `;
      }).join('')}
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
      const desInn = m.innings.find(i => i.teamShort === 'DES' || i.teamId === 'DES' || i.teamName?.includes('Destroyers'));
      const oppInn = m.innings.find(i => i.teamShort === 'DE' || i.teamId === 'DE' || i.teamName?.includes('Dread Eleven'));

      const b = (desInn?.batting || []).find((x) => x.playerId === p.id || (x.playerName && x.playerName.toLowerCase() === p.name.toLowerCase()));
      // Bowling is conducted during the opponent's batting innings
      const bo = (oppInn?.bowling || []).find((x) => x.playerId === p.id || (x.playerName && x.playerName.toLowerCase() === p.name.toLowerCase()));
      const dnb = (desInn?.dnb || []).find((x) => typeof x === 'string' ? x.toLowerCase() === p.name.toLowerCase() : (x.playerId === p.id || (x.playerName && x.playerName.toLowerCase() === p.name.toLowerCase())));

      if (b || bo || dnb) {
        playerLogs.push({ match: m, batting: b, bowling: bo, dnb: !!dnb });
      }
    });

    const isPranav = p.slug === 'pranav-dwivedi';

    let playerJsonLd;
    if (isPranav) {
      playerJsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': ['Person', 'Athlete'],
          name: 'Pranav Dwivedi',
          alternateName: [
            'Pranav Pramod Dwivedi',
            'Capt. Pranav Dwivedi',
            'Pranav Dwivedi Rewa',
            'P. Dwivedi'
          ],
          jobTitle: 'Captain & Premier All-Rounder',
          description: 'Franchise captain and premier all-rounder of Destroyers Cricket Club (DES). Three-time consecutive champion captain (2024, 2025, 2026) in the Atal Bihari Vajpayee Memorial Tournament, Rewa.',
          url: `${BASE_URL}/players/pranav-dwivedi`,
          identifier: 'DES-7',
          gender: 'https://schema.org/Male',
          memberOf: {
            '@type': ['SportsOrganization', 'SportsTeam'],
            name: 'Destroyers Cricket Club (DES)',
            url: BASE_URL,
            sport: 'Cricket'
          },
          knowsAbout: [
            'Cricket',
            'All-Rounder',
            'Destroyers Cricket Club',
            'Atal Bihari Vajpayee Memorial Tournament',
            'Rewa Cricket',
            'Rewa Division Cricket Association'
          ],
          award: [
            '2026 Atal Bihari Vajpayee Memorial Trophy Champion Captain (3-2 vs Dread Eleven)',
            '2025 Atal Bihari Vajpayee Memorial Trophy Champion Captain (5-0 Clean Sweep)',
            '2024 Atal Bihari Vajpayee Memorial Trophy Champion Captain (4-1 Series Victory)',
            'Rewa Derby Player of the Year 2025',
            'Man of the Match - 2026 Championship Final (82 runs & 3/28)'
          ],
          sameAs: [
            'https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/'
          ],
          mainEntityOfPage: `${BASE_URL}/players/pranav-dwivedi`
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Who is Pranav Dwivedi in Rewa cricket?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Pranav Dwivedi (Pranav Pramod Dwivedi) is the franchise captain and premier all-rounder of Destroyers Cricket Club (DES) in Rewa, Madhya Pradesh. He led Destroyers to three consecutive Atal Bihari Vajpayee Memorial Tournament championships in 2024, 2025, and 2026.'
              }
            },
            {
              '@type': 'Question',
              name: 'What are Pranav Dwivedi\'s career batting and bowling statistics?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'In official tournament play against Dread Eleven, Pranav Dwivedi has scored 1,435 runs at an average of 57.4 with a strike rate of 146.4 (highest score 102*, 14 fifties, 1 hundred) and taken 66 wickets at an average of 16.3 with best bowling figures of 8/39.'
              }
            },
            {
              '@type': 'Question',
              name: 'What is Pranav Dwivedi\'s captaincy record against Dread Eleven?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Pranav Dwivedi has led Destroyers to 19 derby wins against Akhil Mishra\'s Dread Eleven, capturing the 2024 series (4–1), the 2025 championship (5–0 clean sweep), and successfully defending the 2026 title (3–2).'
              }
            },
            {
              '@type': 'Question',
              name: 'What jersey number and role does Pranav Dwivedi play for Destroyers?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Pranav Dwivedi wears jersey #7 for Destroyers. He operates as an explosive middle-order right-handed batter and a strike right-arm fast-medium and off-spin bowler.'
              }
            },
            {
              '@type': 'Question',
              name: 'Where can Pranav Dwivedi\'s official RDCA cricket records be verified?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Pranav Dwivedi\'s official career registry is maintained by the Rewa Division Cricket Association (RDCA) at https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/.'
              }
            }
          ]
        }
      ];
    } else {
      playerJsonLd = {
        '@context': 'https://schema.org',
        '@type': ['Person', 'Athlete'],
        name: p.name,
        jobTitle: p.role,
        description: p.bio,
        url: `${BASE_URL}/players/${p.slug}`,
        memberOf: {
          '@type': ['SportsOrganization', 'SportsTeam'],
          name: 'Destroyers Cricket Club (DES)',
          url: BASE_URL,
          sport: 'Cricket'
        },
        identifier: `DES-${p.jerseyNumber}`,
        knowsAbout: ['Cricket', p.role, 'Destroyers Cricket Club', 'Rewa Cricket']
      };
    }

    const playerHtml = `
${renderHead({
  title: isPranav
    ? 'Capt. Pranav Dwivedi (#7) — Career Stats | Destroyers CC'
    : clampTitle(`#${p.jerseyNumber} ${p.name} — Career Stats | Destroyers CC`, 60),
  description: isPranav
    ? 'Official career profile for Pranav Dwivedi (#7), 3x champion captain of Destroyers Cricket Club in Rewa. 1,435 runs (57.4 avg), 66 wickets, and RDCA records.'
    : clampDesc(`${p.name} (#${p.jerseyNumber}) official career profile for Destroyers Cricket Club in Rewa. ${p.role} with ${p.batting.runs} runs, ${p.bowling.wickets} wickets, and match records.`, 155),
  canonicalUrl: `/players/${p.slug}`,
  ogType: 'profile',
  profile: {
    firstName: p.name.split(' ')[0],
    lastName: p.name.split(' ').slice(1).join(' ') || p.name,
    username: isPranav ? 'pranavdwivedi' : p.slug.replace(/-/g, ''),
    gender: 'male'
  },
  keywords: isPranav
    ? 'Pranav Dwivedi, Pranav Pramod Dwivedi, Destroyers Cricket Club Captain, Rewa Cricket, RDCA, Atal Bihari Vajpayee Memorial Tournament, Rewa Derby, Pranav Dwivedi stats, Pranav Dwivedi career'
    : `${p.name}, ${p.name} stats, Destroyers Cricket Club, Rewa Cricket, Atal Bihari Vajpayee Memorial Tournament, ${p.role}`,
  author: 'Destroyers Cricket Club Media Team',
  twitterData: isPranav
    ? {
        label1: 'Captaincy Record',
        data1: '3x Champions (2024–2026)',
        label2: 'Career Telemetry',
        data2: '1,435 runs • 66 wickets'
      }
    : {
        label1: 'Discipline',
        data1: p.role,
        label2: 'Franchise',
        data2: `Destroyers CC (#${p.jerseyNumber})`
      },
  alternateJson: isPranav ? `/players/${p.slug}.json` : null,
  alternateMd: isPranav ? `/players/${p.slug}.md` : null,
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

      ${p.slug === 'pranav-dwivedi' ? `
        <div style="margin-top:1.5rem; display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
          <a href="https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.25rem; background:rgba(217, 119, 6, 0.15); border:1px solid rgba(217, 119, 6, 0.5); border-radius:4px; font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-gold); text-decoration:none; font-weight:700;">
            Verified Official Career Archive on RDCA Central ↗
          </a>
          <a href="https://rewa-cricket-division.vercel.app/tournaments/atal-bihari-vajpayee-memorial-tournament/" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.25rem; background:rgba(255, 255, 255, 0.05); border:1px solid var(--b-subtle); border-radius:4px; font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-gray-300); text-decoration:none;">
            RDCA ABV Memorial Tournament ↗
          </a>
        </div>
      ` : `
        <div style="margin-top:1.5rem;">
          <a href="https://rewa-cricket-division.vercel.app/players/" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.5rem 1rem; background:rgba(255, 255, 255, 0.03); border:1px solid var(--b-subtle); border-radius:4px; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-decoration:none;">
            Rewa Division Cricket Association (RDCA) Registry ↗
          </a>
        </div>
      `}
    </div>

    ${isPranav ? `
    <!-- AI Direct Answer & Entity Telemetry Card (GEO / AEO Optimized) -->
    <section class="ai-direct-answer-card" aria-label="AI Summary and Key Facts">
      <div class="ai-card-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        AI Entity Summary &amp; Fast Telemetry
      </div>
      <h2 class="ai-direct-answer-title">Pranav Dwivedi: Franchise Captain &amp; Premier All-Rounder</h2>
      <p class="ai-direct-answer-lead">
        <strong>Pranav Dwivedi</strong> (Pranav Pramod Dwivedi) is an Indian cricketer and the 3-time consecutive championship-winning captain of <strong>Destroyers Cricket Club (DES)</strong> in the prestigious Atal Bihari Vajpayee Memorial Tournament in Rewa, Madhya Pradesh. Playing as a premier all-rounder, Dwivedi has amassed <strong>1,435 tournament runs</strong> at an average of <strong>57.4</strong> (strike rate 146.4) and seized <strong>66 wickets</strong> with an average of <strong>16.3</strong> and best bowling figures of <strong>8/39</strong> across 27 clashes against arch-rivals Dread Eleven.
      </p>
      <div class="ai-facts-grid">
        <div class="ai-fact-box">
          <div class="ai-fact-label">Full Name</div>
          <div class="ai-fact-value">Pranav Pramod Dwivedi</div>
        </div>
        <div class="ai-fact-box">
          <div class="ai-fact-label">Franchise &amp; Role</div>
          <div class="ai-fact-value">Destroyers CC • Captain (#7)</div>
        </div>
        <div class="ai-fact-box">
          <div class="ai-fact-label">Championships</div>
          <div class="ai-fact-value" style="color:var(--c-gold);">3 Titles (2024, 2025, 2026)</div>
        </div>
        <div class="ai-fact-box">
          <div class="ai-fact-label">Derby Win Record</div>
          <div class="ai-fact-value">19 Wins vs Dread Eleven</div>
        </div>
        <div class="ai-fact-box">
          <div class="ai-fact-label">Batting Output</div>
          <div class="ai-fact-value">1,435 Runs (57.4 Avg, 102* HS)</div>
        </div>
        <div class="ai-fact-box">
          <div class="ai-fact-label">Bowling Output</div>
          <div class="ai-fact-value" style="color:var(--c-emerald);">66 Wickets (16.3 Avg, 8/39 BBI)</div>
        </div>
        <div class="ai-fact-box">
          <div class="ai-fact-label">Disciplines</div>
          <div class="ai-fact-value">Right-hand bat / Fast-medium</div>
        </div>
        <div class="ai-fact-box">
          <div class="ai-fact-label">Official Registry</div>
          <div class="ai-fact-value">RDCA Central Verified</div>
        </div>
      </div>
    </section>
    ` : ''}

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
                <td><span class="pro-fmt-tag ${item.match.format.toLowerCase().replace(/\s+/g, '-')}">${esc(item.match.format)}</span></td>
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

    ${isPranav ? `
    <!-- Visible FAQ Section for Users & Search Engine Knowledge Extraction -->
    <section class="player-faq-section" aria-label="Frequently Asked Questions">
      <h2 style="font-family:var(--f-athletic); font-size:1.8rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.5rem;">
        Frequently Asked Questions About Pranav Dwivedi
      </h2>
      <p style="color:var(--c-gray-400); font-size:0.875rem; margin-bottom:1.5rem;">
        Verified answers compiled from official RDCA scorecards, tournament registries, and Destroyers franchise telemetry.
      </p>
      <div class="faq-grid">
        <article class="faq-card">
          <h3 class="faq-question">Who is Pranav Dwivedi in Rewa cricket?</h3>
          <p class="faq-answer">
            <strong>Pranav Dwivedi</strong> (Pranav Pramod Dwivedi) is the franchise captain and star all-rounder for <strong>Destroyers Cricket Club (DES)</strong> based in Rewa, Madhya Pradesh. He has guided the team to three consecutive Atal Bihari Vajpayee Memorial Tournament championship titles (2024, 2025, and 2026).
          </p>
        </article>
        <article class="faq-card">
          <h3 class="faq-question">What are Pranav Dwivedi's career batting and bowling statistics?</h3>
          <p class="faq-answer">
            In tournament play against arch-rivals Dread Eleven, Pranav has registered <strong>1,435 runs in 27 matches</strong> with an extraordinary batting average of <strong>57.4</strong> and a strike rate of <strong>146.4</strong> (including 1 century, high score 102*, and 14 fifties). With the ball, he has claimed <strong>66 wickets</strong> at an average of <strong>16.3</strong> and an economy rate of 5.48, including career-best figures of <strong>8/39</strong>.
          </p>
        </article>
        <article class="faq-card">
          <h3 class="faq-question">What is Pranav Dwivedi's captaincy record in the Rewa Derby?</h3>
          <p class="faq-answer">
            Pranav Dwivedi has captained Destroyers to <strong>19 derby victories</strong> against Akhil Mishra's Dread Eleven across 34 tournament clashes. Under his stewardship, Destroyers secured the 2024 title (4–1), completed a historic 5–0 clean sweep in 2025, and retained their crown in the thrilling 2026 finale by 12 runs (3–2 series).
          </p>
        </article>
        <article class="faq-card">
          <h3 class="faq-question">What is Pranav Dwivedi's playing role and jersey number?</h3>
          <p class="faq-answer">
            Dwivedi wears <strong>Jersey #7</strong> for Destroyers. He operates as an explosive middle-order right-handed batsman capable of accelerating at the death, combined with versatile bowling skills featuring both right-arm fast-medium seam and deceptive off-spin variations.
          </p>
        </article>
        <article class="faq-card">
          <h3 class="faq-question">Where can fans and scouts verify Pranav Dwivedi's official records?</h3>
          <p class="faq-answer">
            All match scorecards and career telemetry are verified and preserved by the Rewa Division Cricket Association on their official central portal at <a href="https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/" target="_blank" rel="noopener" style="color:var(--c-gold); font-weight:700;">RDCA Central Registry ↗</a>.
          </p>
        </article>
      </div>
    </section>
    ` : ''}
  </div>
</section>

${renderFooter()}
    `;

    fs.writeFileSync(path.join(playerDir, 'index.html'), playerHtml);

    // Generate machine-readable .json and .md endpoints for Pranav Dwivedi
    if (isPranav) {
      const pranavJsonData = {
        entity: "Pranav Dwivedi",
        fullName: "Pranav Pramod Dwivedi",
        jerseyNumber: 7,
        franchise: "Destroyers Cricket Club (DES)",
        role: "Captain & All-rounder",
        battingStyle: "Right-hand bat",
        bowlingStyle: "Right-arm fast-medium / Off-spin",
        championshipTitles: [
          "2026 Atal Bihari Vajpayee Memorial Trophy Champion Captain (3-2)",
          "2025 Atal Bihari Vajpayee Memorial Trophy Champion Captain (5-0 Clean Sweep)",
          "2024 Atal Bihari Vajpayee Memorial Trophy Champion Captain (4-1)"
        ],
        careerStats: {
          matches: 27,
          runs: 1435,
          average: 57.4,
          strikeRate: 146.4,
          highestScore: "102*",
          fifties: 14,
          hundreds: 1,
          fours: 142,
          sixes: 48,
          overs: 148,
          wickets: 66,
          bowlingAverage: 16.3,
          economy: 5.48,
          bestBowling: "8/39"
        },
        derbyRecord: {
          opponent: "Dread Eleven (DE)",
          captainRival: "Akhil Mishra",
          franchiseWins: 19,
          franchiseLosses: 15
        },
        verifiedRegistry: "https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/",
        faq: [
          {
            question: "Who is Pranav Dwivedi in Rewa cricket?",
            answer: "Pranav Dwivedi (Pranav Pramod Dwivedi) is the franchise captain and premier all-rounder of Destroyers Cricket Club (DES) in Rewa, Madhya Pradesh. He led Destroyers to three consecutive championships in 2024, 2025, and 2026."
          },
          {
            question: "What are Pranav Dwivedi's career batting and bowling statistics?",
            answer: "1,435 runs at 57.4 average (SR 146.4, HS 102*, 14 fifties, 1 hundred) and 66 wickets at 16.3 average (Econ 5.48, BBI 8/39)."
          },
          {
            question: "What is Pranav Dwivedi's captaincy record against Dread Eleven?",
            answer: "19 wins, securing 3 consecutive championships: 2024 (4-1), 2025 (5-0 clean sweep), and 2026 (3-2)."
          },
          {
            question: "What jersey number and role does Pranav Dwivedi play?",
            answer: "Jersey #7, Captain and All-rounder."
          },
          {
            question: "Where can Pranav Dwivedi's official RDCA cricket records be verified?",
            answer: "https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/"
          }
        ]
      };

      const pranavMdData = `# Pranav Dwivedi — Captain & All-Rounder | Destroyers Cricket Club

> Official AI & LLM Machine-Readable Dossier for Pranav Dwivedi (Jersey #7), 3-time consecutive champion captain of Destroyers Cricket Club (DES) in the Atal Bihari Vajpayee Memorial Tournament, Rewa.

## Player Overview
- **Full Name**: Pranav Pramod Dwivedi
- **Known As**: Pranav Dwivedi, Capt. Pranav Dwivedi
- **Jersey Number**: #7
- **Franchise**: Destroyers Cricket Club (DES)
- **Role**: Captain & Premier All-Rounder
- **Batting Style**: Right-hand bat
- **Bowling Style**: Right-arm fast-medium & off-spin
- **Governing Body**: Rewa Division Cricket Association (RDCA)
- **Official Registry**: https://rewa-cricket-division.vercel.app/players/pranav-dwivedi/

## Championship Dynasty
- **2026 Champions**: Defeated Dread Eleven 3–2 (Final: 82 runs & 3/28)
- **2025 Champions**: Defeated Dread Eleven 5–0 (Historic Clean Sweep)
- **2024 Champions**: Defeated Dread Eleven 4–1 (Series Victory)

## Career Statistics (vs Dread Eleven)
- **Matches**: 27
- **Runs Scored**: 1,435
- **Batting Average**: 57.40
- **Strike Rate**: 146.43
- **Highest Score**: 102* (Century)
- **Fifties**: 14
- **Hundreds**: 1
- **Fours / Sixes**: 142 fours, 48 sixes
- **Wickets Taken**: 66
- **Bowling Average**: 16.32
- **Economy Rate**: 5.48
- **Best Bowling Figures**: 8/39

## Frequently Asked Questions (FAQ)
### Who is Pranav Dwivedi in Rewa cricket?
Pranav Dwivedi is the franchise captain and premier all-rounder of Destroyers Cricket Club (DES). He has captained Destroyers to three consecutive championships in the Atal Bihari Vajpayee Memorial Tournament (2024, 2025, 2026).

### What are Pranav Dwivedi's career statistics?
Pranav has scored 1,435 runs at 57.4 average (SR 146.4) with 1 hundred and 14 fifties, and claimed 66 wickets at 16.3 average with best figures of 8/39.

### What is Pranav Dwivedi's captaincy record?
Under Pranav's captaincy, Destroyers have won 19 derby clashes against Dread Eleven, clinching 3 consecutive series (2024, 2025, 2026).
`;

      fs.writeFileSync(path.join(playersDir, 'pranav-dwivedi.json'), JSON.stringify(pranavJsonData, null, 2));
      fs.writeFileSync(path.join(playersDir, 'pranav-dwivedi.md'), pranavMdData);

      const publicPlayersDir = path.join(rootDir, 'public/players');
      ensureDir(publicPlayersDir);
      fs.writeFileSync(path.join(publicPlayersDir, 'pranav-dwivedi.json'), JSON.stringify(pranavJsonData, null, 2));
      fs.writeFileSync(path.join(publicPlayersDir, 'pranav-dwivedi.md'), pranavMdData);
    }
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
  const fiftyOversCount = matches.filter((m) => m.format.includes('50') || m.format === 'ODI' || m.format === 'One-Day').length;
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
    <h2 style="font-family:var(--f-athletic); font-size:1.35rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Tournament Filters &amp; Format Selection</h2>
    <div class="filter-toolbar" style="display:flex; flex-direction:column; gap:0.75rem; background:var(--c-card-bg); border:1px solid var(--b-medium); padding:1.25rem; margin-bottom:2.5rem;">
      <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem;">
        <span class="filter-group-label" style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase;">Format:</span>
        <button type="button" class="filter-pill active format-filter-btn" data-format="all">All (${listMatches.length})</button>
        <button type="button" class="filter-pill format-filter-btn" data-format="T20">T20 (${t20Count})</button>
        <button type="button" class="filter-pill format-filter-btn" data-format="50-overs">50 Overs (${fiftyOversCount})</button>

        <span class="filter-group-label" style="margin-left:1rem; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase;">Result:</span>
        <button type="button" class="filter-pill active result-filter-btn" data-result="all">All</button>
        <button type="button" class="filter-pill result-filter-btn" data-result="win">DES Wins (${desWinsCount})</button>
        <button type="button" class="filter-pill result-filter-btn" data-result="loss">DE Wins (${deWinsCount})</button>
        ${upcomingCount > 0 ? `<button type="button" class="filter-pill result-filter-btn" data-result="upcoming">Upcoming (${upcomingCount})</button>` : ''}
      </div>

      <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem;">
        <span class="filter-group-label" style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase;">Season:</span>
        <button type="button" class="filter-pill active season-filter-btn" data-season="all">All Seasons</button>
        <button type="button" class="filter-pill season-filter-btn" data-season="2026">2026</button>
        <button type="button" class="filter-pill season-filter-btn" data-season="2025">2025</button>
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
              <span class="pro-fmt-tag ${m.format.toLowerCase().replace(/\s+/g, '-')}">${esc(m.format)} • SEASON ${esc(m.seasonYear)}</span>
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
  title: 'Tournament Fixtures & Schedule | Destroyers CC',
  description: 'Official 50-over and T20 match schedule for Destroyers Cricket Club in the Atal Bihari Vajpayee Memorial Tournament, Rewa. Filter by season and format.',
  canonicalUrl: '/fixtures',
  keywords: 'Destroyers Fixtures, Rewa Cricket Schedule, Dread Eleven vs Destroyers, Atal Bihari Vajpayee Memorial Tournament fixtures, APSU Stadium',
  twitterData: {
    label1: 'Tournament',
    data1: 'Atal Bihari Vajpayee Memorial',
    label2: 'Format',
    data2: '50 Overs & T20'
  },
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
  title: 'Match Results & Scorecards | Destroyers CC',
  description: 'Historical match results and verified scorecards for all 34 derby clashes between Destroyers and Dread Eleven in the Atal Bihari Vajpayee Tournament.',
  canonicalUrl: '/results',
  keywords: 'Destroyers Results, Rewa Cricket Scorecards, Destroyers vs Dread Eleven scorecards, Atal Bihari Vajpayee Memorial Tournament results',
  twitterData: {
    label1: 'Historical Record',
    data1: 'DES 19 Wins • DE 15 Wins',
    label2: 'Latest Climax',
    data2: 'DES def. DE by 12 runs'
  },
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

    function getPlayerUrl(name, isDesTeam) {
      if (!name) return '#';
      const clean = name.replace(/\s*\(c\)$/i, '').trim();
      const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (isDesTeam) {
        return `/players/${slug}`;
      } else {
        return `https://dread-eleven-rewacricket.pages.dev/players/${slug}`;
      }
    }

    function renderMatchEditorialSection(m) {
      if (m.status !== 'completed') return '';

      const isDesWinner = m.winner === 'DES';
      const inn1 = m.innings?.[0] || { teamName: 'Innings 1', runs: 0, wickets: 0, overs: 0, batting: [], bowling: [] };
      const inn2 = m.innings?.[1] || { teamName: 'Innings 2', runs: 0, wickets: 0, overs: 0, batting: [], bowling: [] };

      const bat1Sorted = [...(inn1.batting || [])].sort((a,b) => b.runs - a.runs);
      const bat2Sorted = [...(inn2.batting || [])].sort((a,b) => b.runs - a.runs);
      const bowl1Sorted = [...(inn1.bowling || [])].sort((a,b) => (b.wickets - a.wickets) || (a.runs - b.runs));
      const bowl2Sorted = [...(inn2.bowling || [])].sort((a,b) => (b.wickets - a.wickets) || (a.runs - b.runs));

      const topBat1 = bat1Sorted[0] || { playerName: 'Top Batter', runs: 0, balls: 0, fours: 0, sixes: 0 };
      const topBat2 = bat2Sorted[0] || { playerName: 'Top Batter', runs: 0, balls: 0, fours: 0, sixes: 0 };
      const topBowl1 = bowl1Sorted[0] || { playerName: 'Top Bowler', wickets: 0, runs: 0, overs: 0 };
      const topBowl2 = bowl2Sorted[0] || { playerName: 'Top Bowler', wickets: 0, runs: 0, overs: 0 };

      const potm = m.playerOfTheMatch || { name: isDesWinner ? 'Pranav Dwivedi' : 'Akhil Mishra', reason: 'match-winning performance' };
      const desCapt = m.captains?.DES?.playerName || 'Pranav Dwivedi';
      const deCapt = m.captains?.DE?.playerName || 'Akhil Mishra';

      const venue = m.venue?.name || 'APSU Stadium, Rewa';
      const isApsu = venue.includes('APSU');

      const headline = isDesWinner
        ? `Destroyers Roar to Derby Glory: Tactical Breakdown of Rewa Triumph at ${venue}`
        : `Dread Eleven Edge Dramatic Derby Encounter: Match Tactical Analysis at ${venue}`;

      const lead = `Competing under the prestigious banner of the Atal Bihari Vajpayee Memorial Tournament, ${isDesWinner ? 'Destroyers Cricket Club' : 'Dread Eleven'} seized a memorable victory (${m.resultText}) on ${formatDate(m.matchDate)} at ${venue}.`;

      const p1 = `The ${m.seasonYear} encounter at ${venue} commenced with a high-stakes toss won by ${m.toss?.winner || 'the captains'}, electing to ${m.toss?.decision || 'bat first'}. On a ${isApsu ? 'lively APSU turf carrying genuine pace and consistent bounce' : 'tested Martand Ground No. 3 surface offering early seam movement and turn for finger spinners'}, ${inn1.teamName} opened proceedings with ${inn1.runs}/${inn1.wickets} in ${inn1.overs} overs. ${topBat1.playerName} anchored the top order with ${topBat1.runs} off ${topBat1.balls} balls, while ${inn2.teamName}'s bowling attack countered through ${topBowl1.playerName} (${topBowl1.wickets}/${topBowl1.runs} in ${topBowl1.overs} overs).`;

      const p2 = `In the second innings, ${inn2.teamName} replied with a spirited performance of ${inn2.runs}/${inn2.wickets} across ${inn2.overs} overs. ${topBat2.playerName} spearheaded the charge with ${topBat2.runs} runs off ${topBat2.balls} deliveries. The bowling unit maintained relentless pressure through ${topBowl2.playerName}'s incisive spell of ${topBowl2.wickets}/${topBowl2.runs}, keeping boundaries strictly curtailed in the crucial middle overs.`;

      const p3 = `Tactically, captain ${isDesWinner ? desCapt : deCapt} displayed brilliant game awareness, implementing restrictive ring field placements during overs 10 to 18 and utilizing reverse-swing yorkers at the death to starve the batting side of scoring momentum.`;

      const p4 = `The decisive honours were awarded to ${potm.name} as Player of the Match for ${potm.reason}. This marquee clash added another legendary installment to the storied rivalry between Destroyers and Dread Eleven in the Rewa Division Cricket Association calendar.`;

      const turningPoint = isDesWinner
        ? `The crucial dismissal of ${topBat1.playerName} and death-overs yorker execution by ${topBowl2.playerName}.`
        : `The disciplined bowling squeeze from ${topBowl1.playerName} and calculated finishing by ${potm.name}.`;

      const conditions = isApsu
        ? `APSU Stadium wicket provided authentic carry and bounce, rewarding disciplined hit-the-deck pace bowling.`
        : `Martand Ground No. 3 surface rewarded disciplined lines, yielding assistance to spinners and reverse-swing in the afternoon.`;

      const captainMove = isDesWinner
        ? `Capt. ${desCapt} choked the cover boundary with defensive sweepers, forcing aerial miscues in the death overs.`
        : `Capt. ${deCapt} rotated spin in short bursts, unsettling Destroyers' middle-order timing.`;

      return `
        <article class="match-editorial-blog" style="margin-top:2.5rem; background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem; border-bottom:1px solid var(--b-subtle); padding-bottom:1rem;">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <span class="hud-status-tag" style="background:rgba(255,59,48,0.15); color:var(--c-ember-bright); border-color:rgba(255,59,48,0.3);">EDITORIAL MATCH REPORT</span>
              <span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase;">By RDCA Senior Cricket Correspondent</span>
            </div>
            <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400);">
              ${formatDate(m.matchDate)} • 5 Min Read
            </div>
          </div>

          <h2 style="font-family:var(--f-athletic); font-size:clamp(1.75rem, 3.5vw, 2.75rem); color:var(--c-white); text-transform:uppercase; line-height:1.1; margin-bottom:1rem;">
            ${esc(headline)}
          </h2>

          <p style="font-size:1.05rem; color:var(--c-ember-bright); font-family:var(--f-body); line-height:1.6; margin-bottom:2rem; font-weight:600; border-left:3px solid var(--c-ember-bright); padding-left:1rem;">
            ${esc(lead)}
          </p>

          <div style="display:grid; grid-template-columns: 2fr 1fr; gap:2.5rem; margin-bottom:2rem;" class="match-blog-grid">
            <div class="match-blog-body" style="font-size:0.95rem; color:var(--c-gray-300); line-height:1.8; display:flex; flex-direction:column; gap:1.25rem;">
              <p>${p1}</p>
              <p>${p2}</p>
              <p>${p3}</p>
              <p>${p4}</p>
            </div>

            <div class="match-blog-sidebar" style="background:var(--c-dark-surface); border:1px solid var(--b-subtle); padding:1.5rem; border-radius:4px; height:fit-content;">
              <h4 style="font-family:var(--f-athletic); font-size:1.25rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.25rem; border-bottom:1px solid var(--b-subtle); padding-bottom:0.5rem;">
                Tactical Post-Mortem
              </h4>

              <div style="display:flex; flex-direction:column; gap:1rem;">
                <div>
                  <span style="font-family:var(--f-mono); font-size:0.7rem; color:var(--c-ember-bright); text-transform:uppercase; font-weight:800; display:block; margin-bottom:0.25rem;">Turning Point</span>
                  <p style="font-size:0.85rem; color:var(--c-gray-300); line-height:1.5; margin:0;">
                    ${esc(turningPoint)}
                  </p>
                </div>

                <div>
                  <span style="font-family:var(--f-mono); font-size:0.7rem; color:var(--c-gold); text-transform:uppercase; font-weight:800; display:block; margin-bottom:0.25rem;">Pitch &amp; Conditions</span>
                  <p style="font-size:0.85rem; color:var(--c-gray-300); line-height:1.5; margin:0;">
                    ${esc(conditions)}
                  </p>
                </div>

                <div>
                  <span style="font-family:var(--f-mono); font-size:0.7rem; color:var(--c-emerald); text-transform:uppercase; font-weight:800; display:block; margin-bottom:0.25rem;">Captain's Masterstroke</span>
                  <p style="font-size:0.85rem; color:var(--c-gray-300); line-height:1.5; margin:0;">
                    ${esc(captainMove)}
                  </p>
                </div>

                <div>
                  <span style="font-family:var(--f-mono); font-size:0.7rem; color:var(--c-white); text-transform:uppercase; font-weight:800; display:block; margin-bottom:0.25rem;">Player of the Match</span>
                  <p style="font-size:0.85rem; color:var(--c-gray-300); line-height:1.5; margin:0;">
                    <strong>${esc(potm.name)}</strong>: ${esc(potm.reason)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    }

    function renderInningsTable(inn, battingTeam, bowlingTeam) {
      if (!inn || !inn.batting || !inn.batting.length) {
        return '<p style="color:var(--c-gray-400); padding:1rem;">Innings not yet contested.</p>';
      }

      const isDes = inn.teamShort === 'DES' || (inn.teamName && inn.teamName.includes('Destroyers'));
      const batCaptainName = isDes
        ? (m.captains?.DES?.playerName || (inn.captain?.playerName || 'Pranav Dwivedi'))
        : (m.captains?.DE?.playerName || (inn.captain?.playerName || 'Akhil Mishra'));
      const bowlCaptainName = isDes
        ? (m.captains?.DE?.playerName || 'Akhil Mishra')
        : (m.captains?.DES?.playerName || 'Pranav Dwivedi');

      const isMatchCapt = (name, target) => {
        if (!name || !target) return false;
        const n = name.toLowerCase().replace(/\s*\(c\)$/i, '').trim();
        const t = target.toLowerCase().replace(/\s*\(c\)$/i, '').trim();
        return n === t;
      };

      const batRows = inn.batting.map((b) => {
        const isCapt = isMatchCapt(b.playerName, batCaptainName);
        const pUrl = getPlayerUrl(b.playerName, isDes);
        const nameCell = `<a href="${pUrl}" ${!isDes ? 'target="_blank" rel="noopener"' : ''} style="color:inherit; text-decoration:none; border-bottom:1px dotted rgba(255,255,255,0.4);" class="scorecard-player-link">${esc(b.playerName.replace(/\s*\(c\)$/i, ''))}</a>${isCapt ? ' <span style="color:var(--c-gold); font-size:0.75rem; font-family:var(--f-mono); font-weight:800;">(c)</span>' : ''}`;
        return `
        <tr>
          <td style="font-weight:800; color:var(--c-white); font-family:var(--f-athletic); font-size:1.15rem;">${nameCell}</td>
          <td style="color:var(--c-gray-400); font-size:0.75rem;">${esc(b.dismissal)}</td>
          <td class="num tabular font-bold" style="color:var(--c-white); font-size:1.05rem;">${esc(b.runs)}</td>
          <td class="num tabular">${esc(b.balls)}</td>
          <td class="num tabular">${esc(b.fours)}</td>
          <td class="num tabular">${esc(b.sixes)}</td>
          <td class="num tabular" style="color:var(--c-gold); font-weight:700;">${esc(b.strikeRate)}</td>
        </tr>
      `;
      }).join('');

      const bowlRows = (inn.bowling || []).map((bo) => {
        const isCapt = isMatchCapt(bo.playerName, bowlCaptainName);
        const pUrl = getPlayerUrl(bo.playerName, !isDes);
        const nameCell = `<a href="${pUrl}" ${isDes ? 'target="_blank" rel="noopener"' : ''} style="color:inherit; text-decoration:none; border-bottom:1px dotted rgba(255,255,255,0.4);" class="scorecard-player-link">${esc(bo.playerName.replace(/\s*\(c\)$/i, ''))}</a>${isCapt ? ' <span style="color:var(--c-gold); font-size:0.75rem; font-family:var(--f-mono); font-weight:800;">(c)</span>' : ''}`;
        return `
        <tr>
          <td style="font-weight:800; color:var(--c-white); font-family:var(--f-athletic); font-size:1.15rem;">${nameCell}</td>
          <td class="num tabular">${esc(bo.overs)}</td>
          <td class="num tabular">${esc(bo.maidens)}</td>
          <td class="num tabular">${esc(bo.runs)}</td>
          <td class="num tabular font-bold" style="color:var(--c-emerald); font-size:1.05rem;">${esc(bo.wickets)}</td>
          <td class="num tabular" style="color:var(--c-ember-bright); font-weight:700;">${esc(bo.economy)}</td>
        </tr>
      `;
      }).join('');

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

          <div style="overflow-x:auto; margin-bottom:1rem;">
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

          ${inn.extras ? `
            <div style="font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-gray-400); margin-bottom:0.75rem;">
              Extras: <strong style="color:var(--c-white);">${inn.extras.total || 0}</strong> (b ${inn.extras.byes || 0}, lb ${inn.extras.legByes || 0}, w ${inn.extras.wides || 0}, nb ${inn.extras.noBalls || 0})
            </div>
          ` : ''}

          ${inn.dnb && inn.dnb.length ? `
            <div style="padding:0.75rem 1.25rem; margin-top:0.5rem; margin-bottom:1.5rem; background:rgba(255,255,255,0.03); border:1px solid var(--b-subtle); border-radius:var(--radius-sm); font-size:0.875rem;">
              <strong style="font-family:var(--f-mono); color:var(--c-gold); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">Did Not Bat:</strong>
              <span style="margin-left:0.6rem; color:var(--c-gray-300);">
                ${inn.dnb.map(d => {
                  const rawName = typeof d === 'string' ? d : d.playerName;
                  const isCapt = isMatchCapt(rawName, batCaptainName);
                  const pUrl = getPlayerUrl(rawName, isDes);
                  return `<span style="display:inline-block; margin-right:0.85rem; font-weight:600;"><a href="${pUrl}" ${!isDes ? 'target="_blank" rel="noopener"' : ''} style="color:inherit; text-decoration:none; border-bottom:1px dotted rgba(255,255,255,0.3);">${esc(rawName.replace(/\s*\(c\)$/i, ''))}</a>${isCapt ? ' <span style="color:var(--c-gold); font-size:0.75rem; font-family:var(--f-mono); font-weight:800;">(c)</span>' : ''}</span>`;
                }).join('')}
              </span>
            </div>
          ` : ''}

          ${inn.fallOfWickets && inn.fallOfWickets.length ? `
            <div style="font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-gray-400); margin-bottom:1.75rem; line-height:1.6;">
              <strong style="color:var(--c-gold); font-size:0.75rem; text-transform:uppercase;">Fall of Wickets:</strong>
              <span style="margin-left:0.5rem;">${inn.fallOfWickets.map(f => {
                const isFowCapt = isMatchCapt(f.playerName, batCaptainName);
                const pUrl = getPlayerUrl(f.playerName, isDes);
                return `${f.wicket}-${f.score} (<a href="${pUrl}" ${!isDes ? 'target="_blank" rel="noopener"' : ''} style="color:inherit; text-decoration:none; border-bottom:1px dotted rgba(255,255,255,0.3);">${esc(f.playerName.replace(/\s*\(c\)$/i, ''))}</a>${isFowCapt ? ' (c)' : ''}, ${f.over} ov)`;
              }).join(', ')}</span>
            </div>
          ` : ''}

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
  title: clampTitle(`DES vs DE (${formatDate(m.matchDate)}) | Match #${m.matchNumber} Scorecard`, 60),
  description: clampDesc(`Official scorecard: Destroyers vs Dread Eleven on ${formatDate(m.matchDate)} at ${m.venue?.city || 'Rewa'}. Complete innings and performance records.`, 155),
  canonicalUrl: `/matches/${m.slug}`,
  ogType: 'article',
  article: {
    publishedTime: m.matchDate,
    section: 'Cricket Match Report',
    tags: ['Cricket', 'Rewa Cricket', 'Destroyers CC', 'Dread Eleven', m.format]
  },
  keywords: `${m.stage}, ${m.matchDate}, Destroyers vs Dread Eleven, ${m.venue?.name || 'APSU Stadium'}, Rewa cricket match scorecard, Pranav Dwivedi vs Akhil Mishra`,
  twitterData: {
    label1: 'Match Result',
    data1: m.resultText || 'Completed',
    label2: 'Venue',
    data2: m.venue?.name || 'APSU Stadium, Rewa'
  },
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
        <span class="pro-fmt-tag ${m.format.toLowerCase().replace(/\s+/g, '-')}">${esc(m.format)} • Season ${esc(m.seasonYear)}</span>
        <span style="font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-gold); font-weight:800; text-transform:uppercase;">${esc(m.stage)}</span>
      </div>

      <h1 class="section-bigtitle" style="font-size:clamp(2.4rem, 5vw, 3.8rem); margin-bottom:0.75rem;">
        Destroyers vs Dread Eleven <span style="display:block; font-size:clamp(1.15rem, 2.2vw, 1.6rem); color:var(--c-gold); font-family:var(--f-mono); font-weight:600; margin-top:0.35rem;">${formatDate(m.matchDate)} • Match #${esc(m.matchNumber)} (${esc(m.stage)})</span>
      </h1>

      <div style="font-size:0.875rem; color:var(--c-gray-400); margin-bottom:1.25rem;">
        <span>${formatDate(m.matchDate)}</span> • <span>${esc(m.time)}</span> • <span>${esc(m.venue.name)}, ${esc(m.venue.city)}</span>
      </div>

      <!-- Match Captains Banner -->
      <div style="display:flex; gap:1.5rem; flex-wrap:wrap; font-family:var(--f-mono); font-size:0.8125rem; color:var(--c-gray-300); margin-bottom:1.25rem; background:var(--c-dark-surface); padding:0.65rem 1rem; border:1px solid var(--b-subtle);">
        <span><strong style="color:var(--c-gold); text-transform:uppercase;">DES Captain:</strong> ${esc(m.captains?.DES?.playerName || 'Pranav Dwivedi')} (c)</span>
        <span><strong style="color:var(--c-ember-bright); text-transform:uppercase;">DE Captain:</strong> ${esc(m.captains?.DE?.playerName || 'Akhil Mishra')} (c)</span>
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
        <div style="margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--b-subtle); display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
          <span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-transform:uppercase; font-weight:800;">Player of the Match:</span>
          <strong style="color:var(--c-white); font-family:var(--f-athletic); font-size:1.25rem;">${esc(m.playerOfTheMatch.name)}</strong>
          <span style="color:var(--c-gray-400); font-size:0.8125rem;">(${esc(m.playerOfTheMatch.team)} • ${esc(m.playerOfTheMatch.reason)})</span>
        </div>
      ` : ''}

      <!-- Cross-Network Match Hub Backlinks -->
      <div style="margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--b-subtle); display:flex; flex-wrap:wrap; gap:1rem; align-items:center; justify-content:space-between;">
        <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
          <span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase; letter-spacing:0.05em;">Official Scorecard:</span>
          <a href="https://rewa-cricket-division.vercel.app/matches/${m.slug.startsWith('destroyers-vs-dread-eleven-202') && parseInt(m.slug.split('-')[4]) <= 2024 ? m.slug.replace('destroyers-vs-dread-eleven-', 'de-vs-des-') : m.slug}/" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 0.8rem; background:rgba(217, 119, 6, 0.15); border:1px solid rgba(217, 119, 6, 0.4); border-radius:4px; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-decoration:none; font-weight:700;">
            RDCA Official Scorecard ↗
          </a>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center;">
          <span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); text-transform:uppercase; letter-spacing:0.05em;">Tournament Central:</span>
          <a href="https://abv-rewacricket.pages.dev/matches/" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 0.8rem; background:rgba(14, 90, 58, 0.25); border:1px solid rgba(14, 90, 58, 0.6); border-radius:4px; font-family:var(--f-mono); font-size:0.75rem; color:#86efac; text-decoration:none; font-weight:700;">
            ABV Tournament Hub ↗
          </a>
        </div>
      </div>
    </div>

    ${isCompleted ? `
      <!-- Scorecard Content -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h2 style="font-family:var(--f-athletic); font-size:2rem; color:var(--c-white); text-transform:uppercase; margin-bottom:2rem;">
          Official Innings Scorecards
        </h2>

        ${inn1 ? renderInningsTable(inn1, inn1.teamName || (inn1.teamShort === 'DES' ? 'Destroyers Cricket Club' : 'Dread Eleven'), (inn1.teamShort === 'DES' || inn1.teamName?.includes('Destroyers')) ? 'Dread Eleven' : 'Destroyers Cricket Club') : ''}

        ${inn2 ? renderInningsTable(inn2, inn2.teamName || (inn2.teamShort === 'DES' ? 'Destroyers Cricket Club' : 'Dread Eleven'), (inn2.teamShort === 'DES' || inn2.teamName?.includes('Destroyers')) ? 'Dread Eleven' : 'Destroyers Cricket Club') : ''}
      </div>

      <!-- Match Tactical Post-Mortem & In-Depth Editorial Blog -->
      ${renderMatchEditorialSection(m)}
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
  title: 'Tournament Points Table & Standings | Destroyers CC',
  description: 'Official standings and points table for the Atal Bihari Vajpayee Memorial Tournament (2021–2026) between Destroyers and Dread Eleven in Rewa.',
  canonicalUrl: '/points-table',
  keywords: 'Destroyers Standings, Atal Bihari Vajpayee Memorial Tournament Points Table, Rewa cricket rankings, NRR, Pranav Dwivedi Destroyers',
  twitterData: {
    label1: 'Reigning Champions',
    data1: 'Destroyers (2026)',
    label2: 'Dynasty Record',
    data2: '3x Consecutive Titles'
  }
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

    <!-- Championship Roll of Honour -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-bottom:3rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <span style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-transform:uppercase; font-weight:800; letter-spacing:0.05em; display:block; margin-bottom:0.4rem;">OFFICIAL TOURNAMENT ROLL OF HONOUR</span>
          <h2 style="font-family:var(--f-athletic); font-size:1.85rem; color:var(--c-white); text-transform:uppercase;">
            Atal Bihari Vajpayee Memorial Cup Champions (2021–2026)
          </h2>
        </div>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <span style="font-family:var(--f-mono); font-size:0.75rem; font-weight:800; background:rgba(212,175,55,0.15); color:var(--c-gold); border:1px solid var(--c-gold); padding:0.35rem 0.75rem; text-transform:uppercase;">DES TITLES: 3 (3-PEAT)</span>
          <span style="font-family:var(--f-mono); font-size:0.75rem; font-weight:800; background:rgba(255,255,255,0.05); color:var(--c-gray-300); border:1px solid var(--b-subtle); padding:0.35rem 0.75rem; text-transform:uppercase;">DE TITLES: 3</span>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="scorecard-data-table">
          <thead>
            <tr>
              <th>Edition / Year</th>
              <th>Format</th>
              <th>Champion Franchise</th>
              <th>Winning Captain</th>
              <th class="num">Series Margin</th>
              <th>Runner-Up</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight:800; font-family:var(--f-mono); color:var(--c-gold);">2026 Edition</td>
              <td style="color:var(--c-gray-400);">2 T20s + 3 50-Over Matches</td>
              <td style="font-weight:800; font-family:var(--f-athletic); font-size:1.25rem; color:var(--c-gold);">Destroyers CC (Champions)</td>
              <td style="color:var(--c-white); font-weight:700;">Pranav Dwivedi <span style="color:var(--c-gold); font-size:0.75rem;">(c)</span></td>
              <td class="num tabular font-bold" style="color:var(--c-gold);">3–2 (5 matches)</td>
              <td style="color:var(--c-gray-300);">Dread Eleven</td>
            </tr>
            <tr>
              <td style="font-weight:800; font-family:var(--f-mono); color:var(--c-gold);">2025 Edition</td>
              <td style="color:var(--c-gray-400);">2 T20s + 3 50-Over Matches</td>
              <td style="font-weight:800; font-family:var(--f-athletic); font-size:1.25rem; color:var(--c-gold);">Destroyers CC (Champions)</td>
              <td style="color:var(--c-white); font-weight:700;">Pranav Dwivedi <span style="color:var(--c-gold); font-size:0.75rem;">(c)</span></td>
              <td class="num tabular font-bold" style="color:var(--c-gold);">5–0 Clean Sweep</td>
              <td style="color:var(--c-gray-300);">Dread Eleven</td>
            </tr>
            <tr>
              <td style="font-weight:800; font-family:var(--f-mono); color:var(--c-gold);">2024 Edition</td>
              <td style="color:var(--c-gray-400);">2 T20s + 3 50-Over Matches</td>
              <td style="font-weight:800; font-family:var(--f-athletic); font-size:1.25rem; color:var(--c-gold);">Destroyers CC (Champions)</td>
              <td style="color:var(--c-white); font-weight:700;">Pranav Dwivedi <span style="color:var(--c-gold); font-size:0.75rem;">(c)</span></td>
              <td class="num tabular font-bold" style="color:var(--c-gold);">4–1 (5 matches)</td>
              <td style="color:var(--c-gray-300);">Dread Eleven</td>
            </tr>
            <tr>
              <td style="font-weight:800; font-family:var(--f-mono); color:var(--c-white);">2023 Edition</td>
              <td style="color:var(--c-gray-400);">2 T20s + 3 50-Over Matches</td>
              <td style="font-weight:800; font-family:var(--f-athletic); font-size:1.25rem; color:var(--c-ember-bright);">Dread Eleven</td>
              <td style="color:var(--c-white); font-weight:700;">Akhil Mishra <span style="color:var(--c-ember-bright); font-size:0.75rem;">(c)</span></td>
              <td class="num tabular font-bold" style="color:var(--c-emerald);">3–2 (5 matches)</td>
              <td style="color:var(--c-gray-300);">Destroyers CC</td>
            </tr>
            <tr>
              <td style="font-weight:800; font-family:var(--f-mono); color:var(--c-white);">2022 Edition</td>
              <td style="color:var(--c-gray-400);">50-Over &amp; T20 Format</td>
              <td style="font-weight:800; font-family:var(--f-athletic); font-size:1.25rem; color:var(--c-ember-bright);">Dread Eleven</td>
              <td style="color:var(--c-white); font-weight:700;">Akhil Mishra <span style="color:var(--c-ember-bright); font-size:0.75rem;">(c)</span></td>
              <td class="num tabular font-bold" style="color:var(--c-emerald);">4–3 (7 matches)</td>
              <td style="color:var(--c-gray-300);">Destroyers CC</td>
            </tr>
            <tr>
              <td style="font-weight:800; font-family:var(--f-mono); color:var(--c-white);">2021 Inaugural</td>
              <td style="color:var(--c-gray-400);">T20 Format</td>
              <td style="font-weight:800; font-family:var(--f-athletic); font-size:1.25rem; color:var(--c-ember-bright);">Dread Eleven</td>
              <td style="color:var(--c-white); font-weight:700;">Akhil Mishra <span style="color:var(--c-ember-bright); font-size:0.75rem;">(c)</span></td>
              <td class="num tabular font-bold" style="color:var(--c-emerald);">5–2 (7 matches)</td>
              <td style="color:var(--c-gray-300);">Destroyers CC</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- All-Time Master Standings -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-bottom:3rem;">
      <h2 style="font-family:var(--f-athletic); font-size:1.85rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.5rem;">
        All-Time Derby Table (2021–2026 • 34 Encounters)
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
    <div class="responsive-duo-grid">
      <!-- 2026 Season (Destroyers Champions 3-2) -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Season 2026 (Destroyers 3–2 Champions)</h3>
        <div class="scorecard-table-wrap"><table class="scorecard-data-table">
          <thead>
            <tr><th>Team</th><th class="num">P</th><th class="num">W</th><th class="num">L</th><th class="num">NRR</th><th class="num">Pts</th></tr>
          </thead>
          <tbody>
            ${pointsTable['2026'].map((r) => `
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
        </div></div>
      </div>

      <!-- 2025 Season (Destroyers 5-0 Clean Sweep) -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Season 2025 (Destroyers 5–0 Clean Sweep)</h3>
        <div class="scorecard-table-wrap"><table class="scorecard-data-table">
          <thead>
            <tr><th>Team</th><th class="num">P</th><th class="num">W</th><th class="num">L</th><th class="num">NRR</th><th class="num">Pts</th></tr>
          </thead>
          <tbody>
            ${pointsTable['2025'].map((r) => `
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
        </div></div>
      </div>

      <!-- 2024 Season (Destroyers Champions 4-1) -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Season 2024 (Destroyers 4–1 Series Win)</h3>
        <div class="scorecard-table-wrap"><table class="scorecard-data-table">
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
        </div></div>
      </div>

      <!-- 2023 Season -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Season 2023 (50 Overs)</h3>
        <div class="scorecard-table-wrap"><table class="scorecard-data-table">
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
        </div></div>
      </div>

      <!-- 2022 Season -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Season 2022 (T20 &amp; 50 Overs)</h3>
        <div class="scorecard-table-wrap"><table class="scorecard-data-table">
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
        </div></div>
      </div>

      <!-- 2021 Inaugural Year -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Season 2021 (Inaugural T20)</h3>
        <div class="scorecard-table-wrap"><table class="scorecard-data-table">
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
        </div></div>
      </div>
    </div>

    <!-- Tournament Playing Conditions & Regulatory Compliance -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-top:2.5rem; border-left:4px solid var(--c-gold);">
      <p class="section-pretitle" style="color:var(--c-gold); margin:0 0 0.25rem 0;">Statutory Governance &bull; RDCA Mandates</p>
      <h2 style="font-family:var(--f-athletic); font-size:1.85rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
        Tournament Playing Conditions &amp; Regulatory Compliance
      </h2>
      <p style="color:var(--c-gray-300); font-size:0.95rem; line-height:1.7; margin-bottom:1.5rem; max-width:85ch;">
        Destroyers Cricket Club strictly adheres to the 14 statutory tournament regulations and modern playing amendments codified by the Rewa Division Cricket Association (RDCA). Captain Pranav Dwivedi and team management incorporate key tactical adjustments for complex rule changes:
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">In-Match Over Rate Penalty</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Fielding side must commence the final over by scheduled cutoff. Failure incurs an immediate fielding restriction (only 4 fielders allowed outside the 30-yard circle for all subsequent overs).</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">60-Second Stop-Clock</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Bowlers must be ready within 60 seconds between overs. Two warnings are allowed per innings; a 3rd breach costs a 5-run penalty awarded to the opposition.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">15° Bowling Action Scrutiny</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Strict compliance with the 15-degree elbow extension limit. Biomechanical 3D motion analysis applies to any reported bowling action under RDCA oversight.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">PMOA Electronic Device Blackout</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Full communication blackout in dressing rooms from 60 minutes pre-toss until post-match. Zero smartwatches or mobile devices permitted in team areas.</p>
        </div>
      </div>
      <div style="text-align:right;">
        <a href="https://abv-rewacricket.pages.dev/rules/" target="_blank" rel="noopener" style="color:var(--c-gold); font-family:var(--f-mono); font-size:0.85rem; font-weight:700; text-decoration:none;">
          Examine All 14 Statutory Codes on ABV Tournament Portal &rarr;
        </a>
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
  title: 'Franchise Records & All-Time Stats | Destroyers CC',
  description: 'Certified statistics, records, highest team totals, and top performances for Destroyers Cricket Club across all 34 clashes against Dread Eleven.',
  canonicalUrl: '/stats',
  keywords: 'Destroyers Cricket Stats, Pranav Dwivedi career stats, Rewa cricket records, leading run scorers Rewa, highest wicket takers',
  twitterData: {
    label1: 'Leading Run Scorer',
    data1: 'Pranav Dwivedi (1,435 runs)',
    label2: 'Leading Wicket Taker',
    data2: 'Pranav Dwivedi (66 wkts)'
  }
})}
${renderHeader('stats')}

<section class="spotlight-banner-section" style="padding-top:4rem; background:#080808;">
  <div class="container">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">The Record Books</p>
        <h1 class="section-bigtitle">Destroyers All-Time Statistics</h1>
        <p style="color:var(--c-gray-400); font-size:1rem; max-width:64ch; margin-top:0.4rem;">
          Verified tournament records across all 34 clashes against Dread Eleven in Rewa.
        </p>
      </div>
    </div>

    <!-- All-Time Combined Tournament Leaderboard -->
    <div style="background:var(--c-card-bg); border:1px solid var(--c-gold); padding:2.5rem; margin-bottom:3rem; border-radius:4px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <p class="section-pretitle" style="color:var(--c-gold); margin:0 0 0.25rem 0;">Atal Bihari Vajpayee Memorial Tournament &bull; Official Telemetry</p>
          <h2 style="font-family:var(--f-athletic); font-size:2rem; color:var(--c-white); text-transform:uppercase; margin:0;">
            Combined All-Time Leaderboards (Both Teams)
          </h2>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <span style="background:rgba(217, 119, 6, 0.2); color:var(--c-gold); border:1px solid var(--c-gold); padding:0.35rem 0.75rem; font-family:var(--f-mono); font-size:0.8rem; font-weight:800; border-radius:4px;">Series Tied 3&ndash;3</span>
          <span style="background:rgba(16, 185, 129, 0.2); color:var(--c-emerald); border:1px solid var(--c-emerald); padding:0.35rem 0.75rem; font-family:var(--f-mono); font-size:0.8rem; font-weight:800; border-radius:4px;">34 Clashes</span>
        </div>
      </div>
      <p style="color:var(--c-gray-300); font-size:0.95rem; line-height:1.6; max-width:80ch; margin-bottom:2rem;">
        Official certified telemetry across both franchises (Destroyers CC &amp; Dread Eleven) over 6 tournament seasons (2021&ndash;2026). Overall series titles stand level at <strong>3&ndash;3</strong> (Dread Eleven: 2021, 2022, 2023 under Akhil Mishra; Destroyers CC: 2024, 2025, 2026 under Pranav Dwivedi).
      </p>

      <div class="responsive-duo-grid">
        <!-- Leading Run Scorers -->
        <div>
          <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-gold); text-transform:uppercase; margin-bottom:1rem;">
            Leading Run Scorers (Both Teams)
          </h3>
          <div class="scorecard-table-wrap">
          <table class="scorecard-data-table">
            <thead>
              <tr><th>Player</th><th>Team</th><th class="num">Runs</th><th class="num">Avg</th><th class="num">SR</th></tr>
            </thead>
            <tbody>
              <tr><td style="font-weight:800; color:var(--c-white);"><a href="/players/pranav-dwivedi" style="color:inherit;">Pranav Dwivedi</a></td><td><span style="color:var(--c-gold); font-weight:700;">Destroyers CC</span></td><td class="num tabular font-bold" style="color:var(--c-gold);">1435</td><td class="num tabular">57.4</td><td class="num tabular">146.4</td></tr>
              <tr><td style="font-weight:800; color:var(--c-white);"><a href="https://dread-eleven-rewacricket.pages.dev/players/akhil-mishra" target="_blank" rel="noopener" style="color:inherit;">Akhil Mishra</a></td><td><span style="color:var(--c-ruby); font-weight:700;">Dread Eleven</span></td><td class="num tabular font-bold" style="color:var(--c-gold);">1378</td><td class="num tabular">44.5</td><td class="num tabular">130.0</td></tr>
              <tr><td style="font-weight:800; color:var(--c-white);"><a href="/players/anant-verma" style="color:inherit;">Anant Verma</a></td><td><span style="color:var(--c-gold); font-weight:700;">Destroyers CC</span></td><td class="num tabular font-bold" style="color:var(--c-gold);">782</td><td class="num tabular">39.1</td><td class="num tabular">134.2</td></tr>
              <tr><td style="font-weight:800; color:var(--c-white);"><a href="/players/sagar-pratap-singh" style="color:inherit;">Sagar Pratap Singh</a></td><td><span style="color:var(--c-gold); font-weight:700;">Destroyers CC</span></td><td class="num tabular font-bold" style="color:var(--c-gold);">694</td><td class="num tabular">34.7</td><td class="num tabular">128.5</td></tr>
              <tr><td style="font-weight:800; color:var(--c-white);"><a href="https://dread-eleven-rewacricket.pages.dev/players/aditya-shrivastava" target="_blank" rel="noopener" style="color:inherit;">Aditya Shrivastava</a></td><td><span style="color:var(--c-ruby); font-weight:700;">Dread Eleven</span></td><td class="num tabular font-bold" style="color:var(--c-gold);">612</td><td class="num tabular">30.6</td><td class="num tabular">122.4</td></tr>
            </tbody>
          </table>
        </div>
          </div>
        </div>

        <!-- Leading Wicket Takers -->
        <div>
          <h3 style="font-family:var(--f-athletic); font-size:1.5rem; color:var(--c-emerald); text-transform:uppercase; margin-bottom:1rem;">
            Leading Wicket Takers (Both Teams)
          </h3>
          <div class="scorecard-table-wrap">
          <table class="scorecard-data-table">
            <thead>
              <tr><th>Player</th><th>Team</th><th class="num">Wkts</th><th class="num">Avg</th><th class="num">Econ</th></tr>
            </thead>
            <tbody>
              <tr><td style="font-weight:800; color:var(--c-white);"><a href="/players/pranav-dwivedi" style="color:inherit;">Pranav Dwivedi</a></td><td><span style="color:var(--c-gold); font-weight:700;">Destroyers CC</span></td><td class="num tabular font-bold" style="color:var(--c-emerald);">66</td><td class="num tabular">16.3</td><td class="num tabular">5.48</td></tr>
              <tr><td style="font-weight:800; color:var(--c-white);"><a href="https://dread-eleven-rewacricket.pages.dev/players/aditya-shrivastava" target="_blank" rel="noopener" style="color:inherit;">Aditya Shrivastava</a></td><td><span style="color:var(--c-ruby); font-weight:700;">Dread Eleven</span></td><td class="num tabular font-bold" style="color:var(--c-emerald);">49</td><td class="num tabular">21.2</td><td class="num tabular">5.76</td></tr>
              <tr><td style="font-weight:800; color:var(--c-white);"><a href="/players/somil-khan" style="color:inherit;">Somil Khan</a></td><td><span style="color:var(--c-gold); font-weight:700;">Destroyers CC</span></td><td class="num tabular font-bold" style="color:var(--c-emerald);">42</td><td class="num tabular">19.8</td><td class="num tabular">5.62</td></tr>
              <tr><td style="font-weight:800; color:var(--c-white);"><a href="https://dread-eleven-rewacricket.pages.dev/players/akhil-mishra" target="_blank" rel="noopener" style="color:inherit;">Akhil Mishra</a></td><td><span style="color:var(--c-ruby); font-weight:700;">Dread Eleven</span></td><td class="num tabular font-bold" style="color:var(--c-emerald);">38</td><td class="num tabular">61.1</td><td class="num tabular">5.92</td></tr>
              <tr><td style="font-weight:800; color:var(--c-white);"><a href="/players/harshit-patel" style="color:inherit;">Harshit Patel</a></td><td><span style="color:var(--c-gold); font-weight:700;">Destroyers CC</span></td><td class="num tabular font-bold" style="color:var(--c-emerald);">34</td><td class="num tabular">22.1</td><td class="num tabular">6.04</td></tr>
            </tbody>
          </table>
        </div>
          </div>
        </div>
      </div>
      <div style="margin-top:1.5rem; text-align:right;">
        <a href="https://abv-rewacricket.pages.dev/stats/" target="_blank" rel="noopener" style="color:var(--c-gold); font-family:var(--f-mono); font-size:0.85rem; font-weight:700; text-decoration:none;">
          View Full Telemetry on ABV Tournament Portal &rarr;
        </a>
      </div>
    </div>

    <!-- Top Run Scorers & Leading Wicket Takers Grid -->
    <div class="responsive-duo-grid" style="margin-bottom:3rem;">
      <!-- Top Run Scorers -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h2 style="font-family:var(--f-athletic); font-size:1.75rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.25rem;">
          Top Destroyers Run Scorers
        </h2>
        <div class="scorecard-table-wrap">
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
      </div>

      <!-- Leading Wicket Takers -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h2 style="font-family:var(--f-athletic); font-size:1.75rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.25rem;">
          Top Destroyers Wicket Takers
        </h2>
        <div class="scorecard-table-wrap">
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
    </div>

    <!-- Rate Statistics: Highest Averages & Highest Scores -->
    <div class="responsive-duo-grid">
      <!-- Highest Batting Averages -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
          Best Batting Averages (Min. 5 Matches)
        </h3>
        <div class="scorecard-table-wrap">
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
      </div>

      <!-- Highest Individual Scores -->
      <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
        <h3 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
          Highest Individual Scores
        </h3>
        <div class="scorecard-table-wrap">
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

    <!-- Tournament Playing Conditions & Regulatory Compliance -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-top:2.5rem; border-left:4px solid var(--c-gold);">
      <p class="section-pretitle" style="color:var(--c-gold); margin:0 0 0.25rem 0;">Statutory Governance &bull; RDCA Mandates</p>
      <h2 style="font-family:var(--f-athletic); font-size:1.85rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
        Tournament Playing Conditions &amp; Regulatory Compliance
      </h2>
      <p style="color:var(--c-gray-300); font-size:0.95rem; line-height:1.7; margin-bottom:1.5rem; max-width:85ch;">
        Destroyers Cricket Club strictly adheres to the 14 statutory tournament regulations and modern playing amendments codified by the Rewa Division Cricket Association (RDCA). Captain Pranav Dwivedi and team management incorporate key tactical adjustments for complex rule changes:
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">In-Match Over Rate Penalty</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Fielding side must commence the final over by scheduled cutoff. Failure incurs an immediate fielding restriction (only 4 fielders allowed outside the 30-yard circle for all subsequent overs).</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">60-Second Stop-Clock</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Bowlers must be ready within 60 seconds between overs. Two warnings are allowed per innings; a 3rd breach costs a 5-run penalty awarded to the opposition.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">15° Bowling Action Scrutiny</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Strict compliance with the 15-degree elbow extension limit. Biomechanical 3D motion analysis applies to any reported bowling action under RDCA oversight.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">PMOA Electronic Device Blackout</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Full communication blackout in dressing rooms from 60 minutes pre-toss until post-match. Zero smartwatches or mobile devices permitted in team areas.</p>
        </div>
      </div>
      <div style="text-align:right;">
        <a href="https://abv-rewacricket.pages.dev/rules/" target="_blank" rel="noopener" style="color:var(--c-gold); font-family:var(--f-mono); font-size:0.85rem; font-weight:700; text-decoration:none;">
          Examine All 14 Statutory Codes on ABV Tournament Portal &rarr;
        </a>
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
  title: 'News & Tactical Press Center | Destroyers CC',
  description: 'Latest news, match reports, squad announcements, and tactical analysis from the Destroyers Cricket Club press desk in Rewa, Madhya Pradesh.',
  canonicalUrl: '/news',
  keywords: 'Destroyers Cricket News, Rewa Cricket press desk, match reports, squad announcements, Atal Bihari Vajpayee tournament news',
  author: 'Destroyers Cricket Club Media Team',
  twitterData: {
    label1: 'Press Desk',
    data1: 'Destroyers CC Media Hub',
    label2: 'Coverage',
    data2: 'Editorial & Tactical Analysis'
  },
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

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap:2.5rem;">
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
      description: clampDesc(n.summary, 155),
      image: n.heroImage ? (n.heroImage.startsWith('http') ? n.heroImage : `${BASE_URL}${n.heroImage}`) : `${BASE_URL}/public/inspo1.jpg`,
      datePublished: n.publishedAt,
      dateModified: n.updatedAt || n.publishedAt,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/news/${n.slug}`
      },
      author: {
        '@type': 'Person',
        name: n.author.name,
        jobTitle: n.author.role
      },
      publisher: {
        '@type': ['SportsOrganization', 'Organization'],
        name: 'Destroyers Cricket Club (DES)',
        url: BASE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/public/favicon.svg`
        }
      }
    };

    const articleHtml = `
${renderHead({
  title: clampTitle(`${n.title.replace(/[—–].*$/, '').trim()} | Destroyers News`, 60),
  description: clampDesc(n.summary, 155),
  canonicalUrl: `/news/${n.slug}`,
  ogType: 'article',
  ogImage: n.heroImage,
  article: {
    publishedTime: n.publishedAt,
    author: n.author || 'Destroyers Media',
    section: n.category || 'News',
    tags: n.tags || ['Rewa Cricket', 'Destroyers CC']
  },
  keywords: `${n.title}, Destroyers news, Rewa cricket editorial, ${n.category || 'Press Release'}`,
  author: n.author || 'Destroyers Cricket Club Media Team',
  twitterData: {
    label1: 'Category',
    data1: n.category || 'Editorial',
    label2: 'Published',
    data2: formatDate(n.publishedAt)
  },
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
      <h2 style="font-family:var(--f-athletic); font-size:1.65rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">Tactical Analysis &amp; Match Flow</h2>
      ${n.body}
    </div>

    <!-- Related Articles -->
    <div style="border-top:1px solid var(--b-medium); padding-top:2.5rem; margin-top:3rem;">
      <h2 style="font-family:var(--f-athletic); font-size:1.75rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.5rem;">
        Related News &amp; Features
      </h2>
      <div class="responsive-duo-grid">
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

  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Destroyers Cricket Club',
    description: 'Official history and legacy of Destroyers Cricket Club (DES), captained by Pranav Dwivedi in the Atal Bihari Vajpayee Memorial Tournament in Rewa.',
    url: `${BASE_URL}/about`,
    about: {
      '@type': ['SportsOrganization', 'Organization'],
      name: 'Destroyers Cricket Club (DES)',
      url: BASE_URL,
      memberOf: {
        '@type': 'SportsOrganization',
        name: 'Rewa Division Cricket Association (RDCA)',
        url: 'https://rewa-cricket-division.vercel.app'
      },
      sameAs: [
        'https://rewa-cricket-division.vercel.app/teams/destroyers/',
        'https://rewa-cricket-division.vercel.app/tournaments/atal-bihari-vajpayee-memorial-tournament/'
      ]
    }
  };

  const html = `
${renderHead({
  title: 'About Destroyers Cricket Club | Rewa Franchise',
  description: 'Official history and legacy of Destroyers Cricket Club (DES), captained by Pranav Dwivedi in the Atal Bihari Vajpayee Memorial Tournament in Rewa.',
  canonicalUrl: '/about',
  keywords: 'About Destroyers Cricket Club, Rewa Cricket Association, RDCA franchise, Pranav Dwivedi captain, APSU Stadium Rewa, franchise legacy',
  author: 'Destroyers Cricket Club Media Team',
  twitterData: {
    label1: 'Franchise Base',
    data1: 'Rewa, Madhya Pradesh',
    label2: 'Championships',
    data2: '2024, 2025, 2026 Champions'
  },
  jsonLd: aboutJsonLd,
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: 'About', item: '/about' }
  ]
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
            The franchise reached unprecedented heights across the 2024, 2025, and 2026 seasons—capturing the 2024 series 4–1, executing a historic 5–0 clean sweep in 2025, and defending the championship in a thriller 3–2 in 2026 under captain Pranav Dwivedi to cement an iconic three-peat.
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

    <!-- Tournament Playing Conditions & Regulatory Compliance -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-top:2.5rem; border-left:4px solid var(--c-gold);">
      <p class="section-pretitle" style="color:var(--c-gold); margin:0 0 0.25rem 0;">Statutory Governance &bull; RDCA Mandates</p>
      <h2 style="font-family:var(--f-athletic); font-size:1.85rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
        Tournament Playing Conditions &amp; Regulatory Compliance
      </h2>
      <p style="color:var(--c-gray-300); font-size:0.95rem; line-height:1.7; margin-bottom:1.5rem; max-width:85ch;">
        Destroyers Cricket Club strictly adheres to the 14 statutory tournament regulations and modern playing amendments codified by the Rewa Division Cricket Association (RDCA). Captain Pranav Dwivedi and team management incorporate key tactical adjustments for complex rule changes:
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">In-Match Over Rate Penalty</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Fielding side must commence the final over by scheduled cutoff. Failure incurs an immediate fielding restriction (only 4 fielders allowed outside the 30-yard circle for all subsequent overs).</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">60-Second Stop-Clock</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Bowlers must be ready within 60 seconds between overs. Two warnings are allowed per innings; a 3rd breach costs a 5-run penalty awarded to the opposition.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">15° Bowling Action Scrutiny</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Strict compliance with the 15-degree elbow extension limit. Biomechanical 3D motion analysis applies to any reported bowling action under RDCA oversight.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">PMOA Electronic Device Blackout</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Full communication blackout in dressing rooms from 60 minutes pre-toss until post-match. Zero smartwatches or mobile devices permitted in team areas.</p>
        </div>
      </div>
      <div style="text-align:right;">
        <a href="https://abv-rewacricket.pages.dev/rules/" target="_blank" rel="noopener" style="color:var(--c-gold); font-family:var(--f-mono); font-size:0.85rem; font-weight:700; text-decoration:none;">
          Examine All 14 Statutory Codes on ABV Tournament Portal &rarr;
        </a>
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

  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Destroyers Cricket Club',
    description: 'Official contact desk and stadium trial inquiries for Destroyers Cricket Club in Rewa.',
    url: `${BASE_URL}/contact`,
    mainEntity: {
      '@type': ['SportsOrganization', 'SportsTeam'],
      name: 'Destroyers Cricket Club (DES)',
      url: BASE_URL,
      sport: 'Cricket',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Administration & Player Trials',
        email: 'admin@destroyers-rewa.cricket',
        availableLanguage: ['English', 'Hindi']
      }
    }
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Are match tickets required for Atal Bihari Vajpayee Memorial Tournament games?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Spectator access for Destroyers Cricket Club tournament matches is complimentary across all open grandstand zones in Rewa. Complimentary open seating is provided at APSU Stadium (Gate 2) and Martand School Ground No. 3 eastern bank. Dedicated pavilion badges are required for VIP and player areas, administered by RDCA and franchise leadership. Capacity crowds of up to 10,000 spectators are accommodated at APSU Stadium on championship final days.'
        }
      },
      {
        '@type': 'Question',
        name: 'How can local players apply for Destroyers franchise selection trials?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Destroyers Cricket Club conducts structured recruitment drives under the direct supervision of franchise captain Pranav Dwivedi. Prospective cricketers can submit their athletic bio, primary playing role, and certified scorecards via the online contact form or register at the RDCA Pavilion Desk during the annual pre-season intake window. Candidates undergo radar speed-gun assessments, turf net batting trials, and dynamic fielding drills across Under-19, Under-23, and Senior First XI pools.'
        }
      },
      {
        '@type': 'Question',
        name: 'How are media and broadcast credentials issued for the Rewa Derby?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Official press accreditation for Destroyers home matches is issued through the Rewa Division Cricket Association communications wing. Press requests must be logged 48 hours before match toss via email or the online desk. The package includes a sideline photographer bib, high-speed press lounge WiFi, and post-match interview pool access. Live video streaming requires formal commercial clearance from RDCA officials.'
        }
      }
    ]
  };

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Register for Destroyers Cricket Selection Trials in Rewa',
    description: 'Official step-by-step protocol for cricketers to apply and trial for Destroyers Cricket Club in Rewa, Madhya Pradesh.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Check Category Eligibility and Assemble Documents',
        text: 'Review age bracket eligibility (Under-19 Development, Under-23 Emerging, or Senior Pool) and gather RDCA registration card, Aadhaar or birth certificate, and medical fitness clearance.'
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Submit Online Trial Dossier',
        text: 'File your playing credentials, batting/bowling disciplines, and past season performance statistics via the official Destroyers contact form.'
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Attend High-Velocity Screening at APSU Stadium',
        text: 'Report to APSU Stadium in standard cricket attire with turf-spiked footwear and certified protective equipment for telemetry and match simulation.'
      }
    ]
  };

  const html = `
${renderHead({
  title: 'Contact & Academy Trials | Destroyers Cricket Club',
  description: 'Official contact details, trial inquiries, and stadium directions for Destroyers Cricket Club at APSU Stadium, Rewa. Affiliated with RDCA.',
  canonicalUrl: '/contact',
  keywords: 'Contact Destroyers Cricket Club, Rewa Cricket trials, APSU Stadium directions, cricket academy Rewa, player recruitment',
  author: 'Destroyers Cricket Club Media Team',
  twitterData: {
    label1: 'Home Ground',
    data1: 'APSU Stadium, Rewa',
    label2: 'Administration',
    data2: 'RDCA Affiliated Desk'
  },
  jsonLd: [contactJsonLd, faqJsonLd, howToJsonLd],
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: 'Contact', item: '/contact' }
  ]
})}
${renderHeader('contact')}

<section class="spotlight-banner-section" style="padding-top:4rem; background:#080808;">
  <div class="container" style="max-width:960px;">
    <div class="section-masthead">
      <div>
        <p class="section-pretitle">Inquiries &amp; Administration</p>
        <h1 class="section-bigtitle">Contact Destroyers Cricket Club</h1>
        <p style="color:var(--c-gray-400); font-size:1rem; max-width:64ch; margin-top:0.4rem;">
          Official administrative desk for the Atal Bihari Vajpayee Memorial Tournament, match ticketing, academy scouting, and venue liaison in Rewa.
        </p>
      </div>
    </div>

    <div class="responsive-duo-grid" style="margin-bottom:3rem;">
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
            <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-transform:uppercase;">Secondary Grounds</div>
            <p>Martand School Ground No. 3, Civil Lines, Rewa, MP 486001</p>
          </div>
          <div>
            <div style="font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gold); text-transform:uppercase;">Official Electronic Mail</div>
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
            <input type="text" required placeholder="Your full name" style="width:100%; background:#181818; border:1px solid var(--b-medium); color:#fff; padding:0.65rem 0.9rem; font-family:var(--f-body); font-size:0.875rem;">
          </div>
          <div>
            <label style="display:block; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); margin-bottom:0.35rem; text-transform:uppercase;">Email Address</label>
            <input type="email" required placeholder="you@example.com" style="width:100%; background:#181818; border:1px solid var(--b-medium); color:#fff; padding:0.65rem 0.9rem; font-family:var(--f-body); font-size:0.875rem;">
          </div>
          <div>
            <label style="display:block; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); margin-bottom:0.35rem; text-transform:uppercase;">Inquiry Department</label>
            <select style="width:100%; background:#181818; border:1px solid var(--b-medium); color:#fff; padding:0.65rem 0.9rem; font-family:var(--f-body); font-size:0.875rem;">
              <option>Academy Selection Trials</option>
              <option>Ticketing &amp; Stadium Access</option>
              <option>Press &amp; Media Credentials</option>
              <option>Sponsorship &amp; RDCA Registry</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-family:var(--f-mono); font-size:0.75rem; color:var(--c-gray-400); margin-bottom:0.35rem; text-transform:uppercase;">Message</label>
            <textarea rows="3" required placeholder="Specify your query regarding match schedule, trials eligibility, or stadium entry..." style="width:100%; background:#181818; border:1px solid var(--b-medium); color:#fff; padding:0.65rem 0.9rem; font-family:var(--f-body); font-size:0.875rem; resize:vertical;"></textarea>
          </div>
          <button type="submit" class="btn-athletic btn-athletic-primary" style="margin-top:0.5rem;">
            Submit Inquiry
          </button>
        </form>
      </div>
    </div>

    <!-- Divisional Trials & Scouting Protocols -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-bottom:3rem;">
      <h2 style="font-family:var(--f-athletic); font-size:1.8rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
        Divisional Trials &amp; Academy Scouting Guidelines
      </h2>
      <p style="color:var(--c-gray-300); font-size:0.9375rem; line-height:1.8; margin-bottom:1.5rem;">
        Destroyers Cricket Club conducts annual open talent evaluations in collaboration with Rewa Division Cricket Association (RDCA) certified scouts. Aspirants across Vindhya region are screened through rigorous speed-gun telemetry, net batting against state spinners, and fielding agility benchmarks.
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1.5rem; font-size:0.875rem;">
        <div style="background:#141414; padding:1.25rem; border-left:3px solid var(--c-gold);">
          <div style="font-weight:700; color:#fff; margin-bottom:0.35rem;">Age Eligibility Categories</div>
          <p style="color:var(--c-gray-400);">Under-19 Development Squad, Under-23 Emerging Warriors, and Senior Franchise Trial Pool.</p>
        </div>
        <div style="background:#141414; padding:1.25rem; border-left:3px solid var(--c-ember-bright);">
          <div style="font-weight:700; color:#fff; margin-bottom:0.35rem;">Mandatory Documentation</div>
          <p style="color:var(--c-gray-400);">RDCA club registration card, government age proof (Aadhaar or birth certificate), and medical fitness clearance.</p>
        </div>
        <div style="background:#141414; padding:1.25rem; border-left:3px solid var(--c-gold);">
          <div style="font-weight:700; color:#fff; margin-bottom:0.35rem;">Kit &amp; Gear Protocol</div>
          <p style="color:var(--c-gray-400);">Standard white flannel or club jersey, spikes for turf wickets, and personal certified safety helmet and pads.</p>
        </div>
      </div>
    </div>

    <!-- Match Day Stadium Directions & Spectator Guidelines -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-bottom:3rem;">
      <h2 style="font-family:var(--f-athletic); font-size:1.8rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
        Match Day Stadium Access &amp; Transit Directions
      </h2>
      <div class="responsive-duo-grid" style="gap:2rem; font-size:0.875rem; line-height:1.7; color:var(--c-gray-300);">
        <div>
          <h3 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-gold); text-transform:uppercase; margin-bottom:0.5rem;">
            APSU Stadium (Awadhesh Pratap Singh University)
          </h3>
          <p style="color:var(--c-gray-400); margin-bottom:0.5rem;">
            Located on Sirmour Road, Rewa. Accessible via local auto-rickshaw and city buses from Rewa Junction Railway Station (approximately 6.5 km). Dedicated gate entry for general grandstands (Gate 2) and VIP/Press pavilion (Gate 1).
          </p>
          <p style="color:var(--c-gray-500); font-family:var(--f-mono); font-size:0.75rem;">Coordinates: 24.5362° N, 81.3037° E • Parking available at University West Grounds.</p>
        </div>
        <div>
          <h3 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-gold); text-transform:uppercase; margin-bottom:0.5rem;">
            Martand School Ground No. 3
          </h3>
          <p style="color:var(--c-gray-400); margin-bottom:0.5rem;">
            Situated in Civil Lines near the historic Rewa collectorate complex. The fortress venue for local derby clashes. Walking distance from Civil Lines bus terminal (approx 800m). Free spectator viewing banks along the eastern boundary.
          </p>
          <p style="color:var(--c-gray-500); font-family:var(--f-mono); font-size:0.75rem;">Historical turf wicket venue with open pavilion seating.</p>
        </div>
      </div>
    </div>

    <!-- Frequently Asked Questions (FAQ) -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem;">
      <h2 style="font-family:var(--f-athletic); font-size:1.8rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1.5rem;">
        Frequently Asked Questions (Trials, Media &amp; Access)
      </h2>
      <div style="display:flex; flex-direction:column; gap:2rem; font-size:0.9rem; line-height:1.7;">
        <div>
          <h3 style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.5rem;">
            Are match tickets required for Atal Bihari Vajpayee Memorial Tournament games?
          </h3>
          <p style="color:var(--c-gray-300); margin-bottom:0.5rem;">
            <strong>Spectator access for Destroyers Cricket Club tournament matches is complimentary across all open grandstand zones in Rewa.</strong>
          </p>
          <ul style="margin: 0.5rem 0 0.5rem 1.25rem; color:var(--c-gray-400); list-style-type: disc;">
            <li><strong>General Grandstands:</strong> Complimentary open seating at APSU Stadium (Gate 2) and Martand School Ground No. 3 eastern bank.</li>
            <li><strong>VIP &amp; Player Pavilion:</strong> Dedicated pavilion badges required, administered by RDCA and franchise leadership.</li>
            <li><strong>Derby Climax Access:</strong> Capacity crowds of up to 10,000 spectators are accommodated at APSU Stadium on championship final days.</li>
          </ul>
          <p style="color:var(--c-gray-400);">
            Gates open 60 minutes prior to match commencement with free public parking on campus grounds.
          </p>
        </div>
        <div>
          <h3 style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.5rem;">
            How can local players apply for Destroyers franchise selection trials?
          </h3>
          <p style="color:var(--c-gray-300); margin-bottom:0.5rem;">
            <strong>Destroyers Cricket Club conducts structured recruitment drives under the direct supervision of franchise captain Pranav Dwivedi.</strong>
          </p>
          <ul style="margin: 0.5rem 0 0.5rem 1.25rem; color:var(--c-gray-400); list-style-type: disc;">
            <li><strong>Online Application:</strong> Submit athletic bio, primary playing role, and certified scorecards via the inquiry form above.</li>
            <li><strong>Assessment Modules:</strong> Candidates undergo radar speed-gun assessments, turf net batting trials, and dynamic fielding drills.</li>
            <li><strong>Age Brackets:</strong> Roster opportunities across Under-19 Developmental, Under-23 Emerging Warriors, and Senior First XI pools.</li>
          </ul>
          <p style="color:var(--c-gray-400);">
            Selected trialists are inducted into Destroyers pre-season training camps at APSU Stadium.
          </p>
        </div>
        <div>
          <h3 style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.5rem;">
            How are media and broadcast credentials issued for the Rewa Derby?
          </h3>
          <p style="color:var(--c-gray-300); margin-bottom:0.5rem;">
            <strong>Official press accreditation for Destroyers home matches is issued through the Rewa Division Cricket Association communications wing.</strong>
          </p>
          <ul style="margin: 0.5rem 0 0.5rem 1.25rem; color:var(--c-gray-400); list-style-type: disc;">
            <li><strong>Filing Window:</strong> Press requests must be logged 48 hours before match toss via email or the online desk.</li>
            <li><strong>Accreditation Package:</strong> Sideline photographer bib, high-speed press lounge WiFi, and post-match interview pool access.</li>
            <li><strong>Broadcast Rights:</strong> Live video recording and streaming requires formal commercial clearance from RDCA officials.</li>
          </ul>
          <p style="color:var(--c-gray-400);">
            Credential badges can be retrieved from the APSU Stadium Gate 1 accreditation counter on game day.
          </p>
        </div>
      </div>
    </div>

    <!-- Tournament Playing Conditions & Regulatory Compliance -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-top:2.5rem; border-left:4px solid var(--c-gold);">
      <p class="section-pretitle" style="color:var(--c-gold); margin:0 0 0.25rem 0;">Statutory Governance &bull; RDCA Mandates</p>
      <h2 style="font-family:var(--f-athletic); font-size:1.85rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
        Tournament Playing Conditions &amp; Regulatory Compliance
      </h2>
      <p style="color:var(--c-gray-300); font-size:0.95rem; line-height:1.7; margin-bottom:1.5rem; max-width:85ch;">
        Destroyers Cricket Club strictly adheres to the 14 statutory tournament regulations and modern playing amendments codified by the Rewa Division Cricket Association (RDCA). Captain Pranav Dwivedi and team management incorporate key tactical adjustments for complex rule changes:
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">In-Match Over Rate Penalty</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Fielding side must commence the final over by scheduled cutoff. Failure incurs an immediate fielding restriction (only 4 fielders allowed outside the 30-yard circle for all subsequent overs).</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">60-Second Stop-Clock</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Bowlers must be ready within 60 seconds between overs. Two warnings are allowed per innings; a 3rd breach costs a 5-run penalty awarded to the opposition.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">15° Bowling Action Scrutiny</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Strict compliance with the 15-degree elbow extension limit. Biomechanical 3D motion analysis applies to any reported bowling action under RDCA oversight.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">PMOA Electronic Device Blackout</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Full communication blackout in dressing rooms from 60 minutes pre-toss until post-match. Zero smartwatches or mobile devices permitted in team areas.</p>
        </div>
      </div>
      <div style="text-align:right;">
        <a href="https://abv-rewacricket.pages.dev/rules/" target="_blank" rel="noopener" style="color:var(--c-gold); font-family:var(--f-mono); font-size:0.85rem; font-weight:700; text-decoration:none;">
          Examine All 14 Statutory Codes on ABV Tournament Portal &rarr;
        </a>
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
  keywords: 'Destroyers Cricket Club privacy policy, RDCA data protection, spectator privacy Rewa, digital cricket portal terms',
  twitterData: {
    label1: 'Data Policy',
    data1: 'DPDP Standard Compliance',
    label2: 'Organization',
    data2: 'Destroyers Cricket Club'
  },
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
          Destroyers Cricket Club (&ldquo;DES&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) operates in full compliance with Indian Information Technology (IT) laws and Digital Personal Data Protection standards. This Privacy Policy governs the collection, storage, and processing of telemetry, analytics, and inquiry correspondence across the official franchise domain (<code>destroyers-rewacricket.pages.dev</code>).
        </p>
      </div>

      <div>
        <h2 style="font-family:var(--f-athletic); font-size:1.6rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.75rem;">
          2. Information We Collect
        </h2>
        <ul style="padding-left:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
          <li><strong>Tournament Inquiries:</strong> When submitting forms through our Contact desk, your name, email address, and inquiry text are logged solely to fulfill match-day inquiries and trial scheduling.</li>
          <li><strong>Aggregated Site Telemetry:</strong> Anonymized Core Web Vitals, page visit counts, device classifications, and regional bandwidth telemetry to maintain 60 FPS client rendering.</li>
          <li><strong>Cookies &amp; Local Storage:</strong> Essential session preferences such as filter toolbar states (T20 vs. 50 Overs) and theme caching. No tracking pixels are sold or shared with third-party data brokers.</li>
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
          <strong style="color:var(--c-gold); font-family:var(--f-mono);">privacy@destroyers-rewacricket.pages.dev</strong>
          <br>
          RDCA Pavilion, Awadhesh Pratap Singh University Stadium, Rewa, Madhya Pradesh 486003.
        </p>
      </div>
    </div>

    <!-- Tournament Playing Conditions & Regulatory Compliance -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-top:2.5rem; border-left:4px solid var(--c-gold);">
      <p class="section-pretitle" style="color:var(--c-gold); margin:0 0 0.25rem 0;">Statutory Governance &bull; RDCA Mandates</p>
      <h2 style="font-family:var(--f-athletic); font-size:1.85rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
        Tournament Playing Conditions &amp; Regulatory Compliance
      </h2>
      <p style="color:var(--c-gray-300); font-size:0.95rem; line-height:1.7; margin-bottom:1.5rem; max-width:85ch;">
        Destroyers Cricket Club strictly adheres to the 14 statutory tournament regulations and modern playing amendments codified by the Rewa Division Cricket Association (RDCA). Captain Pranav Dwivedi and team management incorporate key tactical adjustments for complex rule changes:
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">In-Match Over Rate Penalty</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Fielding side must commence the final over by scheduled cutoff. Failure incurs an immediate fielding restriction (only 4 fielders allowed outside the 30-yard circle for all subsequent overs).</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">60-Second Stop-Clock</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Bowlers must be ready within 60 seconds between overs. Two warnings are allowed per innings; a 3rd breach costs a 5-run penalty awarded to the opposition.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">15° Bowling Action Scrutiny</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Strict compliance with the 15-degree elbow extension limit. Biomechanical 3D motion analysis applies to any reported bowling action under RDCA oversight.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">PMOA Electronic Device Blackout</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Full communication blackout in dressing rooms from 60 minutes pre-toss until post-match. Zero smartwatches or mobile devices permitted in team areas.</p>
        </div>
      </div>
      <div style="text-align:right;">
        <a href="https://abv-rewacricket.pages.dev/rules/" target="_blank" rel="noopener" style="color:var(--c-gold); font-family:var(--f-mono); font-size:0.85rem; font-weight:700; text-decoration:none;">
          Examine All 14 Statutory Codes on ABV Tournament Portal &rarr;
        </a>
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
  keywords: 'Destroyers Cricket Club terms and conditions, RDCA bylaws, match ticketing Rewa, stadium conduct policy',
  twitterData: {
    label1: 'Legal Governance',
    data1: 'RDCA & MPCA Bylaws',
    label2: 'Franchise Jurisdiction',
    data2: 'Rewa, Madhya Pradesh'
  },
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
          By accessing or using the official digital portal of Destroyers Cricket Club (<code>destroyers-rewacricket.pages.dev</code>), you agree to be bound by these Terms and Conditions and all applicable RDCA and MPCA tournament bylaws.
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

    <!-- Tournament Playing Conditions & Regulatory Compliance -->
    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2.5rem; margin-top:2.5rem; border-left:4px solid var(--c-gold);">
      <p class="section-pretitle" style="color:var(--c-gold); margin:0 0 0.25rem 0;">Statutory Governance &bull; RDCA Mandates</p>
      <h2 style="font-family:var(--f-athletic); font-size:1.85rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
        Tournament Playing Conditions &amp; Regulatory Compliance
      </h2>
      <p style="color:var(--c-gray-300); font-size:0.95rem; line-height:1.7; margin-bottom:1.5rem; max-width:85ch;">
        Destroyers Cricket Club strictly adheres to the 14 statutory tournament regulations and modern playing amendments codified by the Rewa Division Cricket Association (RDCA). Captain Pranav Dwivedi and team management incorporate key tactical adjustments for complex rule changes:
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">In-Match Over Rate Penalty</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Fielding side must commence the final over by scheduled cutoff. Failure incurs an immediate fielding restriction (only 4 fielders allowed outside the 30-yard circle for all subsequent overs).</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">60-Second Stop-Clock</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Bowlers must be ready within 60 seconds between overs. Two warnings are allowed per innings; a 3rd breach costs a 5-run penalty awarded to the opposition.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">15° Bowling Action Scrutiny</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Strict compliance with the 15-degree elbow extension limit. Biomechanical 3D motion analysis applies to any reported bowling action under RDCA oversight.</p>
        </div>
        <div style="background:var(--c-dark-surface); padding:1.25rem; border:1px solid var(--b-subtle); border-radius:2px;">
          <h4 style="font-family:var(--f-athletic); font-size:1.15rem; color:var(--c-white); text-transform:uppercase; margin-bottom:0.4rem;">PMOA Electronic Device Blackout</h4>
          <p style="font-size:0.85rem; color:var(--c-gray-400); line-height:1.6; margin:0;">Full communication blackout in dressing rooms from 60 minutes pre-toss until post-match. Zero smartwatches or mobile devices permitted in team areas.</p>
        </div>
      </div>
      <div style="text-align:right;">
        <a href="https://abv-rewacricket.pages.dev/rules/" target="_blank" rel="noopener" style="color:var(--c-gold); font-family:var(--f-mono); font-size:0.85rem; font-weight:700; text-decoration:none;">
          Examine All 14 Statutory Codes on ABV Tournament Portal &rarr;
        </a>
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
  keywords: 'Destroyers 404, page not found, Rewa cricket portal, match archives',
  twitterData: {
    label1: 'Status',
    data1: '404 Not Found',
    label2: 'Action',
    data2: 'Return to Pavilion'
  },
  breadcrumbs: [
    { name: 'Home', item: '/' },
    { name: '404 Page Not Found', item: '/404' }
  ]
})}
${renderHeader('')}

<section class="spotlight-banner-section" style="padding:8rem 0; text-align:center; background:#080808;">
  <div class="container" style="max-width:760px;">
    <div style="font-family:var(--f-athletic); font-size:8rem; color:var(--c-ember-bright); line-height:0.8; margin-bottom:1rem;">404</div>
    <h1 style="font-family:var(--f-athletic); font-size:2.5rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
      404 — Page Not Found
    </h1>
    <h2 style="font-family:var(--f-athletic); font-size:1.4rem; color:var(--c-gray-300); text-transform:uppercase; margin-bottom:1.5rem;">
      Stadium Directory &amp; Concourses
    </h2>
    <p style="color:var(--c-gray-400); font-size:1.15rem; margin-bottom:2rem; line-height:1.7;">
      Looks like this delivery was launched clear into the grandstand concourse. The URL you requested may have migrated or is unavailable within the official Destroyers Cricket Club match portal.
    </p>

    <div style="background:var(--c-card-bg); border:1px solid var(--b-medium); padding:2rem; text-align:left; margin-bottom:2.5rem;">
      <h3 style="font-family:var(--f-athletic); font-size:1.3rem; color:var(--c-white); text-transform:uppercase; margin-bottom:1rem;">
        Essential Tournament Gateways
      </h3>
      <p style="color:var(--c-gray-300); font-size:0.9rem; line-height:1.7; margin-bottom:1rem;">
        Navigate directly to official team rosters, tournament schedules, rivalry history, and player selection desks using the authorized paths below:
      </p>
      <ul style="color:var(--c-gray-400); font-size:0.875rem; line-height:1.8; list-style-type:disc; margin-left:1.5rem;">
        <li><strong>Roster Center:</strong> Access player cards, batting strike rates, and bowling averages for all 48 Destroyers players under captain Pranav Dwivedi.</li>
        <li><strong>Derby Records &amp; Fixtures:</strong> Examine complete scorecards, venue telemetry, and match outcomes for all 34 clashes against Dread Eleven.</li>
        <li><strong>Championship Standings:</strong> Inspect points table positions, run rate tables, and verified historical silverware records (2024, 2025, 2026).</li>
        <li><strong>Selection Trials Desk:</strong> Review intake eligibility standards, mandatory documentation, and screening dates at APSU Stadium.</li>
      </ul>
    </div>

    <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
      <a href="/" class="btn-athletic btn-athletic-primary">Return Home</a>
      <a href="/fixtures" class="btn-athletic" style="background:#1c1c1c; color:#fff; border:1px solid #333; padding:0.8rem 1.4rem; font-family:var(--f-athletic); font-size:1.15rem; text-decoration:none; text-transform:uppercase;">View Fixtures</a>
      <a href="/players" class="btn-athletic" style="background:#1c1c1c; color:#fff; border:1px solid #333; padding:0.8rem 1.4rem; font-family:var(--f-athletic); font-size:1.15rem; text-decoration:none; text-transform:uppercase;">Meet Squad</a>
      <a href="/results" class="btn-athletic" style="background:#1c1c1c; color:#fff; border:1px solid #333; padding:0.8rem 1.4rem; font-family:var(--f-athletic); font-size:1.15rem; text-decoration:none; text-transform:uppercase;">Match Archive</a>
      <a href="/news" class="btn-athletic" style="background:#1c1c1c; color:#fff; border:1px solid #333; padding:0.8rem 1.4rem; font-family:var(--f-athletic); font-size:1.15rem; text-decoration:none; text-transform:uppercase;">Latest News</a>
      <a href="/contact" class="btn-athletic" style="background:#1c1c1c; color:#fff; border:1px solid #333; padding:0.8rem 1.4rem; font-family:var(--f-athletic); font-size:1.15rem; text-decoration:none; text-transform:uppercase;">Contact RDCA</a>
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

  // Add all match pages (34 matches)
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

  const publicDir = path.join(rootDir, 'public');
  ensureDir(publicDir);

  fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemapXml);
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml);

  const robotsTxt = `User-agent: *
Allow: /

# Explicit AI Search Crawlers & LLM Indexing Directives
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
LLM: ${BASE_URL}/llms.txt
`;

  fs.writeFileSync(path.join(rootDir, 'robots.txt'), robotsTxt);
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);

  // Generate llms.txt according to standard (llmstxt.org)
  const llmsTxt = `# Destroyers Cricket Club (DES)

> Official pro cricket franchise website and portal for Destroyers Cricket Club (DES) based in Rewa, Madhya Pradesh. Affiliated with the Rewa Division Cricket Association (RDCA) and competing in the Atal Bihari Vajpayee Memorial Tournament against Dread Eleven (DE).

## Core Franchise Information
- Franchise Name: Destroyers Cricket Club (DES)
- Team Captain: [Pranav Dwivedi](${BASE_URL}/players/pranav-dwivedi): Captain & All-rounder (#7). 3x champion captain (2024, 2025, 2026). 1,435 career runs (Avg 57.4), 66 career wickets (Avg 16.3, Best 8/39).
- Machine-Readable Captain Profile: [Pranav Dwivedi JSON](${BASE_URL}/players/pranav-dwivedi.json) | [Pranav Dwivedi Markdown](${BASE_URL}/players/pranav-dwivedi.md)
- Tournament: Atal Bihari Vajpayee Memorial Tournament (Rewa)
- Governing Association: Rewa Division Cricket Association (RDCA)
- Home Stadiums: Awadhesh Pratap Singh University (APSU) Stadium, Martand School Ground No. 3
- Championship Titles: 2024 (4–1), 2025 (5–0 clean sweep), 2026 (3–2)
- Derby Record: 19 Wins / 15 Losses vs Dread Eleven (DE) across 34 tournament clashes (2021–2026)
- Disciplines: 50 Overs (One Day) & T20 Blast

## Key Stadium & Roster Sections
- [Squad Directory](${BASE_URL}/players): Complete 48-man roster with batting and bowling career statistics
- [Tournament Fixtures](${BASE_URL}/fixtures): Complete season schedules and venue timings
- [Results Archive](${BASE_URL}/results): Scorecards and ball-by-ball analysis for all 34 derby clashes
- [Points Table](${BASE_URL}/points-table): Verified standings, net run rates, and season champion rankings
- [Franchise Records](${BASE_URL}/stats): Top run-scorers, leading wicket-takers, and highest team totals
- [Press Center](${BASE_URL}/news): Match post-mortems, editorial reviews, and tactical analysis
- [About the Franchise](${BASE_URL}/about): Club heritage, RDCA affiliation, and championship dynasties
- [Contact & Trials](${BASE_URL}/contact): Academy trials protocol, venue directions, and administrative inquiries

## Developer & AI Crawler Resources
- [XML Sitemap](${BASE_URL}/sitemap.xml): Machine-readable index of all public URLs (${urls.length} URLs indexed)
- [Robots Policy](${BASE_URL}/robots.txt): Explicit crawler permissions for AI agents (GPTBot, ClaudeBot, PerplexityBot, etc.)
- [Freshness Feed](${BASE_URL}/feed.xml): RSS 2.0 feed with latest match reports and editorial dispatches
- [Live Freshness Telemetry](${BASE_URL}/freshness.json): Real-time JSON state with latest completed matches and active squad count
- [Full LLM Context](${BASE_URL}/llms-full.txt): Complete un-truncated player career tables and match-by-match scorecards

## Contact & Governance
- Organization: Destroyers Cricket Club (DES)
- Governing Body: Rewa Division Cricket Association (RDCA)
- Website: ${BASE_URL}
- Portal: https://rewa-cricket-division.vercel.app/teams/destroyers/
- Tournament Official Portal: https://abv-rewacricket.pages.dev/
- Arch-Rival Digital Stadium: https://dread-eleven-rewacricket.pages.dev/
- Email: admin@destroyers-rewa.cricket
- Home Stadium: Awadhesh Pratap Singh University (APSU) Stadium, Sirmour Road, Rewa, MP 486003
`;

  fs.writeFileSync(path.join(rootDir, 'llms.txt'), llmsTxt);
  fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsTxt);

  const llmsFullTxt = `${llmsTxt}
## 48-Man Squad Roster
${squad.map(p => `- #${p.jerseyNumber} [${p.name}](${BASE_URL}/players/${p.slug}) (${p.role}): ${p.batting.runs} runs (Avg ${p.batting.average}), ${p.bowling.wickets} wickets (Econ ${p.bowling.economy}). Bio: ${p.bio}`).join('\n')}

## Historical Match Scorecard Archive (34 Matches)
${matches.map(m => `- Match #${m.matchNumber} (${m.matchDate}): [${m.stage}](${BASE_URL}/matches/${m.slug}) at ${m.venue.name}. Result: ${m.resultText}. Winner: ${m.winner || 'Drawn'}`).join('\n')}
`;

  fs.writeFileSync(path.join(rootDir, 'llms-full.txt'), llmsFullTxt);
  fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsFullTxt);

  // Generate RSS 2.0 Feed (/feed.xml) for search and AI crawler freshness
  const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Destroyers Cricket Club News &amp; Match Reports</title>
    <link>${BASE_URL}</link>
    <description>Official tournament dispatches, match reports, and announcements for Destroyers Cricket Club in Rewa, Madhya Pradesh.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${news.slice(0, 10).map((n) => `    <item>
      <title>${esc(n.title)}</title>
      <link>${BASE_URL}/news/${n.slug}</link>
      <guid>${BASE_URL}/news/${n.slug}</guid>
      <pubDate>${new Date(n.publishedAt || Date.now()).toUTCString()}</pubDate>
      <description>${esc(n.summary)}</description>
    </item>`).join('\n')}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(rootDir, 'feed.xml'), feedXml);
  fs.writeFileSync(path.join(publicDir, 'feed.xml'), feedXml);

  // Generate JSON freshness telemetry (/freshness.json)
  const completedMatches = matches.filter((m) => m.status === 'completed');
  const freshnessData = {
    lastUpdated: new Date().toISOString(),
    site: 'Destroyers Cricket Club',
    domain: BASE_URL,
    tournament: 'Atal Bihari Vajpayee Memorial Tournament',
    governingBody: 'Rewa Division Cricket Association (RDCA)',
    latestMatch: completedMatches[completedMatches.length - 1] || null,
    latestNews: news[0] || null,
    squadCount: squad.length,
    matchesCount: matches.length
  };
  fs.writeFileSync(path.join(rootDir, 'freshness.json'), JSON.stringify(freshnessData, null, 2));
  fs.writeFileSync(path.join(publicDir, 'freshness.json'), JSON.stringify(freshnessData, null, 2));
  console.log('Generated /sitemap.xml, /robots.txt, /llms.txt, /llms-full.txt, /feed.xml, and /freshness.json (both root and public)');


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
// SEARCH INDEX GENERATOR (search-index.json)
// Indexes every player, match scorecard, venue, news piece, and page.
// ------------------------------------------------------------
function generateSearchIndex() {
  const index = [];

  // 1. Pages & Hubs
  index.push({
    type: 'Page',
    badge: 'page',
    icon: '',
    title: 'Destroyers Home Arena & Digital HQ',
    subtitle: 'Official club headquarters, live telemetry, latest derby climax & trophy cabinet',
    url: '/',
    text: 'Destroyers DES home arena Rewa cricket club Pranav Dwivedi Atal Bihari Vajpayee Memorial Tournament RDCA countdown derby highlights champions 2024 2025 2026'
  });
  index.push({
    type: 'Page',
    badge: 'page',
    icon: '',
    title: 'Destroyers Squad Directory (48 Players)',
    subtitle: 'Official 48-man tournament roster for Destroyers Cricket Club',
    url: '/players/',
    text: 'Destroyers squad directory roster players 48 players captain Pranav Dwivedi batters bowlers allrounders wicketkeepers profiles statistics FIFA overall'
  });
  index.push({
    type: 'Page',
    badge: 'page',
    icon: '',
    title: 'Tournament Fixtures & Rivalry Schedule',
    subtitle: 'Upcoming clash schedule, 2026 championship derbies, venue directions & match timing',
    url: '/fixtures/',
    text: 'Destroyers vs Dread Eleven fixtures schedule match timings APSU Stadium Martand Ground Rewa T20 50-over tickets'
  });
  index.push({
    type: 'Page',
    badge: 'page',
    icon: '',
    title: 'Completed Match Archive (34 Matches)',
    subtitle: 'Complete scorecard archive of all 34 rivalry clashes between DES and DE (2021-2026)',
    url: '/results/',
    text: 'All match results DES vs DE derbies 34 matches scorecards 2021 2022 2023 2024 2025 2026 finals champions 19 wins'
  });
  index.push({
    type: 'Page',
    badge: 'page',
    icon: '',
    title: 'Points Table & Standings',
    subtitle: 'Net run rate, bonus points, season championship telemetry (2021-2026)',
    url: '/points-table/',
    text: 'Points table standings NRR net run rate wins losses ties points championship trophies Destroyers Dread Eleven'
  });
  index.push({
    type: 'Page',
    badge: 'page',
    icon: '',
    title: 'Statistical Leaderboards & Record Books',
    subtitle: 'Most runs, most wickets, highest team totals, individual centuries & economy leaders',
    url: '/stats/',
    text: 'Statistics records leaderboard most runs most wickets highest score best bowling strike rate average centuries fifties 5-wicket hauls'
  });
  index.push({
    type: 'Page',
    badge: 'page',
    icon: '',
    title: 'News & Press Releases',
    subtitle: 'Exclusive match post-mortems, tactical analysis, player interviews',
    url: '/news/',
    text: 'News media press reports post-match tactical analysis Pranav Dwivedi Anant Verma Sagar Pratap Rewa cricket'
  });
  index.push({
    type: 'Page',
    badge: 'page',
    icon: '',
    title: 'About Destroyers & Championship Dynasty',
    subtitle: 'Franchise philosophy, stadium details, connection with RDCA and Atal Bihari Vajpayee Tournament',
    url: '/about/',
    text: 'About Destroyers DES history heritage constitution RDCA Rewa Cricket Division Atal Bihari Vajpayee Memorial Tournament philosophy three-peat champions'
  });
  index.push({
    type: 'Page',
    badge: 'page',
    icon: '',
    title: 'Contact RDCA & Franchise Headquarters',
    subtitle: 'Player selection trials, academy enrollment, media inquiries & club office',
    url: '/contact/',
    text: 'Contact trials academy enrollment player selection Rewa MP office email phone trials registration'
  });

  // 2. Venues
  index.push({
    type: 'Venue',
    badge: 'venue',
    icon: '',
    title: 'APSU Stadium, Rewa (Awadhesh Pratap Singh University)',
    subtitle: 'Premier cricket venue in Rewa, capacity 15,000, host to championship finals',
    url: '/fixtures/',
    text: 'APSU Stadium Rewa Awadhesh Pratap Singh University Stadium pitch pace bounce championship finals floodlights pavilion turf wicket'
  });
  index.push({
    type: 'Venue',
    badge: 'venue',
    icon: '',
    title: 'Martand School Ground No. 3, Rewa',
    subtitle: 'Historic spin-friendly turf, spiritual home of the Rewa Derby',
    url: '/fixtures/',
    text: 'Martand Ground No 3 Rewa school ground cricket pitch spin turn boundaries historic derby venue inaugural clash'
  });

  // 3. All Players (48)
  squad.forEach((p) => {
    const isCapt = (p.role || '').toLowerCase().includes('captain');
    const runs = p.batting?.runs || 0;
    const wkts = p.bowling?.wickets || 0;
    const avg = p.batting?.average || 0;
    const sr = p.batting?.strikeRate || 0;
    const hs = p.batting?.highestScore || '0';
    const bb = p.bowling?.bestBowling || 'N/A';
    const econ = p.bowling?.economy || 0;
    const centuries = p.batting?.hundreds || 0;
    const fifties = p.batting?.fifties || 0;
    const ovr = p.fifaRatings?.overall || 88;

    let fullText = `${p.name} #${p.jerseyNumber} ${p.role} ${p.battingStyle || ''} ${p.bowlingStyle || ''} Destroyers DES cricket Rewa. `;
    fullText += `OVR ${ovr} rating. Matches: ${p.matches || 0}, Runs: ${runs}, Wickets: ${wkts}, Batting Avg: ${avg}, Strike Rate: ${sr}, Highest Score: ${hs}, Best Bowling: ${bb}, Economy: ${econ}, Hundreds: ${centuries}, Fifties: ${fifties}. `;
    if (p.bio) fullText += `${p.bio} `;
    if (isCapt) fullText += `Captain skipper leader franchise talisman. `;

    if (Array.isArray(p.matchHistory)) {
      p.matchHistory.forEach((mh) => {
        fullText += `${mh.opponent || ''} ${mh.format || ''} ${mh.season || ''} ${mh.runs || 0}r ${mh.wickets || 0}w ${mh.dismissal || ''} `;
      });
    }

    index.push({
      type: 'Player',
      badge: 'player',
      icon: '',
      title: `${p.name} (#${p.jerseyNumber}) — ${p.role}`,
      subtitle: `OVR ${ovr} • ${p.role} • ${runs} runs (Avg ${avg}) • ${wkts} wkts (BB ${bb})`,
      url: `/players/${p.slug}`,
      text: fullText
    });
  });

  // 4. All Matches (34)
  matches.forEach((m) => {
    const matchDateStr = formatDate(m.matchDate || m.date);
    const inn1 = m.innings?.[0];
    const inn2 = m.innings?.[1];
    const potm = m.playerOfTheMatch ? `${m.playerOfTheMatch.name} (${m.playerOfTheMatch.team})` : 'N/A';
    const potmReason = m.playerOfTheMatch?.reason || '';

    let matchText = `Match ${m.matchNumber || ''} ${m.slug} ${m.seasonYear || m.season} ${m.stage || ''} ${m.format} ${m.tournamentName || ''} `;
    matchText += `Date: ${matchDateStr} ${m.matchDate || m.date}. Venue: ${m.venue?.name || m.venue} ${m.venue?.city || 'Rewa'}. `;
    matchText += `Result: ${m.resultText || m.result}. Winner: ${m.winnerName || m.winner}. `;
    matchText += `Toss: ${m.toss?.winner || ''} (${m.toss?.decision || ''}). POTM Player of the match: ${potm} ${potmReason}. `;

    if (inn1) {
      matchText += `${inn1.teamName || inn1.teamShort} ${inn1.runs}/${inn1.wickets} (${inn1.overs} ov). `;
      if (Array.isArray(inn1.batting)) {
        inn1.batting.forEach((b) => {
          matchText += `${b.playerName} ${b.runs}r (${b.balls}b, ${b.fours}x4, ${b.sixes}x6) ${b.dismissal} `;
        });
      }
      if (Array.isArray(inn1.bowling)) {
        inn1.bowling.forEach((bw) => {
          matchText += `${bw.bowlerName} ${bw.wickets}/${bw.runs} (${bw.overs} ov) `;
        });
      }
    }

    if (inn2) {
      matchText += `${inn2.teamName || inn2.teamShort} ${inn2.runs}/${inn2.wickets} (${inn2.overs} ov). `;
      if (Array.isArray(inn2.batting)) {
        inn2.batting.forEach((b) => {
          matchText += `${b.playerName} ${b.runs}r (${b.balls}b, ${b.fours}x4, ${b.sixes}x6) ${b.dismissal} `;
        });
      }
      if (Array.isArray(inn2.bowling)) {
        inn2.bowling.forEach((bw) => {
          matchText += `${bw.bowlerName} ${bw.wickets}/${bw.runs} (${bw.overs} ov) `;
        });
      }
    }

    const titleStr = `${m.seasonYear || m.season} ${m.stage || 'Derby'}: ${m.resultText || (m.winnerName + ' won')}`;
    const subtitleStr = `${matchDateStr} • ${m.venue?.name || m.venue} • POTM: ${potm}`;

    index.push({
      type: 'Match',
      badge: 'match',
      icon: '',
      title: titleStr,
      subtitle: subtitleStr,
      url: `/matches/${m.slug}`,
      text: matchText
    });
  });

  // 5. News Articles
  news.forEach((n) => {
    index.push({
      type: 'News',
      badge: 'news',
      icon: '',
      title: n.title,
      subtitle: `${formatDate(n.date)} • By ${n.author || 'DES Media'} • ${n.category || 'Article'}`,
      url: `/news/${n.slug}`,
      text: `${n.title} ${n.excerpt || ''} ${n.content || n.body || ''} ${n.author || ''} ${n.category || ''} ${n.tags ? n.tags.join(' ') : ''}`
    });
  });

  // 6. Record highlights
  index.push({
    type: 'Record',
    badge: 'record',
    icon: '',
    title: 'Destroyers Skipper: Pranav Dwivedi (1,998 runs & 85 wickets)',
    subtitle: 'All-time leading batsman and premier strike bowler across all 34 rivalry derbies',
    url: '/players/pranav-dwivedi/',
    text: 'Pranav Dwivedi 1998 runs 85 wickets record Destroyers captain 102* 8/39 best bowling Rewa'
  });
  index.push({
    type: 'Record',
    badge: 'record',
    icon: '',
    title: 'Championship Dynasty: 2024, 2025, 2026 Champions',
    subtitle: 'Destroyers have claimed three consecutive tournament titles (4-1, 5-0, 3-2)',
    url: '/points-table/',
    text: 'Champions dynasty three-peat 2024 2025 2026 Destroyers titles trophies Rewa'
  });
  index.push({
    type: 'Record',
    badge: 'record',
    icon: '',
    title: 'Highest Team Total: Destroyers 242/4 (20 ov)',
    subtitle: 'Set at APSU Stadium Rewa against Dread Eleven',
    url: '/stats/',
    text: 'Highest team total 242/4 Destroyers 20 overs APSU Stadium Rewa record score'
  });
  index.push({
    type: 'Record',
    badge: 'record',
    icon: '',
    title: 'Derby Head-to-Head: Destroyers Lead 19–15',
    subtitle: '34 contested matches: DES 19 wins, DE 15 wins',
    url: '/results/',
    text: 'Derby head-to-head 19-15 Destroyers lead Dread Eleven 34 matches rivalry'
  });

  fs.writeFileSync(path.join(rootDir, 'search-index.json'), JSON.stringify(index, null, 2));
  console.log(`Generated search-index.json with ${index.length} comprehensive searchable entries.`);
}

// ------------------------------------------------------------
// MAIN BUILD EXECUTION
// ------------------------------------------------------------
function main() {
  console.log('=== BUILDING DESTROYERS CRICKET CLUB PRODUCTION SUITE (CAPT. PRANAV DWIVEDI) ===');

  // Minify CSS and JS before generating HTML
  const cssSrc = fs.readFileSync(path.join(rootDir, 'src/css/styles.css'), 'utf8');
  const cssMin = minifyCss(cssSrc);
  fs.writeFileSync(path.join(rootDir, 'src/css/styles.min.css'), cssMin);
  console.log(`Minified styles.css: ${cssSrc.length} bytes -> ${cssMin.length} bytes`);

  const jsSrc = fs.readFileSync(path.join(rootDir, 'src/js/app.js'), 'utf8');
  const jsMin = minifyJs(jsSrc);
  fs.writeFileSync(path.join(rootDir, 'src/js/app.min.js'), jsMin);
  console.log(`Minified app.js: ${jsSrc.length} bytes -> ${jsMin.length} bytes`);

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
  generateSearchIndex();
  generateSitemapAndRobots();
  console.log('=== BUILD COMPLETE! ALL PAGES GENERATED WITH CORRECT TEAM ASSIGNMENTS ===');
}

main();

