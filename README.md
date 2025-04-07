# BetCLI

A command-line interface for querying sports betting markets using the Overtime Markets API.

## Features

- Query sports betting markets by league (NBA, NFL, EPL, etc.)
- View live games and scores
- Display detailed market information including moneyline, spreads, and totals
- Interactive terminal interface with clickable elements
- Support for multiple leagues and market types
- Real-time data from Overtime Markets API

## Commands

- `/help` - Show available commands
- `/query LEAGUE` - Query games for a specific league (e.g., `/query nba`)
- `/gameid ID` - View markets for a specific game
- `/live [league]` - Show currently live games (optional league filter)
- `/type TYPE` - Filter markets by type
- `/leagueid [sport|league|id]` - Show league IDs and details
- `/networkid NUMBER` - Set the network ID (default: 10 for Optimism)
- `/debug` - Toggle debug mode
- `/clear` - Clear the terminal

## League IDs

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

## Setup

1. Clone the repository
2. Open `index.html` in a web browser
3. Set your OpenAI API key using the `/apikey` command
4. Start querying markets!

## API Endpoints

The application uses the following Overtime Markets API endpoints:

- Markets: `https://overtimemarketsv2.xyz/overtime-v2/networks/10/markets`
- Live Markets: `https://overtimemarketsv2.xyz/overtime-v2/networks/10/live-markets`
- Game Markets: `https://overtimemarketsv2.xyz/overtime-v2/networks/10/markets/{gameID}`

## Dependencies

- OpenAI API for natural language processing
- Overtime Markets API for sports betting data

## License

MIT License 