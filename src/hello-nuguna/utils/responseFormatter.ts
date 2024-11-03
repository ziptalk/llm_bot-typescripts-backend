// src/hello-nuguna/utils/responseFormatter.ts
interface QueryResult {
    [key: string]: any;
  }
  
  /**
   * SQL 쿼리 결과를 자연어 답변 형식으로 변환
   * @param data SQL 쿼리 결과 데이터
   * @returns 자연어 응답 문자열
   */
  export const formatResponse = (data: QueryResult[]): string => {
    if (data.length === 0) {
      return '데이터가 없습니다.';
    }
  
    // 방문자 수 관련 응답 포맷팅
    if ('visitor_count' in data[0]) {
      const response = data
        .map((row, index) => `${index + 1}. ${row.source_medium} - 방문자 수: ${row.visitor_count}명`)
        .join('\n');
      return `유입 채널별 방문자 수는 다음과 같습니다:\n${response}`;
    }
  
    // 후원 전환율 관련 응답 포맷팅
    if ('conversion_rate' in data[0]) {
      const response = data
        .map(
          (row, index) =>
            `${index + 1}. ${row.source_medium} - 전환율: ${row.conversion_rate}% (총 후원자 수: ${row.total_donors})`
        )
        .join('\n');
      return `유입 채널별 후원 전환율은 다음과 같습니다:\n${response}`;
    }
  
    // 기본 응답 포맷
    return JSON.stringify(data);
  };
  

// // src/hello-nuguna/utils/responseFormatter.ts
// interface QueryResult {
//     [key: string]: any;
//   }
  
//   export const formatResponse = (data: QueryResult[]): string => {
//     if (data.length === 0) {
//       return '데이터가 없습니다.';
//     }
//     const formattedData = data.map((row, index) => `${index + 1}. ${JSON.stringify(row)}`).join('\n');
//     return `조회 결과:\n${formattedData}`;
//   };
  