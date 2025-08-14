import { N8N_ENDPOINTS } from '@/config/n8nEndpoints';
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';

export interface StartIntakeRequest {
  concern: string;
}

export interface IngestDocumentsRequest {
  files: Array<{ name: string; type: string; data: string }>;
}

export interface MedicalIntakeSummary {
  id: string;
  status: 'queued' | 'processing' | 'ready' | 'error';
}

class MedicalApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = N8N_ENDPOINTS.BASE_URL;
  }

  async startIntake(payload: StartIntakeRequest): Promise<MedicalIntakeSummary> {
    const res = await fetchWithTimeout(`${this.baseUrl}${N8N_ENDPOINTS.MEDICAL.START_INTAKE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 15000);
    if (!res.ok) throw new Error(`Medical intake failed: ${res.status}`);
    return res.json();
  }

  async ingestDocuments(payload: IngestDocumentsRequest): Promise<MedicalIntakeSummary> {
    const res = await fetchWithTimeout(`${this.baseUrl}${N8N_ENDPOINTS.MEDICAL.INGEST_DOCUMENTS}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 30000);
    if (!res.ok) throw new Error(`Medical documents ingest failed: ${res.status}`);
    return res.json();
  }
}

export const medicalApi = new MedicalApiService();


