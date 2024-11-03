"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
// src/hello-nuguna/app.ts
require("dotenv/config"); // 환경 변수 로드
const nugunaService_1 = require("./services/nugunaService");
const logger_1 = require("./utils/logger");
// Lambda 핸들러 함수
const handler = async (event) => {
    try {
        // 쿼리 파라미터에서 질문을 가져옴
        const question = event.queryStringParameters?.text;
        if (!question) {
            logger_1.logger.warn('Question parameter is missing'); // 경고 로그 추가
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Question text is required' }),
            };
        }
        logger_1.logger.info(`Received question: ${question}`);
        // 질문을 처리하여 응답 생성
        const response = await (0, nugunaService_1.processQuestion)(question);
        return {
            statusCode: 200,
            body: JSON.stringify({ answer: response }),
        };
    }
    catch (error) {
        // 오류 로깅에 스택 추적 포함
        logger_1.logger.error('Error processing request:', error instanceof Error ? error.stack : error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
exports.handler = handler;
// 로컬 테스트용 코드
if (require.main === module) {
    (async () => {
        const testEvent = require('../../event.json'); // 로컬 테스트를 위한 이벤트 데이터
        // 환경 변수 설정 확인
        if (!process.env.HUGGING_FACE_API_KEY) {
            console.error('HUGGING_FACE_API_KEY environment variable is missing');
            process.exit(1);
        }
        try {
            const response = await (0, exports.handler)(testEvent, {}, () => { });
            console.log('Local Test Response:', response);
        }
        catch (error) {
            console.error('Error during local test execution:', error instanceof Error ? error.stack : error);
        }
    })();
}
// // src/hello-nuguna/app.ts
// import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
// import { processQuestion } from './services/nugunaService';
// import { logger } from './utils/logger';
// // Lambda 핸들러 함수
// export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
//   try {
//     // 쿼리 파라미터에서 질문을 가져옴
//     const question = event.queryStringParameters?.text;
//     if (!question) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({ message: 'Question text is required' }),
//       };
//     }
//     logger.info(`Received question: ${question}`);
//     // 질문을 처리하여 응답 생성
//     const response = await processQuestion(question);
//     return {
//       statusCode: 200,
//       body: JSON.stringify({ answer: response }),
//     };
//   } catch (error) {
//     // 오류 로깅에 스택 추적 포함
//     logger.error('Error processing request:', error instanceof Error ? error.stack : error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ message: 'Internal Server Error' }),
//     };
//   }
// };
// // 로컬 테스트용 코드
// if (require.main === module) {
//   (async () => {
//     const testEvent = require('../../event.json'); // 로컬 테스트를 위한 이벤트 데이터
//     try {
//       const response = await handler(testEvent as any, {} as any, () => {}) as APIGatewayProxyResult;
//       console.log('Local Test Response:', response);
//     } catch (error) {
//       console.error('Error during local test execution:', error instanceof Error ? error.stack : error);
//     }
//   })();
// }
// // src/hello-nuguna/app.ts
// import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
// import { processQuestion } from './services/nugunaService';
// import { logger } from './utils/logger';
// // Lambda 핸들러 함수
// export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
//   try {
//     // 테스트 시 event.queryStringParameters에서 질문을 받음
//     const question = event.queryStringParameters?.text;
//     if (!question) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({ message: 'Question text is required' }),
//       };
//     }
//     logger.info(`Received question: ${question}`);
//     // 질문을 처리하여 응답 생성
//     const response = await processQuestion(question);
//     return {
//       statusCode: 200,
//       body: JSON.stringify(response),
//     };
//   } catch (error) {
//     logger.error('Error processing request', error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ message: 'Internal Server Error' }),
//     };
//   }
// };
// // 로컬 테스트용 코드
// if (require.main === module) {
//   (async () => {
//     const testEvent = require('../../event.json');
//     try {
//       const response = await handler(testEvent as any, {} as any, () => {}) as APIGatewayProxyResult;
//       console.log(response);
//     } catch (error) {
//       console.error('Error during local test execution:', error);
//     }
//   })();
// }
// // // src/hello-nuguna/app.ts
// // import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
// // import { generateSQLQuery } from './utils/sqlGenerator';
// // import { executeQuery } from './dataSources/queryExecutor';
// // import { formatResponse } from './utils/responseFormatter';
// // import { logger } from './utils/logger';
// // // Lambda 핸들러 함수
// // export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
// //   try {
// //     // 테스트 시 event.queryStringParameters에서 쿼리 텍스트를 받음
// //     const queryText = event.queryStringParameters?.text;
// //     if (!queryText) {
// //       return {
// //         statusCode: 400,
// //         body: JSON.stringify({ message: 'Query text is required' }),
// //       };
// //     }
// //     logger.info(`Received query text: ${queryText}`);
// //     const sqlQuery = generateSQLQuery(queryText);
// //     const data = await executeQuery(sqlQuery);
// //     const response = formatResponse(data);
// //     return {
// //       statusCode: 200,
// //       body: JSON.stringify(response),
// //     };
// //   } catch (error) {
// //     logger.error('Error processing request', error);
// //     return {
// //       statusCode: 500,
// //       body: JSON.stringify({ message: 'Internal Server Error' }),
// //     };
// //   }
// // };
// // // 로컬 테스트용 코드
// // if (require.main === module) {
// //   (async () => {
// //     try {
// //       const testEvent = require('../../event.json');
// //       const response = await handler(testEvent as any, {} as any, () => {});
// //       console.log(response);
// //     } catch (error) {
// //       console.error('Error during local test execution:', error);
// //     }
// //   })();
// // }
