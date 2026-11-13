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

// Full airport names. A maps app can find "Seattle–Tacoma International
// Airport"; it cannot find "SEA". Also used as the accessible label for the
// airport code on the detail page.
export const AIRPORT_NAMES = {
  ANC: 'Ted Stevens Anchorage International Airport',
  ATL: 'Hartsfield–Jackson Atlanta International Airport',
  AUS: 'Austin–Bergstrom International Airport',
  BDL: 'Bradley International Airport',
  BNA: 'Nashville International Airport',
  BOS: 'Boston Logan International Airport',
  BUF: 'Buffalo Niagara International Airport',
  BWI: 'Baltimore/Washington International Thurgood Marshall Airport',
  CHS: 'Charleston International Airport',
  CLE: 'Cleveland Hopkins International Airport',
  CLT: 'Charlotte Douglas International Airport',
  CMH: 'John Glenn Columbus International Airport',
  CVG: 'Cincinnati/Northern Kentucky International Airport',
  DCA: 'Ronald Reagan Washington National Airport',
  DEN: 'Denver International Airport',
  DFW: 'Dallas/Fort Worth International Airport',
  DTW: 'Detroit Metropolitan Wayne County Airport',
  EWR: 'Newark Liberty International Airport',
  FLL: 'Fort Lauderdale–Hollywood International Airport',
  GRR: 'Gerald R. Ford International Airport',
  GSP: 'Greenville–Spartanburg International Airport',
  GUM: 'Antonio B. Won Pat International Airport',
  HNL: 'Daniel K. Inouye International Airport',
  IAD: 'Washington Dulles International Airport',
  IAH: 'George Bush Intercontinental Airport',
  IND: 'Indianapolis International Airport',
  JAX: 'Jacksonville International Airport',
  JFK: 'John F. Kennedy International Airport',
  LAS: 'Harry Reid International Airport',
  LAX: 'Los Angeles International Airport',
  LGA: 'LaGuardia Airport',
  MCI: 'Kansas City International Airport',
  MCO: 'Orlando International Airport',
  MDW: 'Chicago Midway International Airport',
  MEM: 'Memphis International Airport',
  MIA: 'Miami International Airport',
  MKE: 'Milwaukee Mitchell International Airport',
  MSP: 'Minneapolis–Saint Paul International Airport',
  MSY: 'Louis Armstrong New Orleans International Airport',
  OAK: 'San Francisco Bay Oakland International Airport',
  OGG: 'Kahului Airport',
  ORD: 'O’Hare International Airport',
  PBI: 'Palm Beach International Airport',
  PDX: 'Portland International Airport',
  PHL: 'Philadelphia International Airport',
  PHX: 'Phoenix Sky Harbor International Airport',
  PIT: 'Pittsburgh International Airport',
  PVD: 'Rhode Island T. F. Green International Airport',
  RDU: 'Raleigh–Durham International Airport',
  RNO: 'Reno–Tahoe International Airport',
  SAN: 'San Diego International Airport',
  SAT: 'San Antonio International Airport',
  SEA: 'Seattle–Tacoma International Airport',
  SFO: 'San Francisco International Airport',
  SJC: 'San José Mineta International Airport',
  SJU: 'Luis Muñoz Marín International Airport',
  SLC: 'Salt Lake City International Airport',
  SMF: 'Sacramento International Airport',
  SNA: 'John Wayne Airport',
  STL: 'St. Louis Lambert International Airport',
  SYR: 'Syracuse Hancock International Airport',
  TPA: 'Tampa International Airport',
  TUL: 'Tulsa International Airport',
  XNA: 'Northwest Arkansas National Airport',
};

// Everything a traveller can hold that opens a lounge door, and that stays
// true from one trip to the next. Today's boarding pass is deliberately not in
// here: cabin- and route-based entry is described on each brand, but it cannot
// be answered in advance, so the access checker never claims it.
export const CREDENTIALS = [
  // --- lounge memberships you buy or earn outright ---
  { id: 'delta-sky-club-member', group: 'membership', label: 'Delta Sky Club membership' },
  { id: 'united-club-member', group: 'membership', label: 'United Club membership' },
  { id: 'admirals-club-member', group: 'membership', label: 'Admirals Club membership' },
  { id: 'alaska-lounge-member', group: 'membership', label: 'Alaska Lounge or Lounge+ membership' },
  { id: 'premier-club-member', group: 'membership', label: 'Hawaiian Premier Club membership' },

  // --- network programs ---
  { id: 'priority-pass', group: 'program', label: 'Priority Pass or LoungeKey' },

  // --- credit cards ---
  { id: 'amex-platinum', group: 'card', label: 'Amex Platinum or Business Platinum' },
  { id: 'amex-centurion', group: 'card', label: 'Amex Centurion' },
  { id: 'delta-reserve', group: 'card', label: 'Delta SkyMiles Reserve' },
  { id: 'venture-x', group: 'card', label: 'Capital One Venture X or Spark Travel Elite' },
  { id: 'sapphire-reserve', group: 'card', label: 'Chase Sapphire Reserve or J.P. Morgan Reserve' },
  { id: 'citi-aa-executive', group: 'card', label: 'Citi / AAdvantage Executive' },
  { id: 'united-club-card', group: 'card', label: 'United Club Infinite or Business Card' },
  { id: 'jetblue-premier', group: 'card', label: 'JetBlue Premier or Business Card' },

  // --- airline elite status ---
  { id: 'delta-360', group: 'status', label: 'Delta 360°' },
  { id: 'skyteam-elite-plus', group: 'status', label: 'SkyTeam Elite Plus' },
  { id: 'star-gold', group: 'status', label: 'Star Alliance Gold' },
  { id: 'ow-sapphire', group: 'status', label: 'oneworld Sapphire' },
  { id: 'ow-emerald', group: 'status', label: 'oneworld Emerald' },
  { id: 'aa-exec-platinum', group: 'status', label: 'AAdvantage Executive Platinum' },
  { id: 'mosaic-4', group: 'status', label: 'TrueBlue Mosaic 4' },

  // --- everything else ---
  { id: 'military-id', group: 'military', label: 'Military ID' },
];

