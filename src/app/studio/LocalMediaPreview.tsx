
'use client';

import { useEffect, useRef } from 'react';

interface LocalMediaPreviewProps {
  camOn: boolean;
  micOn: boolean;
  screenShareOn: boolean;
}

export function LocalMediaPreview({ camOn, micOn, screenShareOn }: LocalMediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function getMedia() {
      // Stop previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (!camOn && !screenShareOn) {
        return;
      }

      try {
        let stream;
        if (screenShareOn) {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
        } else if (camOn) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: micOn,
          });
        }

        if (stream) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
        // Optionally, you could show an error message in the UI
      }
    }

    getMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [camOn, screenShareOn]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = micOn;
      });
    }
  }, [micOn]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-0 w-full h-full object-cover z-0 bg-secondary"
    />
  );
}
