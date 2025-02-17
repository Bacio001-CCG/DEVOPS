import { MongoClient } from "mongodb";

const uri = process.env.DB_URL;

const client = new MongoClient(uri);
export const db = client.db("bookclubmembers");

