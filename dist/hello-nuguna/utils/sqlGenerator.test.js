"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/hello-nuguna/utils/sqlGenerator.test.ts
const sqlGenerator_1 = require("./sqlGenerator");
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./logger");
jest.mock('axios');
const mockedAxios = axios_1.default;
// logger 함수들을 jest.fn()으로 모킹
beforeAll(() => {
    logger_1.logger.info = jest.fn();
    logger_1.logger.warn = jest.fn();
    logger_1.logger.error = jest.fn();
});
describe('generateSQLQuery', () => {
    const defaultQuery = `SELECT source_medium, SUM(visitor_count) AS visitor_count
            FROM source_report
            GROUP BY source_medium
            ORDER BY visitor_count DESC
            LIMIT 10`;
    beforeEach(() => {
        process.env.HUGGING_FACE_API_KEY = 'test_key';
        jest.clearAllMocks();
    });
    it('should generate SQL query from Hugging Face API after translation', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ translation_text: 'Which channel has the most visitors?' }],
        });
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ generated_text: defaultQuery }],
        });
        const question = '방문자 수가 많은 채널은?';
        const result = await (0, sqlGenerator_1.generateSQLQuery)(question);
        expect(result).toBe(defaultQuery);
        expect(logger_1.logger.info).toHaveBeenCalledWith(expect.stringContaining('Translated question to English'));
    });
    it('should use fallback translation model when primary translation fails', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Primary translation failed'));
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ translation_text: 'Which channel has the most visitors?' }],
        });
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ generated_text: defaultQuery }],
        });
        const question = '방문자 수가 많은 채널은?';
        const result = await (0, sqlGenerator_1.generateSQLQuery)(question);
        expect(result).toBe(defaultQuery);
        expect(logger_1.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Primary translation model failed'));
    });
    it('should use default SQL query when both translation models fail', async () => {
        mockedAxios.post.mockRejectedValueOnce({ message: 'Primary translation failed' });
        mockedAxios.post.mockRejectedValueOnce({ message: 'Fallback translation failed' });
        const question = '방문자 수가 많은 채널은?';
        const result = await (0, sqlGenerator_1.generateSQLQuery)(question);
        expect(result).toBe(defaultQuery);
        // 첫 번째 호출: Primary translation failure
        expect(logger_1.logger.error).toHaveBeenNthCalledWith(1, expect.stringContaining('Translation API call failed'), expect.objectContaining({
            error: expect.objectContaining({
                message: expect.stringContaining('Primary translation failed'),
            }),
        }));
        // 두 번째 호출: Fallback translation failure
        expect(logger_1.logger.error).toHaveBeenNthCalledWith(2, expect.stringContaining('Translation API call failed'), expect.objectContaining({
            error: expect.objectContaining({
                message: expect.stringContaining('Fallback translation failed'),
            }),
        }));
    });
    it('should use default SQL query when Text-to-SQL API fails after translation', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ translation_text: 'Which channel has the most visitors?' }],
        });
        mockedAxios.post.mockRejectedValueOnce({
            error: { error: { message: 'Text-to-SQL API failed', details: 'Text-to-SQL API error' } },
        });
        const question = '방문자 수가 많은 채널은?';
        const result = await (0, sqlGenerator_1.generateSQLQuery)(question);
        expect(result).toBe(defaultQuery);
        expect(logger_1.logger.error).toHaveBeenCalledWith(expect.stringContaining('Error generating SQL query'), expect.objectContaining({
            error: expect.any(Object)
        }));
    });
    it('should use default SQL query when Text-to-SQL API returns unexpected data format', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ translation_text: 'Which channel has the most visitors?' }],
        });
        mockedAxios.post.mockResolvedValueOnce({ data: [] });
        const question = '방문자 수가 많은 채널은?';
        const result = await (0, sqlGenerator_1.generateSQLQuery)(question);
        expect(result).toBe(defaultQuery);
        expect(logger_1.logger.error).toHaveBeenCalledWith(expect.stringContaining('Error generating SQL query'), expect.objectContaining({
            error: 'Unexpected response structure from text-to-SQL API',
        }));
    });
    it('should use default SQL query when API translation response has unexpected data structure', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: [{}],
        });
        mockedAxios.post.mockResolvedValueOnce({
            data: [{ generated_text: defaultQuery }],
        });
        const question = '방문자 수가 많은 채널은?';
        const result = await (0, sqlGenerator_1.generateSQLQuery)(question);
        expect(result).toBe(defaultQuery);
        expect(logger_1.logger.error).toHaveBeenCalledWith(expect.stringContaining('Translation API call failed'), expect.objectContaining({
            error: expect.stringContaining('Unexpected response structure from translation API'),
        }));
    });
});
// // src/hello-nuguna/utils/sqlGenerator.test.ts
// import { generateSQLQuery } from './sqlGenerator';
// import axios from 'axios';
// import { logger } from './logger';
// jest.mock('axios');
// const mockedAxios = axios as jest.Mocked<typeof axios>;
// jest.mock('./logger');
// describe('generateSQLQuery', () => {
//   const defaultQuery = `SELECT source_medium, SUM(visitor_count) AS visitor_count
//             FROM source_report
//             GROUP BY source_medium
//             ORDER BY visitor_count DESC
//             LIMIT 10`;
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });
//   it('should generate SQL query from Hugging Face API after translation', async () => {
//     mockedAxios.post.mockResolvedValueOnce({
//       data: [{ translation_text: 'Which channel has the most visitors?' }],
//     });
//     mockedAxios.post.mockResolvedValueOnce({
//       data: [{ generated_text: defaultQuery }],
//     });
//     const question = '방문자 수가 많은 채널은?';
//     const result = await generateSQLQuery(question);
//     expect(result).toBe(defaultQuery);
//     expect(logger.info).toHaveBeenNthCalledWith(1, `Original question: "${question}"`);
//     expect(logger.info).toHaveBeenNthCalledWith(2, `Translated question to English: "Which channel has the most visitors?"`);
//     expect(logger.info).toHaveBeenNthCalledWith(3, `Generated SQL Query from Hugging Face API: ${defaultQuery}`);
//   });
//   it('should use fallback translation model when primary translation fails', async () => {
//     mockedAxios.post.mockRejectedValueOnce(new Error('Primary translation failed'));
//     mockedAxios.post.mockResolvedValueOnce({
//       data: [{ translation_text: 'Which channel has the most visitors?' }],
//     });
//     mockedAxios.post.mockResolvedValueOnce({
//       data: [{ generated_text: defaultQuery }],
//     });
//     const question = '방문자 수가 많은 채널은?';
//     const result = await generateSQLQuery(question);
//     expect(result).toBe(defaultQuery);
//     expect(logger.warn).toHaveBeenCalledWith(
//       'Primary translation model failed. Attempting with fallback model.',
//     );
//     expect(logger.info).toHaveBeenNthCalledWith(2, `Translated question to English: "Which channel has the most visitors?"`);
//   });
//   it('should use default SQL query when both translation models fail', async () => {
//     mockedAxios.post.mockRejectedValueOnce(new Error('Primary translation failed'));
//     mockedAxios.post.mockRejectedValueOnce(new Error('Fallback translation failed'));
//     const question = '방문자 수가 많은 채널은?';
//     const result = await generateSQLQuery(question);
//     expect(result).toBe(defaultQuery);
//     expect(logger.error).toHaveBeenNthCalledWith(1, 'Translation failed using both primary and fallback models:', expect.any(Error));
//     expect(logger.error).toHaveBeenNthCalledWith(2, 'Error generating SQL query:', expect.any(Error));
//     expect(logger.info).toHaveBeenCalledWith(`Using default SQL Query: ${defaultQuery}`);
//   });
//   it('should use default SQL query when Text-to-SQL API fails after translation', async () => {
//     mockedAxios.post.mockResolvedValueOnce({
//       data: [{ translation_text: 'Which channel has the most visitors?' }],
//     });
//     mockedAxios.post.mockRejectedValueOnce(new Error('Text-to-SQL API failed'));
//     const question = '방문자 수가 많은 채널은?';
//     const result = await generateSQLQuery(question);
//     expect(result).toBe(defaultQuery);
//     expect(logger.error).toHaveBeenCalledWith('Error generating SQL query:', expect.any(Error));
//     expect(logger.info).toHaveBeenCalledWith(`Using default SQL Query: ${defaultQuery}`);
//   });
//   it('should use default SQL query when Text-to-SQL API returns no data', async () => {
//     mockedAxios.post.mockResolvedValueOnce({
//       data: [{ translation_text: 'Which channel has the most visitors?' }],
//     });
//     mockedAxios.post.mockResolvedValueOnce({ data: [] });
//     const question = '방문자 수가 많은 채널은?';
//     const result = await generateSQLQuery(question);
//     expect(result).toBe(defaultQuery);
//     expect(logger.error).toHaveBeenCalledWith('Error generating SQL query:', 'SQL query not generated from Hugging Face API');
//     expect(logger.info).toHaveBeenCalledWith(`Using default SQL Query: ${defaultQuery}`);
//   });
// });
// // // src/hello-nuguna/utils/sqlGenerator.test.ts
// // import axios from 'axios';
// // import { generateSQLQuery } from './sqlGenerator';
// // import { logger } from './logger';
// // jest.mock('axios');
// // const mockedAxios = axios as jest.Mocked<typeof axios>;
// // describe('generateSQLQuery', () => {
// //   const question = '방문자 수가 많은 채널은?';
// //   const translatedQuestion = 'Which channel has the most visitors?';
// //   const sqlQuery = `SELECT source_medium, SUM(visitor_count) AS visitor_count
// //                     FROM source_report
// //                     GROUP BY source_medium
// //                     ORDER BY visitor_count DESC
// //                     LIMIT 10`;
// //   const defaultQuery = sqlQuery;
// //   beforeEach(() => {
// //     jest.clearAllMocks();
// //   });
// //   it('should generate SQL query from Hugging Face API after translation', async () => {
// //     // Mock translation response from primary model
// //     mockedAxios.post.mockResolvedValueOnce({ data: [{ translation_text: translatedQuestion }] });
// //     // Mock Text-to-SQL response
// //     mockedAxios.post.mockResolvedValueOnce({ data: [{ generated_text: sqlQuery }] });
// //     const result = await generateSQLQuery(question);
// //     expect(result).toBe(sqlQuery);
// //     expect(mockedAxios.post).toHaveBeenCalledTimes(2);
// //     expect(mockedAxios.post).toHaveBeenCalledWith(
// //       expect.stringContaining('Helsinki-NLP/opus-mt-ko-en'),
// //       { inputs: question },
// //       expect.any(Object)
// //     );
// //   });
// //   it('should use fallback translation model when primary translation fails', async () => {
// //     // Mock primary translation model failure
// //     mockedAxios.post.mockRejectedValueOnce(new Error('Primary translation model failed'));
// //     // Mock fallback translation model success
// //     mockedAxios.post.mockResolvedValueOnce({ data: [{ translation_text: translatedQuestion }] });
// //     // Mock Text-to-SQL response
// //     mockedAxios.post.mockResolvedValueOnce({ data: [{ generated_text: sqlQuery }] });
// //     const result = await generateSQLQuery(question);
// //     expect(result).toBe(sqlQuery);
// //     expect(mockedAxios.post).toHaveBeenCalledTimes(3);
// //     expect(mockedAxios.post).toHaveBeenCalledWith(
// //       expect.stringContaining('Helsinki-NLP/opus-mt-ko-en-v2'),
// //       { inputs: question },
// //       expect.any(Object)
// //     );
// //   });
// //   it('should use default SQL query when both translation models fail', async () => {
// //     // Mock both translation model failures
// //     mockedAxios.post.mockRejectedValueOnce(new Error('Primary translation model failed'));
// //     mockedAxios.post.mockRejectedValueOnce(new Error('Fallback translation model failed'));
// //     const result = await generateSQLQuery(question);
// //     expect(result).toBe(defaultQuery);
// //     expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Translation failed'));
// //   });
// //   it('should use default SQL query when Text-to-SQL API fails after translation', async () => {
// //     // Mock successful translation
// //     mockedAxios.post.mockResolvedValueOnce({ data: [{ translation_text: translatedQuestion }] });
// //     // Mock Text-to-SQL model failure
// //     mockedAxios.post.mockRejectedValueOnce(new Error('Text-to-SQL API failed'));
// //     const result = await generateSQLQuery(question);
// //     expect(result).toBe(defaultQuery);
// //     expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error generating SQL query'));
// //   });
// //   it('should use default SQL query when Text-to-SQL API returns no data', async () => {
// //     // Mock successful translation
// //     mockedAxios.post.mockResolvedValueOnce({ data: [{ translation_text: translatedQuestion }] });
// //     // Mock Text-to-SQL model response with empty data
// //     mockedAxios.post.mockResolvedValueOnce({ data: [{}] });
// //     const result = await generateSQLQuery(question);
// //     expect(result).toBe(defaultQuery);
// //     expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('SQL query not generated from Hugging Face API'));
// //   });
// // });
// // // // src/hello-nuguna/utils/sqlGenerator.test.ts
// // // import axios from 'axios';
// // // import { generateSQLQuery } from './sqlGenerator';
// // // import { logger } from './logger';
// // // jest.mock('axios');
// // // jest.mock('./logger');
// // // const mockedAxios = axios as jest.Mocked<typeof axios>;
// // // describe('generateSQLQuery', () => {
// // //   beforeEach(() => {
// // //     jest.clearAllMocks();
// // //   });
// // //   it('should generate SQL query from Hugging Face API after translation', async () => {
// // //     const question = '방문자 수가 많은 채널 순위를 알고 싶습니다';
// // //     const translatedQuestion = 'I want to know the ranking of channels with the most visitors';
// // //     const mockSqlQuery = 'SELECT source_medium, SUM(visitor_count) AS total_visitors FROM source_report GROUP BY source_medium ORDER BY total_visitors DESC';
// // //     mockedAxios.post
// // //       .mockResolvedValueOnce({
// // //         data: [{ translation_text: translatedQuestion }],
// // //       })
// // //       .mockResolvedValueOnce({
// // //         data: [{ generated_text: mockSqlQuery }],
// // //       });
// // //     const result = await generateSQLQuery(question);
// // //     // 문자열 비교 시 줄바꿈 및 여러 공백을 단일 공백으로 변환하여 비교
// // //     expect(result.replace(/\s+/g, ' ')).toBe(mockSqlQuery.replace(/\s+/g, ' '));
// // //   });
// // //   it('should use default SQL query when translation API fails', async () => {
// // //     const question = '방문자 수가 많은 채널 순위를 알고 싶습니다';
// // //     const defaultQuery = `SELECT source_medium, SUM(visitor_count) AS visitor_count FROM source_report GROUP BY source_medium ORDER BY visitor_count DESC LIMIT 10`;
// // //     mockedAxios.post.mockRejectedValue(new Error('Translation API failed'));
// // //     const result = await generateSQLQuery(question);
// // //     expect(result.replace(/\s+/g, ' ')).toBe(defaultQuery.replace(/\s+/g, ' '));
// // //   });
// // //   it('should use default SQL query when Text-to-SQL API fails after translation', async () => {
// // //     const question = '방문자 수가 많은 채널 순위를 알고 싶습니다';
// // //     const translatedQuestion = 'I want to know the ranking of channels with the most visitors';
// // //     const defaultQuery = `SELECT source_medium, SUM(visitor_count) AS visitor_count FROM source_report GROUP BY source_medium ORDER BY visitor_count DESC LIMIT 10`;
// // //     mockedAxios.post.mockResolvedValueOnce({
// // //       data: [{ translation_text: translatedQuestion }],
// // //     });
// // //     mockedAxios.post.mockRejectedValueOnce(new Error('Text-to-SQL API failed'));
// // //     const result = await generateSQLQuery(question);
// // //     expect(result.replace(/\s+/g, ' ')).toBe(defaultQuery.replace(/\s+/g, ' '));
// // //   });
// // //   it('should use default SQL query when Text-to-SQL API returns no data', async () => {
// // //     const question = '후원 전환율이 높은 채널 순위를 알고 싶습니다';
// // //     const translatedQuestion = 'I want to know the ranking of channels with high conversion rates';
// // //     const defaultQuery = `SELECT source_medium,
// // //                           COUNT(user_id) AS total_donors,
// // //                           SUM(visitor_count) AS visitor_count,
// // //                           ROUND((COUNT(user_id) * 1.0 / SUM(visitor_count)) * 100, 2) AS conversion_rate
// // //                           FROM source_report
// // //                           GROUP BY source_medium
// // //                           ORDER BY conversion_rate DESC
// // //                           LIMIT 10`;
// // //     mockedAxios.post.mockResolvedValueOnce({
// // //       data: [{ translation_text: translatedQuestion }],
// // //     });
// // //     mockedAxios.post.mockResolvedValueOnce({
// // //       data: [{}],
// // //     });
// // //     const result = await generateSQLQuery(question);
// // //     expect(result.replace(/\s+/g, ' ')).toBe(defaultQuery.replace(/\s+/g, ' '));
// // //   });
// // // });
// // // // // src/hello-nuguna/services/nugunaService.test.ts
// // // // import { processQuestion } from '../services/nugunaService';
// // // // import { executeQuery } from '../dataSources/queryExecutor';
// // // // import { formatResponse } from '../utils/responseFormatter';
// // // // import { generateSQLQuery } from '../utils/sqlGenerator';
// // // // // Jest의 모킹 기능을 사용하여 의존성 모듈을 모킹
// // // // jest.mock('../utils/sqlGenerator');
// // // // jest.mock('../dataSources/queryExecutor');
// // // // jest.mock('../utils/responseFormatter');
// // // // describe('processQuestion', () => {
// // // //   beforeEach(() => {
// // // //     jest.clearAllMocks();
// // // //   });
// // // //   it('should process a question to generate and execute SQL', async () => {
// // // //     const question = '방문자 수';
// // // //     // API 호출을 모킹하여 예상 응답을 설정
// // // //     (generateSQLQuery as jest.Mock).mockResolvedValue(
// // // //       'SELECT source_medium, SUM(visitor_count) AS visitor_count FROM source_report GROUP BY source_medium'
// // // //     );
// // // //     (executeQuery as jest.Mock).mockResolvedValue([
// // // //       { source_medium: 'Google', visitor_count: 1200 },
// // // //       { source_medium: 'Facebook', visitor_count: 900 }
// // // //     ]);
// // // //     (formatResponse as jest.Mock).mockReturnValue(
// // // //       '유입 채널별 방문자 수는 다음과 같습니다: Google - 1200명, Facebook - 900명'
// // // //     );
// // // //     const result = await processQuestion(question);
// // // //     expect(generateSQLQuery).toHaveBeenCalledWith(question);
// // // //     expect(result).toBe('유입 채널별 방문자 수는 다음과 같습니다: Google - 1200명, Facebook - 900명');
// // // //   });
// // // //   it('should return error message if an exception occurs', async () => {
// // // //     const question = '방문자 수';
// // // //     // 에러를 강제로 발생시키기 위해 executeQuery 모킹
// // // //     (generateSQLQuery as jest.Mock).mockResolvedValue(
// // // //       'SELECT source_medium, SUM(visitor_count) AS visitor_count FROM source_report GROUP BY source_medium'
// // // //     );
// // // //     (executeQuery as jest.Mock).mockRejectedValue(new Error('Database connection error'));
// // // //     const result = await processQuestion(question);
// // // //     expect(result).toBe('죄송합니다. 질문을 처리하는 중 오류가 발생했습니다.');
// // // //     expect(generateSQLQuery).toHaveBeenCalledWith(question);
// // // //     expect(executeQuery).toHaveBeenCalledWith(expect.any(String));
// // // //   });
// // // // });
// // // // // src/hello-nuguna/services/nugunaService.test.ts
// // // // import { processQuestion } from '../services/nugunaService';
// // // // import { generateSQLQuery } from '../utils/sqlGenerator';
// // // // import { executeQuery } from '../dataSources/queryExecutor';
// // // // import { formatResponse } from '../utils/responseFormatter';
// // // // // Jest의 모킹 기능을 사용하여 의존성 모듈을 모킹
// // // // jest.mock('../utils/sqlGenerator');
// // // // jest.mock('../dataSources/queryExecutor');
// // // // jest.mock('../utils/responseFormatter');
// // // // describe('processQuestion', () => {
// // // //   beforeEach(() => {
// // // //     jest.clearAllMocks();
// // // //   });
// // // //   it('should generate and execute SQL for "방문자 수" question', async () => {
// // // //     const question = '방문자 수';
// // // //     // Mocking dependencies
// // // //     (generateSQLQuery as jest.Mock).mockResolvedValue(
// // // //       'SELECT source_medium, SUM(visitor_count) AS visitor_count FROM source_report GROUP BY source_medium'
// // // //     );
// // // //     (executeQuery as jest.Mock).mockResolvedValue([
// // // //       { source_medium: 'Google', visitor_count: 1200 },
// // // //       { source_medium: 'Facebook', visitor_count: 900 }
// // // //     ]);
// // // //     (formatResponse as jest.Mock).mockReturnValue(
// // // //       '유입 채널별 방문자 수는 다음과 같습니다: Google - 1200명, Facebook - 900명'
// // // //     );
// // // //     const result = await processQuestion(question);
// // // //     // Assertions
// // // //     expect(generateSQLQuery).toHaveBeenCalledWith(question);
// // // //     expect(executeQuery).toHaveBeenCalledWith(expect.any(String));
// // // //     expect(formatResponse).toHaveBeenCalledWith(expect.any(Array));
// // // //     expect(result).toBe(
// // // //       '유입 채널별 방문자 수는 다음과 같습니다: Google - 1200명, Facebook - 900명'
// // // //     );
// // // //   });
// // // //   it('should generate and execute SQL for "후원 전환율" question', async () => {
// // // //     const question = '후원 전환율';
// // // //     // Mocking dependencies
// // // //     (generateSQLQuery as jest.Mock).mockResolvedValue(
// // // //       `SELECT source_medium, COUNT(user_id) AS total_donors, ROUND((COUNT(user_id) * 1.0 / SUM(visitor_count)) * 100, 2) AS conversion_rate
// // // //        FROM source_report GROUP BY source_medium`
// // // //     );
// // // //     (executeQuery as jest.Mock).mockResolvedValue([
// // // //       { source_medium: 'Google', total_donors: 100, conversion_rate: 5.5 },
// // // //       { source_medium: 'Facebook', total_donors: 80, conversion_rate: 4.8 }
// // // //     ]);
// // // //     (formatResponse as jest.Mock).mockReturnValue(
// // // //       '유입 채널별 후원 전환율은 다음과 같습니다: Google - 5.5%, Facebook - 4.8%'
// // // //     );
// // // //     const result = await processQuestion(question);
// // // //     // Assertions
// // // //     expect(generateSQLQuery).toHaveBeenCalledWith(question);
// // // //     expect(executeQuery).toHaveBeenCalledWith(expect.any(String));
// // // //     expect(formatResponse).toHaveBeenCalledWith(expect.any(Array));
// // // //     expect(result).toBe(
// // // //       '유입 채널별 후원 전환율은 다음과 같습니다: Google - 5.5%, Facebook - 4.8%'
// // // //     );
// // // //   });
// // // //   it('should return error message if an exception occurs', async () => {
// // // //     const question = '방문자 수';
// // // //     // Force an error in executeQuery to simulate a failure
// // // //     (generateSQLQuery as jest.Mock).mockResolvedValue(
// // // //       'SELECT source_medium, SUM(visitor_count) AS visitor_count FROM source_report GROUP BY source_medium'
// // // //     );
// // // //     (executeQuery as jest.Mock).mockRejectedValue(new Error('Database connection error'));
// // // //     const result = await processQuestion(question);
// // // //     // Assertions
// // // //     expect(result).toBe('죄송합니다. 질문을 처리하는 중 오류가 발생했습니다.');
// // // //     expect(generateSQLQuery).toHaveBeenCalledWith(question);
// // // //     expect(executeQuery).toHaveBeenCalledWith(expect.any(String));
// // // //     expect(formatResponse).not.toHaveBeenCalled();
// // // //   });
// // // // });
// // // // // src/hello-nuguna/utils/sqlGenerator.test.ts
// // // // import { generateSQLQuery } from './sqlGenerator';
// // // // describe('generateSQLQuery', () => {
// // // //   it('should generate SQL for visitor count question', () => {
// // // //     const question = '방문자 수';
// // // //     const expectedSQL = `SELECT source_medium, SUM(visitor_count) AS visitor_count
// // // //             FROM source_report
// // // //             GROUP BY source_medium
// // // //             LIMIT 10`;
// // // //     const generatedSQL = generateSQLQuery(question);
// // // //     expect(generatedSQL.replace(/\s+/g, ' ').trim()).toBe(expectedSQL.replace(/\s+/g, ' ').trim());
// // // //   });
// // // //   it('should generate SQL for donation conversion rate question', () => {
// // // //     const question = '후원 전환율';
// // // //     const expectedSQL = `SELECT source_medium, 
// // // //                    SUM(visitor_count) AS visitor_count, 
// // // //                    COUNT(user_id) AS total_donors, 
// // // //                    ROUND((COUNT(user_id) * 1.0 / SUM(visitor_count)) * 100, 2) AS conversion_rate
// // // //             FROM source_report
// // // //             GROUP BY source_medium
// // // //             LIMIT 10`;
// // // //     const generatedSQL = generateSQLQuery(question);
// // // //     expect(generatedSQL.replace(/\s+/g, ' ').trim()).toBe(expectedSQL.replace(/\s+/g, ' ').trim());
// // // //   });
// // // // });
