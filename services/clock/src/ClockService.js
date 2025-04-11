import RabbitMQClient  from './rabbitmq.js';
import { db } from "./database.js";

class ClockService {
  constructor() {    
    this.rabbitMQClient = new RabbitMQClient([
      {
        queue: "start_clock",
        function: this.setupClock.bind(this),
      },
    ]);

    this.resumeActiveClocks()
  }  

  async resumeActiveClocks() {
    const activeClocks = await db.collection("target_timings").find({ isEnded: false }).toArray();

    for (const clock of activeClocks) {
      const { targetId, endTime } = clock;

      const remainingTime = new Date(endTime) - new Date();
      if (remainingTime <= 0) {
        await this.handleClockEnd(targetId);
      } else {
        console.log(`Resuming clock for ${targetId}, ends in ${Math.floor(remainingTime / 1000)} seconds`);
        this.startClock(targetId, new Date(endTime));
      }
    }
  }
  
  async setupClock(msg) {
    const { targetId, endTime } = JSON.parse(msg.content.toString());

    await db.collection("target_timings").insertOne({
      targetId,
      startTime: new Date(),
      endTime: new Date(endTime),
      isEnded: false,
    });

    this.startClock(targetId, endTime);
  }

  async handleClockEnd(targetId) {
    await db.collection("target_timings").updateOne(
      { targetId },
      { $set: { isEnded: true } }
    );

    //use rabbitmqto notify other services about the clock end
    const mailMessage = {
      to: "ajw.berkers@student.avans.nl",
      subject: "Timer has ended",
      text: `Timer Has ended:\nid: ${targetId}`,
    };
    await this.rabbitMQClient.send("send_email", JSON.stringify(mailMessage));
    
    console.log(`Competition for target ${targetId} has ended.`);
  }

  startClock(targetId, endTime) {
    const delay = new Date(endTime) - new Date();
    if (delay <= 0) return this.handleClockEnd(targetId);
  
    console.log(`Clock started for target ${targetId}, ends in ${Math.floor(delay / 1000)} seconds`);
  
    setTimeout(() => {
      this.handleClockEnd(targetId);
    }, delay);
  }
}

export default new ClockService();
