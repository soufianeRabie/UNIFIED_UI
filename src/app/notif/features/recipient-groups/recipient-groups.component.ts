import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PermissionService } from '../../core/services/permission.service';
import { RecipientGroupsService } from '../../core/services/recipient-groups.service';
import { RecipientGroup, RecipientGroupMember } from '../../core/models/recipient-group';
import { PermActionDirective } from '../../../secu/directives/perm-action.directive';
import { formatHttpError } from '../../shared/utils/api-utils';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_CODE = 'NOTIF_GROUPS';

@Component({
  selector: 'notif-recipient-groups',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    DividerModule,
    InputTextModule,
    MessageModule,
    TableModule,
    TagModule,
    PermActionDirective,
    TranslatePipe
  ],
  templateUrl: './recipient-groups.component.html'
})
export class RecipientGroupsComponent {
  readonly PAGE_CODE = PAGE_CODE;
  readonly perm = inject(PermissionService);
  private readonly service = inject(RecipientGroupsService);
  private readonly fb = inject(FormBuilder);

  groups: RecipientGroup[] = [];
  selected: RecipientGroup | null = null;
  members: RecipientGroupMember[] = [];
  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;

  form = this.fb.group({
    code: ['', Validators.required],
    label: ['', Validators.required],
    description: [''],
    isActive: [true],
    createdBy: ['ui']
  });

  memberForm = this.fb.group({
    userId: ['', Validators.required],
    addedBy: ['ui']
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status = { type: 'info', message: 'Loading recipient groups...' };
    this.service.list().subscribe({
      next: (groups) => {
        this.groups = groups;
        this.status = null;
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  edit(group: RecipientGroup): void {
    this.selected = group;
    this.form.patchValue({
      code: group.code,
      label: group.label,
      description: group.description || '',
      isActive: group.isActive ?? true,
      createdBy: group.createdBy || 'ui'
    });
    this.loadMembers(group);
  }

  resetForm(): void {
    this.selected = null;
    this.members = [];
    this.form.reset({
      code: '',
      label: '',
      description: '',
      isActive: true,
      createdBy: 'ui'
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.status = { type: 'error', message: 'Please fill in required fields.' };
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (this.selected) {
      const payload = {
        label: value.label ?? '',
        description: value.description ?? undefined,
        isActive: value.isActive ?? true
      };
      this.service.update(this.selected.id, payload).subscribe({
        next: () => {
          this.status = { type: 'success', message: 'Recipient group updated.' };
          this.load();
          this.resetForm();
        },
        error: (err) => {
          this.status = { type: 'error', message: formatHttpError(err) };
        }
      });
      return;
    }

    const payload = {
      code: value.code ?? '',
      label: value.label ?? '',
      description: value.description ?? undefined,
      isActive: value.isActive ?? true,
      createdBy: value.createdBy || 'ui'
    };
    this.service.create(payload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Recipient group created.' };
        this.load();
        this.resetForm();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  remove(group: RecipientGroup): void {
    if (!confirm(`Delete recipient group ${group.code}?`)) {
      return;
    }
    this.service.delete(group.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Recipient group deleted.' };
        this.load();
        this.resetForm();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  loadMembers(group: RecipientGroup): void {
    this.service.getMembers(group.id).subscribe({
      next: (members) => {
        this.members = members;
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  addMember(): void {
    if (!this.selected) {
      return;
    }
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }
    const value = this.memberForm.getRawValue();
    this.service.addMember(this.selected.id, {
      userId: value.userId ?? '',
      addedBy: value.addedBy || 'ui'
    }).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Member added.' };
        this.memberForm.reset({ userId: '', addedBy: value.addedBy || 'ui' });
        this.loadMembers(this.selected as RecipientGroup);
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  removeMember(member: RecipientGroupMember): void {
    if (!this.selected) {
      return;
    }
    this.service.removeMember(this.selected.id, member.userId).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Member removed.' };
        this.loadMembers(this.selected as RecipientGroup);
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }
}


