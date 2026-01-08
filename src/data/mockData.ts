import { User, Project, WhatsAppNumber, StatusHistory, Campaign, ActionType, Broadcast, ActivityLog, BusinessManager, NumberErrorLog, NumberErrorState, CampaignShortcut } from '@/types';

export const users: User[] = [
  {
    id: '1',
    name: 'Paulo Admin',
    email: 'paulo@admin.com',
    password: 'master123',
    role: 'master',
    photo: '',
    status: 'active',
    createdAt: '2024-01-01T10:00:00Z',
    lastLogin: '2025-01-07T08:30:00Z'
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao@empresa.com',
    password: 'usuario123',
    role: 'user',
    photo: '',
    status: 'active',
    createdAt: '2024-03-15T14:00:00Z',
    lastLogin: '2025-01-06T16:45:00Z'
  },
  {
    id: '3',
    name: 'Maria Santos',
    email: 'maria@agencia.com',
    password: 'usuario123',
    role: 'user',
    photo: '',
    status: 'active',
    createdAt: '2024-06-20T09:30:00Z',
    lastLogin: '2025-01-07T10:15:00Z'
  },
  {
    id: '4',
    name: 'Carlos Oliveira',
    email: 'carlos@marketing.com',
    password: 'usuario123',
    role: 'user',
    photo: '',
    status: 'pending',
    createdAt: '2025-01-05T11:00:00Z'
  }
];

export const projects: Project[] = [
  {
    id: 'p1',
    userId: '2',
    name: 'E-commerce Principal',
    description: 'Números de atendimento da loja online',
    createdAt: '2024-04-01T10:00:00Z',
    updatedAt: '2025-01-06T14:30:00Z'
  },
  {
    id: 'p2',
    userId: '2',
    name: 'Suporte Técnico',
    description: 'Linhas de suporte ao cliente',
    createdAt: '2024-05-15T08:00:00Z',
    updatedAt: '2025-01-05T16:00:00Z'
  },
  {
    id: 'p3',
    userId: '3',
    name: 'Agência Digital',
    description: 'Gerenciamento de clientes',
    createdAt: '2024-07-01T09:00:00Z',
    updatedAt: '2025-01-07T09:00:00Z'
  },
  {
    id: 'p4',
    userId: '3',
    name: 'Lançamento Curso',
    description: 'Campanha de lançamento digital',
    createdAt: '2024-10-10T14:00:00Z',
    updatedAt: '2025-01-04T11:00:00Z'
  }
];

export let businessManagers: BusinessManager[] = [
  {
    id: 'bm1',
    projectId: 'p1',
    mainBmName: 'Autoflix Treinamentos',
    mainBmId: '917659149754317',
    subBmName: 'WABA Autoflix',
    subBmId: '1338898483886191',
    cardName: 'Visa Final 4242',
    cardLast4: '4242',
    accessToken: 'EAAtSOihZCbZCkBQbaaZC2tNroeSd1GSZCq4JIIsz8LsCeRPrrIM2slMzroHxdVp4Ct3P46Yhk6EC2MaaNS3KVUWZCqVjbCk07dWZBlvTmUtvK1uCHo5QJGgbQOqGNZAjXRnaxBVdp80ZCEmLmX9wLYRWcIZA6Q0cyTwQt498bTRZCqVPCZA3ymP5l8JQbKFEScF9gZDZD',
    createdAt: '2024-04-01T10:00:00Z'
  },
  {
    id: 'bm2',
    projectId: 'p1',
    mainBmName: 'BM Secundário',
    mainBmId: '999888777666',
    accessToken: 'EAAyyyyyyyyyyyyyyy',
    createdAt: '2024-05-01T10:00:00Z'
  },
  {
    id: 'bm3',
    projectId: 'p3',
    mainBmName: 'BM Agência',
    mainBmId: '123123123123',
    subBmName: 'Sub BM Clientes',
    subBmId: '456456456456',
    cardName: 'Mastercard Final 1234',
    cardLast4: '1234',
    accessToken: 'EAAzzzzzzzzzzzzzzz',
    createdAt: '2024-07-01T10:00:00Z'
  }
];

