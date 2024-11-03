"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQuestion = void 0;
// src/hello-nuguna/services/nugunaService.ts
const sqlGenerator_1 = require("../utils/sqlGenerator");
const queryExecutor_1 = require("../dataSources/queryExecutor");
const responseFormatter_1 = require("../utils/responseFormatter");
const logger_1 = require("../utils/logger");
/**
 * 사용자의 질문을 처리하여 SQL 쿼리 생성 및 결과 반환
 * @param question 사용자의 자연어 질문
 * @returns 자연어로 변환된 쿼리 결과
 */
const processQuestion = async (question) => {
    try {
        logger_1.logger.info(`Received question: ${question}`);
        // 질문을 SQL 쿼리로 변환 (Hugging Face API 호출)
        const sqlQuery = await (0, sqlGenerator_1.generateSQLQuery)(question);
        logger_1.logger.info(`Generated SQL Query: ${sqlQuery}`);
        // SQL 쿼리 실행
        const data = await (0, queryExecutor_1.executeQuery)(sqlQuery);
        logger_1.logger.info(`Query executed successfully with ${data.length} results`);
        // 결과 포맷팅
        const response = (0, responseFormatter_1.formatResponse)(data);
        logger_1.logger.info(`Formatted response: ${response}`);
        return response;
    }
    catch (error) {
        logger_1.logger.error('Error processing question:', error instanceof Error ? error.stack : error);
        return '죄송합니다. 질문을 처리하는 중 오류가 발생했습니다.';
    }
};
exports.processQuestion = processQuestion;
// // src/hello-nuguna/services/nugunaService.ts
// import { generateSQLQuery } from '../utils/sqlGenerator';
// import { executeQuery } from '../dataSources/queryExecutor';
// import { formatResponse } from '../utils/responseFormatter';
// import { logger } from '../utils/logger';
// /**
//  * 사용자의 질문을 처리하여 SQL 쿼리 생성 및 결과 반환
//  * @param question 사용자의 자연어 질문
//  * @returns 자연어로 변환된 쿼리 결과
//  */
// export const processQuestion = async (question: string): Promise<string> => {
//   try {
//     // 입력된 질문 로깅
//     logger.info(`Received question: ${question}`);
//     // 질문을 SQL 쿼리로 변환
//     const sqlQuery = await generateSQLQuery(question);
//     logger.info(`Generated SQL Query: ${sqlQuery}`);
//     // SQL 쿼리 실행
//     const data = await executeQuery(sqlQuery);
//     logger.info(`Query executed successfully with ${data.length} results`);
//     // 결과 포맷팅
//     const response = formatResponse(data);
//     logger.info(`Formatted response: ${response}`);
//     return response;
//   } catch (error) {
//     // 오류 로깅 (스택 포함)
//     logger.error('Error processing question:', error instanceof Error ? error.stack : error);
//     // 오류 발생 시 사용자에게 표시할 메시지
//     return '죄송합니다. 질문을 처리하는 중 오류가 발생했습니다.';
//   }
// };
// // src/hello-nuguna/services/nugunaService.ts
// import { generateSQLQuery } from '../utils/sqlGenerator';
// import { executeQuery } from '../dataSources/queryExecutor';
// import { formatResponse } from '../utils/responseFormatter';
// import { logger } from '../utils/logger';
// /**
//  * 사용자의 질문을 처리하여 SQL 쿼리 생성 및 결과 반환
//  * @param question 사용자의 자연어 질문
//  * @returns 자연어로 변환된 쿼리 결과
//  */
// export const processQuestion = async (question: string): Promise<string> => {
//   try {
//     logger.info(`Received question: ${question}`);
//     // 질문을 SQL 쿼리로 변환
//     const sqlQuery = generateSQLQuery(question);
//     logger.info(`Generated SQL Query: ${sqlQuery}`);
//     // SQL 쿼리 실행
//     const data = await executeQuery(sqlQuery);
//     // 쿼리 결과를 자연어 답변으로 포맷팅
//     const response = formatResponse(data);
//     return response;
//   } catch (error) {
//     logger.error('Error processing question:', error);
//     return '죄송합니다. 질문을 처리하는 중 오류가 발생했습니다.';
//   }
// };
// // // src/hello-nuguna/services/nugunaService.ts
// // import { generateSQLQuery } from '../utils/sqlGenerator';
// // import { executeQuery } from '../dataSources/queryExecutor';
// // import { formatResponse } from '../utils/responseFormatter';
// // import { logger } from '../utils/logger';
// // export const getReportData = async (queryText: string) => {
// //   try {
// //     logger.info(`Generating SQL query for text: ${queryText}`);
// //     const sqlQuery = generateSQLQuery(queryText);
// //     const rawData = await executeQuery(sqlQuery);
// //     return formatResponse(rawData);
// //   } catch (error) {
// //     logger.error('Error in getReportData service:', error);
// //     throw new Error('Failed to retrieve report data');
// //   }
// // };
