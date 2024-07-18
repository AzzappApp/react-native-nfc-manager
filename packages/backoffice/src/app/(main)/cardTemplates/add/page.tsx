import {
  CardStyleTable,
  CardTemplateTypeTable,
  db,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CardTemplatesForm from '../CardTemplatesForm';

const NewCardTemplatePage = async () => {
  const cardStyles = await db.select().from(CardStyleTable);
  const cardTemplateTypes = await db.select().from(CardTemplateTypeTable);

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
