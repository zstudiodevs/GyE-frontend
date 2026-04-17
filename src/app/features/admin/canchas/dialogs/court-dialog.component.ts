import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { CourtResponse } from '../../../../core/models/court.models';

/** Pasar `court` para editar, `null` para crear. */
export interface CourtDialogData {
  court: CourtResponse | null;
}

export interface CourtDialogResult {
  address: string;
}

@Component({
  selector: 'app-court-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './court-dialog.component.html',
  styleUrl: './court-dialog.component.scss',
})
export class CourtDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CourtDialogComponent>);
  private readonly data = inject<CourtDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  readonly isEditing = this.data.court !== null;

  readonly form = this.fb.group({
    address: [this.data.court?.address ?? '', [Validators.required, Validators.maxLength(200)]],
  });

  readonly submitting = signal(false);

  submit(): void {
    if (this.form.invalid) return;
    const result: CourtDialogResult = { address: this.form.controls.address.value!.trim() };
    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
