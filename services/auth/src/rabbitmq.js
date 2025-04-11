import amqp from "amqplib";

class RabbitMQClient {
  static instance = null;
  connection = null;
  channel = null;
  queues = [];

  constructor(queues = []) {
    this.queues = queues;
    this.initialize();
  }

  async initialize() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost");
      console.log("Connected to RabbitMQ");

      this.channel = await this.connection.createChannel();
      console.log("Channel created successfully");

      // Only set up consumers if queues are provided
      if (this.queues.length > 0) {
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

      await this.channel.assertQueue(queue, { durable: false });
      this.channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });
      console.log(" [x] Sent '%s' to queue '%s'", msg, queue);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
}

export default RabbitMQClient;