import React from 'react';

export const prefetchImage = jest.fn();

export const prefetchVideo = jest.fn();

export const addLocalCachedMediaFile = jest.fn();

export const MediaImageRenderer = (props: any) =>
  React.createElement('MediaImageRenderer', props);

export const MediaVideoRenderer = (props: any) =>
  React.createElement('MediaVideoRenderer', props);