// Display order and headings for the groups above, plus the two route kinds
// that are never a stored credential.
export const CREDENTIAL_GROUPS = [
  { id: 'membership', label: 'Membership' },
  { id: 'program', label: 'Lounge program' },
  { id: 'card', label: 'Credit card' },
  { id: 'status', label: 'Elite status' },
  { id: 'cabin', label: "Today's ticket" },
  { id: 'military', label: 'Military' },
  { id: 'paid', label: 'Pay at the door' },
];

// Alliance membership by carrier, used to turn a foreign carrier's lounge into
// a route the access checker can actually match. Keyed by a fragment of the
// lounge name. Carriers in no alliance are listed as null so an unmapped name
// is a genuine gap rather than a silent omission.
export const CARRIER_ALLIANCES = {
  'Aer Lingus': null,
  'Air Canada': 'star',
  'Air France': 'skyteam',
  'Air India': 'star',
  'Avianca': 'star',
  'British Airways': 'oneworld',
  'Cathay Pacific': 'oneworld',
  'Chelsea Lounge': 'oneworld',
  'China Airlines': 'skyteam',
  'Emirates': null,
  'Horizons': null,
  'Iberia': 'oneworld',
  'Japan Airlines': 'oneworld',
  'JAL': 'oneworld',
  'KAL': 'skyteam',
  'KLM': 'skyteam',
  'Korean Air': 'skyteam',
  'LATAM': null,
  'LOT': 'star',
  'Lufthansa': 'star',
  'oneworld': 'oneworld',
  'Qantas': 'oneworld',
  'Qatar': 'oneworld',
  'SAS': 'skyteam',
  'Star Alliance': 'star',
  'Swiss': 'star',
  'TAP': 'star',
  'Turkish': 'star',
  'Virgin Atlantic': 'skyteam',
};

// The elite tier each alliance admits to a business-class lounge, and to a
// first-class lounge.
export const ALLIANCE_STATUS = {
  star: { business: 'star-gold', first: 'star-gold' },
  oneworld: { business: 'ow-sapphire', first: 'ow-emerald' },
  skyteam: { business: 'skyteam-elite-plus', first: 'skyteam-elite-plus' },
};

