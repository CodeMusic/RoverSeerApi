// Ruby executor using Opal (Ruby->JS) inside a Web Worker
// Loads Opal from CDN; later we can vendor locally for offline/CSP

export interface RubyExecRequest
{
  code: string;
}

export interface RubyExecResult
{
  stdout?: string;
  error?: string;
}

export const executeRuby = (payload: RubyExecRequest): Promise<RubyExecResult> =>
{
  return new Promise((resolve) =>
  {
    const worker = new Worker(
      URL.createObjectURL(
        new Blob([
`let opalLoaded = false;
async function loadOpal() {
  if (opalLoaded) { return; }
  try {
    // Try jsDelivr first (preferred)
    importScripts('https://cdn.jsdelivr.net/npm/opal@1.7.4/opal.min.js');
    importScripts('https://cdn.jsdelivr.net/npm/opal@1.7.4/opal-parser.min.js');
    opalLoaded = true;
  } catch (e1) {
    try {
      // Fallback to unpkg
      importScripts('https://unpkg.com/opal@1.7.4/opal.min.js');
      importScripts('https://unpkg.com/opal@1.7.4/opal-parser.min.js');
      opalLoaded = true;
    } catch (e2) {
      const err = new Error('Failed to load Opal runtime/parser (network/CSP).');
      err.cause = e2 || e1;
      throw err;
    }
  }
}

onmessage = async (e) => {
  try {
    await loadOpal();
    const code = (e.data && e.data.code ? String(e.data.code) : '').trim();
    let stdout = '';
    // Capture console output which Opal uses for puts/print
    const originalLog = console.log;
    console.log = (...args) => { stdout += (stdout ? '\n' : '') + args.map(a => String(a)).join(' '); };
    try {
      if (!code) {
        postMessage({ stdout: '' });
        return;
      }
      // Use Opal.compile to compile Ruby to JS
      if (!Opal || !Opal.compile) {
        throw new Error('Opal compiler not available.');
      }
      const compiled = Opal.compile(code);
      // Evaluate compiled JS in worker context
      const result = self.eval(compiled);
      const value = typeof result === 'undefined' ? '' : String(result);
      stdout = stdout || value;
      postMessage({ stdout });
    } catch (err) {
      const msg = (err && err.message) ? err.message : 'Ruby execution error';
      postMessage({ error: msg, stdout });
    } finally {
      console.log = originalLog;
    }
  } catch (err) {
    postMessage({ error: err && err.message ? err.message : 'Worker error' });
  }
};
`], { type: 'application/javascript' })
      )
    );

    worker.onmessage = (ev) => { resolve(ev.data as RubyExecResult); worker.terminate(); };
    worker.onerror = (err) => { resolve({ error: err.message }); worker.terminate(); };
    worker.postMessage(payload);
  });
};


