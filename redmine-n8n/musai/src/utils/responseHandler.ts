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