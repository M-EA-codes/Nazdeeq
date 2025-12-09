import config from '../config';

const CHATBOT_API_URL = config.CHATBOT_API_URL;

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  data?: any[];
}

export interface ChatResponse {
  response: string;
  data: any[];
  intent: string;
}

export const sendMessage = async (message: string): Promise<ChatResponse> => {
  const response = await fetch(`${CHATBOT_API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};
