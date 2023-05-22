import * as React from 'react';

import {
  FilterList,
  FilterListItem,
  FilterLiveSearch,
  SavedQueriesList,
} from 'react-admin';

const StaticMediaListAside = () => {
  return (
    <div
      style={{
        order: -1,
        flex: '0 0 15em',
        marginTop: 65,
        marginRight: 10,
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        borderRadius: 4,
        borderColor: 'rgb(128,128,128)',
        boxShadow:
          '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
      }}
    >
      <div>
        <FilterLiveSearch source="name" />

        <SavedQueriesList />
        <FilterList label="Available" icon={undefined}>
          <FilterListItem
            label="Yes"
            value={{
              available: '1',
            }}
          />
          <FilterListItem
            label="No"
            value={{
              available: '0',
            }}
          />
        </FilterList>
        <FilterList label="Type" icon={undefined}>
          <FilterListItem
            label="Cover Foreground"
            value={{
              usage: 'coverForeground',
            }}
          />
          <FilterListItem
            label="Cover Background"
            value={{
              usage: 'coverBackground',
            }}
          />
          <FilterListItem
            label="Module Background"
            value={{
              usage: 'moduleBackground',
            }}
          />
        </FilterList>
      </div>
    </div>
  );
};

export default StaticMediaListAside;
