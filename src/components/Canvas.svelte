<script context="module">
  export const scaleCanvas = ({
    canvas,
    width,
    height,
    contextAttributes = {}
  }) => {
    const dpi = window.devicePixelRatio;
    canvas.width = width * dpi;
    canvas.height = height * dpi;
    canvas.style.width = `${width}px`;
    const context = canvas.getContext('2d', contextAttributes);
    context.scale(dpi, dpi);
    return context;
  };
</script>

<script>
  import { onMount } from 'svelte';
  import { getSize } from './GreenNavMarquee.svelte';

  export let draw = ({ canvasWidth, canvasHeight, context }) => {};
  export let contextAttributes = {};
  export let onContext = () => {};
  export let onSize = () => {};

  let containerRef;
  let canvasRef;
  let context;
  let canvasWidth;
  let canvasHeight;

  onMount(() => {
    return getSize({
      target: containerRef,
      onSize: ({ width, height }) => {
        canvasWidth = width;
        canvasHeight = height;
        onSize({
          canvasWidth,
          canvasHeight,
          width: canvasWidth,
          height: canvasHeight
        });
      }
    });
  });

  // $: if (canvasWidth) {
  //   onSize({
  //     canvasWidth,
  //     canvasHeight,
  //     width: canvasWidth,
  //     height: canvasHeight
  //   });
  // }

  $: if (context) {
    onContext({
      context
    });
  }

  $: if (canvasRef && canvasWidth) {
    context = scaleCanvas({
      canvas: canvasRef,
      width: canvasWidth,
      height: canvasHeight,
      contextAttributes
    });
    draw({
      context,
      canvasWidth,
      canvasHeight,
      width: canvasWidth,
      height: canvasHeight
    });
  }
</script>

<style>
  .canvas-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>

<div class="canvas-container" bind:this={containerRef}>
  <canvas bind:this={canvasRef} />
</div>

