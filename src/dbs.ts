import { DatabaseSync } from "node:sqlite";

// instatiate the 7 primary SQLite tables of the Katharine API -------
export function initTables(pathToDB: string): DatabaseSync {
    const db = new DatabaseSync(pathToDB);
    db.exec("PRAGMA foreign_keys = ON");

    db.exec(`
          CREATE TABLE IF NOT EXISTS users (
              user_id INTEGER PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              registration_date TEXT NOT NULL DEFAULT (datetime('now'))
          );

          CREATE TABLE IF NOT EXISTS user_decoration (
            user_id INTEGER NOT NULL,
            decoration TEXT DEFAULT NULL,
            color TEXT DEFAULT "#fff",
            FOREIGN KEY (user_id) REFERENCES users(user_id)
          );

          CREATE TABLE IF NOT EXISTS conversations (
              convo_id INTEGER PRIMARY KEY,
              name TEXT NOT NULL,
              is_dm INTEGER NOT NULL DEFAULT 0,
              date_created TEXT NOT NULL DEFAULT (datetime('now'))
          );

          CREATE TABLE IF NOT EXISTS conversation_members (
              convo_id INTEGER NOT NULL,
              user_id INTEGER NOT NULL,
              last_read_message_id INTEGER,
              joined_at TEXT NOT NULL DEFAULT (datetime('now')),
              PRIMARY KEY (convo_id, user_id),
              FOREIGN KEY (convo_id) REFERENCES conversations(convo_id),
              FOREIGN KEY (user_id) REFERENCES users(user_id)
          );

          CREATE TABLE IF NOT EXISTS messages (
              message_id INTEGER PRIMARY KEY,
              convo_id INTEGER NOT NULL,
              sender INTEGER NOT NULL,
              body TEXT NOT NULL,
              timestamp TEXT NOT NULL DEFAULT (datetime('now')),
              FOREIGN KEY (convo_id) REFERENCES conversations(convo_id),
              FOREIGN KEY (sender) REFERENCES users(user_id)
          );

          CREATE TABLE IF NOT EXISTS announcements (
              announcement_id INTEGER PRIMARY KEY,
              message TEXT NOT NULL,
              timestamp TEXT NOT NULL DEFAULT (datetime('now')),
              sender INTEGER NOT NULL,
              scope TEXT NOT NULL,
              FOREIGN KEY (sender) REFERENCES users(user_id)
          );

          CREATE TABLE IF NOT EXISTS chat_tags (
              tag_id INTEGER PRIMARY KEY,
              tag TEXT NOT NULL UNIQUE,
              style TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS user_chat_tags (
              user_id INTEGER PRIMARY KEY,
              active_tag INTEGER,
              FOREIGN KEY (user_id) REFERENCES users(user_id),
              FOREIGN KEY (active_tag) REFERENCES chat_tags(tag_id)
          );

          CREATE TABLE IF NOT EXISTS user_available_tags (
              user_id INTEGER NOT NULL,
              tag_id INTEGER NOT NULL,
              PRIMARY KEY (user_id, tag_id),
              FOREIGN KEY (user_id) REFERENCES users(user_id),
              FOREIGN KEY (tag_id) REFERENCES chat_tags(tag_id)
          );

          CREATE INDEX IF NOT EXISTS idx_messages_convo
              ON messages(convo_id, message_id);
          `);

    // migrate user_decoration if an older schema is present
    const decorationCols = db.prepare("PRAGMA table_info(user_decoration)").all() as Array<{
        name: string;
    }>;
    if (!decorationCols.some((col) => col.name === "color")) {
        db.exec(`ALTER TABLE user_decoration ADD COLUMN color TEXT DEFAULT "#fff"`);
    }

    return db;
}
