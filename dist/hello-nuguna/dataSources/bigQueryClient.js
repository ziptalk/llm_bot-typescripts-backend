"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigQueryClient = void 0;
// src/hello-nuguna/dataSources/bigQueryClient.ts
exports.bigQueryClient = {
    query: async (sqlQuery) => {
        console.log(`Executing SQL Query: ${sqlQuery}`);
        // Mock 데이터
        return [
            [
                { source_medium: 'Google', visitor_count: 1200 },
                { source_medium: 'Facebook', visitor_count: 900 },
            ],
        ];
    },
};
