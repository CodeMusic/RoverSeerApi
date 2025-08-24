// Python executor using Pyodide inside a Web Worker
// Phase-1: load from CDN for quick integration; later we can serve locally

export interface PythonExecRequest
{
  code: string;
}

export interface PythonExecResult
{
  stdout?: string;
  stderr?: string;
  error?: string;
}

export const executePython = (payload: PythonExecRequest): Promise<PythonExecResult> =>
{
  return new Promise((resolve) =>
  {
    const worker = new Worker(
      URL.createObjectURL(
        new Blob([
`let pyodideReadyPromise;
let pyodide;
async function loadPyodideIfNeeded() {
  if (pyodideReadyPromise) { return pyodideReadyPromise; }
  const sources = [
    { js: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js', base: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' },
    { js: 'https://unpkg.com/pyodide@0.25.1/pyodide.js', base: 'https://unpkg.com/pyodide@0.25.1/' }
  ];
  let lastError;
  for (const src of sources) {
    try {
      importScripts(src.js);
      pyodideReadyPromise = self.loadPyodide({ indexURL: src.base });
      pyodide = await pyodideReadyPromise;
      return pyodide;
    } catch (e) {
      lastError = e;
      // try next source
    }
  }
  const err = new Error('Failed to load Pyodide (network/CSP).');
  err.cause = lastError;
  throw err;
}

onmessage = async (e) => {
  try {
    const { code } = e.data;
    const py = await loadPyodideIfNeeded();
    let stdout = '';
    let stderr = '';
    const originalStdout = py._module.print;
    const originalStderr = py._module.printErr;
    py._module.print = (text) => { stdout += (stdout ? '\n' : '') + String(text); };
    py._module.printErr = (text) => { stderr += (stderr ? '\n' : '') + String(text); };
    try {
      const result = await py.runPythonAsync(code);
      const value = typeof result === 'undefined' ? '' : String(result);
      postMessage({ stdout: stdout || value, stderr });
    } catch (err) {
      postMessage({ error: err && err.message ? err.message : 'Python error', stdout, stderr });
    } finally {
      py._module.print = originalStdout;
      py._module.printErr = originalStderr;
    }
  } catch (err) {
    const msg = err && err.message ? err.message : 'Worker error';
    postMessage({ error: msg });
  }
};
`], { type: 'application/javascript' })
      )
    );

    worker.onmessage = (ev) =>
    {
      resolve(ev.data as PythonExecResult);
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


