import {
  getAllCardStyles,
  getCardTemplateTypes,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CardTemplatesForm from '../CardTemplatesForm';

const NewCardTemplatePage = async () => {
  const [cardStyles, cardTemplateTypes] = await Promise.all([
    getAllCardStyles(),
    getCardTemplateTypes(),
  ]);

  const labels = await getLocalizationMessagesByLocaleAndTarget(
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );

  return (
    <CardTemplatesForm
      cardStyles={cardStyles}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
    />
  );
};

export default NewCardTemplatePage;
