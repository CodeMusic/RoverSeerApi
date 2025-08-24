// Lightweight SQL executor using sql.js in a Web Worker
// Phase-1: load sql.js from CDN for speed; later we can vendor assets locally

export interface SqlQueryRequest
{
  initSql?: string; // optional SQL to initialize schema/data
  query: string; // main query to run
}

export interface SqlQueryResult
{
  columns?: string[];
  rows?: Array<Array<string | number | null>>;
  error?: string;
}

export const executeSQL = (payload: SqlQueryRequest): Promise<SqlQueryResult> =>
{
  return new Promise((resolve) =>
  {
    const worker = new Worker(
      URL.createObjectURL(
        new Blob([
`let initTried = false;
let SQL;
let db;
async function ensureSqlJs() {
  if (SQL) { return; }
  const cdns = [
    { js: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js', base: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/' },
    { js: 'https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/sql-wasm.js', base: 'https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/' },
    { js: 'https://unpkg.com/sql.js@1.10.2/dist/sql-wasm.js', base: 'https://unpkg.com/sql.js@1.10.2/dist/' }
  ];
  let lastError;
  for (const src of cdns) {
    try {
      self.importScripts(src.js);
      SQL = await initSqlJs({ locateFile: (file) => src.base + file });
      return;
    } catch (e) {
      lastError = e;
    }
  }
  const err = new Error('Failed to load sql.js runtime (network/CSP).');
  err.cause = lastError;
  throw err;
}

onmessage = async (e) => {
  try {
    await ensureSqlJs();
    if (!db) {
      db = new SQL.Database();
    }
    const { initSql, query } = e.data;
    if (initSql) {
      try { db.exec(initSql); } catch (err) { /* ignore init errors */ }
    }
    const res = db.exec(query);
    if (res && res[0]) {
      const columns = res[0].columns || [];
      const rows = res[0].values || [];
      postMessage({ columns, rows });
    } else {
      postMessage({ columns: [], rows: [] });
    }
  } catch (err) {
    postMessage({ error: err && err.message ? err.message : 'SQL error' });
  }
};
`
        ], { type: 'application/javascript' })
      )
    );

    worker.onmessage = (ev) =>
    {
      resolve(ev.data as SqlQueryResult);
      worker.terminate();
    };
    worker.onerror = (err) =>
    {
      resolve({ error: err.message });
      worker.terminate();
    };

    worker.postMessage(payload);
  });
};


