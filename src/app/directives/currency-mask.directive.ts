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
    // preserve caret position relative to the end so formatting doesn't jump the cursor unpredictably
    const selectionStart = input.selectionStart ?? raw.length;
    // Allow users to type either whole reais (e.g. "100" -> R$ 100,00)
    // or with a decimal separator (e.g. "1,23" or "1.23" -> R$ 1,23).
    const cleaned = raw.replace(/[^\d.,]/g, '');

    if (!cleaned) {
      input.value = '';
      this.control.control?.setValue(null, { emitEvent: false });
      return;
    }

    // Progressive (cent-based) formatting: treat all typed digits as cents so the
    // value updates visibly while typing. Examples:
    //   typed '1' -> R$ 0,01
    //   typed '100' -> R$ 1,00
    //   typed '450000' or '4.500,00' -> R$ 4.500,00
    const onlyDigits = cleaned.replace(/\D/g, '');
    if (!onlyDigits) {
      input.value = '';
      // don't update model yet
      return;
    }

    // limit length to avoid overflow
    const safeDigits = onlyDigits.slice(0, 15);
    const centsInt = parseInt(safeDigits, 10) || 0;
    const number = centsInt / 100;

    const formatted = this.formatter.format(number);
    input.value = formatted;
    // try to restore caret position: compute offset from end before formatting and apply to new value
    try {
      // place caret before the fractional cents group so typing feels natural
      const newLen = formatted.length;
      let newPos = newLen; // default to end
      try {
        // attempt to keep caret near end (before trailing spaces)
        newPos = Math.max(0, Math.min(newLen, newLen - (raw.length - selectionStart)));
      } catch (e) {
        newPos = newLen;
      }
      input.setSelectionRange(newPos, newPos);
    } catch (e) {
      // ignore if selection APIs unavailable
    }
  }

  // Additional listeners to better catch typing/paste/IME flows across browsers
  @HostListener('keyup', ['$event'])
  onKeyUp(ev: KeyboardEvent): void {
    // ignore navigation keys
    const ignore = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Shift','Control','Alt','Meta'];
    if (ignore.includes(ev.key)) return;
    this.onInput();
  }

  @HostListener('paste', ['$event'])
  onPaste(ev: ClipboardEvent): void {
    // Wait for paste to populate the input, then format
    setTimeout(() => this.onInput(), 0);
  }

  @HostListener('compositionend', ['$event'])
  onCompositionEnd(ev: Event): void {
    // IME composition ended (e.g., mobile/IME input), re-run formatting
    setTimeout(() => this.onInput(), 0);
  }

  // On blur, ensure control and view are consistent
  @HostListener('blur', [])
  onBlur(): void {
    const input = this.el.nativeElement;
    const raw = input.value || '';
    const cleaned = raw.replace(/[^\d.,]/g, '');

    if (!cleaned) {
      this.control.control?.setValue(null, { emitEvent: true });
      input.value = '';
      return;
    }

    // parse number the same way as onInput
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
      const onlyDigits = cleaned.replace(/\D/g, '') || '0';
      number = parseInt(onlyDigits, 10) || 0;
    }

    // write numeric value to the form control now that input is finished
    try { this.control.control?.setValue(number, { emitEvent: true }); } catch (e) { /* ignore */ }

    // ensure the view is formatted consistently
    if (typeof number === 'number' && !isNaN(number)) {
      input.value = this.formatter.format(number);
    }
  }
}
