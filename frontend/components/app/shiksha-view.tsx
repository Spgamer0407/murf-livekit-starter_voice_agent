'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ConnectionState, Track } from 'livekit-client';
import { motion, AnimatePresence } from 'motion/react';
import { useSessionContext, useAgent, useTrackToggle } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { ShikshaVisualizer } from './shiksha-visualizer';

import {
  Mic,
  MicOff,
  PhoneOff,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  Clock,
  RotateCcw,
  Target,
  FileText,
  Activity,
} from 'lucide-react';

interface ShikshaViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export function ShikshaView({ startButtonText, onStartCall }: ShikshaViewProps) {
  const session = useSessionContext();
  const { isConnected, connectionState, end } = session;
  const { state: agentState } = useAgent();
  const { toggle: toggleMic, enabled: isMicEnabled } = useTrackToggle({ source: Track.Source.Microphone });
  const isConnecting = connectionState === ConnectionState.Connecting;
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [hasHadSession, setHasHadSession] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);


  // Check microphone permissions on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((status) => {
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
      }).catch(() => {
        // permissions API not supported, ignore
      });
    }
  }, []);

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      setHasHadSession(true);
      setMicError(null); // Clear any previous error on successful connect
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
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const hasMicError = !!micError;

  const isSessionEnded = !isConnected && !isConnecting && hasHadSession;
  const isReady = !isConnected && !isConnecting && !hasHadSession;

  const practiceItems = [
    { icon: Target, label: 'Public Speaking Confidence', color: 'terracotta' },
    { icon: BookOpen, label: 'Vocabulary & Fluency', color: 'sage' },
    { icon: MessageSquare, label: 'Real-Time Grammar Feedback', color: 'stone' },
  ];

  const colorMap: Record<string, { bg: string; text: string; badge: string; border: string }> = {
    terracotta: {
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      text: 'text-orange-800 dark:text-orange-200',
      badge: 'bg-orange-100 dark:bg-orange-900/60',
      border: 'border-orange-200 dark:border-orange-900/40',
    },
    sage: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-800 dark:text-emerald-200',
      badge: 'bg-emerald-100 dark:bg-emerald-900/60',
      border: 'border-emerald-200 dark:border-emerald-900/40',
    },
    stone: {
      bg: 'bg-stone-50 dark:bg-stone-900/40',
      text: 'text-stone-800 dark:text-stone-200',
      badge: 'bg-stone-200 dark:bg-stone-800/60',
      border: 'border-stone-200 dark:border-stone-800/40',
    },
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-[#FDFBF7] text-stone-900 transition-colors duration-700 dark:bg-[#1C1917] dark:text-stone-100">
      
      {/* ─── TOP HEADER / BRAND ─── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex w-full items-center justify-between border-b border-stone-200 bg-[#FDFBF7] px-6 py-4 shadow-sm dark:border-stone-800 dark:bg-[#1C1917]"
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-100">
              Shiksha
            </h1>
            <p className="font-sans text-xs font-semibold text-orange-700 dark:text-orange-400">
              English Communication Coach
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isReady && (
            <a href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="group hidden md:flex items-center gap-2 rounded-lg border-stone-200 font-sans font-semibold text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                <Activity className="size-4 text-blue-600 dark:text-blue-400 group-hover:animate-pulse" />
                View Dashboard
              </Button>
            </a>
          )}

          {/* Session timer (visible during call) */}
          <AnimatePresence>
            {isConnected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 rounded-lg bg-emerald-100 px-4 py-2 font-sans text-sm font-bold text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:ring-emerald-700"
            >
              <Clock className="size-4" />
              <span>{formatTime(sessionSeconds)}</span>
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
              </span>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* ─── MICROPHONE ERROR BANNER ─── */}
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
              <h3 className="font-bold text-red-900 dark:text-red-100">Microphone Access Blocked</h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                Please click the lock icon next to your browser URL bar and allow Microphone permissions to continue.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStart}
              className="shrink-0 rounded-lg border-red-400 font-sans font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900"
            >
              <RotateCcw className="mr-1.5 size-4" />
              Retry Permission
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─── */}
      <main className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto p-4 md:p-8">
        <AnimatePresence mode="wait">

          {/* ══════════ STATE 1: READY ══════════ */}
          {isReady && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-16"
            >
              {/* Left Column — Text & CTA */}
              <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
                
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mb-4 font-serif text-4xl font-bold leading-tight text-stone-900 md:text-5xl dark:text-stone-50"
                >
                  Speak Naturally,
                  <br />
                  <span className="text-orange-700 dark:text-orange-500">Learn Confidently.</span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mb-8 max-w-md font-sans text-lg text-stone-600 dark:text-stone-400"
                >
                  Have a comfortable, engaging conversation with your English coach. Practice at your own pace in a friendly environment.
                </motion.p>

                {/* Practice Focus Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mb-8 w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
                >
                  <h3 className="mb-4 font-sans text-sm font-bold tracking-wider text-stone-500 uppercase dark:text-stone-400">
                    Today&apos;s Focus
                  </h3>
                  <ul className="space-y-3">
                    {practiceItems.map((item, i) => {
                      const c = colorMap[item.color];
                      return (
                        <motion.li
                          key={item.label}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                          className={`flex items-center gap-4 rounded-lg border ${c.border} ${c.bg} p-3 transition-transform duration-200 hover:scale-[1.02]`}
                        >
                          <div className={`flex size-10 shrink-0 items-center justify-center rounded-md ${c.badge}`}>
                            <item.icon className={`size-5 ${c.text}`} />
                          </div>
                          <span className={`font-sans text-sm font-bold ${c.text}`}>{item.label}</span>
                        </motion.li>
                      );
                    })}
                  </ul>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  <Button
                    size="lg"
                    onClick={handleStart}
                    id="start-practice-btn"
                    className="group h-14 min-h-[48px] rounded-lg bg-orange-700 px-10 font-sans text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-orange-800 hover:shadow-lg dark:bg-orange-600 dark:hover:bg-orange-700"
                  >
                    <Mic className="mr-2 size-5 transition-transform group-hover:scale-110" />
                    Start Conversation
                  </Button>
                </motion.div>
              </div>

              {/* Right Column — Hero Image */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="relative flex flex-1 items-center justify-center"
              >
                <div className="overflow-hidden rounded-2xl border-8 border-white shadow-xl dark:border-stone-800">
                  <Image
                    src="/images/human-hero.png"
                    alt="People having a natural conversation"
                    width={500}
                    height={500}
                    className="object-cover"
                    priority
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ══════════ STATE 2: CONNECTING ══════════ */}
          {isConnecting && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-8">
                {/* Avatar container */}
                <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full border-4 border-stone-200 bg-stone-100 shadow-md dark:border-stone-700 dark:bg-stone-800">
                  <Image
                    src="/images/human-avatar.png"
                    alt="Shiksha Avatar"
                    width={128}
                    height={128}
                    className="size-full object-cover"
                  />
                </div>
              </div>
              <div className="mb-4 flex items-center gap-3">
                <motion.div
                  className="size-3 rounded-full bg-orange-600"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="size-3 rounded-full bg-orange-600"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="size-3 rounded-full bg-orange-600"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <p className="font-serif text-xl font-bold text-stone-700 dark:text-stone-200">
                Connecting to your Coach...
              </p>
              <p className="mt-2 font-sans text-sm font-semibold text-stone-500 dark:text-stone-400">
                Please wait a moment
              </p>
            </motion.div>
          )}

          {/* ══════════ STATE 3 & 4: LISTENING / SPEAKING ══════════ */}
          {isConnected && !isConnecting && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex w-full max-w-4xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16"
            >
              {/* Left — Avatar + Status */}
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  {/* Dynamic natural border ring */}
                  <motion.div
                    className="absolute -inset-2 rounded-full border-4"
                    style={{
                      borderColor: agentState === 'speaking' ? '#C2410C' : '#059669', // orange-700 vs emerald-600
                    }}
                    animate={{ scale: agentState === 'speaking' ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="relative flex size-36 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-stone-100 shadow-lg dark:border-stone-800 dark:bg-stone-900">
                    <Image
                      src="/images/human-avatar.png"
                      alt="Coach Avatar"
                      width={144}
                      height={144}
                      className="size-full object-cover"
                    />
                  </div>
                </div>

                {/* Status label */}
                <motion.div
                  key={agentState}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg px-5 py-2 font-sans text-sm font-bold uppercase tracking-wider ${
                    agentState === 'speaking'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
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
              </div>

              {/* Right — Visualizer */}
              <div className="flex flex-1 flex-col items-center">
                <div className="w-full rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900 md:p-10">
                  <ShikshaVisualizer />
                </div>

                {/* Call Controls */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex items-center justify-center gap-4"
                >
                  <Button
                    variant={isMicEnabled ? "outline" : "default"}
                    size="lg"
                    onClick={() => toggleMic()}
                    id="toggle-mic-btn"
                    className={`group h-14 min-h-[48px] rounded-lg px-6 font-sans text-base font-bold shadow-sm transition-all ${
                      isMicEnabled
                        ? 'border-2 border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800'
                        : 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                    }`}
                  >
                    {isMicEnabled ? (
                      <>
                        <Mic className="mr-2 size-5" />
                        Mic On
                      </>
                    ) : (
                      <>
                        <MicOff className="mr-2 size-5" />
                        Mic Muted
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => end()}
                    id="end-call-btn"
                    className="group h-14 min-h-[48px] rounded-lg border-2 border-stone-300 px-8 font-sans text-base font-bold text-stone-700 transition-colors hover:border-red-500 hover:bg-red-50 hover:text-red-700 dark:border-stone-700 dark:text-stone-300 dark:hover:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                  >
                    <PhoneOff className="mr-2 size-5 transition-transform group-hover:rotate-12" />
                    End
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ══════════ STATE 5: CALL ENDED ══════════ */}
          {isSessionEnded && (
            <motion.div
              key="ended"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="flex w-full max-w-lg flex-col items-center"
            >
              {/* Summary Card */}
              <div className="w-full rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-md dark:border-stone-800 dark:bg-stone-900">
                <h2 className="mb-3 font-serif text-3xl font-bold text-stone-800 dark:text-stone-100">
                  Great Conversation!
                </h2>
                <p className="mb-8 font-sans text-stone-600 dark:text-stone-400">
                  Consistent practice is the key to confidence.
                </p>

                {/* Session Stats */}
                <div className="mb-8 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950/50">
                    <Clock className="mx-auto mb-2 size-6 text-orange-600" />
                    <p className="font-sans text-2xl font-bold text-stone-800 dark:text-stone-200">{formatTime(sessionSeconds)}</p>
                    <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">Duration</p>
                  </div>
                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950/50">
                    <MessageSquare className="mx-auto mb-2 size-6 text-emerald-600" />
                    <p className="font-sans text-2xl font-bold text-stone-800 dark:text-stone-200">Done</p>
                    <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">Practice</p>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleStart}
                  id="new-session-btn"
                  className="group h-14 min-h-[48px] w-full rounded-lg bg-orange-700 font-sans text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-orange-800 dark:bg-orange-600 dark:hover:bg-orange-700"
                >
                  <span className="flex items-center justify-center gap-2">
                    <RotateCcw className="size-5 transition-transform duration-500 group-hover:-rotate-180" />
                    Start New Conversation
                  </span>
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ─── BOTTOM FOOTER ─── */}
      <footer className="relative z-10 flex items-center justify-center border-t border-stone-200 bg-[#FDFBF7] py-4 font-sans text-xs font-semibold text-stone-500 dark:border-stone-800 dark:bg-[#1C1917] dark:text-stone-500">
        Powered by Murf AI &middot; LiveKit Agents
      </footer>


    </div>
  );
}
