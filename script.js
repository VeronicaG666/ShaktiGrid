document.addEventListener("DOMContentLoaded", () => {
    // Initialize the Chart.js chart
    const ctx = document.getElementById("forecastChart").getContext("2d");
    let forecastChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],  // X-axis labels (timestamps)
            datasets: [{
                label: "Predicted Solar Output",
                data: [],  // Prediction values
                borderColor: "orange",
                backgroundColor: "rgba(255, 165, 0, 0.2)",
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: 'Gabarito, serif',
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        family: 'Gabarito, serif',
                        size: 12
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Time",
                        font: {
                            family: 'Gabarito, serif',
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Gabarito, serif',
                            size: 12
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Solar Output",
                        font: {
                            family: 'Gabarito, serif',
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Gabarito, serif',
                            size: 12
                        }
                    }
                }
            }
        }
    });

    // Global variables to track the current toast and its message
    let currentToast = null;
    let currentMessage = "";

    function showToast(message) {
        // If a toast already exists and the message is the same, do nothing.
        if (currentToast && currentMessage === message) {
            return;
        }

        // If a toast exists but the message has changed, remove the old toast.
        if (currentToast) {
            currentToast.remove();
            currentToast = null;
            currentMessage = "";
        }

        // Create a new toast element.
        currentToast = document.createElement("div");
        currentToast.className = "toast";
        currentToast.innerText = message;
        document.body.appendChild(currentToast);
        currentMessage = message;
    }


    // Function to generate a practical optimization insight message based on input features and prediction.
    function generateOptimizationInsight(inputObj, predictionValue) {
        let message = "";
        if (predictionValue > 50) {
            message = "High solar output detected! Consider trading surplus energy to boost local rural infrastructure.";
        } else if (predictionValue > 20) {
            message = "Moderate solar output – it's an optimal time to charge batteries, ensuring stable energy for rural needs.";
        } else {
            message = "Low solar output forecast. Conserve energy now and prepare for improved conditions later.";
        }
        return message;
    }

    // Function to update the chart with new prediction data
    function updateChart(newPrediction) {
        const timeLabel = new Date().toLocaleTimeString();
        forecastChart.data.labels.push(timeLabel);
        forecastChart.data.datasets[0].data.push(newPrediction);
        // Keep only the latest 20 data points
        if (forecastChart.data.labels.length > 20) {
            forecastChart.data.labels.shift();
            forecastChart.data.datasets[0].data.shift();
        }
        forecastChart.update();
    }

    // Function to update UI elements with fetched data and display optimization insights
    function updateUI(fetchedData) {
        // Expected response structure: 
        // { input_features: [ { hour, day, month, year, Consumption, Wind } ], prediction: [someNumber] }
        const inputObj = fetchedData.input_features[0];
        const predictionValue = fetchedData.prediction[0];

        // Update detailed info text (ensure an element with id="data-info" exists)
        const dataInfoElem = document.getElementById("data-info");
        if (dataInfoElem) {
            dataInfoElem.textContent =
                `Hour: ${inputObj.hour}, Day: ${inputObj.day}, Month: ${inputObj.month}, ` +
                `Year: ${inputObj.year}, Consumption: ${inputObj.Consumption.toFixed(2)}, ` +
                `Wind: ${inputObj.Wind.toFixed(2)}, Prediction: ${predictionValue.toFixed(2)}`;
        }

        // Generate and display the optimization insight message as a toast pop-up
        const optimizationMsg = generateOptimizationInsight(inputObj, predictionValue);
        showToast(optimizationMsg);

        // Update the chart with the new prediction
        updateChart(predictionValue);
    }

    // Async function to fetch predictions from your Flask API
    async function getPrediction() {
        try {
            const response = await fetch("http://127.0.0.1:5000/predict");  // Update URL if needed
            const data = await response.json();
            console.log("Fetched data:", data);
            updateUI(data);
        } catch (error) {
            console.error("Error fetching prediction:", error);
        }
    }

    // Initial fetch when page loads
    getPrediction();
    // Fetch predictions every 30 seconds
    setInterval(getPrediction, 30000);
});

