import { useCallback, useState } from 'react';
import { discoverMusaiModule } from '@/lib/discoveryApi';
import type { MusaiDiscoverModule } from '@/lib/discoveryApi';

const dispatchDiscoveryEvent = (module: MusaiDiscoverModule | string, query: string) =>
{
  window.dispatchEvent(new CustomEvent('musai-discover-request', {
    detail: { module, query }
  }));
};

const rememberDiscovery = (module: MusaiDiscoverModule | string, query: string) =>
{
  try
  {
    sessionStorage.setItem('musai-discover-payload', JSON.stringify({ module, query }));
  }
  catch
  {
    // ignore storage errors
  }
};

export function useMusaiDiscovery()
{
  const [isDiscovering, setIsDiscovering] = useState(false);

  const runDiscovery = useCallback(async (rawQuery: string) =>
  {
    if (isDiscovering)
    {
      return;
    }

    const trimmed = rawQuery.trim();
    if (!trimmed)
    {
      dispatchDiscoveryEvent('chat', '');
      return;
    }

    setIsDiscovering(true);
    try
    {
      const module = await discoverMusaiModule(trimmed);
      rememberDiscovery(module, trimmed);
      dispatchDiscoveryEvent(module, trimmed);
    }
    catch
    {
      rememberDiscovery('chat', trimmed);
      dispatchDiscoveryEvent('chat', trimmed);
    }
    finally
    {
      setIsDiscovering(false);
    }
  }, [isDiscovering]);

  return {
    isDiscovering,
    runDiscovery,
  };
}

export default useMusaiDiscovery;
