<script context="module">
  import { Delaunay } from 'd3-delaunay';

  export const getVoronoiPolygons = ({
    data,
    yAccessor,
    xAccessor,
    width,
    height
  }) => {
    const voronoi = Delaunay.from(data, xAccessor, yAccessor).voronoi([
      0,
      0,
      width,
      height
    ]);
    const polygons = data
      .map((datum, i) => {
        const pathString = voronoi.renderCell(i);
        if (!pathString) return null;
        if (!pathString.length) return null;
        return {
          pathString,
          data: datum
        };
      })
      .filter(d => d);
    return polygons;
  };
</script>

<script>
  import { afterUpdate } from 'svelte';
  import tooltips from '../js/modules/tooltips.js';
  export let data = [];
  export let name;
  export let width;
  export let height;
  export let orient = 'top';
  export let offset = 25;
  export let tooltipOrigin = ['center', 'bottom'];
  export let xAccessor = d => d.x;
  export let yAccessor = d => d.y;
  export let useTooltips = true;
  export let selector = 'path';
  export let onHide = () => {};
  export let debug = false;
  export let tooltipConfig = {};
  export let dataAttribues = d => {
    const out = {};
    Object.keys(d).forEach(key => {
      const dashes = key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
      out[`data-${dashes}`] = d[key];
    });
    return {
      'data-x-value': d.xValue,
      'data-y-value': d.yValue,
      'data-x': d.x,
      'data-y': d.y,
      ...out
    };
  };
  export let renderTooltip = (tooltip, el, data) => {
    const { xValue, yValue } = data;
    tooltip.innerHTML = `<div>TK TK: ${yValue}</div>`;
  };

  let polygons = [];

  $: if (width && height) {
    polygons = getVoronoiPolygons({
      data,
      xAccessor,
      yAccessor,
      width,
      height
    })
      .map((obj, i) => {
        const { pathString, data: datum } = obj;
        const dataProps = dataAttribues(datum);
        return {
          ...dataProps,
          d: pathString
        };
      })
      .filter(d => d);
  }

  export let getTooltipPosition = (tooltips, el, _, state) => {
    const dataset = el.dataset || {};
    const x = +dataset.x;
    const y = +dataset.y;
    return { x, y };
  };

  let parentRef;
  let didInitVoronoi = false;

  export let disableTooltips;

  export const initializeTooltips = () => {
    const voronoiChildren = parentRef.querySelectorAll(selector);
    if (voronoiChildren.length) {
      didInitVoronoi = true;
      let eventTarget = null;
      if (window.EventTarget) {
        eventTarget = new window.EventTarget();
        eventTarget.addEventListener(
          'hide',
          () => {
            onHide();
          },
          { passive: true }
        );
      }
      tooltips(voronoiChildren, {
        // class: 'dvz-tooltip-arrowed',
        class: name,
        orient: orient || null,
        offset: offset || null,
        tooltipOrigin: tooltipOrigin || null,
        display: (tooltip, state, event) => {
          if (!disableTooltips) {
            if (state.isDisplayed) return;
            state.isDisplayed = true;
            tooltip.classList.remove(state.hiddenClass);
            const el = state.targetEl(state, event);
            const data = state.dataFor(el, state, event);
            state.preRender(tooltip, el, data, state, event);
            state.render(tooltip, el, data, state, event);
            state.position(tooltip, el, state, event);
            state.postRender(tooltip, el, data, state, event);
            el.classList.add(state.activeClass);
          }
        },
        events: eventTarget,
        preRender: (tooltips, el, _, state) => {
          const position = getTooltipPosition(tooltips, el, _, state);
          const x = +position.x;
          const y = +position.y;
          if (isNaN(x) || isNaN(y)) {
            // console.warn('Voronoi missing data for element:', el);
            return;
          }
          const parentBounds = parentRef.getBoundingClientRect();
          const { left, top } = parentBounds;
          state.customPosition = [left + x, top + y];
        },
        render: renderTooltip,
        ...tooltipConfig
      });
    }
  };

  afterUpdate(() => {
    if (useTooltips && parentRef && !didInitVoronoi) {
      initializeTooltips();
    }
  });
</script>

<style>
  .container {
    position: relative;
    width: 100%;
    height: 100%;
  }
  path {
    fill: rgba(255, 255, 255, 0);
    stroke: none;
  }
  .debug svg {
    border: 2px dashed white;
  }
  .debug path {
    stroke: white;
    stroke-width: 2px;
  }
  svg {
    position: absolute;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>

<div class="voronoi container" class:debug bind:this={parentRef}>
  <slot>
    <svg>
      {#each polygons as props, index}
        <path {...props} />
      {/each}
    </svg>
  </slot>
</div>

