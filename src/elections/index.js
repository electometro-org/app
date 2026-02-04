// Central election registry
// Add new elections by importing them here

import peru2026 from "./peru_2026";
import chile2025 from "./chile_2025";
import { configuredElectionIds } from "../config/appConfig";

// All available elections
const allElections = [
  peru2026,
  chile2025,
];

export const electionConfigs = Object.fromEntries(
  allElections.map(config => [config.id, config])
);

// Determine which elections are enabled:
// - If VITE_ELECTION_ID is set (single or multiple), only those elections are enabled
// - Otherwise, use elections with enabled: true in their config
export const enabledElections = configuredElectionIds.length > 0
  ? allElections.filter(config => configuredElectionIds.includes(config.id))
  : allElections.filter(config => config.enabled);

export function getElectionConfig(id) {
  return electionConfigs[id] || null;
}

export function getElectionIds() {
  return allElections.map(config => config.id);
}

export function getEnabledElectionIds() {
  return enabledElections.map(config => config.id);
}