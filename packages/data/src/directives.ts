import { MapperKind, mapSchema } from '@graphql-tools/utils';
import { type GraphQLSchema, GraphQLError } from 'graphql';

function maxValue(
  directiveName: string,
): (schema: GraphQLSchema) => GraphQLSchema {
  return schema =>
    mapSchema(schema, {
      [MapperKind.OBJECT_FIELD]: fieldConfig => {
        if (fieldConfig.args != null) {
          let max: number | undefined = undefined;
          for (const [, field] of Object.entries(fieldConfig.args)) {
            const _node = field.astNode?.directives?.find(
              directive => directive.name.value === directiveName,
            );

            const value = _node?.arguments?.find(
              name => name.name.value === 'value',
            )?.value;

            if (value?.kind === 'IntValue') {
              max = parseInt(value.value, 10);
            }
          }

          const defaultResolve = fieldConfig.resolve;

          if (max) {
            fieldConfig.resolve = (root, args, context, info) => {
              if (typeof max === 'number') {
                if (
                  Object.entries(args).some(
                    ([, value]) => typeof value === 'number' && value > max!,
                  )
                ) {
                  throw new GraphQLError(
                    `Argument ${JSON.stringify(args)} value is greater than max ${max}`,
                  );
                }
              }

              return defaultResolve?.(root, args, context, info);
            };
          }
        }

        return fieldConfig;
      },
    });
}

export const directivesTypeDefs = `
   directive @max(value: Int!) on ARGUMENT_DEFINITION
`;

export const applyDirectiveSchemaTransform = maxValue('max');
