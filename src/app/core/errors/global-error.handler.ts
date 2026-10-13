import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly messageService = inject(MessageService);

  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      const detail = this.mapBackendMessage(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail
      });
      return;
    }
    // Fallback: log and show generic toast
    console.error(error);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Une erreur inattendue est survenue.'
    });
  }

  private mapBackendMessage(error: HttpErrorResponse): string {
    const backendMsg = error.error?.message || error.statusText || 'Erreur serveur';
    const code = error.error?.code || error.error?.errorCode;
    switch (code) {
      case 'VehicleUnavailableException':
        return 'Le véhicule sélectionné n’est plus disponible sur cette période.';
      case 'OverlappingReservation':
        return 'Conflit de réservation détecté sur ces dates.';
      case 'AccountLocked':
        return 'Compte verrouillé. Vérifiez vos emails pour le débloquer.';
      case 'EmailNotVerified':
        return 'Email non vérifié. Consultez votre boîte de réception.';
      default:
        return backendMsg;
    }
  }
}
