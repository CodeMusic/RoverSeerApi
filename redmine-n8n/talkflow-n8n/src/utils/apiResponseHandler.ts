import { toast } from "sonner";

export const handleApiResponse = async (response: Response) => {
  const responseText = await response.text();

  try {
    return responseText ? JSON.parse(responseText) : null;
  } catch (e) {
    console.log('Response is not JSON:', responseText);
    return responseText;
  }
};

export const handleApiError = (error: unknown) => {
  console.error('Error in webhook request:', error);
  
  let errorMessage = "Error sending message";
  
  if (error instanceof Error) {
    if (error.message === 'Request timed out') {
      errorMessage = "Request timed out. Please try again.";
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = "Network error. Please check your connection.";
    } else if (error.message.includes('401')) {
      errorMessage = "Authentication failed. Please check your credentials.";
    } else if (error.message.includes('500')) {
      errorMessage = "Server error. Please try again later.";
    }
  }
  
  toast.error(errorMessage);
  throw error;
};