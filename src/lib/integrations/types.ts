export interface IntegrationSyncResult {
  success: boolean;
  provider: string;
  externalId?: string;
  status: string;
  data?: any;
  message?: string;
  error?: string;
  isManualFallback: boolean;
  timestamp: string;
}

export interface ExternalIntegration {
  name: string;
  syncRecord(recordId: number, agencyId: number, payload?: any): Promise<IntegrationSyncResult>;
}
