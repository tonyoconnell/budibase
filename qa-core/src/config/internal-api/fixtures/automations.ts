import generator from "../../generator";
import { Automation, App } from "@budibase/types";
import { AutomationsResponse } from "./types/automations";

export const generateCompleteAutomation = (appId: Partial<App>, automation: AutomationsResponse): any => {
    const randomGuid = generator.guid();
    return {
        name: randomGuid,
        type: "automation",
        definition: {
            steps: []
        }
    }
}

export const generateAutomation = (): any => {
    const randomGuid = generator.guid();
    return {
        name: randomGuid,
        type: "automation",
        definition: {
            steps: []
        }
    }
}

