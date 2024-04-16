import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import cx from 'classnames';
import { useFormState, useFormStatus } from 'react-dom';
import { SuccessIcon } from '#assets';
import { processShareBackSubmission } from '#app/actions/shareBackAction';
import Button from '#ui/Button';
import FormInput from '#ui/Form/FormInput';
import { ShareBackFormSchema } from './shareBackFormSchema';
import styles from './ShareBackModalForm.css';

type ShareBackModalContentProps = {
  token: string;
  userId: string;
};

const ShareBackModalForm = (props: ShareBackModalContentProps) => {
  const { token, userId } = props;

  const shareBackActionWithUserIdAndToken = processShareBackSubmission.bind(
    null,
    userId,
    token,
  );

  const [lastResult, action] = useFormState(
    shareBackActionWithUserIdAndToken,
    undefined,
  );

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      const isValid = parseWithZod(formData, { schema: ShareBackFormSchema });
      return isValid;
    },
    shouldValidate: 'onSubmit',
    shouldRevalidate: 'onSubmit',
  });

  return (
    <div className={styles.content}>
      {
        <div
          className={cx(
            styles.formFieldError,
            (form.errors?.length ?? 0) > 0 && !form.dirty
              ? styles.formHasErrors
              : '',
          )}
        >
          {form.errors}
        </div>
      }
      <form
        {...getFormProps(form)}
        id={form.id}
        onSubmit={form.onSubmit}
        className={styles.form}
        action={action}
      >
        <div className={styles.formFields}>
          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.firstName, { type: 'text' })}
              id={fields.firstName.id}
              key={fields.firstName.id}
              className={styles.formInput}
              placeholder="Enter your firstname"
              withLabel
              labelText="First Name"
            />
          </div>

          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.lastName, { type: 'text' })}
              key={fields.lastName.id}
              className={styles.formInput}
              placeholder="Enter your lastname"
              withLabel
              labelText="Last Name"
            />
          </div>
          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.title, { type: 'text' })}
              key={fields.title.id}
              className={styles.formInput}
              placeholder="Enter your title"
              withLabel
              labelText="Title"
            />
          </div>
          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.company, { type: 'text' })}
              key={fields.company.id}
              className={styles.formInput}
              placeholder="Enter your company name"
              withLabel
              labelText="Company"
            />
          </div>
          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.phone, { type: 'text' })}
              key={fields.phone.id}
              className={styles.formInput}
              placeholder="Enter your number"
              withLabel
              labelText="Phone"
            />
          </div>
          <div className={styles.formField}>
            <FormInput
              {...getInputProps(fields.email, { type: 'text' })}
              key={fields.email.id}
              className={styles.formInput}
              placeholder="Enter your email address"
              withLabel
              labelText="Email"
            />
          </div>
        </div>
        <ShareBackFormSubmitButton
          isDirty={form.dirty}
          hasErrors={(form.errors?.length ?? 0) > 0}
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

  return (
    <Button
      loading={pending}
      type="submit"
      variant="primary"
      disabled={pending || isSuccess || hasErrors || !isDirty}
      className={cx(
        styles.formButton,
        !isSuccess ? styles.formButtonSuccess : '',
      )}
    >
      <span
        className={cx(
          styles.formButtonLabel,
          isSuccess ? styles.formButtonSuccess : '',
        )}
      >
        Send
      </span>
      <div
        className={cx(
          styles.formButtonSuccessContainer,
          isSuccess ? styles.formButtonSuccess : '',
        )}
      >
        <SuccessIcon
          className={cx(
            styles.formButtonSuccessSvg,
            isSuccess ? styles.formButtonSuccess : '',
          )}
        />
      </div>
    </Button>
  );
};

export default ShareBackModalForm;
