import { graphql } from 'react-relay';

export const contactCardFormFragment = graphql`
  fragment ContactCardEditFormFragment_profile on Profile
  @argumentDefinitions(pixelRatio: { type: "Float!" }) {
    id
    webCard {
      id
      userName
      isMultiUser
      isPremium
      commonInformation {
        company
        addresses {
          address
          label
        }
        emails {
          label
          address
        }
        phoneNumbers {
          label
          number
        }
        urls {
          address
        }
        socials {
          label
          url
        }
      }
      logo {
        id
        uri: uri(width: 180, pixelRatio: $pixelRatio)
      }
    }
    contactCard {
      firstName
      lastName
      title
      company
      emails {
        label
        address
      }
      phoneNumbers {
        label
        number
      }
      urls {
        address
      }
      addresses {
        address
        label
      }
      birthday {
        birthday
      }
      socials {
        url
        label
      }
    }
    avatar {
      id
      uri: uri(width: 112, pixelRatio: $pixelRatio)
    }
    logo {
      id
      uri: uri(width: 180, pixelRatio: $pixelRatio)
    }
  }
`;
