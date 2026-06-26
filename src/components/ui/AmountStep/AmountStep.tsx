import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parseAmountToCents, formatMoney } from '@/core/money';
import { useAccount } from '@/features/wallet/hooks/useAccount';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import styles from './AmountStep.module.scss';
import { amountSchema } from '@/features/transactions/schema';
import { useTransferStore } from '@/features/transactions/store/transferStore';
import { amountIsPositive, balanceIsSufficient } from '@/features/transactions/domain/rules';

const schema = z.object({ amount: amountSchema });
type FormValues = z.infer<typeof schema>;

export function AmountStep() {
  const setAmount = useTransferStore((s) => s.setAmount);
  const { data: accountData } = useAccount();
  const balance = accountData?.account.balance ?? null;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const amountField = register('amount');

  // We only allow digits and a single decimal separator (. or ,). 
  // Live filter any other character (letters, symbols, spaces...).
  const sanitizeAmount: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const cleaned = e.target.value
      .replace(/[^\d.,]/g, '')
      .replace(/[.,]/g, (match, offset, full) =>
        full.slice(0, offset).match(/[.,]/) ? '' : match,
      );
    e.target.value = cleaned;
    amountField.onChange(e);
  };

  const onSubmit = ({ amount: raw }: FormValues) => {
    const result = parseAmountToCents(raw);

    if (!result.ok) {
      setError('amount', { message: 'Formato de monto inválido' });
      return;
    }

    const amount = result.value;

    if (!amountIsPositive(amount)) {
      setError('amount', { message: 'El monto debe ser mayor a cero' });
      return;
    }

    if (balance !== null && !balanceIsSufficient(amount, balance)) {
      setError('amount', {
        message: `Saldo insuficiente. Disponible: ${formatMoney(balance)}`,
      });
      return;
    }

    setAmount(amount);
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>¿Cuánto quieres enviar?</h2>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <Input
          id="amount"
          label="Monto"
          placeholder="ej. 150.00"
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...amountField}
          onChange={sanitizeAmount}
        />
        {balance !== null && (
          <p className={styles.balanceHint}>
            Disponible: {formatMoney(balance)}
          </p>
        )}

        <Button type="submit">Continuar</Button>
      </form>
    </div>
  );
}
