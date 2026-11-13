// Positions for lounges whose own description gives the map nothing to go on.
//
// scripts/build-lounge-positions.mjs pins a lounge to the gate its location
// text names. Many name none — "Central Terminal, mezzanine level" — and for
// those the position was looked up on the web and recorded here, with the
// source, so every claim can be checked and corrected.
//
// Keyed by lounge id. Each entry is one of:
//
//   gate        the gate the source places the lounge at or beside
//   osm         an OpenStreetMap element: the lounge itself, where the name
//               matching missed it, or — with `landmark` — a shop or hall the
//               source places the lounge beside
//   unplaceable the reason no position is given: the lounge has closed, or
//               is not where the catalogue says it is
//
// `source` is where the claim comes from; `note` says briefly what it said.
// Gate and OSM numbers were checked against the airport's OSM data at the
// time of writing (November 2026).

export const ANCHORS = {
  // ------------------------------------------------------------- gates

  'bwi-the-club-bwi-concourse-d-airside-upper-level': {
    gate: 'D10',
    source: 'https://theclubairportlounges.com/lounges/bwi-the-club-concourse-d',
    note: 'After security, head to Gate D10; the lounge is beside the Dunkin’.',
  },
  'dca-capital-one-landing-terminal-2-national-hall-near-concourse-d': {
    gate: 'D36',
    source: 'https://eyeoftheflyer.com/2025/10/20/capital-one-landing-dca-review/',
    note: 'Terminal 2, entered from National Hall by Concourse D; the review’s map places it near Gate D36.',
  },
  'den-capital-one-lounge-concourse-a-mezzanine-level': {
    gate: 'A34',
    source: 'https://upgradedpoints.com/news/capital-one-lounge-denver',
    note: 'Mezzanine level of Concourse A, near Gate A34 (also on flydenver.com).',
  },
  'dfw-admirals-club-terminal-e-satellite-mezzanine-level': {
    gate: 'E22',
    source: 'https://news.aa.com/news/news-details/2019/American-Airlines-Opens-15-New-Gates-at-DFW-Airport/default.aspx',
    note: 'American places the club on the mezzanine of the Terminal E satellite, whose gates are E22–E30; a gate guide puts it by E22.',
  },
  'grr-the-club-grr-concourse-a-level-2': {
    gate: 'A4',
    source: 'https://www.grr.org/blog/the-club-grr',
    note: 'The airport places it between Gates A3 and A5; A4 is not mapped, so the pin falls between them.',
  },
  'hnl-hawaiian-airlines-plumeria-lounge-terminal-1-near-the-gate-14-rotunda': {
    gate: 'A18',
    source: 'https://onemileatatime.com/reviews/hawaiian-airlines-plumeria-lounge-honolulu/',
    note: 'Terminal 1, a floor above the gates by the Wiki Wiki shuttle stop, near Gate A18.',
  },
  'jfk-chelsea-lounge-terminal-8-level-1-after-security': {
    gate: '14',
    source: 'https://www.aa.com/i18n/travelInformation/airportAmenities/jfk-club.html',
    note: 'American lists the Chelsea and Soho lounges above Gate 14 in Terminal 8.',
  },
  'jfk-soho-lounge-terminal-8-level-1-after-security': {
    gate: '14',
    source: 'https://www.aa.com/i18n/travelInformation/airportAmenities/jfk-club.html',
    note: 'American lists the Chelsea and Soho lounges above Gate 14 in Terminal 8.',
  },
  'jfk-greenwich-lounge-terminal-8-level-1-after-security': {
    gate: '12',
    source: 'https://www.aa.com/i18n/travelInformation/airportAmenities/jfk-club.html',
    note: 'American lists the Greenwich Lounge above Gate 12 in Terminal 8.',
  },
  'jfk-virgin-atlantic-clubhouse-terminal-4-upper-level': {
    gate: 'A5',
    source: 'https://upgradedpoints.com/travel/airports/new-york-jfk-airport-lounges/',
    note: 'Terminal 4, Concourse A, above Gate A5.',
  },
  'jfk-chase-sapphire-lounge-by-the-club-terminal-4-upper-level-after-security': {
    gate: 'A2',
    source: 'https://upgradedpoints.com/travel/airports/new-york-jfk-airport-lounges/',
    note: 'Terminal 4 mezzanine above Gate A2, next door to the Centurion Lounge.',
  },
  'jfk-the-centurion-lounge-terminal-4-level-4-beyond-the-tsa-checkpoints': {
    gate: 'A2',
    source: 'https://upgradedpoints.com/travel/airports/new-york-jfk-airport-lounges/',
    note: 'Beside the Chase Sapphire Lounge, which sits on the mezzanine above Gate A2.',
  },
  'las-the-club-las-terminal-3-concourse-e': {
    gate: 'E2',
    source: 'https://liveandletsfly.com/the-club-las-vegas-review/',
    note: 'Terminal 3, Concourse E, opposite Gate E2 (also layoverindex.com/las/lounges).',
  },
  'las-capital-one-lounge-terminal-1-concourse-d-rotunda': {
    gate: 'D50',
    source:
      'https://www.businesstraveller.com/business-travel/2025/02/22/capital-one-opens-lounge-at-las-vegas-harry-reid-international/',
    note: 'Level 2 of the Concourse D atrium, overlooking the rotunda, by Gate D50.',
  },
  'las-chase-sapphire-lounge-by-the-club-terminal-3-concourse-e': {
    gate: 'C23',
    source: 'https://www.chase.com/sapphire-cards/lounges/las',
    note: 'Chase lists it in Terminal 1, near Gate C23 — not Terminal 3, Concourse E as the catalogue says.',
  },
  'lax-delta-one-lounge-terminal-2-mezzanine-level': {
    gate: '23A',
    source: 'https://thepointsguy.com/airline/new-delta-one-lounge-lax-terminal-2/',
    note: 'Opened June 2026 on the Terminal 2 mezzanine, near Gate 23A.',
  },
  'phl-british-airways-galleries-club-terminal-a-west-level-2-after-security': {
    gate: 'A14',
    source: 'https://next.loungebuddy.com/PHL/british-airways-galleries-club-lounge-terminal-a-west-Sl2Q8y7Hat',
    note: 'Terminal A West, near Gate A14, beside the Centurion Lounge.',
  },
  'phl-admirals-club-terminal-b-c-connector-third-floor': {
    gate: 'B2',
    source: 'https://luxebeatmag.com/wp-content/uploads/2015/01/Luxe-Layovers-PHL.pdf',
    note: 'Third floor of the B/C connector, above the food court; its elevator is near Gate B2. An older source.',
  },
  'phx-chase-sapphire-lounge-by-the-club-terminal-3-after-security': {
    gate: 'D11',
    source: 'https://www.chase.com/sapphire-cards/lounges/phx',
    note: 'Chase lists it in Terminal 4, near Gate D11 — not Terminal 3 as the catalogue says. OSM maps the D gates only up to D8 so far, so it stays unplaced until D11 is mapped.',
  },
  'san-chase-sapphire-lounge-by-the-club-terminal-2-after-security': {
    gate: '47',
    source: 'https://www.chase.com/sapphire-cards/lounges/san',
    note: 'Terminal 2, near Gates 46 and 47; the entrance is beside Gate 47.',
  },
  'sfo-china-airlines-dynasty-lounge-international-terminal-a-level-4-after-security': {
    gate: 'A1',
    source: 'https://prioritypass.com/airport-guides/san-francisco-ca-international/international-terminal',
    note: 'International Terminal A, level 4, near Gate A1.',
  },
  'sfo-air-france-klm-lounge-international-terminal-a-level-3-after-security': {
    gate: 'A1',
    source: 'https://upgradedpoints.com/san-francisco-sfo-airport-lounges',
    note: 'Level 3 after security; a second listing puts it near Gate A1, with the other lounges to the left of the checkpoint.',
  },
  'sfo-golden-gate-lounge-international-terminal-a-level-4-after-security': {
    gate: 'A1',
    source: 'https://prioritypass.com/airport-guides/san-francisco-ca-international/international-terminal',
    note: 'Left after security and up a level, in the same group as the Cathay, Air India and Dynasty lounges by Gate A1.',
  },
  'sfo-virgin-atlantic-clubhouse-international-terminal-a-level-5-left-after-security': {
    gate: 'A1',
    source: 'https://upgradedpoints.com/san-francisco-sfo-airport-lounges',
    note: 'Level 5, left after security — above the lounges by Gate A1.',
  },
  'stl-admirals-club-terminal-1-concourse-c-entrance': {
    gate: 'C1',
    source: 'https://www.aa.com/i18n/travelInformation/airportAmenities/stl-club.html',
    note: 'Past security, on the left at the entrance to Concourse C, by Gate C1.',
  },

  // ------------------------------------------------- OpenStreetMap elements

  'jfk-lufthansa-business-lounge-terminal-1-left-after-security': {
    osm: 'node/12101594667',
    source: 'https://next.loungebuddy.com/JFK/lufthansa-senator-lounge-terminal-1-HyzH521KwE',
    note: 'Mapped as "Lufthansa-Austrian-Swiss lounge": just past the Terminal 1 checkpoint on the left.',
  },
  'jfk-lufthansa-senator-lounge-terminal-1-left-after-security': {
    osm: 'node/12101594667',
    source: 'https://next.loungebuddy.com/JFK/lufthansa-senator-lounge-terminal-1-HyzH521KwE',
    note: 'Upstairs through the same entrance as the Lufthansa business lounge, mapped as "Lufthansa-Austrian-Swiss lounge".',
  },
  'jfk-vip-one-lounge-terminal-1-behind-counters-e-f-next-to-tsa-precheck': {
    osm: 'node/13720690663',
    source: 'https://www.openstreetmap.org/node/13720690663',
    note: 'The lounge itself, mapped as "VIP ONE" (tagged as a restaurant).',
  },
  'lax-korean-air-first-class-lounge-tom-bradley-international-terminal-level-6': {
    osm: 'node/6403008385',
    source: 'https://www.luxurytraveladvisor.com/transportation/korean-air-unveils-flagship-lounge-los-angeles-international-airport',
    note: 'Korean Air’s lounge complex, mapped as "KAL Lounge": first class on level 6, Miler Club and Prestige on level 5.',
  },
  'lax-korean-air-miler-club-lounge-tom-bradley-international-terminal-level-5': {
    osm: 'node/6403008385',
    source: 'https://www.luxurytraveladvisor.com/transportation/korean-air-unveils-flagship-lounge-los-angeles-international-airport',
    note: 'Korean Air’s lounge complex, mapped as "KAL Lounge".',
  },
  'lax-korean-air-prestige-class-lounge-tom-bradley-international-terminal-level-5': {
    osm: 'node/6403008385',
    source: 'https://www.luxurytraveladvisor.com/transportation/korean-air-unveils-flagship-lounge-los-angeles-international-airport',
    note: 'Korean Air’s lounge complex, mapped as "KAL Lounge".',
  },
  'lax-oneworld-los-angeles-business-lounge-tom-bradley-international-terminal-level-5-after-security': {
    osm: 'node/13307072262',
    source: 'https://www.openstreetmap.org/node/13307072262',
    note: 'The lounge itself, mapped on level 5 as "oneWorld Alliance Lounge".',
  },
  'lax-qantas-first-lounge-tom-bradley-international-terminal-level-5': {
    osm: 'node/13307072262',
    landmark: 'the oneworld business lounge',
    source: 'https://onemileatatime.com/reviews/qantas-first-lounge-lax',
    note: 'Level 5, reached by walking past the oneworld business lounge; the first-class entrance is on the left.',
  },
  'clt-the-centurion-lounge-intersection-of-concourses-d-and-e-near-the-central-atrium': {
    osm: 'way/1347417381',
    landmark: 'The Plaza',
    source: 'https://thecenturionlounge.americanexpress.com/locations/clt/',
    note: 'Mezzanine at the junction of Concourses D and E, on the top floor of the expanded Plaza.',
  },
  'mia-turkish-airlines-lounge-concourse-e-level-2-after-security': {
    osm: 'node/8436226417',
    source: 'https://www.openstreetmap.org/node/8436226417',
    note: 'The lounge itself, mapped as "Turkish Airlines Loudge" — the misspelling hid it from name matching.',
  },
  'phl-delta-sky-club-terminal-d-e-connector-level-2-after-security': {
    osm: 'node/2960049233',
    landmark: 'Earl of Sandwich',
    source: 'https://www.americanexpress.com/en-us/travel/lounges/the-platinum-card/PHL/Delta-Sky-Club-D-E--1YgreO6Fd6/',
    note: 'D/E connector food court, to the right of the Earl of Sandwich.',
  },
  'phl-chase-sapphire-lounge-by-the-club-terminal-d-e-connector-level-2-after-security': {
    osm: 'node/2960031733',
    landmark: 'Vino Volo',
    source:
      'https://www.americanexpress.com/en-us/travel/lounges/the-platinum-card/PHL/Chase-Sapphire-Lounge-by-The-Club-D-E--ZcDTzdPWCB/',
    note: 'Level 2 of the D/E connector, opposite the TSA exit between Vino Volo and Dunkin’.',
  },
  'jax-delta-sky-club-concourse-a-past-the-central-rotunda': {
    osm: 'node/4823140825',
    landmark: 'Chili’s',
    source: 'https://www.americanexpress.com/en-us/travel/lounges/the-platinum-card/JAX/Delta-Sky-Club--A-b58KWTn1rE/',
    note: 'Concourse A, immediately after Chili’s and the Day Spa — by Gates A1 and A2, not A5 as one guide says.',
  },
  'hnl-admirals-club-jal-sakura-lounge-terminal-2-level-3': {
    osm: 'node/3926255675',
    landmark: 'The Local @ HNL',
    source: 'https://viewfromthewing.com/review-american-airlines-admirals-club-honolulu',
    note: 'Across from security checkpoint 3; the elevators and stairs beside The Local @ HNL lead up to the third-floor club.',
  },
  'mdw-the-club-mdw-central-market-after-security': {
    osm: 'way/1456938259',
    landmark: 'Central Market',
    source: 'https://www.openstreetmap.org/way/1456938259',
    note: 'The catalogue places it in the Central Market food hall, which is mapped.',
  },

  // ------------------------------------------------------- not placed

  'las-delta-sky-club-terminal-3-concourse-e': {
    unplaceable: 'no Delta Sky Club at LAS yet — Delta has only announced one, for around 2029',
    source: 'https://layoverindex.com/las/lounges/',
  },
  'pdx-alaska-lounge-concourse-b-near-the-concourse-entrance': {
    unplaceable: 'closed — Alaska shut its Concourse B Express lounge when the new Concourse C lounge opened in June 2026',
    source: 'https://news.alaskaair.com/guest-experience/alaska-airlines-debuts-lounge-in-portland-for-premium-west-coast-travel/',
  },
  'sjc-the-club-sjc-terminal-b-main-level-after-security': {
    unplaceable: 'no lounge in Terminal B — SJC’s two Club lounges are both in Terminal A, near Gates 15 and 8',
    source: 'https://www.businesstraveller.com/news/sjc-gets-second-club-lounge-in-a-gates-area/',
  },
  'jfk-alaska-lounge-terminal-7-mezzanine-level-just-above-security': {
    unplaceable: 'closed — Alaska moved to Terminal 8 in October 2025 and its passengers now use the Admirals Club there',
    source: 'https://upgradedpoints.com/travel/airports/new-york-jfk-airport-lounges/',
  },
  'anc-delta-sky-club-south-terminal-near-the-c-gates': {
    unplaceable:
      'possibly closed (listed as permanently closed by Lounge Review); otherwise on the mezzanine between Concourses B and C, with no gate named',
    source: 'https://loungereview.com/lounges/delta-sky-club-pop-up-anc',
  },
};
