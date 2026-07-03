import { UnifiedJob } from "../types";

export interface JobConnector {
  id: string;             // Unique identifier, e.g., "linkedin"
  name: string;           // Display name, e.g., "LinkedIn"
  
  /**
   * Fetches latest jobs from this provider
   * @param query Search keywords (e.g. "software engineer")
   * @param location Target location (e.g. "India")
   */
  fetchJobs(query: string, location: string): Promise<UnifiedJob[]>;
}
