import React from 'react';
import { EffectComposer, DepthOfField, Bloom, Vignette, Noise } from '@react-three/postprocessing';

export function PostProcessingEffects() {
  return (
    <EffectComposer disableNormalPass>
      {/* 
        Depth of Field:
        focusDistance: normalized distance to focus (0 is camera, 1 is far clip)
        focalLength: typical real-world lens length equivalent
        bokehScale: size of the blur
      */}
      <DepthOfField 
        focusDistance={0.05} 
        focalLength={0.02} 
        bokehScale={5} 
        height={480} 
      />
      
      {/* 
        Bloom: 
        Adds a soft glow to bright surfaces (like our hero spotLight on the food) 
        Keeping intensity very low to maintain realism over sci-fi glow
      */}
      <Bloom 
        luminanceThreshold={0.8} 
        luminanceSmoothing={0.9} 
        intensity={0.4} 
      />

      {/* 
        Vignette: 
        Darkens the edges of the screen, subtly drawing the eye to the center 
        of the frame where the action is happening.
      */}
      <Vignette 
        eskil={false} 
        offset={0.1} 
        darkness={0.7} 
      />

      {/* 
        Noise: 
        Extremely subtle film grain to break up color banding and make the 
        render look like it was shot on a real camera sensor instead of feeling 
        too digitally synthetic.
      */}
      <Noise 
        opacity={0.035} 
      />
    </EffectComposer>
  );
}
