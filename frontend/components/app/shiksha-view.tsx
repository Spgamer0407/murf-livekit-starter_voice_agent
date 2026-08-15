'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ConnectionState, Track } from 'livekit-client';
import {
  AlertTriangle,
  Clock,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAgent, useSessionContext, useTrackToggle } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { LiveTranscript } from './live-transcript';
import { ShikshaVisualizer } from './shiksha-visualizer';

interface ShikshaViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export function ShikshaView({ startButtonText, onStartCall }: ShikshaViewProps) {
  const session = useSessionContext();
  const { isConnected, connectionState, end } = session;
  const { state: agentState } = useAgent();
  const { toggle: toggleMic, enabled: isMicEnabled } = useTrackToggle({
    source: Track.Source.Microphone,
  });
  const isConnecting = connectionState === ConnectionState.Connecting;
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [hasHadSession, setHasHadSession] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((status) => {
          if (status.state === 'denied') {
            setMicError('Microphone permission denied');
          }
          status.onchange = () => {
            if (status.state === 'denied') {
              setMicError('Microphone permission denied');
            } else {
              setMicError(null);
            }
          };
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      setHasHadSession(true);
      setMicError(null);
      interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isConnected]);

  const handleStart = useCallback(() => {
    setSessionSeconds(0);
    setMicError(null);
    onStartCall();
  }, [onStartCall]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const hasMicError = !!micError;
  const isSessionEnded = !isConnected && !isConnecting && hasHadSession;
  const isReady = !isConnected && !isConnecting && !hasHadSession;

  return (
    <div className="relative flex h-full w-full flex-col transition-colors duration-700">
      <AnimatePresence>
        {hasMicError && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="relative z-10 mx-auto mt-4 flex w-full max-w-3xl items-center gap-4 rounded-xl border border-red-300 bg-red-50 p-4 shadow-md dark:border-red-900 dark:bg-red-950/50"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-200 dark:bg-red-900">
              <AlertTriangle className="size-5 text-red-700 dark:text-red-300" />
            </div>
            <div className="flex-1 font-sans">
              <h3 className="font-bold text-red-900 dark:text-red-100">
                Microphone Access Blocked
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                Please allow Microphone permissions to continue.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStart}
              className="shrink-0 rounded-lg border-red-400 font-sans font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900"
            >
              <RotateCcw className="mr-1.5 size-4" />
              Retry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-4 md:p-8">
        <AnimatePresence mode="wait">
          {/* STATE 1: READY */}
          {isReady && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="glass-panel flex w-full max-w-5xl flex-col items-center gap-10 rounded-[2rem] p-10 md:p-16 lg:flex-row lg:items-center lg:gap-16"
            >
              <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
                <motion.h2 className="mb-4 font-serif text-5xl leading-tight font-bold text-stone-800 md:text-6xl dark:text-stone-100">
                  Speak Naturally,
                  <br />
                  <span className="text-gradient">Learn Confidently.</span>
                </motion.h2>

                <motion.p className="mb-10 max-w-lg font-sans text-lg text-stone-600 dark:text-stone-400">
                  Have a comfortable, engaging conversation with Shiksha. Practice English fluency,
                  vocabulary, and grammar in a judgment-free, AI-powered environment.
                </motion.p>

                <motion.div>
                  <Button
                    size="lg"
                    onClick={handleStart}
                    id="start-practice-btn"
                    className="premium-button flex h-14 items-center gap-2 rounded-xl px-10 text-lg"
                  >
                    <Mic className="size-5" />
                    {startButtonText}
                  </Button>
                </motion.div>
              </div>

              <div className="relative flex flex-1 items-center justify-center">
                <div className="relative flex h-72 w-72 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/10 to-teal-700/10 md:h-96 md:w-96">
                  <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border border-teal-500/20" />
                  <div className="absolute inset-4 animate-[spin_15s_linear_infinite_reverse] rounded-full border border-teal-600/20" />
                  <div className="z-10 size-48 overflow-hidden rounded-full border-4 border-white/50 bg-stone-100 shadow-2xl md:size-64 dark:border-stone-800/50 dark:bg-stone-900">
                    <Image
                      src="/images/human-hero.png"
                      alt="AI Coach"
                      width={300}
                      height={300}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 2: CONNECTING */}
          {isConnecting && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center"
            >
              <div className="relative flex size-40 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/20 to-teal-700/20 shadow-2xl">
                <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
                <Image
                  src="/images/human-avatar.png"
                  width={144}
                  height={144}
                  className="z-10 size-full rounded-full border-4 border-white/50 object-cover dark:border-stone-800/50"
                  alt="Avatar"
                />
              </div>
              <p className="mt-8 font-serif text-2xl font-bold text-stone-800 dark:text-stone-200">
                Waking up Shiksha...
              </p>
              <p className="mt-2 font-medium text-stone-500">Please wait a moment</p>
            </motion.div>
          )}

          {/* STATE 3 & 4: LISTENING / SPEAKING */}
          {isConnected && !isConnecting && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid h-full min-h-0 w-full max-w-7xl grid-cols-1 gap-6 pb-4 lg:grid-cols-2 lg:gap-8"
            >
              {/* Left Column */}
              <div className="glass-panel relative flex min-h-0 flex-col items-center rounded-3xl p-6 lg:p-8">
                <div className="absolute top-6 right-6 flex items-center gap-2 rounded-full bg-stone-100/50 px-4 py-2 text-sm font-bold shadow-sm backdrop-blur-md dark:bg-stone-900/50">
                  <Clock className="size-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-stone-700 dark:text-stone-200">
                    {formatTime(sessionSeconds)}
                  </span>
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-teal-500" />
                  </span>
                </div>

                <div className="relative mt-2 mb-4 shrink-0">
                  <motion.div
                    className="absolute -inset-2 rounded-full border-4"
                    style={{ borderColor: agentState === 'speaking' ? '#0d9488' : '#10b981' }}
                    animate={{ scale: agentState === 'speaking' ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full border-4 border-white/50 bg-stone-100 shadow-xl md:size-40 dark:border-stone-800/50 dark:bg-stone-900">
                    <Image
                      src="/images/human-avatar.png"
                      alt="Coach Avatar"
                      width={160}
                      height={160}
                      className="size-full object-cover"
                    />
                  </div>
                </div>

                <motion.div
                  key={agentState}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 shrink-0 rounded-full px-6 py-2 font-sans text-sm font-bold tracking-wider uppercase shadow-sm transition-colors ${
                    agentState === 'speaking'
                      ? 'border border-teal-200 bg-teal-100 text-teal-700 dark:border-teal-800/50 dark:bg-teal-900/40 dark:text-teal-300'
                      : 'border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/40 dark:text-emerald-300'
                  }`}
                >
                  {agentState === 'speaking' ? (
                    <span className="flex items-center gap-2">
                      <MessageSquare className="size-4" /> Coach is speaking
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mic className="size-4" /> Listening to you
                    </span>
                  )}
                </motion.div>

                <div className="mb-6 flex min-h-0 w-full shrink items-center justify-center rounded-2xl bg-stone-50/50 p-4 shadow-inner ring-1 ring-stone-900/5 dark:bg-stone-950/50 dark:ring-white/5">
                  <ShikshaVisualizer />
                </div>

                <motion.div className="mt-auto flex w-full shrink-0 items-center justify-center gap-4">
                  <Button
                    variant={isMicEnabled ? 'outline' : 'default'}
                    size="lg"
                    onClick={() => toggleMic()}
                    className={`group h-14 min-h-[48px] flex-1 rounded-xl px-6 font-sans text-base font-bold shadow-sm transition-all ${
                      isMicEnabled
                        ? 'border-2 border-stone-200 bg-white/50 text-stone-700 hover:bg-white hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-300 dark:hover:bg-stone-800'
                        : 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                    }`}
                  >
                    {isMicEnabled ? (
                      <>
                        <Mic className="mr-2 size-5" /> Mic On
                      </>
                    ) : (
                      <>
                        <MicOff className="mr-2 size-5" /> Mic Muted
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => end()}
                    className="group h-14 min-h-[48px] flex-1 rounded-xl border-2 border-stone-200 px-8 font-sans text-base font-bold text-stone-700 transition-colors hover:border-red-500 hover:bg-red-50 hover:text-red-700 dark:border-stone-700 dark:text-stone-300 dark:hover:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                  >
                    <PhoneOff className="mr-2 size-5 transition-transform group-hover:rotate-12" />
                    End Session
                  </Button>
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="flex h-[50vh] min-h-0 w-full lg:h-full">
                <LiveTranscript />
              </div>
            </motion.div>
          )}

          {/* STATE 5: CALL ENDED */}
          {isSessionEnded && (
            <motion.div
              key="ended"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel flex w-full max-w-lg flex-col items-center rounded-3xl p-10 text-center"
            >
              <h2 className="mb-2 font-serif text-4xl font-bold text-stone-800 dark:text-stone-100">
                Session Complete
              </h2>
              <p className="mb-8 font-sans text-lg text-stone-600 dark:text-stone-400">
                Great job practicing today!
              </p>
              <div className="mb-8 grid w-full grid-cols-2 gap-4">
                <div className="rounded-2xl border border-stone-200/50 bg-white/40 p-6 dark:border-stone-800/50 dark:bg-stone-900/40">
                  <Clock className="mx-auto mb-2 size-8 text-indigo-500" />
                  <p className="font-sans text-3xl font-bold text-stone-800 dark:text-stone-200">
                    {formatTime(sessionSeconds)}
                  </p>
                  <p className="mt-1 font-sans text-xs font-bold tracking-wider text-stone-500 uppercase">
                    Duration
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200/50 bg-white/40 p-6 dark:border-stone-800/50 dark:bg-stone-900/40">
                  <MessageSquare className="mx-auto mb-2 size-8 text-violet-500" />
                  <p className="font-sans text-3xl font-bold text-stone-800 dark:text-stone-200">
                    Done
                  </p>
                  <p className="mt-1 font-sans text-xs font-bold tracking-wider text-stone-500 uppercase">
                    Practice
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleStart}
                className="premium-button h-14 w-full rounded-xl text-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <RotateCcw className="size-5 transition-transform duration-500 group-hover:-rotate-180" />
                  Start New Conversation
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 flex items-center justify-center py-4 font-sans text-xs font-semibold text-stone-400 dark:text-stone-600">
        Powered by Murf AI &middot; LiveKit Agents
      </footer>
    </div>
  );
}
