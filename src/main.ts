import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyPostgres from '@fastify/postgres';
import path from 'path';
import dotenv from 'dotenv';
import { websiteRoutes } from './website/route.js';

// 載入環境變數 (必須在讀取 process.env 之前執行)
dotenv.config();

const server = Fastify({ logger: true });

// 2. 解構環境變數
const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

// 3. Type Guard (型別守衛) 與 Fail-Fast (快速失敗) 機制
// 在 TypeScript 中，process.env 的屬性預設為 string | undefined
// 透過此檢查，我們不僅防堵了設定遺漏，也讓 TS 編譯器確信後續變數皆為 string
if (!DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT || !DB_NAME) {
  server.log.error('邏輯終止：.env 檔案中缺少必要的資料庫連線參數。');
  process.exit(1); 
}

// 4. 動態組裝 Connection String (連線字串)
const connectionString = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// 5. 註冊資料庫插件
server.register(fastifyPostgres, {
  connectionString
});

server.register(fastifyStatic, {
  root: path.join(process.cwd(), 'public'),
});

server.register(websiteRoutes);

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
