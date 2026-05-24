import 'dotenv/config';
import { runMainIngestPipeline } from './cron_jobs';
import { identifyAndGenerateTrendingTopics } from '../ai/trends_history';

async function main() {
  console.log('[Manual Ingest] Initializing database pipeline...');
  await runMainIngestPipeline();
  
  console.log('[Manual Ingest] Re-calculating trending topics...');
  await identifyAndGenerateTrendingTopics();
  
  console.log('[Manual Ingest] Ingestion pipeline run completed successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[Manual Ingest] Pipeline crashed:', err);
  process.exit(1);
});
