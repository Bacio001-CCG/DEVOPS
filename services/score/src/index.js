import "dotenv/config";
import axios from "axios";
import RabbitMQClient from "./rabbitmq.js";
import { searchWithBase64 } from "./imagga.js";

const API_ENDPOINT = "https://api.imagga.com/v2";
const CATEGORIZER = "general_v3";
const INDEX_NAME = "similarity_scoring";

const rabbitMQClient = new RabbitMQClient([
  {
    queue: "score_photo",
    consume: true,
    function: calculateScore,
  },
]);

async function calculateScore(msg) {
  const { target, photo } = JSON.parse(msg.content.toString());

  const result = await searchWithBase64(photo);
  console.log("Search result:", result);

  console.log(`Processing score for target: ${target}`);
}
