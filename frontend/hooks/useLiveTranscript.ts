import { useEffect, useState } from 'react';
import { Participant, RoomEvent, TranscriptionSegment } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

export interface TranscriptMessage {
  id: string;
  text: string;
  isAgent: boolean;
  timestamp: number;
  final: boolean;
}

export function useLiveTranscript() {
  const room = useRoomContext();
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);

  useEffect(() => {
    const handleTranscription = (segments: TranscriptionSegment[], participant?: Participant) => {
      setMessages((prev) => {
        const next = [...prev];
        let changed = false;

        for (const segment of segments) {
          // If there's no participant, assume it's the agent (or handle appropriately)
          const isAgent = participant ? !participant.isLocal : true;

          const existingIdx = next.findIndex((m) => m.id === segment.id);
          if (existingIdx >= 0) {
            // Update existing segment
            if (
              next[existingIdx].text !== segment.text ||
              next[existingIdx].final !== segment.final
            ) {
              next[existingIdx] = {
                ...next[existingIdx],
                text: segment.text,
                final: segment.final,
              };
              changed = true;
            }
          } else {
            // Add new segment
            next.push({
              id: segment.id,
              text: segment.text,
              isAgent,
              timestamp: Date.now(),
              final: segment.final,
            });
            changed = true;
          }
        }

        // Return updated array only if something changed to prevent extra renders
        return changed ? next : prev;
      });
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }, [room]);

  return messages;
}
