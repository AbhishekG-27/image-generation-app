"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

export default function ImageToImage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [showFullSizeImage, setShowFullSizeImage] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (sourceImage) {
        URL.revokeObjectURL(sourceImage);
      }
    };
  }, [sourceImage]);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    // Set the image preview URL
    const imageUrl = URL.createObjectURL(file);
    setSourceImage(imageUrl); // Assuming sourceImage is a URL string used for preview

    try {
      const result = await axios.post("http://localhost:8000/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setNotification({ message: `${result.data.original_filename} uploaded successfully`, type: "success" });
    } catch (error) {
      console.error("Upload error:", error);
      setNotification({ message: "Failed to upload image", type: "error" });
    }
  };

  const generateImage = async () => {
    if (!sourceImage) {
      setError("Please upload a source image first");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:8000/img2img`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt, 
          num_images: 1 
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
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all transform animate-fade-in ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

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
            Image-to-Image Generator
          </h1>
          <Link 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 transition-colors"
          >
            Go to Image Generator
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Source Image */}
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold mb-2 text-black">Source Image</h2>
                <div 
                  className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {sourceImage ? (
                    <img src={sourceImage} alt="Source" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-700 text-center p-4">
                      <p>Click to upload an image</p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </div>

              {/* Result Image */}
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold mb-2 text-black">Generated Image</h2>
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative">
                  {error ? (
                    <p className="text-red-500 text-center p-4">{error}</p>
                  ) : isLoading ? (
                    <p className="text-gray-700 p-4">Generating image...</p>
                  ) : imageUrl ? (
                    <>
                      <img 
                        src={imageUrl} 
                        alt="Generated" 
                        className="w-full h-full object-cover rounded-lg" 
                      />
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
                    <p className="text-gray-700 text-center p-4">Generated image will appear here</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Input Section - Fixed at bottom */}
      <div className="sticky bottom-0 left-0 right-0 w-full bg-gray-50 border-t border-gray-200 shadow-lg p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-start">
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
                onClick={generateImage}
                disabled={isLoading || !prompt.trim() || !sourceImage}
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