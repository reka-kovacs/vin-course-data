// TYPES
export type RawRecord = {
  participant_id: number;
  course_id: number;
  course_title: string | null;
  completion: number | null;
  last_accessed: string | null;
};

export type CellData = {
  completion: number | null;
  last_accessed: string | null;
  metadata?: {
    time_last_accessed: string;
  };
};

export type RowInfo = {
  participant_id: number;
  [courseID: number]: CellData | number;
};

export type Course = {
  id: number;
  title: string;
};

// TData
export type TransformedData = {
  rows: RowInfo[];
  courses: Course[];
};
