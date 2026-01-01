import { useEffect, useState, useCallback } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSessionStore } from '../stores/sessionStore';
import { useKnowledgeStore } from '../stores/knowledgeStore';

interface ExitGuardState {
  isBlocking: boolean;
  pendingClose: boolean;
}

export function useExitGuard(): ExitGuardState {
  const [pendingClose, setPendingClose] = useState<boolean>(false);

  const isLoading = useSessionStore((state) => state.isLoading);
  const isExtracting = useKnowledgeStore((state) => state.isExtracting);

  const hasPendingTasks: boolean = isLoading || isExtracting;

  // When pending tasks complete and we have a pending close, close the window
  useEffect((): void => {
    if (pendingClose && !hasPendingTasks) {
      const closeWindow = async (): Promise<void> => {
        try {
          const appWindow = getCurrentWindow();
          await appWindow.close();
        } catch (error) {
          console.error('Failed to close window:', error);
        }
      };
      void closeWindow();
    }
  }, [pendingClose, hasPendingTasks]);

  const handleCloseRequested = useCallback(
    async (event: { payload: unknown }): Promise<void> => {
      if (hasPendingTasks) {
        // Prevent the default close behavior
        // In Tauri 2.x, we need to use the window API
        const appWindow = getCurrentWindow();

        // Set pending close to show modal and wait for tasks
        setPendingClose(true);

        // Prevent close by not calling close()
        // The close will happen when tasks complete (see effect above)
      }
      // If no pending tasks, allow normal close
    },
    [hasPendingTasks]
  );

  useEffect((): (() => void) => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async (): Promise<void> => {
      try {
        // Listen for the close requested event
        unlisten = await listen('tauri://close-requested', handleCloseRequested);
      } catch (error) {
        console.error('Failed to setup close listener:', error);
      }
    };

    void setupListener();

    return (): void => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [handleCloseRequested]);

  return {
    isBlocking: hasPendingTasks,
    pendingClose,
  };
}
