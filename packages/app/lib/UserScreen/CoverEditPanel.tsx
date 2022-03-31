import isEqual from 'lodash/isEqual';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  applyOptimisticMutation,
  graphql,
  useRelayEnvironment,
  commitMutation,
  useFragment,
} from 'react-relay';
import EditionPanelTabs from '../components/EditionPanelTabs';
import { useImagePicker, useWebAPI } from '../PlatformEnvironment';
import ModuleEditorContext from './ModuleEditorContext';
import type { CoverEditPanel_cover$key } from './__generated__/CoverEditPanel_cover.graphql';
import type { UpdateCoverInput } from './__generated__/CoverEditPanelMutation.graphql';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Disposable } from 'react-relay';

type CoverEditPanelProps = {
  style: StyleProp<ViewStyle>;
  userId: string;
  cover?: CoverEditPanel_cover$key | null;
};

const CoverEditPanel = ({ style, userId, cover }: CoverEditPanelProps) => {
  const data = useFragment(
    graphql`
      fragment CoverEditPanel_cover on UserCardCover {
        picture
        title
      }
    `,
    cover ?? null,
  );

  const moduleEditor = useContext(ModuleEditorContext)!;

  const initialData = useMemo(
    () => ({
      picture: data?.picture,
      title: data?.title,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const updates = useRef<UpdateCoverInput>(initialData);
  const pictureRef = useRef<any>(null);

  const environment = useRelayEnvironment();
  const mutationRef = useRef<{
    pending: boolean;
    revert: () => void;
    commit: () => Disposable;
  } | null>(null);

  const WebAPI = useWebAPI();
  const updateField = <T extends keyof UpdateCoverInput>(
    key: T,
    value: UpdateCoverInput[T],
  ) => {
    if (updates.current[key] === value) {
      return;
    }
    updates.current = { ...updates.current, [key]: value };
    const updateCoverMutation = graphql`
      mutation CoverEditPanelMutation($input: UpdateCoverInput!) {
        updateCover(input: $input) {
          user {
            id
            card {
              cover {
                ...CoverEditPanel_cover
              }
            }
          }
        }
      }
    `;

    const hasUnsavedChange = !isEqual(initialData, updates.current);
    const isValid = !!updates.current.picture && !!updates.current.title;
    const previousMutation = mutationRef.current;
    moduleEditor.setCanSave(hasUnsavedChange && isValid);

    if (hasUnsavedChange) {
      const optimisticDisposable = applyOptimisticMutation(environment, {
        mutation: updateCoverMutation,
        variables: { input: updates.current },
        optimisticResponse: {
          updateCover: {
            user: {
              id: userId,
              card: {
                id: `temp-${userId}-mainCard`,
                cover: {
                  title: updates.current.title ?? '',
                  picture: updates.current.picture ?? '',
                },
              },
            },
          },
        },
      });

      mutationRef.current = {
        pending: true,
        revert() {
          optimisticDisposable.dispose();
          this.pending = false;
        },
        commit() {
          let innerDisposable: Disposable | null;
          let canceled = false;

          const dispose = () => {
            canceled = true;
            innerDisposable?.dispose();
          };

          const commit = async () => {
            if (
              updates.current.picture !== initialData.picture &&
              pictureRef.current
            ) {
              if (canceled) {
                return;
              }
              const uploadSettings = await WebAPI.uploadSign({
                kind: 'image',
                target: 'cover',
              });

              if (canceled) {
                return;
              }
              const { promise, progress } = WebAPI.uploadMedia(
                pictureRef.current as File,
                uploadSettings,
              );
              progress.subscribe({
                next(val) {
                  console.log(val);
                },
              });
              const res = await promise;
              updates.current.picture = res.public_id;
            }
            if (canceled) {
              return;
            }

            innerDisposable = commitMutation(environment, {
              mutation: updateCoverMutation,
              variables: { input: updates.current },
              onCompleted() {
                optimisticDisposable.dispose();
                moduleEditor.onSaved();
              },
              onError(e) {
                // eslint-disable-next-line no-alert
                alert('Error');
                console.log(e);
              },
            });
          };

          commit().catch(e => {
            // eslint-disable-next-line no-alert
            alert('Error');
            console.log(e);
          });

          this.pending = false;
          return { dispose };
        },
      };
    } else {
      mutationRef.current = null;
    }

    previousMutation?.revert();
  };

  useEffect(
    () => () => {
      if (mutationRef.current?.pending) {
        mutationRef.current?.revert();
      }
    },
    [environment, updates, userId],
  );

  useEffect(() => {
    const saveSubscription = moduleEditor.setSaveListener(() => {
      mutationRef.current?.commit();
    });
    const cancelSubscription = moduleEditor.setCancelListener(() => {
      mutationRef.current?.revert();
    });

    return () => {
      saveSubscription.dispose();
      cancelSubscription.dispose();
    };
  }, [moduleEditor]);

  const launchImagePicker = useImagePicker();

  const onSelectPhoto = async () => {
    const { didCancel, error, uri, file } = await launchImagePicker();

    if (didCancel || error || !uri) {
      return;
    }
    updateField('picture', uri);
    pictureRef.current = file;
  };

  const onTitleChange = (title: string) => {
    updateField('title', title);
  };

  const [currenTab, setCurrentTab] = useState('picture');
  const tabs = useMemo(
    () => [
      {
        key: 'picture',
        accessibilityLabel: 'Picture Tab',
        icon: require('./assets/picture-icon.png'),
      },
      {
        key: 'title',
        accessibilityLabel: 'Title Tab',
        icon: require('./assets/title-icon.png'),
      },
      {
        key: 'effect',
        accessibilityLabel: 'Effect Tab',
        icon: require('./assets/effect-icon.png'),
      },
      {
        key: 'desktop',
        accessibilityLabel: 'Desktop Tab',
        icon: require('./assets/desktop-icon.png'),
      },
    ],
    [],
  );

  return (
    <View style={style}>
      {currenTab === 'picture' && (
        <ScrollView style={styles.scrollView}>
          <Pressable
            onPress={onSelectPhoto}
            style={{ alignSelf: 'center', marginTop: 60 }}
          >
            <Text style={{ color: 'white', fontSize: 20 }}>Select Picture</Text>
          </Pressable>
        </ScrollView>
      )}
      {currenTab === 'title' && (
        <ScrollView style={styles.scrollView}>
          <TextInput
            value={data?.title ?? ''}
            onChangeText={onTitleChange}
            style={{
              alignSelf: 'center',
              marginTop: 60,
              backgroundColor: 'white',
              width: 200,
            }}
          />
        </ScrollView>
      )}
      <EditionPanelTabs
        currentTab={currenTab}
        tabs={tabs}
        onTabChange={tab => setCurrentTab(tab)}
        style={styles.tabs}
      />
    </View>
  );
};

export default CoverEditPanel;

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  tabs: { alignSelf: 'center' },
});
