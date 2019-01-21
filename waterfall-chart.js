
const margin = { top: 20, right: 30, bottom: 60, left: 80 }
const width = 780 - margin.left - margin.right
const height = 500 - margin.top - margin.bottom
const padding = .3;
//settings for ordering of data bins
const absValueBinOrder = true;
//settings for nominal bin ordering
const nominalBinOrder = false;

const x = d3.scale.ordinal()
    .rangeRoundBands([0, width], padding);

const y = d3.scale.linear()
    .range([height, 0]);

const xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

const yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(function (d) { return dollarFormatter(d); });

yAxis.tickFormat(function (d) { return dollarFormatter(d); });

const chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let data = document.getElementById("data").textContent
const dataArray = data.split("\n");
const columnsArray = dataArray[0].split(",");
const DataPoint = function (lineData) {
    rowArray = lineData.split(",");
    this.name = rowArray[0];
    this.value = rowArray[1];
}
const Value = function (catName, catVal) {
    this.name = catName;
    this.value = catVal;
}
parsedData = dataArray.map(val => new DataPoint(val))
dataSet = new Set();
parsedData.map(val => dataSet.add(val.name))
keysArray = []
cumulativeData = []
dataSet.forEach(val => {
    if (val != null) {
        let string = val.replace(/['"]+/g, " ").trim();
        if (string.length > 0) {
            keysArray.push(string);
            cumulativeData.push(0);
        }
    }
})
dataArray.map((val, i) => {
    if (i != 0) {
        infoArr = val.split(",");
        let j = keysArray.indexOf(infoArr[0].replace(/['"]+/g, " ").trim())
        cumulativeData[j] += parseInt(infoArr[1]);
    }
})
data = [];
trueTotal = 0;
//cumulative calculator; includes a randomizing negative value generator (which should be removed for real data sets)
for (i = 0; i < cumulativeData.length; i++) {
    if (cumulativeData[i]) {
        trueTotal += cumulativeData[i];
        let total = cumulativeData[i]
        if(i%2 == 0){
            total *= -1;
        }
        data.push(new Value(keysArray[i], total))
    }
}
//optional bin sorting by positive and negative bin grouping
if(absValueBinOrder){
    for(i=0;i<data.length; i++){
        let count = 0;
        for(n=0; n<data.length-i-1; n++){
            if(data[n].value < data[n+1].value){
                let hold = data[n];
                data[n] = data[n+1];
                data[n+1] = hold;
                count = 1;
            }
        }
        if(count ==0){
            break;
        }
    }
}
//optional bin sorting by positive and negative bin grouping
if(nominalBinOrder){
    for(i=0;i<data.length; i++){
        let count = 0;
        for(n=0; n<data.length-i-1; n++){
            if(data[n].name < data[n+1].name){
                let hold = data[n];
                data[n] = data[n+1];
                data[n+1] = hold;
                count = 1;
            }
        }
        if(count ==0){
            break;
        }
    }
}
data.unshift(new Value("Abs Value", trueTotal));
keysArray.splice(0, 1)
cumulativeData.splice(0, 1)
let cumulative = 0;
for (let i = 0; i < data.length; i++) {
    data[i].start = cumulative;
    cumulative += data[i].value;
    data[i].end = cumulative;

    data[i].class = (data[i].value >= 0) ? 'positive' : 'negative'
}
data.push({
    name: 'Total',
    end: cumulative,
    start: 0,
    class: 'total'
});

x.domain(data.map(d=>d.name));
y.domain([0, d3.max(data, d=>d.end)]);

chart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

chart.append("h1")
    .text("Sample Graph")

chart.append("g")
    .attr("class", "y axis")
    .call(yAxis);

let bar = chart.selectAll(".bar")
    .data(data)
    .enter().append("g")
    .attr("class", d=>"bar " + d.class)
    .attr("transform", d=>"translate(" + x(d.name) + ",0)");

bar.append("rect")
    .attr("y", d=>y(Math.max(d.start, d.end)))
    .attr("height", d=> Math.abs(y(d.start) - y(d.end)))
    .attr("width", x.rangeBand()+10);

bar.append("text")
    .attr("x", x.rangeBand() / 2)
    .attr("y", d=>y(d.end) + 5)
    .attr("dy", d=>(d.class == 'negative' ? '-' : '') + ".75em" )
    .text(d=>dollarFormatter(d.end - d.start));

bar.filter(d=>d.class != "total" ).append("line")
    .attr("class", "connector")
    // .attr("x1", x.rangeBand() + 5)
    .attr("x1", x.rangeBand()+10)
    .attr("y1", d=>y(d.end))
    // .attr("x2", x.rangeBand() / (1 - padding) - 5)
    .attr("x2", x.rangeBand() / (1 - padding))
    .attr("y2", d=>y(d.end))
// });

function type(d) {
    d.value = +d.value;
    return d;
}

function dollarFormatter(n) {
    n = Math.round(n);
    let result = n;
    if (Math.abs(n) > 1000) {
        result = Math.round(n / 1000) + 'K';
    }
    return '$' + result;
}
