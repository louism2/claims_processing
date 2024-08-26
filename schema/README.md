# Glorious Gumball Co. Coverage Schema


## Schema files

* `erd.jpg` Diagram representing the entity relationships of this
  schema

* `tables.sql` This file includes all the SQL for creating the tables
  in the database

* `data.sql` This file includes all the SQL for prepopulating test
  data for unit tests

* `dictionary.md` This file contains descriptions of the columns of
  each table

* `unload.sql` This file truncates the data from the database tables,
  so that it can be recreated for a clean test run


## Coverage Data

The following is an interpretation of the data in the employees,
retirees, and dependents tables (see `data.sql`):

* Jacob Henry, born 11/28/1942 (80 yrs), has been an employee since
  01/01/2000 (23 ys).

* Mary Henry, born 06/06/1944 (78 yrs), has been an employee since
  01/01/2000 (21 yrs).

* Julie Santa, born 01/13/1990 (33 yrs), has been an employee since
  12/29/2021 (1 yr).

* Cindy Klaus, born 02/28/1988 (35 yrs), has been an employee since
  02/28/2020, and her employment ended on 12/25/2021 (1 yr).  Her
  coverage ended on 12/31/2021.

* Another Mary Henry, born 09/16/1941 (81 yrs), has been an employee
  since 01/01/2000 (23 yrs).

* Adam Adams, born 07/05/1975 (48 yrs), has been an employee since
  01/01/2021, and his employment ended on 12/31/2021 (< 1yr).  His
  coverage ended on the same day.  He went into retirement on the next
  day (01/01/2022), and is currently covered as a retiree.

* Violet Blue, born 09/25/1979 (43 yrs), has been an employee since
  01/01/2020, and her employment ended on 12/31/2020 (< 1yr).  Her
  coverage ended a month later, on 01/31/2021.  She went into
  retirement the next day, on 02/01/2021, and her retirement coverage
  ended on 12/31/2021.

* Cindy Klaus, Jr, born 02/28/2020, has been a dependent of Cindy
  Klaus since 02/28/2020.  Her coverage ended at the same time as her
  mom's, on 12/31/2021.
