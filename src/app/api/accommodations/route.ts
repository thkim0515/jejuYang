// src/app/api/accommodations/route.ts
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function GET() {
  const client = await getMongoClient();
  const db = client.db("Yang");
  const data = await db.collection("accommodations").findOne({});
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const client = await getMongoClient();
  const db = client.db("Yang");
  const collection = db.collection("accommodations");

  // 기존 문서 전체 삭제
  await collection.deleteMany({});

  // 새 데이터 1건 삽입
  const result = await collection.insertOne(body);
  return NextResponse.json({ insertedId: result.insertedId });
}
