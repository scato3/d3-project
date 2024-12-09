import { CandleApiResponse, CandlestickData } from "../type/candle";

export async function fetchCandlestickData(
  marketCode: string,
  unit: "seconds" | "minutes" | "days" | "weeks" | "months",
  count: number = 200
): Promise<CandlestickData[]> {
  const endpointMap: Record<string, string> = {
    seconds: "seconds",
    minutes: "minutes/1", // 1분 단위
    days: "days",
    weeks: "weeks",
    months: "months",
  };

  // `unit` 유효성 검사 및 endpoint 구성
  const path = endpointMap[unit];
  if (!path) {
    throw new Error(`Invalid unit type: ${unit}`);
  }

  const endpoint = `https://api.upbit.com/v1/candles/${path}?market=${marketCode}&count=${count}`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Failed to fetch candlestick data: ${response.statusText}`);
  }

  const data: CandleApiResponse[] = await response.json();

  return data.map((candle) => ({
    time: Math.floor(candle.timestamp / 1000), // Convert to seconds
    open: candle.opening_price,
    high: candle.high_price,
    low: candle.low_price,
    close: candle.trade_price,
  }));
}
