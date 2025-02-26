import {
    elizaLogger,
    ActionExample,
    Memory,
    IAgentRuntime,
    ModelClass,
    State,
    generateObject,
    composeContext,
    type Action,
    HandlerCallback,
} from "@elizaos/core";
import { FereProAgentService } from "../services/ferepro.service";

export const executeFerePro: Action = {
    name: "EXECUTE_FEREPRO",
    similes: [
        "BLOCKCHAIN_INFO",
        "CRYPTO_INFO",
        "DEFI_DETAILS",
        "NFT_DETAILS",
        "WEB3_INSIGHTS",
        "BLOCKCHAIN_RESEARCH",
        "CRYPTO_RESEARCH",
        "FIND_BLOCKCHAIN_INFO",
        "GET_CRYPTO_DATA",
    ],
    description:
        "Answer questions related to blockchain technology, cryptocurrencies, DeFi, NFTs, and Web3.",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        const apiKey = runtime.getSetting("FEREAI_API_KEY");
        const userId = runtime.getSetting("FEREAI_USER_ID");
        if (!apiKey || !userId) {
            elizaLogger.error("FEREAI_API_KEY or FEREAI_USER_ID is required");
            return false;
        }
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Fere Pro prompt received:", message.content.text);

        // Initialize the FerePro service
        const fereproService = new FereProAgentService();
        await fereproService.initialize(runtime);

        // Ensure state exists or generate a new one
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }


        try {
            const response = await fereproService.getFereproResponse(message.content.text);

            if (response.answer && response.answer !== "") {
                if (callback) {
                    callback({
                        text: response.answer,
                        content: { ...response },
                    });
                }
                return true;
            } else {
                elizaLogger.error("Invalid FerePro response:", response);
                if (callback) {
                    callback({
                        text: "Unable to process ferePro request. Please try again later.",
                        content: { error: "Invalid FerePro response" },
                    });
                }
                return false;
            }

        } catch (error) {
            console.error("Invalid FerePro response:", error);
            if (callback) {
                callback({
                    text: `Error processing message: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }

    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Tell me Solana memecoins which are greater than $100 million marketcap",
                    action: "EXECUTE_FEREPRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Tell me Base memecoins which are greater than $100 million marketcap",
                    action: "EXECUTE_FEREPRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Please tell me which ones would be a good buy in the current environment",
                    action: "EXECUTE_FEREPRO",
                    stream: true
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Compare the performance and social sentiment of the top 5 memecoins on Solana vs. Base. Highlight any significant differences and potential reasons",
                    action: "EXECUTE_FEREPRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Analyze the risk-adjusted returns of the top 10 trending tokens. Provide insights on which tokens offer the best risk-to-reward ratio",
                    action: "EXECUTE_FEREPRO",
                    stream: true,
                    debug: true,
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Using historical data and current trends, predict the potential performance of the top 5 AI tokens over the next week. Provide the rationale behind each prediction",
                    action: "EXECUTE_FEREPRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Top KOLs for DEGEN on Base",
                    action: "EXECUTE_FEREPRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Give me a detailed analysis of $degen token",
                    action: "EXECUTE_FEREPRO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Give me a summary of the latest crypto news today",
                    action: "EXECUTE_FEREPRO",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
