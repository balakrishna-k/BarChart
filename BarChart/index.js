/*global d3*/
/*global console*/
/*eslint no-console: "off"*/
        
var margin = {top: 20, right: 20, bottom: 30, left: 40};
var svg = d3.select(".chart");
var w = +svg.attr("width") - margin.left - margin.right;
var h = +svg.attr("height") - margin.top - margin.bottom;        

var formatDecimal = d3.format(".1f");

drawStackedBarChart("data.csv", 0);

function drawStackedBarChart(dataFileName) {
    
    d3.csv(dataFileName).then(function (data) {
        
        var columns = data.columns;
        var categories = columns.slice(1);
        
        var stack = d3.stack().keys(categories);
        var colors = d3.scaleOrdinal().domain(categories)
            .range(["#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016c59", "#014636"]);
        
        var dataset =[];
        data.forEach(function (datum) {
            var tempObj = {};
            var sum = 0;
            categories.forEach(function (category) {
                tempObj[category] = +datum[category];
                sum = sum + tempObj[category];
                
            });
            tempObj.total = sum;
            dataset.push(tempObj); 
        });
        
        console.log(dataset);
        
        var xScale = d3.scaleBand()
				.domain(d3.range(dataset.length))
				.range([0, w])
				.paddingInner(0.1).align(0.1);
        
        var yScale = d3.scaleLinear()
				.domain([0,	d3.max(dataset, function(d) {                       
                    return d.total;
                })])
				.range([h, 0]);
        
        dataset.sort(function (a,b) {return b.total - a.total; }); // Sorting the data from highest to lowest
        
        var stackedData = stack(dataset);
    
        var groups = svg.selectAll("g")
				.data(stackedData)
				.enter()
				.append("g")
				.style("fill", function(d, i) {
					return colors(i);
				});
        
        groups.selectAll("rect")
				.data(function(d) { return d; })
				.enter()
				.append("rect")
				.attr("x", function(d, i) {
					return xScale(i);
				})
				.attr("y", function(d) {
					return h;
				})
                .attr("height", 0)
                .transition().duration(1800).delay(function (d,i) {return i*20;})
				.attr("height", function(d) {
					return yScale(d[0]) - yScale(d[1]);
				})
				.attr("y", function(d) {
					return yScale(d[1]);
				})
                .attr("width", xScale.bandwidth());
        
    });
}