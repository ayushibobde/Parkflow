import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_PATH = path.join(
  __dirname,
  "../data/violations.csv"
);

let records = [];

export async function loadDataset() {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(DATASET_PATH)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", () => {
        records = results;

        console.log(
          `Loaded ${records.length} violation records`
        );

        resolve(records);
      })
      .on("error", reject);
  });
}

export function getRecords() {
  return records;
}