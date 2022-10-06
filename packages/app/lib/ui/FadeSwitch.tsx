import { useRef } from 'react';
import { SwitchTransition, Transition } from 'react-transition-group';
import ViewTransition from './ViewTransition';
import type { ReactNode } from 'react';

type FadeSwitchProps = {
  currentKey: string;
  transitionDuration: number;
  children: ReactNode;
};

const FadeSwitch = ({
  currentKey,
  transitionDuration,
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
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: state === 'entering' || state === 'entered' ? 1 : 0,
              },
            ]}
          >
            {children}
          </ViewTransition>
        )}
      </Transition>
    </SwitchTransition>
  );
};

export default FadeSwitch;
