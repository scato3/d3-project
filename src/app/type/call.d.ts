export interface UpbitTickerData {
  cd: string; // 마켓 코드
  tp: number; // 현재가
  hp: number; // 고가
  lp: number; // 저가
  atp24h: number; // 24시간 평균가
  atv24h: number; // 24시간 거래량
  scr: number; // 전일 대비 변화율
}

export interface UpbitTradeData {
  ab: "BID" | "ASK"; // 매수(BID) 또는 매도(ASK) 구분
  bap: number; // 매수호가
  bas: number; // 매수 잔량
  bbp: number; // 매도호가
  bbs: number; // 매도 잔량
  c: "RISE" | "FALL" | "EVEN"; // 상승(RISE), 하락(FALL), 보합(EVEN) 상태
  cd: string; // 마켓 코드 (예: "KRW-BTC")
  cp: number; // 전일 대비 변화 금액
  pcp: number; // 전일 종가
  sid: string; // 고유 식별자
  st: "SNAPSHOT" | "REALTIME"; // 스냅샷(SNAPSHOT) 또는 실시간(REALTIME) 데이터
  td: string; // 거래일자 (YYYY-MM-DD 형식)
  tms: number; // 타임스탬프 (밀리초)
  tp: number; // 거래 가격
  ttm: string; // 거래 시간 (HH:mm:ss 형식)
  ttms: number; // 거래 타임스탬프 (밀리초)
  tv: number; // 거래량
  ty: "trade"; // 메시지 타입
}
