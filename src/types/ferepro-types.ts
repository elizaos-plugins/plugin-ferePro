import { Service, ServiceType } from "@elizaos/core";

// Type definitions for FereAI models and responses
export type FereAIAgentId = 'ProAgent' | 'MarketAnalyzerAgent' | 'Casso';

export interface FereAIMarketAnalyzerSummaryResponse {
  chat_id: string;
  summary: string;
  agent_version: string;
  agent_api_name: string;
  query_summary: string;
  is_summary: boolean;
  agent_credits: number;
  credits_available: number;
}

export interface FereAIChatResponse {
  answer: string;
  chat_id: string;
  representation: any[];
  agent_api_name: string;
  query_summary: string;
  agent_credits: number;
  credits_available: number;
}

export interface FereAIChatSettings {
  contextDuration?: number;
  parentId?: string;
  stream?: boolean;
  debug?: boolean;
}

// We'll temporarily use TEXT_GENERATION as our service type
// This is not ideal but allows us to work within current constraints
export const FEREPRO_SERVICE_TYPE = ServiceType.TEXT_GENERATION;

// Interface extending core Service
export interface IFereProService extends Service {
    apiKey: string;
    userId: string;
    baseUrl: string;
    agentId: FereAIAgentId;
    settings: FereAIChatSettings;
}
