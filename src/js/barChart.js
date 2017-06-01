/**
  * Used for drawing barcharts.
  * Barchart class definition.
  *
  * @param {String} element - Name of the element to which graph is to be drawn.
  * @param {Object} data - Data for which graph is to be drawn
  * @param {Object} options - Other options that can be added to the graph.
  *     {String} options.title - Title of the graph
  *     {Object} options.transition - Details about the transition.
  *       {Boolean} options.transition.animate - Whether animation needed or not.
  *       {String} options.transition.type - Type of the animation required.
  *     {Object} options.margin - Margin to the SVG canvas area.
  *       {Integer} options.margin.top - Top margin.
  *       {Integer} options.margin.bottom - Bottom margin.
  *       {Integer} options.margin.left - Left margin.
  *       {Integer} options.margin.right - Right margin.
  *     {String} options.title - Title of the graph
  *     {Integer} options.barWidth - Width of each bar of the graph
  *     {Boolean} options.tooltip - Whether tooltip is needed or not.
  */
var BarChart = function(element, data, options) {

  var _this = this;

  // Set all the parameter values to global scope
  _this.setValues(element, data, options);

  // Range of x and y axis values.
  _this.xExtent = _this.xExtentCalculate(_this.data);
  _this.yExtent = _this.yExtentCalculate(_this.data);

  _this.drawBarChart('bar');

  // Redraw the graph when window size is altered so as to make it responsive.
  window.addEventListener('resize', function(event) {
    _this.redrawGraph(element, data, options);
  });

};


// Cloning the baseclass `Chart` so as to access all its methods.
BarChart.prototype = Object.create(Chart.prototype);

BarChart.prototype.redrawGraph = function(element, data, options) {
  var _this = this;
  _this.setValues(element, data, options);
  _this.drawBarChart('bar');
}

/**
  * Function which finds the X Axis ticks from the data provided.
  * @return {Array} - An array which contains all x Axis ticks.
  */
BarChart.prototype.xExtentCalculate = function(data) {
  return data.map(function(d) { return d[0]; });
};

/**
  * Function which finds the range of Y Axis values from the data provided.
  * @return {Array} - An array which contains minimum and maximum value.
  */
BarChart.prototype.yExtentCalculate = function(data) {
  return [0, d3.max(data, function(d) { return d[1]; })];
};

/**
  * Draws Barchart according to user input.
  * @param {Integer} barWidth - User defined width of each bar.
  */
BarChart.prototype.drawBarChart = function(type) {

  var _this  = this,
      margin = _this.margin;

  // Calls the base class function to draw canvas.
  _this.drawChart();
  console.log('HEIGHT', _this.height);
  // Display svg only in the graph area.
  _this.plot.append('clipPath')
            .attr('id', 'bar-clip')
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', _this.width)
            .attr('height', _this.height - (margin.bottom + CONSTANTS.DEFAULT_MARGIN.BOTTOM));

  _this.checkGoalLine();
  _this.createBars(type, _this.data);
  _this.checkTransition();
  _this.checkTooltip(type);

};

/**
  * Create the element for bars checking whether it is normal or stacked graph.
  * @param {String} type - Type of the graph (stack/bar)
  */
BarChart.prototype.createBars = function(type, data) {

  var _this = this,
      bar   = _this.options.bar ? _this.options.bar : CONSTANTS.BAR;

  switch (type) {
    case 'bar':
      var barPlot = _this.plot.append('g')
                              .attr('class', 'bars');

      _this.bar = barPlot.selectAll('bar')
                          .data(data)
                          .enter()
                          .append('path')
                          .attr('class', 'bar')
                          .attr('fill', bar.color);
      break;
    case 'stack':
      _this.groups = _this.plot.selectAll('g.stack')
                               .data(_this.stack_data)
                               .enter()
                               .append('g')
                               .style('fill', function(d, i) { return _this.color[i]; });

      _this.rect = _this.groups.selectAll('path')
                               .data(function(d) { return d; })
                               .enter()
                               .append('path')
                               .attr('class', 'bars');
      break;
  }
};

/**
  * To decide whether transition is need or not. If yes, what kind of transition
  */
BarChart.prototype.checkTransition = function() {

  var _this = this;
  var barWidth = _this.calculateBarwidth();

  if (_this.options.transition && _this.options.transition.animate) {
    var a = CONSTANTS.ANIMATION_DELAY;
    var animationDelay = a[(_this.options.transition.type).toUpperCase()] || 0;
    _this.drawBarsWithAnimation(barWidth, animationDelay);
  } else {
    _this.drawBarsWithoutAnimation(barWidth);
  }

};

