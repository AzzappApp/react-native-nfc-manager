import type { LineDividerOrientation } from '@azzapp/relay/artifacts/LineDividerRenderer_module.graphql';

export type LineDividerEditionValue = {
  orientation?: LineDividerOrientation;
  marginBottom?: number;
  marginTop?: number;
  height?: number;
  colorTop?: string;
  colorBottom?: string;
};
