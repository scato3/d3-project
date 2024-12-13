"use client";

import React, { useState, useEffect } from "react";
import { useUpbitWebSocket } from "@/app/call/socket";
import { UpbitTradeData } from "@/app/type/call";
import { handleTradeMessageFactory } from "@/app/utils/handleTradeMessageFactory";

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

  // WebSocket 연결
  useUpbitWebSocket({
    marketCodes: [selectedMarketCode],
    onTrade: handleTradeMessage,
  });

  return (
    <div>
      <h2>실시간 거래 데이터 ({selectedMarketCode})</h2>
      <table>
        <thead>
          <tr>
            <th>마켓</th>
            <th>거래 가격</th>
            <th>거래량</th>
            <th>거래 시간</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr key={trade.sid || index}>
              <td>{trade.cd}</td>
              <td>{trade.tp.toLocaleString()} KRW</td>
              <td>{trade.tv.toFixed(4)}</td>
              <td>{trade.ttm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
