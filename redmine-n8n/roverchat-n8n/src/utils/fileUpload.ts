export const createFormDataWithFile = async (input: string, sessionId: string, file?: File) => {
  const formData = new FormData();
  formData.append("chatInput", input);
  formData.append("sessionId", sessionId);

  if (file) {
    console.log('Processing file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const base64Data = await fileToBase64(file);
    console.log('File converted to base64:', {
      dataLength: base64Data.length,
      preview: base64Data.substring(0, 50) + '...'
    });

    formData.append("data", base64Data);
    formData.append("mimeType", file.type);
    formData.append("fileName", file.name);

    console.log('FormData created with file:', {
      hasData: formData.has('data'),
      hasMimeType: formData.has('mimeType'),
      hasFileName: formData.has('fileName')
    });
  }

  return formData;
};

const fileToBase64 = (file: File): Promise<string> => {
  console.log('Starting base64 conversion for file:', file.name);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64String.split(',')[1];
      console.log('Base64 conversion completed:', {
        originalLength: base64String.length,
        processedLength: base64Data.length
      });
      resolve(base64Data);
    };
    
    reader.onerror = (error) => {
      console.error('Error during base64 conversion:', error);
      reject(error);
    };
  });
};