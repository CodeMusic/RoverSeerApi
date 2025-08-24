export const extractResponseContent = (data: any): string => {
  if (typeof data === 'string') return data;
  
  if (Array.isArray(data)) {
    const firstItem = data[0];
    if (!firstItem) return "No response content available";
    
    if (typeof firstItem === 'string') return firstItem;
    
    if (typeof firstItem === 'object') {
      if (firstItem.message?.content && firstItem.message?.role === 'assistant') {
        return firstItem.message.content;
      }
      
      const possibleContent = firstItem.message?.content || 
                            firstItem.content ||
                            firstItem.output ||
                            firstItem.text ||
                            firstItem.response;
                            
      if (possibleContent) return possibleContent;
      
      try {
        return JSON.stringify(firstItem);
      } catch (e) {
        console.warn('Failed to stringify response:', e);
        return "Unable to process response format";
      }
    }
  }
  
  if (typeof data === 'object') {
    if (data.message?.content && data.message?.role === 'assistant') {
      return data.message.content;
    }
    
    const possibleContent = data.message?.content || 
                          data.content ||
                          data.output ||
                          data.text ||
                          data.response;
                          
    if (possibleContent) return possibleContent;
    
    try {
      return JSON.stringify(data);
    } catch (e) {
      console.warn('Failed to stringify response:', e);
      return "Unable to process response format";
    }
  }
  
  return "Unexpected response format";
};

export const extractResponseThoughts = (data: any): string | undefined => {
  if (typeof data === 'object') {
    // Check for thoughts in various possible locations
    const possibleThoughts = data.thoughts || 
                            data.thinking || 
                            data.reasoning ||
                            data.internal_thoughts ||
                            data.cognitive_process;
    
    if (possibleThoughts) return possibleThoughts;
    
    // Check nested structures
    if (data.message?.thoughts) return data.message.thoughts;
    if (data.response?.thoughts) return data.response.thoughts;
    
    // Check array responses
    if (Array.isArray(data)) {
      const firstItem = data[0];
      if (firstItem && typeof firstItem === 'object') {
        return firstItem.thoughts || 
               firstItem.thinking || 
               firstItem.reasoning ||
               firstItem.internal_thoughts ||
               firstItem.cognitive_process;
      }
    }
  }
  
  return undefined;
};

// Extracts array of POV entries when present in response like:
// { pov: [{ name, type: 'logical'|'creative'|..., thought }], response: string }
export const extractResponsePov = (data: any): Array<{ name?: string; type?: string; thought: string }> | undefined => {
  try {
    if (!data) return undefined;

    // Handle array-wrapped payloads: [{ pov: [...], response: "..." }]
    if (Array.isArray(data)) {
      const first = data[0];
      if (first && typeof first === 'object' && Array.isArray((first as any).pov)) {
        return (first as any).pov
          .filter((p: any) => p && typeof p === 'object' && typeof p.thought === 'string')
          .map((p: any) => ({ name: p.name, type: p.type, thought: p.thought }));
      }
    }

    // Handle plain object payloads
    if (typeof data === 'object') {
      const pov = (data as any).pov;
      if (Array.isArray(pov)) {
        return pov
          .filter((p) => p && typeof p === 'object' && typeof p.thought === 'string')
          .map((p) => ({ name: p.name, type: p.type, thought: p.thought }));
      }
    }
  } catch (e) {
    console.warn('Failed to extract POV from response:', e);
  }
  return undefined;
};

// Extracts logical and creative thoughts when providers return alternate shapes
// Accepts many common variants, e.g. { logicalThought, creativeThought } or { logical, creative }
export const extractLogicalCreative = (data: any): { logical?: string; creative?: string } =>
{
  const pickFirstString = (obj: any, keys: string[]): string | undefined =>
  {
    if (!obj || typeof obj !== 'object') { return undefined; }
    for (const key of keys)
    {
      const value = (obj as any)[key];
      if (typeof value === 'string')
      {
        const trimmed = value.trim();
        if (trimmed) { return trimmed; }
      }
    }
    return undefined;
  };

  const searchObject = (obj: any, out: { logical?: string; creative?: string }): void =>
  {
    if (!obj || typeof obj !== 'object') { return; }
    // Common key variants we have seen across providers/workflows
    const logicalKeys = [
      'logicalThought', 'logical', 'logic', 'analysis', 'reasoning_logical', 'logical_reasoning'
    ];
    const creativeKeys = [
      'creativeThought', 'creative', 'creativity', 'imagination', 'reasoning_creative', 'creative_reasoning'
    ];

    out.logical = out.logical || pickFirstString(obj, logicalKeys);
    out.creative = out.creative || pickFirstString(obj, creativeKeys);

    // Explore nested common containers if needed
    if (!out.logical || !out.creative)
    {
      if (obj.message && typeof obj.message === 'object')
      {
        searchObject(obj.message, out);
      }
      if (obj.response && typeof obj.response === 'object')
      {
        searchObject(obj.response, out);
      }
      if (obj.data && typeof obj.data === 'object')
      {
        searchObject(obj.data, out);
      }
      if (Array.isArray(obj.items))
      {
        for (const item of obj.items) { searchObject(item, out); }
      }
    }
  };

  const result: { logical?: string; creative?: string } = {};
  if (Array.isArray(data))
  {
    for (const entry of data)
    {
      searchObject(entry, result);
      if (result.logical && result.creative) { break; }
    }
  }
  else
  {
    searchObject(data, result);
  }
  return result;
};