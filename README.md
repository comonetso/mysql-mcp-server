# MySQL MCP 서버

Cursor IDE를 위한, MySQL 데이터베이스와 상호작용하는 Model Context Protocol(MCP) 서버입니다.

## 설치 및 실행

1. 필요한 패키지 설치:
   ```
   npm install
   ```

2. 서버 실행:
   ```
   npm start
   ```

## 환경 변수

서버 실행 시 다음 환경 변수를 설정할 수 있습니다:

- `MYSQL_HOST`: MySQL 서버 호스트 (기본값: "localhost")
- `MYSQL_PORT`: MySQL 서버 포트 (기본값: 3306)
- `MYSQL_USER`: MySQL 사용자 이름 (기본값: "root")
- `MYSQL_PASSWORD`: MySQL 비밀번호 (기본값: "")
- `MYSQL_DATABASE`: 기본 데이터베이스 (기본값: "test")
- `MYSQL_READONLY`: 읽기 전용 모드 활성화 여부 ("true" 또는 "false")

## Cursor IDE와 함께 사용하기

`mcp.json` 파일을 Cursor IDE 프로젝트에 추가하고 다음과 같이 구성하세요:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": [
        "-y",
        "github:comonetso/mysql-mcp-server"
      ],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "사용자명",
        "MYSQL_PASSWORD": "비밀번호",
        "MYSQL_DATABASE": "데이터베이스명",
        "MYSQL_READONLY": "true"
      }
    }
  }
}
```

## 기능

- SQL 쿼리 실행
- 테이블 목록 조회
- 테이블 구조 설명
- 데이터베이스 목록 조회
- 데이터베이스 전환
- 연결 상태 확인

## 라이센스

MIT