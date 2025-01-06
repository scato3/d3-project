"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useUpbitWebSocket } from "@/app/call/socket";
import { UpbitOrderbookData } from "@/app/type/call";
import styles from "./orderbook.module.scss";

export default function Orderbook({
  selectedMarketCode,
}: {
  selectedMarketCode: string;
}) {
  const [orderbook, setOrderbook] = useState<UpbitOrderbookData["obu"]>([]);
  const currentMarketRef = useRef(selectedMarketCode);
  const orderbookBufferRef = useRef<UpbitOrderbookData["obu"] | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 버퍼된 데이터를 UI에 반영하는 함수
  const updateOrderbook = useCallback(() => {
    if (orderbookBufferRef.current) {
      setOrderbook(orderbookBufferRef.current);
    }
  }, []);

  // 웹소켓 메시지 핸들러
  const handleOrderbookMessage = useCallback((data: UpbitOrderbookData) => {
    if (data && data.obu && data.cd === currentMarketRef.current) {
      orderbookBufferRef.current = data.obu;
    }
  }, []);

  // 마켓 코드 변경 시 초기화
  useEffect(() => {
    console.log("Market code changed to:", selectedMarketCode);
    setOrderbook([]);
    orderbookBufferRef.current = null;
    currentMarketRef.current = selectedMarketCode;
  }, [selectedMarketCode]);

  // 주기적 업데이트 설정
  useEffect(() => {
    // 이전 인터벌 정리
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // 1초마다 UI 업데이트
    updateIntervalRef.current = setInterval(updateOrderbook, 1000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [updateOrderbook]);

  // 웹소켓 연결
  useUpbitWebSocket({
    marketCodes: [selectedMarketCode],
    onOrderbook: handleOrderbookMessage,
  });

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>호가창</h2>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.column}>매도잔량</div>
          <div className={styles.column}>가격</div>
          <div className={styles.column}>매수잔량</div>
        </div>
        <div className={styles.rows}>
          {orderbook && orderbook.length > 0 ? (
            orderbook.map((item, index) => (
              <div
                key={`${selectedMarketCode}-${index}`}
                className={styles.row}
              >
                <div className={`${styles.cell} ${styles.ask}`}>
                  {item?.as?.toLocaleString() ?? "-"}
                </div>
                <div className={styles.cell}>
                  {item?.ap?.toLocaleString() ?? "-"}
                </div>
                <div className={`${styles.cell} ${styles.bid}`}>
                  {item?.bs?.toLocaleString() ?? "-"}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noData}>데이터를 불러오는 중...</div>
          )}
        </div>
      </div>
    </div>
  );
}
