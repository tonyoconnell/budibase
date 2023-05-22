import { Automation, AutomationMetadata } from "../../documents"
import { Job } from "bullmq"

export interface AutomationDataEvent {
  appId?: string
  metadata?: AutomationMetadata
  automation?: Automation
}

export interface AutomationData {
  event: AutomationDataEvent
  automation: Automation
}

export type AutomationJob = Job<AutomationData>
