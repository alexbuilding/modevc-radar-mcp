# Mode VC Radar MCP Server

[![Official MCP Registry](https://img.shields.io/badge/MCP%20Registry-com.modevc%2Fradar-10b981)](https://registry.modelcontextprotocol.io/v0/servers?search=com.modevc)
[![Glama Verified](https://img.shields.io/badge/Glama-Verified-blue)](https://glama.ai/mcp/connectors/com.modevc/radar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Real-time venture capital intelligence, 5,193 verified investor theses, SEC Form D private offering radar, and 38 empirical market valuation benchmarks via Model Context Protocol.

Official MCP Registry Identifier: `com.modevc/radar`  
Hosted Streamable HTTP Endpoint: `https://modevc.com/api/mcp` (free, read-only, no auth required)  
Homepage: [https://modevc.com](https://modevc.com)

## Quick Start

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "modevc-radar": {
      "url": "https://modevc.com/api/mcp"
    }
  }
}
```

### Cursor / Windsurf

Configure as a remote Streamable HTTP server:

- **Server URL**: `https://modevc.com/api/mcp`
- **Transport**: `HTTP (SSE / Streamable)`

## Capabilities

- **Investor Thesis Search**: Search 5,193 curated VC firm theses, partner sector focuses, check sizes, and lead partner bios.
- **SEC Form D Radar**: Live private placement intelligence and venture funding rounds filed with the SEC.
- **AI Valuation & Unit Economics Benchmarks**: 38 interactive empirical benchmarks across public, private, and frontier AI companies.

## License

MIT © [Mode VC](https://modevc.com)