// Lounge "brands". Each carries an editorial quality tier, a sentence
// describing the room, and a structured account of who gets in.
//
// `routes` lists every way through the door as a tuple:
//
//   [via, credential, label, note]
//
// `via` groups the route for display. `credential` is an id from CREDENTIALS
// when the route turns on something the traveller holds year-round — those are
// the routes the access checker matches. It is null when entry depends on
// today's ticket or on buying in at the door.
//
// Access rules move constantly (visit caps, guest fees and day-pass
// availability especially). These reflect published policy as of August 2026
// and the site tells travellers to confirm before flying.
export const BRANDS = {
  'delta-sky-club': {
    tier: 4.3,
    blurb:
      'Delta’s flagship domestic club, with a hot-and-cold buffet, a full bar, fast Wi-Fi, and plenty of power-equipped seating.',
    summary: 'Sky Club members, Delta One passengers, and eligible Amex cardholders with visits left.',
    routes: [
      ['membership', 'delta-sky-club-member', 'Delta Sky Club membership', 'Individual or Executive. Diamond and Platinum Medallions can take one as a Choice Benefit.'],
      ['card', 'delta-reserve', 'Delta SkyMiles Reserve Card', 'Capped number of visits a year, lifted at high annual spend. Delta flights only.'],
      ['card', 'amex-platinum', 'Amex Platinum or Business Platinum', 'Capped number of visits a year, and only when you are flying Delta.'],
      ['status', 'delta-360', 'Delta 360° members', 'On any same-day Delta flight.'],
      ['status', 'skyteam-elite-plus', 'SkyTeam Elite Plus', 'Only on a same-day international Delta or SkyTeam flight, not domestic.'],
      ['cabin', null, 'Delta One passengers', 'Same-day Delta One or SkyTeam international business class.'],
    ],
    guests: 'Members may bring guests for a per-person fee; card-based entry usually admits the cardholder alone.',
    arrival: 'Enter up to three hours before your departure, or any time while connecting.',
    dayPass: null,
    dayPassNote: 'Delta no longer sells single-visit passes — entry is by membership, card, or ticket.',
  },
  'delta-one': {
    tier: 4.8,
    blurb:
      'Delta’s premium long-haul lounge, with a seated à la carte restaurant, a cocktail bar, shower suites, and a quiet wellness area.',
    summary: 'Delta One passengers and Delta 360° members only — a Sky Club membership does not open this door.',
    routes: [
      ['cabin', null, 'Delta One passengers', 'Same-day Delta One ticket on a qualifying long-haul route.'],
      ['status', 'delta-360', 'Delta 360° members', 'Flying Delta the same day.'],
    ],
    guests: 'No guesting — admission is by eligible ticket only.',
    arrival: 'Opens three hours before the first departure; entry within three hours of your flight.',
    dayPass: null,
    dayPassNote: 'Not for sale at any price. Sky Club members without a Delta One ticket are directed to the Sky Club.',
  },
  'united-club': {
    tier: 4.2,
    blurb:
      'A comfortable pre-flight retreat with complimentary snacks, a bar, productivity seating, and complimentary Wi-Fi.',
    summary: 'United Club members and cardholders, long-haul premium passengers, and one-time pass buyers.',
    routes: [
      ['membership', 'united-club-member', 'United Club membership', 'Individual or corporate.'],
      ['card', 'united-club-card', 'United Club Infinite or Business Card', 'Cardholder plus two guests or immediate family.'],
      ['status', 'star-gold', 'Star Alliance Gold', 'Only on a same-day international itinerary — domestic-only trips do not qualify.'],
      ['cabin', null, 'Long-haul premium cabin passengers', 'United Polaris or international business and first class.'],
      ['paid', null, 'One-time pass', 'Bought with cash or miles, subject to capacity.'],
    ],
    guests: 'Members may bring one adult guest or their dependent children.',
    arrival: 'Any time on the day you fly, as long as you hold a same-day boarding pass.',
    dayPass: 'Sold in the United app and at the desk, subject to capacity.',
  },
  'united-club-fly': {
    tier: 3.9,
    blurb:
      'United’s compact grab-and-go format, built for short connections: packaged food, self-serve drinks, and limited seating.',
    summary: 'United Club members and cardholders only — one-time passes are not accepted here.',
    routes: [
      ['membership', 'united-club-member', 'United Club membership', ''],
      ['card', 'united-club-card', 'United Club Infinite or Business Card', ''],
    ],
    guests: 'Guest rules follow the standard United Club, but seating is tight and entry can be capped.',
    arrival: 'Same-day boarding pass required.',
    dayPass: null,
    dayPassNote: 'One-time passes are not accepted at United Club Fly locations.',
  },
  'united-polaris': {
    tier: 4.8,
    blurb:
      'United’s premium international lounge, with a sit-down dining room, private daybeds, shower suites, and a well-stocked bar.',
    summary: 'Same-day international business and first class passengers only. Status and memberships do not get you in.',
    routes: [
      ['cabin', null, 'United Polaris business class', 'Same-day departure on a Polaris-configured international flight.'],
      ['cabin', null, 'Star Alliance international first or business class', 'Departing the same day on a partner airline.'],
    ],
    guests: 'No guests, including for Premier 1K members and United Club cardholders.',
    arrival: 'Opens with the first Polaris departure bank; enter any time before your flight.',
    dayPass: null,
    dayPassNote: 'Never sold. A United Club membership does not admit you.',
  },
  admirals: {
    tier: 4.1,
    blurb:
      'American’s core club, offering complimentary light bites, a self-serve bar, workspaces, and shower suites at larger locations.',
    summary: 'Admirals Club members, Citi/AAdvantage Executive cardholders, Flagship passengers, and day-pass buyers.',
    routes: [
      ['membership', 'admirals-club-member', 'Admirals Club membership', 'Annual or lifetime.'],
      ['card', 'citi-aa-executive', 'Citi / AAdvantage Executive Card', 'Cardholder plus up to two guests or immediate family.'],
      ['status', 'ow-sapphire', 'oneworld Sapphire or Emerald', 'Only on a same-day international oneworld flight — not on domestic trips.'],
      ['cabin', null, 'Flagship First or Flagship Business passengers', 'On qualifying long-haul or transcontinental routes.'],
      ['paid', null, 'Day pass', 'Sold online or at the door, subject to capacity.'],
    ],
    guests: 'Members bring two guests or immediate family; extra guests pay a per-person fee.',
    arrival: 'Same-day boarding pass on American or a partner airline required.',
    dayPass: 'Sold online in advance or at the door.',
  },
  provisions: {
    tier: 3.9,
    blurb:
      'A grab-and-go outpost of the Admirals Club, built for quick stops: packaged meals, barista drinks, and limited seating.',
    summary: 'Admirals Club members and eligible AAdvantage elite and premium-cabin customers.',
    routes: [
      ['membership', 'admirals-club-member', 'Admirals Club membership', ''],
      ['card', 'citi-aa-executive', 'Citi / AAdvantage Executive Card', ''],
      ['status', 'ow-sapphire', 'oneworld Sapphire or Emerald', 'On a same-day qualifying international flight.'],
      ['cabin', null, 'Premium cabin passengers', 'Flagship or eligible same-day premium tickets.'],
    ],
    guests: 'Seating is minimal — guesting is limited and may be refused at capacity.',
    arrival: 'Same-day boarding pass required.',
    dayPass: null,
    dayPassNote: 'Not sold at Provisions locations.',
  },
  flagship: {
    tier: 4.6,
    blurb:
      'American’s premium international lounge, with a chef-driven buffet, a proper cocktail bar, showers, and quiet seating zones.',
    summary: 'Long-haul Flagship First and Business passengers, plus oneworld Emerald members.',
    routes: [
      ['cabin', null, 'Flagship First or Flagship Business', 'On qualifying long-haul international or transcontinental routes.'],
      ['status', 'ow-emerald', 'oneworld Emerald', 'On a same-day qualifying international flight.'],
      ['status', 'aa-exec-platinum', 'AAdvantage Executive Platinum', 'On eligible long-haul itineraries.'],
    ],
    guests: 'Emerald members may bring one guest travelling on the same day.',
    arrival: 'Same-day qualifying boarding pass required; no early entry the day before.',
    dayPass: null,
    dayPassNote: 'Not sold. An Admirals Club membership does not admit you.',
  },
  alaska: {
    tier: 4.4,
    blurb:
      'A Pacific Northwest-inspired lounge known for its pancake machine, barista-made espresso, local beer and wine, and big airfield windows.',
    summary: 'Alaska Lounge members, long-haul first class passengers, oneworld elites, and day-pass buyers.',
    routes: [
      ['membership', 'alaska-lounge-member', 'Alaska Lounge or Lounge+ membership', 'Lounge+ adds partner lounges worldwide.'],
      ['status', 'ow-sapphire', 'oneworld Sapphire or Emerald', 'On a same-day qualifying flight.'],
      ['cabin', null, 'Alaska first class', 'On flights over roughly 2,100 miles.'],
      ['paid', null, 'Day pass', 'Sold in the Alaska app, subject to capacity.'],
    ],
    guests: 'Lounge+ members bring two guests; standard members pay per guest.',
    arrival: 'Same-day boarding pass on Alaska or a partner airline required.',
    dayPass: 'Sold in the Alaska app and at the desk.',
  },
  centurion: {
    tier: 4.6,
    blurb:
      'American Express’ flagship lounge, with a locally inspired menu from a named chef, a craft cocktail bar, and a dedicated family room.',
    summary: 'Amex Platinum and Centurion cardholders flying the same day. The card is the only way in.',
    routes: [
      ['card', 'amex-platinum', 'Amex Platinum or Business Platinum', 'Flying the same day on any airline.'],
      ['card', 'amex-centurion', 'Amex Centurion', 'Cardholder plus two guests included.'],
      ['card', 'delta-reserve', 'Delta SkyMiles Reserve', 'Only when you are flying Delta that day.'],
    ],
    guests: 'Platinum cardholders pay a per-guest fee unless they hit the annual spend threshold; Centurion members bring two free.',
    arrival: 'Enter up to three hours before departure, or any time while connecting.',
    dayPass: null,
    dayPassNote: 'No day passes and no walk-ins — an eligible card is the ticket.',
  },
  'capital-one-lounge': {
    tier: 4.5,
    blurb:
      'A wellness-minded lounge with a made-to-order menu, a self-pour tap wall, peloton bikes, and grab-and-go for tight connections.',
    summary: 'Venture X and Spark Travel Elite cardholders; everyone else can buy a day pass.',
    routes: [
      ['card', 'venture-x', 'Venture X, Venture X Business or Spark Travel Elite', 'Cardholder access on a same-day flight.'],
      ['paid', null, 'Day pass', 'Open to other Capital One cardholders and to guests.'],
    ],
    guests: 'Guest allowance depends on your annual card spend; beyond it, guests pay a per-person fee.',
    arrival: 'Enter up to three hours before departure. Reserve ahead at busy locations.',
    dayPass: 'Sold to other Capital One cardholders and accompanying guests.',
  },
  'capital-one-landing': {
    tier: 4.3,
    blurb:
      'Capital One’s restaurant-style format: a full-service dining room and bar with a smaller lounge seating area alongside.',
    summary: 'Venture X and Spark Travel Elite cardholders, with day passes for other travellers.',
    routes: [
      ['card', 'venture-x', 'Venture X, Venture X Business or Spark Travel Elite', 'Cardholder access on a same-day flight.'],
      ['paid', null, 'Day pass', 'Available to other travellers, subject to capacity.'],
    ],
    guests: 'Guest allowance depends on annual card spend; extra guests pay a fee.',
    arrival: 'Walk-ins accepted; reservations recommended for the dining room.',
    dayPass: 'Sold to non-cardholders, subject to capacity.',
  },
  'chase-sapphire': {
    tier: 4.6,
    blurb:
      'A design-forward lounge from Chase and The Club, with a full restaurant menu, a cocktail program, showers, and wellness suites.',
    summary: 'Sapphire Reserve cardholders, with limited Priority Pass visits and day passes.',
    routes: [
      ['card', 'sapphire-reserve', 'Sapphire Reserve, J.P. Morgan Reserve or Ritz-Carlton', 'Unlimited visits on a same-day flight.'],
      ['program', 'priority-pass', 'Priority Pass', 'A limited number of visits a year, subject to capacity.'],
      ['paid', null, 'Day pass', 'Sold when space allows.'],
    ],
    guests: 'Reserve cardholders bring two guests at no charge; Priority Pass guests pay.',
    arrival: 'Same-day boarding pass required; enter up to three hours before departure.',
    dayPass: 'Sold at the door when capacity allows.',
  },
  'chase-sapphire-terrace': {
    tier: 4.4,
    blurb:
      'A smaller Sapphire-branded terrace with local food and drink, natural light, and an outdoor-feeling seating area.',
    summary: 'Sapphire Reserve cardholders and Priority Pass members, subject to capacity.',
    routes: [
      ['card', 'sapphire-reserve', 'Sapphire Reserve or J.P. Morgan Reserve', ''],
      ['program', 'priority-pass', 'Priority Pass', 'Subject to capacity — this is a small room.'],
    ],
    guests: 'Limited guesting; expect to be turned away at peak times.',
    arrival: 'Same-day boarding pass required.',
    dayPass: null,
    dayPassNote: 'Not sold — capacity is reserved for cardholders and pass members.',
  },
  escape: {
    tier: 4.0,
    blurb:
      'An independent lounge with a locally sourced hot buffet, complimentary beer and wine, and a calm, well-lit seating area.',
    summary: 'Amex Platinum and Centurion cardholders, Priority Pass members, and walk-in day-pass buyers.',
    routes: [
      ['card', 'amex-platinum', 'Amex Platinum or Business Platinum', 'Admitted as a Centurion Studio Partner lounge.'],
      ['card', 'amex-centurion', 'Amex Centurion', ''],
      ['program', 'priority-pass', 'Priority Pass', 'One visit per member per day.'],
      ['paid', null, 'Walk-in day pass', 'Cheaper booked online in advance than at the door.'],
    ],
    guests: 'Guests pay the standard day-pass rate unless your card or pass includes them.',
    arrival: 'Book ahead at peak hours — these lounges are small and fill early.',
    dayPass: 'Sold online in advance at a discount, or at the door.',
  },
  'the-club': {
    tier: 3.9,
    blurb:
      'An independent common-use lounge with self-serve snacks, complimentary beer and wine, showers at some locations, and quiet seating.',
    summary: 'Priority Pass and LoungeKey members, participating airline passengers, and day-pass buyers.',
    routes: [
      ['program', 'priority-pass', 'Priority Pass or LoungeKey', ''],
      ['cabin', null, 'Participating airline premium passengers', 'Varies by airport — check with your carrier.'],
      ['paid', null, 'Day pass', 'Walk-up or booked online.'],
    ],
    guests: 'Guests admitted at the day-pass rate, or free depending on your pass tier.',
    arrival: 'Same-day boarding pass required.',
    dayPass: 'Sold online and at the door.',
  },
  'plaza-premium': {
    tier: 4.0,
    blurb:
      'A pay-in common-use lounge with a hot buffet, a bar, shower rooms, and optional private rest suites.',
    summary: 'Priority Pass members, partner airline premium passengers, and anyone willing to pay.',
    routes: [
      ['program', 'priority-pass', 'Priority Pass', 'Accepted at most, though not all, locations.'],
      ['cabin', null, 'Premium cabin passengers on participating airlines', ''],
      ['paid', null, 'Day pass', 'Sold by the hour or for a fixed stay.'],
    ],
    guests: 'Guests pay the walk-in rate.',
    arrival: 'Walk-ins welcome; rest suites should be booked ahead.',
    dayPass: 'Sold by duration — typically a two- or six-hour stay.',
  },
  'plaza-premium-first': {
    tier: 4.4,
    blurb:
      'Plaza Premium’s upgraded first-class product, with à la carte dining, a champagne bar, and private shower suites.',
    summary: 'Partner airline premium passengers and paying guests. Priority Pass is not accepted.',
    routes: [
      ['cabin', null, 'Premium cabin passengers on partner airlines', ''],
      ['paid', null, 'Day pass', 'Premium rate, booked ahead or at the door.'],
    ],
    guests: 'Guests pay the full walk-in rate.',
    arrival: 'Reserve ahead — capacity is deliberately small.',
    dayPass: 'Sold at a premium rate.',
    dayPassNote: 'Priority Pass is not accepted at the First format.',
  },
  uso: {
    tier: 4.8,
    blurb:
      'A free lounge for the military community, with snacks, hot drinks, family space, rest areas, and volunteer-run hospitality.',
    summary: 'Free for the military community with valid ID — active duty, Guard, Reserve, retirees, and dependents.',
    routes: [
      ['military', 'military-id', 'Valid military ID', 'Active duty, National Guard, Reserve, retirees, and dependents.'],
    ],
    guests: 'Immediate family travelling with you are welcome.',
    arrival: 'No boarding pass needed at pre-security locations; hours vary by centre.',
    dayPass: null,
    dayPassNote: 'Always free — the USO never charges for entry.',
  },
  military: {
    tier: 4.7,
    blurb: 'A volunteer-run hospitality lounge offering refreshments, quiet seating, and a place to rest between flights.',
    summary: 'Free for service members, veterans, and their families with valid identification.',
    routes: [
      ['military', 'military-id', 'Valid military or veteran ID', 'Active duty, retired, and veteran service members and their families.'],
    ],
    guests: 'Family members travelling with you are welcome.',
    arrival: 'Hours depend on volunteer staffing — check before you rely on it.',
    dayPass: null,
    dayPassNote: 'Always free.',
  },
  'foreign-business': {
    tier: 4.3,
    blurb:
      'An airline-operated international lounge with a hot buffet reflecting the carrier’s home cuisine, a full bar, and showers.',
    summary: 'Business class passengers and alliance elite members on the operating carrier.',
    routes: [
      ['cabin', null, 'Business class on the operating carrier', 'Same-day international departure.'],
      ['program', 'priority-pass', 'Priority Pass', 'At participating locations only — many of these lounges do not accept it.'],
    ],
    guests: 'Guest rules are set by the operating carrier; most admit one guest for elite members.',
    arrival: 'Same-day boarding pass on the operating carrier or a partner required.',
    dayPass: null,
    dayPassNote: 'Rarely sold. Some carriers admit paying walk-ins when quiet — ask at the desk.',
  },
  'foreign-first': {
    tier: 4.7,
    blurb:
      'A first-class lounge with à la carte dining, premium champagne, private shower suites, and dedicated attentive service.',
    summary: 'First class passengers and top-tier elite members on the operating carrier and its partners.',
    routes: [
      ['cabin', null, 'First class on the operating carrier', 'Same-day international departure.'],
    ],
    guests: 'Usually one guest, and only when travelling on the same itinerary.',
    arrival: 'Same-day first class boarding pass required.',
    dayPass: null,
    dayPassNote: 'Not sold at any price.',
  },
  alliance: {
    tier: 4.5,
    blurb:
      'A shared alliance lounge serving multiple partner carriers, with an extensive buffet, a full bar, showers, and terrace seating.',
    summary: 'International first and business class passengers and alliance Gold members on partner airlines.',
    routes: [
      ['cabin', null, 'International first or business class', 'Departing the same day on a member airline.'],
    ],
    guests: 'Elite members may bring one guest travelling on a partner airline the same day.',
    arrival: 'Same-day international boarding pass on a member airline required.',
    dayPass: null,
    dayPassNote: 'Not sold — alliance lounges admit by ticket and status only.',
  },
  independent: {
    tier: 3.9,
    blurb:
      'An independent lounge open to pass holders and walk-ins, with complimentary refreshments, Wi-Fi, and quiet seating.',
    summary: 'Priority Pass and LoungeKey members, participating airline passengers, and day-pass buyers.',
    routes: [
      ['program', 'priority-pass', 'Priority Pass or LoungeKey', ''],
      ['cabin', null, 'Participating airline passengers', 'Varies by airport.'],
      ['paid', null, 'Day pass', 'Walk-up rate, subject to capacity.'],
    ],
    guests: 'Guests pay the walk-in rate.',
    arrival: 'Same-day boarding pass required.',
    dayPass: 'Sold at the door.',
  },
  jetblue: {
    tier: 4.4,
    blurb:
      'JetBlue’s lounge concept, with a seated dining area, a self-pour bar, and a bright lounge space for Mint travelers.',
    summary: 'Transatlantic Mint passengers, Mosaic 4 members, and eligible JetBlue cardholders.',
    routes: [
      ['status', 'mosaic-4', 'TrueBlue Mosaic 4', 'On a same-day JetBlue flight.'],
      ['card', 'jetblue-premier', 'JetBlue Premier or Business Card', 'Limited visits a year.'],
      ['cabin', null, 'Transatlantic Mint passengers', 'Same-day Mint ticket on a transatlantic route.'],
    ],
    guests: 'One guest for Mosaic 4 members; Mint passengers enter alone unless travelling together.',
    arrival: 'Same-day JetBlue boarding pass required.',
    dayPass: null,
    dayPassNote: 'Not sold.',
  },
  hawaiian: {
    tier: 4.0,
    blurb: 'An island-relaxed lounge with local snacks, tropical drinks, complimentary Wi-Fi, and comfortable seating.',
    summary: 'Hawaiian first class passengers, Premier Club members, and day-pass buyers.',
    routes: [
      ['membership', 'premier-club-member', 'Premier Club membership', 'Annual membership sold by Hawaiian.'],
      ['cabin', null, 'Hawaiian first class', 'Same-day first class ticket.'],
      ['paid', null, 'Day pass', 'Sold at the desk, subject to capacity.'],
    ],
    guests: 'Premier Club members may bring guests for a fee.',
    arrival: 'Same-day Hawaiian boarding pass required.',
    dayPass: 'Sold at the desk.',
  },
};

