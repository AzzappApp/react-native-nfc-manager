import type { WebCard } from '@azzapp/data';

export const WebCardFixture = {
  generate: (partial: Partial<WebCard> & Pick<WebCard, 'id'>): WebCard => {
    const creationDate = new Date();

    const { id, ...webCard } = partial;
    return {
      id: `webcard-${id}`,
      alreadyPublished: false,
      cardColors: null,
      cardIsPrivate: false,
      cardIsPublished: true,
      cardStyle: null,
      commonInformation: null,
      companyActivityId: null,
      companyName: null,
      coverData: null,
      coverSubTitle: null,
      coverTitle: null,
      createdAt: creationDate,
      updatedAt: creationDate,
      firstName: `firstName-${id}`,
      isMultiUser: false,
      lastCardUpdate: creationDate,
      lastName: `lastName-${id}`,
      lastUserNameUpdate: creationDate,
      locale: null,
      nbFollowers: 0,
      nbFollowings: 0,
      nbLikes: 0,
      nbPosts: 0,
      nbPostsLiked: 0,
      nbWebCardViews: 0,
      userName: `username-${id}`,
      webCardCategoryId: null,
      webCardKind: 'personal',
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      ...webCard,
    };
  },
};
