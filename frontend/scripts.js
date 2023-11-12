document.addEventListener("DOMContentLoaded", function() {
var x = [];
var y = [];
for (i = 0; i < 20; i = i + 0.01) {
    x.push(i);
}
for (j = 0; j < 54; j = j + 0.01) {
    y.push(j);
}

var z = [];

for (j = 0; j < y.length; j++) {
    var temp = [];
    for (k = 0; k < x.length; k++) {
        temp.push(0);
    }
    z.push(temp);
}

var points = {
    x: [],
    y: [],
    mode: "markers",
    name: "Data Points"
}

var map = {
    x: x,
    y: y,
    z: z,
    type: 'heatmap',
    colorscale: [['0.0', 'rgb(255, 255, 255, 0.5)'], ['1.0', 'rgb(255, 255, 255, 0.5)']],
    xgap: 1,
    ygap: 1,
    hoverinfo: 'x',
    showscale: false
}

var plot_data = [map, points];
var layout = { title: "RANSAC Least Squares Method" };

Plotly.newPlot('graphDiv', plot_data, layout, { showSendToCloud: true });
var myPlot = document.getElementById('graphDiv');

myPlot.on('plotly_click', function (click_data) {
    // console.log(click_data)
    //need to get where curveNumber = 3 (index of trace in data array)
    var dataTrace = click_data.points.filter(obj => {
        // console.log(obj)
        return obj.curveNumber === 0;
    })
    points.x.push(dataTrace[0].x)
    points.y.push(dataTrace[0].y)
    Plotly.redraw('graphDiv');
    // alert("Exact Coordinate Values of Click: (" + dataTrace[0].x + ", " + dataTrace[0].y + ")");
});

function showPopup(slope, intercept) {
    let equation = ""; // Initialize the equation variable

    // Format the equation string based on the slope and intercept
    if (slope === 0) {
        equation = `y = ${intercept}`;
    } else if (intercept === 0) {
        equation = `y = ${slope}x`;
    } else {
        const sign = intercept > 0 ? '+' : '-';
        equation = `y = ${slope}x ${sign} ${Math.abs(intercept)}`;
    }

    // Update the content of the popup with the calculated equation
    const resultElement = document.getElementById("result");
    resultElement.textContent = equation;

    // Show the popup
    const popupContent = document.getElementById("popupContent");
    popupContent.style.display = "block";
}

var dataButton = document.getElementById("generate_data")
dataButton.addEventListener("click", generateData)

function generateData() {
    var slope = parseFloat(document.getElementById("slope").value)
    var intercept = parseFloat(document.getElementById("intercept").value)
    var numPoints = parseInt(document.getElementById("numPoints").value)
    var noiseRange = parseFloat(document.getElementById("noiseRange").value)
    console.log(slope, intercept, numPoints)

    if (isNaN(slope) || isNaN(intercept) | isNaN(numPoints) || isNaN(noiseRange)) {
        alert("Please enter the configuration for generating data");
    }

    x_ = randomList(Math.floor(numPoints * 0.75), 15)
    y_ = x_.map((point) => point * slope + intercept + (Math.random() * (noiseRange)))

    console.log("x_", x_)
    console.log("y_", y_)

    noise_x = randomList(Math.ceil(numPoints * 0.25), 25)
    noise_y = randomList(Math.ceil(numPoints * 0.25), 25)

    x = x_.concat(noise_x)
    y = y_.concat(noise_y)
    points.x = x
    points.y = y
    Plotly.redraw("graphDiv")
}

function randomList(numPoints, maxNum) {
    array = []
    for (let i = 0; i < numPoints; ++i) {
        const randomNumber = Math.random() * (maxNum)
        array.push(randomNumber)
    }
    return array
}
var firstClick = true
var button = document.getElementById("generate");
button.addEventListener("click", create_graph)

function create_graph() {
    var iter = parseInt(document.getElementById("numIter").value)
    var thres = parseFloat(document.getElementById("threshold").value)

    if (isNaN(iter)) {
        alert("The number of iterations is mandatory ")
    }

    var jsonString = JSON.stringify({ threshold: thres, numIter: iter, x: points.x, y: points.y })
    console.log(jsonString)

    fetch("http://127.0.0.1:8000/ransac/post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: jsonString,
    })
        .then((response) => response.json())
        .then((data => {
            console.log("Response Data:", data)
            plot_graph(points.x, data.y_ransac, data.y_lsq)
            showPopup(data.slope, data.intercept)
        }))
        .catch((error) => {
            console.error("Error:", error);
        })
};

function plot_graph(xVals, yHat, lsq) {
    var ransac = { x: xVals, y: yHat, mode: "line", name: "RANSAC Least Squares Line" };
    var leastSquare = { x: xVals, y: lsq, mode: "line", name: "Normal Least Squares Line" }
    if (firstClick) {
        plot_data.push(ransac, leastSquare)
        firstClick = false
    } else {
        plot_data[2] = ransac
        plot_data[3] = leastSquare
    }

    Plotly.redraw("graphDiv")
}
});