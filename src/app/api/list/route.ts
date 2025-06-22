import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function GET() {
  const client = await getMongoClient();
  const db = client.db("board");
  const data = await db.collection("travelData").findOne({});
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const client = await getMongoClient();
  const db = client.db("board");
  const collection = db.collection("travelData");

  const existing = await collection.findOne({});
  if (existing) {
    await collection.deleteMany({});
  }

  const result = await collection.insertOne(body);
  return NextResponse.json({ insertedId: result.insertedId });
}