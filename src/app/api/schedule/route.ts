// src/app/api/schedule/route.ts
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function GET() {
  const client = await getMongoClient();
  const db = client.db("Yang"); // 'datecourse'를 'Yang'으로 변경
  const data = await db.collection("schedules").findOne({});

  return NextResponse.json(data);
}

// POST 메서드를 새 항목 추가용으로 변경 (전체 교체 대신)
export async function POST(req: Request) {
  try {
      const body = await req.json();
      const client = await getMongoClient();
      const db = client.db("Yang"); // 'Yang' DB 사용
      const collection = db.collection("schedules");

      // 새 항목을 배열의 요소로 삽입
      // 실제 스케줄 데이터 구조에 따라 수정 필요.
      // schedule.json처럼 한 문서에 day1, day2 등이 있는 경우
      // 특정 day에 항목을 추가하거나, 문서 자체를 업데이트해야 합니다.
      // 여기서는 schedule.json의 구조에 맞춰 단일 문서를 업데이트하는 예시입니다.
      const result = await collection.updateOne(
          {}, // 첫 번째 문서 (또는 특정 _id로 찾기)
          { $set: body }, // JSON 본문으로 문서 전체를 업데이트
          { upsert: true } // 문서가 없으면 새로 생성
      );

      return NextResponse.json({ message: "일정이 성공적으로 업데이트되었습니다.", result });
  } catch (error) {
      console.error("일정 추가/업데이트 실패:", error);
      return NextResponse.json({ message: "서버 오류", error: String(error) }, { status: 500 });
  }
}