// src/lib/mongodb.ts
import { MongoClient } from "mongodb";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export const getMongoClient = (): Promise<MongoClient> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("❗ MONGODB_URI 환경변수가 설정되지 않았습니다.");
  }

  const options = {};

  if (process.env.NODE_ENV === "development") {
    if (!(global as any)._mongoClientPromise) {
      client = new MongoClient(uri, options);
      (global as any)._mongoClientPromise = client.connect();
    }
    return (global as any)._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
};
