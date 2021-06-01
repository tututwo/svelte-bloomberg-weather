<script>
    import { onMount } from 'svelte';
    import * as d3 from '../js/modules/d3.js';
    import {
      styleObjectToString,
      getDataFromStore,
      monthNames
    } from '../js/modules/common.js';
    import Canvas from './Canvas.svelte';
    import SVG from './SVG.svelte';
    import SwoopyArrow from './SwoopyArrow.svelte';
    import Tooltips from './Tooltips.svelte';
    import { getSize } from './GreenNavMarquee.svelte';
    import { getColorScale } from './TemperatureChart.svelte';
  
    const s = styleObjectToString;
  
    let highlightedRect = null;
  
    export let data = [];
  
    export let events = [];
  
    onMount(async () => {
      data = await getDataFromStore({
        key: `temperature/temperature.csv`,
        parseResponse: response => {
          return response.text().then(string => d3.csvParse(string));
        }
      });
  
      const eventsRaw = await fetch('./data/temperature/timeline-events.csv')
        .then(res => res.text())
        .then(text => d3.csvParse(text));
  
      events = eventsRaw.map(row => {
        const { SmallFlip, Show, Note, Date: _Date } = row;
        let show_ = false;
        let smallFlip_ = false;
        try {
          show_ = JSON.parse(Show.toString().toLowerCase());
          smallFlip_ = JSON.parse(SmallFlip.toString().toLowerCase());
        } catch (err) {}
        const parsedDate = new Date(_Date);
        let month, year;
        if (!isNaN(parsedDate)) {
          month = parsedDate.getUTCMonth() + 1;
          year = parsedDate.getUTCFullYear();
        }
        return {
          parsedDate,
          year,
          month,
          text: Note,
          show: show_,
          smallFlip: smallFlip_,
          rawData: row
        };
      });
    });
  
    const VERTICAL_BREAKPOINT = 600;
  
    let offsetWidth;
    let offsetHeight;
    let containerRef;
  
    onMount(() => {
      return getSize({
        target: containerRef,
        onSize: ({ width, height }) => {
          offsetWidth = width;
          offsetHeight = height;
        }
      });
    });
  
    let orientation;
    let isVertical;
  
    let divStyle = '';
    let containerStyle = '';
  
    $: if (offsetWidth) {
      const isMobile = offsetWidth < VERTICAL_BREAKPOINT;
      orientation = isMobile ? 'vertical' : 'horizontal';
      isVertical = orientation === 'vertical';
    }
  
    let rectProps = [];
  
    let voronoiData = [];
  
    const getValue = d => +d.value;
    const getYear = d => +d.year;
    const getMonth = d => +d.month;
  
    $: valueExtent = d3.extent(data, getValue);
    $: yearExtent = d3.extent(data, getYear);
    $: monthExtent = d3.extent(data, getMonth);
  
    $: [yearMin, yearMax] = yearExtent;
  
    $: [valueMin, valueMax] = valueExtent;
  
    $: yearsArray = d3.range(yearMin, yearMax + 1);
  
    $: numYears = yearMax - yearMin + 1;
    $: numMonths = 12;
  
    $: cellWidth = offsetWidth / (isVertical ? numMonths : numYears);
    $: cellHeight = offsetHeight / (isVertical ? numYears : numMonths);
  
    $: xScale = d => {
      const { year, month, value } = d;
      const yearIndex = year - yearExtent[0];
      const monthIndex = month - 1;
      const left = cellWidth * (isVertical ? monthIndex : yearIndex);
      return left;
    };
  
    $: colorScale = getColorScale({ valueMin, valueMax });
  
    $: colorDomain = colorScale.domain();
  
    $: colorRange = colorScale.range();
  
    $: colorDomainStart = colorDomain[0];
  
    $: colorDomainEnd = colorDomain[colorDomain.length - 1];
  
    //`linear-gradient(to right, #efefef, #fff9a6, #ffeb50, #ffbe1e, #ff6200, #d90030)`
    $: gradientColorStops = colorRange.map(d => d.toString()).join(', ');
  
    $: if (offsetHeight) {
      const gridCellObject = {};
      data.forEach(d => {
        const { year, month } = d;
        gridCellObject[year] = gridCellObject[year] || {};
        gridCellObject[year][month] = d.value;
      });
  
      const vData = [];
  
      rectProps = data.map(d => {
        const { year, month, value } = d;
        const yearIndex = year - yearExtent[0];
        const monthIndex = month - 1;
        const left = xScale(d);
        const top = cellHeight * (isVertical ? yearIndex : monthIndex);
        const width = cellWidth;
        const height = cellHeight;
        const color = isNaN(value) || value === null ? 'none' : colorScale(value);
  
        vData.push({
          x: left + width / 2,
          y: top + height / 2,
          year,
          month,
          color,
          value,
          width,
          height
        });
  
        return {
          x: left,
          y: top,
          width,
          height,
          key: `${year}-${month}`,
          color,
          style: `fill: ${color}; stroke: ${color};`
        };
      });
  
      voronoiData = vData;
    }
  
    let draw = () => {};
  
    $: {
      draw = ({ context }) => {
        rectProps.forEach(rect => {
          const { x, y, width, height, color } = rect;
          context.fillStyle = color;
          context.strokeStyle = color;
          context.fillRect(x, y, width, height);
          // context.strokeRect(x, y, width, height);
        });
      };
    }
  
    $: draw2 = ({ context }) => {
      if (highlightedRect) {
        // console.log(highlightedRect)
        context.beginPath();
        context.rect(
          highlightedRect.x - highlightedRect.width / 2,
          highlightedRect.y - highlightedRect.height / 2,
          highlightedRect.width,
          highlightedRect.height
        );
        context.strokeStyle = '#000';
        context.lineWidth = 2;
        context.stroke();
      }
    };
  
    let annotations = [];
  
    $: if (data && offsetWidth) {
      // Get rects that we want to highlight
  
      const eventAnnotations = events
        .filter(d => d.show)
        .filter(d => d.year && d.month)
        .map(d => {
          const { year, month, text, smallFlip } = d;
          const key = `${year}-${month}`;
          return { key, text, smallFlip };
        });
  
      let rectAnnotations = [];
      eventAnnotations.forEach(config => {
        const { key, text, smallFlip } = config;
        const found = rectProps.find(d => d.key === key);
        if (!found) return;
        const { x, y, width, height } = found;
        const annotation = rectAnnotations.push({
          type: 'rect',
          props: {
            x,
            y,
            width,
            height
          }
        });
        rectAnnotations.push({
          type: 'text',
          props: {
            style: styleObjectToString({
              top: `${isVertical ? y + height : y}px`,
              marginTop: `${isVertical ? 5 : 0}px`,
              marginLeft: `${isVertical ? 0 : 5}px`,
              left: `${isVertical ? x : x + width}px`
            })
          },
          text,
          smallFlip
        });
      });
      annotations = [
        ...rectAnnotations
        // {
        //   type: 'arrow',
        //   props: {
        //     points: [[0, 0], [40, 50], [5, 100]].reverse().map(([x, y]) => {
        //       const root = {
        //         x: offsetWidth * 0.2,
        //         y: offsetHeight * 0.2
        //       };
        //       return [root.x + x, root.y + y];
        //     })
        //   }
        // }
      ];
    }
    let xTickProps = [];
    let yTickProps = [];
  
    let allTickProps = [];
  
    $: {
      const monthTickProps = (() => {
        const numMonthTicks = 3;
        const tempScale = d3.scaleLinear([1, 13], [0, 100]);
        const ticks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        // const monthNamesArray = isVertical
        //   ? monthNames.shortMonths
        //   : monthNames.months;
        const monthNamesArray = monthNames.tinyMonths;
        return ticks.map(monthNumber => {
          return {
            percent: tempScale(monthNumber),
            text: monthNamesArray[monthNumber - 1]
          };
        });
      })();
      const yearTickProps = (() => {
        const numYearTicks = 10;
        const tempScale = d3.scaleLinear([yearMin, yearMax + 1], [0, 100]);
        const ticks = tempScale.ticks(numYearTicks);
        return ticks.map(year => {
          return {
            percent: tempScale(year),
            text: year
          };
        });
      })();
      const tickHeight = 0;
      const xTickProps_ = isVertical ? monthTickProps : yearTickProps;
      const y2 = offsetHeight * tickHeight;
      xTickProps = xTickProps_.map(obj => {
        const { percent, text } = obj;
        return {
          html: `
          <div class="tick-text" style="${s({
            position: 'absolute',
            left: `${percent}%`,
            color: 'black',
            transform: `translate(-50%, -100%)`,
            fontSize: `14px`
          })}"><span>${text}</span></div>
          <svg style="${s({
            position: 'absolute',
            left: `${percent}%`,
            overflow: 'visible',
            width: '2px',
            height: '2px'
          })}">
            <line x1="0.5" y1="-7" x2="0.5" y2="${
              isNaN(y2) ? '0' : y2
            }" stroke="rgba(0, 0, 0, 0.5)" stroke-width="0.5" />
          </svg>
        `
        };
      });
  
      const yTickMargin = 0;
      const yTickWidth = 0;
  
      const yTickProps_ = isVertical ? yearTickProps : monthTickProps;
      yTickProps = yTickProps_.map(obj => {
        const { percent, text } = obj;
        // const yTickLine = `
        //   <svg style="${s({
        //     position: 'absolute',
        //     top: `${percent}%`,
        //     overflow: 'visible',
        //     width: '1px',
        //     height: '1px'
        //   })}">
        //     <line  x1="-7" y1="0.5" x2="${offsetWidth}" y2="0.5" stroke="rgba(0, 0, 0, 0.8)" stroke-width="0.5" />
        //   </svg>`;
        return {
          html: `
          <div class="tick-text" style="${s({
            position: 'absolute',
            top: `${percent}%`,
            color: 'black',
            transform: `translate(calc(-100% - 14px), calc(-50% + ${cellHeight *
              0.5}px))`,
            fontSize: `14px`
          })}"><span>${text}</span></div>
        `
        };
      });
  
      allTickProps = [...xTickProps, ...yTickProps];
    }
  </script>
  
  <style>
    /* MOBILE */
    .chart-container {
      position: relative;
      height: 700px;
      /* MOBILE MARGIN */
      margin: 20px 40px 0px 70px;
    }
    :global(.custom-ticks div) {
      font-size: 12px;
    }
    .foreground rect {
      fill: none;
      stroke: black;
    }
    .foreground .text {
      position: absolute;
      color: black;
      font-family: var(--font-family, sans-serif);
      font-size: 10px;
      line-height: 1;
      max-width: 103px;
      text-shadow: 0 0 3px rgba(255, 255, 255, 1);
  
      /*    text-shadow: -0.5px -0.5px 0 white,
         0   -0.5px 0 white,
         0.5px -0.5px 0 white,
         0.5px  0   0 white,
         0.5px  0.5px 0 white,
         0    0.5px 0 white,
        -0.5px  0.5px 0 white,
        -0.5px  0   0 white;*/
    }
  
    @media only screen and (max-width: 1170px) and (min-width: 720px) {
      [data-small-flip='true'] {
        transform: translateX(-115%);
        text-align: right;
      }
  
      div.foreground > div:nth-child(13) {
        max-width: 90px !important;
      }
    }
  
    @media only screen and (max-width: 720px) {
      .foreground .text {
        max-width: 72px;
      }
      .foreground .text[data-small-flip='true'] {
        transform: translateY(-150%);
      }
      /*.foreground .text[data-small-flip="true"]:nth-of-type(1) {*/
      div.foreground > div:nth-child(10) {
        transform: translateY(-120%) !important;
      }
    }
  
    .legend-container {
      /* height: 50px; */
    }
  
    .legend {
      font-size: 14px;
      top: 0px;
      width: 70%;
      padding-left: 36px;
      padding-top: 7px;
      padding-bottom: 7px;
    }
  
    .legend-inner {
      position: relative;
      width: 100%;
      height: 20px;
      /* border: 1px dashed pink; */
    }
    .legend .label.start {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateX(calc(-100% - 7px)) translateY(-50%);
    }
    .legend .label.end {
      position: absolute;
      white-space: nowrap;
      top: 50%;
      left: 100%;
      transform: translateX(7px) translateY(-50%);
    }
    .legend .title {
      /* position: absolute; */
      white-space: nowrap;
      /* transform: translateY(-85%); */
    }
  
    /* DESKTOP */
    @media only screen and (min-width: 700px) {
      .legend {
        padding-top: 7px;
        padding-bottom: 10px;
      }
      .chart-container {
        height: 300px;
        margin: 35px 70px 0px 50px;
      }
      :global(.custom-ticks div) {
        font-size: 14px;
      }
      .foreground .text {
        font-size: 14px;
      }
    }
  </style>
  
  <div data-type="TemperatureHeatMap">
    <div class="copy-width legend-container">
      <div class="legend">
        <div class="legend-inner">
          <div class="label start">
            {colorDomainStart.toString().replace(/-/, '–')}°C
          </div>
          <div
            style={s({
              height: `13px`,
              position: 'relative',
              top: '50%',
              transform: `translateY(-55%)`,
              width: `100%`,
              height: `15px`,
              background: `linear-gradient(to right, ${gradientColorStops})`
            })} />
          <div class="label end">
            +{colorDomainEnd.toString().replace(/-/, '–')}°C
          </div>
        </div>
      </div>
    </div>
    <div class="chart-container" bind:this={containerRef}>
      <Canvas {draw} useWebGL={false} />
      <Canvas draw={draw2} />
      <div class="foreground">
        <div class="custom-ticks">
          {#each allTickProps as { html }}
            {@html html}
          {/each}
        </div>
        <SVG>
          {#each annotations.filter(d => d.type === 'rect' || d.type === 'arrow') as { type, props }}
            {#if type === 'arrow'}
              <SwoopyArrow {...props} color="black" />
            {/if}
            {#if type === 'rect'}
              <rect {...props} />
            {/if}
          {/each}
        </SVG>
        {#each annotations.filter(d => d.type === 'text') as { smallFlip, text, props }}
          <div {...props} data-small-flip={smallFlip} class="text">
            {@html text}
          </div>
        {/each}
        <Tooltips
          data={voronoiData}
          renderTooltip={(tooltip, el, data) => {
            const { year, month, value, x, y, width, height, color } = data;
            let diff = 0;
            diff = value > 0 ? '+' + value : value;
            const dateItem = d3.timeParse('%Y-%_m')(year + '-' + month);
            const dateString = d3.timeFormat('%b %Y')(dateItem);
            tooltip.innerHTML = `<div>
            <div class="value" style="color: ${color};">${diff}° C</div>
            <div>${dateString} </div>
          </div>`;
            highlightedRect = { x, y, width, height };
          }}
          width={offsetWidth}
          height={offsetHeight}
          onHide={() => {
            highlightedRect = null;
          }}
          debug={false} />
      </div>
    </div>
  </div>
  