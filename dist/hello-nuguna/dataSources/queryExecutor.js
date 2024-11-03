"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQuery = void 0;
// src/hello-nuguna/dataSources/queryExecutor.ts
const sqlite3_1 = __importDefault(require("sqlite3"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const bigQueryClient_1 = require("./bigQueryClient");
const isLocal = process.env.NODE_ENV === 'local';
const testDbPath = 'test.db';
const testDataPath = path.join(__dirname, '../../data/testData.json');
/**
 * 로컬 환경에서 JSON 파일에서 데이터를 로드
 */
const loadJsonTestData = () => {
    if (fs.existsSync(testDataPath)) {
        const data = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
        console.log('Loaded test data from JSON file.');
        return data;
    }
    throw new Error(`Test data file not found at path: ${testDataPath}`);
};
/**
 * 로컬 환경에서 SQLite 데이터베이스에서 쿼리를 실행
 * @param sqlQuery 실행할 SQL 쿼리 문자열
 */
const executeSQLiteQuery = (sqlQuery) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3_1.default.Database(testDbPath, (err) => {
            if (err) {
                return reject(new Error(`SQLite database connection error: ${err.message}`));
            }
        });
        db.all(sqlQuery, [], (err, rows) => {
            db.close();
            if (err) {
                return reject(new Error(`SQLite query execution error: ${err.message}`));
            }
            resolve(rows);
        });
    });
};
/**
 * BigQuery에서 SQL 쿼리를 실행
 * @param sqlQuery 실행할 SQL 쿼리 문자열
 */
const executeBigQuery = async (sqlQuery) => {
    try {
        const [rows] = await bigQueryClient_1.bigQueryClient.query(sqlQuery);
        console.log('Executed query on BigQuery.');
        return rows;
    }
    catch (error) {
        throw new Error(`BigQuery execution error: ${error instanceof Error ? error.message : String(error)}`);
    }
};
/**
 * SQL 쿼리를 실행하여 결과 반환
 * @param sqlQuery 실행할 SQL 쿼리 문자열 또는 함수
 */
