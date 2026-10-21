/**
 * modevc.com/public/mcp/webmcp.js
 *
 * W3C WebMCP (navigator.modelContext / document.modelContext) browser bridge for Mode VC.
 * Exposes Mode VC's 18 read-only MCP tools directly to in-browser AI agents, ChatGPT Desktop
 * WebMCP, Chrome Built-in AI, and the Mode VC Backlink & WebMCP Lens extension.
 */
(function () {
  'use strict';

  var RPC_ENDPOINT = 'https://modevc.com/api/mcp';
  var SERVER_INFO = {
    name: 'com.modevc/radar',
    title: 'Mode VC: AI Venture Charts, Investor Atlas and Founder Calculators',
    version: '2.1.0',
    homepage: 'https://modevc.com',
    rpcEndpoint: RPC_ENDPOINT,
    manifestUrl: 'https://modevc.com/.well-known/mcp.json',
    serverCardUrl: 'https://modevc.com/.well-known/mcp/server-card.json',
    maintainer: 'mark@modevc.com'
  };

  async function callMcpRpc(method, params) {
    var originRpc = (typeof location !== 'undefined' && location.hostname === 'modevc.com')
      ? '/api/mcp'
      : RPC_ENDPOINT;
    var res = await fetch(originRpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params || {}
      })
    });
    if (!res.ok) throw new Error('Mode VC MCP HTTP ' + res.status);
    var payload = await res.json();
    if (payload.error) throw new Error(payload.error.message || 'MCP RPC error');
    return payload.result;
  }

  // Provide a non-destructive WebMCP registry surface if the browser has not natively enabled navigator.modelContext yet
  var registeredTools = new Map();

  function ensureModelContextSurface() {
    var nav = typeof navigator !== 'undefined' ? navigator : null;
    if (!nav) return null;

    if (!nav.modelContext) {
      var polyfill = {
        _isModeVcWebMcpBridge: true,
        serverInfo: SERVER_INFO,
        registerTool: function (toolDef) {
          if (!toolDef || !toolDef.name) return;
          registeredTools.set(toolDef.name, toolDef);
        },
        unregisterTool: function (name) {
          registeredTools.delete(name);
        },
        listTools: function () {
          return Array.from(registeredTools.values());
        },
        callTool: async function (name, args) {
          var t = registeredTools.get(name);
          if (t && typeof t.execute === 'function') {
            return await t.execute(args || {});
          }
          return await callMcpRpc('tools/call', { name: name, arguments: args || {} });
        }
      };
      try {
        Object.defineProperty(nav, 'modelContext', {
          value: polyfill,
          configurable: true,
          writable: true
        });
      } catch (_) {
        window.modelContext = polyfill;
      }
    }

    if (typeof document !== 'undefined' && !document.modelContext && nav.modelContext) {
      try {
        Object.defineProperty(document, 'modelContext', {
          value: nav.modelContext,
          configurable: true,
          writable: true
        });
      } catch (_) {}
    }

    return nav.modelContext || window.modelContext;
  }

  async function initWebMcp() {
    var ctx = ensureModelContextSurface();
    if (!ctx) return;

    try {
      var listResult = await callMcpRpc('tools/list', {});
      var tools = (listResult && listResult.tools) ? listResult.tools : [];

      for (var i = 0; i < tools.length; i++) {
        (function (tool) {
          var def = {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema || { type: 'object', properties: {} },
            annotations: tool.annotations || { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
            execute: async function (args) {
              var res = await callMcpRpc('tools/call', { name: tool.name, arguments: args || {} });
              return res && res.structuredContent ? res.structuredContent : res;
            }
          };
          registeredTools.set(tool.name, def);
          if (typeof ctx.registerTool === 'function') {
            try { ctx.registerTool(def); } catch (_) {}
          }
        })(tools[i]);
      }

      // Expose metadata on window.__modevcWebMcp for instant inspection by WebMCP Lens & DevTools
      window.__modevcWebMcp = {
        ready: true,
        server: SERVER_INFO,
        toolCount: tools.length,
        tools: tools.map(function (t) { return { name: t.name, description: t.description, inputSchema: t.inputSchema }; }),
        callTool: function (name, args) {
          return callMcpRpc('tools/call', { name: name, arguments: args || {} });
        }
      };

      if (typeof CustomEvent === 'function') {
        window.dispatchEvent(new CustomEvent('webmcp:ready', { detail: window.__modevcWebMcp }));
      }
    } catch (err) {
      window.__modevcWebMcp = { ready: false, server: SERVER_INFO, error: err && err.message ? err.message : String(err) };
    }
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWebMcp, { once: true });
    } else {
      initWebMcp();
    }
  }
})();
