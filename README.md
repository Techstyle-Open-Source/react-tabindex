<a href="https://techstylefashiongroup.com"><img src="./tfg_os@2x.png?raw=" alt="TechStyle Open Source" width="326" /></a>

# react-tabindex

Sanely manage <kbd>Tab</kbd> accessibility in React with `<Untabbable>` and the
`useTabIndex` hook!

- Support for nested tabbable states – for nested accordions, menus, modals,
  etc.
- Performs no manual DOM manipulation, querying, or ref management – just pure
  declarative React.
- Less than 1 kB minified, no dependencies.

## Installation

Install with your choice of package manager:

```console
$ yarn add react-tabindex
$ npm install react-tabindex
```

## What does it do?

The `useTabIndex` hook returns a value to pass to the `tabIndex` prop on
elements of your choosing. If wrapped in an active `<Untabbable>` ancestor, that
`tabIndex` value will automatically be set to `-1`, making the elements
untabbable.

## Usage

### useTabIndex

Start using `useTabIndex` for any tabbable elements you render in your
components. Remember to get them all if you want correct behavior! Buttons,
links, inputs, [and all the rest](https://github.com/davidtheclark/tabbable).

```js
import { useTabIndex } from 'react-tabindex';

function ExampleButton() {
  const tabIndex = useTabIndex();

  return <button tabIndex={tabIndex}>Click here!</button>;
}
```

If you have a desired `tabIndex` value (for example, from props) you can pass
that as an argument:

```js
import { useTabIndex } from 'react-tabindex';

function ExampleButton({ children, tabIndex }) {
  // Override the input `tabIndex` with the result of `useTabIndex`.
  tabIndex = useTabIndex(tabIndex);

  return <button tabIndex={tabIndex}>{children}</button>;
}
```

### Untabbable

Now, when a section of your app becomes untabbable, wrap it in an `<Untabbable>`
and toggle the `active` prop. A good example is carousel slides that are not
visible:

```js
import { Untabbable, useTabIndex } from 'react-tabindex';

function Carousel({ activeIndex, items }) {
  return (
    <section className="carousel" aria-label="My Presentation">
      <ul>
        {items.map((item, index) => (
          // Make all carousel items except the active one untabbable.
          // NOTE: Instead of conditionally adding/removing the `<Untabbable>`
          // wrapper, you should instead toggle its `active` prop (otherwise,
          // React will remount the entire subtree each time, since the
          // structure is changing).
          <Untabbable active={index !== activeIndex} key={item.key}>
            <li className="slide">{item}</li>
          </Untabbable>
        ))}
      </ul>
    </section>
  );
}

function IntroSlide() {
  const tabIndex = useTabIndex();

  return (
    <section>
      <h1>Prestige Worldwide</h1>

      <a href="https://prestige.worldwide/" tabIndex={tabIndex}>
        Visit our website!
      </a>

      <button tabIndex={tabIndex}>Next Slide</button>
    </section>
  );
}
```

For best results, make your component library (design system) primitives like
`<Button>`, `<Input>`, etc. use this so that it’s automatic.

### Advanced: Nested untabbable states

Sometimes you have nested regions that need to become untabbable. A good example
would be a nested accordion/collapsible style menu. It is fine (and expected) to
nest `<Untabbable>` elements in this scenario, and it will behave correctly out
of the box. That is to say, **any ancestor `Untabbable` being active will
override the `active` state of any `Untabbable` descendants**.

In the following example, a nested collapsible menu uses `<Untabbable>` when its
children are collapsed. Even if a submenu is in the expanded state
(`<Untabbable active={false}>`), a parent menu being collapsed will cause that
parent’s `Untabbable` to override the state of any `Untabbable` descendants.

You may be wondering: in a real app, wouldn’t you use a property like `hidden`
or CSS like `display: none` on collapsed elements, which naturally removes any
elements therein from the tab order? That may be the case – but you may also
want to animate the content that is being expanded or collapsed, and _during
that time it will still be visible and tabbable_ – so it’s a good idea to use
`Untabbable` anyway even if the final resting state of the collapsed content is
already removed from the tab order. Other times, like with a carousel, the
inactive items may never be set to `display: none` in the first place, so
`Untabbable` becomes essential.

```js
function Collapsible({ id, label, children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button aria-controls={id} aria-expanded={expanded}>
        {label}
      </button>
      <Untabbable active={!expanded}>
        <div id={id} role="region" style={{ height: expanded ? 'auto' : 0 }}>
          {children}
        </div>
      </Untabbable>
    </div>
  );
}

function App() {
  return (
    <Collapsible label="Produce">
      <Collapsible label="Fruits">
        <Collapsible label="Apples">
          <ul>
            <li>Cosmic Crisp</li>
            <li>Fuji</li>
            <li>Pink Lady</li>
          </ul>
        </Collapsible>
      </Collapsible>
      <Collapsible label="Vegetables">
        <Collapsible label="Onions">
          <ul>
            <li>Red Onions</li>
            <li>Yellow Onions</li>
            <li>White Onions</li>
          </ul>
        </Collapsible>
      </Collapsible>
    </Collapsible>
  );
}
```

### Advanced: Resetting the untabbable state

The `Untabbable` component has a `reset` prop that allows you to ignore the
state of any ancestors, causing it to no longer inherit their `active` state.
This feature is primarily useful for modals, which would otherwise inherit the
app’s `Untabbable` state, but instead intentionally “break out” of the
underlying content. Let’s take a look.

```js
function App() {
  const [isModalOpen, setModalOpen] = useState(false);
  return (
    <Untabbable isActive={isModalOpen}>
      <div aria-hidden={isModalOpen}>
        <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        {isModalOpen ? (
          <Modal>
            <h2>It worked!</h2>
            <p>Content in here is still tabbable.</p>
            <Button>Like this</Button>
          </Modal>
        ) : null}
      </div>
    </Untabbable>
  );
}

function Button({ tabIndex, ...rest }) {
  tabIndex = useTabIndex(tabIndex);
  return <button tabIndex={tabIndex} {...rest} />;
}

function Modal({ onClose, children }) {
  return ReactDOM.createPortal(
    // Use `reset` so that modal content does not inherit the `Untabbable` state
    // from the rest of the app, which is hidden when the modal is open.
    <Untabbable reset>
      <div role="dialog">
        <Button onClick={onClose}>Close</Button>
        {children}
      </div>
    </Untabbable>,
    document.body
  );
}
```

In this simple example, there is only one modal. But you can imagine
implementing a more advanced scenario with multiple stacked modals, which is
also possible and will use the same `reset` feature. See the test suite for such
an example.

## Limitations

For this to work correctly on all elements in your app (and not leave any
tabbable when they should be untabbable), you must ensure that all focusable
elements use the `useTabIndex` hook. This can be tedious and hard to remember,
which is why it’s a good idea to incorporate it into your component library
(design system) and make sure everyone uses it.

If you are rendering any static HTML (using `dangerouslySetInnerHTML`, for
example with data from a CMS), unfortunately there will be no way to ensure that
content uses `useTabIndex`, since it is not controlled by React.

If you have other content on the page outside of your React root, or rendered by
other non-React JavaScript widgets, there will likewise be no easy way to apply
`useTabIndex` to that content. You will have to resort to manual DOM
manipulation side effects to handle such cases.

## Alternatives

### [react-untabbable](https://github.com/fdiogo/react-untabbable#readme)

Uses [tabbable](https://github.com/davidtheclark/tabbable) under the hood to
automatically identify tabbable elements inside an `Untabbable` region and
modify their `tabindex` attribute using manual DOM manipulation. This has pros
and cons.

**Pros**

- It’s more automatic as the tabbable elements don’t have to individually use a
  special hook to update their `tabIndex` prop.
- It will also work with static HTML inside the `Untabbable` region that is not
  controlled by React (e.g. `dangerouslySetInnerHTML`).

**Cons**

- It is usually not kosher for a React component to have its DOM modified from
  another React component.
- Can lead to inconsistent state. For example, let’s say an `Untabbable` region
  becomes active, and all its descendants have their `tabindex` attribute
  modified. Since those descendants may be dynamic React components, it’s
  possible for them to still be adding, removing, or modifying content after the
  DOM was already modified. For instance, let’s say one is loading data, then
  renders new elements when the data is available – that updated content will
  not have the correct `tabindex`, since the `Untabbable` already ran its DOM
  manipulation. It’s also possible that React will unknowingly undo the
  `tabindex` modification performed by the `Untabbable` ancestor during
  rerendering. The advantage of using `react-tabindex` is that state is
  guaranteed to stay in sync and reactive (which is the whole idea behind
  React)!
