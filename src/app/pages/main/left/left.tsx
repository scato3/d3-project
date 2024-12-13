"use client";

import React, { useState } from "react";
import CandlestickChart from "./components/chart";
import styles from "./left.module.scss";
import { getMarketName } from "@/app/utils/translate";
import { TimeUnitType } from "@/app/type/time";
import Trade from "./components/trade";

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
              onClick={() => setUnit(unitOption.value)}
            >
              {unitOption.label}
            </button>
          ))}
        </div>
      </div>
      <CandlestickChart marketCode={selectedMarketCode} unit={unit} />
      <Trade selectedMarketCode={selectedMarketCode} />
    </div>
  );
}
