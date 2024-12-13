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
  const onMessageRef = useRef(onMessage);
  const onTradeRef = useRef(onTrade);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onTradeRef.current = onTrade;
  }, [onTrade]);

  const createWebSocket = (type: "ticker" | "trade") => {
    const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

    ws.onopen = () => {
      console.log(`WebSocket connected for ${type}`);
      const subscribeMessage = JSON.stringify([
        { ticket: "test" },
        { type, codes: marketCodes },
        { format: "SIMPLE" },
      ]);
      ws.send(subscribeMessage);
    };

    ws.onmessage = async (event) => {
      try {
        const textData = await event.data.text();
        const parsedData = JSON.parse(textData);

        if (
          type === "ticker" &&
          parsedData.ty === "ticker" &&
          typeof onMessageRef.current === "function"
        ) {
          const tickerData: UpbitTickerData = parsedData;
          onMessageRef.current(tickerData);
        } else if (
          type === "trade" &&
          parsedData.ty === "trade" &&
          typeof onTradeRef.current === "function"
        ) {
          const tradeData: UpbitTradeData = parsedData;
          onTradeRef.current(tradeData);
        }
      } catch (error) {
        console.error(`Error parsing ${type} WebSocket message:`, error);
      }
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected for ${type}`);
    };

    return ws;
  };

  useEffect(() => {
    const tickerWs = createWebSocket("ticker");

    return () => {
      tickerWs.close();
    };
  }, []);

  useEffect(() => {
    const tradeWs = createWebSocket("trade");

    return () => {
      tradeWs.close();
    };
  }, [marketCodes]);
}
