import { useContext } from 'react';
import UntabbableContext from './UntabbableContext';

export default function useTabIndex(tabIndex) {
  const isUntabbable = useContext(UntabbableContext);
  return isUntabbable ? -1 : tabIndex;
}
