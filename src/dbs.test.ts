import { describe, expect, it } from "vitest";
import { initTables } from "./dbs.js";

const EXPECTED_TABLES = [
    "users",
    "user_decoration",
    "conversations",
    "conversation_members",
    "messages",
    "announcements",
    "chat_tags",
    "user_chat_tags",
    "user_available_tags",
] as const;

describe("initTables", () => {
    it("creates all primary tables", () => {
        const db = initTables(":memory:");

        const rows = db
            .prepare(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            )
            .all() as Array<{ name: string }>;

        expect(rows.map((row) => row.name).sort()).toEqual([...EXPECTED_TABLES].sort());
    });
});
