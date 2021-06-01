<script context="module">
  import * as d3 from "d3";

  export const getColorScale = ({ valueMin, valueMax }) => {
    const colorDomain = [-1, -0.5, 0, 0.5, 1];
    const colorRange = [
      '#009fe4',
      '#00f3e5',
      '#efefef',
      '#ff6200',
      '#ff008c'
    ].map(string => d3.color(string).copy({ opacity: 1 }));
    const colorScale = value => {
      const interpolated = d3.scaleLinear([valueMin, 0, valueMax], [-1, 0, 1])(
        +value
      );
      const color = d3.scaleLinear(colorDomain, colorRange)(interpolated);
      return color;
    };
    colorScale.domain = () => colorDomain;
    colorScale.range = () => colorRange;
    return colorScale;
  }
</script>

<script>
  import { getDataFromStore } from '../js/modules/common';
  import { onMount, tick } from "svelte";
  import { gsap } from "gsap";



  import SVG from "./SVG.svelte"
  import Axes from "./Axes.svelte"
  import ToolTips from "./Tooltips.svelte"


// import Axes from "./Axes.svelte";
/////////////// import data/////////////
  let data = []
  // d3.csv('data/data.csv').then(d => data = d)
  // $: dateParser = d3.timeParse("%Y%m")


  onMount(async () => {
    data = await getDataFromStore({
      key: `data/data.csv`,
      parseResponse: response => {return response.text().then(string => d3.csvParse(string))}
    });
    await tick();
    gsap.timeline()
        .from('circle', {
          duration: 3,
          opacity: 0,
          ease: "power1.out",
          stagger: {
            amount: 3,
            grid: "auto"
            
          }
        })

    
  })

  
///////////////create dimensions/////////
  let width = 0;
  let height = 0

///////////////create scales/////////////
  // time to x
  // $: timeScale = d3.scaleTime()
  //                     .domain([new Date("1880-01-01"), new Date("2021-03-30")])
  //                     .rangeRound([0, width])
 
  // year to x
  $: xScale = d3.scaleBand(d3.range(1879, 2022), [0, width])
  // value to y
  $: yScale = d3.scaleLinear([-2.5, 2.5], [height, 0])
  // value to x
  $: [valueMin, valueMax] = yScale.domain()
  $: colorScale = getColorScale({valueMin, valueMax})

  $: radius = xScale.bandwidth() / 3

  // data
  const xAccessor = d => +d.year;
  const yAccessor = d => +d.value
  $: voronoiData = data.map((d,i) => {

    const x = xScale(xAccessor(d))
    const y = yScale(yAccessor(d))
    const year = xAccessor(d)
    const value = yAccessor(d)
    return {
      x,
      y,
      year,
      value
    }
  })

  // value to color, then gradient

  $: xTicks = d3.scaleLinear([1879, 2022], [0, width])
                .ticks(10)

/////////////peripherals: axes///////////

  $: axisConfig = {
    x: {
      scale: xScale,
      ticks: xTicks
    },
    y:{
      scale: yScale
    }
  }

  // tooltip
  let animationDidEnd = false
  onMount(() => {
    setTimeout(() => {
      animationDidEnd = true;
    }, 1000);
  });
</script>

  
  <figure class = "chart-container" 
          bind:offsetWidth={width} bind:offsetHeight={height}>
    <SVG>
      <g class = 'dots'>
        {#each data as {year, value}}
        <g class = "dot">
          <circle cx = {xScale(year)} cy = {yScale(value)} r = {radius} fill = {colorScale(value)} />
        </g>
        {/each}
      </g>
    </SVG>

    <Axes config = {axisConfig}/>
<!-- 
    {#if animationDidEnd}
      <ToolTips 
        data = {voronoiData}
        {width}
        {height}
      />
    {/if} -->
  </figure>

 

<style>
  /* 决定了画框的大小，画框的性质 */
  .chart-container {
    position: relative;
    --tick-text-color: white; 
    box-sizing: border-box;
    height: 60vh;
    margin: 45px 60px 35px 4%;
    border-color: coral
  }



</style>