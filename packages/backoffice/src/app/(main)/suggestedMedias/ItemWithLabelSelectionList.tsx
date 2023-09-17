import {
  Box,
  Checkbox,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

const ItemWithLabelSelectionList = ({
  label,
  options,
  selectedOptions,
  onChange,
}: {
  label: string;
  options: Array<{ id: string; labels: Record<string, string> }>;
  selectedOptions: Set<string>;
  onChange: (selectedOptions: Set<string>) => void;
}) => {
  const handleToggle = (value: string) => () => {
    const newSelectedOptions = new Set(selectedOptions);
    if (selectedOptions.has(value)) {
      newSelectedOptions.delete(value);
    } else {
      newSelectedOptions.add(value);
    }
    onChange(newSelectedOptions);
  };
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      <InputLabel>{label}</InputLabel>
      <List
        dense
        component="div"
        role="list"
        sx={{
          flex: 1,
          overflow: 'auto',
        }}
      >
        {options.map(({ id, labels }) => {
          const labelId = `transfer-list-item-${id}-label`;

          return (
            <ListItemButton key={id} role="listitem" onClick={handleToggle(id)}>
              <ListItemIcon>
                <Checkbox
                  checked={selectedOptions.has(id)}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{
                    'aria-labelledby': labelId,
                  }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={labels.en} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
};

export default ItemWithLabelSelectionList;
