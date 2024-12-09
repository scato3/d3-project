"use client";

import { useEffect, useRef } from "react";
import { UpbitTickerData } from "../type/call";

export function useUpbitWebSocket(
  marketCodes: string[],
  onMessage: (data: UpbitTickerData) => void
) {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

    ws.onopen = () => {
      console.log("WebSocket connected");
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
        const parsedData: UpbitTickerData = JSON.parse(textData);

        // 최신 onMessage 참조를 사용
        if (parsedData.cd && onMessageRef.current) {
          onMessageRef.current(parsedData);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);
}
