
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '26002';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'Secure_Admin_Pass_2026';
process.env.DB_NAME = 'server_monitor';

import { sql } from 'drizzle-orm';
import { execute } from './src/db/connection';

async function checkBooks() {
  try {
    console.log(`Connecting to ${process.env.DB_HOST}:${process.env.DB_PORT}...`);
    const rows = await execute(sql`SELECT count(*) as count FROM books`);
    console.log('Book count:', rows[0].count);
    
    if (rows[0].count > 0) {
        const books = await execute(sql`SELECT title, rating, author FROM books LIMIT 5`);
        console.table(books);
    } else {
        console.log('No books found in DB.');
    }
    process.exit(0);
  } catch (e) {
    console.error('Check failed:', e);
    process.exit(1);
  }
}

checkBooks();
