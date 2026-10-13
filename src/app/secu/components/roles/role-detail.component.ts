import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, of, forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SecuApiService } from '../../services/secu-api.service';
import { SecuPermissionDto, SecuRoleDto, SecuPageActionDto } from '../../models/secu.models';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div style="margin-bottom:16px;">
      <a routerLink="../" style="color:var(--s-text-2);font-size:13px;text-decoration:none">← Back to Roles</a>
    </div>

    @if (role()) {
      <div class="s-page-header">
        <div>
          <h1 class="s-page-title" style="display:flex;align-items:center;gap:10px;">
            <span style="font-family:var(--s-mono);color:var(--s-accent)">{{ role()!.roleCode }}</span>
          </h1>
          <p class="s-page-subtitle">{{ role()!.roleName }}</p>
        </div>
        <span class="s-badge" [class.active]="role()!.isActive" [class.inactive]="!role()!.isActive">
          {{ role()!.isActive ? 'Active' : 'Inactive' }}
        </span>
      </div>

      <div class="s-card">
        <div class="s-card-header">
          <span class="s-card-title">🔐 Permissions</span>
          <div style="margin-left:auto;">
            <button class="s-btn s-btn-primary s-btn-sm" (click)="openAdd()">+ Add Permission</button>
          </div>
        </div>
        <div class="s-table-wrap">
          <table class="s-table">
            <thead>
              <tr><th>Page Code</th><th>Page Name</th><th>Action</th><th>Granted By</th><th>Granted At</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (p of permissions(); track p.idPermission) {
                <tr>
                  <td><span class="mono">{{ p.pageCode }}</span></td>
                  <td>{{ p.pageName }}</td>
                  <td><span class="s-badge action">{{ p.actionCode }}</span></td>
                  <td style="font-size:12px;color:var(--s-text-3);font-family:var(--s-mono)">{{ p.grantedBy?.substring(0,8) ?? '—' }}…</td>
                  <td style="font-size:12px;color:var(--s-text-2)">{{ p.grantedAt ? (p.grantedAt | date:'dd/MM/yy') : '—' }}</td>
                  <td><span class="s-badge" [class.active]="p.isActive" [class.inactive]="!p.isActive">{{ p.isActive ? 'Active' : 'Inactive' }}</span></td>
                  <td>
                    <button class="s-btn-icon danger" (click)="removePermission(p)" title="Remove">🗑</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7">
                  <div class="s-empty">
                    <div class="s-empty-icon">🔐</div>
                    <div class="s-empty-text">No permissions assigned to this role</div>
                  </div>
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    @if (addOpen()) {
      <div class="s-modal-backdrop" (click)="closeAdd()">
        <div class="s-modal wide" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">Add Permission</span>
            <button class="s-btn-icon" (click)="closeAdd()">✕</button>
          </div>
          <div class="s-modal-body">
            <div class="s-check-list">
              @for (pa of availablePageActions(); track pa.idPageAction) {
                <div class="s-check-item" style="cursor:pointer" (click)="grantPermission(pa)">
                  <span class="mono" style="font-size:12px;color:var(--s-accent);min-width:100px">{{ pa.pageCode }}</span>
                  <span class="s-badge action">{{ pa.actionCode }}</span>
                  <span style="font-size:12px;color:var(--s-text-2)">{{ pa.pageName }}</span>
                  <span style="margin-left:auto; font-size:11px; color:var(--s-text-3)">+ Grant</span>
                </div>
              }
            </div>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="closeAdd()">Close</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class RoleDetailComponent implements OnInit {
  private api = inject(SecuApiService);
  private route = inject(ActivatedRoute);

  role = signal<SecuRoleDto | null>(null);
  permissions = signal<SecuPermissionDto[]>([]);
  addOpen = signal(false);
  allPageActions = signal<SecuPageActionDto[]>([]);

  get availablePageActions() {
    const granted = new Set(this.permissions().map(p => p.idPageAction));
    return signal(this.allPageActions().filter(pa => !granted.has(pa.idPageAction)));
  }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    forkJoin([
      this.api.getRoles({ size: 200 }).pipe(catchError(() => of(null))),
      this.api.getRolePermissions(id, { size: 200 }).pipe(catchError(() => of(null))),
    ]).subscribe(([roles, perms]) => {
      if (roles) this.role.set(roles.data.find(r => r.idRole === id) ?? null);
      if (perms) this.permissions.set(perms.data);
    });
  }

  openAdd() {
    this.api.getPageActions({ size: 200 }).pipe(catchError(() => of(null))).subscribe(r => {
      if (r) this.allPageActions.set(r.data);
      this.addOpen.set(true);
    });
  }

  closeAdd() { this.addOpen.set(false); }

  grantPermission(pa: SecuPageActionDto) {
    const roleId = +this.route.snapshot.paramMap.get('id')!;
    this.api.createPermission({ roleId, pageActionId: pa.idPageAction })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.api.getRolePermissions(roleId, { size: 200 }).subscribe(r => this.permissions.set(r.data));
        this.allPageActions.set(this.allPageActions().filter(x => x.idPageAction !== pa.idPageAction));
      });
  }

  removePermission(p: SecuPermissionDto) {
    this.api.deletePermission(p.idPermission).pipe(catchError(() => of(null))).subscribe(() => {
      this.permissions.set(this.permissions().filter(x => x.idPermission !== p.idPermission));
    });
  }
}
