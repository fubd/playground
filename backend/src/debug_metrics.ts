import { MetricsService } from './services/metrics.service.js';
import { testDbConnection } from './db/connection.js';

async function debug() {
  const connected = await testDbConnection();
  if (!connected) {
    console.log('Database not connected');
    return;
  }

  const metricsService = new MetricsService();
  const history = await metricsService.getHistory(10080); // Get last 7 days
  console.log('History count (7 days):', history.length);
  if (history.length > 0) {
    console.log('Latest record:', history[history.length - 1]);
    console.log('First record:', history[0]);
  } else {
    // Check total count regardless of time
    const { getDb } = await import('./db/connection.js');
    const { sql } = await import('drizzle-orm');
    const [rows]: any = await getDb().execute(sql`SELECT count(*) as count FROM system_metrics`);
    console.log('Total records in table:', rows[0].count);
    
    if (rows[0].count > 0) {
      const [allRows]: any = await getDb().execute(sql`SELECT * FROM system_metrics LIMIT 1`);
      console.log('Example record:', allRows[0]);
      
      const [nowRow]: any = await getDb().execute(sql`SELECT NOW() as now`);
      console.log('Database NOW():', nowRow[0].now);
    }
  }
}

debug().catch(console.error);
