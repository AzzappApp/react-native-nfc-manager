import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode, RefObject } from 'react';
import type { View } from 'react-native-reanimated/lib/typescript/Animated';

type Tooltip = {
  ref: RefObject<View>;
  onPress?: () => void;
  visible?: boolean;
  hidden?: boolean;
};

type TooltipContextProps = {
  tooltips: { [key: string]: Tooltip | null };
  registerTooltip: (id: string, tooltipOption: Tooltip) => void;
  unregisterTooltip: (id: string) => void;
  updateTooltip: (id: string, tooltipOption: Partial<Tooltip>) => void;
  openTooltips: (ids: string[]) => void;
  closeTooltips: (ids: string[]) => void;
};

const TooltipContext = createContext<TooltipContextProps | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tooltips, setTooltips] = useState<{
    [key: string]: Tooltip | null;
  }>({});

  const registerTooltip = useCallback((id: string, tooltipOption: Tooltip) => {
    setTooltips(tooltip => ({
      ...tooltip,
      [id]: { visible: false, hidden: false, ...tooltipOption },
    }));
  }, []);

  const unregisterTooltip = useCallback((id: string) => {
    setTooltips(tooltips => {
      if (tooltips[id]) {
        delete tooltips[id];
      }
      return tooltips;
    });
  }, []);

  const updateTooltip = useCallback(
    (id: string, tooltipOption: Partial<Tooltip>) => {
      setTooltips(tooltips => {
        if (tooltips[id]) {
          return {
            ...tooltips,
            [id]: { ...tooltips[id], ...tooltipOption },
          };
        } else {
          console.warn(`The tooltip ${id} is not registered`);
          return tooltips;
        }
      });
    },
    [],
  );

  const openTooltips = useCallback(
    (ids: string[]) => {
      ids.forEach(id => {
        if (!tooltips[id]?.hidden) {
          updateTooltip(id, { visible: true });
        }
      });
    },
    [tooltips, updateTooltip],
  );

  const closeTooltips = useCallback(
    (ids: string[]) => {
      ids.forEach(id => {
        updateTooltip(id, { visible: false });
      });
    },
    [updateTooltip],
  );

  const value = useMemo(() => {
    return {
      tooltips,
      updateTooltip,
      registerTooltip,
      unregisterTooltip,
      openTooltips,
      closeTooltips,
    };
  }, [
    tooltips,
    updateTooltip,
    registerTooltip,
    unregisterTooltip,
    openTooltips,
    closeTooltips,
  ]);

  return (
    <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>
  );
}

export function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (context === null) {
    throw new Error('useTooltipContext must be used within a TooltipProvider');
  }
  return context;
}
