"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
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

  const fetchData = useCallback(async () => {
    const fetchedData = await fetchCandlestickData(marketCode, unit);
    setData(
      fetchedData.map((d) => ({
        ...d,
        time: d.time * 1000,
      }))
    );
  }, [marketCode, unit]);

  useEffect(() => {
    fetchData();

    let intervalId: NodeJS.Timeout | null = null;
    if (unit === "seconds") {
      intervalId = setInterval(fetchData, 1000);
    } else {
      intervalId = setInterval(fetchData, 60000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchData, unit]);

  const renderChart = useCallback(() => {
    if (!data.length) return;

    const container = svgRef.current?.parentElement;
    const containerWidth = container ? container.clientWidth : 800;

    const margin = { top: 20, right: 30, bottom: 50, left: 100 };
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.time)) as [Date, Date])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.low)!, d3.max(data, (d) => d.high)!])
      .nice()
      .range([height, 0]);

    const timeFormat = (() => {
      if (unit === "seconds") return "%H:%M:%S";
      if (unit === "minutes") return "%H:%M";
      return "%Y-%m-%d";
    })();

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((d) => {
            // 강제로 Date 객체로 변환
            const date = d instanceof Date ? d : new Date(d as number);
            return d3.timeFormat(timeFormat)(date);
          })
          .tickSizeOuter(0)
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "translate(10,0)");

    svg.append("g").call(d3.axisLeft(y));

    svg
      .selectAll(".candle")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(new Date(d.time))!)
      .attr("y", (d) => y(Math.max(d.open, d.close)))
      .attr("width", Math.max(width / data.length - 1, 2))
      .attr("height", (d) => Math.abs(y(d.open) - y(d.close)))
      .attr("fill", (d) => (d.open > d.close ? "blue" : "red"));

    svg
      .selectAll(".stem")
      .data(data)
      .enter()
      .append("line")
      .attr(
        "x1",
        (d) => x(new Date(d.time))! + Math.max(width / data.length - 1, 2) / 2
      )
      .attr(
        "x2",
        (d) => x(new Date(d.time))! + Math.max(width / data.length - 1, 2) / 2
      )
      .attr("y1", (d) => y(d.high))
      .attr("y2", (d) => y(d.low))
      .attr("stroke", "black");

    const crosshair = svg.append("g").style("display", "none");

    crosshair
      .append("line")
      .attr("class", "crosshair-x")
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", height);

    crosshair
      .append("line")
      .attr("class", "crosshair-y")
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "3,3")
      .attr("x1", 0)
      .attr("x2", width);

    const priceLabel = svg.append("g").style("display", "none");

    priceLabel
      .append("rect")
      .attr("fill", "black")
      .attr("width", 80)
      .attr("height", 20)
      .attr("rx", 5);

    priceLabel
      .append("text")
      .attr("fill", "white")
      .attr("x", 40)
      .attr("y", 14)
      .attr("text-anchor", "middle")
      .style("font-size", "12px");

    const dateLabel = svg.append("g").style("display", "none");

    dateLabel
      .append("rect")
      .attr("fill", "black")
      .attr("width", 100)
      .attr("height", 20)
      .attr("rx", 5);

    dateLabel
      .append("text")
      .attr("fill", "white")
      .attr("x", 50)
      .attr("y", 14)
      .attr("text-anchor", "middle")
      .style("font-size", "12px");

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

        const formattedYValue = (() => {
          if (yValue >= 1000) {
            // 1000 이상: 정수만 표시하고 로케일 적용
            return Math.floor(yValue).toLocaleString();
          } else if (yValue >= 1) {
            // 1 이상 1000 미만: 소수점 첫째 자리까지 표시하고 로케일 적용
            return yValue.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            });
          } else {
            // 1 미만: 소수점 여섯째 자리까지 표시
            return yValue.toLocaleString(undefined, {
              minimumFractionDigits: 6,
              maximumFractionDigits: 6,
            });
          }
        })();

        const formattedDate = d3.timeFormat(timeFormat)(xDate);

        crosshair.style("display", null);
        crosshair
          .select(".crosshair-x")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", mouseY)
          .attr("y2", mouseY);

        crosshair
          .select(".crosshair-y")
          .attr("x1", x(xDate))
          .attr("x2", x(xDate))
          .attr("y1", 0)
          .attr("y2", height);

        priceLabel
          .style("display", null)
          .attr(
            "transform",
            `translate(${mouseX > width - 100 ? mouseX - 100 : mouseX - 40}, ${
              mouseY - 20
            })`
          );
        priceLabel.select("text").text(`${formattedYValue}`);

        dateLabel
          .style("display", null)
          .attr(
            "transform",
            `translate(${mouseX > width - 100 ? mouseX - 100 : mouseX - 40}, ${
              height + 20
            })`
          );
        dateLabel.select("text").text(`${formattedDate}`);
      })
      .on("mouseout", () => {
        crosshair.style("display", "none");
        priceLabel.style("display", "none");
        dateLabel.style("display", "none");
      });
  }, [data, unit]);

  useEffect(() => {
    renderChart();

    const handleResize = () => {
      renderChart();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [renderChart]);

  return <svg ref={svgRef}></svg>;
}
