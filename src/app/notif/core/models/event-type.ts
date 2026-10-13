export interface EventType {
  id: string;
  code: string;
  label: string;
  sourceSystem?: string;
  expectedPayload?: string;
  isActive?: boolean;
}
