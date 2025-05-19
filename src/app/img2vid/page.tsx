"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // Preview the image
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:8000/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Server returned ${response.status}: ${response.statusText}`);
      }

      // If successful, get the image path from response
      const data = await response.json();
      console.log('Upload successful:', data);
      
      // Close modal after successful upload
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setUploadError(`Error: ${errorMessage}`);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const generateVideo = async (prompt: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setPrompt("");
      
      const response = await fetch("http://localhost:8000/generate-video", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt,
          // If we have an uploaded image, send its reference
          image_path: uploadedImage ? uploadedImage : undefined 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const fullUrl = `http://127.0.0.1:8000${data.video_url}`;
      setVideoUrl(fullUrl);
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
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            AI Video Generator
          </h1>
          <Link 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 transition-colors"
          >
            Go to Image Generator
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {/* Video Display Section */}
          <div className="bg-gray-50 rounded-lg shadow-lg p-4">
            <div className="w-1/2 mx-auto aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              {error ? (
                <p className="text-red-500 text-center">{error}</p>
              ) : isLoading ? (
                <p className="text-gray-500">Generating video...</p>
              ) : videoUrl ? (
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full rounded-lg" 
                  autoPlay 
                  loop
                />
              ) : (
                <p className="text-gray-500">Generated video will appear here</p>
              )}
            </div>
          </div>
          
          {/* Image upload indicator */}
          {uploadedImage && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-md overflow-hidden mr-3">
                <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-green-800">Image successfully uploaded</p>
              </div>
              <button 
                className="text-red-500 hover:text-red-700" 
                onClick={() => setUploadedImage(null)}
                title="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Input Section - Fixed at bottom */}
      <div className="sticky bottom-0 left-0 right-0 w-full bg-gray-50 border-t border-gray-200 shadow-lg p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-start">
            <button
              type="button"
              className="h-10 w-10 flex-shrink-0 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center"
              onClick={() => setIsModalOpen(true)}
              title="Upload source image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex-1 flex flex-col">
              <textarea
                className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[2.5rem] max-h-[10rem] overflow-hidden"
                placeholder="Describe the video you want to generate..."
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
                onClick={() => generateVideo(prompt)}
                disabled={isLoading || !prompt.trim()}
                title="Generate Video"
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

      {/* Image Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upload Image</h3>
                <button 
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setIsModalOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {uploadError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {uploadError}
                </div>
              )}

              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleUploadClick}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">Uploading...</p>
                  </div>
                ) : uploadedImage ? (
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 mb-4 rounded-md overflow-hidden">
                      <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-green-600 font-medium">Image uploaded successfully!</p>
                    <p className="text-sm text-gray-500 mt-2">Click to change image</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-gray-700 font-medium mb-1">Drop your image here, or click to browse</p>
                    <p className="text-gray-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-300 transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-md ${
                    uploadedImage 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } transition-colors`}
                  onClick={() => setIsModalOpen(false)}
                  disabled={isUploading}
                >
                  {uploadedImage ? 'Confirm' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 