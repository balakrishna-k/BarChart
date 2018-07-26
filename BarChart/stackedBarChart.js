/*global d3*/

/*global console*/
/*eslint no-console: "off"*/
/*eslint no-unused-vars: "off"*/
        


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
    
    d3.csv(dataFileName).then(function (data) {
        
        var columns = data.columns;
        var colors;
        //var categories = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];
        
        if (!categoryLabels) {
            categoryLabels = columns.slice(1);
        }
        
        var categories = columns.slice(1);
        
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
				.domain(d3.range(dataset.length))
				.range([0, width])
				.paddingInner(0.1).align(0.1);
        
        var yScale = d3.scaleLinear()
				.domain([0,	d3.max(dataset, function(d) {                       
                    return d.total;
                })])
				.range([height, 0]);
        
        dataset.sort(function (a,b) {return b.total - a.total; }); // Sorting the data from highest to lowest
        
        var stackedData = stack(dataset);
        
        var stackGroups = svg.selectAll("g")
				.data(stackedData)
				.enter()
                    .append("g")
                    .style("fill", function(d, i) {
                        d3.select(this).attr("category", i);
                        return colors(i);
                    });

        stackGroups.selectAll("rect")
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

        // Adding X axis
        svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale.domain(data.map(function (d) { return d[columns[0]]; })))); // Domain is country labels
            
        // Adding Y axis
        svg.append("g").attr("transform", "translate(" + (- margin.left)/4 + "," + 0 + ")")
            .attr("class", "axis--y")
            .call(d3.axisLeft(yScale).ticks(null, "s"))
            .append("text")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start");
        
        // Adding interactions
        d3.selectAll(".bar")
            .on("mouseover", function (d) {
                var categoryNumber = d3.select(this.parentNode).attr("category"); 
                    
                d3.select(this)
                    .transition()
                    .duration(500)
                        .style("fill", highlightColor);
                
                var xPosition = parseFloat(d3.select(this).attr("x")) + xScale.bandwidth() * 4;
                var yPosition = parseFloat(d3.select(this).attr("y")) + height / 4;
                
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