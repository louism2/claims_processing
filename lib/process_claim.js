const mysql = require("mysql");
const uuid = require("uuid");

class InvalidClaimantError extends Error {}
exports.InvalidClaimantError = InvalidClaimantError;

const EMPLOYEE_DB_RESPONSE = 0;
const DEPENDENT_DB_RESPONSE = 1;

function detectInvalidEmployeeClaimState(employee, claimObj) {
  const claimDateBeforeStartDate = claimObj.claim_date < employee.start_date;

  if (claimDateBeforeStartDate) {
    throw new InvalidClaimantError();
  }
}

function determineClaimantInformation(sourceTable, dbRecord, claimObj) {
  if (sourceTable === "employee") {
    if (dbRecord.term_date !== null) {
      if (claimObj.claim_date < dbRecord.term_date) {
        return {
          claimaintType: "employee",
          claimantId: dbRecord.employee_id,
        };
      } else {
        return {
          claimaintType: "retiree",
          claimantId: dbRecord.employee_id,
        };
      }
    } else {
      return {
        claimaintType: "employee",
        claimantId: dbRecord.employee_id,
      };
    }
  } else {
    return {
      claimaintType: "dependent",
      claimantId: dbRecord.dependent_id,
    };
  }
}

function buildClaimInsertSQL(claimantInfo, claimObj) {
  const sql = mysql.format(`INSERT INTO claims VALUES (?, ?, ?, ?, ?)`, [
    uuid.v4(),
    claimantInfo.claimantId,
    claimantInfo.claimaintType,
    claimObj.claim_date,
    claimObj.claim_amount,
  ]);

  return sql;
}

function buildSelectQuery(claimObj, tableName) {
  return mysql.format(
    `SELECT * FROM ${tableName} WHERE ssn_suffix = ? AND last_name = ? AND first_name = ? AND date_of_birth = ?`,
    [
      claimObj.ssn_suffix,
      claimObj.last_name,
      claimObj.first_name,
      claimObj.date_of_birth.toISOString(),
    ]
  );
}

async function executeQuery(db, query) {
  return new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(results);
    });
  });
}

async function processClaim(db, claimObj) {
  const employeesQuery = buildSelectQuery(claimObj, "employees");
  const dependentsQuery = buildSelectQuery(claimObj, "dependents");

  const res = await Promise.all([
    executeQuery(db, employeesQuery),
    executeQuery(db, dependentsQuery),
  ]);

  if (res[EMPLOYEE_DB_RESPONSE]) {
    const employee = res[EMPLOYEE_DB_RESPONSE][0];

    const claimantInfo = determineClaimantInformation(
      "employee",
      employee,
      claimObj
    );

    if (claimantInfo.claimaintType === "retiree") {
      const retireeSQL = mysql.format(
        `SELECT * FROM retirees WHERE employee_id = ?`,
        [employee.employee_id]
      );

      const retireeRes = await executeQuery(db, retireeSQL);

      if (retireeRes.length === 0) {
        throw new InvalidClaimantError();
      }

      const sql = buildClaimInsertSQL(claimantInfo, claimObj);

      return executeQuery(db, sql);
    } else {
      detectInvalidEmployeeClaimState(employee, claimObj);

      const sql = buildClaimInsertSQL(claimantInfo, claimObj);

      return executeQuery(db, sql);
    }
  } else if (res[DEPENDENT_DB_RESPONSE]) {
    const sql = buildClaimInsertSQL(
      "dependent",
      res[DEPENDENT_DB_RESPONSE_DB_RESPONSE][0],
      claimObj
    );

    return executeQuery(db, sql);
  }
}

exports.processClaim = processClaim;
