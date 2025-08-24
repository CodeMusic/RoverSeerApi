// Web Worker for executing JavaScript/TypeScript code
export const executeJavaScript = (code: string): Promise<{ result?: any; error?: string; logs?: string[] }> => {
  return new Promise((resolve) => {
    // Strip TypeScript types before execution
    const strippedCode = code
      .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
      .replace(/:\s*([A-Za-z<>[\](),\s]+)(?=[,);=\{])/g, '') // Remove type annotations, including function return types
      .replace(/[<>]([A-Za-z,\s[\]]+)[>]/g, '') // Remove generic type parameters
      .replace(/function\s+(\w+)\s*\(([\w\s,]*:[\w\s,]*)*\)/g, (match, name, params) => {
        // Clean function parameters
        const cleanParams = params ? params.split(',').map(param => param.split(':')[0].trim()).join(', ') : '';
        return `function ${name}(${cleanParams})`;
      })
      .trim();

    const worker = new Worker(
      URL.createObjectURL(
        new Blob([`
          const logs = [];
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
          };

          // Override console methods to capture logs
          console.log = (...args) => {
            logs.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          };
          console.error = (...args) => {
            logs.push('Error: ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          };
          console.warn = (...args) => {
            logs.push('Warning: ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          };
          console.info = (...args) => {
            logs.push('Info: ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          };

          self.onmessage = function(e) {
            try {
              const result = eval(e.data);
              self.postMessage({ 
                result: result === undefined ? undefined : 
                  typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
                logs 
              });
            } catch (error) {
              self.postMessage({ error: error.message, logs });
            }
          }
        `], { type: 'application/javascript' })
      )
    );

    worker.onmessage = (e) => {
      worker.terminate();
      resolve(e.data);
    };

    worker.onerror = (error) => {
      worker.terminate();
      resolve({ error: error.message });
    };

    worker.postMessage(strippedCode);
  });
};

// Execute HTML in a sandboxed iframe
export const executeHTML = (code: string): HTMLIFrameElement => {
  const iframe = document.createElement('iframe');
  iframe.sandbox.add('allow-scripts');
  iframe.srcdoc = code;
  iframe.className = 'w-full h-full border-0';
  return iframe;
};

// Execute CSS by injecting into a sandboxed iframe (style preview)
export const executeCSS = (css: string): HTMLIFrameElement => {
  const iframe = document.createElement('iframe');
  iframe.sandbox.add('allow-scripts');
  iframe.className = 'w-full h-full border-0';
  const html = `<!doctype html><html><head><style>${css}</style></head><body><div id="preview">CSS loaded.</div></body></html>`;
  iframe.srcdoc = html;
  return iframe;
};

// Execute Markdown by rendering into a sandboxed iframe using markdown-it (loaded in main thread)
export const executeMarkdown = async (markdown: string): Promise<HTMLIFrameElement> => {
  const { default: MarkdownIt } = await import('markdown-it');
  const md = new MarkdownIt({ html: true, linkify: true, breaks: true });
  const rendered = md.render(markdown);
  const iframe = document.createElement('iframe');
  iframe.sandbox.add('allow-scripts');
  iframe.className = 'w-full h-full border-0 bg-white';
  const html = `<!doctype html><html><head><meta charset="utf-8"/></head><body style="padding:16px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif;">${rendered}</body></html>`;
  iframe.srcdoc = html;
  return iframe;
};

// Validate and pretty-print JSON
export const executeJSON = (code: string): { result?: string; error?: string } => {
  try {
    const parsed = JSON.parse(code);
    const pretty = JSON.stringify(parsed, null, 2);
    return { result: pretty };
  } catch (e: any) {
    return { error: e?.message || 'Invalid JSON' };
  }
};