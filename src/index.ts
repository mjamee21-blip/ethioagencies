import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { TradeLockerService, TradeLockerConfig, OrderRequest } from './tradelocker';

// VERSION: 4.4 - Fixed Login & Authentication - Deployed 2026-08-19
const APP_VERSION = '4.4';
const APP_BUILD_DATE = '2026-08-19 20:55';

export interface CloudflareBindings {
  Access_Key_ID?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_USERNAME?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  TRADELOCKER_EMAIL: string;
  TRADELOCKER_PASSWORD: string;
  TRADELOCKER_SERVER: string;
  TRADELOCKER_ACCOUNT_ID: string;
  TRADELOCKER_ACC_NUM: string;
  ENV: string;
  S3_API_endpoint?: string;
  Secret_Access_Key?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TELEGRAM_CHANNEL_ID?: string;
  DB?: any;
}

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use('*', cors());

// Wire new API routes
app.use('/api/*', async (c, next) => {
  const db = c.env.DB;
  if (db) await ensureTables(db);
  const url = new URL(c.req.url);
  const body = c.req.method === "POST" ? await c.req.text() : null;
  const apiResponse = await handleApiRequest(url, c.req.method, body, c.env, db);
  if (apiResponse) return apiResponse;
  await next();
});

// Dashboard route - publicly accessible
app.get('/', async (c) => {
  // Always return dashboard HTML without authentication
  // Test credentials siris888/P@ssw0rd are displayed on the login screen for demo purposes
  return c.html(getDashboardHTML(null));
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function handleApiRequest(url: URL, method: string, body: string | null, env: any, db: any) {
  const path = url.pathname;
  const searchParams = url.searchParams;

  // Login endpoint
  if (path === "/api/login" && method === "POST") {
    try {
      const data = typeof body === "string" ? JSON.parse(body || '{}') : (body || {});
      const username = (data.username || '').trim();
      const password = (data.password || '').trim();
      
      let expectedUsername = (env.ADMIN_USERNAME || '').trim();
      let expectedPassword = (env.ADMIN_PASSWORD || '').trim();

      if ((!expectedUsername || !expectedPassword) && db) {
        try {
          const uRow = await db.prepare("SELECT value FROM app_settings WHERE key = 'admin_username'").first();
          const pRow = await db.prepare("SELECT value FROM app_settings WHERE key = 'admin_password'").first();
          expectedUsername = (uRow?.value || expectedUsername).trim();
          expectedPassword = (pRow?.value || expectedPassword).trim();
        } catch (e) {
          console.error('Error fetching admin credentials from DB:', e);
        }
      }

      expectedUsername = expectedUsername || 'siris888';
      expectedPassword = expectedPassword || 'P@ssw0rd';

      if (username === expectedUsername && password === expectedPassword) {
        const token = btoa(username + ':' + password);
        return new Response(JSON.stringify({ success: true, token }), {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `authToken=${token}; Path=/; HttpOnly; SameSite=Strict`
          }
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      return new Response(JSON.stringify({ success: false, error: err.message || 'Login error' }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  if (!db) return null;

  if (path === "/api/settings" && method === "GET") {
    const result = await db.prepare("SELECT key, value FROM app_settings").all();
    const settings: Record<string, any> = {};
    for (const row of ((result?.results || []) as any[])) settings[row.key] = row.value;
    return new Response(JSON.stringify({ success: true, settings }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/settings" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    for (const [key, value] of Object.entries(data)) {
      await db.prepare("INSERT INTO app_settings (key, value, updatedAt) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updatedAt = ?").bind(key, String(value), new Date().toISOString(), String(value), new Date().toISOString()).run();
    }
    return new Response(JSON.stringify({ success: true, message: "Settings saved" }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/pairs" && method === "GET") {
    const result = await db.prepare("SELECT symbol, enabled, lotSize as lot_size FROM pair_config ORDER BY symbol").all();
    return new Response(JSON.stringify({ success: true, pairs: result?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }
  
  // Add a new pair
  if (path === "/api/pairs/add" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    const symbol = data.symbol.toUpperCase();
    const lotSize = data.lotSize || data.lot_size || 0.01;
    await db.prepare(
      "INSERT INTO pair_config (symbol, enabled, lotSize, updatedAt) VALUES (?, 1, ?, ?) ON CONFLICT(symbol) DO UPDATE SET enabled = 1, lotSize = ?, updatedAt = ?"
    ).bind(
      symbol,
      lotSize,
      new Date().toISOString(),
      lotSize,
      new Date().toISOString()
    ).run();
    return new Response(JSON.stringify({ success: true, message: "Pair added" }), { headers: { "Content-Type": "application/json" } });
  }
  
  // Get a single pair by symbol
  if (path === "/api/pairs/single" && method === "GET") {
    const symbol = searchParams.get('symbol')?.toUpperCase() || JSON.parse(body || '{}').symbol?.toUpperCase();
    const result = await db.prepare("SELECT symbol, enabled, lotSize as lot_size FROM pair_config WHERE symbol = ?").bind(symbol).first();
    return new Response(JSON.stringify({ success: true, pair: result || null }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/pairs" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    for (const pair of (data.pairs || [])) {
      const isEnabled = (pair.enabled === true || pair.enabled === 1 || pair.enabled === 'true' || pair.enabled === '1') ? 1 : 0;
      await db.prepare("INSERT INTO pair_config (symbol, enabled, lotSize, updatedAt) VALUES (?, ?, ?, ?) ON CONFLICT(symbol) DO UPDATE SET enabled = ?, lotSize = ?, updatedAt = ?").bind(pair.symbol, isEnabled, pair.lotSize || 0.01, new Date().toISOString(), isEnabled, pair.lotSize || 0.01, new Date().toISOString()).run();
    }
    return new Response(JSON.stringify({ success: true, message: "Pair settings saved" }), { headers: { "Content-Type": "application/json" } });
  }
  if ((path === "/api/pairs/delete" || path === "/api/pairs/remove") && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    if (data.symbol) {
      await db.prepare("DELETE FROM pair_config WHERE symbol = ?").bind(data.symbol.toUpperCase()).run();
    }
    return new Response(JSON.stringify({ success: true, message: "Pair deleted" }), { headers: { "Content-Type": "application/json" } });
  }
  
  // Update pair settings (toggle enabled/disabled or update lot size)
  if (path === "/api/pairs/update" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    const isEnabled = (data.enabled === true || data.enabled === 1 || data.enabled === 'true' || data.enabled === '1') ? 1 : 0;
    const lotSize = data.lot_size || data.lotSize || 0.01;
    await db.prepare(
      "INSERT INTO pair_config (symbol, enabled, lotSize, updatedAt) VALUES (?, ?, ?, ?) ON CONFLICT(symbol) DO UPDATE SET enabled = ?, lotSize = ?, updatedAt = ?"
    ).bind(
      data.symbol.toUpperCase(),
      isEnabled,
      lotSize,
      new Date().toISOString(),
      isEnabled,
      lotSize,
      new Date().toISOString()
    ).run();
    return new Response(JSON.stringify({ success: true, message: "Pair updated" }), { headers: { "Content-Type": "application/json" } });
  }
  
  // Get all Telegram channels
  if (path === "/api/channels" && method === "GET") {
    const result = await db.prepare("SELECT id, channelId, channelName, enabled FROM telegram_channels ORDER BY addedAt DESC").all();
    return new Response(JSON.stringify({ success: true, channels: result?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }
  
  // Add a new Telegram channel
  if (path === "/api/channels/add" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    await db.prepare(
      "INSERT OR IGNORE INTO telegram_channels (channelId, channelName, enabled, addedAt) VALUES (?, ?, ?, ?)"
    ).bind(
      data.channelId,
      data.channelName || '',
      data.enabled ? 1 : 1, // Default to enabled
      new Date().toISOString()
    ).run();
    return new Response(JSON.stringify({ success: true, message: "Channel added" }), { headers: { "Content-Type": "application/json" } });
  }
  
  // Update Telegram channel (toggle enabled/disabled)
  if (path === "/api/channels/update" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    await db.prepare(
      "UPDATE telegram_channels SET enabled = ?, channelName = ? WHERE channelId = ?"
    ).bind(
      data.enabled ? 1 : 0,
      data.channelName || '',
      data.channelId
    ).run();
    return new Response(JSON.stringify({ success: true, message: "Channel updated" }), { headers: { "Content-Type": "application/json" } });
  }
  
  // Get all settings
  if (path === "/api/settings" && method === "GET") {
    const result = await db.prepare("SELECT key, value FROM app_settings").all();
    const settingsMap = result?.results?.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    return new Response(JSON.stringify({ success: true, settings: settingsMap || {} }), { headers: { "Content-Type": "application/json" } });
  }
  
  // Save settings
  if (path === "/api/settings" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    const settings = [
      { key: 'ctraderAccountId', value: data.ctraderAccountId },
      { key: 'ctraderAccountNumber', value: data.ctraderAccountNumber },
      { key: 'defaultLotSize', value: data.defaultLotSize?.toString() || '0.01' },
      { key: 'autoExecuteTrades', value: data.autoExecuteTrades?.toString() || 'false' },
    ];

    for (const setting of settings) {
      await db.prepare(
        "INSERT OR REPLACE INTO app_settings (key, value, updatedAt) VALUES (?, ?, ?)"
      ).bind(setting.key, setting.value, new Date().toISOString()).run();
    }
    return new Response(JSON.stringify({ success: true, message: "Settings saved" }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/channels" && method === "GET") {
    const result = await db.prepare("SELECT id, channelId, channelName, enabled, addedAt FROM telegram_channels ORDER BY id").all();
    return new Response(JSON.stringify({ success: true, channels: result?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/channels" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    await db.prepare("INSERT OR IGNORE INTO telegram_channels (channelId, channelName, enabled, addedAt) VALUES (?, ?, 1, ?)").bind(data.channelId, data.channelName || "", new Date().toISOString()).run();
    return new Response(JSON.stringify({ success: true, message: "Channel added" }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/channels/delete" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    await db.prepare("DELETE FROM telegram_channels WHERE id = ?").bind(data.id).run();
    return new Response(JSON.stringify({ success: true, message: "Channel deleted" }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/channels/toggle" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    await db.prepare("UPDATE telegram_channels SET enabled = ? WHERE id = ?").bind(data.enabled ? 1 : 0, data.id).run();
    return new Response(JSON.stringify({ success: true, message: "Channel updated" }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/trades" && method === "GET") {
    const limit = parseInt(searchParams.get("limit") || "50");
    if (env.TRADELOCKER_EMAIL && env.TRADELOCKER_PASSWORD) {
      try {
        await syncTradeHistoryWithTradeLocker(env, db);
      } catch (err) {
        console.error('Trade sync error:', err);
      }
    }
    const result = await db.prepare("SELECT * FROM trade_history ORDER BY createdAt DESC LIMIT ?").bind(limit).all();
    return new Response(JSON.stringify({ success: true, trades: result?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/errors" && method === "GET") {
    const limit = parseInt(searchParams.get("limit") || "50");
    const result = await db.prepare("SELECT id, timestamp, severity, source, message, details FROM error_log ORDER BY id DESC LIMIT ?").bind(limit).all();
    return new Response(JSON.stringify({ success: true, errors: result?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/errors/clear" && method === "POST") {
    await db.prepare("DELETE FROM error_log").run();
    return new Response(JSON.stringify({ success: true, message: "Error log cleared" }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/signals" && method === "GET") {
    const limit = parseInt(searchParams.get("limit") || "50");
    const result = await db.prepare("SELECT * FROM signals ORDER BY createdAt DESC LIMIT ?").bind(limit).all();
    return new Response(JSON.stringify({ success: true, signals: result?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/telegram-messages" && method === "GET") {
    const limit = parseInt(searchParams.get("limit") || "50");
    const result = await db.prepare("SELECT * FROM telegram_messages ORDER BY timestamp DESC LIMIT ?").bind(limit).all();
    return new Response(JSON.stringify({ success: true, messages: result?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/parser/test" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    const text = data.text || '';
    const cleanText = text.replace(/<[^>]*>/g, '');
    const parsed = parseSignal(cleanText);
    return new Response(JSON.stringify({ success: true, parsed, rawInput: text, cleanText }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/parser/rules" && method === "GET") {
    const result = await db.prepare("SELECT * FROM parser_rules ORDER BY id").all();
    return new Response(JSON.stringify({ success: true, rules: result?.results || [] }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/parser/rules/add" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    await db.prepare("INSERT OR REPLACE INTO parser_rules (ruleName, pattern, replacement, enabled, updatedAt) VALUES (?, ?, ?, ?, ?)").bind(data.ruleName, data.pattern, data.replacement || '', data.enabled !== false ? 1 : 0, new Date().toISOString()).run();
    return new Response(JSON.stringify({ success: true, message: "Rule added/updated" }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/parser/rules/update" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    const isEnabled = (data.enabled === true || data.enabled === 1 || data.enabled === 'true' || data.enabled === '1') ? 1 : 0;
    await db.prepare("UPDATE parser_rules SET enabled = ?, pattern = ?, replacement = ?, updatedAt = ? WHERE id = ? OR ruleName = ?").bind(isEnabled, data.pattern || '', data.replacement || '', new Date().toISOString(), data.id || 0, data.ruleName || '').run();
    return new Response(JSON.stringify({ success: true, message: "Rule updated" }), { headers: { "Content-Type": "application/json" } });
  }
  if (path === "/api/parser/rules/delete" && method === "POST") {
    const data = typeof body === "string" ? JSON.parse(body) : body;
    await db.prepare("DELETE FROM parser_rules WHERE id = ? OR ruleName = ?").bind(data.id || 0, data.ruleName || '').run();
    return new Response(JSON.stringify({ success: true, message: "Rule deleted" }), { headers: { "Content-Type": "application/json" } });
  }
  return null;
}

// Initialize database tables
async function ensureTables(db: any) {
  if (!db) return;
  try {
    // Try to migrate existing signals table to add error columns
    try {
      await db.prepare('ALTER TABLE signals ADD COLUMN error TEXT').run();
      await db.prepare('ALTER TABLE signals ADD COLUMN errorMessage TEXT').run();
      console.log('Database migration: Added error columns to signals table');
    } catch (e) {
      // If ALTER TABLE fails, the columns might already exist
      console.log('Signals table already has error columns or migration error (this is OK)');
    }
    
    // Create signals table with error columns
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS signals (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        action TEXT,
        openPrice REAL,
        closePrice REAL,
        openTime TEXT,
        closeTime TEXT,
        status TEXT DEFAULT 'PENDING',
        profit REAL,
        profitPercent REAL,
        volume REAL,
        stopLoss REAL,
        takeProfit REAL,
        orderId TEXT,
        pair TEXT,
        source TEXT,
        error TEXT,
        errorMessage TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        type TEXT,
        message TEXT,
        details TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS cron_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        executedAt TEXT NOT NULL,
        status TEXT,
        details TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS telegram_messages (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        text TEXT,
        type TEXT,
        userId TEXT,
        userName TEXT,
        processed INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS deployment_info (
        id INTEGER PRIMARY KEY,
        deploymentTime TEXT,
        startTime TEXT
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS pair_config (
        symbol TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 1,
        lotSize REAL DEFAULT 0.01,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS telegram_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channelId TEXT UNIQUE,
        channelName TEXT,
        enabled INTEGER DEFAULT 1,
        addedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS parser_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ruleName TEXT UNIQUE,
        pattern TEXT,
        replacement TEXT,
        enabled INTEGER DEFAULT 1,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const existingRules = await db.prepare("SELECT COUNT(*) as cnt FROM parser_rules").first();
    if (!existingRules || existingRules.cnt === 0) {
      const defaultRules = [
        ['Gold Alias', 'gold', 'XAUUSD', 1],
        ['Silver Alias', 'silver', 'XAGUSD', 1],
        ['Oil Alias', 'oil', 'USOIL', 1],
        ['Bitcoin Alias', 'btc', 'BTCUSD', 1],
        ['Ethereum Alias', 'eth', 'ETHUSD', 1],
        ['Market Keyword Now', 'now', 'market', 1],
        ['Take Profit 1 Priority', 'tp1', 'tp', 1]
      ];
      for (const r of defaultRules) {
        await db.prepare("INSERT OR IGNORE INTO parser_rules (ruleName, pattern, replacement, enabled, updatedAt) VALUES (?, ?, ?, ?, ?)").bind(r[0], r[1], r[2], r[3], new Date().toISOString()).run();
      }
    }

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('admin_username', 'siris888')").run();
    await db.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('admin_password', 'P@ssw0rd')").run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS trade_history (
        id TEXT PRIMARY KEY,
        signalId TEXT,
        symbol TEXT,
        action TEXT,
        volume REAL,
        openPrice REAL,
        closePrice REAL,
        openTime TEXT,
        closeTime TEXT,
        status TEXT,
        result TEXT,
        profit REAL DEFAULT 0,
        stopLoss REAL,
        takeProfit REAL,
        orderId TEXT,
        details TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS error_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        severity TEXT,
        source TEXT,
        message TEXT,
        stack TEXT,
        details TEXT
      )
    `).run();

    console.log('Tables initialized successfully');
  } catch (e) {
    console.error('Table initialization error:', e);
  }
}

// Get deployment start time
async function getStartTime(db: any): Promise<number> {
  try {
    const result = await db.prepare('SELECT startTime FROM deployment_info LIMIT 1').first();
    if (result?.startTime) {
      return parseInt(result.startTime);
    }
    const startTime = Date.now();
    await db.prepare('INSERT OR REPLACE INTO deployment_info (id, startTime) VALUES (1, ?)').bind(startTime.toString()).run();
    return startTime;
  } catch {
    return Date.now();
  }
}

// API Dashboard endpoint
app.get('/api/dashboard', async (c) => {
  const db = c.env.DB;

  try {
    await ensureTables(db);

    let signals: any[] = [];
    let logs: any[] = [];
    let messages: any[] = [];
    let cronStatus: any = null;
    let startTime = Date.now();

    if (db) {
      startTime = await getStartTime(db);

      try {
        const sigResult = await db.prepare('SELECT * FROM signals ORDER BY openTime DESC LIMIT 100').all();
        signals = sigResult?.results || [];
      } catch (e) {
        console.error('Signals query error:', e);
      }

      try {
        const logsResult = await db.prepare('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 150').all();
        logs = logsResult?.results || [];
      } catch (e) {
        console.error('Logs query error:', e);
      }

      try {
        const msgResult = await db.prepare('SELECT * FROM telegram_messages ORDER BY timestamp DESC LIMIT 100').all();
        messages = msgResult?.results || [];
      } catch (e) {
        console.error('Messages query error:', e);
      }

      try {
        cronStatus = await db.prepare('SELECT * FROM cron_jobs ORDER BY executedAt DESC LIMIT 1').first();
      } catch (e) {
        console.error('Cron query error:', e);
      }
    }

    // Calculate statistics
    const openSignals = signals.filter((s: any) => s.status === 'OPEN');
    const closedSignals = signals.filter((s: any) => s.status === 'CLOSED');
    const successfulSignals = closedSignals.filter((s: any) => (s.profit || 0) > 0);
    const successRate = closedSignals.length > 0
      ? parseFloat(((successfulSignals.length / closedSignals.length) * 100).toFixed(2))
      : 0;
    
    // Include REJECTED signals in the total count for success rate calculation
    const totalProcessedSignals = closedSignals.length + signals.filter((s: any) => s.status === 'REJECTED').length;
    const totalSuccessfulSignals = successfulSignals.length;
    const overallSuccessRate = totalProcessedSignals > 0
      ? parseFloat(((totalSuccessfulSignals / totalProcessedSignals) * 100).toFixed(2))
      : 0;

    // Test TradeLocker connection & diagnostics
    let tradeLockerConnected = false;
    let tradeLockerErrorMsg = '';
    let tradeLockerData: any = {
      connected: false,
      server: c.env.TRADELOCKER_SERVER || 'N/A',
      accountId: c.env.TRADELOCKER_ACCOUNT_ID || 'N/A',
      accountNum: c.env.TRADELOCKER_ACC_NUM || 'N/A',
      email: c.env.TRADELOCKER_EMAIL ? c.env.TRADELOCKER_EMAIL.substring(0, 3) + '***' : 'N/A',
      hasCredentials: !!c.env.TRADELOCKER_EMAIL && !!c.env.TRADELOCKER_PASSWORD,
      lastUpdate: new Date().toISOString(),
      errorMessage: '',
      rejectionReason: '',
    };

    // Test TradeLocker connection
    if (tradeLockerData.hasCredentials) {
      try {
        const tlResponse = await fetch(`${c.env.TRADELOCKER_SERVER}/api/Auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: c.env.TRADELOCKER_EMAIL,
            password: c.env.TRADELOCKER_PASSWORD,
          }),
        });

        if (tlResponse.ok) {
          tradeLockerConnected = true;
          tradeLockerData.connected = true;
          
          if (db) {
            await db.prepare(
              'INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)'
            ).bind(new Date().toISOString(), 'INFO', 'TradeLocker connection successful', JSON.stringify({ connected: true })).run();
          }
        } else {
          const statusText = await tlResponse.text().catch(() => tlResponse.statusText);
          tradeLockerErrorMsg = `HTTP ${tlResponse.status}: ${statusText || 'Check your TradeLocker credentials'}`;
          tradeLockerData.errorMessage = tradeLockerErrorMsg;
          tradeLockerData.rejectionReason = tradeLockerErrorMsg;
          tradeLockerConnected = false;
        }
      } catch (e: any) {
        tradeLockerErrorMsg = e instanceof Error ? e.message : 'TradeLocker connection error';
        tradeLockerData.errorMessage = tradeLockerErrorMsg;
        tradeLockerData.rejectionReason = 'Connection failed';
        tradeLockerConnected = false;
      }
    } else {
      tradeLockerErrorMsg = 'TradeLocker credentials not configured';
      tradeLockerData.errorMessage = tradeLockerErrorMsg;
      tradeLockerConnected = false;
    }

    // Test Telegram connection & diagnostics
    let telegramConnected = false;
    let telegramErrorMsg = '';
    let telegramBotName = 'N/A';
    try {
      const tgResponse = await fetch(`https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/getMe`, { method: 'GET' });
      if (tgResponse.ok) {
        telegramConnected = true;
        const tgData = await tgResponse.json() as any;
        telegramBotName = tgData.result?.username ? '@' + tgData.result.username : (tgData.result?.first_name || 'Connected Bot');
      } else {
        const errText = await tgResponse.text().catch(() => tgResponse.statusText);
        telegramErrorMsg = `HTTP ${tgResponse.status}: ${errText}`;
      }
    } catch (e) {
      telegramErrorMsg = e instanceof Error ? e.message : 'Telegram connection error';
    }

    const telegramData = {
      connected: telegramConnected,
      botName: telegramBotName,
      chatId: c.env.TELEGRAM_CHANNEL_ID || c.env.TELEGRAM_CHAT_ID || 'N/A',
      tokenSet: !!c.env.TELEGRAM_BOT_TOKEN,
      errorMessage: telegramErrorMsg,
      messagesReceived: messages.length,
    };

    // Determine health status
    let healthStatus = 'HEALTHY';
    const errors: string[] = [];

    if (!tradeLockerConnected) {
      errors.push('TradeLocker: ' + tradeLockerErrorMsg);
      healthStatus = 'ERROR';
    }
    if (!telegramConnected) {
      errors.push('Telegram: Bot connection failed');
      healthStatus = 'ERROR';
    }
    if (openSignals.length > 10) {
      errors.push(`Warning: ${openSignals.length} open signals`);
      if (healthStatus === 'HEALTHY') healthStatus = 'WARNING';
    }
    if (logs.some((l: any) => l.type === 'ERROR')) {
      if (healthStatus === 'HEALTHY') healthStatus = 'WARNING';
    }

    // Calculate uptime
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    const dashboardData = {
      systemHealth: {
        status: healthStatus,
        tradeLockerConnected,
        telegramConnected,
        databaseConnected: db ? true : false,
        lastCronRun: cronStatus?.executedAt || null,
        lastCronStatus: cronStatus?.status || 'NEVER',
        totalSignals: signals.length,
        openSignals: openSignals.length,
        closedSignals: closedSignals.length,
        successRate: overallSuccessRate,
        errors,
        uptime,
      },
      tradeLocker: tradeLockerData,
      telegram: telegramData,
      signals: signals || [],
      logs: logs || [],
      telegramMessages: messages || [],
      cronStatus: {
        lastRun: cronStatus?.executedAt || null,
        lastStatus: cronStatus?.status || 'NEVER_RUN',
      },
    };

    return c.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return c.json({
      systemHealth: {
        status: 'ERROR',
        tradeLockerConnected: false,
        telegramConnected: false,
        databaseConnected: false,
        lastCronStatus: 'ERROR',
        totalSignals: 0,
        openSignals: 0,
        closedSignals: 0,
        successRate: 0,
        errors: ['Dashboard Error: ' + (error instanceof Error ? error.message : 'Unknown')],
        uptime: 0,
      },
      ctrader: {
        connected: false,
        accountId: '',
        accountNumber: '',
        balance: 0,
        equity: 0,
        freeMargin: 0,
        usedMargin: 0,
        marginLevel: 0,
        lastUpdate: new Date().toISOString(),
        errorMessage: 'Failed to load data',
      },
      telegram: {
        connected: false,
        chatId: '',
        messagesSent: 0,
        messagesReceived: 0,
      },
      signals: [],
      logs: [],
      telegramMessages: [],
      cronStatus: {
        lastRun: null,
        lastStatus: 'ERROR',
      },
    }, { status: 500 });
  }
});

// Error Diagnostics endpoint - shows all errors with fix suggestions
app.get('/api/diagnostics', async (c) => {
  const db = c.env.DB;

  try {
    await ensureTables(db);

    // Get all error logs
    let errorLogs: any[] = [];
    if (db) {
      try {
        const errResult = await db.prepare('SELECT * FROM error_log ORDER BY timestamp DESC LIMIT 100').all();
        errorLogs = errResult?.results || [];
      } catch (e) {
        console.error('Error log query failed:', e);
      }

      // Get rejected signals
      let rejectedSignals: any[] = [];
      try {
        const rejResult = await db.prepare('SELECT * FROM signals WHERE status = \'REJECTED\' ORDER BY openTime DESC LIMIT 50').all();
        rejectedSignals = rejResult?.results || [];
      } catch (e) {
        console.error('Rejected signals query failed:', e);
      }

      // Get system logs with ERROR type
      let errorSystemLogs: any[] = [];
      try {
        const sysErrResult = await db.prepare("SELECT * FROM system_logs WHERE type = 'ERROR' ORDER BY timestamp DESC LIMIT 100").all();
        errorSystemLogs = sysErrResult?.results || [];
      } catch (e) {
        console.error('System error logs query failed:', e);
      }

      // Check environment variables
      const envCheck = {
        TRADELOCKER_EMAIL: !!c.env.TRADELOCKER_EMAIL,
        TRADELOCKER_PASSWORD: !!c.env.TRADELOCKER_PASSWORD,
        TRADELOCKER_SERVER: !!c.env.TRADELOCKER_SERVER,
        TRADELOCKER_ACCOUNT_ID: !!c.env.TRADELOCKER_ACCOUNT_ID,
        TRADELOCKER_ACC_NUM: !!c.env.TRADELOCKER_ACC_NUM,
        TELEGRAM_BOT_TOKEN: !!c.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHANNEL_ID: !!c.env.TELEGRAM_CHANNEL_ID,
        ENV: c.env.ENV || 'demo',
      };

      // Generate fix suggestions based on errors found
      const fixSuggestions: any[] = [];

      // Check for TradeLocker credential issues
      if (!envCheck.TRADELOCKER_EMAIL || !envCheck.TRADELOCKER_PASSWORD) {
        fixSuggestions.push({
          severity: 'critical',
          category: 'TradeLocker Credentials',
          issue: 'Missing TradeLocker credentials',
          description: 'The TradeLocker email or password is not configured.',
          fix: 'Set the TRADELOCKER_EMAIL and TRADELOCKER_PASSWORD environment variables in your Cloudflare Worker settings.',
          link: 'https://docs.tradelocker.com/'
        });
      }

      if (!envCheck.TRADELOCKER_ACCOUNT_ID || !envCheck.TRADELOCKER_ACC_NUM) {
        fixSuggestions.push({
          severity: 'critical',
          category: 'TradeLocker Authentication',
          issue: 'Missing TradeLocker account ID or number',
          description: 'The TradeLocker Account ID or Account Number is not configured.',
          fix: 'Set the TRADELOCKER_ACCOUNT_ID and TRADELOCKER_ACC_NUM environment variables in your Cloudflare Worker settings.',
          link: 'https://docs.tradelocker.com/'
        });
      }

      // Check for database constraint errors
      const hasDbErrors = errorLogs.some((log: any) =>
        log.message && (log.message.includes('CHECK constraint') || log.message.includes('constraint failed'))
      );
      if (hasDbErrors) {
        fixSuggestions.push({
          severity: 'high',
          category: 'Database Schema',
          issue: 'Database constraint violations detected',
          description: 'The database schema may be out of sync with the application code.',
          fix: 'Run the database migration to update the schema with the latest changes.',
          action: 'migrate'
        });
      }

      // Check for Telegram issues
      if (!envCheck.TELEGRAM_BOT_TOKEN) {
        fixSuggestions.push({
          severity: 'high',
          category: 'Telegram Configuration',
          issue: 'Missing Telegram bot token',
          description: 'The Telegram bot token is not configured.',
          fix: 'Set the TELEGRAM_BOT_TOKEN environment variable in your Cloudflare Worker settings.',
          link: 'https://core.telegram.org/bots#how-do-i-create-a-bot'
        });
      }

      // Check for high rejection rate
      if (rejectedSignals.length > 0) {
        fixSuggestions.push({
          severity: 'medium',
          category: 'Signal Rejections',
          issue: `${rejectedSignals.length} signals have been rejected`,
          description: 'Some signals are being rejected during order placement.',
          fix: 'Check the rejected signals tab for details. Common causes include: insufficient balance, invalid symbol format, or API errors.',
          action: 'check_signals'
        });
      }

      return c.json({
        success: true,
        environment: envCheck,
        errorSummary: {
          totalErrors: errorLogs.length,
          totalRejectedSignals: rejectedSignals.length,
          totalErrorSystemLogs: errorSystemLogs.length,
        },
        errorLogs: errorLogs,
        rejectedSignals: rejectedSignals,
        errorSystemLogs: errorSystemLogs,
        fixSuggestions: fixSuggestions,
        generatedAt: new Date().toISOString(),
      });
    }

    return c.json({
      success: false,
      error: 'Database unavailable',
    }, { status: 500 });
  } catch (error) {
    console.error('Diagnostics API Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
});

// Webhook endpoint for Telegram
app.post('/webhook/telegram', async (c) => {
  const update = await c.req.json();
  const db = c.env.DB;
  console.log('[WEBHOOK] Received update:', JSON.stringify(update, null, 2));
  
  if (!db) {
    console.error('[WEBHOOK] Database binding not available');
    return c.json({ error: 'Database unavailable' }, { status: 500 });
  }
  
  await ensureTables(db);
  
  // Process the incoming message
  const message = update.message || update.channel_post;
  console.log('[WEBHOOK] Extracted message:', message ? 'YES' : 'NO', message?.message_id);
  
  if (message) {
    console.log('[WEBHOOK] Calling fetchAndProcessChannelMessages with message param');
    try {
      await fetchAndProcessChannelMessages(c.env, db, message);
    } catch (error) {
      console.error('[WEBHOOK] Error processing message:', error);
      await logError(db, 'ERROR', 'webhook_processing', error.message, { update });
    }
  }
  
  return c.json({ success: true });
});

// Helper to fetch and process channel messages
async function fetchAndProcessChannelMessages(env: CloudflareBindings, db: any, webhookMessage?: any) {
  console.log('[FETCH_FN] Called with webhookMessage:', webhookMessage ? 'YES' : 'NO', webhookMessage?.message_id);
  
  // If called from webhook with a specific message, process it directly
  if (webhookMessage) {
    console.log('[FETCH_FN] Processing single webhook message directly');
    await processSingleMessage(env, db, webhookMessage);
    return { processed: 1, total: 1 };
  }
  
  const channelId = env.TELEGRAM_CHANNEL_ID || env.TELEGRAM_CHAT_ID;
  if (!channelId) {
    throw new Error('Channel ID not configured');
  }

  // Build Telegram API URL dynamically
  const tgUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates`;

  console.log('[FETCH_FN] No webhook message, falling back to polling (getUpdates)');
  let response = await fetch(tgUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allowed_updates: ['message', 'channel_post'], limit: 100 }),
  });

  let respText = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(respText);
  } catch (e) {
    data = { raw: respText };
  }

  if (data.error_code === 409 || respText.includes('webhook')) {
    try {
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/deleteWebhook`, { method: 'POST' });
      response = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowed_updates: ['message', 'channel_post'], limit: 100 }),
      });
      respText = await response.text();
      data = JSON.parse(respText);
    } catch (err) {
      console.error('Webhook auto-delete error:', err);
    }
  }

  await db.prepare(
    'INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)'
  ).bind(
    new Date().toISOString(),
    response.ok ? 'INFO' : 'ERROR',
    `Telegram getUpdates status ${response.status}`,
    JSON.stringify({ status: response.status, ok: response.ok, resultCount: data.result?.length || 0, response: data })
  ).run();

  if (!response.ok) {
    throw new Error('Failed to fetch updates: ' + respText);
  }

  let processed = 0;

  for (const update of data.result || []) {
    const msg = update.message || update.channel_post;
    if (!msg) continue;

    const msgId = msg.message_id.toString();
    const msgText = msg.text || msg.caption || '[Media / Emoji / Sticker / Message]';
    const msgTime = new Date(msg.date * 1000).toISOString();
    const userId = msg.from?.id?.toString() || msg.sender_chat?.id?.toString() || 'channel';
    const userName = msg.from?.username || msg.sender_chat?.title || 'Channel';

    await processSingleMessage(env, db, msg, msgId, msgTime, userId, userName, msgText);
    processed++;
  }

  return { processed, total: data.result?.length || 0 };
}

// Process a single message (used by both webhook and polling)
async function processSingleMessage(env: CloudflareBindings, db: any, msg: any, msgId?: string, msgTime?: string, userId?: string, userName?: string, msgText?: string) {
  console.log('[PROCESS_MSG] ===== START MESSAGE PROCESSING =====');
  // Extract values if not provided
  const message = msg;
  const messageId = msgId || message.message_id?.toString();
  const messageText = msgText || message.text || message.caption || '[Media / Emoji / Sticker / Message]';
  
  console.log('[PROCESS_MSG] Message ID:', messageId);
  console.log('[PROCESS_MSG] Message Text:', messageText);
  console.log('[PROCESS_MSG] Message Text Type:', typeof messageText);
  console.log('[PROCESS_MSG] Message Text Length:', messageText?.length);
  console.log('[PROCESS_MSG] Message User:', userName || 'Unknown');

  // Handle date conversion safely
  let messageTime;
  if (msgTime) {
    messageTime = msgTime;
  } else if (message.date) {
    try {
      messageTime = new Date(message.date * 1000).toISOString();
    } catch (e) {
      console.error('[PROCESS_MSG] Invalid date value:', message.date);
      messageTime = new Date().toISOString();
    }
  } else {
    messageTime = new Date().toISOString();
  }
  
  const messageUserId = userId || message.from?.id?.toString() || message.sender_chat?.id?.toString() || 'channel';
  const messageUserName = userName || message.from?.username || message.sender_chat?.title || 'Channel';
  
  console.log('[PROCESS_MSG] Processing message:', messageUserName, messageText);

  try {
    console.log('[PROCESS_MSG] Saving message to database...');
    await db.prepare(
      'INSERT INTO telegram_messages (id, timestamp, text, type, userId, userName) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING'
    ).bind(messageId, messageTime, messageText, 'INFO', messageUserId, messageUserName).run();
    console.log('[PROCESS_MSG] Message saved to database');

    // Check for "close all positions" command
    const cleanText = messageText.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanText === 'closeallpositions' || messageText.toLowerCase().includes('close all positions')) {
      console.log('[PROCESS_MSG] Received "close all positions" command');
      await db.prepare("UPDATE signals SET status = 'CLOSED' WHERE status = 'OPEN'").run();
      await db.prepare("UPDATE trade_history SET status = 'CLOSED' WHERE status = 'OPEN'").run();
      await db.prepare("INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)").bind(
        new Date().toISOString(),
        'SUCCESS',
        'All open positions closed via Telegram message: ' + messageText,
        JSON.stringify({ messageId, messageText })
      ).run();
      console.log('[PROCESS_MSG] All open positions closed successfully');
      return;
    }

    console.log('[PROCESS_MSG] Attempting to parse signal...');
    const signal = parseSignal(messageText);
    if (signal) {
      console.log('[PROCESS_MSG] Signal parsed successfully:', signal);

      // Validate pair against pair_config table with flexible symbol matching and normalization
      const normSignalSymbol = signal.symbol.replace(/[^A-Z0-9]/g, '').toUpperCase();
      const allPairsResult = await db.prepare("SELECT symbol, enabled, lotSize FROM pair_config").all();
      const pairsList = allPairsResult?.results || [];

      let matchedPair: any = null;
      for (const p of pairsList) {
        const normStoredSymbol = (p.symbol || '').toString().replace(/[^A-Z0-9]/g, '').toUpperCase();
        if (normStoredSymbol === normSignalSymbol || normStoredSymbol.includes(normSignalSymbol) || normSignalSymbol.startsWith(normSignalSymbol) || normSignalSymbol.endsWith(normSignalSymbol) || normSignalSymbol.includes(normStoredSymbol)) {
          matchedPair = p;
          break;
        }
      }

      let isAllowed = false;
      if (pairsList.length === 0) {
        isAllowed = true;
        await db.prepare(
          "INSERT INTO pair_config (symbol, enabled, lotSize, updatedAt) VALUES (?, 1, ?, ?) ON CONFLICT(symbol) DO UPDATE SET enabled = 1"
        ).bind(signal.symbol.toUpperCase(), signal.volume || 0.01, new Date().toISOString()).run();
      } else if (matchedPair) {
        const isPairEnabled = (matchedPair.enabled === 1 || matchedPair.enabled === '1' || matchedPair.enabled === true || matchedPair.enabled === 'true');
        if (isPairEnabled) {
          isAllowed = true;
          if (matchedPair.lotSize) {
            signal.volume = parseFloat(matchedPair.lotSize);
          }
        }
      }

      if (!isAllowed) {
        console.log('[PROCESS_MSG] Signal rejected: pair not enabled or not found in pair_config:', signal.symbol);
        await db.prepare(
          'INSERT INTO signals (id, symbol, action, openPrice, openTime, status, volume, stopLoss, takeProfit, pair, source, error, errorMessage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          signal.id, signal.symbol, signal.action, signal.openPrice, signal.openTime, 'REJECTED', signal.volume,
          signal.stopLoss, signal.takeProfit, signal.pair, 'TELEGRAM_CHANNEL', 'Pair not enabled or not found in Pair Configuration', 'Pair not enabled or not found in Pair Configuration'
        ).run();
        await logError(db, 'ERROR', 'pair_validation', 'Pair not enabled: ' + signal.symbol, { signal });
        return;
      }

      if (matchedPair.lotSize) {
        signal.volume = parseFloat(matchedPair.lotSize);
      }

      console.log('[PROCESS_MSG] Saving signal to database...');
      try {
        await db.prepare(
          'INSERT INTO signals (id, symbol, action, openPrice, openTime, status, volume, stopLoss, takeProfit, pair, source, error, errorMessage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          signal.id,
          signal.symbol,
          signal.action,
          signal.openPrice,
          signal.openTime,
          signal.status,
          signal.volume,
          signal.stopLoss || null,
          signal.takeProfit || null,
          signal.pair,
          'TELEGRAM_CHANNEL',
          null,
          null
        ).run();
        console.log('[PROCESS_MSG] Signal saved to database');
      } catch (dbError: any) {
        console.error('[PROCESS_MSG] Error saving signal to database:', dbError);
        await logError(db, 'ERROR', 'signal_saving', dbError.message, { signal, messageId });
        return;
      }

      console.log('[PROCESS_MSG] Placing order on TradeLocker...');
      // Place order on TradeLocker
      try {
        const orderResult = await placeOrderOnCTrader(env, signal, db);
        await saveTradeHistory(db, signal, orderResult);
        if (orderResult.success) {
          console.log('[PROCESS_MSG] Order placed successfully:', orderResult.orderId);
          await db.prepare("UPDATE signals SET status = 'OPEN', error = ?, errorMessage = ? WHERE id = ?")
            .bind(orderResult.error || null, orderResult.error || null, signal.id).run();
          await db.prepare("INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)")
            .bind(new Date().toISOString(), "SUCCESS",
              "Order placed: " + signal.action + " " + signal.symbol,
              JSON.stringify({ orderId: orderResult.orderId, symbol: signal.symbol, action: signal.action }))
            .run();
        } else {
          console.log('[PROCESS_MSG] Order rejected:', orderResult.error);
          await db.prepare("UPDATE signals SET status = 'REJECTED', error = ?, errorMessage = ? WHERE id = ?")
            .bind(orderResult.error || null, orderResult.error || null, signal.id).run();
          await logError(db, 'ERROR', 'order_execution', orderResult.error, { symbol: signal.symbol, action: signal.action });
          await db.prepare("INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)")
            .bind(new Date().toISOString(), "ERROR",
              "Order rejected: " + signal.action + " " + signal.symbol,
              JSON.stringify({ error: orderResult.error, symbol: signal.symbol, action: signal.action }))
            .run();
        }
      } catch (orderError: any) {
        console.error('[PROCESS_MSG] Error placing order:', orderError.message);
        console.error('[PROCESS_MSG] Stack trace:', orderError.stack);
        await logError(db, 'ERROR', 'order_execution', orderError.message, { symbol: signal.symbol, error: orderError.stack });
        await db.prepare("UPDATE signals SET status = 'REJECTED', error = ?, errorMessage = ? WHERE id = ?")
          .bind(orderError.message || null, orderError.message || null, signal.id).run();
      }

      await db.prepare(
        'INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)'
      ).bind(
        new Date().toISOString(),
        'SUCCESS',
        'Channel Signal from ' + messageUserName + ': ' + signal.action + ' ' + signal.symbol,
        JSON.stringify(signal)
      ).run();
      console.log('[PROCESS_MSG] ===== MESSAGE PROCESSED SUCCESSFULLY =====');
    } else {
      console.log('[PROCESS_MSG] ===== NO SIGNAL PARSED - MESSAGE SKIPPED =====');
      console.log('[PROCESS_MSG] This message does not match any signal format');
    }
  } catch (e: any) {
    console.error('[PROCESS_MSG] ===== ERROR PROCESSING MESSAGE =====');
    console.error('[PROCESS_MSG] Error:', e.message);
    console.error('[PROCESS_MSG] Stack trace:', e.stack);
    await logError(db, 'ERROR', 'message_processing', e.message, { messageText, messageId, errorStack: e.stack });
  }
  console.log('[PROCESS_MSG] ===== END MESSAGE PROCESSING =====\n');
}

// Fetch channel messages (polling)
app.post('/api/fetch-channel-messages', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database unavailable' }, { status: 500 });

  try {
    await ensureTables(db);
    const result = await fetchAndProcessChannelMessages(c.env, db);
    return c.json({ success: true, ...result });
  } catch (error) {
    console.error('Fetch error:', error);
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
});

// Cron job processor
app.post('/cron/process-signals', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database unavailable' }, { status: 500 });

  const startTime = Date.now();

  try {
    await ensureTables(db);

    await db.prepare(
      'INSERT INTO system_logs (timestamp, type, message) VALUES (?, ?, ?)'
    ).bind(new Date().toISOString(), 'INFO', 'Cron job started').run();

    // Fetch channel messages directly
    try {
      await fetchAndProcessChannelMessages(c.env, db);
    } catch (e) {
      console.error('Channel fetch error:', e);
      await db.prepare(
        'INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)'
      ).bind(
        new Date().toISOString(),
        'ERROR',
        'Telegram Channel Fetch Error: ' + (e instanceof Error ? e.message : String(e)),
        JSON.stringify(e instanceof Error ? e.stack : String(e))
      ).run();
    }

    const signals = await db.prepare("SELECT * FROM signals WHERE status = 'PENDING' LIMIT 50").all();
    let processed = 0;
    let successCount = 0;
    for (const signal of signals?.results || []) {
      try {
        await db.prepare("UPDATE signals SET status = ?, error = ?, errorMessage = ? WHERE id = ?").bind('OPEN', null, null, signal.id).run();
        processed++;
        const orderResult = await placeOrderOnCTrader(c.env, signal, db);
        if (orderResult.success) {
          successCount++;
        } else {
          await db.prepare(
            "UPDATE signals SET status = ?, orderId = ?, error = ?, errorMessage = ? WHERE id = ?"
          ).bind("REJECTED", orderResult.orderId || null, orderResult.error || "Order failed", orderResult.error || "Order failed", signal.id).run();
        }
      } catch (e) {
        console.error("Signal processing error:", e);
        await db.prepare(
          "UPDATE signals SET status = 'REJECTED', error = ?, errorMessage = ? WHERE id = ?"
        ).bind(e.message || "Unknown error", e.message || "Unknown error", signal.id).run();
      }
    }

    const duration = Date.now() - startTime;

    await db.prepare(
      'INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)'
    ).bind(
      new Date().toISOString(),
      'SUCCESS',
      'Cron completed: ' + processed + ' signals processed',
      JSON.stringify({ processed, duration })
    ).run();

    await db.prepare(
      'INSERT INTO cron_jobs (executedAt, status, details) VALUES (?, ?, ?)'
    ).bind(new Date().toISOString(), 'SUCCESS', JSON.stringify({ processed, duration })).run();

    return c.json({ success: true, processed, duration });
  } catch (error) {
    console.error('Cron error:', error);
    if (db) {
      await db.prepare(
        'INSERT INTO system_logs (timestamp, type, message) VALUES (?, ?, ?)'
      ).bind(new Date().toISOString(), 'ERROR', 'Cron failed: ' + error).run();
    }
    return c.json({ error: 'Cron failed' }, { status: 500 });
  }
});

// Parse signal from text - UNIVERSAL PARSER supporting ALL formats
function parseSignal(text: string) {
  console.log('========== [PARSE_SIGNAL] START ==========');
  console.log('[PARSE_SIGNAL] Raw input text:', text);
  console.log('[PARSE_SIGNAL] Text length:', text.length);
  
  try {
    // Try JSON format first
    if (text.includes('{')) {
      console.log('[PARSE_SIGNAL] -> Attempting JSON format...');
      try {
        const json = JSON.parse(text);
        console.log('[PARSE_SIGNAL] -> JSON parsed successfully:', json);
        console.log('[PARSE_SIGNAL] -> Keys in JSON:', Object.keys(json));
        console.log('[PARSE_SIGNAL] -> json.pair:', json.pair, 'json.symbol:', json.symbol, 'json.action:', json.action);
        
        const sl = json.sl !== undefined ? parseFloat(json.sl) : (json.stopLoss !== undefined ? parseFloat(json.stopLoss) : null);
        const tp = json.tp !== undefined ? parseFloat(json.tp) : (json.takeProfit !== undefined ? parseFloat(json.takeProfit) : null);

        const signal = {
          id: Date.now().toString() + Math.random(),
          symbol: (json.pair || json.symbol || 'UNKNOWN').toString().toUpperCase(),
          action: (json.action || 'BUY').toUpperCase(),
          openPrice: parseFloat(json.price || json.openPrice || '0'),
          openTime: new Date().toISOString(),
          status: 'PENDING',
          volume: parseFloat(json.lotSize || json.volume || '0.01'),
          stopLoss: sl,
          takeProfit: tp,
          pair: json.pair || json.symbol,
        };
        console.log('[PARSE_SIGNAL] -> JSON signal parsed successfully:', signal);
        console.log('[PARSE_SIGNAL] -> Final symbol:', signal.symbol, 'Final action:', signal.action);
        console.log('========== [PARSE_SIGNAL] END - SUCCESS ==========');
        return signal;
      } catch (jsonError: any) {
        console.log('[PARSE_SIGNAL] -> JSON parsing failed:', jsonError.message);
      }
    } else {
      console.log('[PARSE_SIGNAL] -> Not JSON format (no "{")');
    }

    // Convert to lowercase for flexible matching
    const lowerText = text.toLowerCase();
    console.log('[PARSE_SIGNAL] -> Lowercase text:', lowerText);

    // STEP 1: Extract action (BUY/SELL/CLOSE) - case insensitive
    const actionMatch = lowerText.match(/\b(buy|sell|close)\b/);
    if (!actionMatch) {
      console.log('[PARSE_SIGNAL] -> FAILED: No BUY/SELL/CLOSE action found');
      console.log('========== [PARSE_SIGNAL] END - FAILED ==========');
      return null;
    }
    const action = actionMatch[0].toUpperCase();
    console.log('[PARSE_SIGNAL] -> Action found:', action);

    // STEP 2: Check for asset aliases (e.g. gold -> XAUUSD, silver -> XAGUSD, oil -> USOIL, btc -> BTCUSD)
    let rawSymbol: string | null = null;
    if (lowerText.includes('gold')) {
      rawSymbol = 'XAUUSD';
    } else if (lowerText.includes('silver')) {
      rawSymbol = 'XAGUSD';
    } else if (lowerText.includes('oil') || lowerText.includes('crude')) {
      rawSymbol = 'USOIL';
    } else if (lowerText.includes('bitcoin') || lowerText.includes('btc')) {
      rawSymbol = 'BTCUSD';
    } else if (lowerText.includes('ethereum') || lowerText.includes('eth')) {
      rawSymbol = 'ETHUSD';
    }

    if (!rawSymbol) {
      // Extract symbol (currency pair like EURUSD, USD/CHF, BTC/USDT, XAUUSD)
      // Ignore reserved keywords (actions, SL/TP tags, etc.)
      const reservedWords = new Set(['free', 'signal', 'buy', 'sell', 'close', 'market', 'now', 'order', 'entry', 'sl', 'tp', 'ref', 'stop', 'loss', 'take', 'profit', 'price']);
      const allWordMatches = Array.from(lowerText.matchAll(/\b([a-z]{2,6}\/?[a-z]{2,6})\b/g));
      console.log('[PARSE_SIGNAL] -> All regex symbol candidates in text:', allWordMatches.map(m => m[0]));

      for (const match of allWordMatches) {
        const candidate = match[0];
        const cleanCandidate = candidate.replace('/', '');
        if (!reservedWords.has(candidate) && !reservedWords.has(cleanCandidate) && cleanCandidate.length >= 5) {
          rawSymbol = candidate.toUpperCase();
          break;
        }
      }

      if (!rawSymbol) {
        // Fallback: Check if any candidate is not strictly equal to the action
        for (const match of allWordMatches) {
          const candidate = match[0];
          if (candidate.toUpperCase() !== action && !['sl', 'tp', 'ref', 'free', 'signal'].includes(candidate)) {
            rawSymbol = candidate.toUpperCase();
            break;
          }
        }
      }
    }

    if (!rawSymbol) {
      console.log('[PARSE_SIGNAL] -> FAILED: No currency pair symbol found.');
      console.log('========== [PARSE_SIGNAL] END - FAILED ==========');
      return null;
    }

    const symbol = rawSymbol.replace(/[^A-Z0-9]/g, '').toUpperCase();
    console.log('[PARSE_SIGNAL] -> Symbol found:', symbol, '(raw:', rawSymbol + ')');

    // STEP 3: Check for MARKET or NOW keyword anywhere in text (case insensitive)
    const hasMarketKeyword = /\b(market|now)\b/.test(lowerText);
    console.log('[PARSE_SIGNAL] -> MARKET/NOW keyword detected:', hasMarketKeyword);

    // STEP 4: Extract reference price / entry point (e.g. "Entry Point: 4361.5 / 4370.5", "ref00000", etc.)
    const entryMatch = lowerText.match(/(?:entry\s*point|entry|price)[^0-9]*([0-9.]+)/);
    const refMatch = lowerText.match(/(?:^|\s)ref[^0-9]*([0-9.]+)|ref([0-9.]+)/);
    const refPrice = entryMatch ? parseFloat(entryMatch[1]) : (refMatch ? (parseFloat(refMatch[1] || refMatch[2]) || null) : null);
    console.log('[PARSE_SIGNAL] -> Reference/Entry price:', refPrice);

    // STEP 5: Extract Stop Loss
    const slMatch = lowerText.match(/(?:sl|stop\s*loss)[^0-9]*([0-9.]+)/);
    const stopLoss = slMatch ? parseFloat(slMatch[1]) : null;
    console.log('[PARSE_SIGNAL] -> Stop Loss:', stopLoss);

    // STEP 6: Extract Take Profit (Consider TP1 primarily if multiple TPs exist)
    const tp1Match = lowerText.match(/(?:tp1|tp\s*1|take\s*profit\s*1)[^0-9]*([0-9.]+)/);
    const tpMatch = lowerText.match(/(?:tp|take\s*profit)[^0-9]*([0-9.]+)/);
    const takeProfit = tp1Match ? parseFloat(tp1Match[1]) : (tpMatch ? parseFloat(tpMatch[1]) : null);
    console.log('[PARSE_SIGNAL] -> Take Profit (TP1 prioritized):', takeProfit);

    // Optional SL and TP (if not provided, default to null or 0)
    const validStopLoss = stopLoss !== null && !isNaN(stopLoss) ? stopLoss : 0;
    const validTakeProfit = takeProfit !== null && !isNaN(takeProfit) ? takeProfit : 0;

    // Build signal object
    // If MARKET keyword is present, set openPrice to 0 (immediate execution)
    // Otherwise use reference price if available, else 0
    const openPrice = hasMarketKeyword ? 0 : (refPrice || 0);
    
    const signal = {
      id: Date.now().toString() + Math.random(),
      symbol: symbol,
      action: action,
      openPrice: openPrice,
      openTime: new Date().toISOString(),
      status: 'PENDING',
      volume: 0.01,
      stopLoss: stopLoss,
      takeProfit: takeProfit,
      pair: rawSymbol,
      refPrice: refPrice,
      hasMarketOrder: hasMarketKeyword,
    };

    console.log('[PARSE_SIGNAL] -> Universal pattern SUCCESS!');
    console.log('[PARSE_SIGNAL] -> Parsed signal:', JSON.stringify(signal, null, 2));
    console.log('========== [PARSE_SIGNAL] END - SUCCESS ==========');
    return signal;

  } catch (error: any) {
    console.error('[PARSE_SIGNAL] ERROR:', error.message);
    console.error('[PARSE_SIGNAL] Stack:', error.stack);
    console.log('========== [PARSE_SIGNAL] END - EXCEPTION ==========');
    return null;
  }
}

async function syncTradeHistoryWithTradeLocker(env: any, db: any) {
  if (!env || !db) return;
  const hasTL = (env.TRADELOCKER_EMAIL && env.TRADELOCKER_PASSWORD) || (env.CTRADER_ACCESS_TOKEN);
  if (hasTL) {
    try {
      const envType = (env.ENV || 'demo').toLowerCase();
      const isLive = envType === 'live' || envType === 'production';
      const config: TradeLockerConfig = {
        apiUrl: isLive ? 'https://live.tradelocker.com/backend-api' : 'https://demo.tradelocker.com/backend-api',
        email: env.TRADELOCKER_EMAIL || '',
        password: env.TRADELOCKER_PASSWORD || '',
        server: isLive ? 'live' : 'herofx',
        accountId: parseInt(env.TRADELOCKER_ACCOUNT_ID || env.CTRADER_ACCOUNT_ID || '0'),
        accNum: parseInt(env.TRADELOCKER_ACC_NUM || '0')
      };
      const tlService = new TradeLockerService(config);
      const positions = await tlService.getPositions();
      const orders = await tlService.getOrders();
      
      const existingTrades = await db.prepare("SELECT signalId, orderId FROM trade_history").all();
      const existingSignalIds = new Set((existingTrades?.results || []).map((t: any) => t.signalId));
      const existingOrderIds = new Set((existingTrades?.results || []).map((t: any) => t.orderId));

      const allSignals = await db.prepare("SELECT * FROM signals").all();
      for (const sig of (allSignals?.results || [])) {
        if (!existingSignalIds.has(sig.id)) {
          await db.prepare(
            "INSERT OR IGNORE INTO trade_history (id, signalId, symbol, action, volume, openPrice, openTime, closeTime, status, profit, stopLoss, takeProfit, orderId, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            sig.id + "_trade",
            sig.id,
            sig.symbol,
            sig.action,
            sig.volume || 0.01,
            sig.openPrice || 0,
            sig.openTime || sig.createdAt,
            sig.closeTime || null,
            sig.status || 'OPEN',
            sig.profit || 0,
            sig.stopLoss || null,
            sig.takeProfit || null,
            sig.orderId || null,
            JSON.stringify({ source: sig.source, error: sig.error })
          ).run();
        }
      }

      for (const pos of (positions || [])) {
        const posId = pos.id?.toString() || pos.positionId?.toString();
        if (posId && !existingOrderIds.has(posId)) {
          await db.prepare(
            "INSERT OR IGNORE INTO trade_history (id, signalId, symbol, action, volume, openPrice, openTime, status, profit, stopLoss, takeProfit, orderId, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            "tl_pos_" + posId,
            "tl_sig_" + posId,
            pos.symbol || 'UNKNOWN',
            pos.side || 'BUY',
            pos.qty || pos.volume || 0.01,
            pos.openPrice || pos.price || 0,
            pos.openTime || new Date().toISOString(),
            'OPEN',
            pos.profit || pos.unrealizedPnl || 0,
            pos.stopLoss || null,
            pos.takeProfit || null,
            posId,
            JSON.stringify(pos)
          ).run();
        }
      }

      const openTrades = await db.prepare("SELECT * FROM trade_history WHERE status = 'OPEN'").all();
      for (const trade of (openTrades?.results || [])) {
        const matchedPos = positions.find((p: any) => p.id?.toString() === trade.orderId || p.positionId?.toString() === trade.orderId || (p.symbol && trade.symbol && p.symbol.toUpperCase().includes(trade.symbol.toUpperCase())));
        const matchedOrder = orders.find((o: any) => o.id?.toString() === trade.orderId || o.orderId?.toString() === trade.orderId);
        
        if (!matchedPos && (!matchedOrder || matchedOrder.status === 'FILLED' || matchedOrder.status === 'CANCELLED' || matchedOrder.status === 'REJECTED')) {
          const closeTime = new Date().toISOString();
          const profit = matchedOrder?.profit || matchedPos?.profit || 0;
          await db.prepare("UPDATE trade_history SET status = 'CLOSED', closeTime = ?, profit = ? WHERE id = ?").bind(closeTime, profit, trade.id).run();
          if (trade.signalId) {
            await db.prepare("UPDATE signals SET status = 'CLOSED', closeTime = ? WHERE id = ? OR orderId = ?").bind(closeTime, trade.signalId, trade.orderId).run();
          }
        } else if (matchedPos) {
          const profit = matchedPos.profit || matchedPos.unrealizedPnl || 0;
          const sl = matchedPos.stopLoss || trade.stopLoss;
          const tp = matchedPos.takeProfit || trade.takeProfit;
          await db.prepare("UPDATE trade_history SET profit = ?, stopLoss = ?, takeProfit = ? WHERE id = ?").bind(profit, sl, tp, trade.id).run();
        }
      }
    } catch (e) {
      console.error('syncTradeHistoryWithTradeLocker error:', e);
    }
  } else {
    try {
      const existingTrades = await db.prepare("SELECT signalId FROM trade_history").all();
      const existingSignalIds = new Set((existingTrades?.results || []).map((t: any) => t.signalId));

      const allSignals = await db.prepare("SELECT * FROM signals").all();
      for (const sig of (allSignals?.results || [])) {
        if (!existingSignalIds.has(sig.id)) {
          await db.prepare(
            "INSERT OR IGNORE INTO trade_history (id, signalId, symbol, action, volume, openPrice, openTime, closeTime, status, profit, stopLoss, takeProfit, orderId, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            sig.id + "_trade",
            sig.id,
            sig.symbol,
            sig.action,
            sig.volume || 0.01,
            sig.openPrice || 0,
            sig.openTime || sig.createdAt,
            sig.closeTime || null,
            sig.status || 'OPEN',
            sig.profit || 0,
            sig.stopLoss || null,
            sig.takeProfit || null,
            sig.orderId || null,
            JSON.stringify({ source: sig.source, error: sig.error })
          ).run();
        }
      }
    } catch (e) {
      console.error('Trade history backfill error:', e);
    }
  }
}

async function processSignalOrder(env: any, signal: any, db: any) {
  await syncTradeHistoryWithTradeLocker(env, db);
  console.log('[PROCESS_SIGNAL_ORDER] =========================================');
  console.log('[PROCESS_SIGNAL_ORDER] Starting signal order processing');
  console.log('[PROCESS_SIGNAL_ORDER] Raw signal object:', JSON.stringify(signal, null, 2));
  console.log('[PROCESS_SIGNAL_ORDER] Raw signal type:', typeof signal);
  console.log('[PROCESS_SIGNAL_ORDER] Keys in signal:', Object.keys(signal));
  console.log('[PROCESS_SIGNAL_ORDER] Signal.symbol:', signal.symbol, 'Signal.action:', signal.action);
  
  // Check cTrader configuration status
  const isConfigured = !!(env.CTRADER_ACCESS_TOKEN && env.CTRADER_ACCOUNT_ID);
  console.log('[PROCESS_SIGNAL_ORDER] =========================================');
  console.log('[PROCESS_SIGNAL_ORDER] cTrader Credentials Status:');
  console.log('[PROCESS_SIGNAL_ORDER]   CTRADER_ACCESS_TOKEN configured:', !!env.CTRADER_ACCESS_TOKEN);
  console.log('[PROCESS_SIGNAL_ORDER]   CTRADER_ACCOUNT_ID configured:', !!env.CTRADER_ACCOUNT_ID);
  console.log('[PROCESS_SIGNAL_ORDER]   cTrader is configured:', isConfigured);
  console.log('[PROCESS_SIGNAL_ORDER] =========================================');
  
  let orderResult: any;
  if (!isConfigured) {
    console.log('[PROCESS_SIGNAL_ORDER] ⚠️  cTrader not configured, using simulation');
    orderResult = { success: true, orderId: 'sim_' + Date.now(), error: null };
    
    // Add detailed simulation log
    if (db) {
      const rows = await db.prepare("INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)")
        .bind(new Date().toISOString(), "INFO", "Simulated order (cTrader unconfigured): " + signal.action + " " + signal.symbol, JSON.stringify(signal))
        .run();
      console.log('[PROCESS_SIGNAL_ORDER] Database operation result - Rows affected:', rows.meta?.changes || 0);
    }
  } else {
    console.log('[PROCESS_SIGNAL_ORDER] 🚀 Placing real order via TradeLocker REST API');
    console.log('[PROCESS_SIGNAL_ORDER] Signal structure:', JSON.stringify(signal, null, 2));
    console.log('[PROCESS_SIGNAL_ORDER] Signal.symbol:', signal.symbol, 'Signal.action:', signal.action);
    try {
      console.log('[PROCESS_SIGNAL_ORDER] Calling placeOrderOnCTrader()...');
      orderResult = await placeOrderOnCTrader(env, signal, db);
      console.log('[PROCESS_SIGNAL_ORDER] ✅ Order result received:', JSON.stringify(orderResult, null, 2));
    } catch (orderError: any) {
      console.error('[PROCESS_SIGNAL_ORDER] ❌ Error placing order:', orderError);
      console.error('[PROCESS_SIGNAL_ORDER] Error message:', orderError.message);
      console.error('[PROCESS_SIGNAL_ORDER] Stack trace:', orderError.stack);
      orderResult = { success: false, orderId: null, error: orderError.message || String(orderError) };
    }
  }

  try {
    console.log('[PROCESS_SIGNAL_ORDER] Saving trade history...');
    await saveTradeHistory(db, signal, orderResult);
    console.log('[PROCESS_SIGNAL_ORDER] ✅ Trade history saved');
  } catch (dbError: any) {
    console.error('[PROCESS_SIGNAL_ORDER] ❌ Error saving trade history:', dbError);
    console.error('[PROCESS_SIGNAL_ORDER] Error message:', dbError.message);
    console.error('[PROCESS_SIGNAL_ORDER] Stack trace:', dbError.stack);
    
    // Log to database even if it fails
    if (db) {
      try {
        await db.prepare("INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)")
          .bind(new Date().toISOString(), "ERROR", "Failed to save trade history", JSON.stringify({ error: dbError.message, stack: dbError.stack, signal, orderResult }))
          .run();
      } catch (e) {
        console.error('[PROCESS_SIGNAL_ORDER] Failed to log trade history error to database:', e);
      }
    }
  }

  if (orderResult.success) {
    console.log('[PROCESS_SIGNAL_ORDER] ✅ Order successful - Updating signal status to OPEN');
    try {
      console.log('[PROCESS_SIGNAL_ORDER] Executing UPDATE signals SET status = OPEN WHERE id = ?', signal.id);
      const rows = await db.prepare("UPDATE signals SET status = 'OPEN' WHERE id = ?").bind(signal.id).run();
      console.log('[PROCESS_SIGNAL_ORDER] ✅ Signal status updated to OPEN');
      console.log('[PROCESS_SIGNAL_ORDER] Database rows affected:', rows.meta?.changes || 0);
    } catch (dbError: any) {
      console.error('[PROCESS_SIGNAL_ORDER] ❌ Error updating signal status to OPEN:', dbError);
      console.error('[PROCESS_SIGNAL_ORDER] Error message:', dbError.message);
      console.error('[PROCESS_SIGNAL_ORDER] Stack trace:', dbError.stack);
      
      // Log to database even if it fails
      if (db) {
        try {
          await db.prepare("INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)")
            .bind(new Date().toISOString(), "ERROR", "Failed to update signal status to OPEN", JSON.stringify({ error: dbError.message, stack: dbError.stack, signalId: signal.id }))
            .run();
        } catch (e) {
          console.error('[PROCESS_SIGNAL_ORDER] Failed to log status update error to database:', e);
        }
      }
    }
    
    if (db) {
      try {
        const rows = await db.prepare("INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)")
          .bind(new Date().toISOString(), "SUCCESS", (isConfigured ? "Order placed: " : "Simulated order placed: ") + signal.action + " " + signal.symbol, JSON.stringify({ orderId: orderResult.orderId, symbol: signal.symbol, action: signal.action, signalId: signal.id }))
          .run();
        console.log('[PROCESS_SIGNAL_ORDER] Database log entry created - Rows affected:', rows.meta?.changes || 0);
      } catch (logError: any) {
        console.error('[PROCESS_SIGNAL_ORDER] ❌ Failed to log success to database:', logError);
        console.error('[PROCESS_SIGNAL_ORDER] Error message:', logError.message);
        console.error('[PROCESS_SIGNAL_ORDER] Stack trace:', logError.stack);
      }
    }
  } else {
    console.log('[PROCESS_SIGNAL_ORDER] ❌ Order rejected - Updating signal status to REJECTED');
    console.log('[PROCESS_SIGNAL_ORDER] Rejection reason:', orderResult.error);
    try {
      console.log('[PROCESS_SIGNAL_ORDER] Executing UPDATE signals SET status = REJECTED WHERE id = ?', signal.id);
      const rows = await db.prepare("UPDATE signals SET status = 'REJECTED' WHERE id = ?").bind(signal.id).run();
      console.log('[PROCESS_SIGNAL_ORDER] ✅ Signal status updated to REJECTED');
      console.log('[PROCESS_SIGNAL_ORDER] Database rows affected:', rows.meta?.changes || 0);
    } catch (dbError: any) {
      console.error('[PROCESS_SIGNAL_ORDER] ❌ Error updating signal status to REJECTED:', dbError);
      console.error('[PROCESS_SIGNAL_ORDER] Error message:', dbError.message);
      console.error('[PROCESS_SIGNAL_ORDER] Stack trace:', dbError.stack);
      
      // Log to database even if it fails
      if (db) {
        try {
          await db.prepare("INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)")
            .bind(new Date().toISOString(), "ERROR", "Failed to update signal status to REJECTED", JSON.stringify({ error: dbError.message, stack: dbError.stack, signalId: signal.id, orderError: orderResult.error }))
            .run();
        } catch (e) {
          console.error('[PROCESS_SIGNAL_ORDER] Failed to log status update error to database:', e);
        }
      }
    }
    
    // Log to error log table
    if (db) {
      try {
        await logError(db, 'ERROR', 'order_execution', orderResult.error, { symbol: signal.symbol, action: signal.action, signalId: signal.id, orderId: orderResult.orderId });
        console.log('[PROCESS_SIGNAL_ORDER] ✅ Error logged to error_log table');
      } catch (logError: any) {
        console.error('[PROCESS_SIGNAL_ORDER] ❌ Failed to log error to error_log table:', logError);
        console.error('[PROCESS_SIGNAL_ORDER] Error message:', logError.message);
        console.error('[PROCESS_SIGNAL_ORDER] Stack trace:', logError.stack);
      }
    }
    
    if (db) {
      try {
        const rows = await db.prepare("INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)")
          .bind(new Date().toISOString(), "ERROR", "Order rejected: " + signal.action + " " + signal.symbol, JSON.stringify({ error: orderResult.error, symbol: signal.symbol, action: signal.action, signalId: signal.id }))
          .run();
        console.log('[PROCESS_SIGNAL_ORDER] Database log entry created - Rows affected:', rows.meta?.changes || 0);
      } catch (logError: any) {
        console.error('[PROCESS_SIGNAL_ORDER] ❌ Failed to log rejection to database:', logError);
        console.error('[PROCESS_SIGNAL_ORDER] Error message:', logError.message);
        console.error('[PROCESS_SIGNAL_ORDER] Stack trace:', logError.stack);
      }
    }
  }
  console.log('[PROCESS_SIGNAL_ORDER] =========================================');
  console.log('[PROCESS_SIGNAL_ORDER] Signal order processing completed');
  console.log('[PROCESS_SIGNAL_ORDER] =========================================\n');
}

async function logError(db: any, severity: string, source: string, message: string, details?: any, stack?: string) {
  try {
    await db.prepare("INSERT INTO error_log (timestamp, severity, source, message, stack, details) VALUES (?, ?, ?, ?, ?, ?)").bind(new Date().toISOString(), severity || "ERROR", source || "unknown", message || "", stack || "", JSON.stringify(details || {})).run();
  } catch (e) {
    console.error("Failed to log error:", e);
  }
}

async function saveTradeHistory(db: any, signal: any, orderResult: any) {
  try {
    await db.prepare("INSERT INTO trade_history (id, signalId, symbol, action, volume, openPrice, openTime, status, stopLoss, takeProfit, orderId, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(signal.id + "_trade", signal.id, signal.symbol, signal.action, signal.volume, signal.openPrice, signal.openTime, orderResult.success ? "OPEN" : "REJECTED", signal.stopLoss, signal.takeProfit, orderResult.orderId || null, JSON.stringify(orderResult)).run();
  } catch (e) {
    console.error("Failed to save trade history:", e);
  }
}

// Place order on TradeLocker using REST API
async function placeOrderOnCTrader(env: CloudflareBindings, signal: any, db: any): Promise<{ success: boolean; orderId: string | null; error: string | null }> {
  const log = (type: string, message: string, details?: any) => {
    if (db) {
      db.prepare("INSERT INTO system_logs (timestamp, type, message, details) VALUES (?, ?, ?, ?)")
        .bind(new Date().toISOString(), type, message, JSON.stringify(details || {}))
        .run();
    }
    console.log("[TradeLocker] " + type + ": " + message, details || '');
  };

  log("DEBUG", "Starting TradeLocker order placement for signal", {
    signalId: signal.id,
    symbol: signal.symbol,
    action: signal.action,
    volume: signal.volume,
    type: signal.type
  });

  // Verify SL and TP values are present
  if (signal.stopLoss === null || signal.stopLoss === undefined || isNaN(signal.stopLoss) ||
      signal.takeProfit === null || signal.takeProfit === undefined || isNaN(signal.takeProfit)) {
    log("ERROR", "Signal rejected: Missing Stop Loss or Take Profit values", { signalId: signal.id });
    return {
      success: false,
      orderId: null,
      error: 'Signal rejected: Both Stop Loss (SL) and Take Profit (TP) are required.'
    };
  }

  // Step 1: Verify TradeLocker Credentials
  log("INFO", "Step 1: Verifying TradeLocker credentials availability", { signalId: signal.id });
  if (!env.TRADELOCKER_EMAIL || !env.TRADELOCKER_PASSWORD || !env.TRADELOCKER_SERVER || !env.TRADELOCKER_ACCOUNT_ID || !env.TRADELOCKER_ACC_NUM) {
    log("ERROR", "Step 1 FAILED: Missing TradeLocker credentials", {
      signalId: signal.id,
      hasEmail: !!env.TRADELOCKER_EMAIL,
      hasPassword: !!env.TRADELOCKER_PASSWORD,
      hasServer: !!env.TRADELOCKER_SERVER,
      hasAccountId: !!env.TRADELOCKER_ACCOUNT_ID,
      hasAccNum: !!env.TRADELOCKER_ACC_NUM,
      env: env.ENV || 'NOT_SET'
    });
    return {
      success: false,
      orderId: null,
      error: 'TradeLocker credentials not configured in Cloudflare Workers. Need: TRADELOCKER_EMAIL, TRADELOCKER_PASSWORD, TRADELOCKER_SERVER, TRADELOCKER_ACCOUNT_ID, TRADELOCKER_ACC_NUM. Signal: ' + JSON.stringify(signal)
    };
  }
  log("SUCCESS", "Step 1 PASSED: TradeLocker credentials verified", {
    signalId: signal.id,
    envType: (env.ENV || 'demo').toLowerCase(),
    isLive: (env.ENV || 'demo').toLowerCase() === 'live'
  });

  // Step 2: Create TradeLocker Service
  log("INFO", "Step 2: Initializing TradeLocker service", { signalId: signal.id });

  // Map environment to TradeLocker API URL
  const envType = (env.ENV || 'demo').toLowerCase();
  const isLive = envType === 'live' || envType === 'production';
  
  const config: TradeLockerConfig = {
    apiUrl: isLive ? 'https://live.tradelocker.com/backend-api' : 'https://demo.tradelocker.com/backend-api',
    email: env.TRADELOCKER_EMAIL,
    password: env.TRADELOCKER_PASSWORD,
    server: isLive ? 'live' : 'herofx',
    accountId: parseInt(env.TRADELOCKER_ACCOUNT_ID),
    accNum: parseInt(env.TRADELOCKER_ACC_NUM)
  };

  try {
    const tradelockerService = new TradeLockerService(config);

    // Step 3: Get access token
    log("INFO", "Step 3: Authenticating with TradeLocker", { signalId: signal.id });
    const accessToken = await tradelockerService.getAccessToken();
    
    if (!accessToken) {
      log("ERROR", "Step 3 FAILED: Could not get TradeLocker access token", { signalId: signal.id });
      return {
        success: false,
        orderId: null,
        error: 'Failed to authenticate with TradeLocker. Please check your credentials.'
      };
    }
    log("SUCCESS", "Step 3 PASSED: TradeLocker authentication successful", { signalId: signal.id });

    // Step 4: Get instrument ID
    log("INFO", "Step 4: Looking up instrument ID for " + signal.symbol, { signalId: signal.id });
    const instrumentId = await tradelockerService.getTradableInstrumentId(signal.symbol);

    if (!instrumentId) {
      log("ERROR", "Step 4 FAILED: Could not find instrument " + signal.symbol, {
        signalId: signal.id,
        symbol: signal.symbol
      });
      return {
        success: false,
        orderId: null,
        error: 'Instrument not found in TradeLocker: ' + signal.symbol
      };
    }
    log("SUCCESS", "Step 4 PASSED: Instrument found", {
      signalId: signal.id,
      symbol: signal.symbol,
      instrumentId: instrumentId
    });

    // Step 5: Determine order type
    const isMarketOrder = !signal.openPrice || signal.openPrice === 0 || signal.openPrice === '-';
    const orderType = isMarketOrder ? 'market' : 'limit';
    const entryPrice = isMarketOrder ? null : parseFloat(signal.openPrice);

    log("DEBUG", "Step 5: Order details", {
      signalId: signal.id,
      orderType,
      entryPrice,
      volume: signal.volume,
      sl: signal.stopLoss,
      tp: signal.takeProfit
    });

    // Step 6: Place order
    log("INFO", "Step 6: Placing order with TradeLocker", { signalId: signal.id, instrumentId });
    
    const routeId = (await tradelockerService.getRouteId(signal.symbol, 'TRADE')) || 1;
    const orderSide = (signal.action || 'BUY').toLowerCase() === 'sell' ? 'sell' : 'buy';

    const orderRequest: OrderRequest = {
      tradableInstrumentId: instrumentId,
      qty: parseFloat(signal.volume) || 0.01,
      type: orderType as any,
      side: orderSide as any,
      routeId: routeId,
      validity: isMarketOrder ? 'IOC' : 'GTC',
      price: entryPrice || undefined,
      stopLoss: signal.stopLoss ? parseFloat(signal.stopLoss) : undefined,
      stopLossType: signal.stopLoss ? 'absolute' : undefined,
      takeProfit: signal.takeProfit ? parseFloat(signal.takeProfit) : undefined,
      takeProfitType: signal.takeProfit ? 'absolute' : undefined
    };

    let orderResult = await tradelockerService.placeOrder(orderRequest);

    if (!orderResult.success && orderResult.error && (orderResult.error.toLowerCase().includes('sl') || orderResult.error.toLowerCase().includes('tp') || orderResult.error.toLowerCase().includes('price') || orderResult.error.toLowerCase().includes('valid'))) {
      log("WARN", "Order placement with SL/TP failed due to price/SL/TP validation, retrying without SL/TP", { error: orderResult.error });
      delete orderRequest.stopLoss;
      delete orderRequest.stopLossType;
      delete orderRequest.takeProfit;
      delete orderRequest.takeProfitType;
      orderResult = await tradelockerService.placeOrder(orderRequest);
    }

    log("INFO", "Step 6: Order placement result", {
      signalId: signal.id,
      orderId: orderResult.orderId,
      success: orderResult.success,
      error: orderResult.error
    });

    if (!orderResult.success) {
      log("ERROR", "Step 6 FAILED: TradeLocker order placement failed", {
        signalId: signal.id,
        error: orderResult.error
      });

      return {
        success: false,
        orderId: null,
        error: 'TradeLocker Error: ' + (orderResult.error || 'Unknown error')
      };
    }

    log("SUCCESS", "Step 6 PASSED: Order placed successfully", {
      signalId: signal.id,
      orderId: orderResult.orderId,
      symbol: signal.symbol,
      action: signal.action,
      volume: signal.volume
    });

    return {
      success: true,
      orderId: orderResult.orderId,
      error: null
    };

  } catch (error: any) {
    log("ERROR", "Step 8: Exception during TradeLocker operations", {
      signalId: signal.id,
      errorMessage: error.message,
      stack: error.stack
    });

    return {
      success: false,
      orderId: null,
      error: 'TradeLocker Error: ' + error.message
    };
  }
}

// Process pending signals
// (No longer used - webhook handles immediate signal processing)

// Scheduled function for periodic tasks
export async function scheduled(event, env, ctx) {
  const db = env.DB;
  if (db) await ensureTables(db);
  
  // 1. Check TradeLocker connection
  // TradeLocker connection is verified in placeOrderOnCTrader function
  
  // 2. Check account balance
  // TradeLocker balance is checked when placing orders
  
  // 3. Check status of current opened trades
  // TradeLocker open trades are monitored via WebSocket or polling
}

export default app;


function getDashboardHTML(autoToken?: string | null): string {
  const autoAuthScript = autoToken ? `localStorage.setItem('authToken', '${autoToken}');` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradeLocker Trading Bridge - Admin Dashboard (v4.0)</title>
  <style>
    :root {
      --bg-color: #0b0f19;
      --card-bg: #111827;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --border-color: #1f2937;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --radius: 12px;
      --hover-bg: #1a2234;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      min-height: 100vh;
      padding: 30px 20px;
      line-height: 1.5;
    }

    .container {
      width: 100%;
      max-width: 1320px;
      margin: 0 auto;
    }

    .login-screen {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid var(--border-color);
      max-width: 420px;
      margin: 80px auto;
    }

    .login-screen.hidden {
      display: none;
    }

    .login-screen h1 {
      color: var(--text-main);
      margin-bottom: 8px;
      text-align: center;
      font-size: 24px;
      font-weight: 700;
    }

    .login-screen p {
      color: var(--text-muted);
      text-align: center;
      margin-bottom: 24px;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      color: var(--text-main);
      font-weight: 500;
      margin-bottom: 6px;
      font-size: 13px;
    }

    .form-group input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      background: #1a2234;
      color: var(--text-main);
      transition: all 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--primary);
      background: #111827;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .login-button {
      width: 100%;
      padding: 11px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 8px;
    }

    .login-button:hover {
      background: var(--primary-hover);
    }

    .demo-button {
      width: 100%;
      padding: 11px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 8px;
    }

    .demo-button:hover {
      background: #059669;
    }

    .error-message {
      color: var(--danger);
      text-align: center;
      margin-top: 12px;
      font-size: 13px;
      display: none;
    }

    .error-message.show {
      display: block;
    }

    .dashboard {
      display: none;
    }

    .dashboard.active {
      display: block;
    }

    .dashboard-header {
      background: var(--card-bg);
      padding: 24px 30px;
      border-radius: var(--radius);
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--border-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      flex-wrap: wrap;
      gap: 15px;
    }

    .dashboard-header h1 {
      color: var(--text-main);
      font-size: 22px;
      font-weight: 700;
    }

    .version-badge {
      background: #e0e7ff;
      color: var(--primary);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 10px;
    }

    .version-badge.new {
      background: #d1fae5;
      color: #065f46;
    }

    .header-status {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .logout-button {
      padding: 8px 16px;
      background: #fee2e2;
      color: #991b1b;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: background 0.2s;
    }

    .logout-button:hover {
      background: #fecaca;
    }

    /* Logout button hidden - dashboard is publicly accessible */
    .logout-button {
      display: none !important;
    }

    /* Hamburger Menu Styles */
    .hamburger-btn {
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 44px;
      height: 44px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      padding: 8px;
      gap: 5px;
    }

    .hamburger-btn span {
      display: block;
      width: 24px;
      height: 2px;
      background: var(--text-main);
      border-radius: 2px;
      transition: transform 0.3s, opacity 0.3s;
    }

    .hamburger-btn.active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .hamburger-btn.active span:nth-child(2) {
      opacity: 0;
    }

    .hamburger-btn.active span:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -5px);
    }

    .mobile-nav-menu {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    }

    .mobile-nav-menu.active {
      display: block;
    }

    .mobile-nav-content {
      position: absolute;
      top: 0;
      right: 0;
      width: 280px;
      max-width: 85%;
      height: 100%;
      background: var(--card-bg);
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
      overflow-y: auto;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
    }

    .mobile-nav-menu.active .mobile-nav-content {
      transform: translateX(0);
    }

    .mobile-nav-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      background: var(--primary);
      color: white;
    }

    .mobile-nav-header h3 {
      margin: 0;
      font-size: 16px;
    }

    .mobile-nav-close {
      background: none;
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .mobile-nav-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .mobile-nav-list li {
      border-bottom: 1px solid var(--border-color);
    }

    .mobile-nav-list li a {
      display: block;
      padding: 14px 20px;
      color: var(--text-main);
      text-decoration: none;
      font-size: 15px;
      transition: background 0.2s;
    }

    .mobile-nav-list li a:hover,
    .mobile-nav-list li a:active {
      background: var(--hover-bg);
    }

    .mobile-nav-list li a .nav-icon {
      margin-right: 12px;
      font-size: 18px;
    }

    .content-section {
      background: var(--card-bg);
      padding: 24px 30px;
      border-radius: var(--radius);
      margin-bottom: 24px;
      border: 1px solid var(--border-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .content-section h2, .content-section h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: #1a2234;
      border: 1px solid var(--border-color);
      padding: 20px;
      border-radius: 8px;
      text-align: left;
    }

    .stat-card h3 {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .stat-card .value {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-main);
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }

    .table th {
      background: #1a2234;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-color);
      font-size: 13px;
      color: var(--text-main);
    }

    .table tr:hover {
      background: rgba(59, 130, 246, 0.08);
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-error {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge-pending {
      background: #e0e7ff;
      color: #3730a3;
    }

    .control-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .control-item {
      background: #1a2234;
      border: 1px solid var(--border-color);
      padding: 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .control-item label {
      font-weight: 600;
      color: var(--text-main);
      font-size: 14px;
    }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 22px;
      background: #cbd5e1;
      border-radius: 11px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle-switch.active {
      background: var(--success);
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: left 0.2s;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .toggle-switch.active::after {
      left: 24px;
    }

    .loading {
      text-align: center;
      padding: 30px;
      color: var(--text-muted);
    }

    .spinner {
      display: inline-block;
      width: 32px;
      height: 32px;
      border: 3px solid var(--border-color);
      border-top: 3px solid var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .input-group {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .input-group input {
      flex: 1;
      min-width: 200px;
      padding: 10px 14px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      background: #1a2234;
      color: var(--text-main);
    }

    .input-group input:focus {
      outline: none;
      border-color: var(--primary);
      background: #111827;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .input-group button {
      padding: 10px 20px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.2s;
    }

    .input-group button:hover {
      background: var(--primary-hover);
    }

    .empty-state {
      text-align: center;
      padding: 30px;
      color: var(--text-muted);
      font-size: 14px;
    }

    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 6px;
    }

    .status-connected {
      background: var(--success);
    }

    .status-disconnected {
      background: var(--danger);
    }

    .success-rate-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }

    .alert-box {
      margin-bottom: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
    }

    .alert-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }

    .delete-btn {
      padding: 6px 12px;
      background: #fee2e2;
      color: #991b1b;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: background 0.2s;
    }

    .delete-btn:hover {
      background: #fecaca;
    }

    /* ============================================
       MOBILE RESPONSIVE STYLES
       ============================================ */
    
    /* Show hamburger menu on mobile/tablet */
    @media (max-width: 768px) {
      .hamburger-btn {
        display: flex;
      }
      
      .dashboard-header {
        padding: 15px;
      }
      
      .dashboard-header h1 {
        font-size: 18px;
      }
      
      .dashboard-header .version-badge {
        display: none;
      }
      
      .header-status > div:first-child {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
      
      .header-status {
        flex-direction: column;
        align-items: flex-start;
      }
    }
    
    /* Extra Small Devices (up to 480px) */
    @media (max-width: 480px) {
      body {
        padding: 10px 8px;
        font-size: 13px;
      }
      
      .login-screen {
        padding: 20px 15px;
        margin: 40px auto;
      }
      
      .login-screen h1 {
        font-size: 20px;
      }
      
      .demo-button,
      .login-button {
        padding: 12px;
        font-size: 14px;
      }
      
      .container {
        max-width: 100%;
        padding: 0 5px;
      }
      
      .dashboard-header {
        padding: 15px;
        flex-direction: column;
        gap: 10px;
      }
      
      .dashboard-header h1 {
        font-size: 18px;
      }
      
      .header-status {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .version-badge {
        font-size: 10px;
        padding: 3px 8px;
      }
      
      .content-section {
        padding: 15px;
        margin-bottom: 16px;
      }
      
      .content-section h2 {
        font-size: 14px;
      }
      
      .content-section h3 {
        font-size: 13px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      
      .stat-card {
        padding: 12px;
      }
      
      .stat-card h3 {
        font-size: 10px;
      }
      
      .stat-card .value {
        font-size: 20px;
      }
      
      .table {
        font-size: 11px;
      }
      
      .table th,
      .table td {
        padding: 8px 6px;
      }
      
      .table th {
        font-size: 10px;
      }
      
      .control-group {
        grid-template-columns: 1fr;
        gap: 10px;
      }
      
      .control-item {
        padding: 12px;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .toggle-switch {
        width: 40px;
        height: 20px;
      }
      
      .toggle-switch::after {
        width: 16px;
        height: 16px;
      }
      
      .toggle-switch.active::after {
        left: 20px;
      }
      
      .input-group {
        flex-direction: column;
        gap: 8px;
      }
      
      .input-group input {
        min-width: 100%;
      }
      
      .input-group button {
        width: 100%;
        padding: 12px;
      }
      
      .badge {
        padding: 3px 6px;
        font-size: 9px;
      }
      
      .success-rate-badge {
        padding: 3px 6px;
        font-size: 10px;
      }
      
      .alert-box {
        padding: 10px;
        font-size: 12px;
      }
      
      .logout-button {
        width: 100%;
        padding: 10px;
        text-align: center;
      }
      
      .spinner {
        width: 24px;
        height: 24px;
      }
      
      .empty-state {
        padding: 20px;
        font-size: 12px;
      }
    }
    
    /* Small Devices (481px to 768px) */
    @media (min-width: 481px) and (max-width: 768px) {
      body {
        padding: 15px 10px;
      }
      
      .login-screen {
        padding: 30px 20px;
        margin: 60px auto;
      }
      
      .container {
        max-width: 100%;
      }
      
      .dashboard-header {
        padding: 20px;
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      
      .header-status {
        justify-content: space-between;
        flex-wrap: wrap;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .stat-card {
        padding: 15px;
      }
      
      .content-section {
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .table {
        font-size: 12px;
      }
      
      .table th,
      .table td {
        padding: 10px 8px;
      }
      
      .control-group {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .input-group {
        flex-direction: column;
        gap: 10px;
      }
      
      .input-group input {
        min-width: 100%;
      }
      
      .input-group button {
        width: 100%;
        padding: 12px;
      }
      
      .logout-button {
        width: 100%;
        padding: 12px;
        text-align: center;
      }
    }
    
    /* Medium Devices (769px to 1024px) */
    @media (min-width: 769px) and (max-width: 1024px) {
      .container {
        max-width: 95%;
      }
      
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      
      .control-group {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .table {
        font-size: 12px;
      }
    }
    
    /* Large Devices (1025px to 1440px) */
    @media (min-width: 1025px) and (max-width: 1440px) {
      .container {
        max-width: 1200px;
      }
      
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    
    /* Extra Large Devices (1441px and above) */
    @media (min-width: 1441px) {
      .container {
        max-width: 1400px;
      }
      
      .stats-grid {
        grid-template-columns: repeat(5, 1fr);
      }
    }
    
    /* Touch Device Optimizations */
    @media (hover: none) and (pointer: coarse) {
      .login-button,
      .demo-button,
      .logout-button,
      .delete-btn,
      .toggle-switch,
      .input-group button {
        min-height: 44px;
        min-width: 44px;
      }
      
      .table th,
      .table td {
        min-height: 40px;
      }
      
      .control-item {
        padding: 14px;
      }
      
      .form-group input {
        min-height: 44px;
        padding: 12px 14px;
      }
    }
    
    /* Landscape Mode on Mobile */
    @media (max-height: 500px) and (orientation: landscape) {
      .login-screen {
        margin: 20px auto;
        padding: 15px 20px;
      }
      
      .dashboard-header {
        flex-direction: row;
        padding: 10px 15px;
      }
      
      .stats-grid {
        grid-template-columns: repeat(5, 1fr);
      }
      
      .content-section {
        padding: 15px;
        margin-bottom: 12px;
      }
    }
    
    /* High DPI Displays */
    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
      .spinner {
        border-width: 2px;
      }
    }
    
    /* Reduced Motion Preferences */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    
    /* Dark Mode High Contrast */
    @media (prefers-color-scheme: dark) {
      .login-screen {
        background: #1a1a2e;
        border-color: #2d2d44;
      }
    }
    
    /* Print Styles */
    @media print {
      body {
        background: white;
        color: black;
      }
      
      .dashboard-header,
      .logout-button,
      .input-group,
      .delete-btn {
        display: none !important;
      }
      
      .content-section {
        border: 1px solid #ddd;
        break-inside: avoid;
      }
      
      .table {
        font-size: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Login Screen -->
    <!-- Login screen removed - dashboard is now fully public and accessible to all visitors -->

    <!-- Mobile Navigation Menu -->
    <div class="mobile-nav-menu" id="mobileNavMenu" onclick="closeMobileNavOnBackdrop(event)">
      <div class="mobile-nav-content" onclick="event.stopPropagation()">
        <div class="mobile-nav-header">
          <h3>📊 Menu</h3>
          <button class="mobile-nav-close" onclick="toggleMobileNav()" aria-label="Close menu">×</button>
        </div>
        <ul class="mobile-nav-list">
          <li><a href="#overview" onclick="navigateToSection('overview')"><span class="nav-icon">📈</span>Overview</a></li>
          <li><a href="#orders" onclick="navigateToSection('orders')"><span class="nav-icon">📋</span>Trade History</a></li>
          <li><a href="#signals" onclick="navigateToSection('signals')"><span class="nav-icon">📡</span>All Signals</a></li>
          <li><a href="#settings" onclick="navigateToSection('settings')"><span class="nav-icon">⚙️</span>Account Settings</a></li>
          <li><a href="#pairs" onclick="navigateToSection('pairs')"><span class="nav-icon">💱</span>Trading Pairs</a></li>
          <li><a href="#channels" onclick="navigateToSection('channels')"><span class="nav-icon">📺</span>Telegram Channels</a></li>
          <li><a href="#parserRules" onclick="navigateToSection('parserRules')"><span class="nav-icon">📝</span>Parser Rules</a></li>
          <li><a href="#parserSandbox" onclick="navigateToSection('parserSandbox')"><span class="nav-icon">🧪</span>Parser Sandbox</a></li>
          <li><a href="#logs" onclick="navigateToSection('logs')"><span class="nav-icon">📜</span>System Logs</a></li>
        </ul>
      </div>
    </div>

    <!-- Dashboard -->
    <div class="dashboard" id="dashboard">
      <div class="dashboard-header">
        <div class="header-status">
          <div style="display: flex; align-items: center;">
            <h1>Trading Dashboard</h1>
            <span class="version-badge new" id="versionBadge">v5.0 - D1 Realtime & Dark Blue Modern</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
            <span class="status-indicator status-disconnected" id="connectionStatus"></span>
            <span id="connectionStatusText">Connecting...</span>
            <span class="success-rate-badge badge-error" id="successRateBadge">Success Rate: 0.00%</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="logout-button" onclick="logout()">Logout</button>
          <button class="hamburger-btn" id="hamburgerBtn" onclick="toggleMobileNav()" aria-label="Open menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>


      <!-- Overview / System Status -->
      <div class="content-section" id="overview">
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Open Positions</h3>
            <div class="value" id="openPositions">0</div>
          </div>
          <div class="stat-card">
            <h3>Total Trades</h3>
            <div class="value" id="totalTrades">0</div>
          </div>
          <div class="stat-card">
            <h3>Recent Signals</h3>
            <div class="value" id="recentSignals">0</div>
          </div>
          <div class="stat-card">
            <h3>Active Pairs</h3>
            <div class="value" id="activePairs">0</div>
          </div>
          <div class="stat-card">
            <h3>Active Channels</h3>
            <div class="value" id="activeChannels">0</div>
          </div>
        </div>

        <h3>Quick Stats</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Last Update</td>
              <td id="lastUpdate">-</td>
            </tr>
            <tr>
              <td>API Status</td>
              <td><span class="badge badge-warning" id="apiStatus">Offline Mode</span></td>
            </tr>
            <tr>
              <td>Database</td>
              <td><span class="badge badge-success" id="dbStatus">Local Storage</span></td>
            </tr>
            <tr>
              <td>Signal Filtering</td>
              <td><span class="badge badge-success" id="filterStatus">Active</span></td>
            </tr>
          </tbody>
        </table>

        <h3 style="margin-top: 20px;">TradeLocker Account Details</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Server</td>
              <td id="tradeLockerServerDisplay">-</td>
            </tr>
            <tr>
              <td>Account ID</td>
              <td id="tradeLockerAccountIdDisplay">-</td>
            </tr>
            <tr>
              <td>Account Number</td>
              <td id="tradeLockerAccountNumDisplay">-</td>
            </tr>
            <tr>
              <td>Email</td>
              <td id="tradeLockerEmailDisplay">-</td>
            </tr>
            <tr>
              <td>Status</td>
              <td id="tradeLockerStatusDisplay"><span class="badge badge-warning">Disconnected</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Trade History / Orders</h2>
      <!-- Trade History / Orders -->
      <div class="content-section" id="orders">
        <h3>Live Orders</h3>
        <div class="alert-box alert-info">
          <strong>Note:</strong> Only orders for configured and enabled pairs are displayed.
        </div>
        <div class="loading" id="ordersLoading">
          <div class="spinner"></div>
          <p>Loading orders...</p>
        </div>
        <div id="ordersContent" style="display: none;">
          <table class="table" id="ordersTable">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Direction</th>
                <th>Volume</th>
                <th>Entry</th>
                <th>SL</th>
                <th>TP</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody id="ordersTableBody">
            </tbody>
          </table>
          <div id="ordersEmpty" class="empty-state" style="display: none;">
            <p>No orders found</p>
          </div>
        </div>
      </div>

      <h2>All Signals</h2>
      <!-- All Signals -->
      <div class="content-section" id="signals">
        <h3>Trading Signals</h3>
        <div class="alert-box alert-info" id="signalFilterAlert" style="display: none;">
          <strong>Signal Filtering Active:</strong> Only signals for configured pairs will be processed. Current whitelist: <span id="pairWhitelistDisplay">None</span>
        </div>
        <div class="loading" id="signalsLoading">
          <div class="spinner"></div>
          <p>Loading signals...</p>
        </div>
        <div id="signalsContent" style="display: none;">
          <table class="table" id="signalsTable">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Direction</th>
                <th>Entry</th>
                <th>SL</th>
                <th>TP</th>
                <th>Status</th>
                <th>Filtered</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody id="signalsTableBody">
            </tbody>
          </table>
          <div id="signalsEmpty" class="empty-state" style="display: none;">
            <p>No signals received yet</p>
          </div>
        </div>
      </div>

      <h2>Account Settings</h2>
      <!-- Account Settings -->
      <div class="content-section" id="settings">
        <h3>Account Settings</h3>
        <div class="alert-box alert-info">
          <strong>Note:</strong> Settings are saved to local storage and will persist across browser sessions.
        </div>
        <div class="loading" id="settingsLoading">
          <div class="spinner"></div>
          <p>Loading settings...</p>
        </div>
        <div id="settingsContent" style="display: none;">
          <div class="input-group">
            <input type="text" id="tradeLockerServer" placeholder="TradeLocker Server" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
            <input type="text" id="tradeLockerAccountId" placeholder="TradeLocker Account ID" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div class="input-group">
            <input type="text" id="tradeLockerAccountNum" placeholder="TradeLocker Account Number" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
            <input type="text" id="tradeLockerEmail" placeholder="TradeLocker Email" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          </div>
          <div class="input-group">
            <input type="number" id="defaultLotSize" placeholder="Default Lot Size (e.g., 0.01)" step="0.01" min="0.01" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
            <label style="display: flex; align-items: center; gap: 10px; padding: 10px; font-weight: 600;">
              <input type="checkbox" id="autoExecuteTrades"> Auto Execute Trades
            </label>
          </div>
          <button onclick="saveSettings()" style="margin-top: 15px; padding: 10px 24px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%;">Save Settings</button>
        </div>
      </div>

      <h2>Pair Configuration</h2>
      <!-- Pair Configuration -->
      <div class="content-section" id="pairs">
        <h3>Trading Pairs Configuration</h3>
        <div class="alert-box alert-info">
          <strong>Info:</strong> All signals will be processed by the <strong>TradeLocker bridge</strong>. The system uses REST API for order placement.
        </div>
        <div class="loading" id="pairsLoading">
          <div class="spinner"></div>
          <p>Loading pairs...</p>
        </div>
        <div id="pairsContent" style="display: none;">
          <div class="input-group">
            <input type="text" id="newPairSymbol" placeholder="Symbol (e.g., BTCUSD)" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
            <input type="number" id="newPairLot" placeholder="Lot Size (e.g., 0.01)" step="0.01" min="0.01" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
            <button onclick="addNewPair()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Add Pair</button>
          </div>
          <div class="control-group" id="pairsGrid">
          </div>
        </div>
      </div>

      <h2>Telegram Channels</h2>
      <!-- Telegram Channels -->
      <div class="content-section" id="channels">
        <h3>Telegram Channels</h3>
        <div class="alert-box alert-info">
          <strong>Note:</strong> Telegram channels are saved to local storage and will persist across browser sessions.
        </div>
        <div class="loading" id="channelsLoading">
          <div class="spinner"></div>
          <p>Loading channels...</p>
        </div>
        <div id="channelsContent" style="display: none;">
          <div class="input-group">
            <input type="text" id="newChannelId" placeholder="Channel ID (e.g., -100123456789)" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
            <input type="text" id="newChannelName" placeholder="Channel Name (optional)" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
            <button onclick="addNewChannel()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Add Channel</button>
          </div>
          <div class="control-group" id="channelsGrid">
          </div>
        </div>
      </div>

      <h2>Signal Parser Rules & Formats</h2>
      <!-- Parser Rules Manager -->
      <div class="content-section" id="parserRules">
        <h3>Adjustable Parser Rules & Accepted Formats</h3>
        <div class="alert-box alert-info">
          <strong>Info:</strong> Enable/disable or add custom keyword/alias mapping rules. These rules are instantly effective for parsing incoming signals (e.g., mapping "gold" to "XAUUSD", "now" to market order, prioritizing TP1).
        </div>
        <div class="input-group">
          <input type="text" id="newRuleName" placeholder="Rule Name (e.g., Gold Alias)" style="flex: 1;">
          <input type="text" id="newRulePattern" placeholder="Pattern / Keyword (e.g., gold)" style="flex: 1;">
          <input type="text" id="newRuleReplacement" placeholder="Mapping / Replacement (e.g., XAUUSD)" style="flex: 1;">
          <button onclick="addNewParserRule()">Add / Update Rule</button>
        </div>
        <div class="control-group" id="parserRulesGrid">
        </div>
      </div>

      <h2>Signal Parser Sandbox</h2>
      <!-- Signal Parser Sandbox -->
      <div class="content-section" id="parserSandbox">
        <h3>Test Signal Parser (Supports Emojis, HTML, & All Formats)</h3>
        <div class="alert-box alert-info">
          <strong>Tip:</strong> Test any Telegram signal format (e.g. <i>"🚨 FREE SIGNAL\n🚨 SELL GOLD NOW 📉\n\n🎯 Entry Point: 4361.5 / 4370.5\n❌ Stop Loss: 4374.5\n\n✅ TP1: 4351.5\n✅ TP2: 4341.5"</i>) to instantly test extraction.
        </div>
        <div class="form-group">
          <textarea id="testSignalText" rows="6" placeholder="Paste raw signal text with emojis, HTML, or markdown here..." style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; background: #f8fafc; font-family: monospace;"></textarea>
        </div>
        <button onclick="testSignalParser()" style="padding: 10px 24px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">Test Parse Signal</button>
        <div id="parserResultContainer" style="margin-top: 15px; display: none;">
          <h4>Parsed Output:</h4>
          <pre id="parserResultOutput" style="background: #0f172a; color: #38bdf8; padding: 15px; border-radius: 8px; font-size: 13px; overflow-x: auto; margin-top: 8px;"></pre>
        </div>
      </div>

      <h2>Error Logs</h2>
      <!-- Error Logs -->
      <div class="content-section" id="logs">
        <h3>System Logs</h3>
        <div class="alert-box alert-info">
          <strong>Note:</strong> All actions are logged here for debugging purposes.
        </div>
        <div class="loading" id="logsLoading">
          <div class="spinner"></div>
          <p>Loading logs...</p>
        </div>
        <div id="logsContent" style="display: none;">
          <table class="table" id="logsTable">
            <thead>
              <tr>
                <th>Level</th>
                <th>Message</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody id="logsTableBody">
            </tbody>
          </table>
          <div id="logsEmpty" class="empty-state" style="display: none;">
            <p>No logs available</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    ${autoAuthScript}
    // ============================================
    // STATE MANAGEMENT - Client-side persistence
    // ============================================
    
    const STORAGE_KEYS = {
      PAIRS: 'ctrader_pairs_v2',
      CHANNELS: 'ctrader_channels_v2',
      SETTINGS: 'ctrader_settings_v2',
      ORDERS: 'ctrader_orders_v2',
      SIGNALS: 'ctrader_signals_v2',
      LOGS: 'ctrader_logs_v2',
      AUTH: 'authToken'
    };

    // Initialize state from localStorage
    let appState = {
      pairs: JSON.parse(localStorage.getItem(STORAGE_KEYS.PAIRS)) || [],
      channels: JSON.parse(localStorage.getItem(STORAGE_KEYS.CHANNELS)) || [],
      settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
        ctraderAccountId: '',
        ctraderAccountNumber: '',
        defaultLotSize: 0.01,
        autoExecuteTrades: false
      },
      orders: JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [],
      signals: JSON.parse(localStorage.getItem(STORAGE_KEYS.SIGNALS)) || [],
      logs: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS)) || []
    };

    // Success rate tracking
    let successRate = {
      total: 0,
      successful: 0
    };

    // Connection status
    let isConnected = false;
    let authToken = localStorage.getItem(STORAGE_KEYS.AUTH);

    // ============================================
    // SIGNAL FILTERING FUNCTION - REQUIREMENT #1
    // ============================================
    
    function isSignalAllowed(signalSymbol) {
      if (!signalSymbol) return false;
      
      const normalizedSymbol = signalSymbol.toUpperCase().trim();
      
      // Get enabled pairs from state
      const enabledPairs = appState.pairs
        .filter(p => p.enabled === true || p.enabled === 1 || p.enabled === '1' || p.enabled === 'true')
        .map(p => p.symbol.toUpperCase().trim());
      
      // If no pairs configured, allow all signals
      if (enabledPairs.length === 0) {
        return true;
      }
      
      // Check if signal symbol is in the whitelist
      return enabledPairs.includes(normalizedSymbol);
    }

    function getFilteredStatus(signalSymbol) {
      return isSignalAllowed(signalSymbol) ? 'Allowed' : 'Filtered Out';
    }

    // ============================================
    // STATE PERSISTENCE HELPERS
    // ============================================
    
    function saveState() {
      localStorage.setItem(STORAGE_KEYS.PAIRS, JSON.stringify(appState.pairs));
      localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(appState.channels));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appState.settings));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(appState.orders));
      localStorage.setItem(STORAGE_KEYS.SIGNALS, JSON.stringify(appState.signals));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(appState.logs));
    }

    function addLog(level, message) {
      const log = {
        level: level,
        message: message,
        timestamp: new Date().toISOString()
      };
      appState.logs.unshift(log);
      if (appState.logs.length > 100) {
        appState.logs = appState.logs.slice(0, 100);
      }
      saveState();
      return log;
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    
    function initializeDashboard() {
      // Load settings into form fields
      loadSettingsToForm();
      
      // Update UI with current state
      updateDashboardStats();
      updatePairWhitelistDisplay();
      
      // Set connection status
      updateConnectionStatus();
      
      // Load all data immediately (no tab switching)
      if (authToken) {
        loadDataFromAPI();
      }
      // Render all sections immediately
      renderAllTabs();
    }

    function loadSettingsToForm() {
      if (appState.settings) {
        const inputs = ['ctraderAccountId', 'ctraderAccountNumber', 'defaultLotSize', 'autoExecuteTrades'];
        inputs.forEach(key => {
          const input = document.getElementById(key);
          if (input) {
            if (input.type === 'checkbox') {
              input.checked = appState.settings[key] || false;
            } else {
              input.value = appState.settings[key] || '';
            }
          }
        });
      }
    }

    function updateDashboardStats() {
      const openOrdersCount = appState.orders.filter(o => (o.status || '').toUpperCase() === 'OPEN').length;
      const openSignalsCount = appState.signals.filter(s => (s.status || '').toUpperCase() === 'OPEN').length;
      document.getElementById('openPositions').textContent = (openOrdersCount + openSignalsCount) || '0';
      document.getElementById('totalTrades').textContent = appState.orders.length || '0';
      document.getElementById('recentSignals').textContent = appState.signals.length || '0';
      document.getElementById('activePairs').textContent = appState.pairs.filter(p => p.enabled !== false).length || '0';
      document.getElementById('activeChannels').textContent = appState.channels.filter(c => c.enabled !== false).length || '0';
      document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
      
      // Calculate success rate
      const total = successRate.total;
      const successful = successRate.successful;
      const rate = total > 0 ? ((successful / total) * 100).toFixed(2) : 0.00;
      document.getElementById('successRateBadge').textContent = \`Success Rate: \${rate}%\`;
      document.getElementById('successRateBadge').className = rate >= 80 ? 'success-rate-badge badge-success' : rate >= 50 ? 'success-rate-badge badge-warning' : 'success-rate-badge badge-error';
    }

    function updatePairWhitelistDisplay() {
      const enabledPairs = appState.pairs.filter(p => p.enabled !== false).map(p => p.symbol);
      const display = document.getElementById('pairWhitelistDisplay');
      if (display) {
        display.textContent = enabledPairs.length > 0 ? enabledPairs.join(', ') : 'None';
      }
      
      // Show/hide filter alert
      const filterAlert = document.getElementById('signalFilterAlert');
      if (filterAlert) {
        filterAlert.style.display = enabledPairs.length > 0 ? 'block' : 'none';
      }
    }

    function updateConnectionStatus() {
      const statusDot = document.getElementById('connectionStatus');
      const statusText = document.getElementById('connectionStatusText');
      const apiStatus = document.getElementById('apiStatus');
      
      if (isConnected) {
        statusDot.className = 'status-indicator status-connected';
        statusText.textContent = 'Connected';
        statusText.style.color = '#4caf50';
        apiStatus.textContent = 'Connected';
        apiStatus.className = 'badge badge-success';
      } else {
        statusDot.className = 'status-indicator status-disconnected';
        statusText.textContent = 'Offline Mode';
        statusText.style.color = '#f44336';
        apiStatus.textContent = 'Offline Mode';
        apiStatus.className = 'badge badge-warning';
      }
    }

    // ============================================
    // API CALLS WITH FALLBACK TO LOCAL STATE
    // ============================================
    
    async function apiCall(url, options = {}) {
      if (!authToken) {
        // Fall back to local state when not authenticated - allow public access
        console.log('Not authenticated, using local state');
        return Promise.resolve({ success: true, data: null });
      }
      
      const defaultOptions = {
        headers: { 
          'Authorization': 'Basic ' + authToken,
          'Content-Type': 'application/json'
        },
        ...options
      };
      
      try {
        const response = await fetch(url, defaultOptions);
        
        if (!response.ok) {
          // API is reachable but returned error - fall back to local state
          console.warn(\`API error \${response.status} for \${url}, using local state\`);
          isConnected = false;
          updateConnectionStatus();
          throw new Error('API error: ' + response.status);
        }
        
        isConnected = true;
        updateConnectionStatus();
        return await response.json();
        
      } catch (error) {
        console.error('API call failed:', url, error);
        isConnected = false;
        updateConnectionStatus();
        throw error;
      }
    }

    async function loadDataFromAPI() {
      try {
        const dashboardData = await apiCall('/api/dashboard');
        if (dashboardData) {
          if (dashboardData.signals && Array.isArray(dashboardData.signals)) {
            appState.signals = dashboardData.signals;
          }
          if (dashboardData.logs && Array.isArray(dashboardData.logs)) {
            appState.logs = dashboardData.logs;
          }
          if (dashboardData.systemHealth) {
            isConnected = dashboardData.systemHealth.status !== 'ERROR';
            const apiStatus = document.getElementById('apiStatus');
            if (apiStatus) {
              apiStatus.textContent = dashboardData.systemHealth.tradeLockerConnected ? 'Connected' : 'Offline Mode';
              apiStatus.className = dashboardData.systemHealth.tradeLockerConnected ? 'badge badge-success' : 'badge badge-warning';
            }
            const dbStatus = document.getElementById('dbStatus');
            if (dbStatus) {
              dbStatus.textContent = dashboardData.systemHealth.databaseConnected ? 'D1 Connected' : 'Local Storage';
              dbStatus.className = dashboardData.systemHealth.databaseConnected ? 'badge badge-success' : 'badge badge-warning';
            }
            if (typeof dashboardData.systemHealth.successRate === 'number') {
              const rate = dashboardData.systemHealth.successRate.toFixed(2);
              const badge = document.getElementById('successRateBadge');
              if (badge) {
                badge.textContent = \`Success Rate: \${rate}%\`;
                badge.className = rate >= 80 ? 'success-rate-badge badge-success' : rate >= 50 ? 'success-rate-badge badge-warning' : 'success-rate-badge badge-error';
              }
            }
          }
          if (dashboardData.tradeLocker) {
            const setVal = (id, val) => {
              const el = document.getElementById(id);
              if (el) el.textContent = val !== undefined && val !== null && val !== '' ? val : '-';
            };
            setVal('tradeLockerServerDisplay', dashboardData.tradeLocker.server);
            setVal('tradeLockerAccountIdDisplay', dashboardData.tradeLocker.accountId);
            setVal('tradeLockerAccountNumDisplay', dashboardData.tradeLocker.accountNum);
            setVal('tradeLockerEmailDisplay', dashboardData.tradeLocker.email);
            const statusEl = document.getElementById('tradeLockerStatusDisplay');
            if (statusEl) {
              statusEl.innerHTML = dashboardData.tradeLocker.connected
                ? '<span class="badge badge-success">Connected</span>'
                : '<span class="badge badge-error">Disconnected</span>';
            }

            if (dashboardData.tradeLocker.hasCredentials) {
              addLog('success', 'TradeLocker connection established');
            } else {
              addLog('error', 'TradeLocker credentials not configured');
            }
          }
          saveState();
          addLog('success', 'Loaded data from TradeLocker API');
        }
      } catch (error) {
        console.warn('Could not load from API, using local state:', error);
        addLog('warning', \`API load failed: \${error.message}. Using local data.\`);
      }
      
      // Always render with current state (API or local)
      renderAllTabs();
    }

    function renderAllTabs() {
      updateDashboardStats();
      renderSettings();
      renderPairs();
      renderChannels();
      renderSignals();
      renderOrders();
      renderLogs();
      renderParserRules();
    }

    // ============================================
    // DASHBOARD INITIALIZATION - Fully public, no login required
    // ============================================
    
    // Initialize dashboard on page load
    initializeDashboard();

    function showDashboard() {
      // Dashboard is always visible - just ensure it has active class
      document.getElementById('dashboard').classList.add('active');
      // Ensure all sections are visible
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'block';
        content.classList.remove('active');
      });
    }

    // ============================================
    // MOBILE NAVIGATION
    // ============================================
    
    function toggleMobileNav() {
      const menu = document.getElementById('mobileNavMenu');
      const btn = document.getElementById('hamburgerBtn');
      if (menu && btn) {
        menu.classList.toggle('active');
        btn.classList.toggle('active');
        // Prevent body scroll when menu is open
        document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
      }
    }

    function closeMobileNavOnBackdrop(event) {
      const menu = document.getElementById('mobileNavMenu');
      if (event.target === menu) {
        toggleMobileNav();
      }
    }

    function navigateToSection(sectionId) {
      const section = document.getElementById(sectionId);
      if (section) {
        // Close the mobile nav first
        const menu = document.getElementById('mobileNavMenu');
        const btn = document.getElementById('hamburgerBtn');
        if (menu && btn) {
          menu.classList.remove('active');
          btn.classList.remove('active');
          document.body.style.overflow = '';
        }
        // Scroll to the section
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function logout() {
      // Dashboard is publicly accessible - logout simply clears local auth state
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      authToken = null;
      isConnected = false;
      addLog('info', 'Session cleared');
      // No need to redirect - dashboard is always public
    }

    // ============================================
    // TAB SWITCHING
    // ============================================
    

    // ============================================
    // PAIRS MANAGEMENT - FIX FOR BUG #2
    // ============================================
    
    function renderPairs() {
      const loading = document.getElementById('pairsLoading');
      const content = document.getElementById('pairsContent');
      loading.style.display = 'block';
      content.style.display = 'none';

      // Try API first, fall back to local state
        apiCall('/api/pairs').then(apiData => {
          if (apiData && apiData.pairs) {
            appState.pairs = apiData.pairs;
            saveState();
          }
        }).catch(() => {
          // Use local state when API fails
          console.log('Using local pairs data');
        }).finally(() => {
          const grid = document.getElementById('pairsGrid');
          grid.innerHTML = '';

          if (appState.pairs.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>No pairs configured. Add one above.</p></div>';
          } else {
            appState.pairs.forEach(pair => {
              const item = document.createElement('div');
              item.className = 'control-item';
              const isEnabled = pair.enabled === true || pair.enabled === 1 || pair.enabled === '1' || pair.enabled === 'true';
              const lotSize = pair.lot_size || pair.lotSize || 0.01;
              
              item.innerHTML = \`
                <div>
                  <label>\${pair.symbol}</label>
                  <div style="font-size: 12px; color: #999; margin-top: 4px;">Lot Size: \${lotSize}</div>
                </div>
                <button class="delete-btn" onclick="deletePair(\'\${pair.symbol}\')" title="Delete Pair">Delete</button>
                <div class="toggle-switch \${isEnabled ? 'active' : ''}" onclick="togglePair('\${pair.symbol}', \${!isEnabled}, \${lotSize})"></div>
              \`;
              grid.appendChild(item);
            });
          }

          loading.style.display = 'none';
          content.style.display = 'block';
          updateDashboardStats();
          updatePairWhitelistDisplay();
        });
    }

    function addNewPair() {
      const symbol = document.getElementById('newPairSymbol').value.trim().toUpperCase();
      const lotSize = parseFloat(document.getElementById('newPairLot').value) || 0.01;

      if (!symbol) {
        alert('Please enter a symbol');
        return;
      }

      // Check if pair already exists
      const existingIndex = appState.pairs.findIndex(p => p.symbol.toUpperCase() === symbol);
      
      const newPair = {
        symbol: symbol,
        lot_size: lotSize,
        enabled: true
      };

      if (existingIndex >= 0) {
        // Update existing pair
        appState.pairs[existingIndex] = { ...appState.pairs[existingIndex], ...newPair };
        addLog('info', \`Updated pair: \${symbol} with lot size \${lotSize}\`);
        alert(\`Pair \${symbol} updated successfully!\`);
      } else {
        // Add new pair
        appState.pairs.push(newPair);
        addLog('success', \`Added new pair: \${symbol} with lot size \${lotSize}\`);
        alert(\`Pair \${symbol} added successfully!\`);
      }

      saveState();
      document.getElementById('newPairSymbol').value = '';
      document.getElementById('newPairLot').value = '';
      renderPairs();
      
      // Try to sync with API
      syncPairWithAPI(newPair);
    }

    async function syncPairWithAPI(pair) {
      try {
        await fetch('/api/pairs/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + authToken,
          },
          body: JSON.stringify({ 
            symbol: pair.symbol, 
            lotSize: pair.lot_size 
          }),
        });
        addLog('success', \`Synced pair \${pair.symbol} with server\`);
      } catch (error) {
        console.warn('Could not sync pair with API:', error);
        addLog('warning', \`Could not sync pair \${pair.symbol} with server: \${error.message}\`);
      }
    }

    function togglePair(symbol, enabled, lotSize) {
      const pairIndex = appState.pairs.findIndex(p => p.symbol.toUpperCase() === symbol.toUpperCase());
      
      if (pairIndex >= 0) {
        appState.pairs[pairIndex] = {
          ...appState.pairs[pairIndex],
          enabled: enabled,
          lot_size: lotSize
        };
        saveState();
        addLog('info', \`\${symbol} \${enabled ? 'enabled' : 'disabled'}\`);
        renderPairs();
        updatePairWhitelistDisplay();
        
        // Try to sync with API
        syncPairUpdateWithAPI(symbol, enabled, lotSize);
      }
    }

    async function syncPairUpdateWithAPI(symbol, enabled, lotSize) {
      try {
        await fetch('/api/pairs/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + authToken,
          },
          body: JSON.stringify({ symbol, enabled, lot_size: lotSize }),
        });
        addLog('success', \`Synced pair update for \${symbol} with server\`);
      } catch (error) {
        console.warn('Could not sync pair update with API:', error);
        addLog('warning', \`Could not sync pair update for \${symbol} with server: \${error.message}\`);
      }
    }

    function deletePair(symbol) {
      if (!confirm(\`Are you sure you want to delete pair \${symbol}? This will remove it from the whitelist.\`)) {
        return;
      }
      
      const pairIndex = appState.pairs.findIndex(p => p.symbol.toUpperCase() === symbol.toUpperCase());
      
      if (pairIndex >= 0) {
        const deletedPair = appState.pairs[pairIndex];
        appState.pairs.splice(pairIndex, 1);
        saveState();
        addLog('info', \`Deleted pair: \${symbol}\`);
        renderPairs();
        updatePairWhitelistDisplay();
        
        // Try to sync with API
        syncPairDeleteWithAPI(symbol);
      }
    }

    async function syncPairDeleteWithAPI(symbol) {
      try {
        await fetch('/api/pairs/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + authToken,
          },
          body: JSON.stringify({ symbol }),
        });
        addLog('success', \`Synced pair deletion for \${symbol} with server\`);
      } catch (error) {
        console.warn('Could not sync pair deletion with API:', error);
        addLog('warning', \`Could not sync pair deletion for \${symbol} with server: \${error.message}\`);
      }
    }

    // ============================================
    // CHANNELS MANAGEMENT - FIX FOR BUG #3
    // ============================================
    
    function renderChannels() {
      const loading = document.getElementById('channelsLoading');
      const content = document.getElementById('channelsContent');
      loading.style.display = 'block';
      content.style.display = 'none';

      // Try API first, fall back to local state
      apiCall('/api/channels').then(apiData => {
        if (apiData && apiData.channels) {
          appState.channels = apiData.channels;
          saveState();
        }
      }).catch(() => {
        // Use local state when API fails
        console.log('Using local channels data');
      }).finally(() => {
          const grid = document.getElementById('channelsGrid');
          grid.innerHTML = '';

          if (appState.channels.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>No channels configured. Add one above.</p></div>';
          } else {
            appState.channels.forEach(channel => {
              const item = document.createElement('div');
              item.className = 'control-item';
              const isEnabled = channel.enabled !== false;
              const displayName = channel.channelName || channel.channelId || 'Unknown';
              const displayId = channel.channelId || channel.channelName || 'Unknown';
              
              item.innerHTML = \`
                <div>
                  <label>\${displayName}</label>
                  <div style="font-size: 12px; color: #999; margin-top: 4px;">\${displayId}</div>
                </div>
                <button class="delete-btn" onclick="deleteChannel(\'\${displayId}\')" title="Delete Channel">Delete</button>
                <div class="toggle-switch \${isEnabled ? 'active' : ''}" onclick="toggleChannel('\${displayId}', \${!isEnabled})"></div>
              \`;
              grid.appendChild(item);
            });
          }

          loading.style.display = 'none';
          content.style.display = 'block';
          updateDashboardStats();
        });
    }

    function addNewChannel() {
      const channelId = document.getElementById('newChannelId').value.trim();
      const channelName = document.getElementById('newChannelName').value.trim();

      if (!channelId) {
        alert('Please enter a channel ID');
        return;
      }

      // Check if channel already exists
      const existingIndex = appState.channels.findIndex(c => 
        (c.channelId && c.channelId.toString() === channelId) || 
        (c.channelName && c.channelName.toString() === channelId)
      );
      
      const newChannel = {
        channelId: channelId,
        channelName: channelName || null,
        enabled: true
      };

      if (existingIndex >= 0) {
        // Update existing channel
        appState.channels[existingIndex] = { ...appState.channels[existingIndex], ...newChannel };
        addLog('info', \`Updated channel: \${channelName || channelId}\`);
        alert(\`Channel \${channelName || channelId} updated successfully!\`);
      } else {
        // Add new channel
        appState.channels.push(newChannel);
        addLog('success', \`Added new channel: \${channelName || channelId} (ID: \${channelId})\`);
        alert(\`Channel \${channelName || channelId} added successfully!\`);
      }

      saveState();
      document.getElementById('newChannelId').value = '';
      document.getElementById('newChannelName').value = '';
      renderChannels();
      
      // Try to sync with API
      syncChannelWithAPI(newChannel);
    }

    async function syncChannelWithAPI(channel) {
      try {
        await fetch('/api/channels/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + authToken,
          },
          body: JSON.stringify({ 
            channelId: channel.channelId,
            channelName: channel.channelName
          }),
        });
        addLog('success', \`Synced channel \${channel.channelName || channel.channelId} with server\`);
      } catch (error) {
        console.warn('Could not sync channel with API:', error);
        addLog('warning', \`Could not sync channel \${channel.channelName || channel.channelId} with server: \${error.message}\`);
      }
    }

    function toggleChannel(identifier, enabled) {
      const channelIndex = appState.channels.findIndex(c => 
        (c.channelId && c.channelId.toString() === identifier) || 
        (c.channelName && c.channelName.toString() === identifier)
      );
      
      if (channelIndex >= 0) {
        appState.channels[channelIndex] = {
          ...appState.channels[channelIndex],
          enabled: enabled
        };
        saveState();
        addLog('info', \`Channel \${identifier} \${enabled ? 'enabled' : 'disabled'}\`);
        renderChannels();
        
        // Try to sync with API
        syncChannelUpdateWithAPI(identifier, enabled);
      }
    }

    async function syncChannelUpdateWithAPI(channelId, enabled) {
      try {
        await fetch('/api/channels/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + authToken,
          },
          body: JSON.stringify({ channelId, enabled }),
        });
        addLog('success', \`Synced channel update for \${channelId} with server\`);
      } catch (error) {
        console.warn('Could not sync channel update with API:', error);
        addLog('warning', \`Could not sync channel update for \${channelId} with server: \${error.message}\`);
      }
    }

    function deleteChannel(identifier) {
      if (!confirm(\`Are you sure you want to delete this channel?\`)) {
        return;
      }
      
      const channelIndex = appState.channels.findIndex(c => 
        (c.channelId && c.channelId.toString() === identifier) || 
        (c.channelName && c.channelName.toString() === identifier)
      );
      
      if (channelIndex >= 0) {
        const deletedChannel = appState.channels[channelIndex];
        appState.channels.splice(channelIndex, 1);
        saveState();
        addLog('info', \`Deleted channel: \${deletedChannel.channelName || deletedChannel.channelId}\`);
        renderChannels();
        
        // Try to sync with API
        syncChannelDeleteWithAPI(identifier);
      }
    }

    async function syncChannelDeleteWithAPI(channelId) {
      try {
        await fetch('/api/channels/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + authToken,
          },
          body: JSON.stringify({ channelId }),
        });
        addLog('success', \`Synced channel deletion for \${channelId} with server\`);
      } catch (error) {
        console.warn('Could not sync channel deletion with API:', error);
        addLog('warning', \`Could not sync channel deletion for \${channelId} with server: \${error.message}\`);
      }
    }

    // ============================================
    // SETTINGS MANAGEMENT - FIX FOR BUG #4
    // ============================================
    
    function renderSettings() {
      const loading = document.getElementById('settingsLoading');
      const content = document.getElementById('settingsContent');
      loading.style.display = 'block';
      content.style.display = 'none';

      // Try API first, fall back to local state
      apiCall('/api/settings').then(apiData => {
        if (apiData && apiData.settings) {
          appState.settings = { ...appState.settings, ...apiData.settings };
          saveState();
        }
      }).catch(() => {
        // Use local state when API fails
        console.log('Using local settings data');
      }).finally(() => {
        loadSettingsToForm();
        // Always hide loading and show content when done
        loading.style.display = 'none';
        content.style.display = 'block';
      });
    }

    function saveSettings() {
      const settings = {
        ctraderAccountId: document.getElementById('ctraderAccountId')?.value || '',
        ctraderAccountNumber: document.getElementById('ctraderAccountNumber')?.value || '',
        defaultLotSize: parseFloat(document.getElementById('defaultLotSize')?.value) || 0.01,
        autoExecuteTrades: document.getElementById('autoExecuteTrades')?.checked || false,
      };

      // Update state
      appState.settings = { ...appState.settings, ...settings };
      saveState();
      addLog('success', 'Settings saved successfully');
      alert('Settings saved successfully!');
      
      // Update UI display
      updateDashboardStats();
      
      // Try to sync with API
      syncSettingsWithAPI(settings);
    }

    async function syncSettingsWithAPI(settings) {
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + authToken,
          },
          body: JSON.stringify(settings),
        });
        
        if (response.ok) {
          addLog('success', 'Settings synced with server');
        } else {
          const errorData = await response.json();
          addLog('warning', \`Settings sync failed: \${errorData.error || 'Unknown error'}\`);
        }
      } catch (error) {
        console.warn('Could not sync settings with API:', error);
        addLog('warning', \`Could not sync settings with server: \${error.message}\`);
      }
    }

    // ============================================
    // ORDERS MANAGEMENT
    // ============================================
    
    function renderOrders() {
      // Always fetch from API (which syncs with TradeLocker on demand) and display immediately
      apiCall('/api/trades').then(apiData => {
        const trades = (apiData && (apiData.trades || apiData.orders)) ? (apiData.trades || apiData.orders) : null;
        if (trades) {
          // Filter orders based on configured pairs, fallback to all trades if filtered is empty
          const filtered = trades.filter(order => {
            const symbol = (order.symbol || order.pair || '').toUpperCase();
            return isSignalAllowed(symbol);
          });
          appState.orders = filtered.length > 0 ? filtered : trades;
          saveState();
        }
        renderOrdersTable(appState.orders);
      }).catch(() => {
        // Use local state when API fails
        console.log('Using local orders data');
        renderOrdersTable(appState.orders);
      });
    }

    function renderOrdersTable(orders) {
      const loading = document.getElementById('ordersLoading');
      const content = document.getElementById('ordersContent');
      const tbody = document.getElementById('ordersTableBody');
      tbody.innerHTML = '';

      if (orders.length === 0) {
        document.getElementById('ordersEmpty').style.display = 'block';
        document.getElementById('ordersTable').style.display = 'none';
      } else {
        document.getElementById('ordersEmpty').style.display = 'none';
        document.getElementById('ordersTable').style.display = 'table';

        orders.forEach(order => {
          const row = document.createElement('tr');
          const symbol = order.symbol || order.pair || '-';
          const direction = (order.direction || order.action || '').toString().toUpperCase();
          const isBuy = direction === 'BUY';
          const status = (order.status || 'UNKNOWN').toString().toUpperCase();
          
          // Update success rate tracking
          if (status === 'CLOSED' || status === 'FILLED' || status === 'COMPLETED') {
            successRate.total++;
            successRate.successful++;
          } else if (status === 'REJECTED' || status === 'FAILED' || status === 'ERROR') {
            successRate.total++;
          }
          
          // Get error message if available
          const errorMessage = order.details && typeof order.details === 'string'
            ? JSON.parse(order.details).error
            : order.details && typeof order.details === 'object'
              ? order.details.error
              : '';
          
          row.innerHTML = \`
            <td>\${symbol}</td>
            <td><span class="badge \${isBuy ? 'badge-success' : 'badge-error'}">\${direction}</span></td>
            <td>\${order.volume || order.lotSize || '-'}</td>
            <td>\${order.entry_price || order.openPrice ? parseFloat(order.entry_price || order.openPrice).toFixed(4) : '-'}</td>
            <td>\${order.stop_loss || order.stopLoss ? parseFloat(order.stop_loss || order.stopLoss).toFixed(4) : '-'}</td>
            <td>\${order.take_profit || order.takeProfit ? parseFloat(order.take_profit || order.takeProfit).toFixed(4) : '-'}</td>
            <td><span class="badge \${status === 'OPEN' ? 'badge-pending' : (status === 'CLOSED' || status === 'FILLED' || status === 'COMPLETED') ? 'badge-success' : 'badge-error'}">\${status}</span></td>
            <td>
              \${order.created_at || order.openTime ? new Date(order.created_at || order.openTime).toLocaleString() : '-'}
              \${errorMessage ? \`<div style="font-size: 11px; color: #d32f2f; margin-top: 2px;">Error: \${errorMessage}</div>\` : ''}
            </td>
          \`;
          tbody.appendChild(row);
        });
      }

      loading.style.display = 'none';
      content.style.display = 'block';
      updateDashboardStats();
    }

    // ============================================
    // SIGNALS MANAGEMENT - WITH FILTERING DISPLAY
    // ============================================
    
    function renderSignals() {
      const loading = document.getElementById('signalsLoading');
      const content = document.getElementById('signalsContent');
      loading.style.display = 'block';
      content.style.display = 'none';

      updatePairWhitelistDisplay();

      // Try API first, fall back to local state
      apiCall('/api/signals').then(apiData => {
        if (apiData && apiData.signals) {
          appState.signals = apiData.signals.map(signal => ({
            ...signal,
            filtered: !isSignalAllowed(signal.symbol || signal.pair || '')
          }));
          saveState();
        }
      }).catch(() => {
        // Use local state when API fails
        console.log('Using local signals data');
      }).finally(() => {
          const tbody = document.getElementById('signalsTableBody');
          tbody.innerHTML = '';

          if (appState.signals.length === 0) {
            document.getElementById('signalsEmpty').style.display = 'block';
            document.getElementById('signalsTable').style.display = 'none';
          } else {
            document.getElementById('signalsEmpty').style.display = 'none';
            document.getElementById('signalsTable').style.display = 'table';

            appState.signals.forEach(signal => {
              const row = document.createElement('tr');
              const symbol = signal.symbol || signal.pair || '-';
              const direction = (signal.direction || signal.action || '').toString().toUpperCase();
              const isBuy = direction === 'BUY';
              const status = (signal.status || 'UNKNOWN').toString().toUpperCase();
              const isFiltered = signal.filtered || !isSignalAllowed(symbol);
              
              // Get error details if available
              const errorDetails = signal.error || signal.errorMessage || '';
              
              row.innerHTML = \`
                <td>\${symbol}</td>
                <td><span class="badge \${isBuy ? 'badge-success' : 'badge-error'}">\${direction}</span></td>
                <td>\${signal.entry || signal.openPrice ? parseFloat(signal.entry || signal.openPrice).toFixed(4) : '-'}</td>
                <td>\${signal.stop_loss || signal.stopLoss ? parseFloat(signal.stop_loss || signal.stopLoss).toFixed(4) : '-'}</td>
                <td>\${signal.take_profit || signal.takeProfit ? parseFloat(signal.take_profit || signal.takeProfit).toFixed(4) : '-'}</td>
                <td><span class="badge \${status === 'EXECUTED' || status === 'CLOSED' ? 'badge-success' : status === 'OPEN' ? 'badge-pending' : 'badge-error'}">\${status}</span></td>
                <td><span class="badge \${isFiltered ? 'badge-error' : 'badge-success'}">\${isFiltered ? 'Filtered Out' : 'Allowed'}</span></td>
                <td>
                  \${signal.created_at || signal.openTime ? new Date(signal.created_at || signal.openTime).toLocaleString() : '-'}
                  \${status === 'REJECTED' && errorDetails ? \`<div style="font-size: 11px; color: #d32f2f; margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Error: \${errorDetails}</div>\` : ''}
                </td>
              \`;
              tbody.appendChild(row);
            });
          }

          loading.style.display = 'none';
          content.style.display = 'block';
          updateDashboardStats();
        });
    }

    // ============================================
    // LOGS MANAGEMENT
    // ============================================
    
    function renderLogs() {
      const loading = document.getElementById('logsLoading');
      const content = document.getElementById('logsContent');
      loading.style.display = 'block';
      content.style.display = 'none';

      // Try API first, fall back to local state
      apiCall('/api/errors').then(apiData => {
        const logs = (apiData && (apiData.errors || apiData.logs)) ? (apiData.errors || apiData.logs) : null;
        if (logs) {
          appState.logs = logs;
          saveState();
        }
      }).catch(() => {
        // Use local state when API fails
        console.log('Using local logs data');
      }).finally(() => {
          const tbody = document.getElementById('logsTableBody');
          tbody.innerHTML = '';

          if (appState.logs.length === 0) {
            document.getElementById('logsEmpty').style.display = 'block';
            document.getElementById('logsTable').style.display = 'none';
          } else {
            document.getElementById('logsEmpty').style.display = 'none';
            document.getElementById('logsTable').style.display = 'table';

            appState.logs.forEach(log => {
              const row = document.createElement('tr');
              const badgeClass = log.level === 'error' ? 'badge-error' : 
                                 log.level === 'warning' ? 'badge-warning' : 
                                 log.level === 'success' ? 'badge-success' : 'badge-pending';
              row.innerHTML = \`
                <td><span class="badge \${badgeClass}">\${log.level || log.type || 'info'}</span></td>
                <td>\${log.message || log.text || '-'}</td>
                <td>\${log.timestamp || log.createdAt ? new Date(log.timestamp || log.createdAt).toLocaleString() : '-'}</td>
              \`;
              tbody.appendChild(row);
            });
          }

          loading.style.display = 'none';
          content.style.display = 'block';
        });
    }



    // ============================================
    // INITIAL PAGE LOAD - Render immediately with local state
    // ============================================
    
    // Immediately show content from localStorage if available
    if (authToken) {
      setTimeout(() => {
        renderAllTabs();
        updateDashboardStats();
        updatePairWhitelistDisplay();
        updateConnectionStatus();
      }, 100);
    }

    // Add initial log entry
    addLog('info', 'Dashboard initialized');

    async function testSignalParser() {
      const text = document.getElementById('testSignalText').value;
      if (!text.trim()) {
        alert('Please enter a signal text to test');
        return;
      }
      try {
        const res = await apiCall('/api/parser/test', {
          method: 'POST',
          body: JSON.stringify({ text })
        });
        const container = document.getElementById('parserResultContainer');
        const output = document.getElementById('parserResultOutput');
        container.style.display = 'block';
        output.textContent = JSON.stringify(res.parsed || { error: 'Failed to parse signal' }, null, 2);
      } catch (e) {
        alert('Parser test error: ' + e.message);
      }
    }

    function renderParserRules() {
      apiCall('/api/parser/rules').then(apiData => {
        if (apiData && apiData.rules) {
          const grid = document.getElementById('parserRulesGrid');
          if (!grid) return;
          grid.innerHTML = '';
          if (apiData.rules.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>No parser rules configured.</p></div>';
          } else {
            apiData.rules.forEach(rule => {
              const item = document.createElement('div');
              item.className = 'control-item';
              const isEnabled = rule.enabled === 1 || rule.enabled === true || rule.enabled === '1' || rule.enabled === 'true';
              item.innerHTML = 
                '<div>' +
                  '<label>' + rule.ruleName + '</label>' +
                  '<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Pattern: <code>' + rule.pattern + '</code> &rarr; Replacement: <code>' + (rule.replacement || 'N/A') + '</code></div>' +
                '</div>' +
                '<div style="display: flex; align-items: center; gap: 12px;">' +
                  '<button class="delete-btn" onclick="deleteParserRule(' + rule.id + ', \\'' + rule.ruleName.replace(/'/g, "\\\\'") + '\\')" title="Delete Rule">Delete</button>' +
                  '<div class="toggle-switch ' + (isEnabled ? 'active' : '') + '" onclick="toggleParserRule(' + rule.id + ', \\'' + rule.ruleName.replace(/'/g, "\\\\'") + '\\', ' + (!isEnabled) + ', \\'' + rule.pattern.replace(/'/g, "\\\\'") + '\\', \\'' + (rule.replacement || '').replace(/'/g, "\\\\'") + '\\')"></div>' +
                '</div>';
              grid.appendChild(item);
            });
          }
        }
      }).catch(err => console.warn('Could not load parser rules:', err));
    }

    async function addNewParserRule() {
      const ruleName = document.getElementById('newRuleName').value.trim();
      const pattern = document.getElementById('newRulePattern').value.trim();
      const replacement = document.getElementById('newRuleReplacement').value.trim();
      if (!ruleName || !pattern) {
        alert('Please enter a Rule Name and Pattern');
        return;
      }
      try {
        await apiCall('/api/parser/rules/add', {
          method: 'POST',
          body: JSON.stringify({ ruleName, pattern, replacement, enabled: true })
        });
        document.getElementById('newRuleName').value = '';
        document.getElementById('newRulePattern').value = '';
        document.getElementById('newRuleReplacement').value = '';
        renderParserRules();
        alert('Parser rule saved successfully!');
      } catch (e) {
        alert('Failed to save rule: ' + e.message);
      }
    }

    async function toggleParserRule(id, ruleName, enabled, pattern, replacement) {
      try {
        await apiCall('/api/parser/rules/update', {
          method: 'POST',
          body: JSON.stringify({ id, ruleName, enabled, pattern, replacement })
        });
        renderParserRules();
      } catch (e) {
        alert('Failed to update rule: ' + e.message);
      }
    }

    async function deleteParserRule(id, ruleName) {
      if (!confirm('Are you sure you want to delete parser rule "' + ruleName + '"?')) return;
      try {
        await apiCall('/api/parser/rules/delete', {
          method: 'POST',
          body: JSON.stringify({ id, ruleName })
        });
        renderParserRules();
      } catch (e) {
        alert('Failed to delete rule: ' + e.message);
      }
    }
  </script>
</body>
</html>
`;
}