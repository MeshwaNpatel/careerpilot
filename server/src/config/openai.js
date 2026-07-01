import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1',
});

export default openai;
