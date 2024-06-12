document
  .getElementById("stockForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const ticker = document.getElementById("ticker").value.trim();
    const apiKey = "";
    const resultDiv = document.getElementById("result");

    if (!ticker) {
      resultDiv.innerHTML = "Please enter a valid stock ticker.";
      return;
    }

    resultDiv.innerHTML = "Calculating...";

    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v4/advanced_discounted_cash_flow?symbol=${ticker}&apikey=${apiKey}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data);

      if (
        !data ||
        data.length === 0 ||
        !data[0].enterpriseValue ||
        !data[0].price
      ) {
        throw new Error("Invalid data received from API.");
      }

      const targetPrice =
        (data[0].enterpriseValue + data[0].totalCash - data[0].totalDebt) /
        data[0].dilutedSharesOutstanding;
      const stockPrice = data[0].price;

      resultDiv.innerHTML = `
            <p><strong>Stock Target Pricpe for ${ticker.toUpperCase()}:</strong> $${targetPrice.toFixed(
        2
      )}</p>
            <p><strong>Current Stock Price for ${ticker.toUpperCase()}:</strong> $${stockPrice.toFixed(
        2
      )}</p>
        `;
    } catch (error) {
      console.error(error);
      resultDiv.innerHTML = `Error: ${error.message}`;
    }
  });
