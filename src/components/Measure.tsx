import {
  useState,
  useLayoutEffect,
  useRef,
  type ReactNode,
  Children,
} from "react";

export interface ElementDimensions {
  width: number;
  height: number;
}

interface MeasureProps {
  elements: ReactNode[];
  children: (dimensions: ElementDimensions[]) => ReactNode;
}

/**
 * A component that measures the dimensions of a list of React elements
 * before rendering its children.
 *
 * It works by rendering the elements in a hidden, off-screen div,
 * capturing their dimensions with refs, and then invoking the `children`
 * render prop with an array of those dimensions.
 */
export function Measure({ elements, children }: MeasureProps) {
  const [dimensions, setDimensions] = useState<ElementDimensions[]>(
    Array(elements.length).fill({ width: 0, height: 0 })
  );
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const newDimensions = refs.current.map((el) => ({
        width: el?.offsetWidth ?? 0,
        height: el?.offsetHeight ?? 0,
    }));
    // Prevent infinite loops by only updating if the dimensions have actually changed.
    if (
      JSON.stringify(newDimensions) !== JSON.stringify(dimensions)
    ) {
      setDimensions(newDimensions);
    }
  }, [elements, dimensions]);

  return (
    <>
      {/* Off-screen measurement container */}
      <div
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        {Children.map(elements, (element, index) => (
          <div
            ref={(el) => (refs.current[index] = el)}
            style={{ display: "inline-block" }}
          >
            {element}
          </div>
        ))}
      </div>

      {/* Render the actual content once measurements are available */}
      {dimensions.some(d => d.width > 0) ? children(dimensions) : null}
    </>
  );
}
