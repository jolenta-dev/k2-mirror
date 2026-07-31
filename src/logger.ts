import fs from "node:fs";
import path from "node:path";

export type Logger = {
    info: (message: string) => void;
    error: (message: string) => void;
};

export function createLogger(logsDir: string): Logger {
    fs.mkdirSync(logsDir, { recursive: true });

    function write(level: "INFO" | "ERROR", message: string): void {
        const stamp = new Date();
        const date = stamp.toISOString().slice(0, 10);
        const file = path.join(logsDir, `${date}-log.log`);
        fs.appendFileSync(file, `[${stamp.toISOString()}] ${level}: ${message}\n`);
    }

    return {
        info: (message) => write("INFO", message),
        error: (message) => write("ERROR", message),
    };
}
