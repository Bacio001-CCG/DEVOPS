import amqp from "amqplib";

class RabbitMQClient {
  static instance = null;
  connection = null;
  channel = null;
  queues = [];
  responseHandlers = new Map();
  replyQueueName = null;

  constructor(queues) {
    this.queues = queues;
    this.initialize();
  }

  async initialize() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      console.log("Connected to RabbitMQ");

      this.channel = await this.connection.createChannel();
      console.log("Channel created successfully");

      // Create exclusive reply queue for this client instance
      const { queue } = await this.channel.assertQueue("", {
        exclusive: true,
        autoDelete: true,
      });
      this.replyQueueName = queue;
      console.log("Created exclusive reply queue:", this.replyQueueName);

      // Setup consumer for reply queue
      this.channel.consume(
        this.replyQueueName,
        (msg) => {
          if (msg !== null) {
            this.handleReplyMessage(msg);
          }
        },
        { noAck: true }
      );
      console.log("Set up consumer for reply queue");

      for (const queue of this.queues) {
        await this.channel.assertQueue(queue.queue, { durable: false });
        console.log("Queue asserted:", queue.queue);

        if (queue.consume)
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

  // Add this method to handle reply messages
  handleReplyMessage(msg) {
    const correlationId = msg.properties.correlationId;

    if (correlationId && this.responseHandlers.has(correlationId)) {
      const handler = this.responseHandlers.get(correlationId);
      const content = msg.content.toString();

      try {
        handler.resolve(content);
      } catch (error) {
        console.error("Error handling reply:", error);
      }

      // Clean up the handler
      this.responseHandlers.delete(correlationId);
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

  async request(queue, message, timeout = 30000) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.channel) {
          return reject(new Error("Channel not initialized"));
        }

        // Generate unique correlation ID for this request
        const correlationId = Math.random().toString(16).slice(2);

        // Convert message to string if it's not already
        const msgStr =
          typeof message === "string" ? message : JSON.stringify(message);

        // Store the handlers with a timeout
        const timeoutId = setTimeout(() => {
          if (this.responseHandlers.has(correlationId)) {
            this.responseHandlers.delete(correlationId);
            reject(
              new Error(`Request to ${queue} timed out after ${timeout}ms`)
            );
          }
        }, timeout);

        this.responseHandlers.set(correlationId, {
          resolve: (result) => {
            clearTimeout(timeoutId);
            resolve(JSON.parse(result));
          },
          timeout: timeoutId,
        });

        // Make sure the queue exists
        await this.channel.assertQueue(queue, { durable: false });

        // Send the request with this client's reply queue name
        this.channel.sendToQueue(queue, Buffer.from(msgStr), {
          correlationId,
          replyTo: this.replyQueueName,
          persistent: true,
        });

        console.log(
          ` [x] Sent request to '${queue}' with correlation ID: ${correlationId}`
        );
      } catch (error) {
        console.error("Error sending request:", error);
        reject(error);
      }
    });
  }
}

export default RabbitMQClient;
