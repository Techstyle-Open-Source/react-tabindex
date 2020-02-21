import React, { useContext } from 'react';
import UntabbableContext from './UntabbableContext';

/**
 * A wrapper that marks a section of the component tree as unreachable via the
 * <kbd>Tab</kbd> key. It renders no element on its own and must contain a
 * single element child. By itself it does nothing, but descendants using the
 * `useTabIndex` hook will receive `-1` if there is an active Untabbable
 * ancestor.
 *
 * If you need to toggle tabbability back on, set the `active` prop to false.
 * This is preferable to conditionally inserting the Untabbable parent since it
 * keeps the component tree structure the same, avoiding remounts.
 */
export default function Untabbable({
  // Whether this Untabbable is actually active, overriding the output of
  // `useTabIndex`.
  active = true,
  // Context provider children.
  children,
  // Whether this Untabbable should ignore ancestor Untabbable state. This is
  // rarely what you want, unless you are setting up something with modal
  // elements. In that case, you may want all elements behind the modal to
  // become untabbable, but the modal element is likely to have that same
  // Untabbable context as its ancestor (since context is preserved across
  // portals). Thus, the content of the modal component itself should be wrapped
  // in an Untabbable with the `reset` prop.
  reset = false
}) {
  const anyParentActive = useContext(UntabbableContext);
  // Explicitly force value to Boolean, since users often rely on truthiness
  // shorthand like `active={object}`, `active={array.length}`, etc.
  const value = Boolean(reset ? active : active || anyParentActive);

  return (
    <UntabbableContext.Provider value={value}>
      {children}
    </UntabbableContext.Provider>
  );
}
