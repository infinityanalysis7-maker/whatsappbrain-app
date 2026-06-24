const { spawn } = require('child_process');
const path = require('path');

const mcp = spawn('npx.cmd', ['@testsprite/testsprite-mcp', 'server'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env },
  shell: true
});

let msgId = 0;
function send(method, params = {}) {
  const id = ++msgId;
  const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  console.log(`\n>>> SEND [${id}] ${method}`);
  mcp.stdin.write(msg + '\n');
  return id;
}

mcp.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(l => l.trim());
  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      console.log(`<<< RECV [${msg.id || 'notif'}]`, JSON.stringify(msg).substring(0, 2000));
    } catch {
      console.log(`<<< RAW:`, line.substring(0, 500));
    }
  }
});

mcp.stderr.on('data', (data) => {
  const t = data.toString().trim();
  if (t) console.log(`[STDERR]:`, t.substring(0, 500));
});

mcp.on('error', (err) => {
  console.error('[SPAWN ERROR]:', err.message);
});

mcp.on('close', (code) => {
  console.log(`\n[EXIT] code=${code}`);
});

// Step 1: Initialize
setTimeout(() => {
  send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'opencode-test', version: '1.0.0' }
  });
}, 1500);

// Step 2: List tools
setTimeout(() => {
  send('tools/list');
}, 3500);

// Step 3: Call generateCodeAndExecute with our test description
setTimeout(() => {
  send('tools/call', {
    name: 'testsprite_generate_code_and_execute',
    arguments: {
      url: 'http://localhost:3000/dashboard/settings',
      testDescription: `AUTONOMOUS FRONTEND TEST for WhatsAppBrain Settings Page.

TARGET URL: http://localhost:3000/dashboard/settings

TEST PLAN - Verify these sections render correctly:

SECTION 1: AI Auto-Pilot
- Verify section header "AI Auto-Pilot" is visible
- Verify toggle "Auto-Reply to Everything" renders with a switch control
- Verify toggle "Smart Handoff" renders with a switch control
- Verify toggle "AI Fallback" renders with a switch control
- Count: exactly 3 toggle switches in this section

SECTION 2: Smart Automation
- Verify section header "Smart Automation" is visible
- Verify toggle "Auto Profile Generation" renders
- Verify toggle "Smart Pricing Suggestions" renders
- Verify toggle "Auto Rule Generation" renders
- Verify toggle "Sentiment Analysis" renders
- Verify toggle "Smart Scheduling" renders
- Count: exactly 5 toggle switches in this section

SECTION 3: Developer Settings
- Verify "Developer Settings" expandable header is visible
- Click to expand the Developer Settings section
- Verify "WhatsApp Access Token" field appears
- Verify "Phone Number ID" field appears
- Verify "Webhook Verify Token" field appears
- Verify "Resend API Key" field appears

INTERACTION TEST:
- Toggle "Smart Handoff" off, verify aria-checked=false
- Toggle "Smart Handoff" back on, verify aria-checked=true

Report PASS/FAIL for each section with details on any missing elements.`
    }
  });
}, 5500);

// Timeout - kill after 2 minutes
setTimeout(() => {
  console.log('\n[TIMEOUT] Killing MCP server');
  mcp.kill();
  process.exit(0);
}, 120000);
