export interface Comment {
  id: string;
  workspace_id: string;
  channel_id: string;
  platform: string;
  
  // Données du commentaire
  platform_comment_id: string;
  comment_content: string;
  comment_author_name?: string;
  comment_author_id?: string;
  comment_author_avatar_url?: string;
  comment_likes_count: number;
  comment_replies_count: number;
  comment_created_at?: string;
  
  // Données du post
  post_id: string;
  post_content?: string;
  post_cdn_url?: string;
  post_created_at?: string;
  
  // Statuts
  has_official_reply: boolean;
  is_replied_by_us: boolean;
  replied_at?: string;
  reply_content?: string;
  
  // IA Analysis
  ai_score?: number;
  ai_category?: 'question' | 'critique_constructive' | 'compliment' | 'spam' | 'promotion' | 'autre';
  ai_sentiment?: 'positive' | 'negative' | 'neutral';
  ai_priority?: 'high' | 'medium' | 'low';
  ai_analysis_metadata?: Record<string, any>;
  ai_analyzed_at?: string;
  
  // État
  status: 'pending' | 'reviewed' | 'archived' | 'ignored';
  reviewed_by?: string;
  reviewed_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface AISuggestedReply {
  id: string;
  comment_id: string;
  suggested_reply: string;
  tone: 'professional' | 'friendly' | 'formal' | 'casual';
  confidence_score: number;
  generated_at: string;
}

export interface SwipeSession {
  id: string;
  workspace_id: string;
  channel_id?: string;
  user_id: string;
  session_started_at: string;
  session_ended_at?: string;
  comments_reviewed: number;
  comments_replied: number;
  session_metadata?: Record<string, any>;
}

export interface CommentSwipe {
  id: string;
  session_id: string;
  comment_id: string;
  action: 'swipe_right' | 'swipe_left' | 'swipe_up';
  reply_sent: boolean;
  reply_content?: string;
  swiped_at: string;
}