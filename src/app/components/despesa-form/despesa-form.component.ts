import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';
import { Despesa, Categoria, Prioridade } from '../../models/despesa.model';
import { CATEGORIAS_PADRAO } from '../../models/categorias.data';

@Component({
  selector: 'app-despesa-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyMaskDirective],
  templateUrl: './despesa-form.component.html',
  styleUrl: './despesa-form.component.scss'
})
export class DespesaFormComponent implements OnInit, OnChanges {
  @Input() despesa: Despesa | null = null;
  @Input() isVisible: boolean = false;
  @Output() onSave = new EventEmitter<Omit<Despesa, 'id'>>();
  @Output() onCancel = new EventEmitter<void>();

  despesaForm: FormGroup;
  categorias = CATEGORIAS_PADRAO;
  prioridades = Object.values(Prioridade);

  constructor(private fb: FormBuilder) {
    this.despesaForm = this.createForm();
  }

  ngOnInit(): void {
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['despesa'] && !changes['despesa'].firstChange) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (this.despesa) {
      this.despesaForm.patchValue({
        descricao: this.despesa.descricao,
        valor: this.despesa.valor,
        categoriaId: this.despesa.categoria.id,
        dataVencimento: this.formatDateForInput(this.despesa.dataVencimento),
        prioridade: this.despesa.prioridade,
        paga: this.despesa.paga,
        dataPagamento: this.despesa.dataPagamento ? this.formatDateForInput(this.despesa.dataPagamento) : ''
      });
    } else {
      this.despesaForm.reset({
        descricao: '',
        valor: 0,
        categoriaId: '',
        dataVencimento: '',
        prioridade: Prioridade.MEDIA,
        paga: false
      });
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      valor: [0, [Validators.required, Validators.min(0.01)]],
      categoriaId: ['', Validators.required],
      dataVencimento: ['', Validators.required],
      prioridade: [Prioridade.MEDIA, Validators.required],
      paga: [false],
      dataPagamento: ['']
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
   * Parse a YYYY-MM-DD string as a local-date (midnight local time).
   * Using `new Date('YYYY-MM-DD')` can be interpreted as UTC in some environments,
   * which causes the stored instant to shift backwards when converted to local time.
   */
  private parseDateFromInput(value: string): Date {
    if (!value) return new Date();
    const parts = (value || '').split('-').map(p => Number(p));
    if (parts.length < 3 || parts.some(isNaN)) return new Date(value);
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }

  onSubmit(): void {
    if (this.despesaForm.valid) {
      const formValue = this.despesaForm.value;
      const categoria = this.categorias.find(c => c.id === formValue.categoriaId);
      
      if (categoria) {
        const despesaData: Omit<Despesa, 'id'> = {
          descricao: formValue.descricao,
          valor: formValue.valor,
          categoria: categoria,
          dataVencimento: this.parseDateFromInput(formValue.dataVencimento),
          prioridade: formValue.prioridade,
          paga: formValue.paga,
          // If the expense is marked as paid, use provided payment date if present; otherwise use now
          dataPagamento: formValue.paga ? (formValue.dataPagamento ? this.parseDateFromInput(formValue.dataPagamento) : new Date()) : undefined
        };

        this.onSave.emit(despesaData);
        this.resetForm();
      }
    }
  }

  onCancelClick(): void {
    this.resetForm();
    this.onCancel.emit();
  }

  private resetForm(): void {
    this.despesaForm.reset({
      prioridade: Prioridade.MEDIA,
      paga: false
    });
  }

  get isEditing(): boolean {
    return this.despesa !== null;
  }

  // Getters para validação
  get descricao() { return this.despesaForm.get('descricao'); }
  get valor() { return this.despesaForm.get('valor'); }
  get categoriaId() { return this.despesaForm.get('categoriaId'); }
  get dataVencimento() { return this.despesaForm.get('dataVencimento'); }
  get prioridade() { return this.despesaForm.get('prioridade'); }
}
