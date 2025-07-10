
import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisResultDisplay } from './components/AnalysisResultDisplay';
import { analyzeProposal } from './services/geminiService';
import { AnalysisResult } from './types';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/icons';

// Since we are loading pdfjs from a CDN, we need to declare it to TypeScript
declare const pdfjsLib: any;

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  useEffect(() => {
    // Set the workerSrc for pdf.js. This is crucial for it to work.
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs`;
    }
  }, []);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    setAnalysisResult(null);
    setError(null);
    setFileName(selectedFile ? selectedFile.name : '');
  }, []);

  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    return fullText;
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!file) {
      setError('กรุณาเลือกไฟล์ PDF ก่อนทำการวิเคราะห์');
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const extractedText = await extractTextFromPdf(file);
      if (!extractedText.trim()) {
        throw new Error('ไม่สามารถดึงข้อความจากไฟล์ PDF ได้ หรือไฟล์ PDF ไม่มีข้อความ');
      }
      const result = await analyzeProposal(extractedText);
      setAnalysisResult(result);
    } catch (err: unknown) {
      console.error('Analysis Error:', err);
      if (err instanceof Error) {
        setError(`เกิดข้อผิดพลาด: ${err.message}`);
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่รู้จักในระหว่างการวิเคราะห์');
      }
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  return (
    <div className="relative min-h-screen bg-primary-50 font-sans text-gray-800 overflow-hidden">
        {/* Watermark Layer */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-primary-900/5">
                 <p className="text-6xl sm:text-8xl font-semibold tracking-wider">KMUTNB</p>
                 <h1 className="text-9xl sm:text-[12rem] md:text-[15rem] font-bold tracking-tighter -mt-4 sm:-mt-8">
                    BMS
                 </h1>
            </div>
        </div>

      {/* Content Layer */}
      <div className="relative z-10">
        <Header />
        <main className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
          <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-800">อัปโหลดข้อเสนอโครงงาน</h2>
              <p className="text-lg sm:text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
                อัปโหลดไฟล์ PDF ข้อเสนอโครงงานของนักศึกษาเพื่อรับการวิเคราะห์และข้อเสนอแนะจากผู้ช่วยสอน AI
              </p>
            </div>

            <FileUpload onFileChange={handleFileChange} fileName={fileName} />
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleAnalyzeClick}
                disabled={!file || isLoading}
                className="flex items-center justify-center w-full sm:w-auto px-10 py-4 bg-primary-600 text-white text-lg font-bold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-300"
              >
                {isLoading && <LoadingSpinner />}
                {isLoading ? 'กำลังวิเคราะห์...' : 'เริ่มการวิเคราะห์'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-8 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow" role="alert">
              <p className="font-bold">เกิดข้อผิดพลาด</p>
              <p>{error}</p>
            </div>
          )}
          
          {analysisResult && !isLoading && (
            <div className="mt-10">
               <AnalysisResultDisplay result={analysisResult} />
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;
