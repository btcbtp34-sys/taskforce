export type TaskForceRole = 
  | 'Sales Manager' 
  | 'SAP Consultant' 
  | 'Solution Architect' 
  | 'Business Analyst' 
  | 'Technical Consultant';

export interface TaskForceMember {
  id: string;
  name: string;
  role: TaskForceRole;
  avatar: string;
  email: string;
}

export interface TaskForceAction {
  id: string;
  customerId: string;
  title: string;
  description: string;
  assignedTo: TaskForceMember;
  dueDate: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
}

export interface TaskForceNote {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  content: string;
  tags?: string[];
}

export interface OpenQuestion {
  id: string;
  question: string;
  askedBy: string;
  answer?: string;
  answeredBy?: string;
  status: 'Open' | 'Resolved';
}

export interface TaskForceStageInfo {
  index: number;
  id: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
}
