'use client';

import { ShikshaView } from '@/components/app/shiksha-view';
import type { AppConfig } from '@/app-config';
import { useSessionContext } from '@livekit/components-react';

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { start } = useSessionContext();

  return (
    <ShikshaView
      startButtonText={appConfig.startButtonText}
      onStartCall={start}
    />
  );
}
