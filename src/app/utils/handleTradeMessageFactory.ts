import { UpbitTradeData } from "@/app/type/call";

export function handleTradeMessageFactory(
  setTrades: React.Dispatch<React.SetStateAction<UpbitTradeData[]>>
) {
  return (parsedData: UpbitTradeData) => {
    setTrades((prevTrades) => {
      // 기존 데이터에 동일한 거래 ID가 있다면 중복 제거
      if (prevTrades.some((trade) => trade.sid === parsedData.sid)) {
        return prevTrades;
      }

      // 새로운 거래 데이터를 가장 앞에 추가하고, 최대 50개만 유지
      return [parsedData, ...prevTrades.slice(0, 49)];
    });
  };
}
