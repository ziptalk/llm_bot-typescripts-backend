// src/hello-nuguna/dataSources/bigQueryClient.ts
export const bigQueryClient = {
    query: async (sqlQuery: string) => {
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
  