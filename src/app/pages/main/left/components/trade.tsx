"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useUpbitWebSocket } from "@/app/call/socket";
import { UpbitTradeData } from "@/app/type/call";
import { handleTradeMessageFactory } from "@/app/utils/handleTradeMessageFactory";
import styles from "./trade.module.scss";

export default function Trade({
  selectedMarketCode,
}: {
  selectedMarketCode: string;
}) {
  const [trades, setTrades] = useState<UpbitTradeData[]>([]);

  const handleTradeMessage = handleTradeMessageFactory(setTrades);

  // selectedMarketCode 변경 시 trades 초기화
  useEffect(() => {
    setTrades([]);
  }, [selectedMarketCode]);

  const marketCodes = useMemo(() => [selectedMarketCode], [selectedMarketCode]);

  console.log(trades);

  // WebSocket 연결
  useUpbitWebSocket({
    marketCodes,
    onTrade: handleTradeMessage,
  });

  console.log(trades);

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>
        실시간 거래 데이터 ({selectedMarketCode})
      </h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>시간</th>
            <th>종가 (KRW)</th>
            <th>전일 대비</th>
            <th>거래량 ({selectedMarketCode})</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr key={index}>
              <td>
                {(() => {
                  const hour = Number(trade.ttm.slice(0, 2));
                  const adjustedHour = (hour + 9) % 24;
                  return `${adjustedHour
                    .toString()
                    .padStart(2, "0")}${trade.ttm.slice(2)}`;
                })()}
              </td>
              <td>{trade.tp.toLocaleString()}</td>
              <td className={trade.c === "RISE" ? styles.red : styles.blue}>
                {(trade.cp || 0).toLocaleString()}
              </td>
              <td>{trade.tv.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
