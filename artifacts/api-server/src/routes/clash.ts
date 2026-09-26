import { Router, type IRouter } from "express";
import {
  GetClashDashboardResponse,
  GetClashDashboardQueryParams,
  GetWarPlannerQueryParams,
  GetWarPlannerResponse,
  UpsertWarPlannerAssignmentBody,
  UpsertWarPlannerAssignmentParams,
  UpsertWarPlannerAssignmentResponse,
} from "@workspace/api-zod";
import { asc, eq } from "drizzle-orm";
import {
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
