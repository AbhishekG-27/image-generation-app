"use client";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [numImages, setNumImages] = useState(1);
  const [showFullSizeImage, setShowFullSizeImage] = useState(false);

  const generateContent = async (prompt: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setPrompt("");
      
      const response = await fetch(`https://c806-106-219-152-216.ngrok-free.app/generate`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt, 
          num_images: numImages 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const fullUrl = `http://127.0.0.1:8000${data.image_url}`;
      setImageUrl(fullUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error: ${errorMessage}. Make sure the server is running at http://localhost:8000`);
      console.error('Error details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Full size image modal */}
      {showFullSizeImage && imageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullSizeImage(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-auto">
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-2 text-black hover:bg-gray-200 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullSizeImage(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={imageUrl} 
              alt="Generated (Full Size)" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            AI Image Generator
          </h1>
          <Link 
            href="/img2img" 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 transition-colors"
          >
            Go to Image-to-Image
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {/* Content Display Section */}
          <div className="bg-gray-50 rounded-lg shadow-lg p-4">
            <div className="w-1/2 mx-auto aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative">
              {error ? (
                <p className="text-red-500 text-center">{error}</p>
              ) : isLoading ? (
                <p className="text-gray-700">Generating image...</p>
              ) : imageUrl ? (
                <>
                  <img src={imageUrl} alt="Generated" className="w-full h-full object-cover rounded-lg" />
                  <button
                    className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                    onClick={() => setShowFullSizeImage(true)}
                    title="View larger image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v4m0 0v4m0-4h4m-4 0H6" />
                    </svg>
                  </button>
                </>
              ) : (
                <p className="text-gray-700">Generated image will appear here</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Input Section - Fixed at bottom */}
      <div className="sticky bottom-0 left-0 right-0 w-full bg-gray-50 border-t border-gray-200 shadow-lg p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-start">
            <div className="flex-shrink-0 flex items-center h-10">
              <select
                id="numImages"
                className="bg-white border border-gray-300 text-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-full"
                value={numImages}
                onChange={(e) => setNumImages(Number(e.target.value))}
                title="Number of images"
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'image' : 'images'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex flex-col">
              <textarea
                className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[2.5rem] max-h-[10rem] overflow-hidden"
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            </div>
            <div className="flex-shrink-0 self-end">
              <button
                type="button"
                className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition duration-200 disabled:opacity-50"
                onClick={() => generateContent(prompt)}
                disabled={isLoading || !prompt.trim()}
                title="Generate Image"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
