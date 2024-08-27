const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const fs = require("fs");
const mysql = require("mysql");
const _ = require("lodash");

const {
  processClaim,
  InvalidClaimantError,
} = require("../lib/process_claim.js");

chai.use(chaiAsPromised);
const { expect } = chai;

var db = null;
const schemaDir = "./schema";

/**
 * Gets an employee from the employees table using their ssn_suffix.
 *
 * @param {mysql.Connection} db - db object for fetching employee with
 * @param {string} ssn_suffix - 4-digit ssn suffix
 *
 * @returns {hash} employee or null if not found
 */
async function get_employee(db, ssn_suffix) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM employees WHERE ssn_suffix = ?",
      [ssn_suffix],
      (err, results) => {
        if (err) {
          reject(err);
        }
        resolve(results);
      }
    );
  }).then((employees) => {
    expect(employees.length).to.equal(1);
    return employees[0];
  });
}

/**
 * Gets a list of claims based on the claimant_type and claimant_id.
 *
 * @param {mysql.Connection} db - db object for fetching claims with
 * @param {string} claimant_type - 'employee', 'dependent' or 'retiree'
 * @param {string} claimant_id - UUID of employee/dependent/retiree
 *
 * @returns {array[hash]} list of claim objects
 */
async function fetch_claims_for_employee(db, claimant_type, claimant_id) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM claims WHERE claimant_type = ? AND claimant_id = ?",
      [claimant_type, claimant_id],
      (err, claims) => {
        if (err) {
          reject(err);
        } else {
          resolve(claims);
        }
      }
    );
  }).then((claims) => {
    return claims;
  });
}

/**
 * Error logging wrapper for logging errors when connecting to the db.
 *
 * @param {string} errorSource - source of error (for log display)
 * @param {function} callback - optional callback to run when error occurs
 *
 * @returns result of callback (if passed) or of db-call
 */
function logAnyErrors(errorSource, callback) {
  return function (error, results, fields) {
    if (error) {
      console.log(`* Error from ${errorSource}: ${error}`);
      throw error;
    }

    if (callback) {
      return callback(results);
    } else {
      return results;
    }
  };
}

describe("lib/process_claim", function () {
  before(async function () {
    db = mysql.createConnection({
      host: "db",
      port: 3306,
      user: "root",
      password: "tamagotchi",
      database: "claims",
      multipleStatements: true,
    });
    await db.connect(logAnyErrors("connect"));
    const sql = fs.readFileSync(`${schemaDir}/tables.sql`, "utf8");
    await db.query(sql);
  });

  beforeEach(async function () {
    let sql = fs.readFileSync(`${schemaDir}/unload.sql`, "utf8");
    await db.query(sql);
    sql = fs.readFileSync(`${schemaDir}/data.sql`, "utf8");
    await db.query(sql);
  });

  after(async function () {
    await db.end();
  });

  describe("processClaim", function () {
    it("should add employee claim to db", async function () {
      const claimData = {
        ssn_suffix: "0121",
        last_name: "Klaus",
        first_name: "Cindy",
        date_of_birth: new Date("1988-02-28"),
        claim_date: new Date("2021-12-26"),
        claim_amount: 100.01,
      };
      await processClaim(db, claimData);
      const employee = await get_employee(db, "0121");
      const claims = await fetch_claims_for_employee(
        db,
        "employee",
        employee.employee_id
      );
      expect(claims.length).to.equal(1);
      expect(claims[0]["claim_amount"]).to.equal(100.01);
      expect(claims[0]["claim_date"]).to.deep.equal(new Date("2021-12-26"));
    });
    it("should not add terminated claim to db", async function () {
      const claimData = {
        ssn_suffix: "0121",
        last_name: "Klaus",
        first_name: "Cindy",
        date_of_birth: new Date("1988-02-28"),
        claim_date: new Date("2022-01-06"),
        claim_amount: 24.01,
      };

      expect(processClaim(db, claimData)).to.be.rejectedWith(
        InvalidClaimantError
      );
    });
    it("should not add old claim to db", async function () {
      const claimData = {
        ssn_suffix: "0121",
        last_name: "Klaus",
        first_name: "Cindy",
        date_of_birth: new Date("1988-02-28"),
        claim_date: new Date("1990-01-06"),
        claim_amount: 64.01,
      };
      expect(processClaim(db, claimData)).to.be.rejectedWith(
        InvalidClaimantError
      );
    });
    it("should process retiree claim into db", async function () {
      const claimData = {
        ssn_suffix: "1622",
        last_name: "Adams",
        first_name: "Adam",
        date_of_birth: new Date("1975-07-05"),
        claim_date: new Date("2022-11-30"),
        claim_amount: 620.21,
      };
      await processClaim(db, claimData);
      const employee = await get_employee(db, "1622");
      const claims = await fetch_claims_for_employee(
        db,
        "retiree",
        employee.employee_id
      );
      expect(claims.length).to.equal(1);
      expect(claims[0]["claim_amount"]).to.equal(620.21);
    });
  });
});
