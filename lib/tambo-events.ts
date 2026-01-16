export const QUERY_SUGGESTION_EVENT = "hawkeyes:query-suggestion";
export const FIX_QUERY_EVENT = "hawkeyes:fix-query";

export interface FixQueryEventDetail {
  query: string;
  error: string;
  tables: string[]; // table names like "hawkeye.hydrants"
}
