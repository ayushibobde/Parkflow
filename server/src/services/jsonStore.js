import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.resolve(__dirname, "../data");

export async function readJson(fileName) {
  const filePath = path.join(dataDirectory, fileName);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function writeJson(fileName, value) {
  const filePath = path.join(dataDirectory, fileName);
  const tempPath = `${filePath}.tmp`;

  await fs.writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tempPath, filePath);

  return value;
}

export async function updateCollectionItem(fileName, id, updater) {
  const collection = await readJson(fileName);
  const index = collection.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  collection[index] = updater(collection[index]);
  await writeJson(fileName, collection);

  return collection[index];
}
