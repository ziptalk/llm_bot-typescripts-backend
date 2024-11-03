
---

# 자연어 기반 text-to-sql 변환 Lambda 서비스

이 프로젝트는 AWS Lambda와 Hugging Face API를 사용하여 **자연어로 된 질문을 SQL 쿼리로 변환**하고, 변환된 SQL 쿼리를 실행하여 결과를 반환하는 서버리스 애플리케이션입니다. 사용자는 HTTP 요청을 통해 질문을 입력하면, Lambda 함수가 Hugging Face API를 호출하여 SQL 쿼리를 생성하고, 데이터를 조회한 후 자연어 응답으로 결과를 반환합니다.

**현재는 API 호출 속도와 용량에 제한이 있으니, 오류 발생 시에는 잠시 기다렸다가 재시도해주시면 호출되는 경우가 많습니다! 실제 봇 환경에서는 보다 용이하게 동작할 거예요.**

**현재는 event.json 파일에서 '질문'을 넣으실 수 있고, 해당 질문에 대해 키워드 방식으로 추출 후 쿼리를 뽑고 있어 이 부분이 미진합니다. 또한, 쿼리 결과 -> 답변 쪽도 덜 구현되어 있습니다. AWS Lambda 를 본격적으로 사용하고 있지도 않습니다. 이 점 양해 부탁드립니다!**

---

