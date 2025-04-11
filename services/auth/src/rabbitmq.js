import amqp from "amqplib";

class RabbitMQClient {
  static instance = null;
  connection = null;
  channel = null;
  queues = [];

  /**
   * Creates a new RabbitMQClient instance
   * @param {Array<{queue: string, function: function(import('amqplib').ConsumeMessage): void}>} queues - Array of queue configurations
   * @param {string} queues[].queue - Name of the queue
   * @param {function(import('amqplib').ConsumeMessage): void} queues[].function - Callback function to process messages
   */
  constructor(queues = []) {
    this.queues = queues;
    this.initialize();
  }

  async initialize() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      console.log("Connected to RabbitMQ");

      this.channel = await this.connection.createChannel();
      console.log("Channel created successfully");

      for (const queue of this.queues) {
        await this.channel.assertQueue(queue.queue, { durable: false });
        console.log("Queue asserted:", queue.queue);

        this.channel.consume(
          queue.queue,
          (msg) => {
            if (msg !== null) {
              queue.function(msg);
            }
          },
          { noAck: true }
        );
        console.log("Consumer set up for queue:", queue.queue);
      }

      console.log("RabbitMQ setup complete");
    } catch (error) {
      console.error("RabbitMQ initialization error:", error);
    }
  }

  async send(queue, msg) {
    try {
      if (!this.channel) {
        console.error("Cannot send message - channel not initialized");
        return;
      }

      this.channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });
      console.log(" [x] Sent '%s' to queue '%s'", msg, queue);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
}

export default RabbitMQClient;
