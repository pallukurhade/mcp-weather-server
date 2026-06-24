# Weather MCP Server

A simple [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides weather information to Claude.

## Tool

**`getWeather`** — Returns the current weather for a given city.

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `city`    | string | Name of the city   |

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Register the MCP server with Claude Code:
   ```bash
   claude mcp add weather-example npx tsx /path/to/main.ts
   ```

3. Restart Claude Code — the `getWeather` tool will be available in your session.

## Usage

Once registered, ask Claude things like:

- "What's the weather in Tokyo?"
- "Get the weather for New York"

## Requirements

- Node.js 18+
- [Claude Code](https://claude.ai/code)
