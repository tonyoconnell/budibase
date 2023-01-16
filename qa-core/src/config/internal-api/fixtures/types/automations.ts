import { Automation } from "@budibase/types";

export interface AutomationsDelResponse {
    ok: string;
    id: string;
    rev: string;
}

export interface AutomationsResponse {
    message: string;
    automation: Partial<Automation>;

}