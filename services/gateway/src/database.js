import { MongoClient } from "mongodb";

const uri = process.env.GATEWAY_DB_URL;
const client = new MongoClient(uri);
export const db = client.db("cloudservices");
