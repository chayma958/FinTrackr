const axios = require("axios");
const db = require("../models/db");

const cache = new Map();

const getExchangeRates = async (baseCurrency = "USD") => {
  const today = new Date().toISOString().split("T")[0];
  const cacheKey = `rates_${baseCurrency}_${today}`;
  const validCurrencies = ["USD", "EUR", "GBP", "TND", "JPY", "CAD", "AUD"];
  const fallbackRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.78,
    TND: 3.1,
    JPY: 146.5,
    CAD: 1.39,
    AUD: 1.54,
  };

  // Check in-memory cache
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Check database cache
  try {
    const dbResult = await db.query(
      "SELECT rates FROM exchange_rates WHERE base_currency = $1 AND date = $2",
      [baseCurrency, today]
    );
    if (dbResult.rows.length > 0) {
      let rates = dbResult.rows[0].rates;
      // Validate that all required currencies are present
      const missingCurrencies = validCurrencies.filter((c) => !rates[c]);
      if (missingCurrencies.length > 0) {
        console.warn(
          `Missing rates for ${missingCurrencies.join(
            ", "
          )} in database, supplementing with fallback rates`
        );
        missingCurrencies.forEach((c) => (rates[c] = fallbackRates[c]));
      }
      cache.set(cacheKey, rates);
      return rates;
    }
  } catch (err) {
    console.error("Error fetching cached rates from database:", err.message);
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    console.error("Exchange rate API key is missing, using fallback rates");
    cache.set(cacheKey, fallbackRates);
    return fallbackRates;
  }

  try {
    // Always fetch with USD as base due to free plan limitation
    const response = await axios.get(
      `https://openexchangerates.org/api/latest.json?app_id=${apiKey}`
    );
    let rates = response.data.rates;
    if (!rates || Object.keys(rates).length === 0) {
      throw new Error("No rates found in API response");
    }

    // Convert rates to desired baseCurrency if not USD
    if (baseCurrency !== "USD") {
      const baseRate = rates[baseCurrency];
      if (!baseRate) {
        throw new Error(`Base currency ${baseCurrency} not found in API rates`);
      }
      rates = Object.fromEntries(
        Object.entries(rates).map(([currency, rate]) => [
          currency,
          rate / baseRate,
        ])
      );
      rates[baseCurrency] = 1; // Ensure base currency rate is exactly 1
    }

    // Ensure all valid currencies are present
    const missingCurrencies = validCurrencies.filter((c) => !rates[c]);
    if (missingCurrencies.length > 0) {
      console.warn(
        `Missing rates for ${missingCurrencies.join(
          ", "
        )} in API response, supplementing with fallback rates`
      );
      missingCurrencies.forEach((c) => (rates[c] = fallbackRates[c]));
    }

    cache.set(cacheKey, rates);

    // Store in database
    try {
      await db.query(
        "INSERT INTO exchange_rates (base_currency, date, rates) VALUES ($1, $2, $3) ON CONFLICT (base_currency, date) DO UPDATE SET rates = $3",
        [baseCurrency, today, rates]
      );
    } catch (err) {
      console.error("Error storing exchange rates in database:", err.message);
    }

    return rates;
  } catch (error) {
    console.error("Exchange rate API error:", error.response?.data || error.message);
    // Try fallback database rates
    try {
      const fallbackResult = await db.query(
        "SELECT rates FROM exchange_rates WHERE base_currency = $1 ORDER BY date DESC LIMIT 1",
        [baseCurrency]
      );
      if (fallbackResult.rows.length > 0) {
        let rates = fallbackResult.rows[0].rates;
        const missingCurrencies = validCurrencies.filter((c) => !rates[c]);
        if (missingCurrencies.length > 0) {
          console.warn(
            `Missing rates for ${missingCurrencies.join(
              ", "
            )} in fallback database, supplementing with fallback rates`
          );
          missingCurrencies.forEach((c) => (rates[c] = fallbackRates[c]));
        }
        cache.set(cacheKey, rates);
        return rates;
      }
    } catch (dbErr) {
      console.error("Error fetching fallback rates from database:", dbErr.message);
    }
    console.warn(`No cached rates available for ${baseCurrency}, using fallback rates`);
    cache.set(cacheKey, fallbackRates);
    return fallbackRates;
  }
};

module.exports = { getExchangeRates };