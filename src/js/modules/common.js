import { get } from 'svelte/store';
import { data as dataStore } from './stores';
import * as d3 from 'd3';

export const s3Path = 'https://raw.githubusercontent.com/tututwo/svelte-bloomberg-weather/main/public';

export const getDataFromStore = async ({
  key,
  path = s3Path,
  parseResponse
}) => {
  let data = get(dataStore)[key];// usually undefined
  if (!data) {
    const url = `${path}/${key}`;
    data = await fetch(url).then(parseResponse);
    dataStore.update(obj => {return {...obj,[key]: data}});
  }
  return data;
};

/** See: https://stackoverflow.com/a/45205645/502331 */
export const styleObjectToString = obj => {
  return {
    ...obj,
    toString: () => {
      let string = '';
      Object.keys(obj).forEach(key => {
        const styleName = key.replace(
          /[A-Z]/g,
          match => `-${match.toLowerCase()}`
        );
        const styleValue = obj[key];
        if (typeof styleValue !== undefined && styleValue !== null) {
          string = `${string}${styleName}: ${styleValue};\n`;
        }
      });
      return string;
    }
  };
};

export const monthNames = {
  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ],
  shortMonths: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ],
  tinyMonths: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
};

export const colors = {
  green: d3.color(`rgb(20, 235, 30)`)
};

export const fonts = {
  'haas-text': `'BWHaasDingbat', 'BWHaasText', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
  'haas-head': `'BWHaasDingbat', 'BWHaasHead', 'Helvetica Neue', Helvetica, Arial, sans-serif`
};

export const getChartProps = props => {
  let {
    debug = false,
    data = [],
    xAccessor,
    yAccessor,
    xMin = d3.min(data, xAccessor),
    yMin = d3.min(data, yAccessor),
    xMax = d3.max(data, xAccessor),
    yMax = d3.max(data, yAccessor),
    xExtent = [xMin, xMax],
    yExtent = [yMin, yMax],
    xDomain = xExtent,
    yDomain = yExtent,
    width = 100,
    height = 100,
    xRange = [0, width],
    yRange = [height, 0],
    viewBox = `0 0 ${width} ${height}`,
    xScaleFunction = d3.scaleLinear,
    yScaleFunction = d3.scaleLinear,
    xScaleNice = false,
    yScaleNice = false,
    xNumTicks = 3,
    yNumTicks = 3,
    xScale = xScaleFunction(xDomain, xRange),
    yScale = yScaleFunction(yDomain, yRange),
    mapData = d => {
      const xValue = xAccessor(d);
      const yValue = yAccessor(d);
      const x = xScale(xValue);
      const y = yScale(yValue);
      return {
        xValue,
        yValue,
        x,
        y
      };
    },
    mapped = data.map(mapData)
  } = props;
  if (debug) {
    console.log('getChartProps debug:', props);
  }
  if (xScaleNice) xScale = xScale.nice(xNumTicks);
  if (yScaleNice) yScale = yScale.nice(yNumTicks);
  return {
    ...props,
    xScale,
    yScale,
    xMin,
    yMin,
    mapData,
    mapped,
    viewBox
  };
};

