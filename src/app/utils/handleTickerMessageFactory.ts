import { UpbitTickerData } from "@/app/type/call";

export function handleTickerMessageFactory(
  setData: React.Dispatch<React.SetStateAction<Record<string, UpbitTickerData>>>
) {
  return (parsedData: UpbitTickerData) => {
    setData((prevData) => {
      const existingData = prevData[parsedData.cd];

      // 변경된 필드만 비교
      const isDifferent = existingData
        ? Object.entries(parsedData).some(
            ([key, value]) =>
              existingData[key as keyof UpbitTickerData] !== value
          )
        : true; // 기존 데이터가 없으면 무조건 업데이트

      if (isDifferent) {
        // 기존 상태와 새로운 상태 비교, 필요한 부분만 업데이트
        return {
          ...prevData,
          [parsedData.cd]: parsedData,
        };
      }

      return prevData;
    });
  };
}