// The amenity vocabulary, in the order it should be presented.
// Grouped loosely: connectivity, food and drink, rest, work, extras.
export const AMENITY_CATALOG = [
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'charging', label: 'Power at seats' },
  { id: 'dining', label: 'Hot buffet' },
  { id: 'alacarte', label: 'À la carte dining' },
  { id: 'barista', label: 'Barista coffee' },
  { id: 'bar', label: 'Full bar' },
  { id: 'showers', label: 'Showers' },
  { id: 'quiet', label: 'Quiet area' },
  { id: 'naps', label: 'Rest suites' },
  { id: 'workspace', label: 'Workspaces' },
  { id: 'conference', label: 'Meeting rooms' },
  { id: 'family', label: 'Family room' },
  { id: 'terrace', label: 'Outdoor terrace' },
  { id: 'runway', label: 'Runway views' },
  { id: 'spa', label: 'Spa treatments' },
  { id: 'fitness', label: 'Fitness area' },
  { id: 'luggage', label: 'Luggage storage' },
  { id: 'daypass', label: 'Day passes' },
];

// What each brand actually offers, keyed by brand.
//
// This used to be inferred by string-matching the description on the detail
// page, which greyed out Wi-Fi on two-thirds of lounges simply because the
// blurb did not happen to use the word. Amenities are data, not prose.
//
// Order does not matter here — the generator sorts each list into
// AMENITY_CATALOG order so presentation stays consistent.
export const BRAND_AMENITIES = {
  'delta-sky-club': ['wifi', 'charging', 'dining', 'barista', 'bar', 'quiet', 'workspace', 'runway'],
  'delta-one': [
    'wifi', 'charging', 'dining', 'alacarte', 'barista', 'bar', 'showers',
    'quiet', 'naps', 'workspace', 'runway', 'spa',
  ],
  'united-club': [
    'wifi', 'charging', 'dining', 'barista', 'bar', 'quiet', 'workspace',
    'conference', 'family', 'runway', 'daypass',
  ],
  'united-club-fly': ['wifi', 'charging', 'dining', 'barista'],
  'united-polaris': [
    'wifi', 'charging', 'dining', 'alacarte', 'barista', 'bar', 'showers',
    'quiet', 'naps', 'workspace', 'runway',
  ],
  admirals: [
    'wifi', 'charging', 'dining', 'barista', 'bar', 'quiet', 'workspace',
    'conference', 'family', 'daypass',
  ],
  provisions: ['wifi', 'charging', 'dining', 'barista', 'daypass'],
  flagship: [
    'wifi', 'charging', 'dining', 'alacarte', 'barista', 'bar', 'showers',
    'quiet', 'workspace', 'runway',
  ],
  alaska: ['wifi', 'charging', 'dining', 'barista', 'bar', 'quiet', 'workspace', 'runway', 'daypass'],
  centurion: [
    'wifi', 'charging', 'dining', 'alacarte', 'barista', 'bar', 'quiet',
    'workspace', 'family', 'runway', 'daypass',
  ],
  'capital-one-lounge': [
    'wifi', 'charging', 'dining', 'alacarte', 'barista', 'bar', 'showers',
    'quiet', 'naps', 'workspace', 'family', 'fitness', 'daypass',
  ],
  'capital-one-landing': [
    'wifi', 'charging', 'dining', 'alacarte', 'bar', 'quiet', 'workspace', 'daypass',
  ],
  'chase-sapphire': [
    'wifi', 'charging', 'dining', 'alacarte', 'barista', 'bar', 'showers',
    'quiet', 'workspace', 'spa', 'daypass',
  ],
  'chase-sapphire-terrace': [
    'wifi', 'charging', 'dining', 'barista', 'bar', 'quiet', 'workspace', 'terrace', 'daypass',
  ],
  escape: ['wifi', 'charging', 'dining', 'bar', 'quiet', 'workspace', 'runway', 'daypass'],
  'the-club': ['wifi', 'charging', 'dining', 'bar', 'quiet', 'workspace', 'daypass'],
  'plaza-premium': [
    'wifi', 'charging', 'dining', 'bar', 'showers', 'quiet', 'naps',
    'workspace', 'luggage', 'daypass',
  ],
  'plaza-premium-first': [
    'wifi', 'charging', 'dining', 'alacarte', 'bar', 'showers', 'quiet',
    'naps', 'workspace', 'luggage', 'daypass',
  ],
  uso: ['wifi', 'charging', 'dining', 'quiet', 'naps', 'family', 'workspace'],
  military: ['wifi', 'charging', 'dining', 'quiet', 'family'],
  'foreign-business': [
    'wifi', 'charging', 'dining', 'barista', 'bar', 'showers', 'quiet',
    'workspace', 'conference', 'runway',
  ],
  'foreign-first': [
    'wifi', 'charging', 'dining', 'alacarte', 'barista', 'bar', 'showers',
    'quiet', 'naps', 'workspace', 'spa', 'runway',
  ],
  alliance: [
    'wifi', 'charging', 'dining', 'alacarte', 'bar', 'showers', 'quiet',
    'workspace', 'terrace', 'runway',
  ],
  independent: ['wifi', 'charging', 'dining', 'bar', 'quiet', 'workspace', 'daypass'],
  jetblue: ['wifi', 'charging', 'dining', 'alacarte', 'bar', 'quiet', 'workspace', 'runway'],
  hawaiian: ['wifi', 'charging', 'dining', 'bar', 'quiet', 'workspace', 'runway'],
};

