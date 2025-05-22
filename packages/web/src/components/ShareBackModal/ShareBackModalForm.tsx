import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { sendGAEvent } from '@next/third-parties/google';
import cx from 'classnames';
import { useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { CheckRoundIcon } from '#assets';
import { processShareBackSubmission } from '#app/actions/shareBackAction';
import Loader from '#components/Loader';
import Button from '#ui/Button';
import FormInput from '#ui/Form/FormInput';
import PhoneInput from './PhoneInput';
import { ShareBackFormSchema } from './shareBackFormSchema';
import styles from './ShareBackModalForm.css';

type ShareBackModalContentProps = {
  token: string;
  userId: string;
  webcardId: string;
  onSuccess: () => void;
};

const ShareBackModalForm = (props: ShareBackModalContentProps) => {
  const { token, userId, webcardId, onSuccess } = props;

  const shareBackActionWithUserIdAndToken = processShareBackSubmission.bind(
    null,
    userId,
    webcardId,
    token,
  );

  const refs = {
    lastname: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    company: useRef<HTMLInputElement>(null),
    title: useRef<HTMLInputElement>(null),
  };

  const [lastResult, action] = useActionState(
    shareBackActionWithUserIdAndToken,
    undefined,
  );

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      const isValid = parseWithZod(formData, {
        schema: ShareBackFormSchema,
      });
      return isValid;
    },
    shouldValidate: 'onSubmit',
    shouldRevalidate: 'onInput',
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (lastResult?.status === 'success') {
      sendGAEvent('event', 'download_vcard', {
        event_category: 'Form',
        event_label: 'ShareBackForm',
        value: 'Submit',
      });
      timeout = setTimeout(() => {
        onSuccess();
      }, 2000);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [lastResult?.status, onSuccess]);

  const intl = useIntl();

  return (
    <div className={styles.content}>
      <div
        className={cx(
          styles.formFieldError,
          (form.errors?.length ?? 0) > 0 ? styles.formHasErrors : '',
        )}
      >
        {form.errors}
      </div>
      <form
        {...getFormProps(form)}
        id={form.id}
        onSubmit={form.onSubmit}
        className={styles.form}
        action={action}
        style={{ maxHeight: window.innerHeight * 0.6 }}
      >
        <div className={styles.formFields}>
          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.firstName, { type: 'text' })}
              className={styles.formInput}
              placeholder={intl.formatMessage({
                defaultMessage: 'Enter your firstName',
                id: 'gwABd7',
                description: 'Enter your firstName placeholder',
              })}
              withLabel
              labelText={intl.formatMessage({
                defaultMessage: 'First Name',
                id: 'v7tRnI',
                description: 'First Name label',
              })}
              inputMode="text"
              enterKeyHint="next"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  refs.lastname.current?.focus();
                }
              }}
              autoComplete="given-name"
            />
          </div>

          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.lastName, { type: 'text' })}
              className={styles.formInput}
              placeholder={intl.formatMessage({
                defaultMessage: 'Enter your lastName',
                id: 'EXZ52x',
                description: 'Enter your lastName placeholder',
              })}
              withLabel
              labelText={intl.formatMessage({
                defaultMessage: 'Last Name',
                id: 'A5iAGb',
                description: 'Last Name label',
              })}
              ref={refs.lastname}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  refs.phone.current?.focus();
                }
              }}
              autoComplete="family-name"
            />
          </div>
          <div className={styles.formField}>
            <PhoneInput
              field={fields.phone}
              className={styles.formInput}
              placeholder={intl.formatMessage({
                defaultMessage: 'Enter your number',
                id: 'kj0dVs',
                description: 'Enter your phone number placeholder',
              })}
              withLabel
              labelText={intl.formatMessage({
                defaultMessage: 'Phone',
                id: 'tZyK9Z',
                description: 'Phone label',
              })}
              ref={refs.phone}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  refs.email.current?.focus();
                }
              }}
              autoComplete="tel"
            />
          </div>
          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.email, { type: 'text' })}
              className={styles.formInput}
              placeholder={intl.formatMessage({
                defaultMessage: 'Enter your email address',
                id: 'zHfOL+',
                description: 'Enter your email placeholder',
              })}
              withLabel
              labelText={intl.formatMessage({
                defaultMessage: 'Email',
                id: 'pf0OWK',
                description: 'Email label',
              })}
              ref={refs.email}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  refs.company.current?.focus();
                }
              }}
              inputMode="email"
              autoComplete="email"
            />
          </div>
          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.company, { type: 'text' })}
              className={styles.formInput}
              placeholder={intl.formatMessage({
                defaultMessage: 'Enter your company name',
                id: 'RLIWP8',
                description: 'Enter your company name placeholder',
              })}
              withLabel
              labelText={intl.formatMessage({
                defaultMessage: 'Company',
                id: 'tZcw8b',
                description: 'Company label',
              })}
              ref={refs.company}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  refs.title.current?.focus();
                }
              }}
              autoComplete="organization"
            />
          </div>
          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.title, { type: 'text' })}
              className={styles.formInput}
              placeholder={intl.formatMessage({
                defaultMessage: 'Enter your title',
                id: 'vl4cm6',
                description: 'Enter your title placeholder',
              })}
              withLabel
              labelText={intl.formatMessage({
                defaultMessage: 'Title',
                id: 'LrvwcI',
                description: 'Title label',
              })}
              ref={refs.title}
              autoComplete="organization-title"
            />
          </div>
        </div>
        <ShareBackFormSubmitButton
          isDirty={form.dirty}
          hasErrors={
            (form.errors?.length ?? 0) > 0 ||
            (!fields.firstName.value &&
              !fields.lastName.value &&
              !fields.company.value)
          }
          isSuccess={lastResult?.status === 'success'}
        />
      </form>
    </div>
  );
};

type ShareBackFormSubmitButtonProps = {
  isDirty: boolean;
  isSuccess: boolean;
  hasErrors: boolean;
};
const ShareBackFormSubmitButton = ({
  isDirty,
  isSuccess,
  hasErrors,
}: ShareBackFormSubmitButtonProps) => {
  const { pending } = useFormStatus();

  const disabled = pending || hasErrors || !isDirty;

  return (
    <div className={styles.formButtonContainer}>
      <Button
        loading={pending}
        type="submit"
        variant="primary"
        disabled={disabled || isSuccess}
        className={cx(
          styles.formButton,
          !isSuccess ? styles.formButtonSuccess : '',
          disabled ? styles.formButtonDisabled : '',
        )}
      >
        {pending ? (
          <Loader />
        ) : (
          <>
            {!isSuccess && (
              <span className={cx(styles.formButtonLabel)}>
                <FormattedMessage
                  defaultMessage="Send"
                  id="Gm+qSm"
                  description="Share back - Send button label"
                />
              </span>
            )}
            <div
              className={cx(
                styles.formButtonSuccessContainer,
                isSuccess ? styles.formButtonSuccess : '',
              )}
            >
              <CheckRoundIcon
                className={cx(
                  styles.formButtonSuccessSvg,
                  isSuccess ? styles.formButtonSuccess : '',
                )}
              />
            </div>
          </>
        )}
      </Button>
    </div>
  );
};

export default ShareBackModalForm;
