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
  $: yScale = d3.scaleLinear([-3, 2.5], [height, 0])
  // value to x
  $: [valueMin, valueMax] = yScale.domain()
  $: colorScale = getColorScale({valueMin, valueMax})

  $: radius = xScale.bandwidth() / 3

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
  </figure>

 

<style>

  .chart-container {
    position: relative;
    
  }
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