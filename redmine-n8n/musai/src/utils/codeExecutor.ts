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