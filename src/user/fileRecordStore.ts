import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';
import { request } from './serverApi';

export interface FileRecord {
  id: string;
  tool: string;
  fileName: string;
  fileSize: number | null;
  meta: Record<string, unknown> | null;
  createdAt: number;
}

const CAP = 200;

interface ServerFileRecord {
  id: string;
  tool: string;
  fileName: string;
  fileSize: number | null;
  meta: Record<string, unknown> | null;
  createdAt: number;
}

interface FileRecordsResponse {
  records: ServerFileRecord[];
}

interface FileRecordResponse {
  record: ServerFileRecord;
}

function isFileRecord(value: unknown): value is ServerFileRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const r = value as Record<string, unknown>;
  return typeof r.id === 'string'
    && typeof r.tool === 'string'
    && typeof r.fileName === 'string'
    && (r.fileSize === null || typeof r.fileSize === 'number')
    && (r.meta === null || (typeof r.meta === 'object' && r.meta !== null))
    && typeof r.createdAt === 'number';
}

function isFileRecordsResponse(value: unknown): value is FileRecordsResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const records = (value as { records?: unknown }).records;
  return Array.isArray(records) && records.every(isFileRecord);
}

function isFileRecordResponse(value: unknown): value is FileRecordResponse {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && isFileRecord((value as { record?: unknown }).record);
}

export const useFileRecordStore = defineStore('fileRecords', () => {
  const auth = useAuthStore();
  const records = ref<FileRecord[]>([]);
  const loaded = ref(false);

  let activeUserId: string | null = null;
  let generation = 0;

  function isCurrent(expectedGeneration: number, userId: string): boolean {
    return generation === expectedGeneration
      && activeUserId === userId
      && auth.status === 'authenticated'
      && auth.currentUser?.id === userId;
  }

  async function load(): Promise<void> {
    const userId = activeUserId;
    const expectedGeneration = generation;
    if (!userId || !isCurrent(expectedGeneration, userId)) return;
    try {
      const response = await request<FileRecordsResponse>('/api/me/files', {
        validate: isFileRecordsResponse
      });
      if (!isCurrent(expectedGeneration, userId)) return;
      records.value = response.records;
      loaded.value = true;
    } catch {
      if (!isCurrent(expectedGeneration, userId)) return;
      loaded.value = false;
    }
  }

  async function recordFile(
    tool: string,
    fileName: string,
    fileSize?: number,
    meta?: Record<string, unknown>
  ): Promise<void> {
    const userId = activeUserId;
    const expectedGeneration = generation;
    if (!userId || !isCurrent(expectedGeneration, userId)) return;
    try {
      const response = await request<FileRecordResponse>('/api/me/files', {
        method: 'POST',
        body: { tool, fileName, fileSize: fileSize ?? null, meta: meta ?? null },
        validate: isFileRecordResponse
      });
      if (!isCurrent(expectedGeneration, userId)) return;
      records.value = [response.record, ...records.value].slice(0, CAP);
    } catch {
      // Best effort
    }
  }

  async function clearAll(): Promise<void> {
    const userId = activeUserId;
    const expectedGeneration = generation;
    if (!userId || !isCurrent(expectedGeneration, userId)) return;
    try {
      await request<void>('/api/me/files', { method: 'DELETE' });
      if (!isCurrent(expectedGeneration, userId)) return;
      records.value = [];
    } catch {
      // Best effort
    }
  }

  watch(
    () => auth.status === 'authenticated' ? auth.currentUser?.id ?? null : null,
    (userId) => {
      generation += 1;
      activeUserId = userId;
      records.value = [];
      loaded.value = false;
      if (userId) void load();
    },
    { immediate: true, flush: 'sync' }
  );

  return { records, loaded, load, recordFile, clearAll };
});
