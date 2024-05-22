import {
  Canvas,
  Paragraph as SkiaParagraph,
  Rect,
  Matrix4,
  useCanvasRef,
  Skia,
} from '@shopify/react-native-skia';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { makeMutable } from 'react-native-reanimated';
import { colors } from '#theme';
import { GestureHandler } from './GestureHandler';
import type { ResizeAxis, ResizeHandleAxis } from './type';
import type { SkParagraph } from '@shopify/react-native-skia';

type LayerEditorProps = {
  width: number;
  height: number;
  overlayMediaUri?: string;
  /** TODO: BEGIN Update these methods according to real cases */
  onCrop?: () => void;
  onDelete?: () => void;
  onRotation?: () => void;
  onScale?: () => void;
  onDrag?: () => void;
  /** /END TODO */
  // This method is used to update the workspace height Paragraph according to the new width of the element
  onResize?: (axis: ResizeAxis, value: number) => void;
};

const SimpleRectSize = { width: 200, height: 50 };
const SimpleRectDimensions = {
  x: 0,
  y: 0,
  width: SimpleRectSize.width,
  height: SimpleRectSize.height,
};

// TODO: use it for example (element from db, storage, context ....)
const elementsForExample = [
  {
    id: '1',
    matrix: makeMutable(Matrix4()),
    type: 'text',
    content: 'Simple text for example',
    dimensions: { ...SimpleRectDimensions, height: 75 },
    resizeAxis: ['x'] as ResizeHandleAxis,
    workspaceWidth: makeMutable(SimpleRectSize.width),
    workspaceHeight: makeMutable(75),
  },
  {
    id: '2',
    matrix: makeMutable(Matrix4()),
    type: 'overlay',
    content: 'img',
    dimensions: { ...SimpleRectDimensions },
    resizeAxis: ['x', 'y'] as ResizeHandleAxis,
    workspaceWidth: makeMutable(SimpleRectSize.width),
    workspaceHeight: makeMutable(SimpleRectSize.height),
  },
  {
    id: '3',
    matrix: makeMutable(Matrix4()),
    type: 'text',
    content: 'Another text',
    dimensions: { ...SimpleRectDimensions, height: 50 },
    resizeAxis: ['x'] as ResizeHandleAxis,
    workspaceWidth: makeMutable(SimpleRectSize.width),
    workspaceHeight: makeMutable(50),
  },
];

const LayerEditor: React.FC<LayerEditorProps> = ({
  width,
  height,
  onResize,
  onCrop,
  onDelete,
  onRotation,
  onScale,
  onDrag,
}) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const paragraphs = useMemo<Array<{ id: string; paragraph: SkParagraph }>>(
    () =>
      elementsForExample
        .filter(element => element.type === 'text')
        .map(element => {
          const p = Skia.ParagraphBuilder.Make()
            .pushStyle({
              fontSize: 32,
              fontFamilies: ['Helvetica', 'serif'],
              color: Skia.Color(colors.black),
            })
            .addText(element.content)
            .build();

          p.layout(element.workspaceWidth.value);

          return {
            id: element.id,
            paragraph: p,
          };
        }),
    [],
  );

  const canvasRef = useCanvasRef();

  // handle resize to update paragraph layout according to new width
  const handleOnResize = useCallback(
    (axis: ResizeAxis, value: number) => {
      const elementP = paragraphs.find(
        elementP => elementP.id === selectedElement,
      );

      if (elementP) {
        elementP.paragraph.layout(value);
      }

      const element = elementsForExample.find(
        element => element.id === selectedElement,
      );

      if (element) {
        element.workspaceHeight.value =
          elementP?.paragraph.getHeight() || element.workspaceHeight.value;
      }

      onResize?.(axis, value);
    },
    [paragraphs, onResize, selectedElement],
  );

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: colors.grey100,
      }}
    >
      <Canvas style={{ flex: 1 }} ref={canvasRef}>
        {elementsForExample.map(element => {
          return element.type === 'text' ? (
            <SkiaParagraph
              key={`LayerElement_${element.id}`}
              paragraph={
                paragraphs.find(elementP => elementP.id === element.id)
                  ?.paragraph as SkParagraph
              }
              matrix={element.matrix}
              width={element.workspaceWidth}
              x={0}
              y={0}
            />
          ) : (
            <Rect
              key={`LayerElement_${element.id}`}
              color={colors.grey300}
              matrix={element.matrix}
              width={element.workspaceWidth}
              height={element.workspaceHeight}
              x={0}
              y={0}
            />
          );
        })}
      </Canvas>

      {elementsForExample.map(element => (
        <GestureHandler
          key={`GestureHandler_${element.id}`}
          isSelected={selectedElement === element.id}
          matrix={element.matrix}
          dimensions={element.dimensions}
          limits={{ width, height }}
          onSelect={() => setSelectedElement(element.id)}
          workspace={{
            width: element.workspaceWidth,
            height: element.workspaceHeight,
          }}
          resizeAxis={element.resizeAxis}
          onResize={handleOnResize}
          onCrop={onCrop}
          onDelete={onDelete}
          onRotation={onRotation}
          onScale={onScale}
          onDrag={onDrag}
        />
      ))}
    </View>
  );
};

export default LayerEditor;
