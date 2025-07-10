// This service now acts as a client to our OWN backend API route.
// It does NOT interact with the Google Gemini API directly and does NOT need the API key.

import { AnalysisResult } from '../types';

/**
 * Sends the proposal text to our secure backend API route for analysis.
 * @param proposalText The text extracted from the PDF file.
 * @returns A promise that resolves to an AnalysisResult object.
 */
export const analyzeProposal = async (proposalText: string): Promise<AnalysisResult> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ proposalText }),
    });

    if (!response.ok) {
      // Try to get a more specific error message from the API response body
      const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
      throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }

    const result: AnalysisResult = await response.json();
    return result;

  } catch (error) {
    console.error("Error calling our backend API:", error);
    if (error instanceof Error) {
        // Re-throw a more user-friendly error message
        throw new Error(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์วิเคราะห์ได้: ${error.message}`);
    }
    throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์วิเคราะห์");
  }
};
