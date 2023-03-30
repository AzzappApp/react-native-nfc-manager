import * as React from 'react';

import { FilterList, FilterListItem, FilterLiveSearch } from 'react-admin';

const CoverTemplateListAside = () => {
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
        <FilterLiveSearch source="name" placeholder="Search by Name" />

        <FilterList label="Enabled" icon={undefined}>
          <FilterListItem
            label="Yes"
            value={{
              enabled: '1',
            }}
          />
          <FilterListItem
            label="No"
            value={{
              enabled: '0',
            }}
          />
        </FilterList>
        <FilterList label="Clipped" icon={undefined}>
          <FilterListItem
            label="Yes"
            value={{
              segmented: '1',
            }}
          />
          <FilterListItem
            label="No"
            value={{
              segmented: '0',
            }}
          />
        </FilterList>
        <FilterList label="Type" icon={undefined}>
          <FilterListItem
            label="Business"
            value={{
              kind: 'business',
            }}
          />
          <FilterListItem
            label="Personal"
            value={{
              kind: 'personal',
            }}
          />
        </FilterList>
      </div>
    </div>
  );
};

export default CoverTemplateListAside;
