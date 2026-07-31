import path from "path";
import { fileURLToPath } from "url";

export type KatharinePaths = {
    rootDir: string;
    databasesDir: string;
    logsDir: string;
};

// set the K2 paths ---------------------------------------------------
export function initPaths(): KatharinePaths {
    const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
    const databasesDir = path.join(rootDir, "server", "dbs");
    const logsDir = path.join(rootDir, "server", "logs");
    return { rootDir, databasesDir, logsDir };
}
