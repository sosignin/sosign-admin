import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// @desc    Get progress updates with proxying to backend
// @route   GET /api/progress-updates/*
export async function GET(request) {
  try {
    // Get the full URL pathname
    const url = new URL(request.url);
    const pathname = url.pathname.replace("/api/progress-updates", "");
    const searchParams = url.search;
    
    // Get token from request headers
    const authHeader = request.headers.get("authorization");

    // Construct the backend URL
    const backendUrl = `${API_BASE_URL}/api/progress-updates${pathname}${searchParams}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || "Failed to fetch progress updates" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching progress updates:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
