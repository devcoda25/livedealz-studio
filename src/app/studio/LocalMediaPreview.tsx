
'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    deepar: any;
  }
}

interface LocalMediaPreviewProps {
  camOn: boolean;
  micOn: boolean;
  screenShareOn: boolean;
  activeFilterPath: string | null;
}

export function LocalMediaPreview({ camOn, micOn, screenShareOn, activeFilterPath }: LocalMediaPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const deepARRef = useRef<any | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const cleanupDeepAR = async () => {
    if (deepARRef.current) {
      console.log("Shutting down DeepAR.");
      await deepARRef.current.shutdown();
      deepARRef.current = null;
    }
  };
  
  const cleanupScreenShare = () => {
    if (screenStreamRef.current) {
      console.log("Stopping screen share tracks.");
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    async function initializeDeepAR() {
      // If cam is off, or canvas isn't ready, or DeepAR script isn't loaded, shut down.
      if (!camOn || !canvasRef.current || !window.deepar) {
        await cleanupDeepAR();
        return;
      }
      
      // If DeepAR is already running, no need to re-initialize.
      if (deepARRef.current) {
        return;
      }
      
      // Stop screen sharing if it's on
      cleanupScreenShare();

      console.log("Initializing DeepAR...");
      try {
        const newDeepAR = await window.deepar.initialize({
          licenseKey: 'your_license_key_here',
          canvas: canvasRef.current,
          rootPath: '/deepar-resources',
          additionalOptions: {
            cameraConfig: {
              // Facing mode can be 'environment' for back camera or 'user' for front
            }
          }
        });
        
        deepARRef.current = newDeepAR;
        console.log("DeepAR Initialized.");

        // Apply the initially active filter if there is one
        if (activeFilterPath) {
          console.log(`Applying initial filter: ${activeFilterPath}`);
          newDeepAR.switchEffect(activeFilterPath);
        }

      } catch (error) {
        console.error('DeepAR initialization failed:', error);
        toast({
          variant: 'destructive',
          title: 'AR Engine Failed',
          description: 'Could not initialize the AR filter engine. Please check your license key and camera permissions.',
        });
      }
    }

    initializeDeepAR();

    // The cleanup function for this effect will run when `camOn` changes.
    return () => {
      // This will be called when the component unmounts, or before re-running the effect.
      // We explicitly call cleanupDeepAR inside the effect logic, so this can be left empty
      // or we can add a final safety cleanup.
    };
  }, [camOn]);

  useEffect(() => {
    if (deepARRef.current) {
      deepARRef.current.setAudioOutput(micOn);
      console.log(`DeepAR audio output set to: ${micOn}`);
    }
  }, [micOn]);
  
  useEffect(() => {
    if (deepARRef.current && camOn) {
      const path = activeFilterPath === 'none' ? null : activeFilterPath;
      console.log(`Switching DeepAR effect to: ${path}`);
      deepARRef.current.switchEffect(path || 'none');
    }
  }, [activeFilterPath, camOn]);


  useEffect(() => {
    async function setupScreenShare() {
      if (!screenShareOn) {
        cleanupScreenShare();
        return;
      }
      
      // Ensure DeepAR is off before starting screen share
      await cleanupDeepAR();
      
      console.log("Starting screen share...");
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = !micOn; // Control mute based on micOn state
        }

        // When the user stops sharing via the browser UI
        stream.getVideoTracks()[0].onended = () => {
          console.log("Screen share ended by user.");
          cleanupScreenShare();
          // Optionally, turn the camera back on or update state
        };

      } catch (err) {
        console.error("Error starting screen share.", err);
        cleanupScreenShare();
        toast({
            variant: 'destructive',
            title: 'Screen Share Failed',
            description: 'Could not start screen sharing. Please grant permissions.',
        });
      }
    }

    setupScreenShare();
    
    return () => {
        cleanupScreenShare();
    }
  }, [screenShareOn]);

  useEffect(() => {
    if(videoRef.current && screenStreamRef.current){
        videoRef.current.muted = !micOn;
    }
  }, [micOn, screenShareOn])

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover z-0 bg-secondary ${!camOn || screenShareOn ? 'hidden' : ''}`}
      />
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        className={`absolute inset-0 w-full h-full object-contain z-0 bg-secondary ${!screenShareOn ? 'hidden' : ''}`} 
      />
    </>
  );
}