/**
  * To draw the goal lines if the user have opted to.
  */
BarChart.prototype.checkGoalLine = function() {
  var _this = this;
  if (_this.options.goalLine && _this.options.goalLine.value) {
    _this.addGoalLines();
  }
};

/**
  * Calculates the responsive bar width for the graph.
  */
BarChart.prototype.calculateBarwidth = function() {
  var _this = this,
      bar   = _this.options.bar;

  var barWidth = (bar && bar.width)
                      ? _this.options.bar.width
                      : _this.xScale.bandwidth();

  if (bar && !(bar.override)) {
    barWidth = (barWidth > _this.xScale.bandwidth())
                        ? _this.xScale.bandwidth()
                        : barWidth;
  }

  return barWidth;
};

/**
  * Draws bars in a Barchart with animation.
  * @param {Integer} barWidth - User defined width of each bar.
  * @param {Integer} animationDelay - Delay after which each bars are drawn(in ms)
  */
BarChart.prototype.drawBarsWithAnimation = function(barWidth, animationDelay) {

  var _this   = this,
      radius  = barWidth/2,
      xShift = _this.barCentering(barWidth, _this.xScale.bandwidth());

  _this.bar.attr('d', function(d) {
            var x = _this.xScale(d[0]) + xShift;
            return _this.drawRoundedRectangle(d, x, _this.yMin, barWidth, 0, 0);
          })
          .attr('clip-path', 'url(#bar-clip)')
          .transition()
          .delay(function(d, i) { return i*animationDelay; })
          .duration(CONSTANTS.ANIMATION_DURATION)
          .attr('d', function(d) {
            return _this.drawBar(d, xShift, barWidth);
          });

};


/**
  * Draws bars in a Barchart without animation.
  * @param {Integer} barWidth - User defined width of each bar.
  */
BarChart.prototype.drawBarsWithoutAnimation = function(barWidth) {

  var _this   = this,
      radius  = barWidth/2,
      xShift = _this.barCentering(barWidth, _this.xScale.bandwidth())
                  + _this.defaultMargin() - _this.xMin;

  _this.bar.attr('d', function(d) {
              return _this.drawBar(d, xShift, barWidth);
            })
            .attr('clip-path', 'url(#bar-clip)');

};

/**
 * Draws rounded rectangle bars
 * @param  {Integer} d        - data
 * @param  {Integer} y        - Y-axis coordinate
 * @param  {Integer} barWidth - width of each bar
 * @param  {Integer} height   - height of each bar
 * @param  {Integer} radius   - radius of curve
 * @return {string}           - path of svg element
 */
BarChart.prototype.drawRoundedRectangle = function (d, x, y, width, height, radius) {

  return 'M' + (x + radius) + ' ' + y
          + 'h' + (width - 2*radius)
          + 'a' + radius + ' ' + radius + ' '+ 0 + ' ' + 0 + ' ' + 1 + ' ' + radius + ' ' + radius
          + 'v' + (height - 2*radius)
          + 'v' + radius
          + 'h' + -radius
          + 'h' + (2*radius - width)
          + 'h' + -radius
          + 'v' + -radius
          + 'v' + (2*radius - height)
          + 'a' + radius + ' ' + radius + ' '+ 0 + ' ' + 0 + ' ' + 1 + ' ' + radius + ' ' + -radius
          + 'z';

};

/**
  * To draw the bar with curved end at the top.
  * @param {Object} d - Data
  * @param {Integer} margin - margin amount to be shifted
  * @param {Integer} barWidth - Width of each bar
  */
BarChart.prototype.drawBar = function(d, margin, barWidth) {

  var _this = this,
      bar   = _this.options.bar;
  var x, y, height, radius;
  radius = (bar && bar.curve) ? barWidth/2 : 0;
  x      = _this.xScale(d[0]) + margin,
  y      = _this.yScale(d[1]),
  height = _this.yMin - _this.yScale(d[1]);

  return _this.drawRoundedRectangle(d, x, y, barWidth, height, radius);
};

/**
  * To find how much more length is to be shifted on X axis when user defines
  * the widht of the bar in chart.
  * @param {Integer} barWidth - User defined bar width for the chart.
  * @return {Integer} - The amount of units in the X axis that needs to be shifted.
  */
BarChart.prototype.barCentering = function(barWidth) {
  var _this = this;

  if (barWidth <  _this.xScale.bandwidth())
    return (_this.xScale.bandwidth()-barWidth)/2;
  else
    return 0;
};
