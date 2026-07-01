export const COVER_LETTER_SYSTEM = `You are an expert career coach who writes compelling, personalized cover letters. Write a professional 3-paragraph cover letter (~300 words) based on the information provided. The letter should be warm, confident, and tailored to the specific role and company. Do not include a header, date, or signature — return only the body paragraphs as plain text.`;

export function buildCoverLetterUser({ companyName, roleTitle, whyInterested, resumeText }) {
  let prompt = `Company: ${companyName}\nRole: ${roleTitle}\nWhy I'm interested: ${whyInterested}`;
  if (resumeText) {
    prompt += `\n\nMy resume for context:\n${resumeText}`;
  }
  return prompt;
}
