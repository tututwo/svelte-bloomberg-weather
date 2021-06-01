<script context="module">
  import { Delaunay } from "d3-delaunay"

// returns d for each voronoi path to be hovered on
  export const getVoronoiPolygons = ({
    data,
    xAccessor,
    yAccessor,
    width,
    height
  }) => {
    const voronoi = Delaunay.from(data, xAccessor, yAccessor).voronoi([0,0,width, height])
    const polygons = data.map((d,i) => {
      const pathString = voronoi.renderCell(i)
      return{
        pathString,
        data: d
      }
    })

    return polygons
  }


</script>

<script>

  import tooltip from "../js/modules/tooltip"
  import tippy,{followCursor} from "tippy.js"
  import '../custom_theme/temperature.css'


  export let data = [];
  export let width;
  export let height;
  export let xAccessor = d => d.x;
  export let yAccessor = d => d.y;

  let parentRef

//////////////////////////// returns d for each voronoi path to be hovered on ////////////////////////////
  let polygons = []
  $: if (width && height) {
    polygons = getVoronoiPolygons({data, xAccessor,yAccessor,width,height}).map((obj, i) => {
      const {pathString:d, data:d_point} = obj
      // console.log(obj)
      return {d_point,
              d}
    })
  }
  // $: console.log(polygons)

//////////////////////////// tooltip position////////////////////////////

// closure
// const tooltip = d3.select("#tooltip")
// function onMouseEnter(d_point) {
//   const {x, y, year, value} = d_point
//   return ()=>{
//     tooltip.style("transform", `translate(${x}px, ${y}px)`)
//     const text = tooltip.select("#date")
//           .text("asd")
//     console.log(document.querySelector('#date'))
//   }
// }

//
</script>

<div class = "voronoi container" bind:this = {parentRef}>
  <svg>
    {#each polygons as {d_point,d}, i}
      <path
        use:tooltip = {{
          content: `<div>
                      <div class="value" style = "color: ${d_point.color}">${d_point.value}°C</div>
                      <div>${d_point.year}</div>
                    </div>`,
          allowHTML: true,
          followCursor: 'initial',
          plugins: [followCursor],
          delay: [0, 0],
          duration: [100, 0], // duration 才是治理延迟，连城string的tooltip的
          moveTransition: 'transform 0.1s ease-out',
          theme: 'temperature'
          }}
        
        {d} 
        />
    {/each}
  </svg>

  <div id = "tooltip">
    <div class = "tooltip-temperature">
      <span id = "temperature"></span>
    </div>
    <div class = "tooltip-date">
      <span id = "date"></span>
    </div>
  </div>
</div>

<style>
  .container {
    position: relative;
    width: 100%;
    height: 100%
  }
  path {
    fill: rgba(255, 255, 255, 0);
    stroke: none;
  }
  svg {
    position: absolute;
    display: block;
    width: 100%;
    height: 100% 
  }


</style>