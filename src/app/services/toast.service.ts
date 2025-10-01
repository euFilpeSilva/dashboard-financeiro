import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  show(toast: Omit<Toast, 'id'>) {
    const newToast: Toast = {
      ...toast,
      id: this.generateId(),
      duration: toast.duration || 4000
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      this.remove(newToast.id);
    }, newToast.duration);
  }

  success(title: string, message?: string, duration?: number) {
    this.show({
      type: 'success',
      title,
      message,
      duration
    });
  }

  error(title: string, message?: string, duration?: number) {
    this.show({
      type: 'error',
      title,
      message,
      duration: duration || 6000 // Errors stay longer
    });
  }

  warning(title: string, message?: string, duration?: number) {
    this.show({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  info(title: string, message?: string, duration?: number) {
    this.show({
      type: 'info',
      title,
      message,
      duration
    });
  }

  remove(id: string) {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }

  clear() {
    this.toastsSubject.next([]);
  }
}