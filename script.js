document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize the chart
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


    // 2. Function to display a toast message as a pop-up
    function showToast(message) {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerText = message;
        document.body.appendChild(toast);
        // Remove the toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // 3. Function to update the UI (DOM element and chart)
    function updateUI(fetchedData) {
        // Assuming your response structure:
        // { input_features: [ { hour: ..., day: ..., month: ..., year: ..., Consumption: ..., Wind: ... } ],
        //   prediction: [someNumber] }
        const inputObj = fetchedData.input_features[0];
        const predictionValue = fetchedData.prediction[0];

        // Update a DOM element (if you have one) for detailed info
        const dataInfoElem = document.getElementById("data-info");
        if (dataInfoElem) {
            dataInfoElem.textContent =
                `Hour: ${inputObj.hour}, Day: ${inputObj.day}, Month: ${inputObj.month}, ` +
                `Year: ${inputObj.year}, Consumption: ${inputObj.Consumption.toFixed(2)}, ` +
                `Wind: ${inputObj.Wind.toFixed(2)}, Prediction: ${predictionValue.toFixed(2)}`;
        }

        // Determine an engaging pointer message based on the current hour
        let pointerMsg = "";
        if (inputObj.hour < 19) {
            pointerMsg = "Our forecast indicates robust solar output in the early hours—ensuring ample energy for rural operations and local development initiatives.";
        } else {
            pointerMsg = "Even as sunlight wanes after 7:00 PM, our predictive model supports smart energy storage strategies to benefit rural communities.";
        }
        // Show the message as a pop-up toast
        showToast(pointerMsg);

        // Update the chart with the new prediction value
        updateChart(predictionValue);
    }

    // 4. Function to update the Chart.js chart with new data
    function updateChart(newPrediction) {
        const timeLabel = new Date().toLocaleTimeString();
        forecastChart.data.labels.push(timeLabel);
        forecastChart.data.datasets[0].data.push(newPrediction);

        // Optionally, keep only the last 20 data points
        if (forecastChart.data.labels.length > 20) {
            forecastChart.data.labels.shift();
            forecastChart.data.datasets[0].data.shift();
        }
        forecastChart.update();
    }

    // 5. Define the async function that fetches predictions from the Flask API
    async function getPrediction() {
        try {
            const response = await fetch("http://127.0.0.1:5000/predict");
            const data = await response.json();
            console.log("Fetched data:", data);

            // Update the UI (both DOM elements and chart) with the fetched data
            updateUI(data);
        } catch (error) {
            console.error("Error fetching prediction:", error);
        }
    }

    // 6. Fetch a prediction when the page loads
    getPrediction();

    // 7. Set an interval to fetch predictions every 2 seconds (2000 milliseconds)
    setInterval(getPrediction, 2000);
});
