// server/server.js
const express = require("express");
const cors = require("cors");
const Mexc = require("mexc-api-sdk");
const { sql } = require("@vercel/postgres");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new Mexc.Spot(
  process.env.MEXC_API_KEY,
  process.env.MEXC_API_SECRET
);

var appStatus = 1;
var g_expectedBuy = 0;
var g_stopLoss = 0;
var g_takeProfit = 0;
var g_symbol = "BTCUSDC";
var g_volume = 0.001;

app.post("/trade", async (req, res) => {
  const { side } = req.body;
  console.log(side, g_expectedBuy, g_takeProfit, g_stopLoss);
  console.log(
    parseFloat(g_expectedBuy) == 0 &&
      parseFloat(g_stopLoss) == 0 &&
      parseFloat(g_takeProfit) == 0
  );
  if (appStatus) {
    if (
      parseFloat(g_expectedBuy) == 0 &&
      parseFloat(g_stopLoss) == 0 &&
      parseFloat(g_takeProfit) == 0
    ) {
      console.log("General trading");
      // Execute Market Order
      try {
        var marketOrder, stopLossOrder, takeProfitOrder;
        marketOrder = await client.newOrder(g_symbol, side, "MARKET", {
          quantity: g_volume,
        });
        console.log("Successfully", side, marketOrder);
      } catch (error) {
        console.error("Error placing order:", error);
        return res.status(400).json({ success: false, error: error.message });
      }
    } else {
      if (side == "BUY") {
        // Buy expected price
        try {
          marketOrder = await client.newOrder(g_symbol, "BUY", "LIMIT", {
            price: g_expectedBuy,
            quantity: g_volume,
          });
          console.log(
            "Successfully BUY on Expected price",
            g_expectedBuy,
            marketOrder
          );
        } catch (error) {
          console.error("Error placing Limit Buy order:", error);
          return res.status(400).json({ success: false, error: error.message });
        }

        const stopLossPrice = (
          g_expectedBuy *
          ((100 - g_stopLoss) / 100)
        ).toFixed(2); // 2% loss example
        const takeProfitPrice = (
          g_expectedBuy *
          ((100 - g_takeProfit) / 100)
        ).toFixed(2); // 5% profit example
        try {
          stopLossOrder = await client.newOrder(g_symbol, "SELL", "LIMIT", {
            price: stopLossPrice,
            quantity: g_volume,
            newOrderRespType: "RESULT",
            timeInForce: "GTC",
          });
          console.log(
            "Successfully SELL for StopLoss on",
            stopLossPrice,
            stopLossOrder
          );
        } catch (error) {
          console.error("Error placing stopLoss order:", error);
          return res.status(400).json({ success: false, error: error.message });
        }

        try {
          takeProfitOrder = await client.newOrder(g_symbol, "SELL", "LIMIT", {
            price: takeProfitPrice,
            quantity: g_volume,
            newOrderRespType: "RESULT",
            timeInForce: "GTC",
          });
          console.log(
            "Successfully SELL for TakeProfit on",
            takeProfitPrice,
            takeProfitOrder
          );
        } catch (error) {
          console.error("Error placing stopLoss order:", error);
          return res.status(400).json({ success: false, error: error.message });
        }
      }
    }
  }
});

app.post("/setparams", async (req, res) => {
  const { symbol, volume, expectedBuy, stopLoss, takeProfit } = req.body;

  await sql`UPDATE params SET symbol = ${symbol}, volume = ${volume}, stopLoss = ${stopLoss}, takeProfit = ${takeProfit}, expectedBuy = ${expectedBuy}, active = ${
    appStatus == 0 ? 1 : 0
  } WHERE id = 0;`;
  appStatus = appStatus == 0 ? 1 : 0;
  g_symbol = symbol;
  g_volume = volume;
  g_expectedBuy = expectedBuy;
  g_stopLoss = stopLoss;
  g_takeProfit = takeProfit;
  res.status(200).json({ success: 1, status: appStatus });
});

app.get("/getparams", async (req, res) => {
  const { rows } = await sql`SELECT * FROM params LIMIT 1;`;
  appStatus = rows[0].active;
  g_symbol = rows[0].symbol;
  g_volume = rows[0].volume;
  g_expectedBuy = rows[0].expectedbuy;
  g_stopLoss = rows[0].stoploss;
  g_takeProfit = rows[0].takeprofit;
  res.json({
    active: rows[0].active,
    volume: rows[0].volume,
    symbol: rows[0].symbol,
    expectedBuy: rows[0].expectedbuy,
    stopLoss: rows[0].stoploss,
    takeProfit: rows[0].takeprofit,
  });
});

