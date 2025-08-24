export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extension: '.js', canRunInBrowser: true },
  { value: 'typescript', label: 'TypeScript', extension: '.ts', canRunInBrowser: true },
  { value: 'html', label: 'HTML', extension: '.html', canRunInBrowser: true },
  { value: 'python', label: 'Python', extension: '.py', canRunInBrowser: true },
  { value: 'java', label: 'Java', extension: '.java', canRunInBrowser: false },
  { value: 'csharp', label: 'C#', extension: '.cs', canRunInBrowser: false },
  { value: 'cpp', label: 'C++', extension: '.cpp', canRunInBrowser: false },
  { value: 'go', label: 'Go', extension: '.go', canRunInBrowser: false },
  { value: 'rust', label: 'Rust', extension: '.rs', canRunInBrowser: false },
  { value: 'ruby', label: 'Ruby', extension: '.rb', canRunInBrowser: true },
  { value: 'php', label: 'PHP', extension: '.php', canRunInBrowser: false },
  { value: 'sql', label: 'SQL', extension: '.sql', canRunInBrowser: true },
  { value: 'css', label: 'CSS', extension: '.css', canRunInBrowser: true },
  { value: 'json', label: 'JSON', extension: '.json', canRunInBrowser: true },
  { value: 'markdown', label: 'Markdown', extension: '.md', canRunInBrowser: true },
  { value: 'hcl', label: 'Terraform', extension: '.tf', canRunInBrowser: false },
  { value: 'bicep', label: 'Bicep', extension: '.bicep', canRunInBrowser: false },
  { value: 'powershell', label: 'PowerShell', extension: '.ps1', canRunInBrowser: false },
  { value: 'shell', label: 'Bash/Shell', extension: '.sh', canRunInBrowser: false },
] as const;

// Language-specific sample code for initializing the editor when switching languages
export const LANGUAGE_SAMPLES: Record<string, string> = {
  javascript: `// Write your code here\nconsole.log('Hello, JavaScript!');`,
  typescript: `// Write your code here\nfunction greet(name: string): string {\n  return 'Hello, ' + name + '!';\n}\n\nconsole.log(greet('TypeScript'));`,
  html: `<!doctype html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <title>HTML Sample</title>\n    <style>body { font-family: system-ui; padding: 2rem; }</style>\n  </head>\n  <body>\n    <h1>Hello, HTML!</h1>\n    <p>Edit this template and click Run.</p>\n  </body>\n</html>`,
  css: `/* CSS Playground */\nbody {\n  font-family: system-ui;\n  background: linear-gradient(120deg, #4f46e5, #06b6d4);\n  min-height: 100vh;\n}\n\n.main {\n  color: white;\n  padding: 2rem;\n}`,
  markdown: `# Hello, Markdown!\n\n- Edit this list\n- And click Run to preview\n\n**Bold** and _italic_ text.`,
  json: `{"hello": "json", "values": [1,2,3]}`,
  sql: `-- Try a SQL query\nCREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);\nINSERT INTO users (name) VALUES ('Ada'), ('Linus');\nSELECT * FROM users;`,
  python: `# Write your code here\nprint('Hello, Python!')`,
  ruby: `# Write your code here\nputs 'Hello, Ruby!'`,
  java: `// Java sample (non-executable in browser)\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, Java!");\n  }\n}`,
  csharp: `// C# sample (non-executable in browser)\nusing System;\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello, C#");\n  }\n}`,
  cpp: `// C++ sample (non-executable in browser)\n#include <iostream>\nint main() {\n  std::cout << "Hello, C++!" << std::endl;\n  return 0;\n}`,
  go: `// Go sample (non-executable in browser)\npackage main\nimport "fmt"\nfunc main() {\n  fmt.Println("Hello, Go!")\n}`,
  rust: `// Rust sample (non-executable in browser)\nfn main() {\n  println!("Hello, Rust!");\n}`,
  php: `<?php\n// PHP sample (non-executable in browser)\necho "Hello, PHP!";\n?>`,
  hcl: `# Terraform sample (non-executable in browser)\nterraform {\n  required_version = ">= 1.0.0"\n}`,
  bicep: `// Bicep sample (non-executable in browser)\nparam location string = resourceGroup().location`,
  powershell: `# PowerShell sample (non-executable in browser)\nWrite-Output "Hello, PowerShell!"`,
  shell: `#!/usr/bin/env bash\necho "Hello, Shell!"`
};

export const getLanguageSample = (lang: string): string => {
  const key = (lang || '').toLowerCase();
  return LANGUAGE_SAMPLES[key] ?? `// Write your code here\nconsole.log('Hello, ${key || 'world'}!');`;
};