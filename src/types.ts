export type CampaignCategory = 'Community' | 'Technology' | 'Education' | 'Environment' | 'Creative';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: CampaignCategory;
  image: string;
  goal: number;
  raised: number;
  creator: string;
  deadline: string;
  createdAt: number;
  demo?: boolean;
}

export interface WalletInfo {
  address: string;
  balance: string;
}