// Real, freely-licensed photographs of specific lounges, keyed by lounge id.
// Anything not listed here falls back to brand-consistent generic art.
//
// Every entry must be a free license (CC BY / CC BY-SA / public domain). The
// attribution here is rendered on the page, not just filed in CREDITS.md,
// because that is what these licenses actually require. Airline and
// card-issuer press photos are not usable, however freely they are handed out.
//
// Candidates come from `node scripts/harvest-photos.mjs`, but nothing lands
// here until a human has looked at the image: the harvester cheerfully
// matched a ribbon-cutting, a plate of hummus, and a USO tour in Iraq.
//
//   scope 'exact'   — this room.
//   scope 'airport' — this operator at this airport, but possibly a sibling
//                     room; the airport has several and the source did not say.
//   kind  'interior'/'entrance' — what you are actually looking at.
//
// Source files live in assets/lounges/real/.
export const LOUNGE_PHOTOS = {
  'bwi-the-club-bwi-concourse-d-airside-upper-level': {
    file: 'bwi-the-club',
    scope: 'exact',
    kind: 'interior',
    credit: 'G. Edward Johnson',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:The_Club_lounge_interior_BWI_MD_2025-05-13_15-38-50_1.jpg',
  },
  'dca-delta-sky-club-terminal-2-above-gate-b15': {
    file: 'dca-delta-sky-club',
    scope: 'exact',
    kind: 'entrance',
    credit: 'G. Edward Johnson',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Delta_Sky_Club_lounge_entrance_DCA_National_Airport_2025-10-22_13-11-26.jpg',
  },
  'dca-united-club-terminal-2-across-from-gate-b11': {
    file: 'dca-united-club',
    scope: 'exact',
    kind: 'entrance',
    credit: 'G. Edward Johnson',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:United_Club_lounge_entrance_DCA_National_Airport_2025-10-22_13-14-06.jpg',
  },
  'iad-capital-one-lounge-main-terminal-directly-after-the-tsa-precheck-checkpoint': {
    file: 'iad-capital-one-lounge',
    scope: 'exact',
    kind: 'entrance',
    credit: 'G. Edward Johnson',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Capital_One_Lounge_entrance_Dulles_Airport_VA_2025-09-02_19-48-01_1.jpg',
  },
  'jfk-chase-sapphire-lounge-by-the-club-terminal-4-upper-level-after-security': {
    file: 'jfk-chase-sapphire-lounge',
    scope: 'exact',
    kind: 'entrance',
    credit: 'Ajay Suresh',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Chase_Sapphire_Lounge_-_JFK_Terminal_4_(54984999499).jpg',
  },
  'jfk-the-centurion-lounge-terminal-4-level-4-beyond-the-tsa-checkpoints': {
    file: 'jfk-centurion-lounge',
    scope: 'exact',
    kind: 'entrance',
    credit: 'Ajay Suresh',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:American_Express_Centurion_Lounge_-_JFK_Terminal_4_(54984753321).jpg',
  },
  'lax-united-club-terminal-7-level-3-near-gate-71a': {
    file: 'lax-united-club-t7',
    scope: 'exact',
    kind: 'entrance',
    credit: 'ZhengZhou',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:United_Club_at_LAX_Terminal_7.png',
  },
  'mia-delta-sky-club-concourse-h-inside-the-h-j-connector': {
    file: 'mia-delta-sky-club',
    scope: 'exact',
    kind: 'interior',
    credit: 'DearEdward',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Delta_Sky_Club_@MIA_(7879899742).jpg',
  },
  'ord-united-club-terminal-1-concourse-b-near-gate-b6': {
    file: 'ord-united-club',
    scope: 'airport',
    kind: 'interior',
    credit: 'BlakMyers',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:United_Club_ORD.jpg',
  },
  'ord-united-polaris-lounge-terminal-1-concourse-c-near-gate-c18': {
    file: 'ord-polaris-lounge',
    scope: 'exact',
    kind: 'entrance',
    credit: 'Crishazzard',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Entrance_Sign_for_United_Polaris_Lounge_at_ORD_(Chicago)_Airport.jpg',
  },
  'sea-alaska-lounge-north-satellite-mezzanine-above-gates-n13-to-n18': {
    file: 'sea-alaska-lounge-north-satellite',
    scope: 'exact',
    kind: 'interior',
    credit: 'Zheng Zhou',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Alaska_Lounge_at_N_Concourse_of_Sea-Tac_Airport.jpg',
  },
  'sea-delta-sky-club-concourse-a-near-gate-a1': {
    file: 'sea-delta-sky-club-a',
    scope: 'exact',
    kind: 'interior',
    credit: 'Delta News Hub',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    source: 'https://commons.wikimedia.org/wiki/File:The_new_Delta_Sky_Club_in_Seattle_(30367396621).jpg',
  },
  'sea-delta-sky-club-concourse-a-near-gate-a11': {
    file: 'sea-delta-sky-club-b',
    scope: 'exact',
    kind: 'interior',
    credit: 'Delta News Hub',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    source: 'https://commons.wikimedia.org/wiki/File:The_new_Delta_Sky_Club_in_Seattle_(30156183840).jpg',
  },
};

