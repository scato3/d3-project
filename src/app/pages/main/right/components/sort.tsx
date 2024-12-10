import React from "react";
import Image from "next/image";
import styles from "./sort.module.scss";
import { UpbitTickerData } from "@/app/type/call";

const ASC_ICON =
  "https://cdn.upbit.com/upbit-web/images/ico_up_down_2.80e5420.png";
const DESC_ICON =
  "https://cdn.upbit.com/upbit-web/images/ico_up_down_1.af5ac5a.png";
const DEFAULT_ICON =
  "https://cdn.upbit.com/upbit-web/images/ico_up_down.1add58d.png";

export function Sortable({
  label,
  sortKey,
  sortConfig,
  onSort,
}: {
  label: string;
  sortKey: keyof UpbitTickerData;
  sortConfig: { key: keyof UpbitTickerData | null; direction: "asc" | "desc" };
  onSort: (key: keyof UpbitTickerData) => void;
}) {
  const isActive = sortConfig.key === sortKey;
  const iconSrc = isActive
    ? sortConfig.direction === "asc"
      ? ASC_ICON
      : DESC_ICON
    : DEFAULT_ICON;

  return (
    <th onClick={() => onSort(sortKey)}>
      {label}
      <Image
        src={iconSrc}
        alt={`${label} 정렬`}
        width={5}
        height={10}
        className={styles.icon}
      />
    </th>
  );
}
