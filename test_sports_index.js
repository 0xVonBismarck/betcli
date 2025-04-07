// Import only the needed parts from the main script
// Copy of the Constants

// API Constants
const API_BASE_URL = 'https://overtimemarketsv2.xyz';
const DEFAULT_NETWORK_ID = 10; // Optimism

// Common Sport IDs
const SPORT_IDS = {
    NFL: 1,
    NBA: 4,  // Updated based on API
    MLB: 3,
    NHL: 6,  // Updated based on API
    SOCCER: 11, // Updated to match EPL as reference
    UFC: 7,
    TENNIS: 8,
    GOLF: 9,
    CRICKET: 20
};

// Comprehensive Sports and Leagues Index - Updated based on API data
const SPORTS_INDEX = {
    // American Football
    NFL: {
        id: 1,
        leagues: {
            NFL: { id: 1, name: "National Football League" },
            NCAA: { id: 2, name: "NCAA Football" },
            CFL: { id: 3, name: "Canadian Football League" }
        }
    },
    // Basketball
    BASKETBALL: {
        id: 4, // API shows NBA as id 4
        leagues: {
            NBA: { id: 4, name: "NBA" },
            NCAA: { id: 5, name: "NCAA Basketball" },
            EUROLEAGUE: { id: 20200, name: "Eurocup" },
            ITALY: { id: 20202, name: "Italy Lega Basket Serie A" },
            CHINA: { id: 20205, name: "China CBA" }
        }
    },
    // Baseball
    BASEBALL: {
        id: 3,
        leagues: {
            MLB: { id: 3, name: "MLB" },
            COLLEGE: { id: 303, name: "College Baseball" }
        }
    },
    // Hockey
    HOCKEY: {
        id: 6, // API shows NHL as id 6
        leagues: {
            NHL: { id: 6, name: "NHL" },
            KHL: { id: 321, name: "Russia KHL" },
            SHL: { id: 324, name: "Sweden SHL" },
            LIIGA: { id: 319, name: "Finland SM Liiga" }
        }
    },
    // Soccer
    SOCCER: {
        id: 10, // Using MLS id as reference
        leagues: {
            EPL: { id: 11, name: "EPL" },
            LA_LIGA: { id: 14, name: "La Liga" },
            SERIE_A: { id: 15, name: "Serie A" },
            BUNDESLIGA: { id: 13, name: "Bundesliga" },
            LIGUE_1: { id: 12, name: "Ligue 1" },
            MLS: { id: 10, name: "MLS" },
            CHAMPIONS_LEAGUE: { id: 16, name: "UEFA Champions League" },
            EUROPA_LEAGUE: { id: 17, name: "UEFA Europa League" },
            CONFERENCE_LEAGUE: { id: 10216, name: "UEFA Conference League" },
            BRAZIL: { id: 268, name: "Brazil Serie A" },
            MEXICO: { id: 230, name: "Liga MX" },
            PORTUGAL: { id: 61, name: "Primeira Liga" },
            NETHERLANDS: { id: 57, name: "Eredivisie" },
            LIBERTADORES: { id: 45, name: "Copa Libertadores" },
            JAPAN: { id: 19, name: "J1 League" },
            SAUDI: { id: 536, name: "Saudi Professional League" },
            ARGENTINA: { id: 20106, name: "Argentina Primera Division" },
            TURKEY: { id: 20108, name: "Turkey Super Lig" },
            CHINA: { id: 20112, name: "China Super League" },
            AUSTRALIA: { id: 20113, name: "Australia A-League" },
            EFL_CHAMPIONSHIP: { id: 20011, name: "EFL Championship" },
            BUNDESLIGA_2: { id: 20115, name: "Bundesliga 2" },
            LA_LIGA_2: { id: 20116, name: "La Liga 2" },
            SERIE_B: { id: 20117, name: "Serie B" },
            LIGUE_2: { id: 20119, name: "Ligue 2" },
            AUSTRIA: { id: 20120, name: "Austria Bundesliga" },
            ENGLAND_LEAGUE_1: { id: 20126, name: "England League 1" },
            THAI: { id: 20134, name: "Thai League 1" },
            CANADA: { id: 20149, name: "Canada Premier League" }
        }
    },
    // UFC/MMA
    FIGHTING: {
        id: 7,
        leagues: {
            UFC: { id: 7, name: "UFC" }
        }
    },
    // Tennis
    TENNIS: {
        id: 156, // Using ATP id from API
        leagues: {
            ATP: { id: 156, name: "ATP Events" }
        }
    },
    // Cricket
    CRICKET: {
        id: 20,
        leagues: {
            IPL: { id: 20, name: "Indian Premier League" }
        }
    },
    // eSports
    ESPORTS: {
        id: 9977, // Using CS2 id as reference
        leagues: {
            CS2: { id: 9977, name: "CS2" },
            LOL: { id: 10138, name: "LOL" },
            CALL_OF_DUTY: { id: 20298, name: "Call of Duty" },
            VALORANT: { id: 20300, name: "Valorant" }
        }
    },
    // Futures
    FUTURES: {
        id: 30003, // Using MLB Futures as reference
        leagues: {
            MLB: { id: 30003, name: "MLB Futures" },
            NBA: { id: 30004, name: "NBA Futures" },
            NHL: { id: 30006, name: "NHL Futures" },
            UEFA_CHAMPIONS: { id: 30016, name: "UEFA Champions League Futures" }
        }
    }
};

