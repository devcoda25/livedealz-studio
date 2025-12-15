
'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LocalMediaPreviewProps {
  camOn: boolean;
  micOn: boolean;
  screenShareOn: boolean;
}

export function LocalMediaPreview({ camOn, micOn, screenShareOn }: LocalMediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const { toast } = useToast();

  const stopCurrentStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    const enableCamera = async () => {
      stopCurrentStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: micOn, // Request audio based on mic state
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    const enableScreenShare = async () => {
      stopCurrentStream();
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true, // Always request audio for screen share
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);

        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
            // This logic might need to be handled in the parent component
            // to toggle `screenShareOn` state back to false.
            console.log('Screen share ended by user.');
        };

      } catch (err) {
        console.error("Error starting screen share.", err);
        setHasPermission(false);
        toast({
            variant: 'destructive',
            title: 'Screen Share Failed',
            description: 'Could not start screen sharing. Please grant permissions.',
        });
      }
    };

    if (screenShareOn) {
      enableScreenShare();
    } else if (camOn) {
      enableCamera();
    } else {
      stopCurrentStream();
    }

    return () => {
      stopCurrentStream();
    };
  }, [camOn, screenShareOn, micOn]); // Rerun when any of these change

  // This effect handles muting/unmuting the audio track without re-requesting the stream
  useEffect(() => {
    if (mediaStreamRef.current) {
        const audioTracks = mediaStreamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks[0].enabled = micOn;
        }
    }
  }, [micOn]);


  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted // Video should always be muted to prevent feedback loop
        className={`w-full h-full object-contain z-0 bg-secondary ${ (camOn || screenShareOn) ? '' : 'hidden'}`}
      />
      { !(camOn || screenShareOn) && (
        <div className="z-10 flex flex-col items-center text-center p-4">
             <span className="material-icons text-6xl text-muted-foreground">videocam_off</span>
             <p className="mt-2 text-muted-foreground">Camera is off</p>
        </div>
      )}
      { !hasPermission && (camOn || screenShareOn) && (
          <Alert variant="destructive" className="absolute bottom-4 left-4 right-4 w-auto z-20">
              <AlertTitle>Media Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera and microphone access to use this feature.
              </AlertDescription>
          </Alert>
      )}
    </>
  );
}
