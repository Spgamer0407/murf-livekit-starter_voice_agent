'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useSessionContext, useVoiceAssistant } from '@livekit/components-react';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { AgentAudioVisualizerWave } from '@/components/agents-ui/agent-audio-visualizer-wave';

export function ShikshaVisualizer() {
  const { state: agentState, audioTrack: agentAudioTrack } = useVoiceAssistant();
  const { local } = useSessionContext();

  const micTrackRef = 'microphoneTrack' in local ? local.microphoneTrack : undefined;

  // Determine current visualizer mode based on the agent state.
  // If agent is speaking, show Terracotta waveform.
  // Otherwise, show user mic levels (Sage/Emerald bars).

  if (agentState === 'speaking') {
    return (
      <motion.div
        key="agent-speaking"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-full w-full min-h-0 flex-col items-center justify-center"
      >
        <div className="relative flex w-full flex-1 min-h-0 items-center justify-center">
          <AgentAudioVisualizerWave
            size="lg"
            state="speaking"
            color="#C2410C" // orange-700
            colorShift={0.1}
            lineWidth={3}
            audioTrack={agentAudioTrack}
            className="relative z-10 h-full w-full max-h-[140px] max-w-[140px]"
          />
        </div>
        <div className="mt-3 flex shrink-0 items-center gap-2">
          {/* Animated speaking indicator dots */}
          <div className="flex items-center gap-1.5">
            {[0, 0.15, 0.3].map((delay) => (
              <motion.span
                key={delay}
                className="inline-block size-2 rounded-full bg-orange-600"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Show user mic input (Bar Visualizer) when listening
  return (
    <motion.div
      key="user-listening"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full w-full min-h-0 flex-col items-center justify-center"
    >
      <div className="relative flex w-full flex-1 min-h-0 items-center justify-center">
        <AgentAudioVisualizerBar
          size="md"
          state="speaking"
          color="#059669" // emerald-600
          barCount={7}
          audioTrack={micTrackRef}
          className="relative z-10 h-full w-full max-h-[140px] max-w-[140px]"
        />
      </div>
      <div className="mt-3 flex shrink-0 items-center gap-2">
        {/* Mic pulse indicator */}
        <span className="relative flex size-3">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-emerald-600" />
        </span>
      </div>
    </motion.div>
  );
}
