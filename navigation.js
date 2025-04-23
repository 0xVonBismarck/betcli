// Navigation state
const navigationState = {
    isNavigating: false,
    currentIndex: -1,
    items: [],
    selectedMarket: null,
    isInSubMarkets: false,
    subMarkets: [],
    subMarketIndex: -1
};

// Colors and styles
const styles = {
    selected: '\x1b[7m', // Inverted colors
    normal: '\x1b[0m',   // Reset
    dim: '\x1b[2m',      // Dimmed text
    cyan: '\x1b[36m',    // Cyan text
    yellow: '\x1b[33m',  // Yellow text
    green: '\x1b[32m',   // Green text
    red: '\x1b[31m',     // Red text
    bold: '\x1b[1m',     // Bold text
};

// Helper function to format odds
function formatOdds(odds) {
    if (!odds) return '';
    const americanOdds = parseInt(odds);
    return americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
}

// Format a single market line
function formatMarketLine(market, isSelected = false) {
    const homeTeam = market.homeTeam || market.teams?.[0] || '';
    const awayTeam = market.awayTeam || market.teams?.[1] || '';
    const score = market.score ? ` ${styles.yellow}[${market.score.home} - ${market.score.away}]${styles.normal}` : '';
    const time = market.startTime ? new Date(market.startTime).toLocaleTimeString() : '';
    const period = market.period ? ` ${styles.cyan}[${market.period}]${styles.normal}` : '';
    
    let line = `${isSelected ? styles.selected : ''}`;
    line += `${homeTeam} vs ${awayTeam}${score}${period}`;
    
    if (market.odds) {
        const homeOdds = formatOdds(market.odds.home);
        const awayOdds = formatOdds(market.odds.away);
        line += ` ${styles.dim}[${homeOdds} | ${awayOdds}]${styles.normal}`;
    }
    
    if (time) {
        line += ` ${styles.dim}(${time})${styles.normal}`;
    }
    
    line += isSelected ? styles.normal : '';
    return line;
}

// Format a sub-market line
function formatSubMarketLine(market, isSelected = false) {
    const type = market.type || 'Unknown';
    const odds = market.odds || {};
    let line = `${isSelected ? styles.selected : ''}`;
    line += `${styles.cyan}${type}${styles.normal}: `;
    
    if (type.toLowerCase().includes('spread')) {
        line += `${odds.home || ''} (${formatOdds(odds.homeOdds)}) | ${odds.away || ''} (${formatOdds(odds.awayOdds)})`;
    } else if (type.toLowerCase().includes('total')) {
        line += `O${odds.over || ''} (${formatOdds(odds.overOdds)}) | U${odds.under || ''} (${formatOdds(odds.underOdds)})`;
    } else {
        line += `${formatOdds(odds.homeOdds)} | ${formatOdds(odds.awayOdds)}`;
    }
    
    line += isSelected ? styles.normal : '';
    return line;
}

// Display the current navigation state
function displayNavigationState() {
    const terminalContent = document.getElementById('terminalContent');
    if (!terminalContent) return;

    // Create header
    let output = `${styles.bold}=== ${navigationState.isInSubMarkets ? 'Market Details' : 'Available Markets'} ===${styles.normal}\n\n`;

    if (navigationState.isInSubMarkets) {
        // Display parent market info
        output += formatMarketLine(navigationState.selectedMarket) + '\n\n';
        
        // Display sub-markets
        navigationState.subMarkets.forEach((market, index) => {
            output += formatSubMarketLine(market, index === navigationState.subMarketIndex) + '\n';
        });
    } else {
        // Display all markets
        navigationState.items.forEach((market, index) => {
            output += formatMarketLine(market, index === navigationState.currentIndex) + '\n';
        });
    }

    // Add navigation instructions
    output += '\n';
    output += `${styles.dim}Use ↑/↓ to navigate, `;
    output += navigationState.isInSubMarkets ? 
        '← to go back, or q to quit' : 
        '→ or Enter to view details, or q to quit${styles.normal}';

    // Update terminal content
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.innerHTML = output.replace(/\n/g, '<br>');
    
    // Clear previous content and add new
    terminalContent.innerHTML = '';
    terminalContent.appendChild(messageDiv);
    terminalContent.scrollTop = terminalContent.scrollHeight;
}

// Handle keyboard navigation
function handleNavigation(event) {
    if (!navigationState.isNavigating) return false;

    const key = event.key.toLowerCase();
    
    switch (key) {
        case 'arrowup':
            if (navigationState.isInSubMarkets) {
                navigationState.subMarketIndex = Math.max(0, navigationState.subMarketIndex - 1);
            } else {
                navigationState.currentIndex = Math.max(0, navigationState.currentIndex - 1);
            }
            displayNavigationState();
            event.preventDefault();
            return true;

        case 'arrowdown':
            if (navigationState.isInSubMarkets) {
                navigationState.subMarketIndex = Math.min(navigationState.subMarkets.length - 1, navigationState.subMarketIndex + 1);
            } else {
                navigationState.currentIndex = Math.min(navigationState.items.length - 1, navigationState.currentIndex + 1);
            }
            displayNavigationState();
            event.preventDefault();
            return true;

        case 'arrowleft':
            if (navigationState.isInSubMarkets) {
                navigationState.isInSubMarkets = false;
                navigationState.subMarketIndex = -1;
                displayNavigationState();
                event.preventDefault();
                return true;
            }
            return false;

        case 'arrowright':
        case 'enter':
            if (!navigationState.isInSubMarkets && navigationState.currentIndex >= 0) {
                navigationState.selectedMarket = navigationState.items[navigationState.currentIndex];
                navigationState.subMarkets = navigationState.selectedMarket.childMarkets || [];
                navigationState.isInSubMarkets = true;
                navigationState.subMarketIndex = navigationState.subMarkets.length > 0 ? 0 : -1;
                displayNavigationState();
                event.preventDefault();
                return true;
            }
            return false;

        case 'q':
            navigationState.isNavigating = false;
            navigationState.currentIndex = -1;
            navigationState.isInSubMarkets = false;
            navigationState.subMarketIndex = -1;
            // Clear the navigation display
            const terminalContent = document.getElementById('terminalContent');
            if (terminalContent) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message system';
                messageDiv.textContent = 'Navigation mode exited.';
                terminalContent.appendChild(messageDiv);
                terminalContent.scrollTop = terminalContent.scrollHeight;
            }
            event.preventDefault();
            return true;

        default:
            return false;
    }
}

// Start navigation mode with the given markets
function startNavigation(markets) {
    navigationState.isNavigating = true;
    navigationState.items = markets;
    navigationState.currentIndex = markets.length > 0 ? 0 : -1;
    navigationState.isInSubMarkets = false;
    navigationState.subMarketIndex = -1;
    displayNavigationState();
}

// Export the navigation functions
window.navigationHandler = {
    startNavigation,
    handleNavigation
}; 