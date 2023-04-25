import { useRef } from 'react';
import { SwitchTransition, Transition } from 'react-transition-group';
import ViewTransition from './ViewTransition';
import type { ReactNode } from 'react';

type FadeSwitchProps = {
  currentKey: string;
  transitionDuration: number;
  easing?: 'ease-in-out' | 'ease-in' | 'ease-out' | 'ease' | 'linear' | null;
  children: ReactNode;
};

const FadeSwitch = ({
  currentKey,
  transitionDuration,
  easing,
  children,
}: FadeSwitchProps) => {
  const containerRef = useRef<any>();
  return (
    <SwitchTransition mode="in-out">
      <Transition
        key={currentKey}
        timeout={transitionDuration}
        nodeRef={containerRef}
      >
        {state => (
          <ViewTransition
            transitionDuration={transitionDuration}
            transitions={['opacity']}
            ref={containerRef}
            style={[
              {
                height: '100%',
                width: '100%',
                opacity: state === 'entered' || state === 'entering' ? 1 : 0,
              },
            ]}
            easing={easing ?? 'linear'}
          >
            {children}
          </ViewTransition>
        )}
      </Transition>
    </SwitchTransition>
  );
};

export default FadeSwitch;
