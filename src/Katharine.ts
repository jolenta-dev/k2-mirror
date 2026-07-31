import express, { type Express } from "express";
import type { DatabaseSync } from "node:sqlite";
import cookieParser from "cookie-parser";
import { initTables } from "./dbs.js";
import { addRoutes } from "./routes.js";
import { initPaths } from "./paths.js";
import { initServer } from "./serve.js";
import { createLogger, type Logger } from "./logger.js";
import { DraggableDiv } from "./public/ui/effects/draggable-div.js";

// one Katharine class exposes the API, this will be what is exposed by the node pkg

export class Katharine {
    static ui = {
        dragdiv: DraggableDiv,
    } as const;

    public db: DatabaseSync;
    public logger: Logger;
    private app: Express;
    private rootDir: string;
    public databasesDir: string;

    constructor(pathToDB: string) {
        this.app = express();
        this.app.use(express.json());
        this.app.use(cookieParser(process.env.COOKIE_SECRET ?? "k2-dev-secret"));
        this.db = this.initTables(pathToDB);
        const paths = this.initPaths();
        this.rootDir = paths.rootDir;
        this.databasesDir = paths.databasesDir;
        this.logger = createLogger(paths.logsDir);
        this.addRoutes();
    }

    // instatiate the 7 primary SQLite tables of the Katharine API -------
    public initTables(pathToDB: string): DatabaseSync {
        return initTables(pathToDB);
    }

    // add the K2 API routes ----------------------------------------------
    public addRoutes(): void {
        addRoutes(this.app, this.db, this.logger);
    }

    // set the K2 paths ---------------------------------------------------
    public initPaths() {
        return initPaths();
    }

    // bootstrap the K2 server --------------------------------------------
    public initServer(): void {
        initServer(this.app, this.rootDir);
    }
}
