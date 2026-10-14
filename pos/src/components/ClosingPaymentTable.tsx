import React from 'react';
import { ClosingPaymentSummary, ClosingCurrencyRow, currencyRowKey } from '../lib/pos-closing-api';
import { Input } from '@ury/ui';
import { formatCurrency, formatMoney } from '@ury/core';
import { cn } from '@ury/ui';
import { t } from '../i18n';

interface ClosingPaymentTableProps {
  rows: ClosingPaymentSummary[];
  /** Modes the cashier has explicitly entered a closing amount for (see Fix 2). */
  touchedModes: Set<string>;
  onChange: (modeOfPayment: string, closingAmount: number) => void;
  /**
   * Multi-currency closing (app `multimoneda`): one row per (mode of payment, physical currency).
   * When present, the cashier counts each currency here and the per-mode closing amount is derived.
   */
  currencyRows?: ClosingCurrencyRow[];
  touchedCurrency?: Set<string>;
  onCurrencyChange?: (modeOfPayment: string, moneda: string, contado: number) => void;
}

const parseAmount = (value: string) => {
  const parsed = parseFloat(value);
  // Clamp to non-negative in JS -- the HTML `min="0"` attribute alone does
  // not stop programmatic or pasted negative input.
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const HelpHeader = ({ label, help }: { label: string; help: string }) => (
  <span title={help} className="inline-flex items-center gap-1 cursor-help">
    {label}
    <span
      aria-hidden="true"
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px] leading-none text-gray-500"
    >
      i
    </span>
  </span>
);

const fmtIn = (amount: number, row: ClosingCurrencyRow) =>
  formatMoney(amount, row.simbolo || row.moneda, row.decimales ?? 2);

