import clone from 'lodash/clone';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode, RefObject } from 'react';
import type { View } from 'react-native';

type Tooltip = {
  ref: RefObject<View>;
  onPress?: () => void;
  visible?: boolean;
};

type TooltipContextProps = {
  registerTooltip: (id: string, tooltipOption: Tooltip) => void;
  unregisterTooltip: (id: string) => void;
  updateTooltip: (id: string, tooltipOption: Partial<Tooltip>) => void;
  openTooltips: (ids: string[]) => void;
  closeTooltips: (ids: string[]) => void;
  toggleTooltips: (ids: string[]) => void;
};

type TooltipDataContextProps = {
  tooltips: { [key: string]: Tooltip | null };
};

const TooltipContext = createContext<TooltipContextProps | null>(null);
const TooltipDataContext = createContext<TooltipDataContextProps | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tooltips, setTooltips] = useState<{
    [key: string]: Tooltip | null;
  }>({});

  const registerTooltip = useCallback((id: string, tooltipOption: Tooltip) => {
    setTooltips(tooltip => ({
      ...tooltip,
      [id]: { visible: false, ...tooltipOption },
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

  const openTooltips = useCallback((ids: string[]) => {
    setTooltips(currentToolTip => {
      const result = clone(currentToolTip);
      let updated = false;
      ids.forEach(id => {
        if (result[id] && !result[id]?.visible) {
          result[id].visible = true;
          updated = true;
        }
      });
      if (updated) {
        return result;
      }
      return currentToolTip;
    });
  }, []);

  const closeTooltips = useCallback(
    (ids: string[]) => {
      ids.forEach(id => {
        updateTooltip(id, { visible: false });
      });
    },
    [updateTooltip],
  );

  const toggleTooltips = useCallback((tooltipsToToggle: string[]) => {
    setTooltips(currentToolTip => {
      const result = clone(currentToolTip);
      const isVisible = tooltipsToToggle.some(t => currentToolTip[t]?.visible);
      let updated = false;
      tooltipsToToggle.forEach(t => {
        if (!result[t]) return;
        if (isVisible && result[t].visible) {
          result[t].visible = false;
          updated = true;
        } else if (!isVisible && !result[t].visible) {
          result[t].visible = true;
          updated = true;
        }
      });
      if (updated) {
        return result;
      }
      return currentToolTip;
    });
  }, []);

  const value = useMemo(() => {
    return {
      updateTooltip,
      registerTooltip,
      unregisterTooltip,
      openTooltips,
      closeTooltips,
      toggleTooltips,
    };
  }, [
    updateTooltip,
    registerTooltip,
    unregisterTooltip,
    openTooltips,
    closeTooltips,
    toggleTooltips,
  ]);

  return (
    <TooltipContext.Provider value={value}>
      <TooltipDataContext.Provider value={{ tooltips }}>
        {children}
      </TooltipDataContext.Provider>
    </TooltipContext.Provider>
  );
}

export function useTooltipDataContext() {
  const context = useContext(TooltipDataContext);
  if (context === null) {
    throw new Error('useTooltipContext must be used within a TooltipProvider');
  }
  return context;
}

export function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (context === null) {
    throw new Error('useTooltipContext must be used within a TooltipProvider');
  }
  return context;
}
