import { JobConnector } from "./types";
import {
  LinkedInConnector,
  IndeedConnector,
  InternshalaConnector,
  NaukriConnector,
  FoundItConnector,
  ShineConnector,
  FreshersworldConnector,
  ApnaConnector,
  PlacementIndiaConnector,
  SimplyHiredConnector,
  GrabJobsConnector,
  TalentConnector
} from "./providers";

export const REGISTERED_CONNECTORS: JobConnector[] = [
  new LinkedInConnector(),
  new IndeedConnector(),
  new InternshalaConnector(),
  new NaukriConnector(),
  new FoundItConnector(),
  new ShineConnector(),
  new FreshersworldConnector(),
  new ApnaConnector(),
  new PlacementIndiaConnector(),
  new SimplyHiredConnector(),
  new GrabJobsConnector(),
  new TalentConnector()
];

export function getConnectorById(id: string): JobConnector | undefined {
  return REGISTERED_CONNECTORS.find(c => c.id === id);
}
