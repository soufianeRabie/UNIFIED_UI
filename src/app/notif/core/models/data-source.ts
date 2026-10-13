export interface DataSource {
  id: string;
  name: string;
  sqlQuery: string;
  description?: string;
  expectedParams?: string;
  outputColumns?: string;
  isActive?: boolean;
  createdBy?: string;
}
