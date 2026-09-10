# Destroyers Cricket Club (DES) — Official Team Website
### *Atal Bihari Vajpayee Memorial Tournament • Rewa (RDCA)*

The official team website for **Destroyers Cricket Club (DES)**, competing in the prestigious **Atal Bihari Vajpayee Tournament** in Rewa under the aegis of the **Rewa Division Cricket Association (RDCA)**.

This platform provides an exclusive, high-fidelity archive centered strictly on the **Destroyers** team and their marquee **DE vs DES** rivalry series.

---

##  Highlights & Features

1. **Team-First Identity**:
   - Built exclusively as the digital citadel of **Destroyers (DES)**.
   - Distinctive dark luxury athletic design system with cyber-crimson and champion gold accents.
   - Complete team crest, motto, and Rewa cricket heritage.

2. **Filtered DE vs DES Match Center (24 Matches)**:
   - Contains **only DE vs DES** rivalry matches from the official RDCA database across 4 seasons (2021–2024).
   - **Format Filters**: Instantly switch between *All (24)*, *T20 Series (9)*, and *50-Over ODIs (15)*.
   - **Season Filters**: Filter by *2024*, *2023*, *2022*, and *2021*.
   - **Result Filters**: Filter by *Destroyers Wins (13)* vs *DE Wins (11)*.
   - **Live Search**: Instant keyword search matching players (e.g. *Pranav, Akhil, Venkatesh, Avesh*), margins, venues, and notes.
   - **Sorting Engine**: Sort by *Latest Match*, *Oldest Match*, *Closest Thrillers*, and *Highest Scores*.
   - **View Modes**: Switch between high-impact *Grid Cards* and compact *Scoreboard List*.

3. **Full Interactive Scorecards**:
   - Complete innings breakdown for both teams.
   - Batting scorecard: Batsman, Dismissal method, Runs, Balls, 4s, 6s, and Strike Rate.
   - Bowling scorecard: Bowler, Overs, Maidens, Runs, Wickets, and Economy.
   - Top Performers spotlight per match.

4. **Destroyers Squad & Player Telemetry**:
   - 44 squad members who represented Destroyers in the DE vs DES series.
   - Role filters (*All-rounders*, *Batters*, *Bowlers*, *Wicketkeepers*).
   - **Player Cards & Modals**: Click any player to view their overall stats and complete match-by-match log specifically against DE.
   - Highlighted icons including **Pranav Dwivedi** (1,341 runs, 63 wickets in DE vs DES), **Akhil Mishra** (905 runs, 9 fifties), **Venkatesh Iyer**, **Rajat Patidar**, **Avesh Khan**, **Kuldeep Sen**, and **Kumar Kartikeya**.

5. **Head-to-Head Telemetry**:
   - Overall Record: **13 Wins - 11 Losses** (54.2% Win Rate).
   - T20 Dominance: **7 Wins out of 9 Matches** (77.8% Win Rate).
   - Championship Trophy: **2022 Final Champions** (Defeated DE on 12 August 2022).

6. **Rivalry Hall of Fame & Leaderboards**:
   - All-time top run-getters in DE vs DES clashes.
   - All-time top wicket-takers.
   - Match extremes, highest team totals, and historic best bowling spells (such as Pranav's 8/39 and 102*).

---

##  Quick Start

### Run locally (Zero external dependencies)
```bash
cd /Users/tanutripathi/destroyers-rewa
npm start
# Server runs at http://127.0.0.1:8085
```

Alternatively, simply open `index.html` directly in any web browser.

---

##  Project Structure
```
destroyers-rewa/
├── index.html              # Master Single Page Application
├── package.json            # Node project configuration
├── README.md               # Documentation
├── public/
│   └── favicon.svg         # Team crest icon
├── data/
│   ├── matches.json        # 24 Enriched DE vs DES match scorecards
│   ├── squad.json          # 44 Destroyers squad member profiles & stats
│   └── stats.json          # Head-to-head aggregation & milestones
├── src/
│   ├── css/
│   │   └── styles.css      # Dark luxury athletic design system
│   └── js/
│       ├── data.js         # Embedded data payload for standalone offline use
│       └── app.js          # Reactive filtering, search, modals & UI state
└── scripts/
    └── serve.mjs           # Zero-dependency local development server
```

---

## ️ Context & Tournament Heritage
The **Atal Bihari Vajpayee Memorial Cricket Tournament** is organized under the **Rewa Division Cricket Association (RDCA)** in Rewa, Madhya Pradesh. The **DE vs DES** rivalry serves as the marquee intra-squad series bringing together the finest cricketing talent from Rewa and the Madhya Pradesh state circuit.
