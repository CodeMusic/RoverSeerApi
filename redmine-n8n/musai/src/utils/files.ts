export async function fileToDataUri(file: File): Promise<string>
{
  return new Promise((resolve, reject) =>
  {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function arrayBufferToBase64DataUri(file: File): Promise<string>
{
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return `data:${file.type};base64,${base64}`;
}


