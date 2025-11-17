import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';
import { Entrada } from '../../models/despesa.model';

// Fontes de entrada predefinidas
const FONTES_PADRAO = [
  { id: 'salario', nome: '💼 Salário', icone: '💼' },
  { id: 'Adiantamento Quinzenal (Salário)', nome: '💰 Adiantamento Quinzenal (Salário)', icone: '💰' },
    { id: 'Venda vale (Salário)', nome: '💰 Venda vale (Salário)', icone: '💰' },
  { id: 'freelance', nome: '💻 Freelance', icone: '💻' },
  { id: 'investimento', nome: '📈 Investimentos', icone: '📈' },
  { id: 'aluguel', nome: '🏠 Aluguel Recebido', icone: '🏠' },
  { id: 'vendas', nome: '🛒 Vendas', icone: '🛒' },
  { id: 'bonus', nome: '🎁 Bônus', icone: '🎁' },
  { id: 'pensao', nome: '👨‍👩‍👧‍👦 Pensão', icone: '👨‍👩‍👧‍👦' },
  { id: 'Pix', nome: '💰 Pix', icone: '💰' },
  { id: 'outros', nome: '💰 Outros', icone: '💰' }
];

@Component({
  selector: 'app-entrada-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyMaskDirective],
  templateUrl: './entrada-form.component.html',
  styleUrl: './entrada-form.component.scss'
})
export class EntradaFormComponent implements OnInit, OnChanges {
  @Input() entrada: Entrada | null = null;
  @Input() isVisible: boolean = false;
  @Output() onSave = new EventEmitter<Omit<Entrada, 'id'>>();
  @Output() onCancel = new EventEmitter<void>();

  entradaForm: FormGroup;
  fontes = FONTES_PADRAO;

  constructor(private fb: FormBuilder) {
    this.entradaForm = this.createForm();
  }

  ngOnInit(): void {
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entrada'] && !changes['entrada'].firstChange) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (this.entrada) {
      this.entradaForm.patchValue({
        descricao: this.entrada.descricao,
        valor: this.entrada.valor,
        fonte: this.entrada.fonte,
        data: this.formatDateForInput(this.entrada.data)
      });
    } else {
      this.entradaForm.reset({
        descricao: '',
        valor: 0,
        fonte: '',
        data: ''
      });
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      valor: [0, [Validators.required, Validators.min(0.01)]],
      fonte: ['', Validators.required],
      data: ['', Validators.required]
    });
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse a YYYY-MM-DD string as a local date (midnight local time).
   * This avoids the UTC interpretation `new Date('YYYY-MM-DD')` which can shift the day
   * backwards when serialized/read across timezones.
   */
  private parseDateFromInput(value: string): Date {
    if (!value) return new Date();
    const parts = (value || '').split('-').map(p => Number(p));
    if (parts.length < 3 || parts.some(isNaN)) return new Date(value);
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }

  onSubmit(): void {
    if (this.entradaForm.valid) {
      const formValue = this.entradaForm.value;
      
      const entradaData: Omit<Entrada, 'id'> = {
        descricao: formValue.descricao,
        valor: formValue.valor,
        fonte: formValue.fonte,
        data: this.parseDateFromInput(formValue.data)
      };

      this.onSave.emit(entradaData);
      this.resetForm();
    }
  }

  onCancelClick(): void {
    this.resetForm();
    this.onCancel.emit();
  }

  private resetForm(): void {
    this.entradaForm.reset();
  }

  get isEditing(): boolean {
    return this.entrada !== null;
  }

  // Getters para validação
  get descricao() { return this.entradaForm.get('descricao'); }
  get valor() { return this.entradaForm.get('valor'); }
  get fonte() { return this.entradaForm.get('fonte'); }
  get data() { return this.entradaForm.get('data'); }
}