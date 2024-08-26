# Software Development Engineer -- Technical Coding Problem

The goal of this coding exercise is to give us insight into your
ability to write code that solves a problem for a company. Besides
giving us insight into your coding ability, it will help us evaluate
your ability to assess requirements and produce a design that reacts
to those requirements.

## Problem Statement

The Glorious Gumball Co. has asked for help with managing their
medical claim data for their employees. Every month, their list of
employees, dependents, and retirees that are eligible for healthcare
insurance is updated in their database, and that data loading is taken
care of by a separate team. However, their claim data comes in via a
stream at a much higher cadence ("real-time") from the healthcare
providers, which you will have to process and load. Presumably
because gumballs are a dangerous business.

### Database Schema

To answer the questions that management needs to know, refer to the
schema in the `schema/` subdirectory:

- `schema/tables.sql` This is the definition of the tables in the
  database (assume MySQL if you have to)
- `schema/dictionary.md` This is a data dictionary for the terms used
  in the tables.sql file
- `schema/erd.jpg` This is a diagram of the relationships between
  the tables in the database

### Employee Eligibility Report

The management wants to know a few things from the existing data:

1.  How many active employees are currently employed by Glorious Gumball?

2.  What are the email addresses of all active employees?

3.  How many retirees, who used to be covered by Glorious Gumball, are no longer covered?

4.  How many employees have become retirees, versus how many have just dropped out of the Glorious Gumball system?
5.  What is the average number of dependents per employee?

6.  How many employees have no dependents?

7.  How many claims exist with each claimant type?

8.  Generate a list of dependents and the number of claims each dependent has, for dependents with at least 10 claims in the past year

9.  Retrieve a list of all claims for the retiree with employee_id=100 (for that person only, no dependents)

10. What is the total claim amounts per "family" (i.e. an employee/retiree and their dependents)? For this report, we only want one row per family, with: the employee_id as the family identifier, the employee's first and last name for reference, and the summed claim amounts

11. What is the total claim amount for all dependents, and what percentage is this amount out of all (summed) claims amounts?

12. Who is the person (employee, retiree, or dependent) with the highest number of claims, and how many claims do they have?

13. Who is the person (employee, retiree, or dependent) with the highest claim_amount in their claims, and what is that total claim_amount?

Answer the above questions using standard SQL, and provide an explanation for each of your queries.

### Claims Processing

Next, the management needs code written to process and store the data
coming in via the stream. The data will be stored in the `claims`
table (see `schema/tables.sql` for the layout of that table).

To simplify matters, assume that the stream is coming in on STDIN.
The data format of the stream is JSON Lines format, which means each
line is a valid JSON document, each line describing a claim.

The keys of the JSON document (for each claim) are:

- _ssn_suffix_ 4-character string of last-4 digits of SSN
- _last_name_ last-name of claimant
- _first_name_ first-name of claimant
- _date_of_birth_ birthdate of claimant (YYYY-MM-DD)
- _claim_date_ date of the claim (YYYY-MM-DD)
- _claim_amount_ decimal amount of the medical claim (in USD)

Write a function called `process_claim` that takes a single claim
entry and writes to the `claims` table in the database. Note that you
will have to find the right employee_id or dependent_id to store
that claim with. You can choose to write this either in Python or in
Javascript/Node.

There is a unit-test in `tests/` for process_claim that will test the
functionality of claim processing, so this step should implement the
functionality expected in that test (there is both a test in
javascript and a test in python).

Next, write code to call `process_claim` for each line that is
received via STDIN. The file for this call should be in
bin/load_claims.js or bin/load_claims.py (depending on the language
you choose).

### Scaling

Describe how you would help scale this process to write 100,000 claims
per second. Diagram any new components you would add to the system
(feel free to draw on paper and take a picture of your diagram).

## Running the Tests and Script

## Start and Connect to the Database

You can start the database container by running:

```bash
docker-compose pull db
docker-compose up -d db
```

And then you can connect to it like:

```bash
mysql --protocol=tcp -u root -ptamagotchi -h localhost -P 13306 claims
```

If you want to load the schema and some test data into it, you can
run:

```
mysql --protocol=tcp -u root -ptamagotchi -h localhost -P 13306 claims < schema/tables.sql
mysql --protocol=tcp -u root -ptamagotchi -h localhost -P 13306 claims < schema/data.sql
```

Note that if you want to do the above within one of the docker
containers (which comes with a mysql client), you'll have to use host
'db' and port '3306' instead of 'localhost and '13306'.

## Python

To run this (in a docker container) with python, you will need to run
the following:

```bash
docker-compose pull
docker-compose build
docker-compose up -d db
docker-compose run --rm python-shell
```

Once in the docker shell, you should be able to run tests:

```bash
mamba test
```

Or you can run your script:

```bash
./bin/load_claims.py < test/data/01.jsonl
```

Note that because we're bind-mounting the current directory into the
docker image, you can use your editor outside of the container, and
those changes will be reflect within it.

## Javascript

To run this (in a docker container) with javascript, you will need to
run the following:

```bash
docker-compose pull
docker-compose build
docker-compose up -d db
docker-compose run --rm javascript-shell
```

Once in the docker shell, you should be able to run tests:

```bash
npm run test
```

Or you can run the script:

```bash
./bin/load_claims.js < test/data/01.jsonl
```
