// src/app/api/places/route.ts
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

// GET 메서드 핸들러
export async function GET() {
  try {
    const client = await getMongoClient();
    const db = client.db("Yang"); // 'datecourse'를 'Yang'으로 변경
    const places = await db.collection("places").find().toArray();

    return NextResponse.json({ places });
  } catch (error) {
    console.error("MongoDB 연결 오류:", error);
    return NextResponse.json({ message: "서버 내부 오류", error }, { status: 500 });
  }
}