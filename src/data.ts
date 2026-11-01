import type { Campaign } from './types';

export const starterCampaigns: Campaign[] = [
  {
    id: 'demo-clean-water', title: 'Clean water for every home',
    description: 'A community-led effort to install safe water points and improve access to clean drinking water.',
    category: 'Community', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=85',
    goal: 2500, raised: 1420, creator: '', deadline: '2027-02-28', createdAt: 1, demo: true,
  },
  {
    id: 'demo-learn-code', title: 'Code forward: youth tech lab',
    description: 'Equip young people with practical software skills through a shared learning space and mentorship.',
    category: 'Education', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85',
    goal: 4000, raised: 2680, creator: '', deadline: '2027-01-31', createdAt: 2, demo: true,
  },
  {
    id: 'demo-green-city', title: 'A greener neighbourhood',
    description: 'Bring neighbours together to plant trees, restore shared spaces, and build a cleaner local environment.',
    category: 'Environment', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
    goal: 1800, raised: 920, creator: '', deadline: '2027-03-15', createdAt: 3, demo: true,
  },
];

export const CAMPAIGNS_KEY = 'orbit-fund-campaigns-v1';
export const CONTRIBUTIONS_KEY = 'orbit-fund-contributions-v1';