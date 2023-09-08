import { styled } from '@mui/material';
import { DataGrid as MUIDatagrid } from '@mui/x-data-grid';

const DataGrid = styled(MUIDatagrid)(() => ({
  '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell:focus': {
    outline: 'none',
  },
}));

export default DataGrid;
