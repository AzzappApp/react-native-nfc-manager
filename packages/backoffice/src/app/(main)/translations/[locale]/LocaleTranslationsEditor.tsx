'use client';
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';
import { Search } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import memoize from 'lodash/memoize';
import { useCallback, useMemo, useOptimistic, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { saveTranslationMessage } from '../translationsActions';
import type { MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import type { BoxProps } from '@mui/material';

type LocaleTranslationsEditorProps = {
  locale: string;
  title: string;
  messagesSet: Array<{
    title: string;
    target: string;
    messages: Record<string, string>;
    defaultMessages: Record<
      string,
      {
        defaultMessage: string;
        description: string;
      }
    >;
  }>;
};

const LocaleTranslationsEditor = ({
  title,
  locale,
  messagesSet,
}: LocaleTranslationsEditorProps) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [filter, setFilter] = useState('');
  const [showUntranslated, setShowUntranslated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'error' | 'success' | null>(
    null,
  );
  const [optimisticMessageSet, addOptimisticMessagesUpdate] = useOptimistic<
    typeof messagesSet,
    [string, string]
  >(messagesSet, (state, [key, value]) => {
    return state.map((set, index) => {
      if (index === selectedTab) {
        return {
          ...set,
          messages: {
            ...set.messages,
            [key]: value,
          },
        };
      }
      return set;
    });
  });

  const { defaultMessages, messages, target } =
    optimisticMessageSet[selectedTab];

  const messageSetInfos = useMemo(
    () =>
      optimisticMessageSet.map(({ defaultMessages, messages }) => {
        const translated = Object.keys(defaultMessages).reduce((acc, key) => {
          return messages[key] ? acc + 1 : acc;
        }, 0);

        const total = Object.keys(defaultMessages).length;

        return {
          translated,
          total,
        };
      }),
    [optimisticMessageSet],
  );

  const filteredMessages = useMemo(
    () =>
      filter || showUntranslated
        ? Object.entries(defaultMessages).filter(
            ([key, { description, defaultMessage }]) => {
              if (showUntranslated && messages[key]) {
                return false;
              }
              const currentMessage = messages[key] || '';
              const lowerCaseFilter = filter.toLowerCase();
              return (
                key.toLowerCase().includes(lowerCaseFilter) ||
                description.toLowerCase().includes(lowerCaseFilter) ||
                defaultMessage.toLowerCase().includes(lowerCaseFilter) ||
                currentMessage.toLowerCase().includes(lowerCaseFilter)
              );
            },
          )
        : Object.entries(defaultMessages),
    [filter, showUntranslated, messages, defaultMessages],
  );

  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: any) => {
      setSelectedTab(parseInt(newValue, 10));
      setFilter('');
    },
    [],
  );

  const onSaveTranslation = useCallback(
    async (key: string, value: string) => {
      addOptimisticMessagesUpdate([key, value]);
      try {
        await saveTranslationMessage({
          key,
          locale,
          target,
          value,
        });
      } catch {
        setSaveStatus('error');
        return;
      }
      setSaveStatus('success');
    },
    [addOptimisticMessagesUpdate, locale, target],
  );

  const selectedTabInfos = messageSetInfos[selectedTab];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Translations: {title}
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          {optimisticMessageSet.map(({ title }, index) => {
            const { translated, total } = messageSetInfos[index];
            return (
              <Tab
                key={index}
                label={title}
                id={`${index}`}
                aria-controls={`${title}`}
                sx={{ color: translated === total ? 'green' : 'red' }}
              />
            );
          })}
        </Tabs>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          mb: 2,
          alignItems: 'center',
          paddingRight: 4,
        }}
      >
        <TextField
          margin="normal"
          name="search"
          label="Search"
          type="text"
          onChange={e => setFilter(e.target.value)}
          value={filter}
          sx={{ mb: 2, width: 500 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={showUntranslated}
              onChange={e => setShowUntranslated(e.target.checked)}
            />
          }
          label="Show untranslated"
        />
        <Typography
          variant="body1"
          sx={{
            flex: 1,
            textAlign: 'right',
            color:
              selectedTabInfos.translated === selectedTabInfos.total
                ? 'green'
                : 'red',
          }}
        >
          {selectedTabInfos.translated}/{selectedTabInfos.total} translated
        </Typography>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }} />
      <Virtuoso
        data={filteredMessages}
        key={selectedTab}
        itemContent={(_, [key, { defaultMessage, description }]) => (
          <KeyEditor
            key={key}
            description={description}
            defaultMessage={defaultMessage}
            message={messages[key]}
            labelKey={key}
            onSave={onSaveTranslation}
          />
        )}
        style={{ flex: 1, paddingTop: 20 }}
      />

      <Snackbar
        open={saveStatus === 'error'}
        onClose={() => setSaveStatus(null)}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error">Failed to save your message</Alert>
      </Snackbar>

      <Snackbar
        open={saveStatus === 'success'}
        onClose={() => setSaveStatus(null)}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">Message saved</Alert>
      </Snackbar>
    </Box>
  );
};

export default LocaleTranslationsEditor;

