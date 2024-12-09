import { UpbitTickerData } from "@/app/type/call";

export function handleWebSocketMessageFactory(
  setData: React.Dispatch<React.SetStateAction<Record<string, UpbitTickerData>>>
) {
  return (parsedData: UpbitTickerData) => {
    setData((prevData) => {
      const existingData = prevData[parsedData.cd];

      // 기존 데이터와 필드별 비교
      const isDifferent =
        !existingData || // 기존 데이터가 없거나
        existingData.tp !== parsedData.tp || // 현재가가 다르거나
        existingData.hp !== parsedData.hp || // 고가가 다르거나
        existingData.lp !== parsedData.lp || // 저가가 다르거나
        existingData.cr !== parsedData.cr || // 전일 대비가 다르거나
        existingData.atv24h !== parsedData.atv24h; // 24시간 거래량이 다를 경우

      // 데이터가 변경된 경우만 상태 업데이트
      if (isDifferent) {
        return {
          ...prevData,
          [parsedData.cd]: parsedData,
        };
      }

      // 변경되지 않은 경우 기존 상태 반환
      return prevData;
    });
  };
}
