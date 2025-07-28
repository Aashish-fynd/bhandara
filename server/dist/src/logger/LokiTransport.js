import axios from "axios";
import TransportStream from "winston-transport";
export class LokiTransport extends TransportStream {
    lokiUrl;
    labels;
    flushInterval;
    maxBatchSize;
    logBuffer = [];
    constructor(opts = {}) {
        super(opts);
        this.lokiUrl = opts.lokiUrl;
        this.labels = opts.labels;
        this.flushInterval = opts.flushInterval;
        this.maxBatchSize = opts.maxBatchSize;
        setInterval(() => this.flush(), this.flushInterval).unref();
    }
    log(info, callback) {
        setImmediate(() => this.emit("logged", info));
        const timestamp = `${Date.now()}000000`; // ms to ns
        const message = `[${info.level === "http" ? "info" : info.level}] ${info.message}`;
        this.logBuffer.push([timestamp, message]);
        if (this.logBuffer.length >= this.maxBatchSize) {
            this.flush();
        }
        callback();
    }
    async flush() {
        if (this.logBuffer.length === 0)
            return;
        const batch = this.logBuffer.splice(0, this.maxBatchSize);
        const payload = {
            streams: [
                {
                    stream: this.labels,
                    values: batch,
                },
            ],
        };
        try {
            await axios.post(this.lokiUrl, payload, {
                headers: { "Content-Type": "application/json" },
            });
        }
        catch (err) {
            console.error("Loki transport push failed:", err.message);
        }
    }
}
//# sourceMappingURL=LokiTransport.js.map