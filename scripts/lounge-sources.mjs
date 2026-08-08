// Source-of-truth data for the US airport lounge directory.
//
// Compiled from published network location lists and per-airport lounge
// directories (Delta Sky Club, United Club/Polaris, Admirals/Flagship,
// Alaska, Amex Centurion, Capital One, Chase Sapphire, Escape Lounges,
// Priority Pass) as of August 2026.
//
// Lounges flagged "temporarily closed for renovation" by the source are
// included, with the closure noted in `note`. Announced-but-unopened
// lounges are NOT included. Non-lounge Priority Pass "experiences"
// (spas, gaming bars, nap suites, restaurant credits) are NOT included.

export const AIRPORTS = {
  ANC: 'Anchorage',
  ATL: 'Atlanta',
  AUS: 'Austin',
  BDL: 'Hartford',
  BNA: 'Nashville',
  BOS: 'Boston',
  BUF: 'Buffalo',
  BWI: 'Baltimore',
  CHS: 'Charleston',
  CLE: 'Cleveland',
  CLT: 'Charlotte',
  CMH: 'Columbus',
  CVG: 'Cincinnati',
  DCA: 'Washington D.C.',
  DEN: 'Denver',
  DFW: 'Dallas/Fort Worth',
  DTW: 'Detroit',
  EWR: 'Newark',
  FLL: 'Fort Lauderdale',
  GRR: 'Grand Rapids',
  GSP: 'Greenville-Spartanburg',
  GUM: 'Guam',
  HNL: 'Honolulu',
  IAD: 'Washington D.C.',
  IAH: 'Houston',
  IND: 'Indianapolis',
  JAX: 'Jacksonville',
  JFK: 'New York',
  LAS: 'Las Vegas',
  LAX: 'Los Angeles',
  LGA: 'New York',
  MCI: 'Kansas City',
  MCO: 'Orlando',
  MDW: 'Chicago',
  MEM: 'Memphis',
  MIA: 'Miami',
  MKE: 'Milwaukee',
  MSP: 'Minneapolis',
  MSY: 'New Orleans',
  OAK: 'Oakland',
  OGG: 'Kahului',
  ORD: 'Chicago',
  PBI: 'West Palm Beach',
  PDX: 'Portland',
  PHL: 'Philadelphia',
  PHX: 'Phoenix',
  PIT: 'Pittsburgh',
  PVD: 'Providence',
  RDU: 'Raleigh-Durham',
  RNO: 'Reno',
  SAN: 'San Diego',
  SAT: 'San Antonio',
  SEA: 'Seattle',
  SFO: 'San Francisco',
  SJC: 'San Jose',
  SJU: 'San Juan',
  SLC: 'Salt Lake City',
  SMF: 'Sacramento',
  SNA: 'Santa Ana',
  STL: 'St. Louis',
  SYR: 'Syracuse',
  TPA: 'Tampa',
  TUL: 'Tulsa',
  XNA: 'Bentonville',
};