## 목차
1. [설치 및 환경 설정](#설치-및-환경-설정)
2. [프로젝트 구조](#프로젝트-구조)
3. [코드 설명](#코드-설명)
4. [사용 방법](#사용-방법)
5. [테스트 방법](#테스트-방법)
6. [Hugging Face API 연동](#hugging-face-api-연동)
7. [에러 처리 및 로깅](#에러-처리-및-로깅)

---

## 설치 및 환경 설정

### 0. 사전 요구 사항

- Node.js (v14 이상)
- npm (v6 이상)
- Hugging Face API 키 (`HUGGING_FACE_API_KEY` 환경 변수에 설정해야 합니다)

### 1. 종속성 설치

```bash
# Node.js 종속성 설치
npm install
```

### 2. 환경 변수 설정

Hugging Face API 키와 같은 민감한 정보는 `.env` 파일에서 관리됩니다. 프로젝트 루트에 `.env` 파일을 생성하고, 아래와 같은 형식으로 API 키를 추가합니다.

```plaintext
# .env
HUGGING_FACE_API_KEY=your_hugging_face_api_key
```

- NODE_ENV=local 을 붙이면 로컬 환경에서 테스트 데이터베이스를 사용해 테스트됩니다. 해당 부분은 .env 파일에서 관리가 가능하지만, 직접 코드 실행 시 붙여도 됩니다.
- Hugging Face API 키가 없을 시, 로컬 환경에서는 기본 쿼리가 반환됩니다.

### 3. 테스트 데이터베이스 초기화
로컬 환경에서 SQLite 테스트 데이터베이스를 생성하려면, initTestDb.js 스크립트를 실행하여 초기 데이터를 설정해야 합니다.

```
bash
node initTestDb.js
```

- initTestDb.js 스크립트는 test.db라는 SQLite 데이터베이스를 생성하고, 로컬 테스트에 필요한 기본 데이터를 삽입합니다.

### 4. 빌드 및 배포

Lambda에 배포하려면 SAM CLI 또는 Serverless Framework를 사용할 수 있습니다. 아래는 로컬에서 TypeScript를 컴파일하는 명령입니다.

(npm run build도 가능하지만, Mac에서는 testData.json을 직접 복사해주셔야 합니다. 반면, npx tsc는 Windows / Mac에서 모두 testData.json을 dist/data에 복사해줍니다.)

```bash
# TypeScript 컴파일
npx tsc
```

---

## 프로젝트 구조

.
├── src
│   ├── hello-nuguna                # Lambda 함수 디렉터리
│   │   ├── app.ts                  # Lambda 핸들러 함수
│   │   ├── constants.ts            # 상수 정의 파일
│   │   ├── services
│   │   │   └── nugunaService.ts    # 비즈니스 로직 (text-to-sql 변환 및 응답 생성)
│   │   ├── utils
│   │   │   ├── logger.ts           # 로깅 유틸리티
│   │   │   ├── sqlGenerator.ts     # Hugging Face API를 사용해 SQL 생성
│   │   │   └── responseFormatter.ts # SQL 결과를 자연어 응답으로 포맷
│   │   ├── dataSources
│   │   │   ├── queryExecutor.ts    # 데이터베이스 쿼리 실행
│   │   │   ├── bigQueryClient.js   # BigQuery 클라이언트 설정 파일
│   │   │   └── bigQueryMock.ts     # BigQuery 클라이언트 모킹 파일 (테스트 용도)
│   ├── data                         
│   │   ├── testData.json           # 로컬 환경용 테스트 JSON 데이터 파일
│   │   └── initTestDb.ts          # 로컬 테스트용 SQLite 초기화 스크립트
├── .aws-sam                        # AWS SAM 빌드 및 배포 관련 디렉터리
│   ├── build                       # SAM CLI로 빌드한 파일 저장
│   └── stack                       # SAM 스택 관련 파일 저장
├── .env                            # 환경 변수 설정 파일
├── biome.json                      # 코드 스타일 및 포맷팅 관련 설정 파일
├── copyJson.js                     # testData.json을 빌드 디렉터리로 복사하는 스크립트
├── event.json                      # 로컬 테스트를 위한 이벤트 파일
├── README.md                       # 프로젝트 설명 파일
├── jest.config.js                  # Jest 설정 파일
├── jest.setup.js                   # Jest 초기화 스크립트
├── samconfig.toml                  # AWS SAM CLI 구성 파일
├── template.yaml                   # AWS Lambda 및 리소스 배포를 위한 SAM 템플릿 파일
├── tsconfig.json                   # TypeScript 설정 파일
└── package.json                    # npm 스크립트 및 프로젝트 의존성 관리 파일


---

## 코드 설명

### 1. `app.ts`
- Lambda 핸들러 함수로, HTTP 요청에서 쿼리 파라미터를 통해 질문(`text`)을 받아 처리합니다.
- `processQuestion` 함수를 호출해 자연어 질문을 SQL로 변환하고, 변환된 SQL을 실행하여 결과를 반환합니다.
- 에러 발생 시 500 오류와 기본 오류 메시지를 반환합니다.

### 2. `nugunaService.ts`
- `processQuestion` 함수가 포함된 서비스 계층으로, 자연어 질문을 SQL 쿼리로 변환한 후 결과를 포맷팅하여 반환합니다.
- **Hugging Face API**와 연동된 `generateSQLQuery` 함수를 호출하여 text-to-sql 변환을 수행합니다.

### 3. `sqlGenerator.ts`
- Hugging Face API를 사용해 자연어 질문을 SQL 쿼리로 변환하는 로직이 구현되어 있습니다.
- `generateSQLQuery` 함수는 Hugging Face API를 호출하여 질문을 SQL 쿼리로 변환하며, 오류 발생 시 기본 SQL 쿼리를 반환합니다.

### 4. `logger.ts`
- `info`, `warn`, `error` 메서드를 포함한 로깅 유틸리티 파일입니다.
- 모든 중요한 이벤트나 오류를 로깅하여 모니터링과 디버깅에 도움이 됩니다.

### 5. `responseFormatter.ts`
- SQL 쿼리 실행 결과를 사용자가 이해할 수 있는 자연어 응답으로 변환합니다.
- `formatResponse` 함수는 데이터베이스 결과를 처리하여 가독성 높은 형태로 반환합니다.

---

## 사용 방법

### Lambda 환경에서 사용

1. **API Gateway와 Lambda 연동**: Lambda 함수에 API Gateway를 연결하여 HTTP 요청을 받을 수 있게 설정합니다.
2. **API 호출 예시**: URL 쿼리 파라미터 `text`에 자연어 질문을 포함하여 호출합니다.

   ```plaintext
   https://your-api-url.amazonaws.com/prod?text=방문자 수를 알고 싶어요
   ```

3. **테스트 환경**: 현재는 아직 AWS Lambda 환경을 설정하지 않았으며, Hugging Face api를 로컬에서 직접 호출합니다.

### 로컬 테스트

- `event.json` 파일에서 `text` 값을 설정하여 질문을 입력합니다.

**예시**

  ```json
  {
    "queryStringParameters": {
      "text": "방문자 수를 알고 싶어요"
    }
  }
  ```

- 다음 명령어로 로컬에서 Lambda 핸들러를 실행합니다.

  ```bash
  NODE_ENV=local node dist/hello-nuguna/app.js
  ```

- **중요** 로컬 테스트 시 환경 변수에 Hugging Face API 키가 설정되어 있어야 합니다. 

- **중요** 또한, 현재는 NODE_ENV=local 을 붙이지 않아도 자동으로 Hugging Face API를 호출하며, 대신 BigQuery로 쿼리문을 처리합니다. (NODE_ENV=local 을 붙이면 SQLite로 처리합니다.) 

- 따라서, 빌드를 마쳤을 경우 다음 명령어로도 로컬 테스트가 가능합니다.

 ```bash
  node dist/hello-nuguna/app.js
  ```

- 작동이 되지 않을 경우, 1. 환경 변수 체크, 2. 테스트 데이터 존재 여부 확인, 3. 정상적으로 빌드되었는지, 4. 네트워크 연결 상태 등을 확인해주세요.

---

## 테스트 방법

1. **Jest 테스트**:
   - 프로젝트에서 Jest를 사용해 각 함수와 API의 동작을 테스트합니다.
   - `nugunaService.test.ts` 파일에서 다양한 질문을 입력으로 주고, 예상된 결과가 반환되는지 확인할 수 있습니다.

2. **Postman 또는 cURL 사용**:
   - Postman이나 cURL로 Lambda 핸들러를 호출하여 실제로 API가 응답하는지 테스트합니다.
   - 예시:
     ```bash
     curl "https://your-api-url.amazonaws.com/prod?text=방문자 수를 알고 싶어요"
     ```

---

## Hugging Face API 연동

1. Hugging Face API를 사용하여 자연어 질문을 SQL로 변환합니다.
2. API 호출을 위해 **환경 변수**에 Hugging Face API 키가 필요하며, `.env` 파일에서 관리됩니다.
3. `sqlGenerator.ts` 파일의 `generateSQLQuery` 함수에서 Hugging Face API가 호출되며, 실패할 경우 기본 SQL 쿼리가 반환됩니다.

---

## 에러 처리 및 로깅

- **로깅**: `logger.ts`에 정의된 `info`, `warn`, `error` 메서드를 사용하여 API 요청, SQL 변환, 오류 발생 등의 주요 이벤트를 로깅합니다.
- **에러 처리**: 각 주요 함수에서 `try-catch` 구문을 사용해 에러를 포착하고, 에러 발생 시 로깅하여 추적 가능하도록 설정합니다.
- **환경 변수 체크**: API 키가 누락된 경우 로컬 테스트 시 오류 메시지를 출력하고 프로세스를 종료합니다.

---

## 참고 사항

- **Hugging Face API 사용량**: Hugging Face API는 호출 시 요금이 부과될 수 있으므로 사용량을 주의하여 관리해야 합니다.
- **데이터베이스 쿼리 최적화**: 생성된 SQL 쿼리가 대용량 데이터를 조회하는 경우 쿼리 최적화가 필요할 수 있습니다.
- **확장성**: 다양한 질문 패턴을 추가하여 더 많은 종류의 질문을 처리할 수 있도록 확장 가능합니다.

---

이 프로젝트는 모두의연구소 누구나리포터 랩의 프로젝트를 위한 테스트 버전입니다.

Minik from Blockwave Labs.