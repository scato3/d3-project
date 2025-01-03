import { useEffect, useRef, useCallback } from "react";
import { UpbitTickerData, UpbitTradeData } from "../type/call";

export function useUpbitWebSocket({
  marketCodes,
  onMessage,
  onTrade,
}: {
  marketCodes: string[];
  onMessage?: (data: UpbitTickerData) => void;
  onTrade?: (data: UpbitTradeData) => void;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onTradeRef = useRef(onTrade);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const maxReconnectAttempts = 5;
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onTradeRef.current = onTrade;
  }, [onTrade]);

  const handleWebSocketError = useCallback(() => {
    if (reconnectAttemptRef.current < maxReconnectAttempts) {
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttemptRef.current),
        30000
      );
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      reconnectAttemptRef.current++;
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

    ws.onopen = () => {
      console.log("WebSocket connected");
      reconnectAttemptRef.current = 0;
      const subscribeMessage = JSON.stringify([
        { ticket: "UNIQUE_TICKET" },
        { type: "ticker", codes: marketCodes },
        { type: "trade", codes: marketCodes },
        { format: "SIMPLE" },
      ]);
      ws.send(subscribeMessage);
    };

    ws.onmessage = async (event) => {
      try {
        const textData = await event.data.text();
        const parsedData = JSON.parse(textData);

        if (
          parsedData.ty === "ticker" &&
          typeof onMessageRef.current === "function"
        ) {
          onMessageRef.current(parsedData);
        } else if (
          parsedData.ty === "trade" &&
          typeof onTradeRef.current === "function"
        ) {
          onTradeRef.current(parsedData);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected");
      if (!event.wasClean) {
        handleWebSocketError();
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      handleWebSocketError();
    };

    wsRef.current = ws;
  }, [marketCodes, handleWebSocketError]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const updateMessage = JSON.stringify([
        { ticket: "UNIQUE_TICKET" },
        { type: "ticker", codes: marketCodes },
        { type: "trade", codes: marketCodes },
        { format: "SIMPLE" },
      ]);
      wsRef.current.send(updateMessage);
    }
  }, [marketCodes]);
}
