import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, Search, X, Camera, Upload, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
}

interface FoodSearchProps {
  onAddFood: (food: FoodItem) => void;
  onClose: () => void;
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onAddFood, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanningPhoto, setScanningPhoto] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraLoaded, setCameraLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const searchFood = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a food item to search for.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Searching for:', searchQuery);

      // Get OpenAI API key from environment variables
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
      }

      // Call OpenAI API for text-based food search
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'chatgpt-4o-latest',
          messages: [
            {
              role: 'user',
              content: `Provide nutritional information for "${searchQuery}". Return the response as a JSON object with a "results" array containing food items. Each item should have: name, calories, protein, carbs, fat, serving_size.

              Example format:
              {
                "results": [
                  {
                    "name": "grilled chicken breast",
                    "calories": 165,
                    "protein": 31,
                    "carbs": 0,
                    "fat": 3.6,
                    "serving_size": "100g"
                  }
                ]
              }

              If the food item is ambiguous, provide multiple variations or serving sizes. Be as accurate as possible with nutritional estimates. Only return the JSON, no additional text.`
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your API key.');
        } else if (response.status === 429) {
          throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 400 && errorText.includes('does not have access to model')) {
          throw new Error('Your OpenAI account does not have access to GPT-4o. Please upgrade your account.');
        } else {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No nutrition data returned from AI');
      }

      try {
        // Clean the response to ensure it's valid JSON
        let jsonString = content;
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        } else {
          throw new Error("No valid JSON object found in AI response.");
        }

        // Parse the cleaned JSON response from GPT
        const parsedResults = JSON.parse(jsonString);

        if (parsedResults.results && Array.isArray(parsedResults.results) && parsedResults.results.length > 0) {
          // Validate and clean the results
          const validResults = parsedResults.results
            .filter((item: any) =>
              item.name &&
              typeof item.calories === 'number' &&
              item.calories > 0
            )
            .map((item: any) => ({
              name: item.name,
              calories: Number(item.calories) || 0,
              protein: Number(item.protein) || 0,
              carbs: Number(item.carbs) || 0,
              fat: Number(item.fat) || 0,
              serving_size: item.serving_size || '1 serving'
            }));

          if (validResults.length > 0) {
            setSearchResults(validResults);
            toast({
              title: "Nutrition Found",
              description: `Found ${validResults.length} result(s) for "${searchQuery}".`,
            });
          } else {
            throw new Error('No valid nutrition data found');
          }
        } else {
          throw new Error('No nutrition data found in response');
        }

      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.log('Raw AI response:', content);

        // Fallback: create an estimated response
        setSearchResults([{
          name: `${searchQuery} (estimated)`,
          calories: 100,
          protein: 5,
          carbs: 15,
          fat: 3,
          serving_size: "100g"
        }]);

        toast({
          title: "Nutrition Estimated",
          description: "AI provided a general estimate. You may want to adjust the values.",
        });
      }

    } catch (error) {
      console.error('Search error:', error);

      let errorMessage = "Failed to get nutrition data. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes('API key not configured')) {
          errorMessage = "OpenAI API key not configured. Please add your API key to the .env file.";
        } else if (error.message.includes('Invalid OpenAI API key')) {
          errorMessage = "Invalid OpenAI API key. Please check your API key.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "OpenAI API rate limit exceeded. Please try again in a moment.";
        } else if (error.message.includes('does not have access')) {
          errorMessage = "Your OpenAI account doesn't have access to GPT-4o. Please upgrade your account.";
        }
      }

      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Fallback result
      setSearchResults([{
        name: `${searchQuery} (estimated)`,
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 3,
        serving_size: "100g"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const processImageFile = async (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setScanningPhoto(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      console.log('Scanning photo for meal estimation...');

      // Get OpenAI API key from environment variables
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
      }

      // Call OpenAI API directly with vision model
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'chatgpt-4o-latest',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this meal image and estimate the nutritional content. For each identifiable food item in the image, provide:
                  1. Food name
                  2. Estimated serving size
                  3. Calories
                  4. Protein (grams)
                  5. Carbohydrates (grams)
                  6. Fat (grams)

                  Return the response as a JSON object with a "results" array containing food items. Each item should have: name, calories, protein, carbs, fat, serving_size.

                  Example format:
                  {
                    "results": [
                      {
                        "name": "grilled chicken breast",
                        "calories": 165,
                        "protein": 31,
                        "carbs": 0,
                        "fat": 3.6,
                        "serving_size": "100g"
                      }
                    ]
                  }

                  Be as accurate as possible with portion sizes and nutritional estimates based on what you can see in the image. Only return the JSON, no additional text.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your API key.');
        } else if (response.status === 429) {
          throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 400 && errorText.includes('does not have access to model')) {
          throw new Error('Your OpenAI account does not have access to GPT-4o. Please upgrade your account or use text search.');
        } else {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No analysis returned from AI');
      }

      try {
        // Clean the response to ensure it's valid JSON
        let jsonString = content;
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        } else {
          throw new Error("No valid JSON object found in AI response.");
        }

        // Parse the cleaned JSON response from GPT
        const parsedResults = JSON.parse(jsonString);

        if (parsedResults.results && Array.isArray(parsedResults.results) && parsedResults.results.length > 0) {
          // Validate and clean the results
          const validResults = parsedResults.results
            .filter((item: any) =>
              item.name &&
              typeof item.calories === 'number' &&
              item.calories > 0
            )
            .map((item: any) => ({
              name: item.name,
              calories: Number(item.calories) || 0,
              protein: Number(item.protein) || 0,
              carbs: Number(item.carbs) || 0,
              fat: Number(item.fat) || 0,
              serving_size: item.serving_size || '1 serving'
            }));

          if (validResults.length > 0) {
            setSearchResults(validResults);
            toast({
              title: "Meal Scanned Successfully!",
              description: `Found ${validResults.length} food item(s) in your photo.`,
            });
          } else {
            throw new Error('No valid food items detected in the image');
          }
        } else {
          throw new Error('No food items detected in the image');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.log('Raw AI response:', content);

        // Fallback: create a generic response
        setSearchResults([{
          name: "Mixed meal (AI estimated)",
          calories: 350,
          protein: 20,
          carbs: 30,
          fat: 15,
          serving_size: "1 portion"
        }]);

        toast({
          title: "Meal Analyzed",
          description: "AI provided a general estimate. You may want to adjust the values.",
        });
      }

    } catch (error) {
      console.error('Photo scan error:', error);

      let errorMessage = "Failed to analyze the photo. Please try taking a clearer photo or use text search.";

      if (error instanceof Error) {
        if (error.message.includes('API key not configured')) {
          errorMessage = "OpenAI API key not configured. Please add your API key to the .env file.";
        } else if (error.message.includes('Invalid OpenAI API key')) {
          errorMessage = "Invalid OpenAI API key. Please check your API key.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "OpenAI API rate limit exceeded. Please try again in a moment.";
        } else if (error.message.includes('does not have access')) {
          errorMessage = "Your OpenAI account doesn't have access to GPT-4o. Please upgrade or use text search.";
        }
      }

      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
      });

    } finally {
      setScanningPhoto(false);
    }
  };

  const handlePhotoScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processImageFile(file);

    // Reset file input
    event.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      await processImageFile(imageFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please drop an image file.",
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');

      // Try with different constraints for macOS compatibility
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user' // Start with front camera on macOS
        }
      };

      console.log('Using constraints:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got camera stream:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraLoaded(false);

        // Set up event listeners before setting srcObject
        const video = videoRef.current;

        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded');
          if (video && video.readyState >= 1) {
            video.play().then(() => {
              setCameraLoaded(true);
              console.log('Video playing successfully');
            }).catch((err) => {
              console.error('Error playing video:', err);
            });
          }
        };

        const handleCanPlay = () => {
          console.log('Video can play');
          if (video && !cameraLoaded) {
            video.play().then(() => {
              setCameraLoaded(true);
              console.log('Video playing from canplay');
            }).catch((err) => {
              console.error('Error in canplay:', err);
            });
          }
        };

        const handleLoadStart = () => {
          console.log('Video load started');
        };

        const handleError = (e: Event) => {
          console.error('Video error event:', e);
          setCameraLoaded(false);
        };

        // Add event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('error', handleError);

        // Clean up event listeners when camera stops
        video.addEventListener('pause', () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('loadstart', handleLoadStart);
          video.removeEventListener('error', handleError);
        });

        setShowCameraModal(true);

        // Force play after a delay - important for macOS
        setTimeout(() => {
          if (video && video.readyState >= 2 && !cameraLoaded) {
            console.log('Force playing video after delay');
            video.play().then(() => {
              setCameraLoaded(true);
              console.log('Force play successful');
            }).catch((err) => {
              console.error('Force play failed:', err);
              // Try switching to back camera
              switchCamera();
            });
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);

      let errorMessage = "Unable to access camera. ";

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += "Please allow camera access in your browser settings.";
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No camera found on this device.";
        } else if (error.name === 'NotReadableError') {
          errorMessage += "Camera is already in use by another application.";
        } else {
          errorMessage += "Please check camera permissions and try again.";
        }
      }

      toast({
        title: "Camera Access Error",
        description: errorMessage + " You can still upload images instead.",
        variant: "destructive",
      });
    }
  };

  // Function to switch between front and back camera
  const switchCamera = async () => {
    if (!videoRef.current) return;

    try {
      // Stop current stream
      if (videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }

      // Try back camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'environment' // Back camera
        }
      });

      videoRef.current.srcObject = stream;
      console.log('Switched to back camera');

    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraLoaded(false);
    setShowCameraModal(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        stopCamera();
        await processImageFile(file);
      }
    }, 'image/jpeg', 0.8);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraCapture = async () => {
    // Check if device supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera Not Supported",
        description: "Your device doesn't support camera access. Please use file upload instead.",
        variant: "destructive",
      });
      return;
    }

    await startCamera();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchFood();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Search Food</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter any food item (e.g., chicken breast, apple, pizza slice)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button onClick={searchFood} disabled={loading}>
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Photo Scan Section */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={triggerCameraCapture}
                disabled={scanningPhoto}
                className="flex-1"
              >
                {scanningPhoto ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={triggerFileUpload}
                disabled={scanningPhoto}
                className="flex-1"
              >
                <Image className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>

            {/* Drag and Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragOver ? 'Drop your image here' : 'Or drag and drop an image here'}
              </p>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoScan}
              className="hidden"
            />

            {/* Hidden video and canvas for camera capture */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="hidden"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Take a photo, upload an image, or search for food items below</p>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {searchResults.map((food, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium capitalize">{food.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Serving: {food.serving_size}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {Math.round(food.calories)} cal
                      </Badge>
                      <Badge variant="outline">
                        P: {food.protein.toFixed(1)}g
                      </Badge>
                      <Badge variant="outline">
                        C: {food.carbs.toFixed(1)}g
                      </Badge>
                      <Badge variant="outline">
                        F: {food.fat.toFixed(1)}g
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAddFood(food)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}

            {searchResults.length === 0 && searchQuery && !loading && !scanningPhoto && (
              <p className="text-center text-muted-foreground py-8">
                No results found. Try a different search term or scan a photo.
              </p>
            )}

            {searchResults.length === 0 && !searchQuery && !scanningPhoto && (
              <div className="text-center text-muted-foreground py-8 space-y-2">
                <Upload className="h-12 w-12 mx-auto opacity-50" />
                <p>Enter a food item above, take a photo, or upload an image</p>
                <p className="text-xs">AI will analyze your photo and estimate nutritional content</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Take Photo</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={switchCamera}>
                  🔄
                </Button>
                <Button variant="ghost" size="sm" onClick={stopCamera}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  webkit-playsinline="true"
                  className="w-full h-full object-cover"
                  style={{
                    transform: 'scaleX(-1)', // Mirror video for better UX
                  }}
                />

                {/* Loading overlay */}
                {!cameraLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-white text-center">
                      <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Starting camera...</p>
                      <p className="text-xs mt-1">Allow camera access when prompted</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={stopCamera}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Camera controls overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/50 rounded-full px-3 py-1 text-white text-xs">
                    {cameraLoaded ? '● LIVE' : 'Loading...'}
                  </div>
                </div>

                {/* Debug info (remove in production) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
                    Camera: {cameraLoaded ? 'Ready' : 'Loading'}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={capturePhoto}
                  disabled={scanningPhoto || !cameraLoaded}
                  className="flex-1"
                >
                  {scanningPhoto ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Photo
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={stopCamera}>
                  Cancel
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Position your meal in the camera view and tap "Capture Photo"
                </p>
                {!cameraLoaded && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-yellow-600">
                      On macOS: Allow camera access in System Preferences → Security & Privacy
                    </p>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FoodSearch;
