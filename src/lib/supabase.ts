/**
 * Supabase client for reading classification data from the shared IRC database.
 * Used by Navigator's Ask Albert to query classification data cross-site.
 */

const SUPABASE_URL = 'https://qykjjfbdvwqxqmsgiebs.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5a2pqZmJkdndxeHFtc2dpZWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjg1NzcsImV4cCI6MjA4ODYwNDU3N30.N3XWpfTggpjHu8Kyw0DWnYnZvBqA1aVuWEJixo_ibAw';

const headers: Record<string, string> = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const baseUrl = `${SUPABASE_URL}/rest/v1/classifications`;

// snake_case → camelCase mapping
const toCamelMap: Record<string, string> = {
  classification_id: 'classificationId',
  emergency_name: 'emergencyName',
  expiration_date: 'expirationDate',
  processing_speed: 'processingSpeed',
  reclassification_number: 'reclassificationNumber',
  previous_severity: 'previousSeverity',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  total_affected: 'totalAffected',
  link_to_spreadsheet: 'linkToSpreadsheet',
  ipc4_used: 'ipc4Used',
  hazard_type: 'hazardType',
  sap_tracking: 'sapTracking',
  unique_id: 'uniqueId',
  date_request_received: 'dateRequestReceived',
  date_sent_for_entry: 'dateSentForEntry',
  date_reviewed: 'dateReviewed',
  date_approved: 'dateApproved',
  date_expiration_notice_sent: 'dateExpirationNoticeSent',
  who_engages_cp: 'whoEngagesCp',
  entry_by: 'entryBy',
  reviewed_by: 'reviewedBy',
  approved_by: 'approvedBy',
  notif_sent_by: 'notifSentBy',
  raised_with_cp_region: 'raisedWithCpRegion',
  code_number: 'codeNumber',
};

function mapToCamel(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    out[toCamelMap[key] || key] = row[key];
  }
  return out;
}

export interface Classification {
  id: string;
  classificationId: string;
  type: string;
  country: string;
  region: string;
  emergencyName: string;
  date: string;
  expirationDate: string;
  processingSpeed: string;
  reclassificationNumber: number;
  previousSeverity: number | null;
  metrics: Record<string, unknown>;
  severity: number;
  stance: string;
  notes: string;
  confidence: unknown;
  subnational: unknown;
  totalAffected: number | null;
  linkToSpreadsheet: string | null;
  ipc4Used: boolean | null;
  hazardType: string | null;
  sapTracking: string | null;
  uniqueId: string | null;
  dateRequestReceived: string | null;
  dateSentForEntry: string | null;
  dateReviewed: string | null;
  dateApproved: string | null;
  dateExpirationNoticeSent: string | null;
  whoEngagesCp: string | null;
  entryBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  notifSentBy: string | null;
  raisedWithCpRegion: string | null;
  codeNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all classifications from Supabase.
 * Returns an empty array on failure (non-blocking).
 */
export async function fetchClassifications(): Promise<Classification[]> {
  try {
    const res = await fetch(`${baseUrl}?order=date.desc.nullslast`, { headers });
    if (!res.ok) throw new Error(`Supabase: ${res.status}`);
    const rows = await res.json();
    return rows.map(mapToCamel) as Classification[];
  } catch (err) {
    console.warn('[Supabase] Failed to fetch classifications:', err);
    return [];
  }
}
