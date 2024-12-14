import { useEffect, useRef } from "react";
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

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onTradeRef.current = onTrade;
  }, [onTrade]);

  const connectWebSocket = () => {
    const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

    ws.onopen = () => {
      console.log("WebSocket connected");
      const subscribeMessage = JSON.stringify([
        { ticket: "test" },
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
          const tickerData: UpbitTickerData = parsedData;
          onMessageRef.current(tickerData);
        } else if (
          parsedData.ty === "trade" &&
          typeof onTradeRef.current === "function"
        ) {
          const tradeData: UpbitTradeData = parsedData;
          onTradeRef.current(tradeData);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected");
      if (!event.wasClean) {
        console.error("Unexpected disconnection. Reconnecting...");
        setTimeout(connectWebSocket, 1000); // 재연결 시도
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log(marketCodes);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const updateMessage = JSON.stringify([
        { ticket: "test" },
        { type: "trade", codes: marketCodes },
        { format: "SIMPLE" },
      ]);
      wsRef.current.send(updateMessage);
      console.log("WebSocket subscription updated");
    }
  }, [marketCodes]);
}
