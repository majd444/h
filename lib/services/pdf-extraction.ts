/**
 * PDF Extraction Service
 * 
 * This service handles communication with the Python extraction service
 * to extract text from PDF files and other document formats.
 */

/**
 * Attempts to extract text from a file using the Python extraction service
 * @param fileBuffer The file buffer
 * @param fileName The name of the file
 * @returns The extracted text or null if extraction failed
 */
export async function extractTextWithPythonService(
  fileBuffer: Buffer,
  fileName: string
): Promise<string | null> {
  try {
    // Convert buffer to base64
    const base64Data = fileBuffer.toString('base64');
    
    // Call the Python extraction service
    const response = await fetch('http://localhost:5000/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_data: base64Data,
        file_name: fileName,
      }),
      // Set a reasonable timeout
      signal: AbortSignal.timeout(10000), // 10 seconds
    });
    
    if (!response.ok) {
      console.error(`Extraction service error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.text) {
      console.error('Extraction service returned no text');
      return null;
    }
    
    return data.text;
  } catch (error) {
    console.error('Error calling extraction service:', error);
    return null;
  }
}

/**
 * Checks if the Python extraction service is available
 * @returns True if the service is available, false otherwise
 */
export async function isPythonExtractionServiceAvailable(): Promise<boolean> {
  try {
    // Try to connect to the extraction service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch('http://localhost:5000/extract', {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);
    
    clearTimeout(timeoutId);
    
    return response !== null && response.status !== 404;
  } catch (error: unknown) {
    console.log('Python extraction service not available:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}
