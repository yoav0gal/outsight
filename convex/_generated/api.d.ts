/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminTemplates from "../adminTemplates.js";
import type * as crons from "../crons.js";
import type * as devSeed from "../devSeed.js";
import type * as invites from "../invites.js";
import type * as patientAuth from "../patientAuth.js";
import type * as questionnaires from "../questionnaires.js";
import type * as sessionReviews from "../sessionReviews.js";
import type * as therapeuticTools from "../therapeuticTools.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminTemplates: typeof adminTemplates;
  crons: typeof crons;
  devSeed: typeof devSeed;
  invites: typeof invites;
  patientAuth: typeof patientAuth;
  questionnaires: typeof questionnaires;
  sessionReviews: typeof sessionReviews;
  therapeuticTools: typeof therapeuticTools;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
