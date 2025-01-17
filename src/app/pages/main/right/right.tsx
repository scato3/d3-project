"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useUpbitWebSocket } from "@/app/call/socket";
import { UpbitTickerData } from "@/app/type/call";
import { handleTickerMessageFactory } from "@/app/utils/handleTickerMessageFactory";
import { marketCodes } from "@/app/data/init";
import { getMarketName } from "@/app/utils/translate";
import styles from "./right.module.scss";
import { Sortable } from "./components/sort";

export default function Right({
  onMarketSelectAction,
  selectedMarketCode,
}: {
  onMarketSelectAction: (marketCode: string, marketPrice: number) => void;
  selectedMarketCode: string;
}) {
  const [data, setData] = useState<Record<string, UpbitTickerData>>({});
  const previousData = useRef<Record<string, number>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, NodeJS.Timeout>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UpbitTickerData | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const handleTickerMessage = useMemo(
    () => handleTickerMessageFactory(setData),
    []
  );

  useUpbitWebSocket({
    marketCodes,
    onMessage: handleTickerMessage,
  });

  const sortedData = useMemo(() => {
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

  const handleSort = useCallback((key: keyof UpbitTickerData) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const updateStatus = useCallback(
    (key: string, currentValue: number, previousValue: number) => {
      if (currentValue !== previousValue) {
        const isIncreased = currentValue > previousValue;
        const isDecreased = currentValue < previousValue;

        if (timers.current[key]) {
          clearTimeout(timers.current[key]);
        }

        if (isIncreased || isDecreased) {
          setStatus((prev) => ({
            ...prev,
            [key]: isIncreased ? "increased" : "decreased",
          }));
        }

        timers.current[key] = setTimeout(() => {
          setStatus((prev) => ({
            ...prev,
            [key]: "",
          }));
        }, 1000);

        previousData.current[key] = currentValue;
      }
    },
    []
  );

  useEffect(() => {
    Object.keys(data).forEach((key) => {
      const currentValue = data[key]?.tp || 0;
      const previousValue = previousData.current[key] || 0;
      updateStatus(key, currentValue, previousValue);
    });
  }, [data, updateStatus]);

  useEffect(() => {
    if (selectedMarketCode && data[selectedMarketCode]) {
      const selectedMarketData = data[selectedMarketCode];
      const marketName = getMarketName(selectedMarketCode);
      const price =
        selectedMarketData.tp < 1
          ? selectedMarketData.tp.toFixed(6)
          : selectedMarketData.tp.toLocaleString();

      document.title = `${price} ${marketName}`;
    }
  }, [selectedMarketCode, data]);

  const memoizedTableBody = useMemo(
    () => (
      <tbody>
        {sortedData.map((item) => (
          <tr
            key={item.cd}
            onClick={() => onMarketSelectAction(item.cd, item.tp)}
          >
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
            <td className={item.scr > 0 ? styles.positive : styles.negative}>
              {(item.scr * 100).toFixed(2)}%
            </td>
            <td>
              {item.atp24h
                ? `${Math.floor(item.atp24h / 1000000).toLocaleString()}백만`
                : "데이터 없음"}
            </td>
          </tr>
        ))}
      </tbody>
    ),
    [sortedData, status, onMarketSelectAction]
  );

  return (
    <div className={styles.container}>
      <table>
        <thead>
          <tr>
            <th>마켓</th>
            <Sortable
              label="현재가"
              sortKey="tp"
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            <Sortable
              label="전일 대비"
              sortKey="scr"
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            <Sortable
              label="거래대금"
              sortKey="atp24h"
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </tr>
        </thead>
        {memoizedTableBody}
      </table>
    </div>
  );
}