export let whatsappNumbers: WhatsAppNumber[] = [
  {
    id: 'wn1',
    projectId: 'p1',
    businessManagerId: 'bm1',
    phoneNumberId: '123456789',
    displayPhoneNumber: '+55 11 99999-1111',
    verifiedName: 'Loja Online Oficial',
    customName: 'Conta API 1',
    qualityRating: 'HIGH',
    messagingLimitTier: '1000',
    wabaId: 'waba_001',
    isVisible: true,
    observation: 'Conta principal para vendas',
    createdAt: '2024-04-02T10:00:00Z',
    lastChecked: '2025-01-07T06:00:00Z'
  },
  {
    id: 'wn2',
    projectId: 'p1',
    businessManagerId: 'bm1',
    phoneNumberId: '123456790',
    displayPhoneNumber: '+55 11 99999-2222',
    verifiedName: 'Vendas Express',
    customName: 'Conta API 2',
    qualityRating: 'MEDIUM',
    messagingLimitTier: '250',
    wabaId: 'waba_001',
    isVisible: true,
    observation: 'Usada para promoções',
    createdAt: '2024-04-05T11:00:00Z',
    lastChecked: '2025-01-07T06:00:00Z'
  },
  {
    id: 'wn3',
    projectId: 'p1',
    businessManagerId: 'bm2',
    phoneNumberId: '123456791',
    displayPhoneNumber: '+55 11 99999-3333',
    verifiedName: 'SAC Loja',
    qualityRating: 'LOW',
    messagingLimitTier: '50',
    wabaId: 'waba_001',
    isVisible: true,
    createdAt: '2024-04-10T09:00:00Z',
    lastChecked: '2025-01-07T06:00:00Z'
  },
  {
    id: 'wn4',
    projectId: 'p2',
    phoneNumberId: '123456792',
    displayPhoneNumber: '+55 11 98888-4444',
    verifiedName: 'Suporte Técnico 24h',
    qualityRating: 'HIGH',
    messagingLimitTier: '1000',
    wabaId: 'waba_002',
    isVisible: true,
    createdAt: '2024-05-20T10:00:00Z',
    lastChecked: '2025-01-07T06:00:00Z'
  },
  {
    id: 'wn5',
    projectId: 'p3',
    businessManagerId: 'bm3',
    phoneNumberId: '123456793',
    displayPhoneNumber: '+55 21 97777-5555',
    verifiedName: 'Agência Marketing Pro',
    qualityRating: 'HIGH',
    messagingLimitTier: '1000',
    wabaId: 'waba_003',
    isVisible: true,
    createdAt: '2024-07-05T14:00:00Z',
    lastChecked: '2025-01-07T06:00:00Z'
  },
  {
    id: 'wn6',
    projectId: 'p3',
    businessManagerId: 'bm3',
    phoneNumberId: '123456794',
    displayPhoneNumber: '+55 21 97777-6666',
    verifiedName: 'Atendimento Clientes',
    qualityRating: 'MEDIUM',
    messagingLimitTier: '250',
    wabaId: 'waba_003',
    isVisible: true,
    createdAt: '2024-07-10T11:00:00Z',
    lastChecked: '2025-01-07T06:00:00Z'
  },
  {
    id: 'wn7',
    projectId: 'p4',
    phoneNumberId: '123456795',
    displayPhoneNumber: '+55 21 96666-7777',
    verifiedName: 'Curso Expert Digital',
    qualityRating: 'HIGH',
    messagingLimitTier: '1000',
    wabaId: 'waba_004',
    isVisible: true,
    createdAt: '2024-10-15T10:00:00Z',
    lastChecked: '2025-01-07T06:00:00Z'
  }
];

