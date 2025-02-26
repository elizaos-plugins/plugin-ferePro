import { Plugin } from "@elizaos/core";
import { FereProAgentService } from "./services/ferepro.service";
import { executeFerePro } from "./actions/ferePro";


export const fereProPlugin: Plugin = {
  name: "Fere Pro",
  description: "Answer questions about blockchain, cryptocurrencies, and related topics using a dedicated API.",
  actions: [executeFerePro],
  evaluators: [],
  providers: [],
  services: [new FereProAgentService()],
};

export default fereProPlugin;
