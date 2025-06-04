import { Stack } from '@mui/material';
import { getTermsOfUse } from '@azzapp/data';
import AddForm from './AddForm';
import TermsOfUseList from './TermsOfUseList';
import type { TermsOfUse } from '@azzapp/data';

const TermsOfUse = async () => {
  const termsOfUse: TermsOfUse[] = await getTermsOfUse();

  return (
    <Stack spacing={5}>
      <AddForm />
      <TermsOfUseList termsOfUse={termsOfUse} />
    </Stack>
  );
};

export default TermsOfUse;
