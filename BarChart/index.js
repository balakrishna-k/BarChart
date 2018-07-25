/*global d3*/
/*global console*/
/*eslint no-console: "off"*/
var svg = d3.select(".chart");
var margin = {top: 20, right: 20, bottom: 30, left: 40};
var width = +svg.attr("width") - margin.left - margin.right;
var height = +svg.attr("height") - margin.top - margin.bottom;

var formatDecimal = d3.format(".1f");

var xScale = d3.scaleBand().rangeRound([0, width]).padding(0.1); // See how it looks with 0 padding as well
var yScale = d3.scaleLinear().range([height, 0]);
var zScale = d3.scaleOrdinal(d3.schemeCategory20);
var stack = d3.stack()

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

drawBarChart("data.csv", 0);

function drawBarChart(dataFileName, selectNumber) {
    
    d3.csv(dataFileName).then(function (data) {

        var columns = data.columns;
        var categories = columns.slice(1);
        
        /* valid numbers from 0 to length of categories - 1 */
        if (selectNumber > categories.length-1 || selectNumber < 0) {
            console.warn("Invalid Category Selected | Max number is " + (categories.length -1) + " | Defaulting to 0");
            selectNumber = 0;
        }
        
        var select = selectNumber; 
        var selectedCategory = categories[select];

        //data.sort(function (a,b) {return b[selectedCategory] - a[selectedCategory]; }); // Sorting the data from highest to lowest

        var states = data.map(function (d) { return d[columns[0]]; }); // Simply returns and array with all the states

        data.map(function (d) {
            var valuesArray = [];
            categories.forEach(function (category) {
                /* Forcing all strings to be numbers */
                d[category] = +d[category];
                /* Creating an array of values associated with each category */
                valuesArray.push(d[category]);
            });     

            //d.states = states[i];
            //d.values = valuesArray;  //Stores all values for a given state in an array
        });

        xScale.domain(states);
        yScale.domain([0, d3.max(data, function (d) { return d[selectedCategory]; })]); // Just returns the max and min of category "One"
        
        data.sort(function(a, b) { return b.total - a.total; });

          xScale.domain(data.map(function(d) { return d.ethnicity; }));
          yScale.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
          zScale.domain(data.columns.slice(1));
            console.log(stack.keys(data.columns.slice(1))(data));
          g.selectAll(".serie")
            .data(stack.keys(data.columns.slice(1))(data))
            .enter().append("g")
              .attr("class", "serie")
              .attr("fill", function(d) { return zScale(d.key); })
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter().append("rect")
              .attr("x", function(d) { return xScale(d.data.ethnicity); })
              .attr("y", function(d) { return yScale(d[1]); })
              .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
              .attr("width", xScale.bandwidth());

          g.append("g")
              .attr("class", "axis axis--x")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.axisBottom(xScale));

          g.append("g")
              .attr("class", "axis axis--y")
              .call(d3.axisLeft(yScale).ticks(10, "s"))
            .append("text")
              .attr("x", 2)
              .attr("y", yScale(yScale.ticks(10).pop()))
              .attr("dy", "0.35em")
              .attr("text-anchor", "start")
              .attr("fill", "#000")
              .text("Population");

          var legend = g.selectAll(".legend")
            .data(data.columns.slice(1).reverse())
            .enter().append("g")
              .attr("class", "legend")
              .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
              .style("font", "10px sans-serif");

          legend.append("rect")
              .attr("x", width + 18)
              .attr("width", 18)
              .attr("height", 18)
              .attr("fill", zScale);

          legend.append("text")
              .attr("x", width + 44)
              .attr("y", 9)
              .attr("dy", ".35em")
              .attr("text-anchor", "start")
              .text(function(d) { return d; });
//        g.append("g")
//            .attr("class", "axis axis--x")
//            .attr("transform", "translate(0," + height + ")")
//            .call(d3.axisBottom(xScale));
//
//        g.append("g")
//            .attr("class","bars")
//            .selectAll(".bar")
//            .data(data)
//            .enter()
//                .append("rect")
//                .attr("class", "bar")
//                .attr("x", function (d) { return xScale(d.states); })
//                .attr("y", height)
//                .attr("width", xScale.bandwidth())
//                .attr("height", 0)
//                .style("fill", "rgb(70, 130, 180, 0)")
//                .transition()
//                    .duration(1800)
//                    .delay(function (d,i) {return i*20;})
//                    .attr("height", function (d) { return height - yScale(d[selectedCategory]); })
//                    .attr("y", function (d) { return yScale(d[selectedCategory]); })
//                    .style("fill", "rgb(70, 130, 180, 1)");
//
//        g.selectAll(".label")
//            .data(data)
//            .enter()
//                .append("text")
//                .attr("class", "label")
//                .attr("color", "black")
//                .attr("x", function (d) { return xScale(d.states) + 1; })
//                .attr("y", height)
//                .transition()
//                    .duration(1800)
//                    .delay(function (d,i) { return i*20; })
//                    .text(function (d) { return formatDecimal(d[selectedCategory]/100000); })
//                    .attr("y",function (d) { return yScale(d[selectedCategory])-3; })
//                    .attr("font-size","8px")
//                    .attr("text-anchor","start");
//        
//        d3.selectAll(".bar")
//            .on("mouseover", function () {
//                
//                d3.select(this)
//                    .style("fill", "rgb(70, 130, 180, 1)")
//                    .transition().duration(500)
//                    .style("fill", "rgb(255, 165, 0, 1)");
//            })
//            .on("mouseout", function () {
//                
//                d3.select(this)
//                    .style("fill", "rgb(255, 165, 0, 1)")
//                    .transition().duration(500)
//                    .style("fill", "rgb(70, 130, 180, 1)");
//            });
    });
}