"use client";

import { useEffect, useRef } from "react";
import {
  UpbitTickerData,
  UpbitTradeData,
  UpbitOrderbookData,
} from "../type/call";

// 전역 웹소켓 인스턴스 관리
let globalWs: WebSocket | null = null;
const subscribers = new Set<
  (data: UpbitTickerData | UpbitTradeData | UpbitOrderbookData) => void
>();
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function connectWebSocket(marketCodes: string[]) {
  if (globalWs?.readyState === WebSocket.OPEN) {
    // 이미 연결된 웹소켓이 있다면 새로운 구독 메시지만 전송
    const subscribeMessage = JSON.stringify([
      { ticket: "UNIQUE_TICKET" },
      {
        type: "ticker",
        codes: marketCodes,
      },
      {
        type: "trade",
        codes: marketCodes,
      },
      {
        type: "orderbook",
        codes: marketCodes,
      },
      { format: "SIMPLE" },
    ]);
    globalWs.send(subscribeMessage);
    return;
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  const ws = new WebSocket("wss://api.upbit.com/websocket/v1");

  ws.onopen = () => {
    console.log("WebSocket connected");
    reconnectAttempts = 0;
    const subscribeMessage = JSON.stringify([
      { ticket: "UNIQUE_TICKET" },
      {
        type: "ticker",
        codes: marketCodes,
      },
      {
        type: "trade",
        codes: marketCodes,
      },
      {
        type: "orderbook",
        codes: marketCodes,
      },
      { format: "SIMPLE" },
    ]);
    ws.send(subscribeMessage);
  };

  ws.onmessage = async (event) => {
    try {
      const textData = await event.data.text();
      const parsedData = JSON.parse(textData);
      subscribers.forEach((callback) => callback(parsedData));
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.onclose = (event) => {
    console.log("WebSocket disconnected", event);
    globalWs = null;
    if (!event.wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectTimeout = setTimeout(() => connectWebSocket(marketCodes), delay);
      reconnectAttempts++;
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  globalWs = ws;
}

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

  // 콜백 함수 업데이트
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onTradeRef.current = onTrade;
  }, [onTrade]);

  useEffect(() => {
    onOrderbookRef.current = onOrderbook;
  }, [onOrderbook]);

  // 마켓 코드 변경 감지
  useEffect(() => {
    marketCodesRef.current = marketCodes;
    connectWebSocket(marketCodes);
  }, [marketCodes]);

  useEffect(() => {
    const handleMessage = (
      data: UpbitTickerData | UpbitTradeData | UpbitOrderbookData
    ) => {
      // 현재 구독중인 마켓 코드에 대한 데이터만 처리
      if (!marketCodesRef.current.includes(data.cd)) {
        return;
      }

      // 타입 가드를 위한 체크
      const isOrderbook = (
        data: UpbitTickerData | UpbitTradeData | UpbitOrderbookData
      ): data is UpbitOrderbookData => {
        return (data as UpbitOrderbookData).ty === "orderbook";
      };

      const isTrade = (
        data: UpbitTickerData | UpbitTradeData | UpbitOrderbookData
      ): data is UpbitTradeData => {
        return (data as UpbitTradeData).ty === "trade";
      };

      // ticker 데이터 처리
      if (onMessageRef.current && !isOrderbook(data) && !isTrade(data)) {
        onMessageRef.current(data as UpbitTickerData);
      }
      // trade 데이터 처리
      else if (onTradeRef.current && isTrade(data)) {
        onTradeRef.current(data);
      }
      // orderbook 데이터 처리
      else if (onOrderbookRef.current && isOrderbook(data)) {
        onOrderbookRef.current(data);
      }
    };

    subscribers.add(handleMessage);

    return () => {
      subscribers.delete(handleMessage);
    };
  }, []);
}
