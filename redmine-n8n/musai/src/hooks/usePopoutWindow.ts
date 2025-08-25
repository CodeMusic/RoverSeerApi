import { useRef, useEffect } from 'react';
import { executeHTML } from '@/utils/codeExecutor';

export const usePopoutWindow = (
  isOutputPopped: boolean,
  setIsOutputPopped: (value: boolean) => void,
  language: string,
  code: string,
  output: string
) => {
  const popoutWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    if (popoutWindowRef.current && !popoutWindowRef.current.closed) {
      const doc = popoutWindowRef.current.document;
      const outputElement = doc.getElementById('output');
      if (outputElement) {
        if (language === 'html') {
          const iframe = executeHTML(code);
          outputElement.innerHTML = '';
          outputElement.appendChild(iframe);
        } else {
          outputElement.innerHTML = `<pre class="whitespace-pre-wrap font-mono p-4">${output}</pre>`;
        }
      }
    }
  }, [output, language, code]);

  const handlePopOutput = () => {
    if (isOutputPopped && popoutWindowRef.current && !popoutWindowRef.current.closed) {
      popoutWindowRef.current.close();
      setIsOutputPopped(false);
      return;
    }

    const popoutWindow = window.open('', 'CodeOutput', 'width=600,height=400,resizable=yes');
    if (popoutWindow) {
      popoutWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Code Output</title>
            <style>
              body { 
                margin: 0;
                padding: 0;
                background: #1e1e1e;
                color: #fff;
                font-family: monospace;
              }
              #output {
                height: 100vh;
                width: 100%;
              }
              #output iframe {
                width: 100%;
                height: 100%;
                border: none;
                background: white;
              }
              pre {
                margin: 0;
                padding: 1rem;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
            </style>
          </head>
          <body>
            <div id="output">
              ${language === 'html' 
                ? ''
                : `<pre class="whitespace-pre-wrap font-mono p-4">${output}</pre>`}
            </div>
          </body>
        </html>
      `);
      popoutWindow.document.close();
      popoutWindowRef.current = popoutWindow;
      setIsOutputPopped(true);

      if (language === 'html') {
        const iframe = executeHTML(code);
        const outputElement = popoutWindow.document.getElementById('output');
        if (outputElement) {
          outputElement.innerHTML = '';
          outputElement.appendChild(iframe);
        }
      }

      popoutWindow.onbeforeunload = () => {
        setIsOutputPopped(false);
        return null;
      };
    }
  };

  return { handlePopOutput, popoutWindowRef };
};