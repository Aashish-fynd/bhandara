import { Queue } from "bullmq";
import redis from "@/connections/redis";

export const VIDEO_QUEUE_NAME = "video-processing";

export const videoQueue = new Queue(VIDEO_QUEUE_NAME, {
  connection: redis,
});

export const addVideoJob = async (mediaId: string, eventId: string) => {
  await videoQueue.add("process", { mediaId, eventId });
};
