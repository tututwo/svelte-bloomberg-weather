<script>
  import SwoopyArrow from './SwoopyArrow.svelte';
  import { styleObjectToString } from '../js/modules/common.js';

  export let text = 'TK';
  export let points = [[300, 150], [700, 100], [800, 200]];

  export let textStyle = {};

  export let arrowProps = {
    color: 'white'
  };

  $: textPoint = points[0];
  $: textX = textPoint[0];
  $: textY = textPoint[1];

  $: finalTextStyle = styleObjectToString({
    left: `${textX}px`,
    top: `${textY}px`,
    ...textStyle
  });
</script>

<style>
  div {
    position: absolute;
  }
</style>

<div style={finalTextStyle}>
  <slot>{text}</slot>
</div>
<SwoopyArrow {points} {...arrowProps} />

