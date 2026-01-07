// User types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'master' | 'user';
  photo?: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

// Project types
export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// WhatsApp Number types
export type QualityRating = 'HIGH' | 'MEDIUM' | 'LOW';

export interface WhatsAppNumber {
  id: string;
  projectId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
  customName?: string;
  qualityRating: QualityRating;
  messagingLimitTier: string;
  photo?: string;
  accessToken: string;
  wabaId: string;
  bmId: string;
  isVisible: boolean;
  observation?: string;
  createdAt: string;
  lastChecked: string;
}

// Status History types
export interface StatusHistory {
  id: string;
  phoneNumberId: string;
  qualityRating: QualityRating;
  messagingLimitTier: string;
  previousQuality?: QualityRating;
  changedAt: string;
  expectedRecovery?: string;
  observation?: string;
}

// Campaign types
export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  createdAt: string;
}

// Action Type types
export interface ActionType {
  id: string;
  campaignId: string;
  name: string;
  color: string;
  description?: string;
  isActive: boolean;
}

// Broadcast types
export interface Broadcast {
  id: string;
  campaignId: string;
  date: string;
  time: string;
  returnDate?: string;
  actionTypeId: string;
  phoneNumberId: string;
  listName: string;
  templateUsed: string;
  contactCount: number;
  observations?: string;
  tags?: string[];
  status: 'completed' | 'scheduled' | 'failed';
  createdAt: string;
}

// Activity Log types
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}