export let statusHistory: StatusHistory[] = [
  {
    id: 'sh1',
    phoneNumberId: 'wn1',
    qualityRating: 'HIGH',
    messagingLimitTier: '1000/dia',
    changedAt: '2025-01-07T06:00:00Z',
    observation: 'Status mantido'
  },
  {
    id: 'sh2',
    phoneNumberId: 'wn1',
    qualityRating: 'HIGH',
    messagingLimitTier: '1000/dia',
    changedAt: '2025-01-06T12:00:00Z',
    observation: 'Verificação automática'
  },
  {
    id: 'sh3',
    phoneNumberId: 'wn1',
    qualityRating: 'HIGH',
    messagingLimitTier: '1000/dia',
    previousQuality: 'MEDIUM',
    changedAt: '2025-01-05T06:00:00Z',
    observation: 'Recuperação após 7 dias'
  },
  {
    id: 'sh4',
    phoneNumberId: 'wn1',
    qualityRating: 'MEDIUM',
    messagingLimitTier: '250/dia',
    previousQuality: 'HIGH',
    changedAt: '2024-12-28T18:00:00Z',
    expectedRecovery: '2025-01-04T18:00:00Z',
    observation: 'Queda após campanha de Natal'
  },
  {
    id: 'sh5',
    phoneNumberId: 'wn2',
    qualityRating: 'MEDIUM',
    messagingLimitTier: '250/dia',
    previousQuality: 'HIGH',
    changedAt: '2025-01-05T12:00:00Z',
    expectedRecovery: '2025-01-12T12:00:00Z',
    observation: 'Queda após campanha de Black Friday'
  },
  {
    id: 'sh6',
    phoneNumberId: 'wn2',
    qualityRating: 'HIGH',
    messagingLimitTier: '1000/dia',
    changedAt: '2025-01-01T10:00:00Z',
    observation: 'Status normal'
  },
  {
    id: 'sh7',
    phoneNumberId: 'wn3',
    qualityRating: 'LOW',
    messagingLimitTier: '50/dia',
    previousQuality: 'MEDIUM',
    changedAt: '2025-01-03T18:00:00Z',
    expectedRecovery: '2025-01-10T18:00:00Z',
    observation: 'Alta taxa de denúncias'
  },
  {
    id: 'sh8',
    phoneNumberId: 'wn3',
    qualityRating: 'MEDIUM',
    messagingLimitTier: '250/dia',
    previousQuality: 'HIGH',
    changedAt: '2024-12-30T14:00:00Z',
    expectedRecovery: '2025-01-06T14:00:00Z',
    observation: 'Primeira queda'
  }
];

export let campaigns: Campaign[] = [
  {
    id: 'c1',
    userId: '2',
    name: 'Campanha Janeiro 2025',
    description: 'Promoções de início de ano',
    status: 'active',
    createdAt: '2025-01-02T10:00:00Z'
  },
  {
    id: 'c2',
    userId: '3',
    name: 'Lançamento Produto X',
    description: 'Campanha de lançamento do novo produto',
    status: 'active',
    createdAt: '2024-12-15T14:00:00Z'
  }
];

export let actionTypes: ActionType[] = [
  { id: 'at1', campaignId: 'c1', name: 'Convite', color: '#3B82F6', description: 'Convites para eventos', isActive: true },
  { id: 'at2', campaignId: 'c1', name: 'Lançamento', color: '#10B981', description: 'Lançamentos de produtos', isActive: true },
  { id: 'at3', campaignId: 'c1', name: 'Perpétuo', color: '#8B5CF6', description: 'Ofertas perpétuas', isActive: true },
  { id: 'at4', campaignId: 'c1', name: 'Pós Graduação', color: '#F59E0B', description: 'Cursos pós graduação', isActive: true },
  { id: 'at5', campaignId: 'c2', name: 'Aquecimento', color: '#F59E0B', description: 'Fase de aquecimento', isActive: true },
  { id: 'at6', campaignId: 'c2', name: 'Carrinho Aberto', color: '#EF4444', description: 'Período de vendas', isActive: true }
];

