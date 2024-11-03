// src/hello-nuguna/dataSources/bigQueryMock.ts
import sqlite3 from 'sqlite3';

export const executeMockedBigQuery = async (sqlQuery: string) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('test.db');
    db.all(sqlQuery, [], (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
};
