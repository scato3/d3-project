export interface CandleApiResponse {
  timestamp: number;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
}

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
