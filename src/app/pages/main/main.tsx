"use client";

import React, { useState, useCallback, memo } from "react";
import Left from "./left/left";
import Right from "./right/right";
import styles from "./main.module.scss";

const MemoizedLeft = memo(Left);
const MemoizedRight = memo(Right);

export default function Main() {
  const [selectedMarketCode, setSelectedMarketCode] =
    useState<string>("KRW-BTC");

  const handleMarketSelect = useCallback((marketCode: string) => {
    setSelectedMarketCode(marketCode);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <MemoizedLeft selectedMarketCode={selectedMarketCode} />
      </div>
      <div className={styles.right}>
        <MemoizedRight
          onMarketSelectAction={handleMarketSelect}
          selectedMarketCode={selectedMarketCode}
        />
      </div>
    </div>
  );
}
