"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useUpbitWebSocket } from "@/app/call/socket";
import { UpbitTradeData } from "@/app/type/call";
import styles from "./trade.module.scss";
import { Virtuoso } from "react-virtuoso";

export default function Trade({
  selectedMarketCode,
}: {
  selectedMarketCode: string;
}) {
  const [trades, setTrades] = useState<UpbitTradeData[]>([]);
  const MAX_TRADES = 100;

  const handleTradeMessage = useCallback((newTrade: UpbitTradeData) => {
    setTrades((prevTrades) => {
      const updatedTrades = [newTrade, ...prevTrades].slice(0, MAX_TRADES);
      return updatedTrades;
    });
  }, []);

  useEffect(() => {
    setTrades([]);
  }, [selectedMarketCode]);

  const marketCodes = useMemo(() => [selectedMarketCode], [selectedMarketCode]);

  useUpbitWebSocket({
    marketCodes,
    onTrade: handleTradeMessage,
  });

  const TradeRow = useCallback(({ trade }: { trade: UpbitTradeData }) => {
    const adjustedTime = (() => {
      const hour = Number(trade.ttm.slice(0, 2));
      const adjustedHour = (hour + 9) % 24;
      return `${adjustedHour.toString().padStart(2, "0")}${trade.ttm.slice(2)}`;
    })();

    return (
      <div className={styles.row}>
        <div className={styles.cell}>{adjustedTime}</div>
        <div className={styles.cell}>{trade.tp.toLocaleString()}</div>
        <div
          className={`${styles.cell} ${
            trade.c === "RISE" ? styles.red : styles.blue
          }`}
        >
          {(trade.cp || 0).toLocaleString()}
        </div>
        <div className={styles.cell}>{trade.tv.toFixed(4)}</div>
      </div>
    );
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>
        실시간 거래 데이터 ({selectedMarketCode})
      </h2>
      <div className={styles.tableHeader}>
        <div className={styles.headerCell}>시간</div>
        <div className={styles.headerCell}>종가 (KRW)</div>
        <div className={styles.headerCell}>전일 대비</div>
        <div className={styles.headerCell}>거래량 ({selectedMarketCode})</div>
      </div>
      <Virtuoso
        style={{ height: "calc(100vh - 600px)" }}
        totalCount={trades.length}
        itemContent={(index) => <TradeRow trade={trades[index]} />}
        overscan={20}
      />
    </div>
  );
}
