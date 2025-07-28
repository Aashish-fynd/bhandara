import { Queue } from "bullmq";
import redis from "@/connections/redis";
export const VIDEO_QUEUE_NAME = "video-processing";
export const videoQueue = new Queue(VIDEO_QUEUE_NAME, {
    connection: redis,
});
export const addVideoJob = async (mediaId, eventId) => {
    await videoQueue.add("process", { mediaId, eventId });
};
//# sourceMappingURL=video.js.map