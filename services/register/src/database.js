import { MongoClient } from "mongodb";

const uri = process.env.REGISTER_DB_URL;

const client = new MongoClient(uri);
export const db = client.db("cloudservices");
