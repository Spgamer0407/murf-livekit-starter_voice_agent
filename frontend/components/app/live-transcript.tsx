'use client';

import React from 'react';
import { MessageSquare, Mic } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useLiveTranscript } from '@/hooks/useLiveTranscript';

export function LiveTranscript() {
  const messages = useLiveTranscript();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="glass-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[2rem]">
      <div className="flex shrink-0 items-center gap-2 border-b border-stone-200/50 bg-white/50 px-6 py-5 backdrop-blur-md dark:border-stone-800/50 dark:bg-stone-900/50">
        <MessageSquare className="size-5 text-teal-600 dark:text-teal-500" />
        <h3 className="font-sans text-sm font-bold tracking-wider text-stone-700 uppercase dark:text-stone-300">
          Live Transcript
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="transcript-scroll flex-1 overflow-y-auto p-6"
      >
        <div className="flex flex-col gap-6 pb-4">
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-12 flex h-full flex-col items-center justify-center text-center text-stone-400"
              >
                <Mic className="mb-4 size-12 opacity-20" />
                <p className="font-sans text-base font-semibold">
                  Waiting for conversation to start...
                </p>
                <p className="mt-1 font-sans text-sm opacity-70">Say something to Shiksha!</p>
              </motion.div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex w-full flex-col ${msg.isAgent ? 'items-start' : 'items-end'}`}
                >
                  <span className="mb-1.5 px-1 font-sans text-[11px] font-bold tracking-wider text-stone-400 uppercase">
                    {msg.isAgent ? 'Shiksha AI' : 'You'}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm ${
                      msg.isAgent
                        ? 'rounded-tl-sm border border-stone-200/50 bg-white text-stone-800 dark:border-stone-700/50 dark:bg-stone-800 dark:text-stone-200'
                        : 'rounded-tr-sm bg-teal-600 text-white shadow-md shadow-teal-900/10 dark:bg-teal-700'
                    } ${!msg.final ? 'opacity-80' : 'opacity-100'}`}
                  >
                    <p className="font-sans text-[15px] leading-relaxed">{msg.text}</p>
                    {!msg.final && (
                      <span className="mt-2 flex h-1.5 items-center gap-1">
                        <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60" />
                        <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:0.15s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:0.3s]" />
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
