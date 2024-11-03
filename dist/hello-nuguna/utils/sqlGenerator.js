"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSQLQuery = void 0;
// src/hello-nuguna/utils/sqlGenerator.ts
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./logger");
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
// 다국어 번역 모델 설정
const translationPrimaryEndpoint = 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-ko-en';
const translationFallbackEndpoints = [
    'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-mul-en',
    'https://api-inference.huggingface.co/models/facebook/nllb-200-3.3B',
];
// const textToSQLEndpoint = 'https://api-inference.huggingface.co/models/google/flan-t5-small';
const textToSQLEndpoint = 'https://api-inference.huggingface.co/models/Salesforce/codet5-base';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const isLocal = process.env.NODE_ENV === 'local';
/**
 * API Key 검증 함수
 * @throws 에러 메시지와 함께 key가 없을 시 로그를 생성하고 종료
 */
const validateApiKey = () => {
    if (!HUGGING_FACE_API_KEY && !isLocal) {
        const errorMessage = 'API Key is missing. Please set HUGGING_FACE_API_KEY.';
        logger_1.logger.error(errorMessage);
        throw new Error(errorMessage);
    }
};
/**
 * 한국어 질문을 영어로 번역하는 함수
 * @param text 한국어 텍스트
 * @returns 번역된 영어 텍스트
 */
const translateToEnglish = async (text) => {
    validateApiKey();
    try {
        return await callTranslationModel(translationPrimaryEndpoint, text);
    }
    catch (error) {
        logger_1.logger.warn('Primary translation model failed. Attempting with fallback models.');
        for (const fallbackEndpoint of translationFallbackEndpoints) {
            try {
                return await callTranslationModel(fallbackEndpoint, text);
            }
            catch (fallbackError) {
                logger_1.logger.error(`Translation failed with model at ${fallbackEndpoint}`, {
                    error: fallbackError instanceof Error ? fallbackError.message : fallbackError,
                });
            }
        }
        logger_1.logger.error('Translation failed using all models.');
        throw new Error('Translation failed');
    }
};
/**
 * Hugging Face API에서 번역 요청을 수행
 * @param endpoint API 엔드포인트 URL
 * @param text 번역할 한국어 텍스트
 * @returns 번역된 영어 텍스트
 */
