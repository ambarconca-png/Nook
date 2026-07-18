export type Area = {
  id: string;
  name: string;
};

export type Project = {
  id: string;
  title: string;
  areaId?: string;
  note: string;
};

export type Task = {
  id: string;
  title: string;
  areaId: string;
  projectId?: string;
  dueToday: boolean;
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
