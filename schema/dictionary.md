# Data Dictionary

## Table: employees

| column name   | type        | notes                                        |
| ------------- | ----------- | -------------------------------------------- |
| employee_id   | char(36)    | UUID string: unique ID of employee           |
| ssn_suffix    | char(4)     | last 4 digits of employee's SSN              |
| last_name     | varchar(80) | employee's last name                         |
| first_name    | varchar(80) | employee's first name                        |
| date_of_birth | date        | employee's date of birth                     |
| emp_end_date  | date        | end of employee's employment                 |
| start_date    | date        | start of insurance coverage                  |
| term_date     | date        | end of insurance coverage, NULL if not ended |

- Employees past and present exist in the `employees` table
- Employees that are currently active have a NULL `emp_end_date`; employees that have terminated (quit, retired, or let go) will have a non-NULL `emp_end_date`

- Employees may have an `emp_end_date` and/or `term_date` in the future, if they've put in their notice in the future
- Employees that elect to maintain their benefits past their `emp_end_date` (via COBRA) have a different `term_date`

## Table: dependents

| column name   | type        | notes                                                |
| ------------- | ----------- | ---------------------------------------------------- |
| dependent_id  | char(36)    | UUID string: unique ID of dependent                  |
| employee_id   | char(36)    | UUID string: refers to employee from employees table |
| ssn_suffix    | char(4)     | last 4 digits of dependent's SSN                     |
| last_name     | varchar(80) | dependent's last name                                |
| first_name    | varchar(80) | dependent's first name                               |
| date_of_birth | date        | dependent's date of birth                            |
| start_date    | date        | start of insurance coverage                          |
| term_date     | date        | end of insurance coverage, NULL if not ended         |

- Dependents of employees that have been terminated will have a non-NULL `term_date` that matches the `term_date` of the employee's coverage (including COBRA if applicable)
- Dependents of employees that have been terminated, but do not elect to be on the employee's COBRA coverage will have a `term_date` matching the employee's `emp_end_date`

## Table: retirees

| column name | type     | notes                                                  |
| ----------- | -------- | ------------------------------------------------------ |
| employee_id | char(36) | UUID string: original employee_id from employees table |
| start_date  | date     | start of insurance coverage                            |
| term_date   | date     | end of insurance coverage, NULL if not ended           |

- Retirees will have a `start_date` matching their employee record's `emp_end_date`, if they elect to be covered under the company's retirement plan
- Retirees that do not elect to be covered under the company's retirement plan will have no record in the `retirees` table
- Retirees that have a NULL `term_date` are actively covered under the plan
- Retirees that elect to discontinue their coverage under the company's plan will have a non-NULL `term_date`
- The retirees' `term_date` is not the same as the employees' `term_date`

## Table: claims

| column name   | type                                     | notes                                              |
| ------------- | ---------------------------------------- | -------------------------------------------------- |
| claim_id      | char(36)                                 | UUID string: unique ID of claim                    |
| claimant_id   | char(36)                                 | UUID string: employee_id or dependent_id of person |
| claimant_type | enum('employee', 'dependent', 'retiree') | type of person for this claim                      |
| claim_date    | date                                     | when the claim was submitted                       |
| claim_amount  | decimal(10,2)                            | dollar amount being claimed                        |

- Each claim has a unique `claim_id`
- If a claim is for an employee, the `claimant_type` will be "employee" and the `claimant_id` will be the employee's `employee_id`
- If a claim is for an dependent, the `claimant_type` will be "dependent" and the `claimant_id` will be the dependent's `dependent_id`
- If a claim is for an retiree, the `claimant_type` will be "retiree" and the `claimant_id` will be the retiree's `employee_id`
