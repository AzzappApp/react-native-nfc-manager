import { useState, useCallback, useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Platform, View, StyleSheet } from 'react-native';
import { useMutation, graphql } from 'react-relay';
import PagerView from '../../components/PagerView/index';

import OnBoardingAbout from './OnBoardingAbout';
import OnBoardingName from './OnBoardingName';
import OnBoardingNameCompany from './OnBoardingNameCompany';
import OnBoardingType from './OnBoardingType';
import type { OnBoardingScreenUpdateUserMutation } from '@azzapp/relay/artifacts/OnBoardingScreenUpdateUserMutation.graphql';
import type { UserType } from '@prisma/client';

export type OnboardingContext = {
  firstName: string;
  lastName: string;
  userType?: UserType;
  companyName?: string;
  companyActivityId?: string;
};

type OnBoardingScreenProps = {
  skip(): void;
};

const OnBoardingScreen = ({ skip }: OnBoardingScreenProps) => {
  const [page, setPage] = useState(0);
  const next = useCallback(() => {
    setPage(pa => Math.min(pa + 1, 3));
  }, []);

  const prev = useCallback(() => {
    setPage(pa => Math.max(0, pa - 1));
  }, []);

  const ref = useRef<PagerView>(null);

  useEffect(() => {
    ref.current?.setPage(page);
  }, [page]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState<UserType>();
  const [companyName, setCompanyName] = useState('');
  const [companyActivityId, setCompanyActivityId] = useState('');

  const [commit] = useMutation<OnBoardingScreenUpdateUserMutation>(graphql`
    mutation OnBoardingScreenUpdateUserMutation($input: UpdateUserInput!) {
      updateUser(input: $input) {
        user {
          id
          isReady
        }
      }
    }
  `);

  const saveName = useCallback(() => {
    try {
      commit({
        variables: {
          input: {
            firstName,
            lastName,
            isReady: true,
          },
        },
      });
      next();
    } catch (error) {
      //TODO: specify how to handle error
      console.error(error);
    }
  }, [commit, firstName, lastName, next]);

  const saveUserType = useCallback(() => {
    try {
      commit({
        variables: {
          input: {
            userType,
          },
        },
      });
      next();
    } catch (error) {
      //TODO: specify how to handle error
      console.error(error);
    }
  }, [commit, next, userType]);

  const saveAboutCompany = useCallback(() => {
    try {
      commit({
        variables: {
          input: {
            companyName,
            companyActivityId,
          },
        },
      });
      next();
    } catch (error) {
      //TODO: specify how to handle error
      console.error(error);
    }
  }, [commit, companyActivityId, companyName, next]);

  const saveAboutUser = useCallback(() => {
    try {
      //TODO: when specification will be more clear on what the purpose of interest , and how to store them in the database based on their usage
      skip();
    } catch (error) {
      //TODO: specify how to handle error
      console.error(error);
    }
  }, [skip]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <PagerView
        initialPage={0}
        scrollEnabled={false}
        style={{ flex: 1 }}
        ref={ref}
      >
        <View key="0" style={styles.containerPage} collapsable={false}>
          <OnBoardingType
            next={saveUserType}
            userType={userType}
            setUserType={setUserType}
          />
        </View>
        <View key="1" style={styles.containerPage} collapsable={false}>
          {userType === 'PERSONAL' && (
            <OnBoardingName
              next={saveName}
              prev={prev}
              firstName={firstName}
              lastName={lastName}
              setFirstName={setFirstName}
              setLastName={setLastName}
            />
          )}
          {userType === 'BUSINESS' && (
            <OnBoardingNameCompany
              next={saveAboutCompany}
              prev={prev}
              companyActivityId={companyActivityId}
              companyName={companyName}
              setCompanyActivityId={setCompanyActivityId}
              setCompanyName={setCompanyName}
            />
          )}
        </View>
        <View key="2" style={styles.containerPage} collapsable={false}>
          <OnBoardingAbout
            next={saveAboutUser}
            prev={prev}
            userType={userType!}
            skip={skip}
          />
        </View>
      </PagerView>
    </KeyboardAvoidingView>
  );
};

export default OnBoardingScreen;

const styles = StyleSheet.create({
  containerPage: { flex: 1, justifyContent: 'center' },
});
