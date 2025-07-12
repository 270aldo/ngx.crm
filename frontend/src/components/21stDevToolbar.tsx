import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';

// This component will only be included in development builds
const TwentyFirstDevToolbar = () => {
  if (import.meta.env.PROD) return null;
  
  return (
    <TwentyFirstToolbar
      config={{
        plugins: [ReactPlugin],
      }}
    />
  );
};

export default TwentyFirstDevToolbar;
