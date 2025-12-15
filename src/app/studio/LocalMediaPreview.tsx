
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
    if (typeof window === 'undefined' || !window.BanubaSDK || !banubaMountRef.current || !camOn) {
      return;
    }

    let currentPlayer: Player | null = null;

    const initializeBanuba = async () => {
      try {
        const player = await window.BanubaSDK.create({ 
            clientToken: BANUBA_CLIENT_TOKEN,
            resourcePath: '/banuba-resources/', // Default path for public folder
            effectPlayerOptions: {
              camera: { selfieMode: false },
            }, 
        });

        player.use(window.BanubaSDK.UI);
        await player.setRenderTarget(banubaMountRef.current, 1);
        player.play();
        
        playerRef.current = player;
        currentPlayer = player;
        setHasPermission(true);

        if (activeFilter && activeFilter !== 'none') {
            player.loadEffect(activeFilter)
                .catch(e => console.error("Error loading initial Banuba effect:", e));
        }

      } catch (error) {
        console.error('Error initializing Banuba SDK:', error);
        setHasPermission(false);
        if (error instanceof Error && error.message.includes('license')) {
             toast({
              variant: 'destructive',
              title: 'AR License Invalid',
              description: 'The Banuba license token is missing or invalid. Please add your token.',
            });
        } else {
            toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please allow camera access in your browser to use AR filters.',
            });
        }
      }
    };
    
    initializeBanuba();
    
    return () => {
      if (currentPlayer) {
        currentPlayer.stop();
        currentPlayer.close();
      }
      playerRef.current = null;
    }

  }, [camOn, toast]);


  useEffect(() => {
    const player = playerRef.current;
    if (!player || !camOn) return;

    if (activeFilter && activeFilter !== 'none') {
        player.loadEffect(activeFilter)
          .catch(e => console.error("Error loading Banuba effect:", e));
    } else {
        player.clearEffect();
    }
  }, [activeFilter, camOn]);
  
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
                Please allow camera access and check your Banuba license token to use AR filters.
              </AlertDescription>
          </Alert>
      )}
    </>
  );
}
