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
  const tickerWsRef = useRef<WebSocket | null>(null);
  const tradeWsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onTradeRef = useRef(onTrade);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onTradeRef.current = onTrade;
  }, [onTrade]);

  const connectTickerWebSocket = () => {
    const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

    ws.onopen = () => {
      console.log("Ticker WebSocket connected");
      const subscribeMessage = JSON.stringify([
        { ticket: "test" },
        { type: "ticker", codes: marketCodes },
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
        }
      } catch (error) {
        console.error("Error parsing Ticker WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("Ticker WebSocket disconnected");
      if (!event.wasClean) {
        console.error("Unexpected disconnection for Ticker. Reconnecting...");
        setTimeout(connectTickerWebSocket, 1000); // 재연결 시도
      }
    };

    ws.onerror = (error) => {
      console.error("Ticker WebSocket error:", error);
    };

    tickerWsRef.current = ws;
  };

  const connectTradeWebSocket = () => {
    const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

    ws.onopen = () => {
      console.log("Trade WebSocket connected");
      const subscribeMessage = JSON.stringify([
        { ticket: "test" },
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
          parsedData.ty === "trade" &&
          typeof onTradeRef.current === "function"
        ) {
          const tradeData: UpbitTradeData = parsedData;
          onTradeRef.current(tradeData);
        }
      } catch (error) {
        console.error("Error parsing Trade WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("Trade WebSocket disconnected");
      if (!event.wasClean) {
        console.error("Unexpected disconnection for Trade. Reconnecting...");
        setTimeout(connectTradeWebSocket, 1000); // 재연결 시도
      }
    };

    ws.onerror = (error) => {
      console.error("Trade WebSocket error:", error);
    };

    tradeWsRef.current = ws;
  };

  useEffect(() => {
    connectTickerWebSocket();

    // Trade WebSocket 연결을 몇 초 뒤에 생성
    const timer = setTimeout(() => {
      connectTradeWebSocket();
    }, 3000);

    return () => {
      if (tickerWsRef.current) {
        tickerWsRef.current.close();
        tickerWsRef.current = null;
      }
      if (tradeWsRef.current) {
        tradeWsRef.current.close();
        tradeWsRef.current = null;
      }
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (tickerWsRef.current?.readyState === WebSocket.OPEN) {
      const updateMessage = JSON.stringify([
        { ticket: "test" },
        { type: "ticker", codes: marketCodes },
        { format: "SIMPLE" },
      ]);
      tickerWsRef.current.send(updateMessage);
      console.log("Ticker WebSocket subscription updated");
    }

    if (tradeWsRef.current?.readyState === WebSocket.OPEN) {
      const updateMessage = JSON.stringify([
        { ticket: "test" },
        { type: "trade", codes: marketCodes },
        { format: "SIMPLE" },
      ]);
      tradeWsRef.current.send(updateMessage);
      console.log("Trade WebSocket subscription updated");
    }
  }, [marketCodes]);
}
