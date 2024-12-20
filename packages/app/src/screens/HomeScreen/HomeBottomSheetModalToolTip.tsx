import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type HomeBottomSheetModalToolTipContextType = {
  tooltipedWebcard?: string;
  setTooltipedWebcard: (webCardId?: string) => void;
  tooltipId: number;
  setTooltipId: (id: number) => void;
  itemWidth: number;
  setItemWidth: (id: number) => void;
};

const HomeBottomSheetModalToolTipContext =
  createContext<HomeBottomSheetModalToolTipContextType | null>(null);

export const useHomeBottomSheetModalToolTipContext = () => {
  const context = useContext(HomeBottomSheetModalToolTipContext);
  if (context === null) {
    throw new Error(
      'Using HomeBottomSheetModalToolTipContext without provider',
    );
  }
  return context;
};

type HomeBottomSheetModalToolTipProps = {
  children: ReactNode;
};

export const HomeBottomSheetModalToolTip = ({
  children,
}: HomeBottomSheetModalToolTipProps) => {
  const [tooltipedWebcard, setTooltipedWebcard] = useState<string>();
  const [tooltipId, setTooltipId] = useState<number>(0);
  const [itemWidth, setItemWidth] = useState<number>(0);

  const value = useMemo(() => {
    return {
      tooltipedWebcard,
      setTooltipedWebcard,
      tooltipId,
      setTooltipId,
      itemWidth,
      setItemWidth,
    };
  }, [itemWidth, tooltipId, tooltipedWebcard]);

  return (
    <HomeBottomSheetModalToolTipContext.Provider value={value}>
      {children}
    </HomeBottomSheetModalToolTipContext.Provider>
  );
};
