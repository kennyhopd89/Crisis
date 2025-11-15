
export enum Severity {
  Low = 'Thấp',
  Medium = 'Trung bình',
  High = 'Cao',
}

export enum Status {
  Pending = 'Chưa xử lý',
  InProgress = 'Đang xử lý',
  Done = 'Đã xử lý',
}

export enum SourceType {
  Facebook = 'Facebook',
  TikTok = 'TikTok',
  Page = 'Page',
  Group = 'Group',
  YouTube = 'YouTube',
  Media = 'Media',
  Personal = 'Cá nhân',
  Other = 'Khác',
}

export interface Link {
  id: string;
  url: string;
  source: string; // URL của nguồn
  sourceType: SourceType;
  severity: Severity;
  issueType: string;
  detectedBy: string;
  detectedAt: string; // ISO string
  assignedTo: string;
  status: Status;
  actionNotes: string;
}

export interface Source {
  id: string;
  name: string;
  profileUrl: string;
  negativePostCount: number;
  type: string; // Page, Group, Cá nhân, Báo chí...
  notes: string;
  suspicious: boolean;
}

export enum View {
  Links = 'links',
  Sources = 'sources',
}
