<script>
  import { onMount } from 'svelte';
  import { styleObjectToString } from '../js/modules/common.js';
  import SVG from './SVG.svelte';
  export let color = "black";

  let markerID = 'arrowhead';

  onMount(() => {
    markerID = `arrowhead-${Math.floor(Math.random() * 10e3)}`;
  });

  $: style = styleObjectToString({
    overflow: 'visible',
    '--color': color
  });

  // Adapted from: https://github.com/1wheel/swoopy-drag/blob/gh-pages/index.js
  function distance(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  }
  const calculateCirclePath = function calcCirclePath(points) {
    const a = [points[0].x, points[0].y];
    const b = [points[2].x, points[2].y];
    const c = [points[1].x, points[1].y];
    const A = distance(b, c);
    const B = distance(c, a);
    const C = distance(a, b);
    let angle = Math.acos((A * A + B * B - C * C) / (2 * A * B));
    if (isNaN(angle)) {
      angle = 1;
    }
    // calc radius of circle
    const K = 0.5 * A * B * Math.sin(angle);
    let r = (A * B * C) / 4 / K;
    r = Math.round(r * 1000) / 1000;
    if (isNaN(r)) {
      r = 0;
    }
    // large arc flag
    const laf = +(Math.PI / 2 > angle);
    // sweep flag
    const saf = +(
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) <
      0
    );
    const pathData = ['M', a, 'A', r, r, 0, laf, saf, b].join(' ');
    if (pathData.includes('NaN')) {
      console.warn(`calcCirclePath: Path data includes "NaN"`);
      console.log(`pathData:`, pathData);
      console.log(`points:`, points);
      return '';
    }
    return pathData;
  };

  export let points = [[10, 10], [50, 50], [100, 40]];

  $: currentPoints = points.map(([x, y]) => {
    return {
      x,
      y
    };
  });

  $: pathDataString = calculateCirclePath(currentPoints);
</script>

<style>
  path {
    fill: none;
    stroke: var(--color, red);
  }
  path.arrowhead {
    fill: var(--color, red);
  }
</style>

<SVG {style}>
  <g class="swoopy-arrow">
    <marker
      id={markerID}
      viewBox={`-10 -10 20 20`}
      markerWidth={20}
      markerHeight={20}
      orient="auto">
      <path class="arrowhead" d={`M-6.75,-6.75 L 0,0 L -6.75,6.75`} />
    </marker>
    <path d={pathDataString} marker-end={`url(#${markerID})`} />
  </g>
</SVG>

