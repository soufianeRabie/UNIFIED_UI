export interface PricingRule {
  id: string;
  ruleName: string;
  multiplier: number;
  startDate: string;
  endDate: string;
  priority: number;
  active: boolean;
}

export interface CreatePricingRuleRequest {
  ruleName: string;
  multiplier: number;
  startDate: string;
  endDate: string;
  priority?: number;
  active?: boolean;
}

export interface UpdatePricingRuleRequest {
  ruleName: string;
  multiplier: number;
  startDate: string;
  endDate: string;
  priority: number;
  active: boolean;
}
