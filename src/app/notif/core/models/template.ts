export interface TemplateSummary {
  id: string;
  eventTypeId: string;
  priority: number;
  isActive: boolean;
  createdAt?: string;
}

export interface TemplateChannel {
  id: string;
  channelId: number;
}

export interface TemplateLocale {
  id: string;
  languageCode: string;
  title: string;
  body: string;
}

export interface TemplateDataBinding {
  id: string;
  dataSourceId: string;
  paramMapping?: string | null;
  executionOrder: number;
}

export interface TemplateTargetResolver {
  id: string;
  resolverType: number;
  config?: string | null;
  dataSourceId?: string | null;
  paramMapping?: string | null;
}

export interface TemplateAttachment {
  enabled: boolean;
  type: 'excel' | 'pdf' | 'csv';
  filename: string;
  sheetName: string;
  reportTitle: string;
  dataSourceId?: string | null;
  paramMapping?: string | null;
}

export interface TemplateDetail {
  id: string;
  eventTypeId: string;
  defaultTitle: string;
  defaultBody: string;
  isHtml: boolean;
  isActive: boolean;
  priority: number;
  maxRetries: number;
  retryDelaySeconds: number;
  scheduleType: number;
  cronExpression?: string | null;
  delayMinutes?: number | null;
  channels: TemplateChannel[];
  locales: TemplateLocale[];
  targetResolvers: TemplateTargetResolver[];
  dataBindings: TemplateDataBinding[];
  // flat fields returned by the API
  attachmentDataSourceId?: string | null;
  attachmentFileName?: string | null;
  attachmentSheetName?: string | null;
}
