export type Area = {
  id: string;
  name: string;
};

export type Project = {
  id: string;
  title: string;
  areaId?: string;
  description: string;
  endDate?: string;
  notes: string;
};

export type KnowledgeProject = {
  id: string;
  title: string;
  description: string;
  status: "idea" | "active" | "paused" | "complete";
};

export type KnowledgeProjectPage = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  position: number;
};

export type KnowledgeProjectBlock = {
  id: string;
  pageId: string;
  type: "checklist" | "link" | "table";
  title: string;
  content: string;
  position: number;
};

export type Task = {
  id: string;
  title: string;
  areaId: string;
  projectId?: string;
  dueDate?: string;
  dueToday: boolean;
  priority: "none" | "low" | "medium" | "high";
  notes: string;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  done: boolean;
};

export type Routine = {
  id: string;
  title: string;
  target: number;
  completed: number;
};

export type InboxItem = {
  id: string;
  text: string;
  createdAt: string;
};

export type TrackingEntry = {
  id: string;
  type: "Zyklus" | "Kopfschmerzen" | "Tagesform";
  note: string;
};
