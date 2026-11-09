import { Canvas, Circle, Group, LinearGradient, Path, Rect, Skia, vec } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

const RAINBOW = ['#ff8a80', '#ffc46b', '#fff07a', '#8fe39a', '#7cc4ff', '#b39dff'];

interface Props {
  sky: [string, string];
  /** Equipped background asset key, if any. */
  background?: string;
  /** Size to draw at; defaults to the full window. */
  width?: number;
  height?: number;
  /** Rainbow centre as a fraction of the height. */
  rainbowCenter?: number;
}

function SkyImpl({ sky, background, width, height, rainbowCenter = 0.5 }: Props) {
  const win = useWindowDimensions();
  const w = width ?? win.width;
  const h = height ?? win.height;
  const full = width === undefined;

  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        x: (i * 97.3) % w,
        y: (i * 61.7) % (h * 0.85),
        r: (i % 3) * 0.5 + 0.6,
        o: 0.35 + (i % 4) * 0.15,
      })),
    [w, h],
  );
  const moon = useMemo(() => {
    const m = Math.min(w, h) * 0.07;
    const mx = w * 0.8;
    const my = h * 0.1 + m;
    return Skia.Path.MakeFromSVGString(`M${mx} ${my - m} A${m} ${m} 0 1 0 ${mx} ${my + m} A${m * 0.72} ${m} 0 1 1 ${mx} ${my - m}Z`);
  }, [w, h]);
  const arcs = useMemo(() => {
    const cx = w / 2;
    const cy = h * rainbowCenter;
    const sw = w * 0.036;
    return RAINBOW.map((color, i) => {
      const r = w * 0.47 - i * sw;
      return { color, sw, path: Skia.Path.MakeFromSVGString(`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`) };
    });
  }, [w, h, rainbowCenter]);

  return (
    <Canvas style={full ? StyleSheet.absoluteFill : { width: w, height: h, position: 'absolute' }} pointerEvents="none">
      <Rect x={0} y={0} width={w} height={h}>
        <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={sky} />
      </Rect>
      {background === 'stars' && (
        <Group>
          {stars.map((s, i) => <Circle key={i} cx={s.x} cy={s.y} r={s.r} color="#ffffff" opacity={s.o} />)}
          {moon && <Path path={moon} color="#fff4cc" />}
        </Group>
      )}
      {background === 'rainbow' && (
        <Group opacity={0.7}>
          {arcs.map((a) => a.path && <Path key={a.color} path={a.path} style="stroke" strokeWidth={a.sw + 0.5} color={a.color} />)}
        </Group>
      )}
    </Canvas>
  );
}

export const SkyBackground = memo(SkyImpl);
