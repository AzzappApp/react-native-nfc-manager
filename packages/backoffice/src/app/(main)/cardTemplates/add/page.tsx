import {
  getAllCardStyles,
  getCardTemplateTypes,
  getLocalizationMessagesByLocale,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import CardTemplatesForm from '../CardTemplatesForm';

const NewCardTemplatePage = async () => {
  const [cardStyles, cardTemplateTypes] = await Promise.all([
    getAllCardStyles(),
    getCardTemplateTypes(),
  ]);

  const labels = await getLocalizationMessagesByLocale(DEFAULT_LOCALE);

  return (
    <CardTemplatesForm
      cardStyles={cardStyles}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
    />
  );
};

export default NewCardTemplatePage;
