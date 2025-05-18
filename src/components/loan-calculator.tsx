"use client"

import type React from "react"
import { useState, useEffect } from "react"

type Currency = "USD" | "AMD" | "EUR" | "RUB"

type ConversionRates = {
  [key in Currency]?: {
    [key in Currency]?: number
  }
}

// Default hardcoded rates as fallback
const DEFAULT_RATES: ConversionRates = {
  USD: { AMD: 390 },
  EUR: { AMD: 400 },
  RUB: { AMD: 4 },
  AMD: { USD: 1 / 390, EUR: 1 / 400, RUB: 1 / 4 },
}

export default function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState<number>(10000)
  const [interestRate, setInterestRate] = useState<number>(5)
  const [loanTerm, setLoanTerm] = useState<number>(3)
  const [currency, setCurrency] = useState<Currency>("USD")
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null)
  const [totalPayment, setTotalPayment] = useState<number | null>(null)
  const [totalInterest, setTotalInterest] = useState<number | null>(null)
  const [conversionRates, setConversionRates] = useState<ConversionRates>(DEFAULT_RATES)
  const [loading, setLoading] = useState<boolean>(false)
  const [backendStatus, setBackendStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")
  const [showBackendConfig, setShowBackendConfig] = useState<boolean>(false)
  const [backendUrl, setBackendUrl] = useState<string>("")

  // Initialize the app with default rates
  useEffect(() => {
    // Always start with default rates for immediate functionality
    setConversionRates(DEFAULT_RATES)

    // Try to load a previously saved backend URL from localStorage
    const savedUrl = localStorage.getItem("backendUrl")
    if (savedUrl) {
      setBackendUrl(savedUrl)
      // Attempt to connect to the saved backend URL
      testBackendConnection(savedUrl, false)
    }
  }, [])

  // Test connection to a backend URL
  const testBackendConnection = async (url: string, showAlert = true) => {
    if (!url.trim()) {
      if (showAlert) alert("Please enter a backend URL")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      // Get the raw text first for debugging
      const rawText = await response.text()

      // Check if it looks like HTML
      if (rawText.trim().startsWith("<!DOCTYPE") || rawText.trim().startsWith("<html")) {
        throw new Error("Received HTML instead of JSON")
      }

      // Try to parse the response as JSON
      try {
        const data = JSON.parse(rawText)

        if (data.success) {
          setConversionRates(data.rates)
          setBackendStatus("connected")
          // Save the successful URL to localStorage
          localStorage.setItem("backendUrl", url)
          if (showAlert) alert("Successfully connected to backend!")
          return true
        } else {
          throw new Error(data.error || "Failed to fetch currency rates")
        }
      } catch (parseError) {
        throw new Error("Response is not valid JSON")
      }
    } catch (err) {
      setBackendStatus("disconnected")
      if (showAlert) {
        alert(`Could not connect to backend: ${err instanceof Error ? err.message : String(err)}`)
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const calculateLoan = (e: React.FormEvent) => {
    e.preventDefault()

    // Convert annual interest rate to monthly and decimal form
    const monthlyInterestRate = interestRate / 100 / 12

    // Convert loan term from years to months
    const loanTermMonths = loanTerm * 12

    // Calculate monthly payment using the loan formula
    const x = Math.pow(1 + monthlyInterestRate, loanTermMonths)
    const monthly = (loanAmount * x * monthlyInterestRate) / (x - 1)

    setMonthlyPayment(monthly)
    setTotalPayment(monthly * loanTermMonths)
    setTotalInterest(monthly * loanTermMonths - loanAmount)
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-"

    const currencySymbols: Record<Currency, string> = {
      USD: "$",
      AMD: "֏",
      EUR: "€",
      RUB: "₽",
    }

    return `${currencySymbols[currency]} ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const convertToAMD = (amount: number | null): string => {
    if (amount === null) return "-"
    if (currency === "AMD") return formatCurrency(amount)

    // Use the rates from the API, or fallback to default if not available
    const rate =
      conversionRates[currency]?.["AMD"] ||
      (currency === "USD" ? 390 : currency === "EUR" ? 400 : currency === "RUB" ? 4 : 1)

    const amdAmount = amount * rate

    return `֏ ${amdAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="loan-calculator">
      <h1>Loan Calculator</h1>

      {loading && <div className="loading-message">Loading...</div>}

      {backendStatus !== "connected" && (
        <div className="info-message">
          <p>Using default currency rates.</p>
          <button onClick={() => setShowBackendConfig(!showBackendConfig)} className="config-button">
            {showBackendConfig ? "Hide Backend Config" : "Configure Backend"}
          </button>
        </div>
      )}

      {showBackendConfig && (
        <div className="backend-config">
          <h3>Backend Configuration</h3>
          <div className="form-group">
            <label htmlFor="backend-url">Backend URL</label>
            <input
              id="backend-url"
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:8000/server/get-rates.php"
              className="backend-url-input"
            />
          </div>
          <button onClick={() => testBackendConnection(backendUrl)} className="test-button" disabled={loading}>
            Test Connection
          </button>
          <p className="backend-note">
            Note: If you don't have a PHP backend set up, you can leave this empty and the calculator will work with
            default rates.
          </p>
        </div>
      )}

      <form onSubmit={calculateLoan}>
        <div className="form-group">
          <label htmlFor="currency">Currency</label>
          <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            <option value="USD">USD ($)</option>
            <option value="AMD">AMD (֏)</option>
            <option value="EUR">EUR (€)</option>
            <option value="RUB">RUB (₽)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="loan-amount">Loan Amount</label>
          <input
            id="loan-amount"
            type="number"
            min="1"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="interest-rate">Interest Rate (%)</label>
          <input
            id="interest-rate"
            type="number"
            min="0.1"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="loan-term">Loan Term (years)</label>
          <input
            id="loan-term"
            type="number"
            min="1"
            value={loanTerm}
            onChange={(e) => setLoanTerm(Number(e.target.value))}
            required
          />
        </div>

        <button type="submit">Calculate</button>
      </form>

      <div className="results">
        <h2>Loan Summary</h2>
        <div className="result-row">
          <span>Monthly Payment:</span>
          <span className="result-value">{formatCurrency(monthlyPayment)}</span>
        </div>
        <div className="result-row">
          <span>Total Payment:</span>
          <span className="result-value">{formatCurrency(totalPayment)}</span>
        </div>
        <div className="result-row">
          <span>Total Interest:</span>
          <span className="result-value">{formatCurrency(totalInterest)}</span>
        </div>

        {currency !== "AMD" && monthlyPayment !== null && (
          <div className="amd-conversion">
            <h3>AMD Equivalent</h3>
            <div className="result-row">
              <span>Monthly Payment (AMD):</span>
              <span className="result-value">{convertToAMD(monthlyPayment)}</span>
            </div>
            <div className="result-row">
              <span>Total Payment (AMD):</span>
              <span className="result-value">{convertToAMD(totalPayment)}</span>
            </div>
            <div className="result-row">
              <span>Total Interest (AMD):</span>
              <span className="result-value">{convertToAMD(totalInterest)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Display current exchange rates */}
      <div className="exchange-rates">
        <h3>
          Current Exchange Rates
          {backendStatus !== "connected" && <span className="rate-source">(Default Values)</span>}
          {backendStatus === "connected" && <span className="rate-source connected">(From Backend)</span>}
        </h3>
        <div className="rates-container">
          {Object.entries(conversionRates).map(([fromCurrency, rates]) =>
            Object.entries(rates || {}).map(([toCurrency, rate]) => (
              <div key={`${fromCurrency}-${toCurrency}`} className="rate-item">
                <span>
                  1 {fromCurrency} = {rate.toFixed(6)} {toCurrency}
                </span>
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
