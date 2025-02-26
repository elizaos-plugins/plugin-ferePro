import {
    elizaLogger,
    Service,
    IAgentRuntime,
    ServiceType,
    Memory,
    MemoryManager,
    stringToUuid
} from "@elizaos/core";

import WebSocket from 'ws';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import {
    FereAIChatResponse,
    IFereProService,
    FereAIAgentId
} from '../types/ferepro-types';

export class FereProAgentService extends Service implements IFereProService {
    apiKey: string;
    userId: string;
    baseUrl: string;
    agentId: FereAIAgentId;
    settings: {
        stream: boolean;
        contextDuration: number;
        parentId: string;
        debug: boolean;
    }

    static get serviceType(): ServiceType {
      return ServiceType.TEXT_GENERATION;
    }

    get serviceType(): ServiceType {
      return ServiceType.TEXT_GENERATION;
    }

    async initialize(runtime: IAgentRuntime): Promise<void> {
      this.apiKey = runtime.getSetting("FEREAI_API_KEY");
      this.userId = runtime.getSetting("FEREAI_USER_ID");
      this.baseUrl = "api.fereai.xyz";
      this.agentId = "ProAgent";
      this.settings = {
        stream: true,
        contextDuration: 1,
        parentId: "0",
        debug: false
      };

      if (!this.apiKey || !this.userId) {
        throw new Error("FEREAI_API_KEY or FEREAI_USER_ID is required");
      }
    }

    private getWebSocketUrl(userPrompt: string): string {
        const apiKey = this.apiKey;
        const userId = this.userId;
        const baseUrl = this.baseUrl;

        if (!apiKey || !userId || !baseUrl) {
            throw new Error('Missing required API configuration');
        }

        switch (this.agentId) {
            case 'ProAgent':
                return `wss://${baseUrl}/chat/v2/ws/${userId}?X-FRIDAY-KEY=${apiKey}`;
            case 'MarketAnalyzerAgent':
                return `wss://${baseUrl}/ws/generate_summary/${userId}?X-FRIDAY-KEY=${apiKey}`;
            default:
            throw new Error(`Unsupported agent: ${this.agentId}`);
        }
    }

    private createPayload(message: string) {
        const userTime = this.getUserTime();

        return {
            agent: this.agentId,
            stream: this.settings.stream ?? true,
            user_time: userTime.format(),
            x_hours: this.settings.contextDuration ?? 1,
            parent: this.settings.parentId === '0' ? 0 : this.settings.parentId ?? 0,
            message
        };
    }

    private getUserTime() {
        dayjs.extend(utc);
        dayjs.extend(timezone);
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const currentTimestamp = Date.now();
        return dayjs(currentTimestamp).tz(userTimezone);
    }

    private isValidResponse(value: unknown): value is FereAIChatResponse {
        return (
            typeof value === 'object' &&
            value !== null &&
            'answer' in value &&
            typeof (value as any).answer === 'string'
        );
    }

    async getFereproResponse(userPrompt: string): Promise<FereAIChatResponse> {

        return new Promise((resolve, reject) => {

            const wsUrl = this.getWebSocketUrl(userPrompt);
            const websocket = new WebSocket(wsUrl);
            let responseData: FereAIChatResponse | null;

            websocket.on('open', () => {
            elizaLogger.debug('WebSocket connection opened [Prompt]:', userPrompt);

            const payload = this.createPayload(userPrompt);
            elizaLogger.debug('Sending payload:', JSON.stringify(payload, null, 2));

            websocket.send(JSON.stringify(payload));
            });

            websocket.on('message', (data: WebSocket.Data) => {
            try {
                const message = data.toString();
                if (message.trim().startsWith('{')) {
                const response = JSON.parse(message);
                    if (this.isValidResponse(response)) {
                        responseData = response as FereAIChatResponse;
                    }
                }

                elizaLogger.debug('Received message:', message,"\n");

            } catch (error) {
                reject(error);
                websocket.close();
            }
            });

            websocket.on('error', (error: Error) => {
            reject(error);
            websocket.close();
            });

            websocket.on('close', () => {
            if (responseData) {
                elizaLogger.debug('Received response:', responseData,"\n");
                let result: any = null;

                const responseDataChat = responseData as FereAIChatResponse;
                elizaLogger.debug('Received response chat:', responseDataChat,"\n");

                result = responseDataChat;

                elizaLogger.debug('Returning result:', result,"\n");

                // Return the response
                resolve(result);

            } else {
                reject(new Error('WebSocket closed without receiving valid response'));
            }
            });
        });

    }

}
