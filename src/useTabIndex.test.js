import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ReactDOM from 'react-dom';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Untabbable from './Untabbable';
import useTabIndex from './useTabIndex';

function ExampleComponent({ tabIndex }) {
  tabIndex = useTabIndex(tabIndex);
  return <button tabIndex={tabIndex}>Click me</button>;
}

describe('useTabIndex', () => {
  it('returns the given tabIndex if not in an Untabbable', () => {
    const { getByRole } = render(<ExampleComponent tabIndex={0} />);
    expect(getByRole('button')).toHaveAttribute('tabindex', '0');
  });

  it('has no default tabIndex if not provided', () => {
    const { getByRole } = render(<ExampleComponent />);
    expect(getByRole('button')).not.toHaveAttribute('tabindex');
  });

  it('returns -1 if the descendant of an Untabbable', () => {
    const { getByRole } = render(
      <Untabbable>
        <ExampleComponent />
      </Untabbable>
    );
    expect(getByRole('button')).toHaveAttribute('tabindex', '-1');
  });

  it('returns the given tabIndex the Untabbable is not active', () => {
    const { getByRole } = render(
      <Untabbable active={false}>
        <ExampleComponent tabIndex={0} />
      </Untabbable>
    );
    expect(getByRole('button')).toHaveAttribute('tabindex', '0');
  });

  it('returns -1 if any ancestor Untabbable is active', () => {
    const { getByRole } = render(
      <Untabbable active={false}>
        <Untabbable>
          <Untabbable active={false}>
            <ExampleComponent />
          </Untabbable>
        </Untabbable>
      </Untabbable>
    );
    expect(getByRole('button')).toHaveAttribute('tabindex', '-1');
  });

  it('allows Untabbable to ignore ancestors', () => {
    const { getByRole } = render(
      <Untabbable active={false}>
        <Untabbable>
          <Untabbable active={false} reset>
            <ExampleComponent tabIndex={0} />
          </Untabbable>
        </Untabbable>
      </Untabbable>
    );
    expect(getByRole('button')).toHaveAttribute('tabindex', '0');
  });

  it('allows implementing stacking modals', () => {
    const ModalContext = React.createContext();

    function ModalProvider({ children }) {
      const [stack, setStack] = useState([]);
      const openModal = useCallback(tokenToAdd => {
        setStack(stack => [...stack, tokenToAdd]);
      }, []);
      const closeModal = useCallback(tokenToRemove => {
        setStack(stack => stack.filter(token => token !== tokenToRemove));
      }, []);
      const isTopModal = useCallback(
        token => stack.length > 0 && stack[stack.length - 1] === token,
        [stack]
      );
      const value = useMemo(
        () => ({
          hasModal: stack.length > 0,
          isTopModal,
          openModal,
          closeModal
        }),
        [stack, isTopModal, openModal, closeModal]
      );
      return (
        <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
      );
    }

    function App({ children }) {
      const { hasModal } = useContext(ModalContext);

      return (
        <Untabbable active={hasModal}>
          <div aria-hidden={hasModal}>{children}</div>
        </Untabbable>
      );
    }

    function Modal({ children }) {
      const token = useRef();
      const { openModal, closeModal, isTopModal } = useContext(ModalContext);

      useEffect(() => {
        openModal(token);
        return () => closeModal(token);
      }, [openModal, closeModal]);

      const isHidden = !isTopModal(token);

      return ReactDOM.createPortal(
        <Untabbable active={isHidden} reset>
          <div role="dialog" aria-hidden={isHidden}>
            {children}
          </div>
        </Untabbable>,
        document.body
      );
    }

    function Button({ tabIndex, ...rest }) {
      tabIndex = useTabIndex(tabIndex);
      return <button tabIndex={tabIndex} {...rest} />;
    }

    const { baseElement, rerender } = render(
      <ModalProvider>
        <App>
          <h1>Welcome to my app, enjoy your stay.</h1>
          <Button>Click here!</Button>
        </App>
      </ModalProvider>
    );
    expect(baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            aria-hidden="false"
          >
            <h1>
              Welcome to my app, enjoy your stay.
            </h1>
            <button>
              Click here!
            </button>
          </div>
        </div>
      </body>
    `);

    rerender(
      <ModalProvider>
        <App>
          <h1>Welcome to my app, enjoy your stay.</h1>
          <Button>Click here!</Button>
          <Modal>
            <h2>Alert One</h2>
            <Button>Close</Button>
          </Modal>
        </App>
      </ModalProvider>
    );
    expect(baseElement).toMatchInlineSnapshot(`
<body>
  <div>
    <div
      aria-hidden="true"
    >
      <h1>
        Welcome to my app, enjoy your stay.
      </h1>
      <button
        tabindex="-1"
      >
        Click here!
      </button>
    </div>
  </div>
  <div
    aria-hidden="false"
    role="dialog"
  >
    <h2>
      Alert One
    </h2>
    <button>
      Close
    </button>
  </div>
</body>
`);

    rerender(
      <ModalProvider>
        <App>
          <h1>Welcome to my app, enjoy your stay.</h1>
          <Button>Click here!</Button>
          <Modal>
            <h2>Alert One</h2>
            <Button>Close</Button>
          </Modal>
          <Modal>
            <h2>Alert Two</h2>
            <Button>Close</Button>
          </Modal>
        </App>
      </ModalProvider>
    );
    expect(baseElement).toMatchInlineSnapshot(`
<body>
  <div>
    <div
      aria-hidden="true"
    >
      <h1>
        Welcome to my app, enjoy your stay.
      </h1>
      <button
        tabindex="-1"
      >
        Click here!
      </button>
    </div>
  </div>
  <div
    aria-hidden="true"
    role="dialog"
  >
    <h2>
      Alert One
    </h2>
    <button
      tabindex="-1"
    >
      Close
    </button>
  </div>
  <div
    aria-hidden="false"
    role="dialog"
  >
    <h2>
      Alert Two
    </h2>
    <button>
      Close
    </button>
  </div>
</body>
`);

    rerender(
      <ModalProvider>
        <App>
          <h1>Welcome to my app, enjoy your stay.</h1>
          <Button>Click here!</Button>
          <Modal>
            <h2>Alert One</h2>
            <Button>Close</Button>
            <Modal>
              <h2>Submodal One</h2>
              <Button>Close</Button>
            </Modal>
          </Modal>
          <Modal>
            <h2>Alert Two</h2>
            <Button>Close</Button>
            <Modal>
              <h2>Submodal Two</h2>
              <Button>Close</Button>
            </Modal>
          </Modal>
        </App>
      </ModalProvider>
    );
    expect(baseElement).toMatchInlineSnapshot(`
<body>
  <div>
    <div
      aria-hidden="true"
    >
      <h1>
        Welcome to my app, enjoy your stay.
      </h1>
      <button
        tabindex="-1"
      >
        Click here!
      </button>
    </div>
  </div>
  <div
    aria-hidden="true"
    role="dialog"
  >
    <h2>
      Alert One
    </h2>
    <button
      tabindex="-1"
    >
      Close
    </button>
  </div>
  <div
    aria-hidden="true"
    role="dialog"
  >
    <h2>
      Alert Two
    </h2>
    <button
      tabindex="-1"
    >
      Close
    </button>
  </div>
  <div
    aria-hidden="true"
    role="dialog"
  >
    <h2>
      Submodal One
    </h2>
    <button
      tabindex="-1"
    >
      Close
    </button>
  </div>
  <div
    aria-hidden="false"
    role="dialog"
  >
    <h2>
      Submodal Two
    </h2>
    <button>
      Close
    </button>
  </div>
</body>
`);
  });
});