// Generic art assigned per brand, so every Alaska Lounge looks like an Alaska
// Lounge instead of drawing a random image per location. Not a real photo of
// the specific room — just consistent and plausible.
export const BRAND_IMAGES = {
  'delta-sky-club': 'lounge_modern',
  'delta-one': 'lounge_firstclass',
  'united-club': 'lounge_premium',
  'united-club-fly': 'lounge_express',
  'united-polaris': 'lounge_firstclass',
  admirals: 'lounge_classic',
  provisions: 'lounge_express',
  flagship: 'lounge_premium',
  alaska: 'lounge_view',
  centurion: 'lounge_cozy',
  'capital-one-lounge': 'lounge_minimalist',
  'capital-one-landing': 'lounge_minimalist',
  'chase-sapphire': 'lounge_terrace',
  'chase-sapphire-terrace': 'lounge_terrace',
  escape: 'lounge_bright',
  'the-club': 'lounge_midwest',
  'plaza-premium': 'lounge_zen',
  'plaza-premium-first': 'lounge_vintage',
  uso: 'lounge_family',
  military: 'lounge_family',
  'foreign-business': 'lounge_tropical',
  'foreign-first': 'lounge_vintage',
  alliance: 'lounge_zen',
  independent: 'lounge_midwest',
  jetblue: 'lounge_bright',
  hawaiian: 'lounge_tropical',
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
