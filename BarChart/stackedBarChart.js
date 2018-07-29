/*global d3*/

/*global console*/
/*eslint no-console: "off"*/
/*eslint no-unused-vars: "off"*/
var margin = {top: 20, right: 20, bottom: 30, left: 40};
var svg = d3.select("#chart");
var width = +svg.attr("width") - margin.left - margin.right;
var height = +svg.attr("height") - margin.top - margin.bottom;        



svg = svg.append("g").attr("transform", "translate(" + margin.left/2 + "," + margin.top + ")");

var params = {
    fileName: "data.csv",
    width: width,
    height: height,
    margin: margin,
    colors: ["#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016c59", "#014636"],
    //startColor: "#800000",
    //endColor: "orange",
    //categoryLabels: ["One", "Two", "Three", "Four", "Five", "Six", "Seven"],
    highlightColor: "orange",
};

drawStackedBarChart(params);        

function drawStackedBarChart(parameters) {
    
    var width = parameters.width;
    var height = parameters.height;
    var margin = parameters.margin;
    
    var formatSI = d3.format(".2s"); //SI Formatting
    
    var dataFileName = parameters.fileName;
    var rangeOfColors = parameters.colors;
    var startColor = parameters.startColor;
    var endColor = parameters.endColor;
    var categoryLabels = parameters.categoryLabels;
    var highlightColor = parameters.highlightColor;
    
//    startColor = d3.hsl(startColor);
//    endColor = d3.hsl(startColor);
//    endColor.h = (parseFloat(startColor.h) + 180)%360 + "";
//    console.log(d3.rgb(startColor));
//    console.log(d3.rgb(endColor));
    
    d3.csv(dataFileName).then(function (data) {
        
        var columns = data.columns;
        var colors;
        //var categories = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];
        
        if (!categoryLabels) {
            categoryLabels = columns.slice(1);
        }
        
        var categories = columns.slice(1);
        
        var legendCellHeight = 30;
        var legendCellWidth = Math.floor((width-margin.left/4)/categories.length);
        
        var stack = d3.stack().keys(categories);
        
        if (!rangeOfColors) { //No user defined colours
            
            if (startColor && endColor) { // Start and end colour both exist
                colors = d3.scaleLinear().range([startColor, endColor]).domain([0, categories.length]);
            } 
            else if (startColor && !endColor) { // If start colour exists but end colour does not exist
                console.warn("End Colour not specified: Automatically chose complementary colour");
                
                endColor = invertColor(startColor);
                colors = d3.scaleLinear().range([startColor, endColor]).domain([0, categories.length]);
                
            } else{ // If neither start or end exist then default to
                console.warn("No colour scheme specified: Using default colour specification")
                
                colors = d3.scaleLinear().range(["indigo", "orange"]).domain([0, categories.length]);     
            } 
            
        } else { // If colours exist then use them with an ordinal scale.
            
            if (rangeOfColors.length > categories.length) {
                console.warn("Too many colours specified: Using first " + categories.length + " colours only.");
                
                rangeOfColors = rangeOfColors.slice(0, categories.length)
                colors = d3.scaleOrdinal().domain(categories).range(rangeOfColors);
                
            } else if (rangeOfColors.length < categories.length) {
                console.error("Too few colours specified: Using default colour specification");
                
                colors = d3.scaleLinear().range(["indigo", "orange"]).domain([0, categories.length]);
                
            } else {
                colors = d3.scaleOrdinal().domain(categories).range(rangeOfColors);
            }
        }
        
        if (!highlightColor) { // If not specified then use yellow
            highlightColor = "yellow";
        }
        
        var dataset =[];
        
        data.forEach(function (datum) {
            var tempObj = {};
            var sum = 0;
            
            categories.forEach(function (category) {
                tempObj[category] = +datum[category];
                sum = sum + tempObj[category];
            });
            
            tempObj.total = sum; // Calculated for convenience - e.g. Sorting, displaying total etc
            tempObj.key = datum[columns[0]]; // Picking the first column "keys"
            dataset.push(tempObj); 
        });
        
        var xScale = d3.scaleBand()
				//.domain(d3.range(dataset.length))
				.range([0, width])
				.paddingInner(0.1).align(0.1);
        
        var yScale = d3.scaleLinear()
				.domain([0,	d3.max(dataset, function(d) {                       
                    return d.total;
                })])
				.range([height, 0]);
        
        dataset.sort(function (a,b) {return a.total - b.total; }); // Sorting the data   
        
        var stackedData = stack(dataset);
        
        // Adding X axis
        svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale.domain(data.map(function (d) { return d[columns[0]]; }))).tickSize(-height)).selectAll(".tick text")
      .call(wrap, xScale.bandwidth()); // Domain is country labels
        
        // Adding Y axis
        svg.append("g").attr("transform", "translate(" + (width) + "," + 0 + ")")
            .attr("class", "axis axis--y")
            .call(d3.axisRight(yScale).ticks(null, "s").tickSize(-width))
            .append("text")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start");
        
        var svgLegend = d3.select("#legend");
        // Legend stuff
        svgLegend.append("g").attr("class", "legendBarChart").attr("transform", "translate(500,0)");
        
        if (parameters.colors){
            var legendScale = d3.scaleOrdinal().domain(categoryLabels).range(parameters.colors);
            
            var legendOrdinal = d3.legendColor().scale(legendScale).shapeWidth(legendCellWidth).shapeHeight(legendCellHeight).shapePadding(0).ascending(false).orient("horizontal").labelWrap(legendCellWidth);
        
            svgLegend.select(".legendBarChart")
                .call(legendOrdinal);
        }
        
        d3.select(".legendBarChart").attr("transform", "translate(" + (margin.left/2 + 10)  +",0)")
        
        
        var stackGroups = svg.selectAll(".group")
				.data(stackedData)
				.enter()
                    .append("g").attr("class", "group")
                    .style("fill", function(d, i) {
                        d3.select(this).attr("category", i);
                        return colors(i);
                    });
        
        xScale.domain(d3.range(dataset.length));
        
        stackGroups.selectAll(".bar")
				.data(function(d) { return d; })
				.enter()
                    .append("rect")
                    .attr("class","bar")
                    .attr("x", function(d, i) { return xScale(i); })
                    .attr("y", height)
                    .attr("height", 0)
                    .attr("opacity", 0)
                        .transition()
                        .duration(1800)
                        .delay(function (d,i) {return i*20;})
                        .attr("opacity", 1)
                        .attr("height", function(d) {
                            return yScale(d[0]) - yScale(d[1]);
                        })
                        .attr("y", function(d) {
                            return yScale(d[1]);
                        })
                        .attr("width", xScale.bandwidth());

        // Adding interactions
        d3.select(".axis--y")
            .selectAll(".tick")
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .delay(function(d,i) {
                return i*200;
            })
            .style("opacity", 1);
        
        
        var x2 = d3.select(".axis--y").select("line").attr("x2");
        d3.select(".axis--y").selectAll("line").attr("x2",0)
            .transition()
            .duration(2000)
            .delay(function (d, i) { return i*200;})
            .attr("x2", x2);
        
        d3.select(".axis--x")
            .selectAll(".tick")
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .delay(function(d,i) {
                return i*30;
            })
            .style("opacity", 1);
        
        var y2 = d3.select(".axis--x").select("line").attr("y2");
        d3.select(".axis--x").selectAll("line").attr("y2",0)
            .transition()
            .duration(2000)
            .delay(function (d, i) {
                return 100 + i*20;
            }).attr("y2", y2);
        
        
        
        d3.selectAll(".bar")
            .on("mouseover", function (d) {
                var categoryNumber = d3.select(this.parentNode).attr("category"); 
                    
                d3.select(this)
                    .transition()
                    .duration(500)
                        .style("fill", highlightColor);
                
                var xPosition = parseFloat(d3.event.x) + 10;
                var yPosition = parseFloat(d3.event.y);
                
                d3.select("#tooltip")
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px")
                    .select("#value")
                    .text(formatSI(d[1]-d[0]));
                
                d3.select("#tooltip").select("#title").text(d.data.key);
                
                d3.select("#tooltip").select("#category").text(categoryLabels[categoryNumber])
                    
                d3.select("#tooltip")
                    .select("#totalValue").text(formatSI(d.data.total));

                d3.select("#tooltip").transition().duration(500).style("opacity", 0.9);

                
            })
            .on("mouseout", function () {
                var fill = d3.select(this.parentNode).style("fill"); // Goes to parent group and retrieves group colour
                
                d3.select(this)
                    .transition()
                    .duration(500)
                        .style("fill", fill);
            
                d3.select("#tooltip").transition().duration(500).style("opacity", 0);
            });
        
        
        
        d3.select(".legendBarChart").selectAll("rect")
            .attr("opacity", 0)
            .transition().ease(d3.easeLinear)
            .duration(2000)
            .delay(function(d,i) {
                return i*300;
            })
           .attr("opacity", 1);
        
        d3.select(".legendBarChart").selectAll("text")
            .style("opacity", 0)
            .transition().ease(d3.easeLinear)
            .duration(250)
            .delay(function(d,i) {
                return 250 + i*250;
            })
            .style("opacity", 1);
        
              
    });
    
    

}

function invertColor(color, bw) {
    //https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
    var hex = toHex(color);
    
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
        // http://stackoverflow.com/a/3943023/112731
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186
            ? '#000000'
            : '#FFFFFF';
    }
    // invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + padZero(r) + padZero(g) + padZero(b);
}

function toHex(color) {
    var c = d3.rgb(color);
    c =  "#" + hex(c.r) + hex(c.g) + hex(c.b);
    //console.log(c);
    return c;
}

function hex(value) {
  value = Math.max(0, Math.min(255, Math.round(value) || 0));
  return (value < 16 ? "0" : "") + value.toString(16);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}