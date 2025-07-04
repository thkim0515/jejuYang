// src/app/api/list/route.ts
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function GET() {
  const client = await getMongoClient();
  const db = client.db("Yang"); // 'board'를 'Yang'으로 변경
  const data = await db.collection("travelData").findOne({});
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const client = await getMongoClient();
  const db = client.db("Yang"); // 'board'를 'Yang'으로 변경
  const collection = db.collection("travelData");

  const existing = await collection.findOne({});
  if (existing) {
    await collection.deleteMany({});
  }

  const result = await collection.insertOne(body);
  return NextResponse.json({ insertedId: result.insertedId });
}
