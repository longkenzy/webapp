"use client";
import { SessionProvider } from "next-auth/react";
import { EvaluationProvider } from "@/contexts/EvaluationContext";
import { AvatarRefreshProvider } from "@/contexts/AvatarRefreshContext";
import UnifiedSessionManager from "@/components/shared/common/UnifiedSessionManager";
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { SocketProvider } from "@/providers/SocketProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={0} // Disable automatic refetching
      refetchOnWindowFocus={false} // Disable refetch on window focus
    >
      <MantineProvider>
        <EvaluationProvider>
          <AvatarRefreshProvider>
            <SocketProvider>
              <UnifiedSessionManager showTimer={false} showWarning={false} warningMinutes={5} />
              {children}
            </SocketProvider>
          </AvatarRefreshProvider>
        </EvaluationProvider>
      </MantineProvider>
    </SessionProvider>
  );
}


