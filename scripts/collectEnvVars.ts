import fs from 'fs';
import path from 'path';
import { ZodDefault, ZodOptional, ZodNullable, ZodEffects } from 'zod';
import type { ZodTypeAny } from 'zod';

export function getAppDependencies(appPath: string): string[] {
  const pkgJson = JSON.parse(
    fs.readFileSync(path.join(appPath, 'package.json'), 'utf-8'),
  );
  return Object.keys({
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
  });
}

// La liste des apps à analyser
const appName = process.argv[2]; // ex: "web"
const appPath = path.resolve(__dirname, `../packages/${appName}`);

// Les packages internes utilisés
const deps = getAppDependencies(appPath).filter(
  name =>
    name.startsWith('@azzapp') &&
    fs.existsSync(
      path.resolve(__dirname, `../packages/${name.replace('@azzapp/', '')}`),
    ) &&
    name !== '@azzapp/i18n',
);

// On inclut aussi l’app elle-même
const modulesToCheck = [`${appPath}/src/env`, ...deps.map(d => `${d}/env`)];

type UnwrappedResult = {
  baseType: ZodTypeAny;
  description?: string;
  defaultValue?: unknown;
};

function unwrapZodType(type: ZodTypeAny): UnwrappedResult {
  let current = type;
  let description: string | undefined;
  let defaultValue: unknown;

  while (true) {
    if (current._def?.description) {
      description = current._def.description;
    }

    if (current instanceof ZodDefault) {
      if (defaultValue === undefined) {
        try {
          defaultValue = current._def.defaultValue();
        } catch (e) {
          console.log(e);
        }
      }
      current = current._def.innerType;
      continue;
    }

    if (current instanceof ZodOptional || current instanceof ZodNullable) {
      current = current._def.innerType;
      continue;
    }

    if (current instanceof ZodEffects) {
      current = current._def.schema;
      continue;
    }

    break;
  }

  return {
    baseType: current,
    description,
    defaultValue,
  };
}

function getDefaultValue(zodDefault: ZodDefault<any>) {
  try {
    return zodDefault._def.defaultValue();
  } catch {
    return undefined;
  }
}

async function extractKeys() {
  const result: Array<{
    key: string;
    description?: string;
    defaultValue?: string;
  }> = [];

  for (const modulePath of modulesToCheck) {
    try {
      const mod = await import(modulePath);
      const schema = mod?.default?.schema ?? mod?.schema;

      if (!schema || typeof schema.parse !== 'function') {
        throw new Error(
          `No schema found in ${modulePath}. Please check the module export.`,
        );
      }

      const shape = schema._def.shape(); // pour zod.object()
      for (const [key, type] of Object.entries(shape)) {
        const baseType = unwrapZodType(type as ZodTypeAny);
        const description = baseType.description;
        const defaultValue =
          type instanceof ZodDefault ? getDefaultValue(type) : undefined;

        result.push({ key, description, defaultValue });
      }
    } catch (e) {
      console.warn(`Erreur import ${modulePath}`, e);
    }
  }

  console.log(`🌍 Variables utilisées par l’app "${appName}":`);
  result
    .sort((a, b) => a.key.localeCompare(b.key))
    .forEach(({ key, description, defaultValue }) => {
      console.log(
        `- ${key}` +
          (description ? `: ${description}` : '') +
          (defaultValue !== undefined ? ` (default: ${defaultValue})` : ''),
      );
    });
}

extractKeys();
