import path from "path";
import { Katharine } from "./Katharine.js";
import { initPaths } from "./paths.js";

const { databasesDir } = initPaths();
const katharine = new Katharine(path.join(databasesDir, "katharine.db"));
katharine.initServer();
