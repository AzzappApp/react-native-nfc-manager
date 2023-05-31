import type { ScrollViewProps } from 'react-native';

export type ProfileScreenHeaderProps = {
  /**
   * Whether the profile is in edit mode
   */
  editing: boolean;
  /**
   * true when the profile is ready to be displayed (animation finished)
   */
  ready: boolean;
  /**
   * Whether the profile is in selection mode
   */
  selectionMode: boolean;
  /**
   * The number of selected modules
   */
  nbSelectedModules: number;
  /**
   * The number of selected modules
   */
  selectionContainsAllModules: boolean;
  /**
   * Called when the user press the close button in view mode
   */
  onClose: () => void;
  /**
   * Called when the user press the cancel button in edit mode
   */
  onDone: () => void;
  /**
   * Called when the user press the edit modules button in view mode
   */
  onEditModules: () => void;
  /**
   * Called when the user press the close button in view mode
   */
  onCancelEditModules: () => void;
  /**
   * Called when the user press the select all button in selection mode
   */
  onSelectAllModules: () => void;
  /**
   * Called when the user press the unselect all button in selection mode
   */
  onUnSelectAllModules: () => void;
};

export type ProfileScreenFooterProps = {
  /**
   * Whether the profile is in edit mode
   */
  editing: boolean;
  /**
   * Whether the profile is in selection mode
   */
  selectionMode: boolean;
  /**
   * true when the profile is ready to be displayed (animation finished)
   */
  ready: boolean;
  /**
   * The user name of the current displayed profile
   */
  userName: string;
  /**
   * True when the user select some modules
   */
  hasSelectedModules: boolean;
  /**
   * True when selection contains hidden modules
   */
  selectionContainsHiddenModules: boolean;
  /**
   * edit mode display mode
   */
  currentEditionView: 'desktop' | 'mobile' | 'preview';
  /**
   * the background color of the profile
   */
  backgroundColor: string;
  /**
   * A callback called when the user press the home button
   */
  onHome: () => void;
  /**
   * A callback called when the user press the edit button
   */
  onEdit: () => void;
  /**
   * A callback called when the user press the follow button
   */
  onToggleFollow: (follow: boolean) => void;
  /**
   * A callback called when the user switch the edit mode display mode
   */
  onEditingDisplayModeChange: (view: 'desktop' | 'mobile' | 'preview') => void;
  /**
   * A callback called when the user press the add module button
   */
  onRequestNewModule: () => void;
  /**
   * A callback called when the user press the color picker button
   */
  onRequestColorPicker: () => void;
  /**
   * Called when the user press the hide button in edit selection mode
   */
  onToggleVisibility: (visible: boolean) => void;
  /**
   * Called when the user press the delete button in edit selection mode
   */
  onDelete: () => void;
};

export type ProfileBlockContainerProps = {
  /**
   * The children of the container
   */
  children: React.ReactNode;
  /**
   * Whether the profile is in edit mode
   */
  editing: boolean;
  /**
   * when true, the animation are disabled
   */
  disableAnimation?: boolean;
  /**
   * If false, the edition buttons are not displayed
   *
   * @default true
   */
  displayEditionButtons?: boolean;
  /**
   * Whether the block is visible in the webcard
   * @default true
   */
  visible?: boolean;
  /**
   * Whether the block is selected in the webcard
   * @default true
   */
  selected?: boolean;
  /**
   * Whether the block is the first one (used to hide the move up button)
   */
  isFirst?: boolean;
  /**
   * Whether the block is the last one (used to hide the move down button)
   */
  isLast?: boolean;
  /**
   * If true, the swipeable actions are displayed
   */
  selectionMode?: boolean;
  /**
   * The background color of the card
   */
  backgroundColor: string;
  /**
   * Called when the user press a module, only enabled in edit mode
   */
  onModulePress: () => void;
  /**
   * Called when the user press the move up button
   */
  onMoveUp?: () => void;

  /**
   * Called when the user press the move down button
   */
  onMoveDown?: () => void;
  /**
   * Called when the user press the remove button
   */
  onRemove?: () => void;
  /**
   * Called when the user press the duplicate button
   */
  onDuplicate?: () => void;
  /**
   * Called when the user press the toggle visibility button
   */
  onToggleVisibility?: (visible: boolean) => void;
  /**
   * Called when the user select the block
   */
  onSelect?: (selected: boolean) => void;
};

export type ProfileScreenScrollViewProps = ScrollViewProps & {
  /**
   * true when the profile is ready to be displayed (animation finished)
   */
  ready: boolean;
  /**
   * Whether the profile is in edit mode
   */
  editing: boolean;
};
