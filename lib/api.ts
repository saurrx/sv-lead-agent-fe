const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7600";

export async function uploadExcelToJson(file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/excel-to-json`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export type LinkedInLeadMaster = {
  id: number;
  created_at: string;
  file_name: string;
  total_rows: number;
};

export async function fetchLinkedInLeadsMaster(): Promise<LinkedInLeadMaster[]> {
  const res = await fetch(`${API_BASE}/linkedin-leads-master`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Fetch failed: ${res.status}`);
  }
  return res.json();
}

export type ExcelRow = {
  id: number;
  created_at?: string;
  excel_master_id?: number;
  rows_data?: {
    fullName?: string;
    defaultProfileUrl?: { text?: string };
  };
  indian?: string;
};

export async function fetchExcelRows(
  leadsMasterId: number
): Promise<ExcelRow[]> {
  const res = await fetch(
    `${API_BASE}/excel-rows?leadsMasterId=${encodeURIComponent(leadsMasterId)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Fetch failed: ${res.status}`);
  }
  return res.json();
}

export type QueryResultItem = { query: string };

export async function postQueryData(
  excelMasterId: number,
  query_text: string
): Promise<unknown> {
  const res = await fetch(`${API_BASE}/query-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ excelMasterId, query_text }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchQueryResults(excelMasterId: number): Promise<QueryResultItem[]> {
  const res = await fetch(`${API_BASE}/query-results/${excelMasterId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Fetch failed: ${res.status}`);
  }
  return res.json();
}

export type QueryResultDataRow = {
  id: number;
  created_at?: string;
  excel_master_id?: number;
  rows_data?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    title?: string;
    location?: string;
    defaultProfileUrl?: { text?: string };
  };
  indian?: string;
};

export async function fetchQueryResultsData(
  query: string
): Promise<QueryResultDataRow[]> {
  const res = await fetch(
    `${API_BASE}/query-results-data?query=${encodeURIComponent(query)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Fetch failed: ${res.status}`);
  }
  return res.json();
}
