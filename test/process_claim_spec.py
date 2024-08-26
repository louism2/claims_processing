from datetime import date
from expects import expect, equal, raise_error
from mamba import description, context, it, before
import mysql.connector
import os.path

from lib.process_claim import InvalidClaimantError, process_claim

db_connection = None
schema_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                          "schema")


# Utility functions for tests to be able to access db rows

def get_employee(cursor, ssn_suffix):
    '''
    Gets an employee from the employees table using their ssn_suffix.

    :param mysql.connector.MySQLCursor cursor: db cursor for fetching employee with
    :param str ssn_suffix: 4-digit ssn suffix
    :returns: employee (dict) or None if not found
    '''
    cursor.execute("""
      SELECT * FROM employees
      WHERE ssn_suffix = %s
    """, [ssn_suffix])
    employees = cursor.fetchall()
    expect(len(employees)).to(equal(1))
    if len(employees) == 0:
        return None
    else:
        return employees[0]


def find_claims_for_claimant(cursor, claimant_type, claimant_id):
    '''
    Gets a list of claims based on the claimant_type and claimant_id.
    :param mysql.connector.MySQLCursor cursor: db cursor for fetching claims with
    :param str claimant_type: 'employee', 'dependent' or 'retiree'
    :param str claimant_id: UUID of employee/dependent/retiree
    :returns: list of claims (dict)
    '''
    cursor.execute("""
      SELECT * FROM claims
      WHERE claimant_type = %s AND claimant_id = %s
    """, [claimant_type, claimant_id])

    results = cursor.fetchall()
    return results


with description('lib/process_claim') as self:
    with before.all:
        global db_connection

        db_connection = None
        try:
            db_connection = mysql.connector.connect(
                host='db',
                user='root',
                password='tamagotchi',
                port=3306,
                database='claims'
            )
        except Exception as e:
            print("Unable to open connection: {0}".format(e))

        # Load schema, if not already there.
        sql = None
        with open(os.path.join(schema_dir, "tables.sql")) as f:
            sql = f.read()
        cursor = db_connection.cursor()
        for result in cursor.execute(sql, multi=True):
            result.rowcount
        cursor.close()

    with before.each:
        cursor = db_connection.cursor()
        sql = None

        # Use the unload.sql file to unload all the data
        with open(os.path.join(schema_dir, "unload.sql")) as f:
            sql = f.read()
        try:
            for _ in cursor.execute(sql, multi=True):
                pass
        except mysql.connector.Error as e:
            raise RuntimeError("db error: {0}".format(e))

        # Use the data.sql file to load all prerequisite data
        with open(os.path.join(schema_dir, "data.sql")) as f:
            sql = f.read()
        try:
            for _ in cursor.execute(sql, multi=True):
                pass
        except mysql.connector.Error as e:
            raise RuntimeError("db error: {0}".format(e))

        try:
            db_connection.commit()
        except mysql.connector.Error as e:
            raise RuntimeError("  db error: {0}".format(e))
        cursor.close()

    with after.all:
        global db_connection
        db_connection.close()
        db_connection = None

    with context('process_claim'):
        with it('should add employee claim to db'):
            cursor = db_connection.cursor(dictionary=True)
            claim_data = {
                'ssn_suffix': '0121',
                'last_name': 'Klaus',
                'first_name': 'Cindy',
                'date_of_birth': date(1988, 2, 28),
                'claim_date': date(2021, 12, 26),
                'claim_amount': 100.01
            }

            process_claim(db_connection, claim_data)

            # First, we find this employee.
            employee = get_employee(cursor, '0121')

            # Then, we find the claim
            claims = find_claims_for_claimant(cursor, 'employee', employee['employee_id'])

            expect(len(claims)).to(equal(1))
            expect(float(claims[0]['claim_amount'])).to(equal(100.01))
            expect(claims[0]['claim_date']).to(equal(date(2021, 12, 26)))

            cursor.close()

        with it('should not add terminated claim to db'):
            cursor = db_connection.cursor(dictionary=True)
            claim_data = {
                'ssn_suffix': '0121',
                'last_name': 'Klaus',
                'first_name': 'Cindy',
                'date_of_birth': date(1988, 2, 28),
                'claim_date': date(2022, 1, 6),
                'claim_amount': 24.01
            }

            def should_fail():
                process_claim(db_connection, claim_data)

            expect(should_fail).to(raise_error(InvalidClaimantError))
            cursor.close()

        with it('should not add old claim to db'):
            cursor = db_connection.cursor(dictionary=True)

            claim_data = {
                'ssn_suffix': '0121',
                'last_name': 'Klaus',
                'first_name': 'Cindy',
                'date_of_birth': date(1988, 2, 28),
                'claim_date': date(1990, 1, 6),
                'claim_amount': 64.01
            }

            def should_fail():
                process_claim(db_connection, claim_data)

            expect(should_fail).to(raise_error(InvalidClaimantError))
            cursor.close()

        with it('should add retiree claim to db'):
            cursor = db_connection.cursor(dictionary=True)

            claim_data = {
                'ssn_suffix': '1622',
                'last_name': 'Adams',
                'first_name': 'Adam',
                'date_of_birth': date(1975, 7, 5),
                'claim_date': date(2022, 11, 30),
                'claim_amount': 620.21
            }
            process_claim(db_connection, claim_data)

            # First, we find this employee.
            employee = get_employee(cursor, '1622')

            # Then, we find the claim
            claims = find_claims_for_claimant(cursor, 'retiree', employee['employee_id'])

            expect(len(claims)).to(equal(1))
            expect(float(claims[0]['claim_amount'])).to(equal(620.21))
            expect(claims[0]['claim_date']).to(equal(date(2022, 11, 30)))

            cursor.close()
