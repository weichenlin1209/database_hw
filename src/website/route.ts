import { FastifyInstance, FastifyPluginAsync } from 'fastify';

// 1. 定義 Query Parameters 的型別結構
interface IMultiplyQuery {
  a?: string;
  b?: string;
}

// 修正：路徑參數是強制性的，移除問號
interface INameParam {
  a: string; 
}

export const websiteRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  
  // 原本的靜態首頁路由
  server.get('/', async (request, reply) => {
    return reply.sendFile('pages/index.html');
  });

  // 2. 乘法路由
  server.get<{ Querystring: IMultiplyQuery }>('/multiply', async (request, reply) => {
    
    const numA = Number(request.query.a) || 0;
    const numB = Number(request.query.b) || 0;
    const result = numA * numB;

    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Multiplication Result</title>
        <style>
          body { font-family: monospace; padding: 20px; }
          .result { font-size: 24px; color: #2c3e50; }
        </style>
      </head>
      <body>
        <h2>計算結果 (Calculation Result)</h2>
        <p class="result">
          ${numA} &times; ${numB} = <strong>${result}</strong>
        </p>
        <hr>
        <a href="/">返回首頁 (Back to Home)</a>
      </body>
      </html>
    `;

    reply.type('text/html; charset=utf-8');
    return htmlResponse;
    
  }); // <-- 修正：補上 )

  // 3. 路徑參數路由
  server.get<{ Params: INameParam }>('/hello/:a', async (request, reply) => {
      const { a } = request.params;
      return `Hello, ${a}!`;
  }); // <-- 修正：補上 )

  // 新增：資料庫連線測試路由
  server.get('/db-test', async (request, reply) => {
    // 1. 從 Connection Pool 中借用一個可用的連線 (Client)
    const client = await server.pg.connect();
    
    try {
      // 2. 執行原生的 SQL 查詢：取得資料庫伺服器的當前時間
      const { rows } = await client.query('SELECT NOW()');
      
      // 3. 回傳查詢結果 (Fastify 會自動將其序列化為 JSON)
      return { 
        status: 'success', 
        database_time: rows[0].now 
      };
    } finally {
      // 4. 絕對指令 (Crucial)：釋放連線歸還給 Pool
      // 若遺漏此步驟，將導致連線耗盡 (Resource Leak)，系統最終會崩潰
      client.release();
    }
  });

};
