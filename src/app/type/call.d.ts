export interface UpbitTickerData {
  cd: string; // 마켓 코드
  tp: number; // 현재가
  hp: number; // 고가
  lp: number; // 저가
  atp24h: number; // 24시간 평균가
  atv24h: number; // 24시간 거래량
  cr: number; // 전일 대비 변화율
}