export let broadcasts: Broadcast[] = [
  {
    id: 'b1',
    campaignId: 'c1',
    date: '2025-01-05',
    time: '14:30',
    actionTypeId: 'at1',
    phoneNumberId: 'wn1',
    listName: 'Lista VIP Janeiro',
    templateUsed: 'promo_janeiro_01',
    contactCount: 500,
    observations: 'Primeiro disparo do mês',
    status: 'sent',
    createdAt: '2025-01-05T14:30:00Z'
  },
  {
    id: 'b2',
    campaignId: 'c1',
    date: '2025-01-06',
    time: '10:00',
    actionTypeId: 'at2',
    phoneNumberId: 'wn1',
    listName: 'Clientes Ativos',
    templateUsed: 'lancamento_produto',
    contactCount: 1200,
    observations: 'Lançamento principal',
    status: 'sent',
    createdAt: '2025-01-06T10:00:00Z'
  },
  {
    id: 'b3',
    campaignId: 'c1',
    date: '2025-01-07',
    time: '09:00',
    actionTypeId: 'at3',
    phoneNumberId: 'wn2',
    listName: 'Lista Geral',
    templateUsed: 'perpetuo_v1',
    contactCount: 350,
    status: 'scheduled',
    createdAt: '2025-01-06T18:00:00Z'
  },
  {
    id: 'b4',
    campaignId: 'c2',
    date: '2025-01-07',
    time: '09:00',
    actionTypeId: 'at5',
    phoneNumberId: 'wn5',
    listName: 'Leads Quentes',
    templateUsed: 'aquecimento_v2',
    contactCount: 800,
    status: 'scheduled',
    createdAt: '2025-01-06T18:00:00Z'
  }
];

// Campaign Shortcuts
export let campaignShortcuts: CampaignShortcut[] = [
  {
    id: 'sc1',
    campaignId: 'c1',
    name: 'Tag Principal',
    content: 'L79 LISTA 3',
    isMultiline: false,
    createdAt: '2025-01-02T10:00:00Z'
  },
  {
    id: 'sc2',
    campaignId: 'c1',
    name: 'Tag Secundária',
    content: 'L79 INTERESSADOS L3',
    isMultiline: false,
    createdAt: '2025-01-02T10:05:00Z'
  },
  {
    id: 'sc3',
    campaignId: 'c1',
    name: 'Link Grupo 30',
    content: 'https://chat.whatsapp.com/exemplo30',
    isMultiline: false,
    createdAt: '2025-01-02T10:10:00Z'
  }
];

export const addCampaignShortcut = (shortcut: CampaignShortcut) => {
  campaignShortcuts = [...campaignShortcuts, shortcut];
  return shortcut;
};

export const updateCampaignShortcut = (id: string, data: Partial<CampaignShortcut>) => {
  campaignShortcuts = campaignShortcuts.map(s => 
    s.id === id ? { ...s, ...data } : s
  );
  return campaignShortcuts.find(s => s.id === id);
};

export const deleteCampaignShortcut = (id: string) => {
  campaignShortcuts = campaignShortcuts.filter(s => s.id !== id);
};

export const activityLogs: ActivityLog[] = [
  { id: 'al1', userId: '2', action: 'login', details: 'Login realizado com sucesso', timestamp: '2025-01-07T08:30:00Z' },
  { id: 'al2', userId: '2', action: 'create_broadcast', details: 'Criou disparo para Lista VIP Janeiro', timestamp: '2025-01-05T14:25:00Z' },
  { id: 'al3', userId: '3', action: 'add_number', details: 'Adicionou número +55 21 97777-6666', timestamp: '2025-01-04T11:00:00Z' },
  { id: 'al4', userId: '1', action: 'approve_user', details: 'Aprovou usuário Carlos Oliveira', timestamp: '2025-01-05T12:00:00Z' },
  { id: 'al5', userId: '3', action: 'login', details: 'Login realizado com sucesso', timestamp: '2025-01-07T10:15:00Z' }
];

