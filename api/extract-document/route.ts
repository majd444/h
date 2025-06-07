import { NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

// Convert exec to promise-based version
const execAsync = promisify(exec);

/**
 * Extract text from PDF using the Python script
 */
async function extractTextWithPython(filePath: string): Promise<string> {
  try {
    // Path to the Python script in the project
    const scriptPath = path.join(process.cwd(), 'scripts', 'extract_text.py');
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      console.error('Python script not found:', scriptPath);
      return 'Error: Python extraction script not found.';
    }
    
    console.log(`Running Python script: ${scriptPath} with file: ${filePath}`);
    
    // Run the Python script with the file path
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath} "${filePath}"`);
    
    if (stderr && !stderr.includes('Python version')) {
      console.error('Python script error:', stderr);
    }
    
    // Clean the output by removing debug information
    let cleanedOutput = stdout || 'No text extracted';
    
    // Remove Python version and execution info
    cleanedOutput = cleanedOutput.replace(/Python version:.+?\n/g, '');
    cleanedOutput = cleanedOutput.replace(/Python executable:.+?\n/g, '');
    
    // Remove the extraction logging information
    cleanedOutput = cleanedOutput.replace(/Attempting to extract text from:.+?\n/g, '');
    cleanedOutput = cleanedOutput.replace(/File size:.+?\n/g, '');
    cleanedOutput = cleanedOutput.replace(/Starting text extraction...\n/g, '');
    cleanedOutput = cleanedOutput.replace(/Extraction complete\. Extracted \d+ characters\n*/g, '');
    
    return cleanedOutput.trim();
  } catch (error) {
    console.error('Error running Python script:', error);
    return `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Extract text from a file based on its type
 */
async function extractTextFromFile(buffer: Buffer, fileName: string): Promise<string> {
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Save buffer to temp file
    const tempFilePath = path.join(tempDir, fileName);
    fs.writeFileSync(tempFilePath, buffer);
    
    let result = '';
    
    try {
      // Handle different file types
      if (fileName.toLowerCase().endsWith('.pdf')) {
        // For PDF files, use Python extraction
        const sizeInKB = Math.round(buffer.length / 1024);
        
        // Add basic file info
        result = `# PDF Content: ${fileName}\n\n`;
        result += `## File Information\n`;
        result += `- **Filename:** ${fileName}\n`;
        result += `- **Size:** ${sizeInKB} KB\n\n`;
        
        // Extract text with Python
        const extractedText = await extractTextWithPython(tempFilePath);
        
        if (extractedText && !extractedText.startsWith('Error')) {
          result += `## Document Content\n\n${extractedText}`;
        } else {
          result += `## Extraction Notice\n\n`;
          result += `${extractedText || 'No text could be extracted from this PDF.'}\n`;
          result += `The document has been successfully uploaded and can be referenced by the chatbot.`;
        }
      } else if (fileName.toLowerCase().endsWith('.txt') || fileName.toLowerCase().endsWith('.md')) {
        // Simple text files
        const content = fs.readFileSync(tempFilePath, 'utf8');
        result = `# Text Content: ${fileName}\n\n${content}`;
      } else {
        // For other file types
        const sizeInKB = Math.round(buffer.length / 1024);
        result = `# Document: ${fileName}\n\n`;
        result += `File size: ${sizeInKB} KB\n\n`;
        result += `File type not supported for text extraction.`;
      }
    } finally {
      // Clean up temp file
      try { 
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (e) { 
        console.error('Error cleaning up temp file:', e);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error extracting text:', error);
    return `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * API route handler for document extraction
 */
export async function POST(request: Request) {
  try {
    // Get the uploaded file from the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    const fileName = file.name;
    const fileSize = file.size;
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = path.extname(fileName).toLowerCase();
    
    console.log(`Processing file: ${fileName} (${Math.round(fileSize / 1024)} KB)`);
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return NextResponse.json({ 
        error: 'File size exceeds the 10MB limit' 
      }, { status: 400 });
    }
    
    // Check file type
    const validExtensions = ['.pdf', '.docx', '.txt', '.md', '.csv', '.json'];
    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: `Unsupported file type: ${fileExtension}. Supported formats: PDF, DOCX, TXT, MD, CSV, JSON` 
      }, { status: 400 });
    }
    
    // Extract text from the file
    let extractedText;
    try {
      extractedText = await extractTextFromFile(buffer, fileName);
    } catch (extractError) {
      console.error('Error extracting text:', extractError);
      return NextResponse.json({ 
        error: `Failed to extract text from ${fileExtension} file` 
      }, { status: 500 });
    }
    
    // Return the extracted content
    return NextResponse.json({
      success: true,
      filename: fileName,
      fileType: fileExtension,
      fileSize: fileSize,
      extractedAt: new Date().toISOString(),
      content: extractedText,
      contentPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : '')
    });
  } catch (error) {
    console.error('Error in document extraction API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
