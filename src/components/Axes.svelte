
<!-- 整篇，两个：x,y，轴，是responsive,并且符合UX的，按照屏幕大小决定ticks的多少 -->

<script>
  import * as d3 from "d3";
  import { styleObjectToString as s } from '../js/modules/common.js';

  export const getXTickProps = props => {

    const {
      scale, 
      ticks = scale.ticks(4),
      range = scale.range()
    } = props
    // convert the tickvalue: year(1880, 2021 etc.)
    const getPosition = value => {
      const scaled = +scale(value); // px value
      if (scale.bandwidth) {
        return scaled + scale.bandwidth()/2
      }
      return scaled
    }
      // 把x的px值转换成百分比
    const innerScale = d3.scaleLinear(range, [0, 100])

    return ticks.map((tickValue, i, arr) => {
      const position = getPosition(tickValue)// 年份->px
      const percent = innerScale(position) //px -> 百分比

      // svg刻度线坐标
      const lineStyle = `
        position: absolute;
        top: 0;
        left: ${percent}%;
        height: 100%;
      `
      // tick text coordinates:changing the distance to top to change the y position of year ticks
      const textStyle = `
        position: absolute;
        top: 100%;
        left: ${percent}%

      `

      return {
        position, 
        tickValue,
        lineStyle,
        textStyle
      }
      // const lineStyle = ` `
    })   
  }

  export const getYTickProps = props => {
    const {
      scale,
      ticks = scale.ticks(4),
      range = scale.range()
    } = props

    const innerScale = d3.scaleLinear(range, [100, 0]) // 越是负数，离得越远

    return ticks.map((tickValue, i, arr) => {
      const position = +scale(tickValue)
      const percent = innerScale(position)

      const lineStyle = `
        position: absolute;
        left: 0;
        top: ${percent}%;
        width: 100%;
      `
      const textStyle = `
        position: absolute;
        left: 100%;
        top: ${percent}%
      `

      return {
        tickValue, 
        position, 
        lineStyle,
        textStyle
      }
    })
  }

//? why is export const not working
  let configInput = {}
  export { configInput as config };

  let tickProps = {}
  $: {
    const config = {
      x: {
        ...configInput.x
      },
      y: {
        ...configInput.y
      }
    }

    tickProps = {
    x: getXTickProps(config.x),// return text and linestyle
    y: getYTickProps(config.y)
    }
    // console.log(tickProps.y)
  }


$: console.log(Object.keys(tickProps).map(key => ({type: key, tickPropsArray: tickProps[key]})))

</script>
<style>

</style>
<div class = "axes">
  <!-- x轴：svg line：横坐标是position,纵坐标是full height -->
  {#each Object.keys(tickProps).map(key => ({type: key, tickPropsArray: tickProps[key]})) as {type, tickPropsArray}}
  
    <div class = {`${type} axis`}>
      <div class = "tick-containers">
        {#each tickPropsArray as {position, tickValue, lineStyle, textStyle}(tickValue)}
          <div class = "tick line" style = {lineStyle}>
            <svg style = {s({
              width: type === 'x' ? '2px' : '100%',
              height: type === 'x' ? '100%' : null
            })}>
              <line 
                x1 = {0.5}
                y1 = {0.5}
                x2 = {type === 'x' ? 0.5 : `100%`}
                y2 = {type === 'x' ? `100%` : 0.5} 
                stroke = "white"
                opacity = 0.2
              />
            </svg>
          </div>

          <div class = "tick-text" style = {textStyle}>
            <span class="main">{tickValue}</span>
          </div>
        {/each}
      </div>
    </div>
  
  {/each}
  
  <!-- y轴：svg line: 横坐标y position,纵坐标full width -->
    
  </div>