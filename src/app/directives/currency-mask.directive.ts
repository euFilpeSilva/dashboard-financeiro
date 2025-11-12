import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCurrencyMask]',
  standalone: true
})
export class CurrencyMaskDirective implements OnInit {
  private formatter: Intl.NumberFormat;

  constructor(private el: ElementRef<HTMLInputElement>, private control: NgControl) {
    this.formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  ngOnInit(): void {
    const c = this.control.control;
    if (!c) return;

    const v = c.value;
    if (typeof v === 'number' && !isNaN(v)) {
      this.el.nativeElement.value = this.formatter.format(v);
    } else if (v === null || v === undefined) {
      this.el.nativeElement.value = '';
    }
  }

  @HostListener('input', [])
  onInput(): void {
    const input = this.el.nativeElement;
    const raw = input.value || '';
    // Allow users to type either whole reais (e.g. "100" -> R$ 100,00)
    // or with a decimal separator (e.g. "1,23" or "1.23" -> R$ 1,23).
    const cleaned = raw.replace(/[^\d.,]/g, '');

    if (!cleaned) {
      input.value = '';
      this.control.control?.setValue(null, { emitEvent: false });
      return;
    }

    // Decide separator if present (prefer last occurrence)
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    let number = 0;

    if (lastComma > -1 || lastDot > -1) {
      const sep = lastComma > lastDot ? ',' : '.';
      const parts = cleaned.split(sep);
      const reaisPart = parts[0].replace(/\D/g, '') || '0';
      const centsPart = (parts[1] || '').replace(/\D/g, '').slice(0, 2).padEnd(2, '0');
      const reais = parseInt(reaisPart, 10) || 0;
      const cents = parseInt(centsPart, 10) || 0;
      number = reais + cents / 100;
    } else {
      // No separator: interpret as whole reais
      const onlyDigits = cleaned.replace(/\D/g, '') || '0';
      number = parseInt(onlyDigits, 10) || 0;
    }

    input.value = this.formatter.format(number);
    // Update form control with numeric value (not formatted string)
    this.control.control?.setValue(number, { emitEvent: false });
  }

  // On blur, ensure control and view are consistent
  @HostListener('blur', [])
  onBlur(): void {
    const c = this.control.control;
    if (!c) return;
    const v = c.value;
    if (typeof v === 'number' && !isNaN(v)) {
      this.el.nativeElement.value = this.formatter.format(v);
    }
  }
}
