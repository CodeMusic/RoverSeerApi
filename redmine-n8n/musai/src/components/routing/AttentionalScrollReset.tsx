import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * AttentionalScrollReset
 * Resets the user's visual attention to the top of the page whenever the route changes.
 */
export function AttentionalScrollReset(): JSX.Element
{
  const location = useLocation();

  useEffect(() =>
  {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
}

export default AttentionalScrollReset;


