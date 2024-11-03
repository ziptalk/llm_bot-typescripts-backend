"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/data/initTestDb.ts
const sqlite3_1 = __importDefault(require("sqlite3"));
// sqlite3 데이터베이스 파일 설정
const db = new sqlite3_1.default.Database('./testData.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
});
// 데이터베이스 초기화 함수
const initializeTestDb = () => {
    db.serialize(() => {
        // 기존 테이블 삭제 (필요 시)
        db.run(`DROP TABLE IF EXISTS source_report`, (err) => {
            if (err) {
                console.error('Error dropping table:', err.message);
                return;
            }
            console.log('Existing table dropped.');
        });
        // source_report 테이블 생성
        db.run(`
      CREATE TABLE source_report (
        source_medium TEXT,
        visitor_count INTEGER,
        user_id TEXT
      )
    `, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
                return;
            }
            console.log('Table "source_report" created.');
        });
        // 샘플 데이터 삽입
        const insert = db.prepare(`
      INSERT INTO source_report (source_medium, visitor_count, user_id)
      VALUES (?, ?, ?)
    `);
        insert.run('Google', 1200, 'user1');
        insert.run('Facebook', 900, 'user2');
        insert.run('Email', 750, 'user3');
        insert.finalize((err) => {
            if (err) {
                console.error('Error inserting data:', err.message);
                return;
            }
            console.log('Sample data inserted into "source_report" table.');
        });
    });
    // 데이터베이스 연결 종료
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
            return;
        }
        console.log('Closed the database connection.');
    });
};
// 데이터베이스 초기화 실행
initializeTestDb();
// // src/data/initTestDb.ts
// import sqlite3 from 'sqlite3';
// // sqlite3 데이터베이스 파일 설정
// const db = new sqlite3.Database('./testData.db', (err) => {
//   if (err) {
//     return console.error('Error opening database:', err.message);
//   }
//   console.log('Connected to the SQLite database.');
// });
// // 데이터베이스 초기화 함수
// const initializeTestDb = () => {
//   db.serialize(() => {
//     // 기존 테이블 삭제 (필요 시)
//     db.run(`DROP TABLE IF EXISTS source_report`, (err) => {
//       if (err) {
//         return console.error('Error dropping table:', err.message);
//       }
//       console.log('Existing table dropped.');
//     });
//     // source_report 테이블 생성
//     db.run(
//       `
//       CREATE TABLE source_report (
//         source_medium TEXT,
//         visitor_count INTEGER,
//         user_id TEXT
//       )
//     `,
//       (err) => {
//         if (err) {
//           return console.error('Error creating table:', err.message);
//         }
//         console.log('Table "source_report" created.');
//       }
//     );
//     // 샘플 데이터 삽입
//     const insert = db.prepare(`
//       INSERT INTO source_report (source_medium, visitor_count, user_id)
//       VALUES (?, ?, ?)
//     `);
//     insert.run('Google', 1200, 'user1');
//     insert.run('Facebook', 900, 'user2');
//     insert.run('Email', 750, 'user3');
//     insert.finalize((err) => {
//       if (err) {
//         return console.error('Error inserting data:', err.message);
//       }
//       console.log('Sample data inserted into "source_report" table.');
//     });
//   });
//   // 데이터베이스 연결 종료
//   db.close((err) => {
//     if (err) {
//       return console.error('Error closing database:', err.message);
//     }
//     console.log('Closed the database connection.');
//   });
// };
// // 데이터베이스 초기화 실행
// initializeTestDb();
// // // src/data/initTestDb.ts
// // import sqlite3 from 'sqlite3';
// // const db = new sqlite3.Database('test.db');
// // db.serialize(() => {
// //   // 기존 테이블 삭제 (필요 시)
// //   db.run(`DROP TABLE IF EXISTS source_report`);
// //   // source_report 테이블 생성 (user_id 컬럼 포함)
// //   db.run(`
// //     CREATE TABLE source_report (
// //       source_medium TEXT,
// //       visitor_count INTEGER,
// //       user_id TEXT
// //     )
// //   `);
// //   // 샘플 데이터 삽입
// //   db.run(`
// //     INSERT INTO source_report (source_medium, visitor_count, user_id)
// //     VALUES 
// //       ('Google', 1200, 'user1'), 
// //       ('Facebook', 900, 'user2'), 
// //       ('Email', 750, 'user3')
// //   `);
// //   console.log('Test database initialized with sample data including user_id.');
// // });
// // db.close();
