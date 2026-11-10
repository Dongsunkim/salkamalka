import type { PropsWithChildren } from 'react';
import { TDSMobileProvider } from '@toss/tds-mobile';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { isTossWebView } from '../storage';

const browserAgent = {
  colorPreference: 'light' as const,
  fontScale: 100,
  fontA11y: undefined,
  isAndroid: false,
  isIOS: false,
};

export function AppProvider({ children }: PropsWithChildren) {
  if (isTossWebView()) return <TDSMobileAITProvider>{children}</TDSMobileAITProvider>;
  return (
    <TDSMobileProvider userAgent={browserAgent} resetGlobalCss={false}>
      {children}
    </TDSMobileProvider>
  );
}
