/*global d3*/
/*global console*/
/*eslint no-console: "off"*/
        
var margin = {top: 20, right: 20, bottom: 30, left: 40};
var svg = d3.select(".chart");
var w = +svg.attr("width") - margin.left - margin.right;
var h = +svg.attr("height") - margin.top - margin.bottom;        

var formatDecimal = d3.format(".1f");

//var xScale = d3.scaleBand().rangeRound([0, width]).padding(0.1); // See how it looks with 0 padding as well
//var yScale = d3.scaleLinear().range([height, 0]);

drawStackedBarChart("data.csv", 0);

function drawStackedBarChart(dataFileName, selectNumber) {
    
    d3.csv(dataFileName).then(function (data) {
        
        //var categoryColors = d3.scaleOrdinal(d3.schemeCategory10);
        
        var columns = data.columns;
        var categories = columns.slice(1);
        
        var stack = d3.stack().keys(categories).order(d3.stackOrderDescending)
        var colors = d3.scaleOrdinal().domain(categories)
            .range(["#fff7fb", "#ece2f0", "#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016c59", "#014636"]);
        
        /* valid numbers from 0 to length of categories - 1 */
        if (selectNumber > categories.length-1 || selectNumber < 0) {
            console.warn("Invalid Category Selected | Max number is " + (categories.length -1) + " | Defaulting to 0");
            selectNumber = 0;
        }
        
        var select = selectNumber; 
        var selectedCategory = categories[select];

        //data.sort(function (a,b) {return b[selectedCategory] - a[selectedCategory]; }); // Sorting the data from highest to lowest

        //var states = data.map(function (d) { return d[columns[0]]; }); // Simply returns and array with all the states

        var dataset =[];
        data.forEach(function (datum) {
            var tempObj = {};
          
            categories.forEach(function (category) {
                tempObj[category] = +datum[category];    
            });
            dataset.push(tempObj); 
        });
        
        
        var stackedData = stack(dataset);
        console.log(stackedData);
        
        var xScale = d3.scaleBand()
				.domain(d3.range(dataset.length))
				.range([0, w])
				.paddingInner(0.1);
        
        var yScale = d3.scaleLinear()
				.domain([0,	d3.max(dataset, function(d) {    
                    var sum = 0;    
                    categories.forEach(function (category) {
                        sum = sum + d[category];        
                    });	
                        
                    return sum;
                })])
				.range([h, 0]);
        
        
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
					return yScale(d[1]);
				})
				.attr("height", function(d) {
					return yScale(d[0]) - yScale(d[1]);
				})
				.attr("width", xScale.bandwidth());
        
    });
}