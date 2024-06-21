let chartInstance;

document.getElementById("ticker").addEventListener("input", function () {
  this.value = this.value.toUpperCase();
});

document
  .getElementById("stockForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const ticker = document.getElementById("ticker").value.trim();
    const apiKey = ""; // Don't forget to add your API key here
    const resultDiv = document.getElementById("result");
    const chartContainer = document.getElementById("chartContainer");
    const ctx = document.getElementById("stockChart").getContext("2d");
    const h2Elements = document.querySelectorAll("h2");
    const h3Element = document.querySelector("h3");

    if (!ticker) {
      resultDiv.innerHTML = "Please enter a valid stock ticker.";
      resultDiv.style.display = "block";
      return;
    }

    resultDiv.innerHTML = "Calculating...";
    resultDiv.style.display = "block";
    chartContainer.style.display = "none";
    h2Elements.forEach((h2) => (h2.style.display = "none"));
    h3Element.style.display = "block";

    try {
      const dcfResponse = await fetch(
        `https://financialmodelingprep.com/api/v4/advanced_discounted_cash_flow?symbol=${ticker}&apikey=${apiKey}`
      );
      if (!dcfResponse.ok) {
        throw new Error(`Failed to fetch DCF data: ${dcfResponse.statusText}`);
      }
      const dcfData = await dcfResponse.json();

      console.log("DCF Data:", dcfData);

      if (
        !dcfData ||
        dcfData.length === 0 ||
        !dcfData[0].enterpriseValue ||
        !dcfData[0].price
      ) {
        throw new Error("Invalid DCF data received from API.");
      }

      const targetPrice =
        (dcfData[0].enterpriseValue +
          dcfData[0].totalCash -
          dcfData[0].totalDebt) /
        dcfData[0].dilutedSharesOutstanding;
      const stockPrice = dcfData[0].price;

      resultDiv.innerHTML = `
        <p><strong>Stock Target Price for ${ticker.toUpperCase()}:</strong> $${targetPrice.toFixed(
        2
      )}</p>
        <p><strong>Current Stock Price for ${ticker.toUpperCase()}:</strong> $${stockPrice.toFixed(
        2
      )}</p>
      `;
      resultDiv.style.display = "block";

      const chartResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?timeseries=30&apikey=${apiKey}`
      );
      if (!chartResponse.ok) {
        throw new Error(
          `Failed to fetch historical data: ${chartResponse.statusText}`
        );
      }
      const chartData = await chartResponse.json();

      console.log("Chart Data:", chartData);

      if (!chartData || !chartData.historical) {
        throw new Error("Invalid historical data received from API.");
      }

      const historicalData = chartData.historical.reverse();
      const labels = historicalData.map((entry) => entry.date);
      const closePrices = historicalData.map((entry) => entry.close);
      const mean = closePrices.reduce((a, b) => a + b, 0) / closePrices.length;
      const stdDev = Math.sqrt(
        closePrices
          .map((x) => Math.pow(x - mean, 2))
          .reduce((a, b) => a + b, 0) / closePrices.length
      );
      const lastClosePrice = closePrices[closePrices.length - 1];
      const stopLossLevel = lastClosePrice - 2 * stdDev;
      const takeProfitLevel = lastClosePrice + 3 * stdDev;

      console.log("Standard Deviation:", stdDev);
      console.log("Stop-Loss Level:", stopLossLevel);
      console.log("Take-Profit Level:", takeProfitLevel);

      chartContainer.style.display = "block";
      h2Elements.forEach((h2) => (h2.style.display = "block"));
      h3Element.style.display = "none";
      if (chartInstance) {
        chartInstance.destroy();
      }
      chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Closing Prices",
              data: closePrices,
              borderColor: "blue",
              fill: false,
            },
            {
              label: "Target Price",
              data: new Array(closePrices.length).fill(targetPrice),
              borderColor: "red",
              borderDash: [5, 5],
              fill: false,
            },
            {
              label: "Stop-Loss Level",
              data: new Array(closePrices.length).fill(stopLossLevel),
              borderColor: "orange",
              borderDash: [5, 5],
              fill: false,
            },
            {
              label: "Take-Profit Level",
              data: new Array(closePrices.length).fill(takeProfitLevel),
              borderColor: "green",
              borderDash: [5, 5],
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: "Date",
              },
            },
            y: {
              type: "logarithmic",
              display: true,
              title: {
                display: true,
                text: "Price ($)",
              },
              ticks: {
                callback: function (value) {
                  return "$" + value.toLocaleString();
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      resultDiv.innerHTML = `Error: ${error.message}`;
      resultDiv.style.display = "block";
    }
  });

window.addEventListener("DOMContentLoaded", function () {
  const h2Elements = document.querySelectorAll("h2");
  h2Elements.forEach((h2) => (h2.style.display = "none"));
  document.getElementById("result").style.display = "none";
});

document.getElementById("ticker").addEventListener("input", function () {
  const h2Elements = document.querySelectorAll("h2");
  const h3Element = document.querySelector("h3");
  const resultDiv = document.getElementById("result");
  const chartContainer = document.getElementById("chartContainer");

  if (this.value.trim() === "") {
    h2Elements.forEach((h2) => (h2.style.display = "none"));
    h3Element.style.display = "block";
    resultDiv.innerHTML = "";
    resultDiv.style.display = "none";
    chartContainer.style.display = "none";
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }
});
