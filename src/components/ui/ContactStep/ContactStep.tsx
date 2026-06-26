import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import styles from './ContactStep.module.scss';
import { useState } from 'react';
import { useTransferStore, WIZARD_STEP } from '@/features/transactions/store/transferStore';
import { useContacts, useCreateContact } from '@/features/transactions/hooks/useContacts';
import { newContactSchema, NewContactValues } from '@/features/transactions/schema';
import { Contact } from '@/features/transactions/domain/types';

export function ContactStep() {
  const [showNewForm, setShowNewForm] = useState(false);
  const setRecipient = useTransferStore((s) => s.setRecipient);
  const goTo = useTransferStore((s) => s.goTo);

  const { data, isLoading } = useContacts();
  const { mutate: createContact, isPending } = useCreateContact();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewContactValues>({ resolver: zodResolver(newContactSchema) });

  const handleSelectContact = (contact: Contact) => {
    setRecipient(contact);
  };

  const onNewContact = (values: NewContactValues) => {
    createContact(values, {
      onSuccess: ({ contact }) => {
        setRecipient(contact);
        reset();
      },
    });
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.backButton} onClick={() => goTo(WIZARD_STEP.Amount)}>
        ← Volver
      </button>

      <h2 className={styles.title}>¿A quién le envías?</h2>

      {isLoading && (
        <div className={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="3.5rem" />
          ))}
        </div>
      )}

      {!isLoading && !showNewForm && (
        <>
          <div className={styles.list}>
            {data?.contacts.map((contact) => (
              <button
                key={contact.id}
                className={styles.contactItem}
                onClick={() => handleSelectContact(contact)}
              >
                <div className={styles.avatar}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.contactInfo}>
                  <span className={styles.contactName}>{contact.name}</span>
                  <span className={styles.contactId}>{contact.identifier}</span>
                </div>
              </button>
            ))}
          </div>

          <div className={styles.divider}>o</div>

          <Button variant="secondary" onClick={() => setShowNewForm(true)}>
            Nuevo contacto
          </Button>
        </>
      )}

      {showNewForm && (
        <form
          className={styles.newContactForm}
          onSubmit={handleSubmit(onNewContact)}
        >
          <Input
            id="name"
            label="Nombre"
            placeholder="ej. Ana García"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            id="identifier"
            label="Teléfono, correo o CLABE"
            placeholder="ej. +5213121234567"
            error={errors.identifier?.message}
            {...register('identifier')}
          />

          <Button type="submit" isLoading={isPending}>
            Guardar y continuar
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setShowNewForm(false)}
          >
            Cancelar
          </Button>
        </form>
      )}
    </div>
  );
}
