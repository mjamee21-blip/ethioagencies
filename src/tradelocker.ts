/**
 * TradeLocker REST API Service with D1 Database Instrument Persistence and Robust Retry/Rate-Limit Handling
 */

export interface TradeLockerConfig {
  apiUrl: string;
  email: string;
  password: string;
  server: string;
  accountId: number;
  accessToken?: string;
  developerApiKey?: string;
  accNum: number;
  db?: any;
}

export interface InstrumentInfo {
  id: number;
  name: string;
  symbol: string;
  routes: {
    TRADE: number;
    INFO: number;
  };
  precision?: number;
  lotSizeStep?: number;
}

export interface OrderRequest {
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  tradableInstrumentId: number;
  routeId: number;
  validity: 'GTC' | 'IOC';
  price?: number;
  stopPrice?: number;
  stopLoss?: number;
  stopLossType?: 'absolute' | 'offset' | 'trailingOffset';
  stopLossOffset?: number;
  takeProfit?: number;
  takeProfitType?: 'absolute' | 'offset';
  strategyId?: string;
}

export interface OrderResponse {
  d: {
    orderId: string;
  };
  s: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TradeLockerService {
  private config: TradeLockerConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;
  private instrumentsCache: Map<string, InstrumentInfo> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours cache to avoid rate limits
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 500; // 500ms between requests

  constructor(config: TradeLockerConfig) {
    this.config = config;
    this.accessToken = config.accessToken || null;
    this.refreshToken = config.accessToken ? 'default-refresh-token' : null;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
    await this.rateLimit();
    try {
      const response = await fetch(url, options);
      if (response.status === 429 && retries > 0) {
        console.warn(`[TradeLocker] Rate limited (429 / 1015). Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        console.warn(`[TradeLocker] Fetch error: ${error}. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }
    if (this.refreshToken) {
      try {
        await this.refreshAccessToken();
        return this.accessToken!;
      } catch (error) {
        console.error('[TradeLocker] Failed to refresh token, getting new token');
      }
    }
    return await this.getNewAccessToken();
  }

  private async getNewAccessToken(): Promise<string> {
    const url = `${this.config.apiUrl}/auth/jwt/token`;
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.config.email,
        password: this.config.password,
        server: this.config.server
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get JWT token: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    if (data.accessToken) {
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken || 'default-refresh-token';
      this.tokenExpiry = Date.now() + (data.expiresIn || 3600) * 1000;
      return this.accessToken;
    }
    throw new Error('Invalid JWT token response: missing accessToken');
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) throw new Error('No refresh token available');
    const response = await this.fetchWithRetry(`${this.config.apiUrl}/auth/jwt/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    if (!response.ok) throw new Error(`Failed to refresh token: ${response.status}`);
    const data: any = await response.json();
    if (data.accessToken) {
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken || this.refreshToken;
      this.tokenExpiry = Date.now() + (data.expiresIn || 3600) * 1000;
    }
  }

  async getInstruments(): Promise<InstrumentInfo[]> {
    const now = Date.now();
    if (this.instrumentsCache.size > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return Array.from(this.instrumentsCache.values());
    }

    // 1. Query D1 database first
    if (this.config.db) {
      try {
        const dbResult = await this.config.db.prepare("SELECT * FROM tradelocker_instruments").all();
        const dbRows = dbResult?.results || [];
        if (dbRows.length > 0) {
          this.instrumentsCache.clear();
          const instrumentsList: InstrumentInfo[] = [];
          for (const row of dbRows) {
            const routesObj = row.routes ? JSON.parse(row.routes) : { TRADE: 1, INFO: 1 };
            const instrumentInfo: InstrumentInfo = {
              id: Number(row.tradableInstrumentId || row.id),
              name: String(row.name),
              symbol: String(row.symbol),
              routes: routesObj,
            };
            instrumentsList.push(instrumentInfo);
            if (instrumentInfo.symbol) {
              this.instrumentsCache.set(instrumentInfo.symbol.toLowerCase().replace(/[^a-z0-9]/g, ''), instrumentInfo);
            }
            if (instrumentInfo.name && instrumentInfo.name !== instrumentInfo.symbol) {
              this.instrumentsCache.set(instrumentInfo.name.toLowerCase().replace(/[^a-z0-9]/g, ''), instrumentInfo);
            }
          }
          this.cacheTimestamp = now;
          return instrumentsList;
        }
      } catch (dbErr) {
        console.warn('[TradeLocker] Error querying D1 instruments, falling back to API:', dbErr);
      }
    }

    try {
      const token = await this.getAccessToken();
      const response = await this.fetchWithRetry(`${this.config.apiUrl}/trade/accounts/${this.config.accountId}/instruments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accNum': this.config.accNum.toString(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get instruments: ${response.status} - ${errorText}`);
      }

      const data: any = await response.json();
      const instruments = data.d?.instruments || data.data?.instruments || data.data || data.instruments || data.d || [];

      this.instrumentsCache.clear();
      const instrumentsList: InstrumentInfo[] = [];

      if (Array.isArray(instruments)) {
        for (const instrument of instruments) {
          const id = instrument.tradableInstrumentId || instrument.id || 0;
          const name = instrument.name || instrument.symbol || '';
          const sym = (instrument.symbol || instrument.name || name || '').toString();
          const routes = {
            TRADE: instrument.routes?.TRADE || instrument.routes?.[0]?.id || 1,
            INFO: instrument.routes?.INFO || instrument.routes?.[1]?.id || 1,
          };

          const instrumentInfo: InstrumentInfo = {
            id: Number(id),
            name: String(name),
            symbol: sym,
            routes,
            precision: instrument.precision,
            lotSizeStep: instrument.lotSizeStep,
          };

          instrumentsList.push(instrumentInfo);
          if (sym) {
            this.instrumentsCache.set(sym.toLowerCase().replace(/[^a-z0-9]/g, ''), instrumentInfo);
          }
          if (name && name !== sym) {
            this.instrumentsCache.set(String(name).toLowerCase().replace(/[^a-z0-9]/g, ''), instrumentInfo);
          }

          if (this.config.db) {
            try {
              await this.config.db.prepare(
                `INSERT OR REPLACE INTO tradelocker_instruments (tradableInstrumentId, name, symbol, description, type, routes, barSource, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
              ).bind(
                Number(instrument.tradableInstrumentId || instrument.id || 0),
                String(instrument.name || name),
                String(sym),
                String(instrument.description || ''),
                String(instrument.type || ''),
                JSON.stringify(instrument.routes || routes),
                String(instrument.barSource || ''),
                new Date().toISOString()
              ).run();
            } catch (insertErr) {}
          }
        }
      }

      this.cacheTimestamp = now;
      return instrumentsList;
    } catch (error) {
      if (this.config.db) {
        try {
          const dbResult = await this.config.db.prepare("SELECT * FROM tradelocker_instruments").all();
          const dbRows = dbResult?.results || [];
          if (dbRows.length > 0) {
            const instrumentsList: InstrumentInfo[] = [];
            for (const row of dbRows) {
              const routesObj = row.routes ? JSON.parse(row.routes) : { TRADE: 1, INFO: 1 };
              instrumentsList.push({
                id: Number(row.tradableInstrumentId || row.id),
                name: String(row.name),
                symbol: String(row.symbol),
                routes: routesObj,
              });
            }
            return instrumentsList;
          }
        } catch (fbErr) {}
      }
      throw error;
    }
  }

  async getInstrument(symbol: string): Promise<InstrumentInfo | null> {
    const normalizedSymbol = symbol.toLowerCase().replace(/[^a-z0-9]/g, '');
    let cached = this.instrumentsCache.get(normalizedSymbol);
    if (!cached) {
      for (const [key, inst] of this.instrumentsCache.entries()) {
        if (key.startsWith(normalizedSymbol) || normalizedSymbol.startsWith(key) || key.includes(normalizedSymbol) || normalizedSymbol.includes(key)) {
          cached = inst;
          break;
        }
      }
    }
    if (cached) return cached;

    await this.getInstruments();
    let found = this.instrumentsCache.get(normalizedSymbol) || null;
    if (!found) {
      for (const [key, inst] of this.instrumentsCache.entries()) {
        if (key.startsWith(normalizedSymbol) || normalizedSymbol.startsWith(key) || key.includes(normalizedSymbol) || normalizedSymbol.includes(key)) {
          found = inst;
          break;
        }
      }
    }
    return found;
  }

  async getTradableInstrumentId(symbol: string): Promise<number | null> {
    const instrument = await this.getInstrument(symbol);
    return instrument ? instrument.id : null;
  }

  async getRouteId(symbol: string, type: 'TRADE' | 'INFO' = 'TRADE'): Promise<number | null> {
    const instrument = await this.getInstrument(symbol);
    if (!instrument || !instrument.routes) return 1;
    return instrument.routes[type] || 1;
  }

  async placeOrder(order: OrderRequest): Promise<{ orderId: string | null; success: boolean; error?: string }> {
    try {
      const token = await this.getAccessToken();
      const response = await this.fetchWithRetry(`${this.config.apiUrl}/trade/accounts/${this.config.accountId}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accNum': this.config.accNum.toString(),
        },
        body: JSON.stringify(order)
      });

      const responseData: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorText = responseData.errmsg || responseData.message || JSON.stringify(responseData);
        return { success: false, orderId: null, error: `Failed to place order: ${response.status} - ${errorText}` };
      }

      const orderId = responseData.d?.orderId || responseData.d?.id || responseData.orderId || responseData.id || responseData.d?.orders?.[0]?.id || responseData.d?.[0]?.id || responseData.order_id;
      if (orderId) {
        return { success: true, orderId: orderId.toString() };
      } else {
        // If order was successfully placed (200/201) but response didn't explicitly have orderId, generate or fallback
        const fallbackId = responseData.d?.positionId || responseData.positionId || ('tl_' + Date.now());
        return { success: true, orderId: fallbackId.toString() };
      }
    } catch (error: any) {
      return { success: false, orderId: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getPositions(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const response = await this.fetchWithRetry(`${this.config.apiUrl}/trade/accounts/${this.config.accountId}/positions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accNum': this.config.accNum.toString(),
        },
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.d)) return data.d;
      if (Array.isArray(data.positions)) return data.positions;
      if (data.d && Array.isArray(data.d.positions)) return data.d.positions;
      if (data.data && Array.isArray(data.data.positions)) return data.data.positions;
      if (data.d && typeof data.d === 'object') {
        for (const val of Object.values(data.d)) {
          if (Array.isArray(val)) return val;
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  async getOrders(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const response = await this.fetchWithRetry(`${this.config.apiUrl}/trade/accounts/${this.config.accountId}/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accNum': this.config.accNum.toString(),
        },
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.d)) return data.d;
      if (Array.isArray(data.orders)) return data.orders;
      if (data.d && Array.isArray(data.d.orders)) return data.d.orders;
      if (data.data && Array.isArray(data.data.orders)) return data.data.orders;
      if (data.d && typeof data.d === 'object') {
        for (const val of Object.values(data.d)) {
          if (Array.isArray(val)) return val;
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
