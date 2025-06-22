import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function GET() {
  const client = await getMongoClient();
  const db = client.db("datecourse");
  const data = await db.collection("schedules").findOne({});

  return NextResponse.json(data);
}


export async function POST(req: Request) {
    const body = await req.json(); // POST된 JSON 데이터
    const client = await getMongoClient();
    const db = client.db("datecourse"); // 사용할 DB명
  
    const collection = db.collection("schedules");
  
    const existing = await collection.findOne({});
    if (existing) {
        await collection.deleteMany({}); // 기존 데이터 전부 삭제
    }
  
    const result = await collection.insertOne(body); // 새 데이터 삽입
  
    return NextResponse.json({ insertedId: result.insertedId });
}