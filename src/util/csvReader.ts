import PageView from "../types/pageView";
import fs from "fs";
import csv from "csv-parser";

export async function readDataFromCSV(filePath: string): Promise<PageView[]> {
    let records: PageView[] = [];

    const stream = fs.createReadStream(filePath).pipe(csv({
        headers: ['visitor_id', 'site', 'path', 'timestamp'],
        skipLines: 0, // this is to handle no headers line
    }));

    for await (const chunk of stream) {
        records.push(chunk);
    }
    return records;
}
