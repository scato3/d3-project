"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import * as d3 from "d3";
import { fetchCandlestickData } from "@/app/call/candle";
import { CandlestickData } from "@/app/type/candle";
import { TimeUnitType } from "@/app/type/time";

export default function CandlestickChart({
  marketCode,
  unit,
}: {
  marketCode: string;
  unit: TimeUnitType;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<CandlestickData[]>([]);

  // 차트 설정값 메모이제이션
  const chartConfig = useMemo(() => {
    const container = svgRef.current?.parentElement;
    const containerWidth = container ? container.clientWidth : 800;
    return {
      margin: { top: 20, right: 30, bottom: 50, left: 100 },
      width: containerWidth - 130,
      height: 400 - 70,
      timeFormat:
        unit === "seconds"
          ? "%H:%M:%S"
          : unit === "minutes"
          ? "%H:%M"
          : "%Y-%m-%d",
    };
  }, [unit]);

  const fetchData = useCallback(async () => {
    try {
      const fetchedData = await fetchCandlestickData(marketCode, unit);
      setData(
        fetchedData.map((d) => ({
          ...d,
          time: d.time * 1000,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch candlestick data:", error);
    }
  }, [marketCode, unit]);

  // 데이터 가져오기 인터벌 설정
  useEffect(() => {
    fetchData();
    const intervalTime = unit === "seconds" ? 1000 : 60000;
    const intervalId = setInterval(fetchData, intervalTime);
    return () => clearInterval(intervalId);
  }, [fetchData, unit]);

  const renderChart = useCallback(() => {
    if (!data.length || !svgRef.current) return;

    const { margin, width, height, timeFormat } = chartConfig;

    // 기존 차트 정리
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

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

    // 축 그리기
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((d) =>
            d3.timeFormat(timeFormat)(
              d instanceof Date ? d : new Date(d as number)
            )
          )
          .tickSizeOuter(0)
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "translate(10,0)");

    svg.append("g").call(d3.axisLeft(y));

    // 캔들스틱 그리기
    const candleWidth = Math.max(width / data.length - 1, 2);

    const candlesticks = svg
      .selectAll(".candlestick")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "candlestick");

    candlesticks
      .append("rect")
      .attr("x", (d) => x(new Date(d.time))!)
      .attr("y", (d) => y(Math.max(d.open, d.close)))
      .attr("width", candleWidth)
      .attr("height", (d) => Math.abs(y(d.open) - y(d.close)))
      .attr("fill", (d) => (d.open > d.close ? "blue" : "red"));

    candlesticks
      .append("line")
      .attr("x1", (d) => x(new Date(d.time))! + candleWidth / 2)
      .attr("x2", (d) => x(new Date(d.time))! + candleWidth / 2)
      .attr("y1", (d) => y(d.high))
      .attr("y2", (d) => y(d.low))
      .attr("stroke", "black");

    // 크로스헤어 및 레이블 설정
    const crosshair = svg.append("g").style("display", "none");
    const priceLabel = svg.append("g").style("display", "none");
    const dateLabel = svg.append("g").style("display", "none");

    // 마우스 이벤트 처리
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", (event) => {
        const [mouseX, mouseY] = d3.pointer(event);
        const xDate = x.invert(mouseX);
        const yValue = y.invert(mouseY);

        crosshair
          .style("display", null)
          .selectAll("line")
          .data([
            [0, mouseY, width, mouseY],
            [mouseX, 0, mouseX, height],
          ])
          .join("line")
          .attr("x1", (d) => d[0])
          .attr("y1", (d) => d[1])
          .attr("x2", (d) => d[2])
          .attr("y2", (d) => d[3])
          .attr("stroke", "gray")
          .attr("stroke-dasharray", "3,3");

        const formattedYValue =
          yValue >= 1000
            ? Math.floor(yValue).toLocaleString()
            : yValue >= 1
            ? yValue.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })
            : yValue.toLocaleString(undefined, {
                minimumFractionDigits: 6,
                maximumFractionDigits: 6,
              });

        updateLabel(priceLabel, formattedYValue, mouseX, mouseY - 20, width);
        updateLabel(
          dateLabel,
          d3.timeFormat(timeFormat)(xDate),
          mouseX,
          height + 20,
          width
        );
      })
      .on("mouseout", () => {
        crosshair.style("display", "none");
        priceLabel.style("display", "none");
        dateLabel.style("display", "none");
      });
  }, [data, chartConfig]);

  useEffect(() => {
    renderChart();
    const handleResize = () => renderChart();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderChart]);

  return <svg ref={svgRef}></svg>;
}

// 레이블 업데이트 헬퍼 함수
function updateLabel(
  label: d3.Selection<SVGGElement, unknown, null, undefined>,
  text: string,
  x: number,
  y: number,
  width: number
) {
  const labelWidth = text.length * 8;
  const xPos = x > width - labelWidth ? x - labelWidth : x;

  label.style("display", null).attr("transform", `translate(${xPos},${y})`);

  label.select("text").text(text);
}