// Helper function to get sport ID by name
function getSportId(sportName) {
    if (!sportName) return null;
    
    // Handle special cases and common queries
    const normalizedName = sportName.toUpperCase().replace(/\s+/g, '_');
    
    if (normalizedName === 'NBA' || normalizedName === 'NCAA_BASKETBALL') {
        return SPORTS_INDEX.BASKETBALL.id;
    } else if (normalizedName === 'MLB') {
        return SPORTS_INDEX.BASEBALL.id;
    } else if (normalizedName === 'NHL') {
        return SPORTS_INDEX.HOCKEY.id;
    } else if (normalizedName === 'UFC' || normalizedName === 'MMA') {
        return SPORTS_INDEX.FIGHTING.id;
    } else if (normalizedName.includes('ESPORT')) {
        return SPORTS_INDEX.ESPORTS.id;
    }
    
    // For direct matches to our index
    return SPORTS_INDEX[normalizedName]?.id || null;
}

// Helper function to get league ID by sport and league name
function getLeagueId(sportName, leagueName) {
    if (!sportName || !leagueName) return null;
    
    // Handle special cases and common queries
    let sportKey = sportName.toUpperCase().replace(/\s+/g, '_');
    const leagueKey = leagueName.toUpperCase().replace(/\s+/g, '_');
    
    // Map sport names to our index keys
    if (sportKey === 'NBA' || sportKey === 'BASKETBALL') {
        sportKey = 'BASKETBALL';
    } else if (sportKey === 'MLB' || sportKey === 'BASEBALL') {
        sportKey = 'BASEBALL';
    } else if (sportKey === 'NHL' || sportKey === 'HOCKEY') {
        sportKey = 'HOCKEY';
    } else if (sportKey === 'UFC' || sportKey === 'MMA' || sportKey === 'FIGHTING') {
        sportKey = 'FIGHTING';
    }
    
    // Try to get league directly from the index
    const league = SPORTS_INDEX[sportKey]?.leagues[leagueKey];
    if (league) return league.id;
    
    // Handle special cases for leagues with spaces or variations
    if (sportKey === 'SOCCER') {
        if (leagueKey.includes('PREMIER') || leagueKey.includes('EPL')) {
            return SPORTS_INDEX.SOCCER.leagues.EPL.id;
        } else if (leagueKey.includes('CHAMPIONS')) {
            return SPORTS_INDEX.SOCCER.leagues.CHAMPIONS_LEAGUE.id;
        } else if (leagueKey.includes('EUROPA')) {
            return SPORTS_INDEX.SOCCER.leagues.EUROPA_LEAGUE.id;
        } else if (leagueKey.includes('LA_LIGA') || leagueKey === 'LALIGA') {
            return SPORTS_INDEX.SOCCER.leagues.LA_LIGA.id;
        } else if (leagueKey.includes('SERIE_A') || leagueKey === 'SERIEA') {
            return SPORTS_INDEX.SOCCER.leagues.SERIE_A.id;
        }
    } else if (sportKey === 'BASKETBALL') {
        if (leagueKey.includes('NCAA') || leagueKey.includes('COLLEGE')) {
            return SPORTS_INDEX.BASKETBALL.leagues.NCAA.id;
        }
    }
    
    return null;
}

// Run tests
console.log("==== SPORTS INDEX TEST ====");
console.log("\nSport IDs:");
console.log("NBA (Basketball):", SPORTS_INDEX.BASKETBALL.id);
console.log("MLB (Baseball):", SPORTS_INDEX.BASEBALL.id);
console.log("NHL (Hockey):", SPORTS_INDEX.HOCKEY.id);
console.log("UFC (Fighting):", SPORTS_INDEX.FIGHTING.id);
console.log("Soccer:", SPORTS_INDEX.SOCCER.id);
console.log("eSports:", SPORTS_INDEX.ESPORTS.id);

console.log("\nLeague IDs:");
console.log("NBA:", SPORTS_INDEX.BASKETBALL.leagues.NBA.id);
console.log("NCAA Basketball:", SPORTS_INDEX.BASKETBALL.leagues.NCAA.id);
console.log("NHL:", SPORTS_INDEX.HOCKEY.leagues.NHL.id);
console.log("KHL:", SPORTS_INDEX.HOCKEY.leagues.KHL.id);
console.log("EPL:", SPORTS_INDEX.SOCCER.leagues.EPL.id);
console.log("UFC:", SPORTS_INDEX.FIGHTING.leagues.UFC.id);
console.log("CS2:", SPORTS_INDEX.ESPORTS.leagues.CS2.id);

console.log("\nHelper Function Tests:");
console.log("getSportId('nba'):", getSportId('nba'));
console.log("getSportId('hockey'):", getSportId('hockey'));
console.log("getSportId('Fighting'):", getSportId('Fighting'));
console.log("getSportId('esports'):", getSportId('esports'));

console.log("\ngetLeagueId Tests:");
console.log("getLeagueId('basketball', 'nba'):", getLeagueId('basketball', 'nba'));
console.log("getLeagueId('hockey', 'nhl'):", getLeagueId('hockey', 'nhl'));
console.log("getLeagueId('soccer', 'premier league'):", getLeagueId('soccer', 'premier league'));
console.log("getLeagueId('basketball', 'ncaa'):", getLeagueId('basketball', 'ncaa')); 