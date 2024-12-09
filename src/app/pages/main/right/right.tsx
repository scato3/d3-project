"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const previousData = useRef<Record<string, number>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, NodeJS.Timeout>>({}); // 타이머 관리

  const handleWebSocketMessage = handleWebSocketMessageFactory(setData);
  useUpbitWebSocket(marketCodes, handleWebSocketMessage);

  useEffect(() => {
    Object.keys(data).forEach((key) => {
      const currentValue = data[key]?.tp || 0;
      const previousValue = previousData.current[key] || 0;

      if (currentValue !== previousValue) {
        const isIncreased = currentValue > previousValue;
        const isDecreased = currentValue < previousValue;

        // 기존 타이머 취소
        if (timers.current[key]) {
          clearTimeout(timers.current[key]);
        }

        // 상태 업데이트 (값이 변경된 경우에만)
        if (isIncreased || isDecreased) {
          setStatus((prev) => ({
            ...prev,
            [key]: isIncreased ? "increased" : "decreased",
          }));
        }

        // 새로운 타이머 설정
        timers.current[key] = setTimeout(() => {
          setStatus((prev) => ({
            ...prev,
            [key]: "",
          }));
        }, 1000);

        previousData.current[key] = currentValue;
      }
    });
  }, [data]);

  return (
    <div className={styles.container}>
      <table>
        <thead>
          <tr>
            <th>마켓</th>
            <th>현재가</th>
            <th>전일 대비</th>
            <th>거래대금</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(data).map((item) => (
            <tr key={item.cd} onClick={() => onMarketSelect(item.cd)}>
              <td>{getMarketName(item.cd)}</td>
              <td
                className={`${styles.valueBox} ${
                  status[item.cd] === "increased"
                    ? styles.increased
                    : status[item.cd] === "decreased"
                    ? styles.decreased
                    : ""
                }`}
              >
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