const ClosingPaymentTable: React.FC<ClosingPaymentTableProps> = ({
  rows,
  touchedModes,
  onChange,
  currencyRows,
  touchedCurrency,
  onCurrencyChange,
}) => {
  const byCurrency = !!currencyRows && currencyRows.length > 0 && !!onCurrencyChange;
  // Resumen en la moneda principal (Pablo 13-10-2026): se cuenta por moneda, se cierra en una sola.
  const sumCur = (fn: (r: ClosingCurrencyRow) => number) => (currencyRows ?? []).reduce((acc, r) => acc + fn(r), 0);
  const curExpected = sumCur((r) => r.esperado_principal);
  const curCounted = sumCur((r) => r.contado * r.cotizacion);
  const sumRows = (fn: (r: ClosingPaymentSummary) => number) => rows.reduce((acc, r) => acc + fn(r), 0);
  const totalOpening = sumRows((r) => r.opening_amount);
  const totalExpected = sumRows((r) => r.expected_amount);
  const totalClosing = sumRows((r) => r.closing_amount);
  const totalCell = (v: number) => (
    <td className={cn('py-3 px-4 text-right font-semibold', Math.abs(v) > 0.001 ? 'text-red-600' : 'text-green-600')}>{formatCurrency(v)}</td>
  );

  return (
    <div className="w-full overflow-x-auto space-y-6">
      {byCurrency && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900">{t('pos_closing.by_currency')}</h4>
          <p className="mb-2 text-xs text-gray-500">{t('pos_closing.help_by_currency')}</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('pos_closing.col_mode')}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('pos_closing.col_currency')}</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">
                  <HelpHeader label={t('pos_closing.col_expected')} help={t('pos_closing.help_expected')} />
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">
                  <HelpHeader label={t('pos_closing.col_counted')} help={t('pos_closing.help_closing')} />
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">
                  <HelpHeader label={t('pos_closing.col_difference')} help={t('pos_closing.help_difference')} />
                </th>
              </tr>
            </thead>
            <tbody>
              {currencyRows!.map((row) => {
                const key = currencyRowKey(row);
                const difference = row.contado - row.esperado;
                const hasDifference = Math.abs(difference) > 0.001;
                const isTouched = touchedCurrency?.has(key) ?? false;
                const step = row.decimales === 0 ? '1' : '0.01';
                return (
                  <tr
                    key={key}
                    className={cn(
                      'border-b border-gray-200 hover:bg-gray-50 transition-colors',
                      !isTouched && 'bg-amber-50/60'
                    )}
                  >
                    <td className="py-3 px-4 text-gray-900 font-medium">{row.mode_of_payment}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {row.moneda} <span className="text-gray-400">{row.simbolo}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {fmtIn(row.esperado, row)}
                      <span className="block text-xs text-gray-400">= {formatCurrency(row.esperado_principal)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        min="0"
                        step={step}
                        value={row.contado > 0 ? String(row.contado) : ''}
                        onChange={(e) => onCurrencyChange!(row.mode_of_payment, row.moneda, parseAmount(e.target.value))}
                        placeholder={row.decimales === 0 ? '0' : '0.00'}
                        className={cn('w-full text-center', !isTouched && 'border-amber-400')}
                        size="sm"
                      />
                    </td>
                    <td
                      className={cn(
                        'py-3 px-4 text-right font-medium',
                        hasDifference ? 'text-red-600' : 'text-green-600'
                      )}
                    >
                      {fmtIn(difference, row)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-900" colSpan={2}>{t('pos_closing.total_principal')}</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(curExpected)}</td>
                <td className="py-3 px-4 text-center font-semibold text-gray-900">{formatCurrency(curCounted)}</td>
                {totalCell(curCounted - curExpected)}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div>
        {byCurrency && (
          <h4 className="mb-2 text-sm font-semibold text-gray-900">{t('pos_closing.by_mode')}</h4>
        )}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('pos_closing.col_mode')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">{t('pos_closing.col_opening')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">
                <HelpHeader label={t('pos_closing.col_expected')} help={t('pos_closing.help_expected')} />
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">
                <HelpHeader label={t('pos_closing.col_closing')} help={byCurrency ? t('pos_closing.help_closing_derived') : t('pos_closing.help_closing')} />
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">
                <HelpHeader label={t('pos_closing.col_difference')} help={t('pos_closing.help_difference')} />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              // Positive = overage (cashier has more than expected), negative
              // = shortage. Must match the sign convention used in the submit
              // payload built by POSClosingDialog.handleSubmit.
              const difference = row.closing_amount - row.expected_amount;
              const hasDifference = Math.abs(difference) > 0.001;
              const isTouched = touchedModes.has(row.mode_of_payment);

              return (
                <tr
                  key={row.mode_of_payment}
                  className={cn(
                    'border-b border-gray-200 hover:bg-gray-50 transition-colors',
                    !isTouched && 'bg-amber-50/60'
                  )}
                >
                  <td className="py-3 px-4 text-gray-900 font-medium">{row.mode_of_payment}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(row.opening_amount)}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(row.expected_amount)}</td>
                  <td className="py-3 px-4">
                    {byCurrency ? (
                      <p className="text-center font-medium text-gray-900">{formatCurrency(row.closing_amount)}</p>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.closing_amount > 0 ? String(row.closing_amount) : ''}
                        onChange={(e) => onChange(row.mode_of_payment, parseAmount(e.target.value))}
                        placeholder="0.00"
                        className={cn('w-full text-center', !isTouched && 'border-amber-400')}
                        size="sm"
                      />
                    )}
                  </td>
                  <td
                    className={cn(
                      'py-3 px-4 text-right font-medium',
                      hasDifference ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {formatCurrency(difference)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="py-3 px-4 font-semibold text-gray-900">{t('pos_closing.total_principal')}</td>
              <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(totalOpening)}</td>
              <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(totalExpected)}</td>
              <td className="py-3 px-4 text-center font-semibold text-gray-900">{formatCurrency(totalClosing)}</td>
              {totalCell(totalClosing - totalExpected)}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ClosingPaymentTable;
