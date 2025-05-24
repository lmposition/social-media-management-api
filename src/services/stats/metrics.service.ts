import { Pool } from 'pg';
import { MetricData, MetricType, StatsRequest, StatsResponse } from '../../types/metrics.js';

export class MetricsService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async saveMetrics(metrics: MetricData[]): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO metrics (
          id, channel_id, workspace_id, platform, post_id, 
          metric_type, value, metadata, collected_at, post_created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (channel_id, post_id, metric_type, collected_at::date) 
        DO UPDATE SET 
          value = EXCLUDED.value,
          metadata = EXCLUDED.metadata,
          collected_at = EXCLUDED.collected_at
      `;

      for (const metric of metrics) {
        await client.query(query, [
          metric.id,
          metric.channel_id,
          metric.workspace_id,
          metric.platform,
          metric.post_id,
          metric.metric_type,
          metric.value,
          JSON.stringify(metric.metadata),
          metric.collected_at,
          metric.post_created_at
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getStats(request: StatsRequest): Promise<StatsResponse> {
    const client = await this.pool.connect();
    
    try {
      const whereConditions = [
        'workspace_id = $1',
        'collected_at >= $2',
        'collected_at <= $3'
      ];
      
      const params: any[] = [
        request.workspace_id,
        request.period.start_date,
        request.period.end_date
      ];

      if (request.channel_ids && request.channel_ids.length > 0) {
        whereConditions.push(`channel_id = ANY($${params.length + 1})`);
        params.push(request.channel_ids);
      }

      const metricsData: StatsResponse['metrics'] = {};

      for (const metricType of request.metrics) {
        const query = `
          SELECT 
            DATE_TRUNC('${request.granularity || 'day'}', collected_at) as date,
            AVG(value) as value
          FROM metrics 
          WHERE ${whereConditions.join(' AND ')} 
            AND metric_type = $${params.length + 1}
          GROUP BY DATE_TRUNC('${request.granularity || 'day'}', collected_at)
          ORDER BY date
        `;

        const result = await client.query(query, [...params, metricType]);
        
        const dataPoints = result.rows.map(row => ({
          date: row.date.toISOString(),
          value: parseFloat(row.value)
        }));

        const currentValue = dataPoints.reduce((sum, point) => sum + point.value, 0);
        
        metricsData[metricType] = {
          current_value: currentValue,
          data_points: dataPoints
        };
      }

      return { metrics: metricsData };
    } finally {
      client.release();
    }
  }

  async getLastCollectionTime(channelId: string, postId: string): Promise<Date | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT MAX(collected_at) as last_collection FROM metrics WHERE channel_id = $1 AND post_id = $2',
        [channelId, postId]
      );
      
      return result.rows[0]?.last_collection || null;
    } finally {
      client.release();
    }
  }
}