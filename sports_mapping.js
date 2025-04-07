/**
 * Sports and League Mapping for Overtime Markets API
 * 
 * This file contains verified sport and league IDs for use by BetCLI
 * Based on API responses from overtimemarketsv2.xyz
 */

// Use a namespace pattern to avoid global variable conflicts
window.OvertimeSports = {
  VERIFIED_SPORT_IDS: {
    FOOTBALL: 2,
    BASEBALL: 3,
    BASKETBALL: 4,
    HOCKEY: 6,
    FIGHTING: 7,
    TENNIS: 8,
    GOLF: 9,
    SOCCER: 5,
    CRICKET: 10
  },
  
  VERIFIED_LEAGUE_IDS: {
    NFL: 1,
    NCAA_FOOTBALL: 2,
    MLB: 3,
    NBA: 4,
    NCAA_BASKETBALL: 5,
    NHL: 6,
    UFC: 7,
    MLS: 10,
    EPL: 11,
    LIGUE_1: 12,
    BUNDESLIGA: 13,
    LA_LIGA: 14,
    SERIE_A: 15,
    CHAMPIONS_LEAGUE: 16
  },
  
  getSportIdFromTerm: function(term) {
    if (!term) return null;
    
    const normalizedTerm = term.toLowerCase();
    
    // Basketball
    if (normalizedTerm === 'basketball' || normalizedTerm === 'nba' || 
        normalizedTerm === 'ncaa basketball' || normalizedTerm === 'hoops' || 
        normalizedTerm === 'bball') {
      return this.VERIFIED_SPORT_IDS.BASKETBALL;
    }
    // Football
    else if (normalizedTerm === 'football' || normalizedTerm === 'nfl' || 
             normalizedTerm === 'ncaa football') {
      return this.VERIFIED_SPORT_IDS.FOOTBALL;
    }
    // Baseball
    else if (normalizedTerm === 'baseball' || normalizedTerm === 'mlb') {
      return this.VERIFIED_SPORT_IDS.BASEBALL;
    }
    // Hockey
    else if (normalizedTerm === 'hockey' || normalizedTerm === 'nhl') {
      return this.VERIFIED_SPORT_IDS.HOCKEY;
    }
    // Soccer
    else if (normalizedTerm === 'soccer' || normalizedTerm === 'futbol' || 
             normalizedTerm === 'football' || normalizedTerm === 'epl' || 
             normalizedTerm === 'mls' || normalizedTerm === 'premier league') {
      return this.VERIFIED_SPORT_IDS.SOCCER;
    }
    // Fighting
    else if (normalizedTerm === 'ufc' || normalizedTerm === 'mma' || 
             normalizedTerm === 'boxing' || normalizedTerm === 'fighting') {
      return this.VERIFIED_SPORT_IDS.FIGHTING;
    }
    // Tennis
    else if (normalizedTerm === 'tennis' || normalizedTerm === 'atp' || 
             normalizedTerm === 'wta') {
      return this.VERIFIED_SPORT_IDS.TENNIS;
    }
    // Golf
    else if (normalizedTerm === 'golf' || normalizedTerm === 'pga') {
      return this.VERIFIED_SPORT_IDS.GOLF;
    }
    // Cricket
    else if (normalizedTerm === 'cricket' || normalizedTerm === 'ipl') {
      return this.VERIFIED_SPORT_IDS.CRICKET;
    }
    
    return null;
  },
  
  getLeagueIdFromTerm: function(term) {
    if (!term) return null;
    
    const normalizedTerm = term.toLowerCase();
    
    // NBA
    if (normalizedTerm === 'nba' || normalizedTerm === 'national basketball association') {
      return this.VERIFIED_LEAGUE_IDS.NBA;
    }
    // NCAA Basketball
    else if (normalizedTerm === 'ncaa basketball' || normalizedTerm === 'college basketball' || 
             normalizedTerm === 'march madness') {
      return this.VERIFIED_LEAGUE_IDS.NCAA_BASKETBALL;
    }
    // NFL
    else if (normalizedTerm === 'nfl' || normalizedTerm === 'national football league') {
      return this.VERIFIED_LEAGUE_IDS.NFL;
    }
    // NCAA Football
    else if (normalizedTerm === 'ncaa football' || normalizedTerm === 'college football') {
      return this.VERIFIED_LEAGUE_IDS.NCAA_FOOTBALL;
    }
    // MLB
    else if (normalizedTerm === 'mlb' || normalizedTerm === 'major league baseball') {
      return this.VERIFIED_LEAGUE_IDS.MLB;
    }
    // NHL
    else if (normalizedTerm === 'nhl' || normalizedTerm === 'national hockey league') {
      return this.VERIFIED_LEAGUE_IDS.NHL;
    }
    // MLS
    else if (normalizedTerm === 'mls' || normalizedTerm === 'major league soccer') {
      return this.VERIFIED_LEAGUE_IDS.MLS;
    }
    // EPL
    else if (normalizedTerm === 'epl' || normalizedTerm === 'premier league' || 
             normalizedTerm === 'english premier league') {
      return this.VERIFIED_LEAGUE_IDS.EPL;
    }
    // La Liga
    else if (normalizedTerm === 'la liga' || normalizedTerm === 'spanish primera division') {
      return this.VERIFIED_LEAGUE_IDS.LA_LIGA;
    }
    // Serie A
    else if (normalizedTerm === 'serie a' || normalizedTerm === 'italian serie a') {
      return this.VERIFIED_LEAGUE_IDS.SERIE_A;
    }
    // Bundesliga
    else if (normalizedTerm === 'bundesliga' || normalizedTerm === 'german bundesliga') {
      return this.VERIFIED_LEAGUE_IDS.BUNDESLIGA;
    }
    // Ligue 1
    else if (normalizedTerm === 'ligue 1' || normalizedTerm === 'french ligue 1') {
      return this.VERIFIED_LEAGUE_IDS.LIGUE_1;
    }
    // Champions League
    else if (normalizedTerm === 'champions league' || normalizedTerm === 'uefa champions league') {
      return this.VERIFIED_LEAGUE_IDS.CHAMPIONS_LEAGUE;
    }
    // UFC
    else if (normalizedTerm === 'ufc' || normalizedTerm === 'ultimate fighting championship') {
      return this.VERIFIED_LEAGUE_IDS.UFC;
    }
    
    return null;
  }
};

// If we're in a Node.js environment, export the functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VERIFIED_SPORT_IDS: window.OvertimeSports.VERIFIED_SPORT_IDS,
    VERIFIED_LEAGUE_IDS: window.OvertimeSports.VERIFIED_LEAGUE_IDS,
    getSportIdFromTerm: window.OvertimeSports.getSportIdFromTerm.bind(window.OvertimeSports),
    getLeagueIdFromTerm: window.OvertimeSports.getLeagueIdFromTerm.bind(window.OvertimeSports)
  };
} 