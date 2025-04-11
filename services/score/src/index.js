import "dotenv/config";
import RabbitMQClient from "./rabbitmq.js";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const rabbitMQClient = new RabbitMQClient([
  {
    queue: "score_photo",
    consume: true,
    function: calculateScore,
  },
]);

async function calculateScore(msg) {
  const { target, photo } = JSON.parse(msg.content.toString());
  const response = await rabbitMQClient.request(
    "register_request",
    JSON.stringify({ target })
  );

  const base64Target = response.fileBase64;
  const base64Photo = photo;

  try {
    // Convert base64 strings to PNG objects
    const targetPng = await base64ToPng(base64Target);
    const photoPng = await base64ToPng(base64Photo);

    // Determine comparison dimensions
    const width = Math.min(targetPng.width, photoPng.width);
    const height = Math.min(targetPng.height, photoPng.height);

    // Resize images to the same dimensions
    const resizedTargetPng = createResizedPng(targetPng, width, height);
    const resizedPhotoPng = createResizedPng(photoPng, width, height);

    // Create a diff PNG
    const diffPng = new PNG({ width, height });

    // Compare images pixel-by-pixel
    const mismatchedPixels = pixelmatch(
      resizedTargetPng.data,
      resizedPhotoPng.data,
      diffPng.data,
      width,
      height,
      { threshold: 0.1 }
    );

    // Calculate similarity score (1.0 = perfect match, 0.0 = completely different)
    const totalPixels = width * height;
    const similarityScore = 1 - mismatchedPixels / totalPixels;

    console.log("Similarity score:", similarityScore);

    // Send back the score
    await rabbitMQClient.send(
      "score_result",
      JSON.stringify({ score: similarityScore })
    );
  } catch (error) {
    console.error("Error calculating score:", error);
  }
}

// Function to create a resized PNG with the same data
function createResizedPng(sourcePng, width, height) {
  // Create a new PNG with target dimensions
  const resizedPng = new PNG({ width, height });

  // Simple nearest-neighbor scaling - not the highest quality but works for comparison
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate source coordinates
      const srcX = Math.floor((x * sourcePng.width) / width);
      const srcY = Math.floor((y * sourcePng.height) / height);

      // Calculate indices
      const targetIdx = (y * width + x) * 4;
      const sourceIdx = (srcY * sourcePng.width + srcX) * 4;

      // Copy RGBA values
      resizedPng.data[targetIdx] = sourcePng.data[sourceIdx]; // R
      resizedPng.data[targetIdx + 1] = sourcePng.data[sourceIdx + 1]; // G
      resizedPng.data[targetIdx + 2] = sourcePng.data[sourceIdx + 2]; // B
      resizedPng.data[targetIdx + 3] = sourcePng.data[sourceIdx + 3]; // A
    }
  }

  return resizedPng;
}

// Helper function to convert base64 to PNG
function base64ToPng(base64String) {
  // Existing code is fine
  return new Promise((resolve, reject) => {
    try {
      // Check if base64String is valid
      if (!base64String || typeof base64String !== "string") {
        console.log("Invalid base64 input:", base64String);
        reject(new Error(`Invalid base64 input: ${typeof base64String}`));
        return;
      }

      // Remove base64 header if present
      const base64Data = base64String.includes("base64,")
        ? base64String.split("base64,")[1]
        : base64String;

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, "base64");

      // Parse buffer as PNG
      const png = new PNG();
      png.parse(buffer, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    } catch (error) {
      reject(new Error(`Error processing base64 string: ${error.message}`));
    }
  });
}