// Helper functions for mutations (mock)
export const updateWhatsAppNumber = (id: string, data: Partial<WhatsAppNumber>) => {
  whatsappNumbers = whatsappNumbers.map(n => 
    n.id === id ? { ...n, ...data } : n
  );
  return whatsappNumbers.find(n => n.id === id);
};

export const addStatusHistory = (entry: StatusHistory) => {
  statusHistory = [entry, ...statusHistory];
  return entry;
};

export const updateStatusHistory = (id: string, data: Partial<StatusHistory>) => {
  statusHistory = statusHistory.map(h => 
    h.id === id ? { ...h, ...data } : h
  );
  return statusHistory.find(h => h.id === id);
};

export const getLatestStatusHistory = (phoneNumberId: string): StatusHistory | undefined => {
  return statusHistory.find(h => h.phoneNumberId === phoneNumberId);
};

export const updateActionType = (id: string, data: Partial<ActionType>) => {
  actionTypes = actionTypes.map(at => 
    at.id === id ? { ...at, ...data } : at
  );
  return actionTypes.find(at => at.id === id);
};

export const deleteActionType = (id: string) => {
  actionTypes = actionTypes.filter(at => at.id !== id);
};

export const addActionType = (actionType: ActionType) => {
  actionTypes = [...actionTypes, actionType];
  return actionType;
};

export const addBroadcast = (broadcast: Broadcast) => {
  broadcasts = [broadcast, ...broadcasts];
  return broadcast;
};

export const updateBroadcast = (id: string, data: Partial<Broadcast>) => {
  broadcasts = broadcasts.map(b => 
    b.id === id ? { ...b, ...data } : b
  );
  return broadcasts.find(b => b.id === id);
};

export const deleteBroadcast = (id: string) => {
  broadcasts = broadcasts.filter(b => b.id !== id);
};

// Business Manager CRUD
export const addBusinessManager = (bm: BusinessManager) => {
  businessManagers = [...businessManagers, bm];
  return bm;
};

export const updateBusinessManager = (id: string, data: Partial<BusinessManager>) => {
  businessManagers = businessManagers.map(bm => 
    bm.id === id ? { ...bm, ...data } : bm
  );
  return businessManagers.find(bm => bm.id === id);
};

export const deleteBusinessManager = (id: string) => {
  businessManagers = businessManagers.filter(bm => bm.id !== id);
};

// WhatsApp Number CRUD
export const addWhatsAppNumber = (number: WhatsAppNumber) => {
  whatsappNumbers = [...whatsappNumbers, number];
  return number;
};

// Error tracking
export let numberErrors: NumberErrorState[] = [];

export const addNumberError = (phoneNumberId: string, errorMessage: string) => {
  const existingError = numberErrors.find(e => e.phoneNumberId === phoneNumberId);
  const errorLog: NumberErrorLog = {
    id: `err${Date.now()}`,
    phoneNumberId,
    errorMessage,
    attemptedAt: new Date().toISOString(),
  };
  
  if (existingError) {
    existingError.errorCount++;
    existingError.lastError = errorMessage;
    existingError.attempts.push(errorLog);
  } else {
    numberErrors.push({
      phoneNumberId,
      errorCount: 1,
      lastError: errorMessage,
      attempts: [errorLog],
    });
  }
};

export const clearNumberErrors = (phoneNumberId: string) => {
  numberErrors = numberErrors.filter(e => e.phoneNumberId !== phoneNumberId);
};

export const hideNumberErrors = (phoneNumberId: string) => {
  numberErrors = numberErrors.map(e => 
    e.phoneNumberId === phoneNumberId ? { ...e, hidden: true } : e
  );
};

export const getNumberErrors = (phoneNumberId: string): NumberErrorState | undefined => {
  return numberErrors.find(e => e.phoneNumberId === phoneNumberId);
};

export const getAllNumberErrors = (): NumberErrorState[] => {
  return numberErrors;
};
