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

function buildClaimInsertSQL(claimantId, claimantType, claimObj) {
  const sql = mysql.format(`INSERT INTO claims VALUES (?, ?, ?, ?, ?)`, [
    uuid.v4(),
    claimantId,
    claimantType,
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

  const employee = res[EMPLOYEE_DB_RESPONSE][0];
  const dependent = res[DEPENDENT_DB_RESPONSE][0];

  if (employee) {
    const isRetireeWorkflow =
      employee.term_date !== null && claimObj.claim_date > employee.term_date;

    if (isRetireeWorkflow) {
      const retireeSQL = mysql.format(
        `SELECT * FROM retirees WHERE employee_id = ?`,
        [employee.employee_id]
      );

      const retireeRes = await executeQuery(db, retireeSQL);

      if (retireeRes.length === 0) {
        throw new InvalidClaimantError();
      }

      const retiree = retireeRes[0];

      const sql = buildClaimInsertSQL(retiree.employee_id, "retiree", claimObj);

      return executeQuery(db, sql);
    } else {
      detectInvalidEmployeeClaimState(employee, claimObj);

      const sql = buildClaimInsertSQL(
        employee.employee_id,
        "employee",
        claimObj
      );

      return executeQuery(db, sql);
    }
  } else if (dependent) {
    const dependent = res[DEPENDENT_DB_RESPONSE][0];

    const sql = buildClaimInsertSQL(
      dependent.dependent_id,
      "dependent",
      claimObj
    );

    return executeQuery(db, sql);
  }
}

exports.processClaim = processClaim;
