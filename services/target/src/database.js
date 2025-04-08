import { MongoClient } from "mongodb";

const uri = process.env.DB_URL;
console.log(`MongoDB URI: ${uri}`); // Log the URI for debugging purposes
const client = new MongoClient(uri);
export const db = client.db("cloudservices");
