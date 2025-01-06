"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  UpbitTickerData,
  UpbitTradeData,
  UpbitOrderbookData,
} from "../type/call";

export function useUpbitWebSocket({
  marketCodes,
  onMessage,
  onTrade,
  onOrderbook,
}: {
  marketCodes: string[];
  onMessage?: (data: UpbitTickerData) => void;
  onTrade?: (data: UpbitTradeData) => void;
  onOrderbook?: (data: UpbitOrderbookData) => void;
}) {
  const onMessageRef = useRef(onMessage);
  const onTradeRef = useRef(onTrade);
  const onOrderbookRef = useRef(onOrderbook);
  const marketCodesRef = useRef(marketCodes);
  const orderbookBufferRef = useRef<UpbitOrderbookData | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    marketCodesRef.current = marketCodes;
  }, [marketCodes]);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onTradeRef.current = onTrade;
  }, [onTrade]);

  useEffect(() => {
    onOrderbookRef.current = onOrderbook;
  }, [onOrderbook]);

  // 버퍼된 orderbook 데이터를 주기적으로 처리
  useEffect(() => {
    if (onOrderbook) {
      updateIntervalRef.current = setInterval(() => {
        if (orderbookBufferRef.current) {
          onOrderbook(orderbookBufferRef.current);
          orderbookBufferRef.current = null;
        }
      }, 1000);

      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
      };
    }
  }, [onOrderbook]);

  const createWebSocket = useCallback(
    (type: "ticker" | "trade" | "orderbook") => {
      let reconnectTimeout: NodeJS.Timeout;
      let reconnectAttempts = 0;
      const MAX_RECONNECT_ATTEMPTS = 5;

      const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

      ws.onopen = () => {
        console.log(`WebSocket connected for ${type}`);
        reconnectAttempts = 0;
        const subscribeMessage = JSON.stringify([
          { ticket: `UNIQUE_TICKET_${type}` },
          { type, codes: marketCodesRef.current },
          { format: "SIMPLE" },
        ]);
        ws.send(subscribeMessage);
      };

      ws.onmessage = async (event) => {
        try {
          const textData = await event.data.text();
          const parsedData = JSON.parse(textData);

          if (!parsedData || typeof parsedData !== "object") {
            console.error(`Invalid ${type} data format:`, parsedData);
            return;
          }

          if (!marketCodesRef.current.includes(parsedData.cd)) {
            return;
          }

          if (type === "ticker" && typeof onMessageRef.current === "function") {
            onMessageRef.current(parsedData as UpbitTickerData);
          } else if (
            type === "trade" &&
            typeof onTradeRef.current === "function" &&
            parsedData.ty === "trade"
          ) {
            onTradeRef.current(parsedData as UpbitTradeData);
          } else if (
            type === "orderbook" &&
            (parsedData.ty === "orderbook" ||
              parsedData.type === "orderbook") &&
            Array.isArray(parsedData.obu)
          ) {
            // orderbook 데이터를 버퍼에 저장
            orderbookBufferRef.current = parsedData as UpbitOrderbookData;
          }
        } catch (error) {
          console.error(`Error parsing ${type} WebSocket message:`, error);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected for ${type}`, event);

        if (!event.wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Attempting to reconnect ${type} in ${delay}ms`);

          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            createWebSocket(type);
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${type}:`, error);
      };

      return ws;
    },
    []
  );

  useEffect(() => {
    if (onMessage) {
      const ws = createWebSocket("ticker");
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [createWebSocket, onMessage, marketCodes]);

  useEffect(() => {
    if (onTrade) {
      const ws = createWebSocket("trade");
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [createWebSocket, onTrade, marketCodes]);

  useEffect(() => {
    if (onOrderbook) {
      const ws = createWebSocket("orderbook");
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [createWebSocket, onOrderbook, marketCodes]);
}
