"use client";

import React, { useState } from "react";
import Left from "./left/left";
import Right from "./right/right";
import styles from "./main.module.scss";

export default function Main() {
  const [selectedMarketCode, setSelectedMarketCode] =
    useState<string>("KRW-BTC");

  const handleMarketSelect = (marketCode: string) => {
    setSelectedMarketCode(marketCode);
    console.log("Selected Market Code:", marketCode);
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <Left selectedMarketCode={selectedMarketCode} />
      </div>
      <div className={styles.right}>
        <Right onMarketSelect={handleMarketSelect} />
      </div>
    </div>
  );
}
