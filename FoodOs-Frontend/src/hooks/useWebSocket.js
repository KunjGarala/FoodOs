import { useEffect, useRef } from 'react';
import websocketService from '../services/websocket';

/**
 * React hook that subscribes to a STOMP destination and invokes `onMessage`
 * whenever a message arrives.  Automatically unsubscribes on unmount or when
 * the destination changes.
 *
 * @param {string|null}  destination  STOMP destination, e.g. '/topic/tables/abc'
 *                                    Pass null/undefined to skip subscribing.
 * @param {function}     onMessage    Callback receiving the parsed JSON body.
 *
 * Usage:
 *   useWebSocket(`/topic/tables/${restaurantUuid}`, (data) => {
 *     dispatch(handleTableWsEvent(data));
 *   });
 */
export default function useWebSocket(destination, onMessage) {
  // Keep latest callback in a ref so we never stale-close over it
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    if (!destination) return;

    // Ensure the global connection is active
    websocketService.connect();

    const unsubscribe = websocketService.subscribe(destination, (data) => {
      callbackRef.current(data);
    });

    return () => {
      unsubscribe();
    };
  }, [destination]);
}
