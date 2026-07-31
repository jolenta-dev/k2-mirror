import path from "path";
import express, { type Express } from "express";

// bootstrap the K2 server --------------------------------------------
export function initServer(app: Express, rootDir: string): void {
    app.get("/", (_req, res) => {
        res.sendFile(path.join(rootDir, "./index.html"));
    });

    app.use("/server", (_req, res) => {
        res.sendStatus(403);
    });

    app.use(express.static(rootDir));

    app.listen(4000, () => console.log("Server running on :4000"));
}
