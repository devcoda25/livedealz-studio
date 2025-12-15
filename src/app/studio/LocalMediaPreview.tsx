
'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Player } from "@banuba/webar";

// Banuba Client Token. Replace with your actual token.
const BANUBA_CLIENT_TOKEN = "your_banuba_client_token";

declare global {
    interface Window {
        BanubaSDK: any;
    }
}

interface LocalMediaPreviewProps {
  camOn: boolean;
  micOn: boolean;
  screenShareOn: boolean;
  activeFilter: string | null;
}

export function LocalMediaPreview({ camOn, micOn, screenShareOn, activeFilter }: LocalMediaPreviewProps) {
  const playerRef = useRef<Player | null>(null);
  const banubaMountRef = useRef<HTMLDivElement>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.BanubaSDK || !banubaMountRef.current) {
      return;
    }

    const initializeBanuba = async () => {
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.close();
        playerRef.current = null;
      }
      
      try {
        const player = await window.BanubaSDK.create({ 
            clientToken: BANUBA_CLIENT_TOKEN,
            resourcePath: '/banuba-resources/',
            effectPlayerOptions: {
              camera: {
                // To avoid the unnecessary camera flips, we disable the face-tracking feature for the selfie camera.
                // We recommend you to keep this setting for a better user experience.
                //
                // See https://docs.banuba.com/face-ar-sdk-v1/web/web_camera#selfie-mode-and-camera-flip for more details
                selfieMode: false,
              },
            }, 
        });

        player.use(window.BanubaSDK.UI);
        player.setRenderTarget(banubaMountRef.current, 1);
        playerRef.current = player;
        setHasPermission(true);
      } catch (error) {
        console.error('Error initializing Banuba SDK:', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: 'AR Engine Failed',
          description: 'Could not initialize the AR engine. Please check your license token and resource paths.',
        });
      }
    };
    
    initializeBanuba();
    
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.close();
        playerRef.current = null;
      }
    }

  }, [toast]);


  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (camOn) {
      player.play();
    } else {
      player.stop();
    }
  }, [camOn]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (activeFilter && activeFilter !== 'none') {
        player.loadEffect(activeFilter)
          .catch(e => console.error("Error loading Banuba effect:", e));
    } else {
        player.clearEffect();
    }
  }, [activeFilter]);
  
  // NOTE: Screen sharing is not directly supported by the Banuba WebAR SDK in the same way as the camera.
  // This would require a more complex implementation, likely involving capturing the screen with getDisplayMedia,
  // rendering it to a hidden canvas, and feeding that canvas as a custom texture to a Banuba effect.
  // For now, we will disable screen sharing when using Banuba.

  return (
    <>
      <div 
        ref={banubaMountRef}
        className={`w-full h-full object-contain z-0 bg-secondary transition-all duration-300 ${ camOn ? '' : 'hidden'}`}
        style={{background: 'transparent'}}
      />
      
      { !camOn && (
        <div className="z-10 flex flex-col items-center text-center p-4">
             <span className="material-icons text-6xl text-muted-foreground">videocam_off</span>
             <p className="mt-2 text-muted-foreground">Camera is off</p>
        </div>
      )}

      { !hasPermission && camOn && (
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
