"use client";

import React, { useState, useCallback, memo } from "react";
import CandlestickChart from "./components/chart";
import styles from "./left.module.scss";
import { getMarketName } from "@/app/utils/translate";
import { TimeUnitType } from "@/app/type/time";
import Trade from "./components/trade";

const MemoizedCandlestickChart = memo(CandlestickChart);
const MemoizedTrade = memo(Trade);

export default function Left({
  selectedMarketCode,
}: {
  selectedMarketCode: string;
}) {
  const [unit, setUnit] = useState<TimeUnitType>("days");

  const timeUnits = [
    { label: "초", value: "seconds" },
    { label: "분", value: "minutes" },
    { label: "일", value: "days" },
    { label: "주", value: "weeks" },
    { label: "월", value: "months" },
  ] as const;

  const handleUnitChange = useCallback((newUnit: TimeUnitType) => {
    setUnit(newUnit);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.marketName}>
          {getMarketName(selectedMarketCode)}
        </div>
        <div className={styles.buttonGroup}>
          {timeUnits.map((unitOption) => (
            <button
              key={unitOption.value}
              className={`${styles.button} ${
                unit === unitOption.value ? styles.active : ""
              }`}
              onClick={() => handleUnitChange(unitOption.value)}
            >
              {unitOption.label}
            </button>
          ))}
        </div>
      </div>
      <MemoizedCandlestickChart marketCode={selectedMarketCode} unit={unit} />
      <MemoizedTrade selectedMarketCode={selectedMarketCode} />
    </div>
  );
}
