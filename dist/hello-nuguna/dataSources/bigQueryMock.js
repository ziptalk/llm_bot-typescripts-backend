"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeMockedBigQuery = void 0;
// src/hello-nuguna/dataSources/bigQueryMock.ts
const sqlite3_1 = __importDefault(require("sqlite3"));
const executeMockedBigQuery = async (sqlQuery) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3_1.default.Database('test.db');
        db.all(sqlQuery, [], (err, rows) => {
            db.close();
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
};
exports.executeMockedBigQuery = executeMockedBigQuery;
