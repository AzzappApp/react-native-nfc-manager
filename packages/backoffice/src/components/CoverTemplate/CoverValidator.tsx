import { COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { isValidHex } from '@azzapp/shared/stringHelpers';

export const validateFormCover = async (
  values: any,
  imageDimension: { width: number; height: number } | undefined,
  imagePreviewDimension: { width: number; height: number } | undefined,
) => {
  let errors = { data: {} } as any;
  //this will be a quick n dirty validation form
  const isSourceMediaNull =
    values.data.sourceMedia == null ||
    values.data.sourceMedia?.id === undefined; //case when we have a asset demo

  const isPreviewMediaNull = values.previewMediaId == null;

  // Suggested template should be business only
  if (values.suggested && values.kind !== 'business') {
    errors.kind = 'A suggested template should be business only';
  }

  // Not Suggested template should not have sourceMedia
  if (!values.suggested && !isSourceMediaNull) {
    errors.data.sourceMedia = {
      id: 'Cover Image is reserved for Suggested Template',
    };
  }

  // Not Suggested template should not have previewMeida
  if (!values.suggested && !isPreviewMediaNull) {
    errors.previewMediaId = 'Preview Image is reserved for Suggested Template';
  }

  if (values.suggested) {
    if (isSourceMediaNull) {
      errors.data.sourceMedia = { id: 'Image is required' };
    }
    if (values.previewMediaId == null) {
      errors.previewMediaId = { id: 'Preview Image is required' };
    }
  }

  // Cover Media should respect the Cover Aspect Ratio
  if (imageDimension && imageDimension.width !== 0) {
    const ratio = imageDimension.width / imageDimension.height;
    if (ratio !== COVER_RATIO) {
      errors.data.sourceMedia = {
        id: `Image ratio is not respected, should be ${COVER_RATIO}`,
      };
    }
  }

  // preview Media should respect the Cover Aspect Ratio
  if (imagePreviewDimension && imagePreviewDimension.width !== 0) {
    const ratio = imagePreviewDimension.width / imagePreviewDimension.height;
    if (ratio !== COVER_RATIO) {
      errors.previewMediaId = `Image ratio is not respected, should be ${COVER_RATIO}`;
    }
  }

  if (values.category?.en == null) {
    errors.category = { en: 'Category is required' };
  }

  if (values.category?.length > 0) {
    const enCategory = values.category.find((c: any) => c.lang === 'en');
    if (enCategory == null) {
      errors.category = 'English Category is Required - code en';
    }
  }

  if (values.data.backgroundId != null) {
    let bgErrors = {} as any;
    if (values.data.backgroundStyle == null) {
      bgErrors = {
        backgroundColor: 'BackgroundColor is Required',
        patternColor: 'PatternColor is Required',
      };
    } else {
      if (values.data.backgroundStyle.backgroundColor == null) {
        bgErrors.backgroundColor = 'BackgroundColor is Required';
      } else if (
        !isValidHex(values.data.backgroundStyle.backgroundColor, false)
      ) {
        bgErrors.backgroundColor = 'Invalid Hex Color';
      }
      if (values.data.backgroundStyle.patternColor == null) {
        bgErrors.patternColor = 'PatternColor is Required';
      } else if (!isValidHex(values.data.backgroundStyle.patternColor, false)) {
        bgErrors.patternColor = 'Invalid Hex Color';
      }
    }

    if (Object.keys(bgErrors).length > 0) {
      errors = {
        ...errors,
        data: { ...errors.data, backgroundStyle: bgErrors },
      };
    }
  }
  if (values.data.foregroundId != null) {
    let fgErrors = {} as any;
    if (values.data.foregroundStyle == null) {
      fgErrors = {
        color: 'Foreground color is Required',
      };
    } else if (values.data.foregroundStyle.color == null) {
      fgErrors.color = 'BackgroundColor is Required';
    } else if (!isValidHex(values.data.foregroundStyle.color, false)) {
      fgErrors.color = 'Invalid Hex Color';
    }

    if (Object.keys(fgErrors).length > 0) {
      errors = {
        ...errors,
        data: { ...errors.data, foregroundStyle: fgErrors },
      };
    }
  }
  if (values.data.title) {
    if (values.data.titleStyle == null) {
      errors.data.titleStyle = {
        fontFamily: 'FontFamily is Required',
        fontSize: 'FontSize is Required',
        color: 'Color is Required',
      };
    } else {
      const titleErrors = {} as any;
      if (values.data.titleStyle.fontFamily == null) {
        titleErrors.fontFamily = 'FontFamily is Required';
      }
      if (values.data.titleStyle.fontSize == null) {
        titleErrors.fontSize = 'FontSize is Required';
      }
      if (values.data.titleStyle.color == null) {
        titleErrors.color = 'Color is Required';
      } else if (!isValidHex(values.data.titleStyle.color, false)) {
        titleErrors.color = 'Invalid Hex Color';
      }
      if (Object.keys(titleErrors).length > 0) {
        errors = {
          ...errors,
          data: { ...errors.data, titleStyle: titleErrors },
        };
      }
    }
  }
  if (values.data.subTitle) {
    if (values.data.subTitleStyle == null) {
      errors.data.subTitleStyle = {
        fontFamily: 'FontFamily is Required',
        fontSize: 'FontSize is Required',
        color: 'Color is Required',
      };
    } else {
      const subtitleErrors = {} as any;
      if (values.data.subTitleStyle.fontFamily == null) {
        subtitleErrors.fontFamily = 'FontFamily is Required';
      }
      if (values.data.subTitleStyle.fontSize == null) {
        subtitleErrors.fontSize = 'FontSize is Required';
      }
      if (values.data.subTitleStyle.color == null) {
        subtitleErrors.color = 'Color is Required';
      } else if (!isValidHex(values.data.subTitleStyle.color, false)) {
        subtitleErrors.color = 'Invalid Hex Color';
      }
      if (Object.keys(subtitleErrors).length > 0) {
        errors = {
          ...errors,
          data: { ...errors.data, subTitleStyle: subtitleErrors },
        };
      }
    }
  }
  if (!values.name) {
    errors.name = 'Name is Required';
  }

  return errors;
};
