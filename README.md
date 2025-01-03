# D3.js와 WebSocket을 활용한 실시간 암호화폐 차트 프로젝트

## 프로젝트 소개

이 프로젝트는 D3.js와 WebSocket을 활용하여 업비트 API의 실시간 암호화폐 데이터를 시각화하는 웹 애플리케이션입니다. 사용자에게 직관적이고 인터랙티브한 차트 경험을 제공하며, 실시간 시장 데이터를 효율적으로 처리하고 표시합니다.

## 주요 기능

### 1. 실시간 캔들스틱 차트

- D3.js를 활용한 고성능 차트 렌더링
- 다양한 시간 단위 지원 (초/분/일/주/월)
- 크로스헤어와 동적 툴팁 기능
- 실시간 가격 업데이트

### 2. 실시간 거래 데이터

- WebSocket을 통한 실시간 거래 정보 표시
- React-Virtuoso를 활용한 가상 스크롤링
- 가격 변동에 따른 시각적 피드백
- 자동 시간대 조정 (KST)

### 3. 코인 목록 관리

- 실시간 가격 정보 업데이트
- 다중 컬럼 정렬 기능
- 가격 변동 시각적 효과
- 효율적인 상태 관리

## 기술 스택

### Frontend

- **Framework**: Next.js 15.0.4
- **Language**: TypeScript
- **차트 라이브러리**: D3.js 7.9.0
- **스타일링**: SCSS Modules
- **가상화**: React-Virtuoso 4.12.3

### 데이터 통신

- **WebSocket**: 실시간 시세 및 체결 데이터 수신
- **REST API**: 업비트 API를 통한 캔들스틱 데이터 조회
- **API Route**: CORS 이슈 해결을 위한 프록시

## 주요 구현 사항

### 1. 최적화된 WebSocket 관리

```typescript
// 자동 재연결 메커니즘
const handleWebSocketError = useCallback(() => {
  if (reconnectAttemptRef.current < maxReconnectAttempts) {
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptRef.current),
      30000
    );
    reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
    reconnectAttemptRef.current++;
  }
}, []);
```

### 2. 차트 렌더링

```typescript
// D3.js를 활용한 캔들스틱 차트 구현
const renderChart = useCallback(() => {
  // 스케일 설정
  const x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => new Date(d.time)) as [Date, Date])
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.low)!, d3.max(data, (d) => d.high)!])
    .nice()
    .range([height, 0]);
});
```

### 3. 메모리 최적화

```typescript
// 컴포넌트 메모이제이션
const MemoizedCandlestickChart = memo(CandlestickChart);
const MemoizedTrade = memo(Trade);
```

## 성능 최적화

### 1. 렌더링 최적화

- React.memo를 통한 불필요한 리렌더링 방지
- useMemo와 useCallback을 활용한 참조 안정성 확보
- 가상 스크롤링으로 DOM 요소 최소화

### 2. 네트워크 최적화

- WebSocket 재연결 지수 백오프 전략
- API Route를 통한 안전한 API 호출
- 효율적인 데이터 구조화

### 3. 컴포넌트 최적화

- 컴포넌트 단위의 책임 분리
- React Hooks를 활용한 로직 재사용
- 메모이제이션을 통한 성능 최적화

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start
```

## 환경 요구사항

- Node.js 18.0.0 이상
- npm 9.0.0 이상

## 라이선스

MIT License

이 프로젝트는 업비트 오픈 API를 활용하여 제작되었습니다.
