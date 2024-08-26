-- Employees are current and former employees of this company.  Former
-- employees have a non-NULL term_date.
CREATE TABLE IF NOT EXISTS employees (
  employee_id   char(36) NOT NULL,
  ssn_suffix    char(4)  NOT NULL,
  last_name     varchar(80)  NOT NULL,
  first_name    varchar(80)  NOT NULL,
  date_of_birth DATE     NOT NULL,
  email         varchar(80)  NOT NULL,
  emp_end_date  DATE     NULL,
  start_date    DATE     NOT NULL,
  term_date     DATE     NULL,
  PRIMARY KEY (employee_id),
  CONSTRAINT UNIQUE KEY (ssn_suffix, last_name, date_of_birth)
)   ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;


-- Dependents are dependents of the employee of this company.
CREATE TABLE IF NOT EXISTS dependents (
  dependent_id  char(36) NOT NULL,
  employee_id   char(36) NOT NULL,
  ssn_suffix    char(4)  NOT NULL,
  last_name     varchar(80)  NOT NULL,
  first_name    varchar(80)  NOT NULL,
  date_of_birth DATE     NOT NULL,
  start_date    DATE     NOT NULL,
  term_date     DATE     NULL,
  PRIMARY KEY (dependent_id),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
  CONSTRAINT UNIQUE KEY (ssn_suffix, last_name, date_of_birth)
)   ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;


-- Retirees are former employees of this company who are still covered
-- by this company's insurance plan.
CREATE TABLE IF NOT EXISTS retirees (
  employee_id   char(36) NOT NULL,
  start_date    DATE     NOT NULL,
  term_date     DATE     NULL,
  PRIMARY KEY (employee_id),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
)   ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;


-- Claims are healthcare claims against the insurance plan for each
-- employee or dependent or retiree.
CREATE TABLE IF NOT EXISTS claims (
  claim_id      char(36) NOT NULL,
  claimant_id   char(36) NOT NULL,
  claimant_type enum('employee', 'dependent', 'retiree') NOT NULL,
  claim_date    DATE     NOT NULL,
  claim_amount  DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (claim_id),
  CONSTRAINT UNIQUE KEY (claimant_type, claimant_id, claim_date)
)   ENGINE=InnoDB CHARACTER SET utf8 COLLATE utf8_unicode_ci;