app.get("/loadOpenOrders", async (req, res) => {
  try {
    // Get server time
    const serverTimeResponse = await client.time();
    const serverTime = serverTimeResponse.serverTime; // Server time in milliseconds

    // Get local time
    const localTime = Date.now(); // Local time in milliseconds

    // Calculate the difference
    const timeDifference = serverTime - localTime;

    console.log(`Server Time: ${new Date(serverTime)}`);
    console.log(`Local Time: ${new Date(localTime)}`);
    console.log(`Time Difference: ${timeDifference} ms`);

    // Optional: Adjust local time (for display purposes)
    // If you need to display server time in your application
    const adjustedLocalTime = new Date(localTime + timeDifference);
    console.log(`Adjusted Local Time: ${adjustedLocalTime}`);

    const orders = await client.openOrders(g_symbol, { recvWindow: 56146 });
    console.log("Open Orders Count:", orders?.length); // Log the orders
    res.json({ success: true, data: orders }); // Send orders back as response
  } catch (error) {
    console.error("Error fetching open orders:", error);
    res.status(500).json({ success: false, message: error.message }); // Send error response
  }
});

app.get("/loadAllOrders", async (req, res) => {
  try {
    // Get server time
    const serverTimeResponse = await client.time();
    const serverTime = serverTimeResponse.serverTime; // Server time in milliseconds

    // Get local time
    const localTime = Date.now(); // Local time in milliseconds

    // Calculate the difference
    const timeDifference = serverTime - localTime;

    console.log(`Server Time: ${new Date(serverTime)}`);
    console.log(`Local Time: ${new Date(localTime)}`);
    console.log(`Time Difference: ${timeDifference} ms`);

    // Optional: Adjust local time (for display purposes)
    // If you need to display server time in your application
    const adjustedLocalTime = new Date(localTime + timeDifference);
    console.log(`Adjusted Local Time: ${adjustedLocalTime}`);

    const orders = await client.allOrders(g_symbol /*, { limit: 50 } */);
    console.log("All Orders Count:", orders?.length); // Log the orders
    res.json({ success: true, data: orders }); // Send orders back as response
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ success: false, message: error.message }); // Send error response
  }
});

app.get("/cancelAllOpenOrders", async (req, res) => {
  try {
    const cancelOrders = await client.cancelOpenOrders(g_symbol, {
      recvWindow: 56146,
    });
    console.log("Cancel Orders:", cancelOrders); // Log the orders
    res.json({ success: true, data: cancelOrders }); // Send orders back as response
  } catch (error) {
    console.error("Error cancelling open orders:", error);
    res.status(500).json({ success: false, message: error.message }); // Send error response
  }
});

app.post("/queryOrder", async (req, res) => {
  try {
    const { symbol, orderId, origClientOrderId } = req.body;
    const options = {
      ...(orderId && { orderId }),
      ...(origClientOrderId && { origClientOrderId }),
      recvWindow: 56146,
    };
    const result = await client.queryOrder(symbol, options);
    console.log("QueryOrder: ", result);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error querying an order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/cancelOrder", async (req, res) => {
  try {
    const { symbol, orderId, origClientOrderId, newClientOrderId } = req.body;
    const options = {
      ...(orderId && { orderId }),
      ...(origClientOrderId && { origClientOrderId }),
      ...(newClientOrderId && { newClientOrderId }),
      recvWindow: 56146,
    };

    const result = await client.cancelOrder(symbol, options);

    console.log("CancelOrder: ", result);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error cancelling an order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all symbols
app.get("/symbol", async (req, res) => {
  try {
    const { rows: symbols } = await sql`SELECT * FROM symbols`;
    res.json({ success: true, symbols });
  } catch (error) {
    console.error("Error fetching symbols:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/symbol", async (req, res) => {
  const { name } = req.body;
  try {
    const { rows: existingSymbols } =
      await sql`SELECT * FROM symbols WHERE name = ${name}`;
    if (existingSymbols.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Symbol name must be unique" });
    }

    await sql`INSERT INTO symbols (name) VALUES (${name})`;
    res.json({ success: true, message: "Symbol created successfully" });
  } catch (error) {
    console.error("Error creating symbol:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/symbol/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const { rows: existingSymbols } =
      await sql`SELECT * FROM symbols WHERE name = ${name} AND id != ${id}`;
    if (existingSymbols.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Symbol name must be unique" });
    }

    const { rowCount } =
      await sql`UPDATE symbols SET name = ${name} WHERE id = ${id}`;
    if (rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Symbol not found" });
    }

    res.json({ success: true, message: "Symbol updated successfully" });
  } catch (error) {
    console.error("Error updating symbol:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/symbol/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await sql`DELETE FROM symbols WHERE id = ${id}`;
    if (rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Symbol not found" });
    }

    res.json({ success: true, message: "Symbol deleted successfully" });
  } catch (error) {
    console.error("Error deleting symbol:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/search", async (req, res) => {
  const { rows: searches } =
    await sql`SELECT * FROM searches ORDER BY count ASC`;
  res.json({ success: true, searches });
});

app.post("/search", async (req, res) => {
  const { symbol } = req.body;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required" });
  }

  try {
    const { rows } = await sql`SELECT * FROM searches WHERE symbol = ${symbol}`;

    if (rows.length > 0) {
      await sql`UPDATE searches SET count = count + 1 WHERE symbol = ${symbol}`;
      res.json({ success: true, count: rows[0].count + 1 });
    } else {
      await sql`INSERT INTO searches (symbol, count) VALUES (${symbol}, 1)`;
      res.json({ success: true, count: 1 });
    }
  } catch (error) {
    console.error("Error updating search:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
