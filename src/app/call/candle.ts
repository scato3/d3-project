import { CandleApiResponse, CandlestickData } from "../type/candle";

export async function fetchCandlestickData(
  marketCode: string,
  unit: "seconds" | "minutes" | "days" | "weeks" | "months",
  count: number = 200
): Promise<CandlestickData[]> {
  const proxyEndpoint = `/api/proxy-candlestick?marketCode=${marketCode}&unit=${unit}&count=${count}`;

  const response = await fetch(proxyEndpoint);

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
