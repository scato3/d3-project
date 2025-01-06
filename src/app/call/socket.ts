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

  const wsRef = useRef<{ [key: string]: WebSocket | null }>({});
  const reconnectingRef = useRef<{ [key: string]: boolean }>({});

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

      if (reconnectingRef.current[type] && wsRef.current[type]) {
        return wsRef.current[type];
      }

      const ws = new WebSocket("wss://api.upbit.com/websocket/v1");
      wsRef.current[type] = ws;

      ws.onopen = () => {
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
        if (type === "orderbook") {
          if (!reconnectingRef.current[type]) {
            reconnectingRef.current[type] = true;
            setTimeout(() => {
              reconnectingRef.current[type] = false;
              if (
                !wsRef.current[type] ||
                wsRef.current[type]?.readyState === WebSocket.CLOSED
              ) {
                createWebSocket(type);
              }
            }, 1000);
          }
          return;
        }

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

  // Ticker WebSocket
  useEffect(() => {
    if (onMessage) {
      const ws = createWebSocket("ticker");
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [marketCodes]);

  // Trade WebSocket - ticker 연결 후 약간의 딜레이를 두고 연결
  useEffect(() => {
    if (onTrade) {
      const timeoutId = setTimeout(() => {
        const ws = createWebSocket("trade");
        return () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [marketCodes]);

  // Orderbook WebSocket - trade 연결 후 약간의 딜레이를 두고 연결
  useEffect(() => {
    if (onOrderbook) {
      const timeoutId = setTimeout(() => {
        const ws = createWebSocket("orderbook");
        return () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [marketCodes]);
}
