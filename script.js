// API Constants - Make these available globally
window.API_BASE_URL = 'https://overtimemarketsv2.xyz'; 
window.DEFAULT_NETWORK_ID = 10; // Optimism
const SCRIPT_VERSION = '1.0.4'; // Updated to use OvertimeSports namespace

// League ID reference data
let LEAGUE_ID_DATA = null;

// Add message to the terminal
function addMessage(text, type) {
    const terminalContent = document.getElementById('terminalContent');
    if (!terminalContent) {
        console.error("Terminal content element not found");
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = text.replace(/\n/g, '<br>');
    terminalContent.appendChild(messageDiv);
    
    // Scroll to bottom
    terminalContent.scrollTop = terminalContent.scrollHeight;
}

// Scroll terminal to bottom
function scrollToBottom() {
    const terminalContent = document.getElementById('terminalContent');
    if (terminalContent) {
        terminalContent.scrollTop = terminalContent.scrollHeight;
    }
}

// Load league ID reference data
async function loadLeagueIDData() {
    try {
        const response = await fetch('leagueID.json');
        if (!response.ok) {
            throw new Error(`Failed to load leagueID.json: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        LEAGUE_ID_DATA = data;
        console.log('Successfully loaded leagueID.json');
        return data;
    } catch (error) {
        console.error('Error loading leagueID.json:', error);
        return null;
    }
}

// Get league information by ID
function getLeagueInfoById(id) {
    if (!LEAGUE_ID_DATA) {
        console.warn('League ID data not loaded yet');
        return null;
    }
    return LEAGUE_ID_DATA[id.toString()] || null;
}

// Get league name by ID
function getLeagueNameById(id) {
    // Get from league ID data
    if (LEAGUE_ID_DATA) {
        const info = getLeagueInfoById(id);
        if (info) {
            // Return the opticOddsName (full name) if available, otherwise the label
            return info.opticOddsName || info.label;
        }
    }
    
    return null;
}

// Get league ID by name
function getLeagueIdByName(name) {
    if (!LEAGUE_ID_DATA || !name) return null;
    
    const normalizedName = name.toLowerCase();
    
    for (const id in LEAGUE_ID_DATA) {
        const entry = LEAGUE_ID_DATA[id];
        
        // Check against label (exact match)
        if (entry.label && entry.label.toLowerCase() === normalizedName) {
            return parseInt(id);
        }
        
        // Check against opticOddsName (contains match)
        if (entry.opticOddsName && entry.opticOddsName.toLowerCase().includes(normalizedName)) {
            return parseInt(id);
        }
        
        // Check for alternative names/abbreviations
        if (normalizedName === 'nba' && entry.label === 'NBA') {
            return parseInt(id);
        } else if (normalizedName === 'nfl' && entry.label === 'NFL') {
            return parseInt(id);
        } else if ((normalizedName === 'epl' || normalizedName === 'premier league') && entry.label === 'EPL') {
            return parseInt(id);
        } else if ((normalizedName === 'mls' || normalizedName === 'major league soccer') && entry.label === 'MLS') {
            return parseInt(id);
        } else if (normalizedName === 'nhl' && entry.label === 'NHL') {
            return parseInt(id);
        } else if (normalizedName === 'mlb' && entry.label === 'MLB') {
            return parseInt(id);
        } else if ((normalizedName === 'ncaa basketball' || normalizedName === 'college basketball') && entry.label === 'NCAA Basketball') {
            return parseInt(id);
        } else if ((normalizedName === 'ucl' || normalizedName === 'champions league') && entry.label === 'UEFA Champions League') {
            return parseInt(id);
        }
    }
    
    return null;
}

// Get league IDs for a specific sport
function getLeagueIdsBySport(sportName) {
    if (!LEAGUE_ID_DATA || !sportName) return [];
    
    const normalizedSportName = sportName.toLowerCase();
    const leagueIds = [];
    
    for (const id in LEAGUE_ID_DATA) {
        const entry = LEAGUE_ID_DATA[id];
        if (entry.sport.toLowerCase() === normalizedSportName) {
            leagueIds.push(parseInt(id));
        }
    }
    
    return leagueIds;
}

// Import the new API handler if we're in a Node.js environment
let apiHandler = null;
try {
  if (typeof require !== 'undefined') {
    apiHandler = require('./api_handler.js');
  }
} catch (err) {
  console.error('Failed to load API handler:', err);
}

// Debug mode
let DEBUG_MODE = true; // Enable debug mode by default to help diagnose API issues

// Use the OvertimeSports namespace from sports_mapping.js
// If not available yet, create empty objects as placeholders
if (typeof window.OvertimeSports === 'undefined') {
  window.OvertimeSports = {
    VERIFIED_LEAGUE_IDS: {},
    getLeagueIdFromTerm: function() { return null; }
  };
}

// Create local references to the namespace objects
const VERIFIED_LEAGUE_IDS = window.OvertimeSports.VERIFIED_LEAGUE_IDS;
const getLeagueIdFromTerm = window.OvertimeSports.getLeagueIdFromTerm.bind(window.OvertimeSports);

// Market Types
const MARKET_TYPES = {
    MONEY_LINE: 0,
    SPREAD: 1,
    TOTAL: 2,
    PLAYER_PROPS: 3,
    FUTURES: 10
};

// Common League IDs - Updated to use only league IDs
const LEAGUE_IDS = {
    NFL: 2, // NFL
    NCAA_FOOTBALL: 1, // NCAA Football
    MLB: 3, // MLB
    NBA: 4, // NBA
    NCAA_BASKETBALL: 5, // NCAA Basketball
    NHL: 6, // NHL
    UFC: 7, // UFC
    MLS: 10, // MLS
    EPL: 11, // EPL
    LIGUE_1: 12, // Ligue 1
    BUNDESLIGA: 13, // Bundesliga
    LA_LIGA: 14, // La Liga
    SERIE_A: 15, // Serie A
    UEFA_CHAMPIONS: 16 // UEFA Champions League
};

// DOM Elements - will initialize these inside DOMContentLoaded
let terminalContent;
let terminalInput;

// Configuration for OpenAI API
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
// FIXED: Initialize API key directly without any process.env reference
let OPENAI_API_KEY = window && window.OPENAI_API_KEY ? window.OPENAI_API_KEY : '';
// Check if we can get the API key from localStorage
if (!OPENAI_API_KEY && window && window.localStorage) {
    OPENAI_API_KEY = window.localStorage.getItem('openai_api_key') || '';
}

// Store conversation history for context
let conversationHistory = [];

// Add custom CSS styles for better formatting
document.head.insertAdjacentHTML('beforeend', `
<style>
.market-results {
  font-family: 'Courier New', monospace;
  border: 1px solid #444;
  border-radius: 8px;
  margin: 10px 0;
  background-color: #1a1a1a;
  max-width: 100%;
  overflow: hidden;
}

.query-results {
  font-family: 'Courier New', monospace;
  border: 1px solid #444;
  border-radius: 8px;
  margin: 10px 0;
  background-color: #1a1a1a;
}

.market-header, .query-header {
  background-color: #2c3e50;
  color: white;
  padding: 10px;
  border-top-left-radius: 7px;
  border-top-right-radius: 7px;
  font-weight: bold;
  text-align: center;
}

.query-footer, .market-footer {
  background-color: #1e2a38;
  color: #aaa;
  padding: 8px;
  border-bottom-left-radius: 7px;
  border-bottom-right-radius: 7px;
  font-size: 0.9em;
  text-align: center;
}

.game-list {
  max-height: 500px;
  overflow-y: auto;
}

.game-item {
  padding: 8px 12px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.game-item:hover {
  background-color: #2c3e50;
}

.game-id {
  color: #3498db;
  cursor: pointer;
  font-family: monospace;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #0d1b2a;
  margin-right: 8px;
}

.game-id:hover {
  background-color: #3498db;
  color: white;
}

.teams {
  flex-grow: 1;
  font-weight: bold;
}

.time {
  color: #7f8c8d;
  font-size: 0.9em;
}

.market-section {
  border-top: 1px solid #333;
  padding: 12px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #3498db;
  text-transform: uppercase;
  font-size: 0.9em;
  letter-spacing: 1px;
}

.market-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dotted #444;
}

.market-name {
  font-weight: bold;
  margin-bottom: 5px;
  color: #ecf0f1;
}

.market-details {
  font-size: 0.9em;
  color: #bdc3c7;
  margin-bottom: 8px;
}

.market-line {
  background-color: #34495e;
  padding: 2px 6px;
  border-radius: 4px;
}

.market-outcomes {
  display: table;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 4px;
}

.outcome {
  display: table-row;
}

.outcome:hover {
  background-color: #2c3e50;
}

.outcome-name, .outcome-odds {
  display: table-cell;
  padding: 6px 8px;
}

.outcome-name {
  width: 70%;
}

.outcome-odds {
  width: 30%;
  text-align: right;
  font-family: monospace;
}

.odds-positive {
  color: #2ecc71;
  font-weight: bold;
}

.odds-negative {
  color: #e74c3c;
  font-weight: bold;
}

.market-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid #333;
}

.market-type-filter {
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #34495e;
  color: #ecf0f1;
  font-size: 0.8em;
  cursor: pointer;
}

.market-type-filter:hover {
  background-color: #3498db;
}

.market-tabs {
  display: flex;
  overflow-x: auto;
  background-color: #2c3e50;
  padding: 0 10px;
}

.market-tab {
  padding: 10px 15px;
  cursor: pointer;
  color: #bdc3c7;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.market-tab.active {
  color: white;
  border-bottom-color: #3498db;
}

.market-tab:hover {
  color: white;
}
</style>
`);

// Initialize the terminal
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DOM elements
    terminalContent = document.getElementById('terminalContent');
    terminalInput = document.getElementById('terminalInput');
    
    // Load reference data
    try {
        // Load league ID reference data
        await loadLeagueIDData();
        console.log('League ID reference data loaded successfully');
    } catch (err) {
        console.error('Failed to load reference data:', err);
    }
    
    // Check if API key is available from window global
    if (typeof window !== 'undefined' && window.OPENAI_API_KEY) {
        OPENAI_API_KEY = window.OPENAI_API_KEY;
    }
    
    // Check if both terminal elements exist
    if (!terminalContent || !terminalInput) {
        console.error("Terminal elements not found! Make sure your HTML includes elements with IDs 'terminalContent' and 'terminalInput'.");
        // Add visible error directly to body if terminal container not found
        if (!terminalContent) {
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.padding = '20px';
            errorDiv.style.margin = '20px';
            errorDiv.style.border = '1px solid red';
            errorDiv.textContent = "Error: Terminal content element not found. Please check your HTML structure.";
            document.body.appendChild(errorDiv);
        }
        return;
    }
    
    // Add event listener for terminal input
    terminalInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
            const query = this.value.trim();
        
        if (query) {
            // Handle command if it starts with /
            if (query.startsWith('/')) {
                handleCommand(query);
            } else {
                // Process regular query
                processQuery(query);
            }
            
            // Clear input after processing
                this.value = '';
            }
            
            // Prevent default behavior of Enter key in text input
            event.preventDefault();
        }
    });
    
    // If we already have an API key, show an informational message
    if (OPENAI_API_KEY) {
        addMessage("API key found! You can start querying Overtime Markets data.", 'system');
    } else {
        addMessage("Welcome to BetCLI! To begin, please enter your OpenAI API Key with: /apikey YOUR_API_KEY", 'system');
    }
    
    addMessage("You can use /help to see available commands and example queries.", 'system');
    
    // Auto-scroll to bottom of terminal on load
    scrollToBottom();
});

// Handle user commands
function handleCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    
    switch (cmd) {
        case '/help':
            showHelp();
            break;
        
        case '/clear':
            clearTerminal();
            break;
        
        case '/debug':
            toggleDebugMode();
            break;
            
        case '/apikey':
            if (!args) {
                addMessage("Please provide your OpenAI API key", 'system');
                return;
            }
            setApiKey(args);
            break;
            
        case '/networkid':
            if (!args) {
                addMessage(`Current network ID: ${window.DEFAULT_NETWORK_ID}`, 'system');
                return;
            }
            setNetworkId(args);
            break;
        
        case '/leagueid':
            showLeagueIds(args);
            break;
            
        case '/query':
            queryLeague(args);
            break;
            
        case '/gameid':
            if (!args) {
                addMessage("Please provide a game ID", 'system');
                return;
            }
            queryGameById(args);
            break;
            
        case '/type':
            if (!args) {
                addMessage("Please provide a market type", 'system');
                return;
            }
            filterMarketsByType(args);
            break;
            
        case '/live':
            fetchLiveMarkets(args);
            break;
            
        default:
            addMessage(`Unknown command: ${cmd}. Type /help to see available commands.`, 'system');
    }
}

// Store current query results for further filtering
let currentQueryResults = null;
let currentGameMarkets = null;

// Query markets for a specific league
async function queryLeague(leagueName) {
    if (!leagueName) {
        addMessage("Please specify a league to query (e.g. /query nba)", 'system');
        return;
    }
    
    // Clean and normalize the league name
    const cleanLeagueName = leagueName.trim().toLowerCase();
    
    // Find league ID based on name
    let leagueId = null;
    
    // Try to get league ID using the helper function
    leagueId = getLeagueIdByName(cleanLeagueName);
    
    // If no league found by name using helper function, try direct search in LEAGUE_ID_DATA
    if (!leagueId && LEAGUE_ID_DATA) {
        // Search through LEAGUE_ID_DATA directly
        for (const id in LEAGUE_ID_DATA) {
            const entry = LEAGUE_ID_DATA[id];
            // Check for partial matches in opticOddsName
            if (entry.opticOddsName && entry.opticOddsName.toLowerCase().includes(cleanLeagueName)) {
                leagueId = parseInt(id);
                break;
            }
        }
    }
    
    // If still no league found by name, try to interpret the input as a direct league ID
    if (!leagueId && !isNaN(parseInt(cleanLeagueName))) {
        leagueId = parseInt(cleanLeagueName);
    }
    
    if (!leagueId) {
        addMessage(`League "${leagueName}" not found. Use /leagueid to see available leagues.`, 'system');
        return;
    }
    
    // Show loading message
    const loadingMessage = addMessage(`Fetching games for league ID ${leagueId}...`, 'system');
    
    try {
        // Fetch markets for the league
        const apiParams = {
            networkId: window.DEFAULT_NETWORK_ID,
            leagueId: leagueId,
            limit: 50  // Increase limit to get more games
        };
        
        const marketData = await fetchMarketData(apiParams);
        
        // Process the response to extract unique games
        const games = extractUniqueGames(marketData);
        currentQueryResults = games;
        
        // Remove loading message
        if (loadingMessage && loadingMessage.parentNode) {
            loadingMessage.parentNode.removeChild(loadingMessage);
        }
        
        if (games.length === 0) {
            addMessage(`No games found for league ID ${leagueId}`, 'system');
            return;
        }
        
        // Get the league name
        const leagueName = getLeagueNameById(leagueId) || `League ID ${leagueId}`;
        
        // Format the output
        let output = `<div class="query-results">
            <div class="query-header">📊 ${games.length} Games for ${leagueName}</div>
            <div class="game-list">`;
        
        games.forEach(game => {
            // Format the date in a more readable way
            const gameDate = new Date(game.maturityDate);
            const formattedDate = gameDate.toLocaleDateString(undefined, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            const formattedTime = gameDate.toLocaleTimeString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            output += `<div class="game-item">
                <span class="game-id" onclick="document.getElementById('terminalInput').value = '/gameid ${game.gameId}'; document.getElementById('terminalInput').focus();">
                    [${shortenGameId(game.gameId)}]
                </span>
                <span class="teams">${game.awayTeam} @ ${game.homeTeam}</span>
                <span class="time">${formattedDate} ${formattedTime}</span>
            </div>`;
        });
        
        output += `</div>
            <div class="query-footer">Click on a game ID to view markets or type /gameid [ID]</div>
        </div>`;
        
        addMessage(output, 'system');
        
    } catch (error) {
        // Remove loading message
        if (loadingMessage && loadingMessage.parentNode) {
            loadingMessage.parentNode.removeChild(loadingMessage);
        }
        
        console.error('Error fetching league data:', error);
        addMessage(`Error: ${error.message}`, 'system');
    }
}

// Shorten game ID for display
function shortenGameId(gameId) {
    if (gameId && gameId.length > 16) {
        return gameId.substring(0, 8) + '...';
    }
    return gameId;
}

// Extract unique games from market data
function extractUniqueGames(marketData) {
    const games = new Map();
    
    // Handle different possible response structures
    let markets = [];
    
    if (marketData && typeof marketData === 'object') {
        // Handle nested structure by sport > leagueId > [markets]
        for (const sportKey in marketData) {
            const sportData = marketData[sportKey];
            for (const leagueKey in sportData) {
                const leagueMarkets = sportData[leagueKey];
                if (Array.isArray(leagueMarkets)) {
                    for (const market of leagueMarkets) {
                        if (market && market.gameId && !games.has(market.gameId)) {
                            // Add only unique games (parent markets)
                            if (market.homeTeam && market.awayTeam) {
                                games.set(market.gameId, {
                                    gameId: market.gameId,
                                    homeTeam: market.homeTeam,
                                    awayTeam: market.awayTeam,
                                    sport: market.sport,
                                    leagueId: market.leagueId,
                                    leagueName: market.leagueName,
                                    maturityDate: market.maturityDate || market.maturity
                                });
                            }
                        }
                    }
                }
            }
        }
    } else if (marketData && marketData.markets && Array.isArray(marketData.markets)) {
        for (const market of marketData.markets) {
            if (market && market.gameId && !games.has(market.gameId)) {
                if (market.homeTeam && market.awayTeam) {
                    games.set(market.gameId, {
                        gameId: market.gameId,
                        homeTeam: market.homeTeam,
                        awayTeam: market.awayTeam,
                        sport: market.sport,
                        leagueId: market.leagueId,
                        leagueName: market.leagueName,
                        maturityDate: market.maturityDate || market.maturity
                    });
                }
            }
        }
    }
    
    return Array.from(games.values());
}

// Query markets for a specific game ID
async function queryGameById(gameId) {
    if (!gameId) {
        addMessage("Please provide a game ID", 'system');
        return;
    }
    
    // Clean gameId
    const cleanGameId = gameId.trim();
    
    // Check if we have the game in current results
    let targetGame = null;
    
    if (currentQueryResults) {
        // Look for games that start with the provided ID (allow shortened IDs)
        targetGame = currentQueryResults.find(game => 
            game.gameId.toLowerCase().startsWith(cleanGameId.toLowerCase()));
    }
    
    if (!targetGame) {
        // Show loading message
        const loadingMessage = addMessage(`Fetching markets for game ID ${cleanGameId}...`, 'system');
        
        try {
            // Use the direct game ID path in the URL structure
            const gameIdForUrl = cleanGameId;
            const networkId = window.DEFAULT_NETWORK_ID;
            const url = `${window.API_BASE_URL}/overtime-v2/networks/${networkId}/markets/${gameIdForUrl}`;
            
            if (DEBUG_MODE) {
                console.log('Fetching game data from:', url);
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const marketData = await response.json();
            
            // Remove loading message
            if (loadingMessage && loadingMessage.parentNode) {
                loadingMessage.parentNode.removeChild(loadingMessage);
            }
            
            // Process the markets
            displayGameMarkets(marketData, cleanGameId);
            
        } catch (error) {
            // Remove loading message
            if (loadingMessage && loadingMessage.parentNode) {
                loadingMessage.parentNode.removeChild(loadingMessage);
            }
            
            console.error('Error fetching game markets:', error);
            addMessage(`Error: ${error.message}`, 'system');
        }
    } else {
        // We have the game info, now fetch its markets
        const loadingMessage = addMessage(`Fetching markets for ${targetGame.awayTeam} @ ${targetGame.homeTeam}...`, 'system');
        
        try {
            // Use the direct game ID path in the URL structure
            const gameIdForUrl = targetGame.gameId;
            const networkId = window.DEFAULT_NETWORK_ID;
            const url = `${window.API_BASE_URL}/overtime-v2/networks/${networkId}/markets/${gameIdForUrl}`;
            
            if (DEBUG_MODE) {
                console.log('Fetching game data from:', url);
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const marketData = await response.json();
            
            // Remove loading message
            if (loadingMessage && loadingMessage.parentNode) {
                loadingMessage.parentNode.removeChild(loadingMessage);
            }
            
            // Process the markets
            displayGameMarkets(marketData, targetGame);
            
        } catch (error) {
            // Remove loading message
            if (loadingMessage && loadingMessage.parentNode) {
                loadingMessage.parentNode.removeChild(loadingMessage);
            }
            
            console.error('Error fetching game markets:', error);
            addMessage(`Error: ${error.message}`, 'system');
        }
    }
}

// Display markets for a game
function displayGameMarkets(marketData, gameInfo) {
    // Extract and organize markets
    const allMarkets = extractMarketsFromResponse(marketData);
    currentGameMarkets = allMarkets;
    
    if (allMarkets.length === 0) {
        addMessage("No markets found for this game.", 'system');
        return;
    }
    
    // Get game details
    let gameTitle = '';
    let gameTime = '';
    let leagueName = '';
    let homeTeam = '';
    let awayTeam = '';
    
    // Try to get team and game info
    if (typeof gameInfo === 'object') {
        homeTeam = gameInfo.homeTeam || '';
        awayTeam = gameInfo.awayTeam || '';
        gameTitle = `${awayTeam} @ ${homeTeam}`;
        if (gameInfo.maturityDate) {
            const gameDate = new Date(gameInfo.maturityDate);
            gameTime = gameDate.toLocaleDateString(undefined, { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric'
            }) + ' • ' + gameDate.toLocaleTimeString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        if (gameInfo.leagueId) {
            leagueName = getLeagueNameById(gameInfo.leagueId) || '';
        }
    } else if (allMarkets.length > 0) {
        // Try to extract game info from first market
        homeTeam = allMarkets[0].homeTeam || '';
        awayTeam = allMarkets[0].awayTeam || '';
        gameTitle = `${awayTeam} @ ${homeTeam}`;
        if (allMarkets[0].maturityDate) {
            const gameDate = new Date(allMarkets[0].maturityDate);
            gameTime = gameDate.toLocaleDateString(undefined, { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric'
            }) + ' • ' + gameDate.toLocaleTimeString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        if (allMarkets[0].leagueId) {
            leagueName = getLeagueNameById(allMarkets[0].leagueId) || '';
            if (allMarkets[0].leagueName && !leagueName) {
                leagueName = allMarkets[0].leagueName;
            }
        }
    } else {
        gameTitle = `Game ID: ${gameInfo}`;
    }
    
    // Organize markets by type
    const moneylineMarkets = allMarkets.filter(m => m.type === 'winner' || m.originalMarketName === 'Moneyline');
    const spreadMarkets = allMarkets.filter(m => m.type === 'spread' || m.originalMarketName === 'Point Spread');
    const totalMarkets = allMarkets.filter(m => m.type === 'total' || m.originalMarketName === 'Total');
    
    // Create output HTML for modern betting interface
    let output = `
    <div class="market-results" style="max-width:600px; margin:0 auto; border-radius:8px; overflow:hidden; background-color:#1a1e2c;">
        <!-- Game Header -->
        <div style="background-color:#1a1e2c; padding:15px; display:flex; align-items:center; justify-content:center; position:relative;">
            ${leagueName ? `<div style="position:absolute; top:5px; left:5px; font-size:12px; color:#9aa0a6;">${leagueName}</div>` : ''}
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="text-align:center;">
                    <div style="font-weight:bold; color:white;">${homeTeam}</div>
                </div>
                <div style="color:#9aa0a6; font-weight:bold;">-</div>
                <div style="text-align:center;">
                    <div style="font-weight:bold; color:white;">${awayTeam}</div>
                </div>
            </div>
            <div style="position:absolute; top:5px; right:5px; cursor:pointer; color:#9aa0a6;" 
                 onclick="document.getElementById('terminalInput').value = '/help'; document.getElementById('terminalInput').focus();">✕</div>
        </div>`;
        
    if (gameTime) {
        output += `<div style="text-align:center; padding:5px; color:#9aa0a6; background-color:#272b38; font-size:12px;">
            ${gameTime}
        </div>`;
    }
    
    // WINNER/MONEYLINE SECTION
    if (moneylineMarkets.length > 0) {
        const moneyline = moneylineMarkets[0]; // Use the first moneyline market
        output += `
        <div style="margin-top:10px;">
            <!-- Moneyline Header -->
            <div style="background-color:#272b38; color:white; padding:10px 15px; display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:bold;">WINNER</div>
                <div style="cursor:pointer;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 15l-6-6-6 6"/>
                    </svg>
                </div>
            </div>
            
            <!-- Moneyline Odds -->
            <div style="display:flex; padding:10px; gap:10px;">`;
        
        if (moneyline.odds && moneyline.odds.length > 0) {
            // Home team odds
            const homeOdds = moneyline.odds[0]?.american;
            const formattedHomeOdds = homeOdds > 0 ? `+${Math.round(homeOdds)}` : Math.round(homeOdds);
            const homeOddsColor = homeOdds > 0 ? "#4caf50" : "#f44336";
            
            output += `
                <div style="flex:1; padding:10px; background-color:#1f232d; border-radius:6px; text-align:center;">
                    <div style="font-weight:bold; color:white;">${homeTeam}</div>
                    <div style="font-weight:bold; color:${homeOddsColor}; margin-top:5px;">${formattedHomeOdds}</div>
                </div>`;
            
            // Away team odds
            if (moneyline.odds.length > 1) {
                const awayOddsIndex = moneyline.odds.length === 3 ? 2 : 1; // Account for potential draw in soccer
                const awayOdds = moneyline.odds[awayOddsIndex]?.american;
                const formattedAwayOdds = awayOdds > 0 ? `+${Math.round(awayOdds)}` : Math.round(awayOdds);
                const awayOddsColor = awayOdds > 0 ? "#4caf50" : "#f44336";
                
                output += `
                <div style="flex:1; padding:10px; background-color:#1f232d; border-radius:6px; text-align:center;">
                    <div style="font-weight:bold; color:white;">${awayTeam}</div>
                    <div style="font-weight:bold; color:${awayOddsColor}; margin-top:5px;">${formattedAwayOdds}</div>
                </div>`;
            }
            
            // Show draw if available (3rd option in soccer)
            if (moneyline.odds.length > 2) {
                const drawOdds = moneyline.odds[1]?.american;
                const formattedDrawOdds = drawOdds > 0 ? `+${Math.round(drawOdds)}` : Math.round(drawOdds);
                const drawOddsColor = drawOdds > 0 ? "#4caf50" : "#f44336";
                
                output += `
                <div style="flex:1; padding:10px; background-color:#1f232d; border-radius:6px; text-align:center;">
                    <div style="font-weight:bold; color:white;">Draw</div>
                    <div style="font-weight:bold; color:${drawOddsColor}; margin-top:5px;">${formattedDrawOdds}</div>
                </div>`;
            }
        }
        
        output += `
            </div>
        </div>`;
    }
    
    // HANDICAP/SPREAD SECTION
    if (spreadMarkets.length > 0) {
        // Sort spreads by line
        const sortedSpreads = [...spreadMarkets].sort((a, b) => {
            // Ensure we have valid lines
            const lineA = a.line !== undefined ? a.line : 0;
            const lineB = b.line !== undefined ? b.line : 0;
            return lineA - lineB;
        });
        
        output += `
        <div style="margin-top:10px;">
            <!-- Spread Header -->
            <div style="background-color:#272b38; color:white; padding:10px 15px; display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:bold;">HANDICAP</div>
                <div style="cursor:pointer;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 15l-6-6-6 6"/>
                    </svg>
                </div>
            </div>
            
            <!-- Spread Lines Grid -->
            <div style="padding:10px 15px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="width:48%; text-align:center; color:#9aa0a6;">${homeTeam}</div>
                    <div style="width:48%; text-align:center; color:#9aa0a6;">${awayTeam}</div>
                </div>`;
                
        // Create spread rows
        const spreadLines = new Set();
        sortedSpreads.forEach(market => {
            if (market.line !== undefined) {
                spreadLines.add(market.line);
            }
        });
        
        // Convert to array and sort
        const uniqueLines = Array.from(spreadLines).sort((a, b) => a - b);
        
        uniqueLines.forEach(line => {
            const homeSpread = sortedSpreads.find(m => m.line === line);
            const awaySpread = sortedSpreads.find(m => m.line === -line);
            
            if (homeSpread || awaySpread) {
                output += `<div style="display:flex; justify-content:space-between; margin-bottom:10px;">`;
                
                // Home team spread
                if (homeSpread && homeSpread.odds && homeSpread.odds.length > 0) {
                    const homeOdds = homeSpread.odds[0]?.american;
                    const formattedHomeOdds = homeOdds > 0 ? `+${Math.round(homeOdds)}` : Math.round(homeOdds);
                    const homeOddsColor = homeOdds > 0 ? "#4caf50" : "#f44336";
                    
                    output += `
                    <div style="width:48%; display:flex; justify-content:space-between; padding:8px 15px; background-color:#1f232d; border-radius:6px;">
                        <div style="color:white; font-weight:bold;">${line}</div>
                        <div style="color:${homeOddsColor}; font-weight:bold;">${formattedHomeOdds}</div>
                    </div>`;
                } else {
                    output += `<div style="width:48%;"></div>`;
                }
                
                // Away team spread
                if (awaySpread && awaySpread.odds && awaySpread.odds.length > 0) {
                    const awayOdds = awaySpread.odds[1]?.american;
                    const formattedAwayOdds = awayOdds > 0 ? `+${Math.round(awayOdds)}` : Math.round(awayOdds);
                    const awayOddsColor = awayOdds > 0 ? "#4caf50" : "#f44336";
                    
                    output += `
                    <div style="width:48%; display:flex; justify-content:space-between; padding:8px 15px; background-color:#1f232d; border-radius:6px;">
                        <div style="color:white; font-weight:bold;">${-line}</div>
                        <div style="color:${awayOddsColor}; font-weight:bold;">${formattedAwayOdds}</div>
                    </div>`;
                } else {
                    output += `<div style="width:48%;"></div>`;
                }
                
                output += `</div>`;
            }
        });
                
        output += `
            </div>
        </div>`;
    }
    
    // TOTALS/OVER-UNDER SECTION
    if (totalMarkets.length > 0) {
        // Sort totals by line
        const sortedTotals = [...totalMarkets].sort((a, b) => {
            // Ensure we have valid lines
            const lineA = a.line !== undefined ? a.line : 0;
            const lineB = b.line !== undefined ? b.line : 0;
            return lineA - lineB;
        });
        
        output += `
        <div style="margin-top:10px;">
            <!-- Totals Header -->
            <div style="background-color:#272b38; color:white; padding:10px 15px; display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:bold;">TOTAL</div>
                <div style="cursor:pointer;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 15l-6-6-6 6"/>
                    </svg>
                </div>
            </div>
            
            <!-- Totals Grid -->
            <div style="padding:10px 15px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="width:48%; text-align:center; color:#9aa0a6;">Over</div>
                    <div style="width:48%; text-align:center; color:#9aa0a6;">Under</div>
                </div>`;
        
        // Group by unique lines
        const totalLines = new Map();
        sortedTotals.forEach(market => {
            if (market.line !== undefined) {
                totalLines.set(market.line, market);
            }
        });
        
        // Create total rows
        Array.from(totalLines.keys()).sort((a, b) => a - b).forEach(line => {
            const market = totalLines.get(line);
            
            if (market && market.odds && market.odds.length >= 2) {
                const overOdds = market.odds[0]?.american;
                const underOdds = market.odds[1]?.american;
                
                const formattedOverOdds = overOdds > 0 ? `+${Math.round(overOdds)}` : Math.round(overOdds);
                const formattedUnderOdds = underOdds > 0 ? `+${Math.round(underOdds)}` : Math.round(underOdds);
                
                const overOddsColor = overOdds > 0 ? "#4caf50" : "#f44336";
                const underOddsColor = underOdds > 0 ? "#4caf50" : "#f44336";
                
                output += `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <div style="width:48%; display:flex; justify-content:space-between; padding:8px 15px; background-color:#1f232d; border-radius:6px;">
                        <div style="color:white; font-weight:bold;">${line}</div>
                        <div style="color:${overOddsColor}; font-weight:bold;">${formattedOverOdds}</div>
                    </div>
                    <div style="width:48%; display:flex; justify-content:space-between; padding:8px 15px; background-color:#1f232d; border-radius:6px;">
                        <div style="color:white; font-weight:bold;">${line}</div>
                        <div style="color:${underOddsColor}; font-weight:bold;">${formattedUnderOdds}</div>
                    </div>
                </div>`;
            }
        });
                
        output += `
            </div>
        </div>`;
    }
    
    // Footer
    output += `
        <div style="padding:8px 15px; background-color:#272b38; color:#9aa0a6; text-align:center; font-size:12px;">
            ${allMarkets.length} markets available • ${new Date().toLocaleString()}
        </div>
    </div>`;
    
    addMessage(output, 'system');
}

// Extract all markets from response
function extractMarketsFromResponse(marketData) {
    const markets = [];
    
    // Handle different possible response structures
    if (marketData && typeof marketData === 'object') {
        // Check if the response is a single market object (direct game ID query)
        if (marketData.gameId && marketData.odds) {
            // This is a single market object response
            marketData.isChildMarket = false;
            markets.push(marketData);
            
            // Add child markets if available
            if (marketData.childMarkets && Array.isArray(marketData.childMarkets)) {
                marketData.childMarkets.forEach(childMarket => {
                    childMarket.isChildMarket = true;
                    markets.push(childMarket);
                });
            }
        }
        else {
            // Handle nested structure by sport > leagueId > [markets]
            for (const sportKey in marketData) {
                const sportData = marketData[sportKey];
                for (const leagueKey in sportData) {
                    const leagueMarkets = sportData[leagueKey];
                    if (Array.isArray(leagueMarkets)) {
                        leagueMarkets.forEach(market => {
                            // Mark parent vs child markets
                            market.isChildMarket = false;
                            markets.push(market);
                            
                            // Add child markets if available
                            if (market.childMarkets && Array.isArray(market.childMarkets)) {
                                market.childMarkets.forEach(childMarket => {
                                    childMarket.isChildMarket = true;
                                    markets.push(childMarket);
                                });
                            }
                        });
                    }
                }
            }
        }
    } else if (marketData && marketData.markets && Array.isArray(marketData.markets)) {
        marketData.markets.forEach(market => {
            market.isChildMarket = false;
            markets.push(market);
            
            if (market.childMarkets && Array.isArray(market.childMarkets)) {
                market.childMarkets.forEach(childMarket => {
                    childMarket.isChildMarket = true;
                    markets.push(childMarket);
                });
            }
        });
    } else if (Array.isArray(marketData)) {
        marketData.forEach(market => {
            market.isChildMarket = false;
            markets.push(market);
            
            if (market.childMarkets && Array.isArray(market.childMarkets)) {
                market.childMarkets.forEach(childMarket => {
                    childMarket.isChildMarket = true;
                    markets.push(childMarket);
                });
            }
        });
    }
    
    if (DEBUG_MODE && markets.length > 0) {
        console.log(`Extracted ${markets.length} markets from response`);
    }
    
    return markets;
}

// Filter markets by type
function filterMarketsByType(type) {
    if (!currentGameMarkets) {
        addMessage("No game markets loaded. First query a game with /gameid.", 'system');
        return;
    }
    
    const cleanType = type.trim();
    
    // Find markets matching the type
    const filteredMarkets = currentGameMarkets.filter(market => {
        const marketType = market.type || '';
        const marketName = market.originalMarketName || '';
        
        return marketType.toLowerCase().includes(cleanType.toLowerCase()) || 
               marketName.toLowerCase().includes(cleanType.toLowerCase());
    });
    
    if (filteredMarkets.length === 0) {
        addMessage(`No markets found with type "${cleanType}"`, 'system');
        return;
    }
    
    // Get game info from first market
    let gameTitle = '';
    let gameTime = '';
    if (filteredMarkets.length > 0 && filteredMarkets[0].homeTeam && filteredMarkets[0].awayTeam) {
        gameTitle = `${filteredMarkets[0].awayTeam} @ ${filteredMarkets[0].homeTeam}`;
        if (filteredMarkets[0].maturityDate) {
            const gameDate = new Date(filteredMarkets[0].maturityDate);
            gameTime = gameDate.toLocaleDateString(undefined, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric'
            }) + ' ' + gameDate.toLocaleTimeString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    } else {
        gameTitle = "Filtered Markets";
    }
    
    // Get the league name if available
    if (filteredMarkets.length > 0 && filteredMarkets[0].leagueId) {
        const leagueName = getLeagueNameById(filteredMarkets[0].leagueId);
        if (leagueName) {
            gameTitle = `${leagueName}: ${gameTitle}`;
        }
    }
    
    // User-friendly type name
    let typeName = cleanType;
    if (cleanType === 'winner') typeName = 'Moneyline';
    else if (cleanType === 'spread') typeName = 'Point Spread';
    else if (cleanType === 'total') typeName = 'Over/Under';
    else if (cleanType === 'firstPeriod') typeName = 'First Half';
    
    // Format the output
    let output = `<div class="market-results">
        <div class="market-header">${gameTitle}</div>`;
        
    if (gameTime) {
        output += `<div style="text-align:center; padding:5px; color:#bdc3c7; background-color:#34495e;">
            📅 ${gameTime}
        </div>`;
    }
    
    output += `<div style="text-align:center; padding:10px; background-color:#2c3e50; color:white; border-bottom:2px solid #3498db;">
        Showing ${typeName} Markets
    </div>
    <div class="market-types">`;
    
    output += formatMarketSection(typeName, filteredMarkets);
    
    output += `</div>
        <div class="market-footer">${filteredMarkets.length} markets found</div>
    </div>`;
    
    addMessage(output, 'system');
}

// Show league IDs from the leagueID.json file
function showLeagueIds(filter) {
    if (!LEAGUE_ID_DATA) {
        addMessage("League ID data not loaded. Try again in a moment.", 'system');
        // Try to load the data
        loadLeagueIDData().then(() => {
            if (LEAGUE_ID_DATA) {
                addMessage("League ID data loaded. Try the command again.", 'system');
            }
        });
        return;
    }
    
    // Group by sport
    const sportGroups = {};
    
    // Process each entry
    for (const id in LEAGUE_ID_DATA) {
        const entry = LEAGUE_ID_DATA[id];
        if (!sportGroups[entry.sport]) {
            sportGroups[entry.sport] = [];
        }
        sportGroups[entry.sport].push({
            id: entry.id,
            label: entry.label
        });
    }
    
    let output = "League ID Reference:\n\n";
    
    // If a specific filter is provided, show only that sport or ID
    if (filter) {
        const filterLower = filter.toLowerCase();
        
        // Check if filter is a sport name
        if (sportGroups[filter]) {
            output += `${filter} leagues:\n`;
            sportGroups[filter].forEach(entry => {
                output += `  ${entry.id}: ${entry.label}\n`;
            });
        } 
        // Check if filter matches a sport name partially
        else {
            let found = false;
            
            // Check if filter is a sport name
            for (const sport in sportGroups) {
                if (sport.toLowerCase().includes(filterLower)) {
                    output += `${sport} leagues:\n`;
                    sportGroups[sport].forEach(entry => {
                        output += `  ${entry.id}: ${entry.label}\n`;
                    });
                    found = true;
                }
            }
            
            // Check if filter matches a league name
            if (!found) {
                for (const sport in sportGroups) {
                    const matchingLeagues = sportGroups[sport].filter(
                        league => league.label.toLowerCase().includes(filterLower)
                    );
                    
                    if (matchingLeagues.length > 0) {
                        output += `${sport} - matching leagues:\n`;
                        matchingLeagues.forEach(entry => {
                            output += `  ${entry.id}: ${entry.label}\n`;
                        });
                        found = true;
                    }
                }
            }
            
            // Check if filter is an ID
            if (!found && !isNaN(filter)) {
                const id = filter.toString();
                if (LEAGUE_ID_DATA[id]) {
                    const entry = LEAGUE_ID_DATA[id];
                    output += `League ID ${id}:\n`;
                    output += `  Sport: ${entry.sport}\n`;
                    output += `  Label: ${entry.label}\n`;
                    if (entry.opticOddsName) output += `  Full Name: ${entry.opticOddsName}\n`;
                    if (entry.priority) output += `  Priority: ${entry.priority}\n`;
                    if (entry.isDrawAvailable !== undefined) output += `  Draw Available: ${entry.isDrawAvailable}\n`;
                } else {
                    output += `No league found for ID ${filter}.`;
                }
            }
            
            // If nothing matched, show a message
            if (!found && isNaN(filter)) {
                output += `No matches found for "${filter}". Try a different filter or check /help.`;
            }
        }
        } else {
        // Show a summary of leagues by sport
        for (const sport in sportGroups) {
            const leagues = sportGroups[sport];
            output += `${sport} Leagues:\n`;
            
            // Only show up to 5 leagues per sport
            const displayLeagues = leagues.slice(0, 5);
            displayLeagues.forEach(league => {
                output += `  ${league.id}: ${league.label}\n`;
            });
            
            if (leagues.length > 5) {
                output += `  ...and ${leagues.length - 5} more ${sport} leagues\n`;
            }
            
            output += '\n';
        }
        
        output += "Use /leagueid [sport|league|id] to see more details. For example: /leagueid Soccer or /leagueid EPL or /leagueid 11";
    }
    
    addMessage(output, 'system');
}

// Show help
function showHelp() {
    const helpText = `
Available commands:
/apikey YOUR_API_KEY - Set your OpenAI API key
/clear - Clear the terminal
/help - Show this help message
/networkid NUMBER - Set the network ID (default: 10 for Optimism)
/debug - Toggle debug mode to see raw API responses
/leagueid [sport|league|id] - Show league IDs and details
/query LEAGUE - Query games for a specific league (e.g., /query nba)
/gameid ID - View markets for a specific game
/type TYPE - Filter markets by type
/live [league] - Show currently live games (optional league filter)

Reference Data:
We use the leagueID.json file to map leagues to their numeric IDs for API queries
All lookups use league IDs directly with the leagueId parameter

Key league IDs:
- NBA: 4
- NFL: 2
- MLB: 3
- NHL: 6
- EPL: 11
- MLS: 10
- NCAA Basketball: 5
- NCAA Football: 1
- UEFA Champions League: 16
- La Liga: 14
- Serie A: 15
- Bundesliga: 13
- Ligue 1: 12

Examples:
"/query nba" - Show all NBA games
"/live" - Show all live games across all leagues
"/live nba" - Show only live NBA games
"/gameid 0x123..." - Show markets for a specific game
"/type moneyline" - Filter markets by type
    `;
    
    addMessage(helpText, 'system');
}

// Process natural language queries
async function processQuery(query) {
    // Add the user message to the terminal
    addMessage(query, 'user');
    
    // Check if API key is set
    if (!OPENAI_API_KEY) {
        addMessage("Please set your OpenAI API key first using: /apikey YOUR_API_KEY", 'system');
        return;
    }
    
    // Extract key terms from the query
    const terms = extractKeyTerms(query);
    
    if (DEBUG_MODE) {
        addMessage(`Debug - Extracted terms: ${JSON.stringify(terms)}`, 'system');
    }
    
    try {
        // Prepare the API parameters
        const apiParams = {
            networkId: window.DEFAULT_NETWORK_ID
        };
        
        // Add league ID if available
        if (terms.leagueId) {
            apiParams.leagueId = terms.leagueId;
        }
        
        // Add market type if available
        if (terms.marketType !== undefined) {
            apiParams.marketType = terms.marketType;
        }
        
        // Show loading message
        const loadingMessage = addMessage("Processing your query...", 'system');
        
        // Handle the request using the appropriate API handler
        let responseText;
        
        // Use standalone API handler if available (Node.js), otherwise use browser method
        if (apiHandler && typeof apiHandler.processMarketRequest === 'function') {
            responseText = await apiHandler.processMarketRequest(query, apiParams, OPENAI_API_KEY);
        } else {
            // Call the browser-based API handler
            responseText = await processBrowserRequest(query, apiParams);
        }
        
        // Remove loading message
        if (loadingMessage && loadingMessage.parentNode) {
            loadingMessage.parentNode.removeChild(loadingMessage);
        }
        
        // Display the response
        addMessage(responseText, 'response');
        
    } catch (error) {
        console.error('Error processing query:', error);
        addMessage(`Error: ${error.message}`, 'system');
    }
}

// Process request in browser environment
async function processBrowserRequest(query, apiParams) {
    try {
        // First, get market data from Overtime API
        const marketData = await fetchMarketData(apiParams);
        
        if (DEBUG_MODE) {
            addMessage(`Debug - API Response: ${JSON.stringify(marketData)}`, 'system');
        }
        
        // Format the market data for OpenAI prompt
        let marketContext = '';
        
        // Check different possible response structures
        let markets = [];
        if (marketData && marketData.data && marketData.data.length > 0) {
            // Original expected format
            markets = marketData.data;
        } else if (marketData && marketData.markets && marketData.markets.length > 0) {
            // Format from README example
            markets = marketData.markets;
        } else if (Array.isArray(marketData)) {
            // Direct array response
            markets = marketData;
        } else if (marketData && typeof marketData === 'object') {
            // Try to extract markets from the response if it's an object
            // This is a fallback for unexpected formats
            for (const key in marketData) {
                if (Array.isArray(marketData[key]) && marketData[key].length > 0) {
                    markets = marketData[key];
                    break;
                }
            }
        }
        
        if (markets.length > 0) {
            // Format the market data into a readable text
            marketContext = formatMarketData(markets);
        } else {
            return `No markets found for your query. Try a different sport, league, or market type.`;
        }
        
        // Now use OpenAI to process the query with the market context
        const openaiResponse = await callOpenAI(query, marketContext);
        return openaiResponse || 'No response from AI. Please try again.';
        
    } catch (error) {
        console.error('Error in browser request processing:', error);
        throw error;
    }
}

// Extract key terms from the query
function extractKeyTerms(query) {
    const terms = {
        leagueId: null,
        marketType: null, 
        timeframe: null
    };
    
    // Normalize query
    const normalizedQuery = query.toLowerCase();
    
    // Extract sport and map to default league
    const sports = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'fighting'];
    for (const sport of sports) {
        if (normalizedQuery.includes(sport)) {
            // Map sport to league IDs
            if (sport === 'basketball') {
                // Check for college basketball first
                if (normalizedQuery.includes('college') || normalizedQuery.includes('ncaa')) {
                    terms.leagueId = LEAGUE_IDS.NCAA_BASKETBALL;
                } else {
                    // Default to NBA
                    terms.leagueId = LEAGUE_IDS.NBA;
                }
            } else if (sport === 'football') {
                // Check for college football first
                if (normalizedQuery.includes('college') || normalizedQuery.includes('ncaa')) {
                    terms.leagueId = LEAGUE_IDS.NCAA_FOOTBALL;
                } else {
                    // Default to NFL
                    terms.leagueId = LEAGUE_IDS.NFL;
                }
            } else if (sport === 'baseball') {
                terms.leagueId = LEAGUE_IDS.MLB;
            } else if (sport === 'hockey') {
                terms.leagueId = LEAGUE_IDS.NHL;
            } else if (sport === 'soccer') {
                // Default to EPL, but can be overridden by league check below
                terms.leagueId = LEAGUE_IDS.EPL;
            } else if (sport === 'fighting' || sport === 'ufc') {
                terms.leagueId = LEAGUE_IDS.UFC;
            }
            break;
        }
    }
    
    // Extract league
    const leagues = ['nba', 'nfl', 'mlb', 'nhl', 'epl', 'premier league', 'la liga', 
                    'serie a', 'bundesliga', 'ligue 1', 'mls', 'champions league', 
                    'ncaa basketball', 'ncaa football', 'ufc'];
    
    for (const league of leagues) {
        if (normalizedQuery.includes(league)) {
            // Look up league ID
            const leagueId = getLeagueIdByName(league);
            if (leagueId) {
                terms.leagueId = leagueId;
                break;
            }
        }
    }
    
    // Check for direct league ID reference
    const leagueIdMatch = normalizedQuery.match(/\bleague\s*(?:id)?\s*[=:]?\s*(\d+)/i);
    if (leagueIdMatch && leagueIdMatch[1]) {
        terms.leagueId = parseInt(leagueIdMatch[1]);
    }
    
    // Extract market type
    if (normalizedQuery.includes('money line') || normalizedQuery.includes('moneyline')) {
        terms.marketType = MARKET_TYPES.MONEY_LINE;
    } else if (normalizedQuery.includes('spread') || normalizedQuery.includes('handicap') || normalizedQuery.includes('point spread')) {
        terms.marketType = MARKET_TYPES.SPREAD;
    } else if (normalizedQuery.includes('total') || normalizedQuery.includes('over under') || normalizedQuery.includes('over/under')) {
        terms.marketType = MARKET_TYPES.TOTAL;
    } else if (normalizedQuery.includes('player prop') || normalizedQuery.includes('player props')) {
        terms.marketType = MARKET_TYPES.PLAYER_PROPS;
    } else if (normalizedQuery.includes('future') || normalizedQuery.includes('futures')) {
        terms.marketType = MARKET_TYPES.FUTURES;
    }
    
    // Extract timeframe
    if (normalizedQuery.includes('today') || normalizedQuery.includes('tonight')) {
        terms.timeframe = 'today';
    } else if (normalizedQuery.includes('tomorrow')) {
        terms.timeframe = 'tomorrow';
    } else if (normalizedQuery.includes('this week') || normalizedQuery.includes('upcoming')) {
        terms.timeframe = 'this week';
    } else if (normalizedQuery.includes('live') || normalizedQuery.includes('in-play')) {
        terms.timeframe = 'live';
    }
    
    if (DEBUG_MODE) {
        console.log('Extracted terms:', terms);
        if (terms.leagueId) {
            console.log('League info:', getLeagueInfoById(terms.leagueId));
        }
    }
    
    return terms;
}

// Fetch market data from Overtime Markets API
async function fetchMarketData(params) {
    // Use the correct API endpoint format from README
    const url = new URL(`${window.API_BASE_URL}/overtime-v2/networks/${params.networkId}/markets`);
    
    // Remove networkId from params since it's in the URL path
    const { networkId, ...restParams } = params;
    
    // Add default limit of 20 markets
    const queryParams = {
        limit: 20,
        ...restParams
    };
    
    // Add parameters to URL
    for (const [key, value] of Object.entries(queryParams)) {
        if (value !== null && value !== undefined) {
            url.searchParams.append(key, value);
        }
    }
    
    if (DEBUG_MODE) {
        console.log('Fetching market data from:', url.toString());
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

// Format market data into readable text for OpenAI
function formatMarketData(markets) {
    // First, filter and truncate markets to reduce size
    const truncatedMarkets = truncateMarketsForOpenAI(markets);
    
    let result = 'Available Markets:\n\n';
    
    // Check if we have any markets
    if (!truncatedMarkets || truncatedMarkets.length === 0) {
        return 'No markets data available.';
    }
    
    // Show debug information about what we're parsing
    if (DEBUG_MODE) {
        console.log('Formatting truncated market data, length:', truncatedMarkets.length);
    }
    
    for (const market of truncatedMarkets) {
        try {
            // Format event info
            let eventInfo = '';
            
            // Handle different possible structures
            if (market.homeTeam && market.awayTeam) {
                eventInfo = `${market.homeTeam} vs ${market.awayTeam}`;
            } else if (market.eventName) {
                eventInfo = market.eventName;
            }
            
            // Add league info if available
            if (market.leagueName) {
                eventInfo = `${market.leagueName}: ${eventInfo}`;
            }
            
            // Add event time if available
            if (market.maturityDate) {
                const date = new Date(market.maturityDate);
                const formattedDate = date.toLocaleDateString();
                eventInfo += ` (${formattedDate})`;
            }
            
            result += `Event: ${eventInfo}\n`;
            
            // Format market info - simplify market names
            let marketName = '';
            if (market.originalMarketName) {
                marketName = market.originalMarketName;
            } else if (market.type === 'winner') {
                marketName = 'Moneyline';
            } else if (market.type) {
                marketName = market.type;
            }
            
            result += `Market: ${marketName || 'Unnamed market'}\n`;
            
            // Format odds (simplified)
            if (market.odds && Array.isArray(market.odds)) {
                result += 'Odds:\n';
                
                // Get team names for context
                const homeTeam = market.homeTeam || 'Home';
                const awayTeam = market.awayTeam || 'Away';
                
                market.odds.forEach((odd, index) => {
                    let outcomeName = '';
                    
                    // Try to determine outcome name for moneyline/winner markets
                    if (market.type === 'winner' || marketName === 'Moneyline') {
                        if (index === 0) {
                            outcomeName = homeTeam;
                        } else if (index === 1 && market.sport === 'Soccer') {
                            outcomeName = 'Draw';
                        } else {
                            outcomeName = awayTeam;
                        }
                    } else {
                        outcomeName = `Option ${index + 1}`;
                    }
                    
                    // Format odds simply
                    let price = 'N/A';
                    if (odd.american !== undefined) {
                        price = odd.american > 0 ? `+${Math.round(odd.american)}` : Math.round(odd.american);
                    } else if (odd.decimal !== undefined) {
                        price = odd.decimal.toFixed(2);
                    }
                    
                    result += `- ${outcomeName}: ${price}\n`;
                });
            }
            
            // Add a separator between markets
            result += '\n';
        } catch (error) {
            console.error('Error formatting market:', error);
            // Continue to next market even if one fails
        }
    }
    
    // If no markets were successfully processed, return an error message
    if (result === 'Available Markets:\n\n') {
        return 'Could not parse market data from the API response.';
    }
    
    return result;
}

// New function to truncate and filter markets for OpenAI
function truncateMarketsForOpenAI(markets) {
    if (!markets || !Array.isArray(markets) || markets.length === 0) {
        return [];
    }
    
    // Filter to keep only parent markets (not child markets)
    const parentMarkets = markets.filter(market => !market.isChildMarket);
    
    // Prioritize moneyline/winner markets
    const moneylineMarkets = parentMarkets.filter(
        market => market.type === 'winner' || 
                 (market.originalMarketName && 
                  market.originalMarketName.toLowerCase().includes('moneyline'))
    );
    
    // If we have moneyline markets, prioritize them
    const prioritizedMarkets = moneylineMarkets.length > 0 ? 
        moneylineMarkets : parentMarkets;
    
    // Limit to a reasonable number (10 max)
    const limitedMarkets = prioritizedMarkets.slice(0, 10);
    
    // Create simplified copies of the markets without unnecessary data
    return limitedMarkets.map(market => {
        // Extract only essential properties
        const simplified = {
            homeTeam: market.homeTeam,
            awayTeam: market.awayTeam,
            sport: market.sport,
            leagueName: market.leagueName,
            leagueId: market.leagueId,
            type: market.type,
            originalMarketName: market.originalMarketName,
            maturityDate: market.maturityDate || market.maturity,
            odds: market.odds
        };
        
        // Include line if it exists
        if (market.line !== undefined) {
            simplified.line = market.line;
        }
        
        return simplified;
    });
}

// Call OpenAI API to process the query with market context
async function callOpenAI(query, marketContext) {
    try {
        // Prepare the prompt with system instructions and user query
        const messages = [
            {
                role: 'system',
                content: `You are a sports betting assistant that helps users understand betting markets and odds. 
                You have access to the following market data. Please answer user questions based only on this data.
                Try to be helpful and explain odds when appropriate. If the user asks for something not in the data, 
                politely explain what data you have available. Always favor accuracy over making up information.
                
                ${marketContext}`
            },
            {
                role: 'user',
                content: query
            }
        ];
        
        // Update conversation history
        conversationHistory.push(...messages);
        
        // Keep context size reasonable (last 10 messages only)
        if (conversationHistory.length > 10) {
            conversationHistory = conversationHistory.slice(conversationHistory.length - 10);
        }
        
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: conversationHistory,
                temperature: 0.7,
                max_tokens: 800
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            // Add the AI response to conversation history
            conversationHistory.push(data.choices[0].message);
            return data.choices[0].message.content;
    } else {
            throw new Error('Invalid response format from OpenAI API');
        }
        
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        return `Error processing your request: ${error.message}`;
    }
}

// Clear terminal content
function clearTerminal() {
    terminalContent.innerHTML = '';
    addMessage("Terminal cleared.", 'system');
}

// Fetch live markets from the API
async function fetchLiveMarkets(leagueFilter) {
    // Show loading message
    const loadingMessage = addMessage("Fetching live markets...", 'system');
    
    try {
        // Use the live-markets endpoint
        const networkId = window.DEFAULT_NETWORK_ID;
        const url = `${window.API_BASE_URL}/overtime-v2/networks/${networkId}/live-markets`;
        
        // Add leagueId filter if provided
        if (leagueFilter && !isNaN(parseInt(leagueFilter))) {
            url.searchParams.append('leagueId', parseInt(leagueFilter));
        }
        
        if (DEBUG_MODE) {
            console.log('Fetching live markets from:', url);
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const marketData = await response.json();
        
        // Process the live markets
        displayLiveMarkets(marketData, leagueFilter);
        
        // Remove loading message
        if (loadingMessage && loadingMessage.parentNode) {
            loadingMessage.parentNode.removeChild(loadingMessage);
        }
    } catch (error) {
        // Remove loading message
        if (loadingMessage && loadingMessage.parentNode) {
            loadingMessage.parentNode.removeChild(loadingMessage);
        }
        
        console.error('Error fetching live markets:', error);
        addMessage(`Error: ${error.message}`, 'system');
    }
}

// Display live markets
function displayLiveMarkets(marketData, leagueFilter) {
    // Extract games from the response
    let liveGames = [];
    
    if (marketData && marketData.markets && Array.isArray(marketData.markets)) {
        // Extract unique games from the markets array
        const gameMap = new Map();
        
        marketData.markets.forEach(market => {
            if (market && market.gameId && !gameMap.has(market.gameId)) {
                // Only add games with status "ongoing"
                if (market.statusCode === "ongoing") {
                    // Add basic game info plus live-specific fields
                    gameMap.set(market.gameId, {
                        gameId: market.gameId,
                        homeTeam: market.homeTeam,
                        awayTeam: market.awayTeam,
                        sport: market.sport,
                        leagueId: market.leagueId,
                        leagueName: market.leagueName,
                        maturityDate: market.maturityDate || market.maturity,
                        // Live-specific fields
                        homeScore: market.homeScore,
                        awayScore: market.awayScore,
                        gameClock: market.gameClock,
                        gamePeriod: market.gamePeriod,
                        statusCode: market.statusCode
                    });
                }
            }
        });
        
        liveGames = Array.from(gameMap.values());
    }
    
    // If league filter is provided, filter games by league
    if (leagueFilter) {
        // Check if it's a league ID
        if (!isNaN(parseInt(leagueFilter))) {
            const leagueId = parseInt(leagueFilter);
            liveGames = liveGames.filter(game => game.leagueId === leagueId);
        } 
        // Check if it's a league or sport name
        else {
            const filterLower = leagueFilter.toLowerCase();
            liveGames = liveGames.filter(game => 
                (game.leagueName && game.leagueName.toLowerCase().includes(filterLower)) ||
                (game.sport && game.sport.toLowerCase().includes(filterLower))
            );
        }
    }
    
    // Set the current query results for further operations
    currentQueryResults = liveGames;
    
    if (liveGames.length === 0) {
        addMessage("No live games found. Try again later or check for specific leagues.", 'system');
        return;
    }
    
    // Group games by sport/league for better organization
    const gamesByLeague = {};
    liveGames.forEach(game => {
        const key = `${game.sport}: ${game.leagueName}`;
        if (!gamesByLeague[key]) {
            gamesByLeague[key] = [];
        }
        gamesByLeague[key].push(game);
    });
    
    // Format the output
    let output = `<div class="query-results">
        <div class="query-header">🔴 Live Games (${liveGames.length})</div>
        <div class="game-list">`;
    
    // Add each game grouped by league
    Object.keys(gamesByLeague).forEach(leagueKey => {
        const leagueGames = gamesByLeague[leagueKey];
        
        output += `<div style="padding: 5px; background-color: #2c3e50; color: white; font-weight: bold; text-align: center;">
            ${leagueKey} (${leagueGames.length})
        </div>`;
        
        leagueGames.forEach(game => {
            // Format the game clock display
            let clockDisplay = '';
            if (game.gameClock && game.gamePeriod) {
                clockDisplay = `${game.gamePeriod} • ${game.gameClock}`;
            } else if (game.gamePeriod) {
                clockDisplay = game.gamePeriod;
            } else if (game.statusCode) {
                clockDisplay = game.statusCode;
            }
            
            output += `<div class="game-item">
                <span class="game-id" onclick="document.getElementById('terminalInput').value = '/gameid ${game.gameId}'; document.getElementById('terminalInput').focus();">
                    [${shortenGameId(game.gameId)}]
                </span>
                <span class="teams">
                    ${game.awayTeam} <span style="color: #e74c3c; font-weight: bold;">${game.awayScore || 0}</span> @ 
                    ${game.homeTeam} <span style="color: #2ecc71; font-weight: bold;">${game.homeScore || 0}</span>
                </span>
                <span class="time" style="color: #f39c12; font-weight: bold;">${clockDisplay}</span>
            </div>`;
        });
    });
    
    output += `</div>
        <div class="query-footer">Click on a game ID to view markets or type /gameid [ID]</div>
    </div>`;
    
    addMessage(output, 'system');
}

// Set API key
function setApiKey(key) {
    // Basic validation - OpenAI keys usually start with sk-
    if (key.length > 20) {
        OPENAI_API_KEY = key;
        // Also store in window for persistence
        if (typeof window !== 'undefined') {
            window.OPENAI_API_KEY = key;
            // Store in localStorage for persistence across page reloads
            if (window.localStorage) {
                window.localStorage.setItem('openai_api_key', key);
            }
        }
        addMessage("API Key set successfully! You can now query Overtime Markets data.", 'system');
    } else {
        addMessage(`Error: The provided API key seems too short (${key.length} chars). OpenAI API keys are typically long strings.`, 'system');
    }
}

// Set network ID
function setNetworkId(id) {
    if (!isNaN(id)) {
        window.DEFAULT_NETWORK_ID = parseInt(id);
        addMessage(`Network ID set to ${window.DEFAULT_NETWORK_ID}`, 'system');
    } else {
        addMessage("Error: Please provide a valid network ID. Usage: /networkid 10", 'system');
    }
}

// Toggle debug mode
function toggleDebugMode() {
    DEBUG_MODE = !DEBUG_MODE;
    addMessage(`Debug mode ${DEBUG_MODE ? 'enabled' : 'disabled'}`, 'system');
} 