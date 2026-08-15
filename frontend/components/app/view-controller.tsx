'use client';

import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ShikshaView } from '@/components/app/shiksha-view';

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { start } = useSessionContext();

  return <ShikshaView startButtonText={appConfig.startButtonText} onStartCall={start} />;
}
