#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const manifestPath = path.join(__dirname, "mcp.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const REMOTE_MCP_URL = "https://modevc.com/api/mcp";

if (process.argv.includes("--self-test")) {
  console.log(JSON.stringify({ ok: true, server: manifest.name, version: manifest.version, tools: (manifest.tools || []).length }));
  process.exit(0);
}

async function handleRequest(msg) {
  if (!msg || typeof msg !== "object") return null;
  const { id, method, params } = msg;

  if (method === "notifications/initialized" || id === undefined) {
    return null;
  }

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: (params && params.protocolVersion) || "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: manifest.name || "com.modevc/radar",
          version: manifest.version || "2.1.0"
        }
      }
    };
  }

  if (method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: manifest.tools || []
      }
    };
  }

  if (method === "tools/call") {
    try {
      const res = await fetch(REMOTE_MCP_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id, method: "tools/call", params })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: "Remote MCP proxy error: " + err.message }
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found: " + method }
  };
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const parsed = JSON.parse(trimmed);
    const resp = await handleRequest(parsed);
    if (resp) {
      process.stdout.write(JSON.stringify(resp) + "\n");
    }
  } catch (e) {
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + "\n");
  }
});
