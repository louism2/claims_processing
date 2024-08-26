#!/usr/bin/env node

const { processClaim } = require("../lib/process_claim.js");
const mysql = require("mysql");

db = mysql.createConnection({
  host: "db",
  user: "root",
  password: "tamagotchi",
  port: 3306,
  database: "claims",
  multipleStatements: true,
});

function main() {
  console.log(
    '\n Paste claim data or type "exit" to exit the application \n\n'
  );
  console.log(
    ' Example: {"ssn_suffix":"0121","last_name":"Klaus","first_name":"Cindy","date_of_birth":"1988-02-28T00:00:00.000Z","claim_date":"2021-12-26T00:00:00.000Z","claim_amount":100.01} \n'
  );

  process.stdin.on("data", (data) => {
    const input = data.toString();

    if (input === "exit") {
      console.log("Exiting...");
      process.exit();
    }

    const parsedInput = JSON.parse(input);

    parsedInput.date_of_birth = new Date(parsedInput.date_of_birth);
    parsedInput.claim_date = new Date(parsedInput.claim_date);

    processClaim(db, parsedInput)
      .then((res) => {
        console.log("\n Successfully inserted claim into database \n");
      })
      .catch((err) => {
        console.log("\n !!! Error inserting claim into database !!! \n");
        console.log(err + "\n");
      });
  });
}

main();
