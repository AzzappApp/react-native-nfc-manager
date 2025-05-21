import type { IntlShape } from 'react-intl';

export const getDisplayedDuration = (
  {
    startDate,
    endDate,
  }: {
    startDate?: string | null;
    endDate?: string | null;
  },
  intl: IntlShape,
) => {
  const yearStart = startDate
    ? new Date(Date.parse(startDate)).getFullYear()
    : undefined;

  const yearEnd = endDate
    ? new Date(Date.parse(endDate)).getFullYear()
    : undefined;

  const displayedYear =
    yearStart === undefined
      ? undefined
      : yearStart === yearEnd
        ? yearStart
        : `${yearStart}-${
            yearEnd
              ? yearEnd
              : intl.formatMessage({
                  defaultMessage: 'Present',
                  description: 'ContactDetailsProfessionalExperience - Present',
                })
          }`;
  return displayedYear;
};
