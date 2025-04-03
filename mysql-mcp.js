#!/usr/bin/env node

const mysql = require('mysql');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// MySQL 연결 설정
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "test"
});

// MCP 서버 시작
console.log('MySQL MCP 서버 시작됨');

// MCP 도구 정의
const tools = {
  query: {
    description: "MySQL 데이터베이스에서 쿼리를 실행합니다",
    parameters: {
      type: "object",
      properties: {
        sql: {
          type: "string",
          description: "실행할 SQL 쿼리"
        },
        params: {
          type: "array",
          description: "쿼리 매개변수",
          items: {
            type: "string"
          }
        }
      },
      required: ["sql"]
    }
  },
  list_tables: {
    description: "MySQL 데이터베이스의 모든 테이블을 나열합니다",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  describe_table: {
    description: "MySQL 테이블의 구조를 설명합니다",
    parameters: {
      type: "object",
      properties: {
        table: {
          type: "string",
          description: "구조를 확인할 테이블 이름"
        }
      },
      required: ["table"]
    }
  },
  list_databases: {
    description: "서버에서 접근 가능한 모든 데이터베이스 목록을 가져옵니다",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  use_database: {
    description: "다른 데이터베이스로 전환합니다",
    parameters: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "전환할 데이터베이스 이름"
        }
      },
      required: ["database"]
    }
  },
  status: {
    description: "현재 데이터베이스 연결 상태를 확인합니다",
    parameters: {
      type: "object",
      properties: {}
    }
  }
};

// 스크립트 진입점
rl.on('line', (line) => {
  try {
    const input = JSON.parse(line);

    if (input.method === 'get_tools') {
      sendSuccess(input.id, { tools });
    } else if (input.method === 'query') {
      executeQuery(input);
    } else if (input.method === 'list_tables') {
      listTables(input);
    } else if (input.method === 'describe_table') {
      describeTable(input);
    } else if (input.method === 'list_databases') {
      listDatabases(input);
    } else if (input.method === 'use_database') {
      useDatabase(input);
    } else if (input.method === 'status') {
      getStatus(input);
    } else {
      sendError(input.id, 'Unsupported method: ' + input.method);
    }
  } catch (err) {
    console.error('Error parsing input:', err);
  }
});

// 쿼리 실행
function executeQuery(input) {
  const id = input.id;
  const params = input.params || {};

  const sql = params.sql;
  const sqlParams = params.params || [];

  if (!sql) {
    return sendError(id, 'SQL query is required');
  }

  // 읽기 전용 모드에서는 SELECT 쿼리만 허용
  if (process.env.MYSQL_READONLY === 'true' && !sql.trim().toLowerCase().startsWith('select')) {
    return sendError(id, 'Only SELECT queries are allowed in read-only mode');
  }

  connection.query(sql, sqlParams, (err, results) => {
    if (err) {
      return sendError(id, err.message);
    }

    sendSuccess(id, results);
  });
}

// 테이블 목록 조회
function listTables(input) {
  const id = input.id;

  connection.query('SHOW TABLES', (err, results) => {
    if (err) {
      return sendError(id, err.message);
    }

    const tables = results.map(row => Object.values(row)[0]);
    sendSuccess(id, tables);
  });
}

// 테이블 구조 조회
function describeTable(input) {
  const id = input.id;
  const params = input.params || {};

  if (!params.table) {
    return sendError(id, 'Table name is required');
  }

  connection.query('DESCRIBE ??', [params.table], (err, results) => {
    if (err) {
      return sendError(id, err.message);
    }

    sendSuccess(id, results);
  });
}

// 데이터베이스 목록 조회
function listDatabases(input) {
  const id = input.id;

  connection.query('SHOW DATABASES', (err, results) => {
    if (err) {
      return sendError(id, err.message);
    }

    const databases = results.map(row => Object.values(row)[0]);
    sendSuccess(id, databases);
  });
}

// 데이터베이스 전환
function useDatabase(input) {
  const id = input.id;
  const params = input.params || {};

  if (!params.database) {
    return sendError(id, 'Database name is required');
  }

  connection.query(`USE ??`, [params.database], (err) => {
    if (err) {
      return sendError(id, err.message);
    }

    sendSuccess(id, { message: `Successfully switched to database '${params.database}'` });
  });
}

// 상태 확인
function getStatus(input) {
  const id = input.id;

  if (!connection || connection.state === 'disconnected') {
    return sendSuccess(id, { connected: false, message: 'Not connected to database' });
  }

  const status = {
    connected: true,
    host: connection.config.host,
    port: connection.config.port,
    user: connection.config.user,
    database: connection.config.database,
    readonly: process.env.MYSQL_READONLY === 'true'
  };

  sendSuccess(id, status);
}

// 성공 응답 전송
function sendSuccess(id, result) {
  console.log(JSON.stringify({
    id,
    result
  }));
}

// 오류 응답 전송
function sendError(id, message) {
  console.log(JSON.stringify({
    id,
    error: {
      message
    }
  }));
}

// 종료 시 연결 종료
process.on('SIGINT', () => {
  console.log('MySQL MCP 서버 종료 중...');
  connection.end();
  process.exit();
});