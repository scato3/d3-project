import { NextResponse } from "next/server";

export const config = {
  runtime: "edge",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketCode = searchParams.get("marketCode");
  const unit = searchParams.get("unit");
  const count = searchParams.get("count") || "200";

  if (!marketCode || !unit) {
    return NextResponse.json(
      { error: "Missing required query parameters" },
      { status: 400 }
    );
  }

  const endpointMap: Record<string, string> = {
    seconds: "seconds",
    minutes: "minutes/1", // 1분 단위
    days: "days",
    weeks: "weeks",
    months: "months",
  };

  const path = endpointMap[unit];
  if (!path) {
    return NextResponse.json(
      { error: `Invalid unit type: ${unit}` },
      { status: 400 }
    );
  }

  const apiUrl = `https://api.upbit.com/v1/candles/${path}?market=${marketCode}&count=${count}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Upbit API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
