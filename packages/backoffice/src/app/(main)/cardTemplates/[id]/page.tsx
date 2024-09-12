import { notFound } from 'next/navigation';
import {
  getAllCardStyles,
  getCardTemplateById,
  getCardTemplateTypes,
  getLocalizationMessagesByLocaleAndTarget,
} from '@azzapp/data';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import CardTemplatesForm from '../CardTemplatesForm';

type CardTemplatePageProps = {
  params: {
    id: string;
  };
};

const CardTemplatePage = async (props: CardTemplatePageProps) => {
  const { params } = props;

  const [cardStyles, template, allCardTemplateTypes] = await Promise.all([
    getAllCardStyles(),
    getCardTemplateById(params.id),
    getCardTemplateTypes(false),
  ]);

  if (!template) {
    return notFound();
  }

  const cardTemplateTypes = allCardTemplateTypes.filter(
    type => type.enabled || type.id === template.cardTemplateTypeId,
  );

  const labels = await getLocalizationMessagesByLocaleAndTarget(
    DEFAULT_LOCALE,
    ENTITY_TARGET,
  );

  return (
    <CardTemplatesForm
      cardStyles={cardStyles}
      cardTemplate={template}
      cardTemplateTypes={cardTemplateTypes}
      labels={labels}
    />
  );
};

export default CardTemplatePage;