const KeyEditor = ({
  labelKey,
  defaultMessage,
  message,
  description,
  onSave,
}: {
  labelKey: string;
  defaultMessage: string;
  message: string;
  description: string;
  onSave: (key: string, value: string) => void;
}) => {
  const [value, setValue] = useState(message || '');
  const [validationErrors, setValidationErrors] = useState<
    ICUValidationError[]
  >([]);

  const onFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (!value) {
        setValue(defaultMessage);
      }
      setTimeout(() => {
        e.target.select();
      }, 0);
    },
    [defaultMessage, value],
  );

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationErrors(errors => (errors.length ? [] : errors));
    setValue(e.target.value);
  }, []);

  const onSaveInner = useCallback(() => {
    const errors = validateTranslation(defaultMessage, value);
    setValidationErrors(errors);
    if (!value || errors.some(error => error.type === 'error')) {
      return;
    }
    onSave(labelKey, value);
  }, [defaultMessage, labelKey, onSave, value]);

  const onBlur = useCallback(() => {
    setValidationErrors(validateTranslation(defaultMessage, value));
  }, [defaultMessage, value]);

  const getCharsNumberColor = (diff: number) => {
    if (Math.abs(diff) < 3) {
      return 'black';
    } else if (Math.abs(diff) < 6) {
      return 'orange';
    }

    return 'red';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderBottom: 1,
        borderColor: 'divider',
        paddingTop: 2,
        paddingBottom: 2,
        paddingRight: 4,
      }}
    >
      <Typography variant="h6" component="h2" sx={{ mt: 2 }}>
        {labelKey}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <ICUMessageDisplay value={defaultMessage} />
          <Typography
            variant="body2"
            sx={{ paddingTop: 1 }}
            color={getCharsNumberColor(defaultMessage.length - value.length)}
          >
            {`chars : ${defaultMessage.length}`}
          </Typography>
        </Box>
        <Box sx={{ width: 0, borderLeft: 1, borderColor: 'divider' }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <TextField
            margin="normal"
            name="search"
            label="Value"
            type="text"
            value={value}
            sx={{ flex: 1, m: 0 }}
            multiline
            onFocus={onFocus}
            onChange={onChange}
            onBlur={onBlur}
          />
          <Typography
            variant="body2"
            sx={{ paddingTop: 1 }}
            color={getCharsNumberColor(defaultMessage.length - value.length)}
          >
            {`chars : ${value.length}`}
          </Typography>
        </Box>
      </Box>
      <Button
        variant="contained"
        sx={{ alignSelf: 'flex-end' }}
        type="submit"
        onClick={onSaveInner}
        disabled={
          !value || validationErrors.some(error => error.type === 'error')
        }
      >
        Save
      </Button>
      <Box sx={{ mt: 2, minHeight: 30 }}>
        {validationErrors.map((error, index) => (
          <Typography
            key={index}
            sx={{ color: error.type === 'error' ? 'red' : 'orange' }}
          >
            {error.message}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

type ICUMessageDisplayProps = BoxProps<'div'> & {
  value: string;
};

// Exemple d'utilisation
const ICUMessageDisplay = ({
  value,
  sx = [],
  ...props
}: ICUMessageDisplayProps) => {
  const parsed = memoizeParse(value, { captureLocation: true });

  return (
    <Box
      sx={[
        {
          border: 1,
          borderColor: 'lightgrey',
          padding: 2,
          borderRadius: 1,
          backgroundColor: '#f9f9f9',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {parsed.map((element, index) => {
        const elementValue = element.location
          ? value.slice(
              element.location.start.offset,
              element.location.end.offset,
            )
          : 'value' in element
            ? element.value
            : '#';
        if (element.type === TYPE.literal) {
          return <span key={index}>{elementValue}</span>;
        }
        return (
          <span key={index} style={{ color: 'blue' }}>
            {elementValue}
          </span>
        );
      })}
    </Box>
  );
};

const memoizeParse = memoize(parse);

type ICUValidationError = {
  type: 'error' | 'warning';
  message: string;
  variable?: string;
  expectedType?: string;
  foundType?: string;
};

function getICUVariables(ast: MessageFormatElement[]): Set<string> {
  const variables = new Set<string>();

  const visit = (node: MessageFormatElement) => {
    switch (node.type) {
      case TYPE.argument:
      case TYPE.number:
      case TYPE.date:
      case TYPE.time:
      case TYPE.select:
      case TYPE.plural:
        variables.add(node.value);
        break;
    }
    if ('options' in node && node.options) {
      Object.values(node.options).forEach(option =>
        option.value.forEach(visit),
      );
    }
    if ('children' in node && node.children) {
      node.children.forEach(visit);
    }
  };

  ast.forEach(visit);
  return variables;
}

function validateTranslation(
  originalMessage: string,
  translatedMessage: string,
): ICUValidationError[] {
  const issues: ICUValidationError[] = [];

  try {
    const originalAST = parse(originalMessage);
    const translatedAST = parse(translatedMessage);

    const originalVariables = getICUVariables(originalAST);
    const translatedVariables = getICUVariables(translatedAST);

    // Check if all original variables are in the translation
    originalVariables.forEach(variable => {
      if (!translatedVariables.has(variable)) {
        issues.push({
          type: 'error',
          message: `Missing variable "${variable}" in translation.`,
          variable,
        });
      }
    });

    // Check if translation adds new variables
    translatedVariables.forEach(variable => {
      if (!originalVariables.has(variable)) {
        issues.push({
          type: 'error',
          message: `Translation adds a new variable "${variable}" which is not in the original message.`,
          variable,
        });
      }
    });

    // Check for double spaces
    if (translatedMessage.includes('  ')) {
      issues.push({
        type: 'warning',
        message: 'The translation contains double spaces.',
      });
    }

    // Check for leading or trailing spaces
    if (translatedMessage !== translatedMessage.trim()) {
      issues.push({
        type: 'warning',
        message: 'The translation contains leading or trailing spaces.',
      });
    }

    return issues;
  } catch (error) {
    issues.push({
      type: 'error',
      message: 'Error parsing messages: ' + (error as Error).message,
    });
    return issues;
  }
}
