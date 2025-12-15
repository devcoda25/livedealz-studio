
'use client';

import { useEffect, useRef } from 'react';

// Make DeepAR types available globally
declare global {
  interface Window {
    deepar: any;
  }
}

interface LocalMediaPreviewProps {
  camOn: boolean;
  micOn: boolean;
  screenShareOn: boolean;
}

export function LocalMediaPreview({ camOn, micOn, screenShareOn }: LocalMediaPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deepARRef = useRef<any | null>(null);

  useEffect(() => {
    async function initializeDeepAR() {
      if (!canvasRef.current || !camOn || !window.deepar) {
        if (deepARRef.current) {
          await deepARRef.current.shutdown();
          deepARRef.current = null;
        }
        return;
      }
      
      if (deepARRef.current) {
        return;
      }

      try {
        const newDeepAR = await window.deepar.initialize({
          licenseKey: 'your_license_key_here', // IMPORTANT: Replace with your DeepAR license key
          canvas: canvasRef.current,
          rootPath: '/deepar-resources', // Make sure these resources are in your public folder
           additionalOptions: {
             cameraConfig: {
                
             }
           }
        });
        
        deepARRef.current = newDeepAR;

        // Mute audio by default, parent component will control it
        newDeepAR.setAudioOutput(false);
        
      } catch (error) {
        console.error('DeepAR initialization failed:', error);
      }
    }

    // Delay initialization slightly to ensure the script has loaded
    const timer = setTimeout(() => {
      initializeDeepAR();
    }, 100);

    return () => {
      clearTimeout(timer);
      deepARRef.current?.shutdown();
      deepARRef.current = null;
    };
  }, [camOn]);

  useEffect(() => {
     if (deepARRef.current) {
       deepARRef.current.setAudioOutput(micOn);
     }
  }, [micOn]);

  // Handle screensharing separately as it doesn't use DeepAR
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    async function getScreenShareMedia() {
      if(videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      if (screenShareOn) {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing screen share.", err);
        }
      }
    }
    getScreenShareMedia();
  }, [screenShareOn])


  if(screenShareOn){
    return <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-0 bg-secondary" />
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full object-cover z-0 bg-secondary ${!camOn ? 'hidden' : ''}`}
    />
  );
}