// Lounge "brands". Each carries the access rules, an editorial quality tier
// used to derive a rating, and a sentence describing what the lounge is like.
export const BRANDS = {
  'delta-sky-club': {
    access:
      'Delta Sky Club members, Delta One and international business class passengers, Delta 360°/Diamond/Platinum Medallion members, SkyTeam Elite Plus on same-day Delta flights, and eligible Amex Delta Reserve and Platinum cardholders (visit limits apply).',
    tier: 4.3,
    blurb:
      'Delta’s flagship domestic club, with a hot-and-cold buffet, a full bar, fast Wi-Fi, and plenty of power-equipped seating.',
  },
  'delta-one': {
    access:
      'Delta One passengers on the same day of travel, Delta 360° members, and international SkyTeam business class passengers departing on qualifying flights.',
    tier: 4.8,
    blurb:
      'Delta’s premium long-haul lounge, with a seated à la carte restaurant, a cocktail bar, shower suites, and a quiet wellness area.',
  },
  'united-club': {
    access:
      'United Club members and United Club Card holders, Star Alliance Gold members on same-day international itineraries, long-haul premium cabin passengers, and day-pass purchasers.',
    tier: 4.2,
    blurb:
      'A comfortable pre-flight retreat with complimentary snacks, a bar, productivity seating, and complimentary Wi-Fi.',
  },
  'united-club-fly': {
    access:
      'United Club members and eligible cardholders. One-time passes are not accepted at United Club Fly locations.',
    tier: 3.9,
    blurb:
      'United’s compact grab-and-go format, built for short connections: packaged food, self-serve drinks, and limited seating.',
  },
  'united-polaris': {
    access:
      'United Polaris business class passengers and Star Alliance international first and business class passengers departing the same day.',
    tier: 4.8,
    blurb:
      'United’s premium international lounge, with a sit-down dining room, private daybeds, shower suites, and a well-stocked bar.',
  },
  admirals: {
    access:
      'Admirals Club members, qualifying Citi/AAdvantage cardholders, Flagship First and Business passengers, and eligible oneworld elite members on same-day travel. Day passes available.',
    tier: 4.1,
    blurb:
      'American’s core club, offering complimentary light bites, a self-serve bar, workspaces, and shower suites at larger locations.',
  },
  provisions: {
    access:
      'Admirals Club members and eligible AAdvantage elite and premium cabin customers on same-day travel.',
    tier: 3.9,
    blurb:
      'A grab-and-go outpost of the Admirals Club, built for quick stops: packaged meals, barista drinks, and limited seating.',
  },
  flagship: {
    access:
      'International first and business class passengers on qualifying long-haul routes, plus oneworld Emerald members and AAdvantage Executive Platinum members on eligible itineraries.',
    tier: 4.6,
    blurb:
      'American’s premium international lounge, with a chef-driven buffet, a proper cocktail bar, showers, and quiet seating zones.',
  },
  alaska: {
    access:
      'Alaska Lounge members and day-pass holders, Alaska first class passengers on long-haul routes, and oneworld Sapphire and Emerald members on same-day qualifying flights.',
    tier: 4.4,
    blurb:
      'A Pacific Northwest-inspired lounge known for its pancake machine, barista-made espresso, local beer and wine, and big airfield windows.',
  },
  centurion: {
    access:
      'American Express Platinum, Business Platinum, and Centurion cardholders, plus Delta SkyMiles Reserve cardholders flying Delta. Guest fees apply for most cardholders.',
    tier: 4.6,
    blurb:
      'American Express’ flagship lounge, with a locally inspired menu from a named chef, a craft cocktail bar, and a dedicated family room.',
  },
  'capital-one-lounge': {
    access:
      'Capital One Venture X, Venture X Business, and Spark Travel Elite cardholders. Other Capital One cardholders and guests may buy a day pass.',
    tier: 4.5,
    blurb:
      'A wellness-minded lounge with a made-to-order menu, a self-pour tap wall, peloton bikes, and grab-and-go for tight connections.',
  },
  'capital-one-landing': {
    access:
      'Capital One Venture X, Venture X Business, and Spark Travel Elite cardholders. Day passes available for other travelers.',
    tier: 4.3,
    blurb:
      'Capital One’s restaurant-style format: a full-service dining room and bar with a smaller lounge seating area alongside.',
  },
  'chase-sapphire': {
    access:
      'Chase Sapphire Reserve, J.P. Morgan Reserve, and Ritz-Carlton cardholders. Priority Pass members receive limited annual access. Day passes available.',
    tier: 4.6,
    blurb:
      'A design-forward lounge from Chase and The Club, with a full restaurant menu, a cocktail program, showers, and wellness suites.',
  },
  'chase-sapphire-terrace': {
    access:
      'Chase Sapphire Reserve and J.P. Morgan Reserve cardholders, plus Priority Pass members subject to capacity.',
    tier: 4.4,
    blurb:
      'A smaller Sapphire-branded terrace with local food and drink, natural light, and an outdoor-feeling seating area.',
  },
  escape: {
    access:
      'American Express Platinum and Centurion cardholders (as a Centurion Studio Partner), Priority Pass members, and walk-in day-pass purchasers.',
    tier: 4.0,
    blurb:
      'An independent lounge with a locally sourced hot buffet, complimentary beer and wine, and a calm, well-lit seating area.',
  },
  'the-club': {
    access: 'Priority Pass and LoungeKey members, participating airline passengers, and day-pass purchasers.',
    tier: 3.9,
    blurb:
      'An independent common-use lounge with self-serve snacks, complimentary beer and wine, showers at some locations, and quiet seating.',
  },
  'plaza-premium': {
    access: 'Priority Pass members, participating airline premium passengers, and day-pass purchasers.',
    tier: 4.0,
    blurb:
      'A pay-in common-use lounge with a hot buffet, a bar, shower rooms, and optional private rest suites.',
  },
  'plaza-premium-first': {
    access: 'Premium cabin passengers on partner airlines and day-pass purchasers. Priority Pass is not accepted.',
    tier: 4.4,
    blurb:
      'Plaza Premium’s upgraded first-class product, with à la carte dining, a champagne bar, and private shower suites.',
  },
  uso: {
    access:
      'Active-duty service members, National Guard and Reserve, retirees, and their dependents with valid military ID.',
    tier: 4.8,
    blurb:
      'A free lounge for the military community, with snacks, hot drinks, family space, rest areas, and volunteer-run hospitality.',
  },
  military: {
    access: 'Active-duty, retired, and veteran service members and their families with valid identification.',
    tier: 4.7,
    blurb: 'A volunteer-run hospitality lounge offering refreshments, quiet seating, and a place to rest between flights.',
  },
  'foreign-business': {
    access:
      'Business class passengers and eligible alliance elite members on the operating carrier, plus Priority Pass members at participating locations.',
    tier: 4.3,
    blurb:
      'An airline-operated international lounge with a hot buffet reflecting the carrier’s home cuisine, a full bar, and showers.',
  },
  'foreign-first': {
    access:
      'First class passengers and top-tier elite members on the operating carrier and its alliance partners.',
    tier: 4.7,
    blurb:
      'A first-class lounge with à la carte dining, premium champagne, private shower suites, and dedicated attentive service.',
  },
  alliance: {
    access:
      'International first and business class passengers and alliance Gold members departing on partner airlines the same day.',
    tier: 4.5,
    blurb:
      'A shared alliance lounge serving multiple partner carriers, with an extensive buffet, a full bar, showers, and terrace seating.',
  },
  independent: {
    access: 'Priority Pass and LoungeKey members, participating airline passengers, and day-pass purchasers.',
    tier: 3.9,
    blurb:
      'An independent lounge open to pass holders and walk-ins, with complimentary refreshments, Wi-Fi, and quiet seating.',
  },
  jetblue: {
    access:
      'JetBlue transatlantic Mint passengers, TrueBlue Mosaic 4 members, and eligible JetBlue Premier card holders.',
    tier: 4.4,
    blurb:
      'JetBlue’s lounge concept, with a seated dining area, a self-pour bar, and a bright lounge space for Mint travelers.',
  },
  hawaiian: {
    access: 'Hawaiian Airlines first class passengers, Premier Club members, and day-pass purchasers.',
    tier: 4.0,
    blurb: 'An island-relaxed lounge with local snacks, tropical drinks, complimentary Wi-Fi, and comfortable seating.',
  },
};