const executeQuery = async (sqlQuery) => {
    // sqlQuery가 함수일 경우 즉시 실행하여 SQL 쿼리 문자열로 변환
    let resolvedQuery = typeof sqlQuery === 'function' ? sqlQuery() : sqlQuery;
    // 로컬 환경에서 function 반환 시 기본 쿼리 생성
    if (isLocal && resolvedQuery === 'function') {
        console.warn(`"function" detected in local environment. Replacing with default SQL query.`);
        resolvedQuery = 'SELECT * FROM source_report LIMIT 10';
    }
    if (isLocal) {
        console.log('Local environment detected, executing query with test data.');
        try {
            // JSON 파일에서 데이터를 로드
            return loadJsonTestData();
        }
        catch (jsonError) {
            console.warn('Failed to load JSON test data. Attempting SQLite query:', jsonError instanceof Error ? jsonError.message : String(jsonError));
            // JSON 파일이 없으면 SQLite에서 쿼리 실행
            try {
                return await executeSQLiteQuery(resolvedQuery);
            }
            catch (sqliteError) {
                throw new Error(`SQLite query execution error: ${sqliteError instanceof Error ? sqliteError.message : sqliteError}`);
            }
        }
    }
    else {
        // BigQuery를 사용하여 SQL 쿼리 실행
        try {
            return await executeBigQuery(resolvedQuery);
        }
        catch (bigQueryError) {
            throw new Error(`BigQuery execution error: ${bigQueryError instanceof Error ? bigQueryError.message : bigQueryError}`);
        }
    }
};
exports.executeQuery = executeQuery;
// // src/hello-nuguna/dataSources/queryExecutor.ts
// import sqlite3 from 'sqlite3';
// import * as fs from 'fs';
// import * as path from 'path';
// import { bigQueryClient } from './bigQueryClient';
// const isLocal = process.env.NODE_ENV === 'local';
// const testDbPath = 'test.db';
// const testDataPath = path.join(__dirname, '../../data/testData.json');
// /**
//  * 로컬 환경에서 JSON 파일에서 데이터를 로드
//  */
// const loadJsonTestData = () => {
//   if (fs.existsSync(testDataPath)) {
//     const data = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
//     console.log('Loaded test data from JSON file.');
//     return data;
//   }
//   throw new Error(`Test data file not found at path: ${testDataPath}`);
// };
// /**
//  * 로컬 환경에서 SQLite 데이터베이스에서 쿼리를 실행
//  * @param sqlQuery 실행할 SQL 쿼리 문자열
//  */
// const executeSQLiteQuery = (sqlQuery: string) => {
//   return new Promise((resolve, reject) => {
//     const db = new sqlite3.Database(testDbPath, (err) => {
//       if (err) {
//         return reject(new Error(`SQLite database connection error: ${err.message}`));
//       }
//     });
//     db.all(sqlQuery, [], (err, rows) => {
//       db.close();
//       if (err) {
//         return reject(new Error(`SQLite query execution error: ${err.message}`));
//       }
//       resolve(rows);
//     });
//   });
// };
// /**
//  * BigQuery에서 SQL 쿼리를 실행
//  * @param sqlQuery 실행할 SQL 쿼리 문자열
//  */
// const executeBigQuery = async (sqlQuery: string) => {
//   try {
//     const [rows] = await bigQueryClient.query(sqlQuery);
//     console.log('Executed query on BigQuery.');
//     return rows;
//   } catch (error) {
//     throw new Error(`BigQuery execution error: ${error instanceof Error ? error.message : String(error)}`);
//   }
// };
// /**
//  * SQL 쿼리를 실행하여 결과 반환
//  * @param sqlQuery 실행할 SQL 쿼리 문자열 또는 함수
//  */
// export const executeQuery = async (sqlQuery: string | (() => string)) => {
//   // sqlQuery가 함수라면 실행하여 결과 SQL 쿼리 문자열을 가져옴
//   const resolvedQuery = typeof sqlQuery === 'function' ? sqlQuery() : sqlQuery;
//   if (isLocal) {
//     console.log('Local environment detected, executing query with test data.');
//     // JSON 파일에서 데이터를 로드하거나 SQLite에서 실행
//     try {
//       const jsonData = loadJsonTestData();
//       return jsonData;
//     } catch (jsonError) {
//       const errorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
//       console.warn('Failed to load JSON test data, attempting SQLite query:', errorMessage);
//       const sqliteData = await executeSQLiteQuery(resolvedQuery);
//       return sqliteData;
//     }
//   } else {
//     // BigQuery를 사용하여 SQL 쿼리를 실행
//     const bigQueryData = await executeBigQuery(resolvedQuery);
//     return bigQueryData;
//   }
// };
// // // src/hello-nuguna/dataSources/queryExecutor.ts
// // import sqlite3 from 'sqlite3';
// // import * as fs from 'fs';
// // import * as path from 'path';
// // import { bigQueryClient } from './bigQueryClient';
// // const isLocal = process.env.NODE_ENV === 'local';
// // export const executeQuery = async (sqlQuery: string) => {
// //   if (isLocal) {
// //     console.log('Local environment detected, loading test data');
// //     const dataPath = path.join(__dirname, '../../data/testData.json');
// //     // JSON 파일에서 데이터 로드
// //     if (fs.existsSync(dataPath)) {
// //       const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
// //       return data;
// //     } 
// //     // SQLite에서 데이터 로드
// //     return new Promise((resolve, reject) => {
// //       const db = new sqlite3.Database('test.db');
// //       db.all(sqlQuery, [], (err, rows) => {
// //         db.close();
// //         if (err) {
// //           reject(err);
// //         } else {
// //           resolve(rows);
// //         }
// //       });
// //     });
// // } else {
// //     // BigQuery 클라이언트를 통해 쿼리 실행
// //     const [rows] = await bigQueryClient.query(sqlQuery);
// //     return rows;
// //   }
// // };
// // // // src/hello-nuguna/dataSources/queryExecutor.ts
// // // import { bigQueryClient } from './bigQueryClient';
// // // export const executeQuery = async (sqlQuery: string) => {
// // //   const [rows] = await bigQueryClient.query(sqlQuery);
// // //   return rows;
// // // };
