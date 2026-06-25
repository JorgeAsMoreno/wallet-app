'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '@/features/auth/schema';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.scss';

export default function LoginPage() {
  const { mutate: login, isPending, isError } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => login(data.identifier);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>💳</div>
          <h1 className={styles.title}>Bienvenido</h1>
          <p className={styles.subtitle}>Ingresa a tu wallet</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            id="identifier"
            label="Teléfono o correo"
            type="text"
            placeholder="ej. +5213121234567 o correo@email.com"
            autoComplete="username"
            error={errors.identifier?.message as string}
            {...register('identifier')}
          />

          {isError && (
            <div className={styles.errorBanner} role="alert">
              Error al iniciar sesión. Intenta de nuevo.
            </div>
          )}

          <Button type="submit" isLoading={isPending}>
            Entrar
          </Button>
        </form>
      </div>
    </main>
  );
}