const callTranslationModel = async (endpoint, text) => {
    try {
        const response = await axios_1.default.post(endpoint, { inputs: text }, {
            headers: {
                Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        if (!Array.isArray(response.data) || !response.data[0]?.translation_text) {
            throw new Error('Unexpected response structure from translation API');
        }
        const translatedText = response.data[0].translation_text;
        logger_1.logger.info(`Translated question to English: "${translatedText}"`);
        return translatedText;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response) {
            const status = error.response.status;
            if (status === 503) {
                logger_1.logger.error('Translation API service temporarily unavailable (503)', { endpoint });
            }
            else if (status === 404) {
                logger_1.logger.error('Translation API endpoint not found (404)', { endpoint });
            }
            else {
                logger_1.logger.error('Translation API call failed', { endpoint, error: error.message });
            }
        }
        else {
            logger_1.logger.error('Translation API call failed', { endpoint, error: error instanceof Error ? error.message : error });
        }
        throw new Error('Translation API call failed');
    }
};
// /**
//  * 재시도 가능한 SQL 생성 함수
//  */
// const callTextToSQLModelWithRetry = async (englishQuestion: string): Promise<string> => {
//   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
//     try {
//       const response = await axios.post(
//         textToSQLEndpoint,
//         { inputs: `Convert the following question to SQL: ${englishQuestion}` },
//         {
//           headers: {
//             Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );
//       if (!Array.isArray(response.data) || !response.data[0]?.generated_text) {
//         throw new Error('Unexpected response structure from text-to-SQL API');
//       }
//       const sqlQuery = response.data[0].generated_text.trim();
//       logger.info(`Generated SQL Query from Hugging Face API: ${sqlQuery}`);
//       return sqlQuery;
//     } catch (error) {
//       if (axios.isAxiosError(error) && error.response?.status === 503) {
//         logger.warn(`Attempt ${attempt} for Text-to-SQL API failed with 503. Retrying...`);
//         await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
//       } else {
//         logger.error('Text-to-SQL API call failed', {
//           error: error instanceof Error ? error.message : error,
//         });
//         throw error;
//       }
//     }
//   }
//   throw new Error('Text-to-SQL API call failed after retries');
// };
/**
 * Hugging Face API를 사용해 자연어 질문을 SQL 쿼리로 변환
 * @param question 한국어 질문
 * @returns SQL 쿼리 문자열
 */
const generateSQLQuery = async (question) => {
    validateApiKey();
    logger_1.logger.info(`Original question: "${question}"`);
    if (isLocal && !HUGGING_FACE_API_KEY) {
        // 로컬 환경이면서 API Key가 없을 때, 기본 SQL 쿼리 반환
        logger_1.logger.warn('Local environment without API Key detected. Using default SQL query.');
        return generateDefaultSQLQuery(question);
    }
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            const englishQuestion = await translateToEnglish(question);
            const response = await axios_1.default.post(textToSQLEndpoint, { inputs: `Convert the following question to SQL: ${englishQuestion}` }, {
                headers: {
                    Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!Array.isArray(response.data) || typeof response.data[0]?.generated_text !== 'string') {
                throw new Error('Unexpected response structure from text-to-SQL API');
            }
            const sqlQuery = response.data[0].generated_text.trim();
            // 로컬 환경에서만 "function"을 기본 쿼리로 대체
            if (isLocal && sqlQuery === 'function') {
                logger_1.logger.warn(`Received "function" as query in local environment. Using default query instead.`);
                return generateDefaultSQLQuery(question);
            }
            logger_1.logger.info(`Generated SQL Query from Hugging Face API: ${sqlQuery}`);
            return sqlQuery;
            //  // generated_text를 함수로 반환하고 실행을 필요한 부분에서 처리하도록 설정
            //  const sqlQuery = response.data[0]?.generated_text;
            //  if (typeof sqlQuery === 'string') {
            //   return () => sqlQuery.trim();
            // } else if (typeof sqlQuery === 'function') {
            //   return sqlQuery;
            // } else {
            //   throw new Error('Unexpected response format: generated_text is neither a function nor a string');
            // }
            // // response가 function일 경우 즉시 실행하여 결과 가져오기
            // const sqlQuery =
            //     typeof response.data[0]?.generated_text === 'function'
            //       ? response.data[0].generated_text()
            //       : response.data[0]?.generated_text?.trim();
            //   if (!sqlQuery || typeof sqlQuery !== 'string') {
            //     throw new Error('Unexpected response structure from text-to-SQL API');
            //   }
            // // const sqlQuery = response.data[0].generated_text.trim();
            // logger.info(`Generated SQL Query from Hugging Face API: ${sqlQuery}`);
            // return sqlQuery;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.status === 503) {
                attempt++;
                logger_1.logger.warn(`Attempt ${attempt} for Text-to-SQL API failed with 503. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
            else {
                logger_1.logger.error('Text-to-SQL API call failed', { error: error instanceof Error ? error.message : error });
                break;
            }
        }
    }
    // 모든 시도가 실패한 경우 기본 SQL 쿼리 반환
    logger_1.logger.warn('All attempts to generate SQL query failed. Using default query.');
    return generateDefaultSQLQuery(question);
};
exports.generateSQLQuery = generateSQLQuery;
/**
 * 기본 SQL 쿼리 생성 로직
 * Hugging Face API가 실패하거나 응답이 없을 때 사용
 * @param question 자연어 질문
 * @returns 기본 SQL 쿼리
 */
const generateDefaultSQLQuery = (question) => {
    logger_1.logger.info('Generating default SQL query due to failed API response.');
    if (question.includes('방문자 수')) {
        return `SELECT source_medium, SUM(visitor_count) AS visitor_count
            FROM source_report
            GROUP BY source_medium
            ORDER BY visitor_count DESC
            LIMIT 10`;
    }
    if (question.includes('후원 전환율')) {
        return `SELECT source_medium,
                   COUNT(user_id) AS total_donors,
                   SUM(visitor_count) AS visitor_count,
                   ROUND((COUNT(user_id) * 1.0 / SUM(visitor_count)) * 100, 2) AS conversion_rate
            FROM source_report
            GROUP BY source_medium
            ORDER BY conversion_rate DESC
            LIMIT 10`;
    }
    return 'SELECT * FROM source_report LIMIT 10';
};
// // src/hello-nuguna/utils/sqlGenerator.ts
// import axios from 'axios';
// import { logger } from './logger';
// const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
// const translationPrimaryEndpoint = 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-ko-en';
// const translationFallbackEndpoint = 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-ko-en-v2';
// const textToSQLEndpoint = 'https://api-inference.huggingface.co/models/google/flan-t5-small';
// /**
//  * API Key 검증 함수
//  * @throws 에러 메시지와 함께 key가 없을 시 로그를 생성하고 종료
//  */
// const validateApiKey = () => {
//   if (!HUGGING_FACE_API_KEY) {
//     const errorMessage = 'API Key is missing. Please set HUGGING_FACE_API_KEY.';
//     logger.error(errorMessage);
//     throw new Error(errorMessage);
//   }
// };
// /**
//  * 한국어 질문을 영어로 번역하는 함수
//  * @param text 한국어 텍스트
//  * @returns 번역된 영어 텍스트
//  */
// const translateToEnglish = async (text: string): Promise<string> => {
//   validateApiKey();  // API Key 검증 통합
//   try {
//     return await callTranslationModel(translationPrimaryEndpoint, text);
//   } catch (error) {
//     logger.warn('Primary translation model failed. Attempting with fallback model.');
//     try {
//       return await callTranslationModel(translationFallbackEndpoint, text);
//     } catch (fallbackError) {
//       logger.error('Translation failed using both primary and fallback models', {
//         error: fallbackError instanceof Error ? fallbackError.message : fallbackError,
//       });
//       throw new Error('Translation failed');
//     }
//   }
// };
// /**
//  * Hugging Face API에서 번역 요청을 수행
//  * @param endpoint API 엔드포인트 URL
//  * @param text 번역할 한국어 텍스트
//  * @returns 번역된 영어 텍스트
//  */
// const callTranslationModel = async (endpoint: string, text: string): Promise<string> => {
//   try {
//     const response = await axios.post(
//       endpoint,
//       { inputs: text },
//       {
//         headers: {
//           Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//     if (!Array.isArray(response.data) || !response.data[0]?.translation_text) {
//       throw new Error('Unexpected response structure from translation API');
//     }
//     const translatedText = response.data[0].translation_text;
//     logger.info(`Translated question to English: "${translatedText}"`);
//     return translatedText;
//   } catch (error) {
//     logger.error('Translation API call failed', {
//       endpoint,
//       error: error instanceof Error ? error.message : error,
//     });
//     throw new Error('Translation API call failed');
//   }
// };
// /**
//  * Hugging Face API를 사용해 자연어 질문을 SQL 쿼리로 변환
//  * @param question 한국어 질문
//  * @returns SQL 쿼리 문자열
//  */
// export const generateSQLQuery = async (question: string): Promise<string> => {
//   validateApiKey();  // API Key 검증 통합
//   try {
//     logger.info(`Original question: "${question}"`);
//     const englishQuestion = await translateToEnglish(question);
//     const response = await axios.post(
//       textToSQLEndpoint,
//       { inputs: `Convert the following question to SQL: ${englishQuestion}` },
//       {
//         headers: {
//           Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//     if (!Array.isArray(response.data) || !response.data[0]?.generated_text) {
//       throw new Error('Unexpected response structure from text-to-SQL API');
//     }
//     const sqlQuery = response.data[0].generated_text.trim();
//     logger.info(`Generated SQL Query from Hugging Face API: ${sqlQuery}`);
//     return sqlQuery;
//   } catch (error) {
//     logger.error('Error generating SQL query', {
//       error: error instanceof Error ? error.message : error,
//     });
//     return generateDefaultSQLQuery(question);
//   }
// };
// /**
//  * 기본 SQL 쿼리 생성 로직
//  * Hugging Face API가 실패하거나 응답이 없을 때 사용
//  * @param question 자연어 질문
//  * @returns 기본 SQL 쿼리
//  */
// const generateDefaultSQLQuery = (question: string): string => {
//   logger.info('Generating default SQL query due to failed API response.');
//   if (question.includes('방문자 수')) {
//     return `SELECT source_medium, SUM(visitor_count) AS visitor_count
//             FROM source_report
//             GROUP BY source_medium
//             ORDER BY visitor_count DESC
//             LIMIT 10`;
//   }
//   if (question.includes('후원 전환율')) {
//     return `SELECT source_medium,
//                    COUNT(user_id) AS total_donors,
//                    SUM(visitor_count) AS visitor_count,
//                    ROUND((COUNT(user_id) * 1.0 / SUM(visitor_count)) * 100, 2) AS conversion_rate
//             FROM source_report
//             GROUP BY source_medium
//             ORDER BY conversion_rate DESC
//             LIMIT 10`;
//   }
//   return 'SELECT * FROM source_report LIMIT 10';
// };
// // // src/hello-nuguna/utils/sqlGenerator.ts
// // import axios from 'axios';
// // import { logger } from './logger';
// // const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
// // const translationPrimaryEndpoint = 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-ko-en';
// // const translationFallbackEndpoint = 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-ko-en-v2';
// // const textToSQLEndpoint = 'https://api-inference.huggingface.co/models/google/flan-t5-small';
// // /**
// //  * 한국어 질문을 영어로 번역하는 함수
// //  * @param text 한국어 텍스트
// //  * @returns 번역된 영어 텍스트
// //  */
// // const translateToEnglish = async (text: string): Promise<string> => {
// //   if (!HUGGING_FACE_API_KEY) {
// //     logger.error('Hugging Face API Key가 설정되지 않았습니다.');
// //     throw new Error('API Key is missing. Please set HUGGING_FACE_API_KEY.');
// //   }
// //   try {
// //     return await callTranslationModel(translationPrimaryEndpoint, text);
// //   } catch (error) {
// //     logger.warn('Primary translation model failed. Attempting with fallback model.');
// //     try {
// //       return await callTranslationModel(translationFallbackEndpoint, text);
// //     } catch (fallbackError) {
// //       logger.error('Translation failed using both primary and fallback models:', fallbackError instanceof Error ? fallbackError.message : fallbackError);
// //       throw new Error('Translation failed');
// //     }
// //   }
// // };
// // /**
// //  * Hugging Face API에서 번역 요청을 수행
// //  * @param endpoint API 엔드포인트 URL
// //  * @param text 번역할 한국어 텍스트
// //  * @returns 번역된 영어 텍스트
// //  */
// // const callTranslationModel = async (endpoint: string, text: string): Promise<string> => {
// //   try {
// //     const response = await axios.post(
// //       endpoint,
// //       { inputs: text },
// //       {
// //         headers: {
// //           Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
// //           'Content-Type': 'application/json',
// //         },
// //       }
// //     );
// //     if (!Array.isArray(response.data) || !response.data[0]?.translation_text) {
// //       throw new Error('Unexpected response structure from translation API');
// //     }
// //     const translatedText = response.data[0].translation_text;
// //     logger.info(`Translated question to English: "${translatedText}"`);
// //     return translatedText;
// //   } catch (error) {
// //     logger.error('Translation API call failed', { endpoint, error: error instanceof Error ? error.message : error });
// //     throw new Error('Translation API call failed');
// //   }
// // };
// // /**
// //  * Hugging Face API를 사용해 자연어 질문을 SQL 쿼리로 변환
// //  * @param question 한국어 질문
// //  * @returns SQL 쿼리 문자열
// //  */
// // export const generateSQLQuery = async (question: string): Promise<string> => {
// //   if (!HUGGING_FACE_API_KEY) {
// //     logger.error('Hugging Face API Key가 설정되지 않았습니다.');
// //     throw new Error('API Key is missing. Please set HUGGING_FACE_API_KEY.');
// //   }
// //   try {
// //     logger.info(`Original question: "${question}"`);
// //     const englishQuestion = await translateToEnglish(question);
// //     const response = await axios.post(
// //       textToSQLEndpoint,
// //       { inputs: `Convert the following question to SQL: ${englishQuestion}` },
// //       {
// //         headers: {
// //           Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
// //           'Content-Type': 'application/json',
// //         },
// //       }
// //     );
// //     if (!Array.isArray(response.data) || !response.data[0]?.generated_text) {
// //       throw new Error('Unexpected response structure from text-to-SQL API');
// //     }
// //     const sqlQuery = response.data[0].generated_text.trim();
// //     logger.info(`Generated SQL Query from Hugging Face API: ${sqlQuery}`);
// //     return sqlQuery;
// //   } catch (error) {
// //     logger.error('Error generating SQL query:', { error: error instanceof Error ? error.message : error });
// //     return generateDefaultSQLQuery(question);
// //   }
// // };
// // /**
// //  * 기본 SQL 쿼리 생성 로직
// //  * Hugging Face API가 실패하거나 응답이 없을 때 사용
// //  * @param question 자연어 질문
// //  * @returns 기본 SQL 쿼리
// //  */
// // const generateDefaultSQLQuery = (question: string): string => {
// //   logger.info('Generating default SQL query due to failed API response.');
// //   if (question.includes('방문자 수')) {
// //     return `SELECT source_medium, SUM(visitor_count) AS visitor_count
// //             FROM source_report
// //             GROUP BY source_medium
// //             ORDER BY visitor_count DESC
// //             LIMIT 10`;
// //   }
// //   if (question.includes('후원 전환율')) {
// //     return `SELECT source_medium,
// //                    COUNT(user_id) AS total_donors,
// //                    SUM(visitor_count) AS visitor_count,
// //                    ROUND((COUNT(user_id) * 1.0 / SUM(visitor_count)) * 100, 2) AS conversion_rate
// //             FROM source_report
// //             GROUP BY source_medium
// //             ORDER BY conversion_rate DESC
// //             LIMIT 10`;
// //   }
// //   return 'SELECT * FROM source_report LIMIT 10';
// // };
// // // // src/hello-nuguna/utils/sqlGenerator.ts
// // // import axios from 'axios';
// // // import { logger } from './logger';
// // // const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
// // // const translationPrimaryEndpoint = 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-ko-en';
// // // const translationFallbackEndpoint = 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-ko-en-v2';
// // // const textToSQLEndpoint = 'https://api-inference.huggingface.co/models/google/flan-t5-small';
// // // /**
// // //  * 한국어 질문을 영어로 번역하는 함수
// // //  * @param text 한국어 텍스트
// // //  * @returns 번역된 영어 텍스트
// // //  */
// // // const translateToEnglish = async (text: string): Promise<string> => {
// // //   try {
// // //     return await callTranslationModel(translationPrimaryEndpoint, text);
// // //   } catch (error) {
// // //     logger.warn('Primary translation model failed. Attempting with fallback model.');
// // //     try {
// // //       return await callTranslationModel(translationFallbackEndpoint, text);
// // //     } catch (fallbackError) {
// // //       logger.error('Translation failed using both primary and fallback models:', fallbackError instanceof Error ? fallbackError.message : fallbackError);
// // //       throw new Error('Translation failed');
// // //     }
// // //   }
// // // };
// // // /**
// // //  * Hugging Face API에서 번역 요청을 수행
// // //  * @param endpoint API 엔드포인트 URL
// // //  * @param text 번역할 한국어 텍스트
// // //  * @returns 번역된 영어 텍스트
// // //  */
// // // const callTranslationModel = async (endpoint: string, text: string): Promise<string> => {
// // //   const response = await axios.post(
// // //     endpoint,
// // //     { inputs: text },
// // //     {
// // //       headers: {
// // //         Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
// // //         'Content-Type': 'application/json',
// // //       },
// // //     }
// // //   );
// // //   const translatedText = response.data[0]?.translation_text;
// // //   if (!translatedText) throw new Error('Translation failed');
// // //   logger.info(`Translated question to English: "${translatedText}"`);
// // //   return translatedText;
// // // };
// // // /**
// // //  * Hugging Face API를 사용해 자연어 질문을 SQL 쿼리로 변환
// // //  * @param question 한국어 질문
// // //  * @returns SQL 쿼리 문자열
// // //  */
// // // export const generateSQLQuery = async (question: string): Promise<string> => {
// // //   try {
// // //     logger.info(`Original question: "${question}"`);
// // //     const englishQuestion = await translateToEnglish(question);
// // //     const response = await axios.post(
// // //       textToSQLEndpoint,
// // //       { inputs: `Convert the following question to SQL: ${englishQuestion}` },
// // //       {
// // //         headers: {
// // //           Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
// // //           'Content-Type': 'application/json',
// // //         },
// // //       }
// // //     );
// // //     const sqlQuery = response.data[0]?.generated_text?.trim();
// // //     if (sqlQuery) {
// // //       logger.info(`Generated SQL Query from Hugging Face API: ${sqlQuery}`);
// // //       return sqlQuery;
// // //     } else {
// // //       throw new Error('SQL query not generated from Hugging Face API');
// // //     }
// // //   } catch (error) {
// // //     logger.error('Error generating SQL query:', error instanceof Error ? error.message : error);
// // //     return generateDefaultSQLQuery(question);
// // //   }
// // // };
// // // /**
// // //  * 기본 SQL 쿼리 생성 로직
// // //  * Hugging Face API가 실패하거나 응답이 없을 때 사용
// // //  * @param question 자연어 질문
// // //  * @returns 기본 SQL 쿼리
// // //  */
// // // const generateDefaultSQLQuery = (question: string): string => {
// // //   if (question.includes('방문자 수')) {
// // //     return `SELECT source_medium, SUM(visitor_count) AS visitor_count
// // //             FROM source_report
// // //             GROUP BY source_medium
// // //             ORDER BY visitor_count DESC
// // //             LIMIT 10`;
// // //   }
// // //   if (question.includes('후원 전환율')) {
// // //     return `SELECT source_medium,
// // //                    COUNT(user_id) AS total_donors,
// // //                    SUM(visitor_count) AS visitor_count,
// // //                    ROUND((COUNT(user_id) * 1.0 / SUM(visitor_count)) * 100, 2) AS conversion_rate
// // //             FROM source_report
// // //             GROUP BY source_medium
// // //             ORDER BY conversion_rate DESC
// // //             LIMIT 10`;
// // //   }
// // //   return 'SELECT * FROM source_report LIMIT 10';
// // // };
// // // // // src/hello-nuguna/utils/sqlGenerator.ts
// // // // import axios from 'axios';
// // // // import { logger } from './logger';
// // // // const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
// // // // const translationEndpoint = 'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-ko-en';
// // // // const textToSQLEndpoint = 'https://api-inference.huggingface.co/models/google/flan-t5-small';
// // // // /**
// // // //  * 한국어 질문을 영어로 번역
// // // //  * @param text 한국어 텍스트
// // // //  * @returns 번역된 영어 텍스트
// // // //  */
// // // // const translateToEnglish = async (text: string): Promise<string> => {
// // // //     try {
// // // //       const response = await axios.post(
// // // //         translationEndpoint,
// // // //         { inputs: text },
// // // //         {
// // // //           headers: {
// // // //             Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
// // // //             'Content-Type': 'application/json',
// // // //           },
// // // //         }
// // // //       );
// // // //       const translatedText = response.data[0]?.translation_text;
// // // //       if (!translatedText) throw new Error('Translation failed');
// // // //       logger.info(`Translated question to English: "${translatedText}"`);
// // // //       return translatedText;
// // // //     } catch (error) {
// // // //       logger.error('Error translating text:', error);
// // // //       throw error;
// // // //     }
// // // //   };
// // // //   /**
// // // //    * Hugging Face API를 사용해 자연어 질문을 SQL 쿼리로 변환
// // // //    * @param question 한국어 질문
// // // //    * @returns SQL 쿼리 문자열
// // // //    */
// // // //   export const generateSQLQuery = async (question: string): Promise<string> => {
// // // //     try {
// // // //       logger.info(`Original question: "${question}"`);
// // // //       // 번역을 시도하고 실패 시 예외 처리
// // // //       const englishQuestion = await translateToEnglish(question);
// // // //       // 번역된 질문을 Text-to-SQL 모델로 전달
// // // //       const response = await axios.post(
// // // //         textToSQLEndpoint,
// // // //         { inputs: `Convert the following question to SQL: ${englishQuestion}` },
// // // //         {
// // // //           headers: {
// // // //             Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
// // // //             'Content-Type': 'application/json',
// // // //           },
// // // //         }
// // // //       );
// // // //       const sqlQuery = response.data[0]?.generated_text?.trim();
// // // //       if (sqlQuery) {
// // // //         logger.info(`Generated SQL Query from Hugging Face API: ${sqlQuery}`);
// // // //         return sqlQuery;
// // // //       } else {
// // // //         throw new Error('SQL query not generated from Hugging Face API');
// // // //       }
// // // //     } catch (error) {
// // // //       logger.error('Error generating SQL query:', error);
// // // //       return generateDefaultSQLQuery(question);
// // // //     }
// // // //   };
// // // //   /**
// // // //    * 기본 SQL 쿼리 생성 로직
// // // //    * Hugging Face API가 실패하거나 응답이 없을 때 사용
// // // //    * @param question 자연어 질문
// // // //    * @returns 기본 SQL 쿼리
// // // //    */
// // // //   const generateDefaultSQLQuery = (question: string): string => {
// // // //     if (question.includes('방문자 수')) {
// // // //       return `SELECT source_medium, SUM(visitor_count) AS visitor_count
// // // //               FROM source_report
// // // //               GROUP BY source_medium
// // // //               ORDER BY visitor_count DESC
// // // //               LIMIT 10`;
// // // //     }
// // // //     if (question.includes('후원 전환율')) {
// // // //       return `SELECT source_medium,
// // // //                      COUNT(user_id) AS total_donors,
// // // //                      SUM(visitor_count) AS visitor_count,
// // // //                      ROUND((COUNT(user_id) * 1.0 / SUM(visitor_count)) * 100, 2) AS conversion_rate
// // // //               FROM source_report
// // // //               GROUP BY source_medium
// // // //               ORDER BY conversion_rate DESC
// // // //               LIMIT 10`;
// // // //     }
// // // //     return 'SELECT * FROM source_report LIMIT 10';
// // // //   };
// // // // // // src/hello-nuguna/utils/sqlGenerator.ts
// // // // // import axios from 'axios';
// // // // // import { logger } from './logger';
// // // // // const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY; // 환경 변수로 설정된 API 키
// // // // // const modelEndpoint = 'https://api-inference.huggingface.co/models/google/flan-t5-small';
// // // // // /**
// // // // //  * Hugging Face API를 사용해 자연어 질문을 SQL 쿼리로 변환
// // // // //  * @param question 자연어 질문
// // // // //  * @returns SQL 쿼리 문자열
// // // // //  */
// // // // // export const generateSQLQuery = async (question: string): Promise<string> => {
// // // // //   try {
// // // // //     // API 요청을 통해 Hugging Face 모델을 호출하여 text-to-sql 변환 수행
// // // // //     const response = await axios.post(
// // // // //       modelEndpoint,
// // // // //       { inputs: `Convert the following question to SQL: ${question}` },
// // // // //       {
// // // // //         headers: {
// // // // //           Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
// // // // //           'Content-Type': 'application/json',
// // // // //         },
// // // // //       }
// // // // //     );
// // // // //     const sqlQuery = response.data[0]?.generated_text;
// // // // //     if (!sqlQuery) {
// // // // //       throw new Error('SQL query not generated');
// // // // //     }
// // // // //     logger.info(`Generated SQL Query from Hugging Face API: ${sqlQuery}`);
// // // // //     return sqlQuery;
// // // // //   } catch (error) {
// // // // //     logger.error('Error generating SQL query via Hugging Face API:', error);
// // // // //     return 'SELECT * FROM source_report LIMIT 10'; // 기본 쿼리 반환
// // // // //   }
// // // // // };
// // // // // // src/hello-nuguna/utils/sqlGenerator.ts
// // // // // import { TABLES, DEFAULT_RESPONSE_LIMIT } from '../constants';
// // // // // /**
// // // // //  * 자연어 질문을 SQL 쿼리로 변환
// // // // //  * @param question 자연어 질문
// // // // //  * @returns SQL 쿼리 문자열
// // // // //  */
// // // // // export const generateSQLQuery = (question: string): string => {
// // // // //   // "방문자 수"와 관련된 질문을 처리하는 예시
// // // // //   if (question.includes('방문자 수')) {
// // // // //     return `SELECT source_medium, SUM(visitor_count) AS visitor_count
// // // // //             FROM ${TABLES.SOURCE_REPORT}
// // // // //             GROUP BY source_medium
// // // // //             LIMIT ${DEFAULT_RESPONSE_LIMIT}`;
// // // // //   }
// // // // //   // "후원 전환율"과 관련된 질문을 처리하는 예시
// // // // //   if (question.includes('후원 전환율')) {
// // // // //     return `SELECT source_medium, 
// // // // //                    SUM(visitor_count) AS visitor_count, 
// // // // //                    COUNT(user_id) AS total_donors, 
// // // // //                    ROUND((COUNT(user_id) * 1.0 / SUM(visitor_count)) * 100, 2) AS conversion_rate
// // // // //             FROM ${TABLES.SOURCE_REPORT}
// // // // //             GROUP BY source_medium
// // // // //             LIMIT ${DEFAULT_RESPONSE_LIMIT}`;
// // // // //   }
// // // // //   // 기본 반환 SQL (테스트용)
// // // // //   return `SELECT * FROM ${TABLES.SOURCE_REPORT} LIMIT ${DEFAULT_RESPONSE_LIMIT}`;
// // // // // };
// // // // // // // src/hello-nuguna/utils/sqlGenerator.ts
// // // // // // import { TABLES, FIELDS, DEFAULT_RESPONSE_LIMIT } from '../constants';
// // // // // // export const generateSQLQuery = (inputText: string): string => {
// // // // // //   // 기본적인 키워드 매핑을 이용하여 간단한 SQL을 생성
// // // // // //   if (inputText.includes('방문자 수')) {
// // // // // //     return `SELECT ${FIELDS.SOURCE_MEDIUM}, COUNT(${FIELDS.USER_ID}) AS visitor_count 
// // // // // //             FROM ${TABLES.SOURCE_REPORT} 
// // // // // //             GROUP BY ${FIELDS.SOURCE_MEDIUM} 
// // // // // //             LIMIT ${DEFAULT_RESPONSE_LIMIT}`;
// // // // // //   }
// // // // // //   // 기본 반환 SQL (테스트용)
// // // // // //   return `SELECT * FROM ${TABLES.SOURCE_REPORT} LIMIT ${DEFAULT_RESPONSE_LIMIT}`;
// // // // // // };
