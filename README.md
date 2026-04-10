## VIN Course Data

This api imports course progress data from a provided MongoDB dump and writes it into a SQL Server table.

## Run

To import data into SQL server:

```bash
npm main
```

To run:

```bash
npm start
```

## Tech Stack

- Node.js
- MongoDB
- SQL Server Express
- mssql library

## Design Decisions

- Used SQL Server MERGE for idempotent upserts
- Implemented batching to reduce load
- Stored all timestamps in UTC
- Added data normalization layer to handle inconsistent Mongo data

## Future Improvements

- Table-Valued Function for further improvements in performance
- More test coverage (automated integration tests)
- Add api layer for querying data
