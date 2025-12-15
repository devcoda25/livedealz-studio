
'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LocalMediaPreviewProps {
  camOn: boolean;
  micOn: boolean;
  screenShareOn: boolean;
  activeFilter: string | null;
}

export function LocalMediaPreview({ camOn, micOn, screenShareOn, activeFilter }: LocalMediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getMedia = async () => {
      if (screenShareOn) {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          setHasPermission(true);
        } catch (error) {
          console.error('Error accessing screen share:', error);
          setHasPermission(false);
          toast({
            variant: 'destructive',
            title: 'Screen Share Failed',
            description: 'Could not start screen sharing.',
          });
          return;
        }
      } else if (camOn) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
          setHasPermission(true);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please allow camera access in your browser to use video.',
          });
          return;
        }
      }

      if (videoRef.current) {
        if (stream) {
          videoRef.current.srcObject = stream;
        } else {
          videoRef.current.srcObject = null;
        }
      }
    };
    
    getMedia();
    
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if(videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }

  }, [camOn, micOn, screenShareOn, toast]);

  return (
    <>
        <div className={`w-full h-full object-contain z-0 bg-secondary transition-all duration-300`}>
            <video ref={videoRef} className={`w-full h-full object-contain ${camOn || screenShareOn ? '' : 'hidden'}`} autoPlay muted playsInline />
        </div>
      
      { !(camOn || screenShareOn) && (
        <div className="z-10 flex flex-col items-center text-center p-4 absolute">
             <span className="material-icons text-6xl text-muted-foreground">videocam_off</span>
             <p className="mt-2 text-muted-foreground">Camera is off</p>
        </div>
      )}

      { !hasPermission && (camOn || screenShareOn) && (
          <Alert variant="destructive" className="absolute bottom-4 left-4 right-4 w-auto z-20">
              <AlertTitle>Media Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera and/or screen share access in your browser.
              </AlertDescription>
          </Alert>
      )}
    </>
  );
}
