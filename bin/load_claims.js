#!/usr/bin/env node

const { processClaim } = require("../lib/process_claim.js");
const mysql = require("mysql");
const readline = require("readline");
const stream = require("stream");

db = mysql.createConnection({
  host: "db",
  port: 3306,
  user: "root",
  password: "tamagotchi",
  database: "claims",
  multipleStatements: true,
});

/**
 * Intended to be called with a jsonl file from the command line:
 *
 *  Example:
 *   node bin/load_claims.js < ./test/data/01.jsonl
 */
function main() {
  process.stdin.on("data", (data) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(data);

    var rl = readline.createInterface({
      input: bufferStream,
    });

    rl.on("line", (line) => {
      const parsedInput = JSON.parse(line);

      parsedInput.date_of_birth = new Date(parsedInput.date_of_birth);
      parsedInput.claim_date = new Date(parsedInput.claim_date);

      const promise = processClaim(db, parsedInput)
        .then(() => {
          console.log("\n Successfully processed claim \n");
        })
        .catch((err) => {
          console.log("\n !!! Error inserting claim into database !!! \n");
          console.log(err + "\n");
        });
    });
  });
}

main();
