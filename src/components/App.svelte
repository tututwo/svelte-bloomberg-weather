<script>
  import SVG from "./SVG.svelte"
  import * as d3 from "d3"
// import Axes from "./Axes.svelte";
/////////////// import data/////////////
  let data = []
  d3.csv('data/data.csv').then(d => data = d)

  $: dateParser = d3.timeParse("%Y%m")

///////////////create dimensions/////////
  let width = 0;
  let height = 0

///////////////create scales/////////////
  // time to x
  // $: timeScale = d3.scaleTime()
  //                     .domain([new Date("1880-01-01"), new Date("2021-03-30")])
  //                     .rangeRound([0, width])
 
  // year to x
  $: xScale = d3.scaleLinear([1879, 2022], [0, width])
                
  // value to y
  $: yScale = d3.scaleLinear([-2.5, 2.5], [height, 0])

  // value to color, then gradient
  $: console.log(height)
</script>


  <figure class = "chart-container" 
          bind:offsetWidth={width} bind:offsetHeight={height}>
    <SVG>
      <g class = 'dots'>
        {#each data as {Year, Value}}
          <circle cx = {xScale(Year)} cy = {yScale(Value)} r = 5 fill = "lightgrey" />
        {/each}
      </g>
    </SVG>
  </figure>


<style>
  /* 决定了画框的大小，画框的性质 */
  figure {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 420px;
    margin: 45px 60px 35px 4%;
    user-select: none;
  }


</style>