// [airportCode, lounge name, location, brand, note?]
export const LOUNGES = [
  // ---------- ANC ----------
  ['ANC', 'Alaska Lounge', 'Concourse C, near Gate C1', 'alaska'],
  ['ANC', 'Delta Sky Club', 'South Terminal, near the C gates', 'delta-sky-club'],

  // ---------- ATL ----------
  ['ATL', 'Delta Sky Club', 'Concourse A, second level, center of the concourse', 'delta-sky-club'],
  ['ATL', 'Delta Sky Club', 'Concourse A, near Gate A17', 'delta-sky-club'],
  ['ATL', 'Delta Sky Club', 'Concourse B, near Gate B18', 'delta-sky-club'],
  ['ATL', 'Delta Sky Club', 'Concourse C, near Gate C37', 'delta-sky-club'],
  ['ATL', 'Delta Sky Club', 'Concourse D, near Gate D18', 'delta-sky-club'],
  ['ATL', 'Delta Sky Club', 'Concourse E, near Gate E15', 'delta-sky-club'],
  ['ATL', 'Delta Sky Club', 'Concourse F, mezzanine level', 'delta-sky-club'],
  ['ATL', 'Delta Sky Club', 'Concourse T, near Gate T6', 'delta-sky-club'],
  ['ATL', 'Admirals Club', 'Concourse T, near Gate T11', 'admirals'],
  ['ATL', 'United Club', 'Concourse T, mezzanine between Gates T11 and T12', 'united-club'],
  ['ATL', 'The Centurion Lounge', 'Concourse E, near Gate E11', 'centurion'],
  ['ATL', 'The Club ATL', 'Concourse F, International Terminal mezzanine', 'the-club'],
  ['ATL', 'USO Lounge', 'Domestic Terminal atrium, third floor, pre-security', 'uso'],

  // ---------- AUS ----------
  ['AUS', 'Delta Sky Club', 'Barbara Jordan Terminal, near Gate 4', 'delta-sky-club'],
  ['AUS', 'Admirals Club', 'Barbara Jordan Terminal, near Gate 22', 'admirals'],
  ['AUS', 'Chase Sapphire Terrace', 'Barbara Jordan Terminal, near Gate 12', 'chase-sapphire-terrace'],
  ['AUS', 'United Club', 'Barbara Jordan Terminal, West Concourse mezzanine, across from Gate 22', 'united-club', 'closed'],

  // ---------- BDL ----------
  ['BDL', 'Escape Lounge', 'Terminal A, after security near Gate 1', 'escape'],

  // ---------- BNA ----------
  ['BNA', 'Delta Sky Club', 'Main Terminal airside, adjacent to Gate B3', 'delta-sky-club'],
  ['BNA', 'Admirals Club', 'Concourse C, mezzanine level across from Gate C10', 'admirals'],

  // ---------- BOS ----------
  ['BOS', 'Delta Sky Club', 'Terminal A, near Gate A6', 'delta-sky-club'],
  ['BOS', 'Delta Sky Club', 'Terminal A, Satellite Concourse near Gate A18', 'delta-sky-club'],
  ['BOS', 'Delta Sky Club', 'Terminal E, near Gate E13', 'delta-sky-club'],
  ['BOS', 'Delta One Lounge', 'Terminal E, inside the Delta Sky Club near Gate E13', 'delta-one'],
  ['BOS', 'Admirals Club', 'Terminal B, upper level near Gate B4', 'admirals'],
  ['BOS', 'United Club', 'Terminal B, level 3 near Gate B24', 'united-club'],
  ['BOS', 'Chase Sapphire Lounge by The Club', 'Terminal B, between Gates B39 and B40', 'chase-sapphire'],
  ['BOS', 'The Lounge', 'Terminal C, across from Gate C19', 'independent'],
  ['BOS', 'Air France Lounge', 'Terminal E, near Gates E3 and E4', 'foreign-business'],
  ['BOS', 'British Airways Lounge', 'Terminal E, opposite Gate E11', 'foreign-business'],
  ['BOS', 'Emirates Lounge', 'Terminal E, opposite Gate E11', 'foreign-business'],
  ['BOS', 'Lufthansa Business Lounge', 'Terminal E, level 4 across from Gate E11', 'foreign-business'],
  ['BOS', 'USO Lounge', 'Terminal C, near the United baggage claim', 'uso'],

  // ---------- BUF ----------
  ['BUF', 'The Club BUF', 'Main Terminal, airside after security', 'the-club'],

  // ---------- BWI ----------
  ['BWI', 'The Club BWI', 'Concourse D, airside upper level', 'the-club'],

  // ---------- CHS ----------
  ['CHS', 'The Club CHS', 'Concourse B, airside', 'the-club'],

  // ---------- CLE ----------
  ['CLE', 'United Club', 'Main Terminal, Concourse C between Gates C14 and C16', 'united-club'],
  ['CLE', 'The Club CLE', 'Main Terminal, toward Concourse B', 'the-club'],

  // ---------- CLT ----------
  ['CLT', 'Delta Sky Club', 'Concourse A, mezzanine level near Gate A32', 'delta-sky-club'],
  ['CLT', 'Admirals Club', 'Concourse B, between Gates B3 and B5', 'admirals'],
  ['CLT', 'Admirals Club', 'Concourse C, at the intersection of Concourses C and D', 'admirals'],
  ['CLT', 'Provisions by Admirals Club', 'Concourse A, near Gate A1', 'provisions'],
  ['CLT', 'The Centurion Lounge', 'Intersection of Concourses D and E, near the central atrium', 'centurion'],
  ['CLT', 'The Club CLT', 'Concourse A, airside', 'the-club'],

  // ---------- CMH ----------
  ['CMH', 'Escape Lounge', 'Concourse B, near Gate 32', 'escape'],

  // ---------- CVG ----------
  ['CVG', 'Delta Sky Club', 'Main Terminal, Concourse B near Gate B14', 'delta-sky-club'],
  ['CVG', 'The Club CVG', 'Concourse A, airside', 'the-club'],
  ['CVG', 'Escape Lounge', 'Concourse B, between Gates B8 and B10', 'escape'],

  // ---------- DCA ----------
  ['DCA', 'Admirals Club', 'Terminal 2, Concourse C mezzanine near Gate C24', 'admirals'],
  ['DCA', 'Admirals Club', 'Terminal 2, Concourse D mezzanine near Gate D36', 'admirals'],
  ['DCA', 'Admirals Club', 'Terminal 2, Concourse E mezzanine near Gate E46', 'admirals'],
  ['DCA', 'Capital One Landing', 'Terminal 2, National Hall near Concourse D', 'capital-one-landing'],
  ['DCA', 'The Centurion Lounge', 'Terminal 2, level 2 near Gates B15 to B22', 'centurion'],
  ['DCA', 'Delta Sky Club', 'Terminal 2, above Gate B15', 'delta-sky-club'],
  ['DCA', 'United Club', 'Terminal 2, across from Gate B11', 'united-club'],
  ['DCA', 'USO Lounge', 'Terminal 1, pre-security across from lost and found', 'uso'],

  // ---------- DEN ----------
  ['DEN', 'United Club', 'Concourse A West, near Gate A25', 'united-club'],
  ['DEN', 'United Club', 'Concourse B West, near Gate B32', 'united-club'],
  ['DEN', 'United Club', 'Concourse B East, near Gate B44', 'united-club'],
  ['DEN', 'United Club Fly', 'Concourse B East, near Gate B60', 'united-club-fly'],
  ['DEN', 'Admirals Club', 'Concourse C, near Gate C32', 'admirals'],
  ['DEN', 'Delta Sky Club', 'Concourse A, fourth floor center core', 'delta-sky-club'],
  ['DEN', 'The Centurion Lounge', 'Concourse C, mezzanine near Gate C46', 'centurion'],
  ['DEN', 'Capital One Lounge', 'Concourse A, mezzanine level', 'capital-one-lounge'],

  // ---------- DFW ----------
  ['DFW', 'Admirals Club', 'Terminal A, near Gate A24', 'admirals'],
  ['DFW', 'Admirals Club', 'Terminal B, near Gate B3', 'admirals'],
  ['DFW', 'Admirals Club', 'Terminal C, near Gate C20', 'admirals'],
  ['DFW', 'Admirals Club', 'Terminal D, near Gate D24', 'admirals'],
  ['DFW', 'Admirals Club', 'Terminal E, satellite mezzanine level', 'admirals'],
  ['DFW', 'American Flagship Lounge', 'Terminal D, near Gate D23', 'flagship'],
  ['DFW', 'Delta Sky Club', 'Terminal E, near Gate E10', 'delta-sky-club'],
  ['DFW', 'United Club', 'Terminal E, near Gate E6', 'united-club'],
  ['DFW', 'The Centurion Lounge', 'Terminal D, mezzanine across from Gate D12', 'centurion'],
  ['DFW', 'Capital One Lounge', 'Terminal D, near Gate D22', 'capital-one-lounge'],
  ['DFW', 'Chase Sapphire Lounge by The Club', 'Terminal D, near Gate D25', 'chase-sapphire'],
  ['DFW', 'The Club DFW', 'Terminal D, mezzanine near Gate D27', 'the-club'],
  ['DFW', 'Plaza Premium Lounge', 'Terminal D, opposite Gate D15', 'plaza-premium'],
  ['DFW', 'Plaza Premium First Lounge', 'Terminal D, opposite Gate D15', 'plaza-premium-first'],
  ['DFW', 'Plaza Premium Lounge', 'Terminal E, near Gate E31', 'plaza-premium'],
  ['DFW', 'USO Lounge', 'Terminal B, opposite Gate B47', 'uso'],

  // ---------- DTW ----------
  ['DTW', 'Delta Sky Club', 'McNamara Terminal, Concourse A level 2 near Gate A18', 'delta-sky-club'],
  ['DTW', 'Delta Sky Club', 'McNamara Terminal, gate level near Gate A38', 'delta-sky-club'],
  ['DTW', 'Delta Sky Club', 'McNamara Terminal, gate level near Gate A43', 'delta-sky-club'],
  ['DTW', 'Delta Sky Club', 'McNamara Terminal, Concourse A level 2 near Gate A68', 'delta-sky-club'],
  ['DTW', 'Delta Sky Club', 'McNamara Terminal, between Gates B2 and C9', 'delta-sky-club'],
  ['DTW', 'Freedom Center Armed Services Lounge', 'McNamara Terminal, near Gate A43', 'military'],
  ['DTW', 'Freedom Center Armed Services Lounge', 'Warren C. Evans Terminal, near Gate D17', 'military'],
  ['DTW', 'Lufthansa Business Lounge', 'Warren C. Evans Terminal, departure level between Gates D6 and D8', 'foreign-business'],

  // ---------- EWR ----------
  ['EWR', 'United Club', 'Terminal A, upper level across from Gate A27', 'united-club'],
  ['EWR', 'United Club', 'Terminal C, upper level near Gate C74', 'united-club'],
  ['EWR', 'United Club', 'Terminal C, mezzanine near Gate C123', 'united-club'],
  ['EWR', 'United Polaris Lounge', 'Terminal C, between Gates C102 and C120', 'united-polaris'],
  ['EWR', 'Admirals Club', 'Terminal A, mezzanine level across from Gate A8', 'admirals'],
  ['EWR', 'Delta Sky Club', 'Terminal A, near Gate A8', 'delta-sky-club'],
  ['EWR', 'LOUNGE&CO', 'Terminal B, Satellite B2 near Gates B51 to B57', 'independent'],
  ['EWR', 'Lufthansa Business Lounge', 'Terminal B, Concourse B3 between Gates B60 and B68', 'foreign-business'],
  ['EWR', 'SAS Lounge', 'Terminal B, Concourse B3 near Gate B60', 'foreign-business'],
  ['EWR', 'British Airways Lounge', 'Terminal B, near Gates B50 to B58', 'foreign-business', 'closed'],
  ['EWR', 'USO Center', 'Terminal B, level 2 north end, pre-security', 'uso'],

  // ---------- FLL ----------
  ['FLL', 'Delta Sky Club', 'Main Atrium, between Gates D2 and D3', 'delta-sky-club'],
  ['FLL', 'United Club', 'Terminal 1, next to the escalators near Gate C1', 'united-club'],
  ['FLL', 'Escape Lounge', 'Terminal 3, level 2 on the walkway to Gates E1 to E10', 'escape'],

  // ---------- GRR ----------
  ['GRR', 'The Club GRR', 'Concourse A, level 2', 'the-club'],

  // ---------- GSP ----------
  ['GSP', 'Escape Lounge', 'Concourse B, airside near Gate 1', 'escape'],

  // ---------- GUM ----------
  ['GUM', 'United Club', 'Main Terminal, East Concourse between Gates 10 and 12', 'united-club'],

  // ---------- HNL ----------
  ['HNL', 'Delta Sky Club', 'Main Concourse, across from Gate F1', 'delta-sky-club'],
  ['HNL', 'United Club', 'Diamond Head Concourse, level 3 above Gates G2 and G3', 'united-club'],
  ['HNL', 'Admirals Club / JAL Sakura Lounge', 'Terminal 2, level 3', 'admirals'],
  ['HNL', 'IASS Hawaii Lounge', 'Overseas Terminal, airside', 'independent'],
  ['HNL', 'Hawaiian Airlines Plumeria Lounge', 'Terminal 1, near the Gate 14 rotunda', 'hawaiian'],

  // ---------- IAD ----------
  ['IAD', 'United Club', 'Midfield Terminal, Concourse C near Gate C7', 'united-club'],
  ['IAD', 'United Club', 'Midfield Terminal, Concourse C near Gate C17', 'united-club'],
  ['IAD', 'United Club', 'Midfield Terminal, Concourse D near Gate D8', 'united-club'],
  ['IAD', 'United Polaris Lounge', 'Midfield Terminal, Concourse C near Gate C17', 'united-polaris'],
  ['IAD', 'Air France-KLM Lounge', 'Concourse A, in front of Gate A20', 'foreign-business'],
  ['IAD', 'Etihad Lounge in Collaboration with Chase', 'Concourse A, near Gate A14', 'chase-sapphire'],
  ['IAD', 'Virgin Atlantic Clubhouse', 'Concourse A, across from Gate A32', 'foreign-business'],
  ['IAD', 'British Airways Galleries Lounge', 'Concourse B, opposite Gate B50', 'foreign-business'],
  ['IAD', 'Turkish Airlines Lounge', 'Concourse B, near Gate B43', 'foreign-business'],
  ['IAD', 'Lufthansa Business Lounge', 'Concourse B, near Gates B49 to B51', 'foreign-business', 'closed'],
  ['IAD', 'Lufthansa Senator Lounge', 'Concourse B, near Gates B49 to B51', 'foreign-first', 'closed'],
  ['IAD', 'Capital One Lounge', 'Main Terminal, directly after the TSA PreCheck checkpoint', 'capital-one-lounge'],
  ['IAD', 'USO Lounge', 'Arrivals level, across from baggage claims 11 and 12', 'uso'],

  // ---------- IAH ----------
  ['IAH', 'Admirals Club', 'Terminal A, near Gates A25 and A26', 'admirals'],
  ['IAH', 'United Club', 'Terminal A, North Concourse across from Gate A9', 'united-club'],
  ['IAH', 'United Club', 'Terminal C, North Concourse near Gate C1', 'united-club'],
  ['IAH', 'United Club', 'Terminal C, South Concourse toward Gate C33', 'united-club'],
  ['IAH', 'United Club', 'Terminal E, between Gates E11 and E12', 'united-club'],
  ['IAH', 'United Club Fly', 'Terminal B, near Gates B12 to B20', 'united-club-fly'],
  ['IAH', 'United Polaris Lounge', 'Terminal E, near Gate E12', 'united-polaris'],
  ['IAH', 'Air France Lounge', 'Terminal D, opposite Gate D18', 'foreign-business'],
  ['IAH', 'KLM Crown Lounge', 'Terminal D, near Gate D15', 'foreign-business'],
  ['IAH', 'The Centurion Lounge', 'Terminal D, mezzanine near Gate D12', 'centurion'],
  ['IAH', 'HAS Executive Club', 'Terminal D, near Gate D12', 'independent'],
  ['IAH', 'USO Lounge', 'Terminal D, near Gate D8 post-security', 'uso'],

  // ---------- IND ----------
  ['IND', 'Delta Sky Club', 'Concourse A, after security', 'delta-sky-club'],

  // ---------- JAX ----------
  ['JAX', 'Delta Sky Club', 'Concourse A, past the central rotunda', 'delta-sky-club'],

  // ---------- JFK ----------
  ['JFK', 'Air France Lounge', 'Terminal 1, level 3 near Gate 1', 'foreign-business'],
  ['JFK', 'KAL Lounge', 'Terminal 1, level 3 near Gate 3', 'foreign-business'],
  ['JFK', 'Lufthansa Business Lounge', 'Terminal 1, left after security', 'foreign-business'],
  ['JFK', 'Lufthansa Senator Lounge', 'Terminal 1, left after security', 'foreign-first'],
  ['JFK', 'Primeclass Lounge', 'Terminal 1, near Gates 8 and 9', 'independent'],
  ['JFK', 'Turkish Airlines Lounge', 'Terminal 1, between Gates 2 and 3', 'foreign-business'],
  ['JFK', 'VIP One Lounge', 'Terminal 1, behind counters E-F next to TSA PreCheck', 'independent'],
  ['JFK', 'Air India Maharajah Lounge', 'Terminal 4, near Gate A5', 'foreign-business'],
  ['JFK', 'Capital One Lounge', 'Terminal 4, retail hall', 'capital-one-lounge'],
  ['JFK', 'The Centurion Lounge', 'Terminal 4, level 4 beyond the TSA checkpoints', 'centurion'],
  ['JFK', 'Chase Sapphire Lounge by The Club', 'Terminal 4, upper level after security', 'chase-sapphire'],
  ['JFK', 'Delta One Lounge', 'Terminal 4, between Concourses A and B near the main security checkpoint', 'delta-one'],
  ['JFK', 'Delta Sky Club', 'Terminal 4, Concourse A near Gate A8', 'delta-sky-club'],
  ['JFK', 'Delta Sky Club', 'Terminal 4, Concourse B near Gate B31', 'delta-sky-club'],
  ['JFK', 'Emirates Lounge', 'Terminal 4, near Gate A5', 'foreign-business'],
  ['JFK', 'HelloSky Lounge', 'Terminal 4, near Gate A2', 'independent'],
  ['JFK', 'Virgin Atlantic Clubhouse', 'Terminal 4, upper level', 'foreign-business'],
  ['JFK', 'JetBlue BlueHouse', 'Terminal 5, across from Gate 526', 'jetblue'],
  ['JFK', 'Aer Lingus Lounge', 'Terminal 7, near Gate 1', 'foreign-business'],
  ['JFK', 'Alaska Lounge', 'Terminal 7, mezzanine level just above security', 'alaska'],
  ['JFK', 'Horizons T7 Lounge', 'Terminal 7, mezzanine after security', 'foreign-business'],
  ['JFK', 'Admirals Club', 'Terminal 8, Concourse C level 3 across from Gate 42', 'admirals'],
  ['JFK', 'Chelsea Lounge', 'Terminal 8, level 1 after security', 'foreign-first'],
  ['JFK', 'Greenwich Lounge', 'Terminal 8, level 1 after security', 'flagship'],
  ['JFK', 'Soho Lounge', 'Terminal 8, level 1 after security', 'flagship'],

  // ---------- LAS ----------
  ['LAS', 'The Centurion Lounge', 'Terminal 3, Concourse D opposite Gate D1', 'centurion'],
  ['LAS', 'Delta Sky Club', 'Terminal 3, Concourse E', 'delta-sky-club'],
  ['LAS', 'United Club', 'Terminal 3, Concourse D between Gates D33 and D35', 'united-club'],
  ['LAS', 'The Club LAS', 'Terminal 1, Concourse D', 'the-club'],
  ['LAS', 'The Club LAS', 'Terminal 3, Concourse E', 'the-club'],
  ['LAS', 'Capital One Lounge', 'Terminal 1, Concourse D rotunda', 'capital-one-lounge'],
  ['LAS', 'Chase Sapphire Lounge by The Club', 'Terminal 3, Concourse E', 'chase-sapphire'],

  // ---------- LAX ----------
  ['LAX', 'Air Canada Maple Leaf Lounge', 'Terminal 6, near Gate 65A', 'foreign-business'],
  ['LAX', 'Air France Lounge', 'Tom Bradley International Terminal, Midfield Satellite Concourse near Gates 201 to 225', 'foreign-business'],
  ['LAX', 'Alaska Lounge', 'Terminal 6, mezzanine level near Gate 64', 'alaska'],
  ['LAX', 'Admirals Club', 'Terminal 4, concourse level across from Gate 40', 'admirals'],
  ['LAX', 'Admirals Club', 'American Eagle Regional Terminal, across from Gates 52D and 52E', 'admirals'],
  ['LAX', 'American Flagship Lounge', 'Terminal 4, near Gate 41', 'flagship'],
  ['LAX', 'The Centurion Lounge', 'Tom Bradley International Terminal, left after security', 'centurion'],
  ['LAX', 'Delta One Lounge', 'Terminal 3, near Gate 34', 'delta-one'],
  ['LAX', 'Delta One Lounge', 'Terminal 2, mezzanine level', 'delta-one'],
  ['LAX', 'Delta Sky Club', 'Terminal 3, level 3 near Gate 34', 'delta-sky-club'],
  ['LAX', 'Emirates Lounge', 'Tom Bradley International Terminal, level 6', 'foreign-business'],
  ['LAX', 'Korean Air First Class Lounge', 'Tom Bradley International Terminal, level 6', 'foreign-first'],
  ['LAX', 'Korean Air Miler Club Lounge', 'Tom Bradley International Terminal, level 5', 'foreign-business'],
  ['LAX', 'Korean Air Prestige Class Lounge', 'Tom Bradley International Terminal, level 5', 'foreign-business'],
  ['LAX', 'oneworld Los Angeles Business Lounge', 'Tom Bradley International Terminal, level 5 after security', 'alliance'],
  ['LAX', 'Qantas First Lounge', 'Tom Bradley International Terminal, level 5', 'foreign-first'],
  ['LAX', 'Star Alliance Lounge', 'Tom Bradley International Terminal, level 6 after security', 'alliance'],
  ['LAX', 'United Club', 'Terminal 7, level 3 near Gate 71A', 'united-club'],
  ['LAX', 'United Polaris Lounge', 'Terminal 7, between Gates 73 and 75A', 'united-polaris'],
  ['LAX', 'Virgin Atlantic Clubhouse', 'Tom Bradley International Terminal, after security', 'foreign-business'],
  ['LAX', 'USO Lounge', 'Near the airport terminal loop, pre-security', 'uso'],

  // ---------- LGA ----------
  ['LGA', 'Delta Sky Club', 'Terminal C, near Gate C60', 'delta-sky-club'],
  ['LGA', 'Delta Sky Club', 'Terminal C, near Gate C90', 'delta-sky-club'],
  ['LGA', 'Admirals Club', 'Terminal B, Concourse A near Gates 30 and 31', 'admirals'],
  ['LGA', 'The Centurion Lounge', 'Terminal B, fourth floor after security', 'centurion'],
  ['LGA', 'Chase Sapphire Lounge by The Club', 'Terminal B, after security', 'chase-sapphire'],
  ['LGA', 'Capital One Landing', 'Terminal B, on the bridge to Gates 11 to 31', 'capital-one-landing'],
  ['LGA', 'United Club', 'Terminal B, level 3 near Gates 40 to 59', 'united-club'],

  // ---------- MCI ----------
  ['MCI', 'Delta Sky Club', 'B Gates, CenterPoint next to Auntie Anne’s', 'delta-sky-club'],
  ['MCI', 'Escape Lounge', 'Concourse A, by Gate A5', 'escape'],

  // ---------- MCO ----------
  ['MCO', 'Delta Sky Club', 'Airside 4, center atrium near Gate 71', 'delta-sky-club'],
  ['MCO', 'United Club', 'Airside 2, Concourse B near Gate 43', 'united-club'],
  ['MCO', 'Admirals Club', 'Terminal B, near Gate 55', 'admirals'],
  ['MCO', 'The Club MCO', 'Terminal B, Airside 4 near Gate 91', 'the-club'],

  // ---------- MDW ----------
  ['MDW', 'The Club MDW', 'Central Market, after security', 'the-club'],

  // ---------- MEM ----------
  ['MEM', 'Delta Sky Club', 'Terminal B, adjacent to the B security checkpoint in the B/C connector', 'delta-sky-club'],

  // ---------- MIA ----------
  ['MIA', 'Admirals Club', 'Concourse D, above Gate D15', 'admirals'],
  ['MIA', 'Admirals Club', 'Concourse D, across from Gate D30', 'admirals'],
  ['MIA', 'American Flagship Lounge', 'Concourse D, near Gate D30', 'flagship'],
  ['MIA', 'The Centurion Lounge', 'Concourse D, level 4 near Gate D12', 'centurion'],
  ['MIA', 'British Airways Lounge', 'Concourse E, past the shuttle train to Gates E20 to E33', 'foreign-business'],
  ['MIA', 'Turkish Airlines Lounge', 'Concourse E, level 2 after security', 'foreign-business'],
  ['MIA', 'Turkish Airlines Lounge', 'Concourse H, level 3 inside the H/J connector', 'foreign-business'],
  ['MIA', 'Delta Sky Club', 'Concourse H, inside the H/J connector', 'delta-sky-club'],
  ['MIA', 'Avianca and TAP Portugal Lounge', 'Concourse J, across from Gate J6', 'foreign-business'],
  ['MIA', 'LATAM VIP Lounge', 'Concourse J, near Gate J6', 'foreign-business'],
  ['MIA', 'Military Hospitality Lounge', 'Concourse E, level 2 across from Air Margaritaville', 'military'],

  // ---------- MKE ----------
  ['MKE', 'Delta Sky Club', 'Concourse D, across from the Great American Bagel and Bakery', 'delta-sky-club'],

  // ---------- MSP ----------
  ['MSP', 'Delta Sky Club', 'Terminal 1, F/G Concourse junction', 'delta-sky-club'],
  ['MSP', 'Delta Sky Club', 'Terminal 1, Concourse G near Gates G17 and G18', 'delta-sky-club'],
  ['MSP', 'Delta Sky Club', 'Terminal 1, Concourse C', 'delta-sky-club'],
  ['MSP', 'Escape Lounge', 'Terminal 1, Concourse E above the entrance after security', 'escape'],
  ['MSP', 'United Club', 'Terminal 1, Concourse E between Gates E6 and E8', 'united-club', 'closed'],

  // ---------- MSY ----------
  ['MSY', 'Delta Sky Club', 'Concourse C, near Gate C1', 'delta-sky-club'],
  ['MSY', 'United Club', 'Concourse C, near Gate C7', 'united-club'],
  ['MSY', 'The Club MSY', 'Concourse B, airside', 'the-club'],

  // ---------- OAK ----------
  ['OAK', 'Escape Lounge', 'Terminal 1, between Gates 8 and 8A after security', 'escape'],

  // ---------- OGG ----------
  ['OGG', 'Hawaiian Airlines Premier Club', 'Main Terminal, near Gate 15', 'hawaiian'],

  // ---------- ORD ----------
  ['ORD', 'United Club', 'Terminal 1, Concourse B near Gate B6', 'united-club'],
  ['ORD', 'United Club', 'Terminal 1, Concourse B near Gate B18', 'united-club'],
  ['ORD', 'United Club', 'Terminal 1, Concourse C near Gate C10', 'united-club'],
  ['ORD', 'United Club', 'Terminal 2, Concourse E near Gate E7', 'united-club'],
  ['ORD', 'United Club', 'Terminal 2, Concourse F across from Gate F9', 'united-club'],
  ['ORD', 'United Polaris Lounge', 'Terminal 1, Concourse C near Gate C18', 'united-polaris', 'closed'],
  ['ORD', 'Admirals Club', 'Terminal 3, Concourse G across from Gate G8', 'admirals'],
  ['ORD', 'Admirals Club', 'Terminal 3, Concourse L before Gate L1', 'admirals'],
  ['ORD', 'Admirals Club', 'Terminal 3, Concourse H/K crosswalk between Gates H6 and K6', 'admirals'],
  ['ORD', 'American Flagship Lounge', 'Terminal 3, Concourse H/K crosswalk', 'flagship'],
  ['ORD', 'Delta Sky Club', 'Terminal 5, Concourse M between Gates M11 and M14', 'delta-sky-club'],
  ['ORD', 'Air France Lounge', 'Terminal 5, near Gate M17', 'foreign-business'],
  ['ORD', 'LOT Polish Business Class Lounge', 'Terminal 5, next to the dining area near security', 'foreign-business'],
  ['ORD', 'Swissport Lounge', 'Terminal 5, near Gate M13', 'independent'],
  ['ORD', 'USO Lounge', 'Terminal 2, mezzanine pre-security', 'uso'],
  ['ORD', 'USO Lounge', 'Terminal 3, Concourse G mezzanine', 'uso'],

  // ---------- PBI ----------
  ['PBI', 'Delta Sky Club', 'Concourse C, opposite Gate C4', 'delta-sky-club'],
  ['PBI', 'Escape Lounge', 'Main Terminal, past the entrance to the A and B concourses', 'escape'],

  // ---------- PDX ----------
  ['PDX', 'Delta Sky Club', 'Concourse D, between Gates D5 and D7', 'delta-sky-club'],
  ['PDX', 'United Club', 'Concourse E, across from Gate E3', 'united-club'],
  ['PDX', 'Alaska Lounge', 'Concourse B, near the concourse entrance', 'alaska'],
  ['PDX', 'Alaska Lounge', 'Concourse C, across from Gate C5', 'alaska'],
  ['PDX', 'Escape Lounge', 'Concourse D, between Gates D8 and D10', 'escape'],

  // ---------- PHL ----------
  ['PHL', 'Admirals Club', 'Terminal A-West, mezzanine between Gates A15 and A16', 'admirals'],
  ['PHL', 'Admirals Club', 'Terminal B/C connector, third floor', 'admirals'],
  ['PHL', 'Admirals Club', 'Terminal F, level 2 above the food court', 'admirals'],
  ['PHL', 'American Flagship Lounge', 'Terminal A-West, mezzanine between Gates A15 and A16', 'flagship'],
  ['PHL', 'British Airways Galleries Club', 'Terminal A-West, level 2 after security', 'foreign-business'],
  ['PHL', 'The Centurion Lounge', 'Terminal A-West, near Gate A14', 'centurion'],
  ['PHL', 'Chase Sapphire Lounge by The Club', 'Terminal D/E connector, level 2 after security', 'chase-sapphire'],
  ['PHL', 'Delta Sky Club', 'Terminal D/E connector, level 2 after security', 'delta-sky-club'],
  ['PHL', 'United Club', 'Terminal C/D connector, level 2', 'united-club'],
  ['PHL', 'USO Lounge', 'Terminal E, adjacent to Gate E2', 'uso'],

  // ---------- PHX ----------
  ['PHX', 'Admirals Club', 'Terminal 4, Concourse A above Gates A7 to A9', 'admirals'],
  ['PHX', 'Admirals Club', 'Terminal 4, Concourse A between Gates A19 and A21', 'admirals'],
  ['PHX', 'Admirals Club', 'Terminal 4, Concourse B above Gates B5 to B7', 'admirals'],
  ['PHX', 'Delta Sky Club', 'Terminal 3, near Gate F8', 'delta-sky-club'],
  ['PHX', 'United Club', 'Terminal 3, close to Gate E3', 'united-club'],
  ['PHX', 'The Centurion Lounge', 'Terminal 4, upper level opposite Gate B22', 'centurion'],
  ['PHX', 'Chase Sapphire Lounge by The Club', 'Terminal 3, after security', 'chase-sapphire'],
  ['PHX', 'Escape Lounge', 'Terminal 3, mezzanine next to the Hudson passage', 'escape'],
  ['PHX', 'Escape Lounge', 'Terminal 4, Concourse B across from Gate B22', 'escape'],

  // ---------- PIT ----------
  ['PIT', 'Admirals Club', 'Main Terminal, mezzanine level of the main lobby', 'admirals'],
  ['PIT', 'The Club PIT', 'Airside Terminal, center core', 'the-club'],

  // ---------- PVD ----------
  ['PVD', 'Escape Lounge', 'Main Terminal, past Gate 18', 'escape'],

  // ---------- RDU ----------
  ['RDU', 'Delta Sky Club', 'Terminal 2, second level across from Gate C3', 'delta-sky-club'],
  ['RDU', 'United Club', 'Terminal 2, across from Gates D1 to D3', 'united-club'],
  ['RDU', 'Admirals Club', 'Terminal 2, across from Gates C1 to C3', 'admirals'],

  // ---------- RNO ----------
  ['RNO', 'Escape Lounge', 'Central corridor, between Concourses B and C after security', 'escape'],

  // ---------- SAN ----------
  ['SAN', 'Delta Sky Club', 'Terminal 2, mezzanine level above Sunset Cove', 'delta-sky-club'],
  ['SAN', 'United Club', 'Terminal 2 West, mezzanine between Gates 47 and 48', 'united-club'],
  ['SAN', 'Chase Sapphire Lounge by The Club', 'Terminal 2, after security', 'chase-sapphire'],
  ['SAN', 'Aspire Lounge', 'Terminal 2, after security', 'independent'],

  // ---------- SAT ----------
  ['SAT', 'United Club', 'Terminal B, between Gates B3 and B5', 'united-club'],

  // ---------- SEA ----------
  ['SEA', 'Delta Sky Club', 'Concourse A, near Gate A1', 'delta-sky-club'],
  ['SEA', 'Delta Sky Club', 'Concourse A, near Gate A11', 'delta-sky-club'],
  ['SEA', 'Delta One Lounge', 'Concourse A, level 4 near Gate A11', 'delta-one'],
  ['SEA', 'Alaska Lounge', 'Concourse C, mezzanine near Gate C16', 'alaska'],
  ['SEA', 'Alaska Lounge', 'Concourse D, just beyond the central security checkpoint', 'alaska'],
  ['SEA', 'Alaska Lounge', 'North Satellite, mezzanine above Gates N13 to N18', 'alaska'],
  ['SEA', 'British Airways Terraces Lounge', 'South Satellite, near Gate S10', 'foreign-business'],
  ['SEA', 'The Centurion Lounge', 'Central Terminal, mezzanine level', 'centurion'],
  ['SEA', 'The Club SEA', 'Concourse A, near Gate A12', 'the-club'],
  ['SEA', 'The Club SEA', 'South Satellite, near Gate S9', 'the-club'],
  ['SEA', 'United Club', 'Concourse A, mezzanine across from Gate A10', 'united-club'],
  ['SEA', 'USO Lounge', 'Central Terminal, mezzanine above Checkpoint 3', 'uso'],

  // ---------- SFO ----------
  ['SFO', 'Alaska Lounge', 'Terminal 1, across from Gate B6', 'alaska'],
  ['SFO', 'Admirals Club', 'Terminal 1, Concourse B near Gate B13', 'admirals'],
  ['SFO', 'Delta Sky Club', 'Terminal 1, level 2 Concourse C near Gate C3', 'delta-sky-club'],
  ['SFO', 'The Club SFO', 'Terminal 1, near Gate B4', 'the-club'],
  ['SFO', 'USO Lounge', 'Terminal 1, pre-security above the American Airlines ticket counter', 'uso'],
  ['SFO', 'Air Canada Maple Leaf Lounge', 'Terminal 2, Sector 4 fourth floor', 'foreign-business'],
  ['SFO', 'The Centurion Lounge', 'Terminal 2, Concourse D near Gate D12', 'centurion'],
  ['SFO', 'United Club', 'Terminal 3, Concourse E mezzanine near Gate E4', 'united-club'],
  ['SFO', 'United Club', 'Terminal 3, Concourse F rotunda near Gate F11', 'united-club'],
  ['SFO', 'Air France-KLM Lounge', 'International Terminal A, level 3 after security', 'foreign-business'],
  ['SFO', 'Air India Maharaja Lounge', 'International Terminal A, level 4 near Gate A1', 'foreign-business'],
  ['SFO', 'British Airways Club Lounge', 'International Terminal A, near Gate A5', 'foreign-business'],
  ['SFO', 'Cathay Pacific First and Business Lounge', 'International Terminal A, level 4 near Gate A1', 'foreign-business'],
  ['SFO', 'China Airlines Dynasty Lounge', 'International Terminal A, level 4 after security', 'foreign-business'],
  ['SFO', 'Emirates Lounge', 'International Terminal A, between Gates A2 and A6', 'foreign-business'],
  ['SFO', 'Golden Gate Lounge', 'International Terminal A, level 4 after security', 'independent'],
  ['SFO', 'Virgin Atlantic Clubhouse', 'International Terminal A, level 5 left after security', 'foreign-business'],
  ['SFO', 'United Polaris Lounge', 'International Terminal G, right after security', 'united-polaris'],
  ['SFO', 'United Club', 'International Terminal G, between Gates G6 and G9', 'united-club'],

  // ---------- SJC ----------
  ['SJC', 'The Club SJC', 'Terminal A, level 3 near Gate 15', 'the-club'],
  ['SJC', 'The Club SJC', 'Terminal B, main level after security', 'the-club'],

  // ---------- SJU ----------
  ['SJU', 'Escape Lounge', 'Concourse B, opposite Gate B2', 'escape'],

  // ---------- SLC ----------
  ['SLC', 'Delta Sky Club', 'Concourse A, level 2', 'delta-sky-club'],
  ['SLC', 'Delta Sky Club', 'Concourse B, near Gate B15', 'delta-sky-club'],
  ['SLC', 'The Centurion Lounge', 'Concourse B, near Gate B31', 'centurion'],

  // ---------- SMF ----------
  ['SMF', 'Escape Lounge', 'Terminal A, near Gate A10', 'escape'],
  ['SMF', 'Escape Lounge', 'Terminal B, after security', 'escape'],

  // ---------- SNA ----------
  ['SNA', 'United Club', 'Main Terminal, across from Gate 9', 'united-club'],
  ['SNA', 'Admirals Club', 'Main Terminal, mezzanine level adjacent to Gate 8', 'admirals'],

  // ---------- STL ----------
  ['STL', 'Admirals Club', 'Terminal 1, Concourse C entrance', 'admirals'],

  // ---------- SYR ----------
  ['SYR', 'Escape Lounge', 'Main Terminal, between security and Concourse A near Gate 1', 'escape'],

  // ---------- TPA ----------
  ['TPA', 'Delta Sky Club', 'Airside E, near Gate 68', 'delta-sky-club'],
  ['TPA', 'Admirals Club', 'Airside F, adjacent to Gate 85', 'admirals'],

  // ---------- TUL ----------
  ['TUL', 'Escape Lounge', 'Main Terminal, immediately left after security', 'escape'],

  // ---------- XNA ----------
  ['XNA', 'Escape Lounge', 'Main corridor, next to the walkway for Gates A1 to A12', 'escape'],
];
