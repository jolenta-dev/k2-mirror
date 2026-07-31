import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export const DATABASES_DIR = path.join(rootDir, "src", "server", "dbs");
