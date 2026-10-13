import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    PricingRule,
    CreatePricingRuleRequest,
    UpdatePricingRuleRequest
} from '../models/pricing.models';
import { getAppConfig } from '../config/app-config';

@Injectable({
    providedIn: 'root'
})
export class PricingService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${getAppConfig().apiUrl}/v1/pricing-rules`;

    getActivePricingRules(): Observable<PricingRule[]> {
        return this.http.get<PricingRule[]>(this.apiUrl);
    }

    getPricingRules(): Observable<PricingRule[]> {
        return this.http.get<PricingRule[]>(`${this.apiUrl}/all`);
    }

    createPricingRule(request: CreatePricingRuleRequest): Observable<PricingRule> {
        return this.http.post<PricingRule>(this.apiUrl, request);
    }

    updatePricingRule(id: string, request: UpdatePricingRuleRequest): Observable<PricingRule> {
        return this.http.put<PricingRule>(`${this.apiUrl}/${id}`, request);
    }

    deletePricingRule(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
