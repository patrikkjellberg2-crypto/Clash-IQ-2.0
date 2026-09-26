  clanSelectionTable,
  db,
  warPlannerAssignmentsTable,
} from "@workspace/db";
import {
  getArchivedWar,
  getPlayerWarHistory,
  listArchivedWars,
  listPlayerWarStats,
  listPlayerPerformance,
  snapshotCurrentWar,
  snapshotWarlog,
} from "../lib/war-archive";



/**
 * Recover completed wars with member-level attack data before Player Cards
 * read history. ClashKing exposes both a bulk previous-war endpoint and an
 * end-time-specific endpoint; the official warlog is used only to discover
 * additional completed war timestamps.
 */
async function recoverHistoricalWars(
  clanTag: string,
  log: { warn: (obj: object, message: string) => void },
  maxWars = 15,
): Promise<void> {
  const requested = normalizeClanTag(clanTag);
  const seen = new Set<string>();
