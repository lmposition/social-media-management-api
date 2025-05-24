import { OpenAI } from 'openai';
import { Pool } from 'pg';
import { Comment } from '../../types/comments.js';

interface AIAnalysisResult {
  score: number;
  category: string;
  sentiment: string;
  priority: string;
  reasoning: string;
  suggested_tone?: string;
}

export class CommentAnalysisService {
  private openai: OpenAI;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private getAnalysisPrompt(comment: Comment): string {
    const isEnglish = /[a-zA-Z]/.test(comment.comment_content) && !/[àâçéèêëîïôûùüÿñæœ]/i.test(comment.comment_content);

    const context = `
Post: "${comment.post_content?.substring(0, 200) || 'N/A'}"
Comment: "${comment.comment_content}"
Author: ${comment.comment_author_name || 'Anonymous'}
Platform: ${comment.platform}
Likes: ${comment.comment_likes_count}`;

    if (isEnglish) {
      return `
Analyze the following comment and return ONLY a valid JSON with this structure:
{
  "score": 85,
  "category": "question",
  "sentiment": "positive",
  "priority": "high",
  "reasoning": "Short explanation of the analysis",
  "suggested_tone": "professional"
}

RULES:
- score: 0-100 (relevance for replying)
- category: "question", "constructive_criticism", "compliment", "spam", "promotion", "other"
- sentiment: "positive", "negative", "neutral"
- priority: "high", "medium", "low"
- suggested_tone: "professional", "friendly", "formal", "casual"

${context}
Return ONLY the JSON.`;
    } else {
      return `
Analyse le commentaire suivant et retourne UNIQUEMENT un JSON valide avec cette structure :
{
  "score": 85,
  "category": "question",
  "sentiment": "positive",
  "priority": "high",
  "reasoning": "Explication courte de l'analyse",
  "suggested_tone": "professional"
}

RÈGLES :
- score : 0-100 (pertinence pour répondre)
- category : "question", "critique_constructive", "compliment", "spam", "promotion", "autre"
- sentiment : "positive", "negative", "neutral"
- priority : "high", "medium", "low"
- suggested_tone : "professional", "friendly", "formal", "casual"

${context}
Retourne UNIQUEMENT le JSON.`;
    }
  }

  async analyzeComment(comment: Comment): Promise<AIAnalysisResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: this.getAnalysisPrompt(comment) }],
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) throw new Error('No response from AI');

      const analysis = JSON.parse(content) as AIAnalysisResult;
      analysis.score = Math.max(0, Math.min(100, analysis.score));
      return analysis;
    } catch (error) {
      console.error('AI Analysis failed:', error);
      return {
        score: this.calculateFallbackScore(comment),
        category: 'other',
        sentiment: 'neutral',
        priority: 'medium',
        reasoning: 'Fallback heuristic analysis due to AI failure.',
        suggested_tone: 'professional',
      };
    }
  }

  private calculateFallbackScore(comment: Comment): number {
    let score = 30;
    if (comment.comment_content.includes('?')) score += 25;

    const keywords = [
      'comment', 'pourquoi', 'quand', 'où', 'help', 'aide', 'problème', 'bug', 'erreur', 'support', 'fonctionne', 'ne marche pas',
      'how', 'why', 'when', 'where', 'issue', 'error', 'doesn\'t work', 'not working', 'problem', 'support', 'question', 'need help',
      'can you', 'could you', 'please', 'thanks', 'merci', 'urgent', 'important', 'feedback', 'avis', 'suggestion', 'réclamation',
      'demande', 'request', 'info', 'information', 'clarification', 'détail', 'explication', 'explain', 'details'
    ];

    if (keywords.some(word => comment.comment_content.toLowerCase().includes(word))) score += 20;

    if (comment.comment_likes_count > 5) score += 15;
    if (comment.comment_likes_count > 20) score += 10;

    if (comment.comment_content.length < 10) score -= 20;
    return Math.max(0, Math.min(100, score));
  }

  async analyzeAndSaveComments(comments: Comment[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const comment of comments) {
        const analysis = await this.analyzeComment(comment);
        await client.query(`
          UPDATE easy_reply.comments SET 
            ai_score = $1,
            ai_category = $2,
            ai_sentiment = $3,
            ai_priority = $4,
            ai_analysis_metadata = $5,
            ai_analyzed_at = NOW(),
            updated_at = NOW()
          WHERE id = $6
        `, [
          analysis.score,
          analysis.category,
          analysis.sentiment,
          analysis.priority,
          JSON.stringify({
            reasoning: analysis.reasoning,
            suggested_tone: analysis.suggested_tone,
            ai_model: 'gpt-4o-mini',
            analysis_version: '1.0',
          }),
          comment.id,
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

  async getCommentsForSwipe(params: {
    workspace_id: string;
    channel_id?: string;
    limit?: number;
    min_score?: number;
    exclude_replied?: boolean;
  }): Promise<Comment[]> {
    const client = await this.pool.connect();
    try {
      const {
        workspace_id,
        channel_id,
        limit = 20,
        min_score = 50,
        exclude_replied = true,
      } = params;

      let whereClause = `WHERE workspace_id = $1 AND ai_score >= $2 AND status = 'pending'`;
      const values: any[] = [workspace_id, min_score];

      if (channel_id) {
        whereClause += ` AND channel_id = $${values.length + 1}`;
        values.push(channel_id);
      }

      if (exclude_replied) {
        whereClause += ` AND is_replied_by_us = FALSE`;
      }

      const query = `
        SELECT * FROM easy_reply.comments
        ${whereClause}
        ORDER BY ai_score DESC, comment_created_at DESC
        LIMIT $${values.length + 1}`;
      values.push(limit);

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }
}
