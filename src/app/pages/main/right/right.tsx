"use client";

import React, { useState } from "react";
import { useUpbitWebSocket } from "@/app/call/socket";
import { UpbitTickerData } from "@/app/type/call";
import { handleWebSocketMessageFactory } from "@/app/utils/handleWebSocketMessageFactory";
import { marketCodes } from "@/app/data/init";
import { getMarketName } from "@/app/utils/translate";
import styles from "./right.module.scss";

export default function Right({
  onMarketSelect,
}: {
  onMarketSelect: (marketCode: string) => void;
}) {
  const [data, setData] = useState<Record<string, UpbitTickerData>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UpbitTickerData | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const handleWebSocketMessage = handleWebSocketMessageFactory(setData);
  useUpbitWebSocket(marketCodes, handleWebSocketMessage);

  const sortedData = React.useMemo(() => {
    const dataArray = Object.values(data);
    if (!sortConfig.key) return dataArray;

    return dataArray.sort((a, b) => {
      const aValue = a[sortConfig.key!] || 0;
      const bValue = b[sortConfig.key!] || 0;

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [data, sortConfig]);

  const handleSort = (key: keyof UpbitTickerData) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <div className={styles.container}>
      <table>
        <thead>
          <tr>
            <th>마켓</th>
            <th onClick={() => handleSort("tp")}>현재가</th>
            <th onClick={() => handleSort("cr")}>전일 대비</th>
            <th onClick={() => handleSort("atp24h")}>거래대금</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr key={item.cd} onClick={() => onMarketSelect(item.cd)}>
              <td>{getMarketName(item.cd)}</td>
              <td className={item.cr > 0 ? styles.positive : styles.negative}>
                {item.tp < 1 ? item.tp.toFixed(6) : item.tp.toLocaleString()}
              </td>
              <td className={item.cr > 0 ? styles.positive : styles.negative}>
                {(item.cr * 100).toFixed(2)}%
              </td>
              <td>
                {item.atp24h
                  ? `${Math.floor(item.atp24h / 1000000).toLocaleString()}백만`
                  : "데이터 없음"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
