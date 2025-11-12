"use client";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import rules from "../../Data/DiseaseCriteria"
import "./HealthDashboard.css"; 
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA4oTUU5m5I__8Sbi0n7nn5WW310WTF_zs",
  authDomain: "health-monitoring-systm-6ride9.firebaseapp.com",
  databaseURL: "https://health-monitoring-systm-6ride9-default-rtdb.firebaseio.com",
  projectId: "health-monitoring-systm-6ride9",
  storageBucket: "health-monitoring-systm-6ride9.firebasestorage.app",
  messagingSenderId: "387293100201",
  appId: "1:387293100201:web:382e6327bb9fad897611b8",
  measurementId: "G-KMPPY4Q0M3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function HealthDashboard() {
  const [data, setData] = useState({
    heartRate: 0,
    spo2: 0,
    temperature: 0,
    soundLevel: 0,
    healthStatus: "Normal",
    disease: "None detected",
    riskLevel: "Low",
    doctorAdvice:  "Minor irregularities detected. Monitor your health regularly.",
    matches: [] , 
  });

const [monitoring, setMonitoring] = useState(false);
const [intervalId, setIntervalId] = useState(null);
const [collectedData, setCollectedData] = useState([]);


  const [userInput, setUserInput] = useState({
    height: 170,
    weight: 68,
  });

function handleInputChange(e) {
  const { name, value } = e.target;
  setUserInput((prev) => ({ ...prev, [name]: value }));
}


  const [history, setHistory] = useState({
    time: [],
    heartRate: [],
    spo2: [],
    temperature: [],
  });
useEffect(() => {
  // Import from your initialized Firebase setup
  const dataRef = ref(db, "/SensorData"); 

  // Realtime listener: runs whenever Firebase data changes
  const unsubscribe = onValue(dataRef, (snapshot) => {
    const firebaseData = snapshot.val();
    if (!firebaseData) return;

    console.log("📡 Live Firebase Data:", firebaseData);

    // In case your ESP32 pushes multiple readings, get the latest
    // Example: if firebaseData = { "1": {...}, "2": {...} }
    const latest =
      typeof firebaseData === "object" && !firebaseData.heartRate
        ? Object.values(firebaseData).pop()
        : firebaseData;

    // Analyze data with your rule system
    const latestWithUser = {
      ...latest,
      height: parseFloat(userInput.height),
      weight: parseFloat(userInput.weight),
    };
    const { disease, riskLevel, description, bmi, matches, doctorAdvice } =
      analyzeHealth(latestWithUser);

    // Update dashboard values
   setData({
    heartRate: latest.bpm ?? 0,
    spo2: latest.spo2 ?? 0,
    temperature: latest.temperature ?? 0, // only if you later add it
    soundLevel: latest.heartSound ?? 0,
    disease,
    description,
    riskLevel,
    doctorAdvice,
    matches,
    healthStatus:
      riskLevel === "High"
        ? "Critical"
        : riskLevel === "Medium"
        ? "Warning"
        : "Normal",
  });

    // Append to history for charts
    setHistory((prev) => ({
      time: [...prev.time.slice(-19), new Date().toLocaleTimeString()],
      heartRate: [...prev.heartRate.slice(-19), latest.heartRate],
      spo2: [...prev.spo2.slice(-19), latest.spo2],
      temperature: [...prev.temperature.slice(-19), latest.temperature],
    }));
  });

  // Cleanup listener on unmount
  return () => unsubscribe();
}, []);


function evaluateRule(value, ruleString) {
  if (typeof ruleString !== "string") return false;

  if (ruleString.includes("-")) {
    const [min, max] = ruleString.split("-").map(parseFloat);
    return value >= min && value <= max;
  }
  if (ruleString.startsWith(">=")) return value >= parseFloat(ruleString.slice(2));
  if (ruleString.startsWith(">")) return value > parseFloat(ruleString.slice(1));
  if (ruleString.startsWith("<=")) return value <= parseFloat(ruleString.slice(2));
  if (ruleString.startsWith("<")) return value < parseFloat(ruleString.slice(1));

  const num = parseFloat(ruleString);
  if (!isNaN(num)) return value === num;

  return false;
}


function getDoctorRecommendation(matches, abnormalParams) {
  if (!matches || matches.length === 0) {
    return {
      advice: "No abnormalities detected. Maintain a healthy lifestyle!",
      urgency: "None",
    };
  }

  const top = matches[0];

  if (top.riskLevel === "High" || top.matchPercent >= 70) {
    return {
      advice: `Possible serious condition (${top.disease}). Immediate medical consultation recommended.`,
      urgency: "Immediate",
    };
  }

  if (top.riskLevel === "Medium" || top.matchPercent >= 40) {
    return {
      advice: `Some signs of ${top.disease}. Consider visiting a doctor for further evaluation.`,
      urgency: "Soon",
    };
  }

  if (Object.keys(abnormalParams).length > 1) {
    return {
      advice: "Multiple parameters are out of range. Schedule a check-up.",
      urgency: "Soon",
    };
  }

  return {
    advice: "Minor irregularities detected. Monitor your health regularly.",
    urgency: "Low",
  };
}

// Main Analyzer
function analyzeHealth(data) {
  const { heartRate, spo2, temperature, lungSound, age, weight, height } = data;
  const bmi = weight && height ? weight / ((height / 100) ** 2) : null;

  const abnormalParams = {};
  const matches = [];

  // Detect abnormal vital signs
  if (heartRate < 60 || heartRate > 100) abnormalParams.heartRate = heartRate;
  if (spo2 < 95) abnormalParams.spo2 = spo2;
  if (temperature > 37.5 || temperature < 35.5) abnormalParams.temperature = temperature;
  if (bmi && (bmi < 18.5 || bmi > 25)) abnormalParams.bmi = bmi;
  if (lungSound && lungSound !== "normal") abnormalParams.lungSound = lungSound;

  // Compare with all conditions in rules
  for (const condition of rules.conditions) {
    let matchedCriteria = 0;
    const totalCriteria = Object.keys(condition.rules).length;

    for (const [key, ruleString] of Object.entries(condition.rules)) {
      const value = key === "bmi" ? bmi : data[key];
      if (value !== undefined && evaluateRule(value, ruleString)) {
        matchedCriteria++;
      }
    }

    if (matchedCriteria > 0) {
      matches.push({
        disease: condition.name,
        description: condition.description,
        riskLevel: condition.risk,
        matchPercent: Math.round((matchedCriteria / totalCriteria) * 100),
      });
    }
  }

  // Sort by best match
  matches.sort((a, b) => b.matchPercent - a.matchPercent);

  // Top disease for display
  const topMatch =
    matches[0] || {
      disease: "Healthy / Normal",
      description: "All readings appear within normal range.",
      riskLevel: "Low",
    };
      const doctorAdvice = getDoctorRecommendation(matches, abnormalParams);
    console.log("Top Match: ", topMatch )
  return {
    disease: topMatch.disease,
    riskLevel: topMatch.riskLevel,
    description: topMatch.description,
    bmi: bmi ? bmi.toFixed(1) : null,
    abnormalParams,
    matches,
    doctorAdvice,
  };

}

  const chartData = (label, dataset) => ({
    labels: history.time,
    datasets: [
      {
        label,
        data: dataset,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.3,
      },
    ],
  });

  // Generate random but realistic health data for testing
function simulateData() {
  const randomData = {
    heartRate: Math.floor(Math.random() * (120 - 60) + 60),  // 60–120 BPM
    spo2: Math.floor(Math.random() * (100 - 85) + 85),       // 85–100%
    temperature: (Math.random() * (39 - 36) + 36).toFixed(1), // 36–39°C
    soundLevel: Math.floor(Math.random() * (90 - 30) + 30),   // 30–90 dB
    lungSound: Math.random() > 0.7 ? "abnormal" : "normal",   // Random irregularity
    age: 25,
    height: parseFloat(userInput.height),
    weight: parseFloat(userInput.weight)
  };

  // Analyze health with your rule system
  const {
    disease,
    riskLevel,
    description,
    bmi,
    matches,
    doctorAdvice,
  } = analyzeHealth(randomData);

  //Include matches in setData
  setData({
    ...randomData,
    disease,
    description,
    riskLevel,
    doctorAdvice,
    matches, 
    healthStatus:
      riskLevel === "High"
        ? "Critical"
        : riskLevel === "Medium"
        ? "Warning"
        : "Normal",
  });

  // Update chart history
  setHistory((prev) => ({
    time: [...prev.time, new Date().toLocaleTimeString()],
    heartRate: [...prev.heartRate, randomData.heartRate],
    spo2: [...prev.spo2, randomData.spo2],
    temperature: [...prev.temperature, randomData.temperature],
  }));

  console.log("Simulated Data:", randomData);
}


function startMonitoring() {
  if (monitoring) return; // Already running

  setMonitoring(true);
  setCollectedData([]); // reset old data

  const id = setInterval(() => {
    const dataRef = ref(db, "/SensorData");

    onValue(dataRef, (snapshot) => {
      const firebaseData = snapshot.val();
      if (!firebaseData) return;

      const latest =
        typeof firebaseData === "object" && !firebaseData.heartRate
          ? Object.values(firebaseData).pop()
          : firebaseData;

      // Append latest reading to state safely
      setCollectedData((prevData) => {
        const updated = [...prevData.slice(-449), latest]; // keep last 450 readings (15 min @2s)

        // Compute means
        const meanHeartRate = prevMean("bpm", updated) ?? 0;
        const meanSpO2 = prevMean("spo2", updated) ?? 0;
        const meanTemp = prevMean("temperature", updated) ?? 0;

        const meanData = {
          heartRate: meanHeartRate,
          spo2: meanSpO2,
          temperature: meanTemp,
          lungSound: latest.lungSound,
          height: parseFloat(userInput.height),
          weight: parseFloat(userInput.weight),
        };

        const { disease, riskLevel, description, bmi, matches, doctorAdvice } =
          analyzeHealth(meanData);

        // Update dashboard data
        setData({
          heartRate: meanHeartRate.toFixed(1),
          spo2: meanSpO2.toFixed(1),
          temperature: meanTemp.toFixed(1),
          soundLevel: latest.heartSound ?? 0,
          disease,
          description,
          riskLevel,
          doctorAdvice,
          matches,
          healthStatus:
            riskLevel === "High"
              ? "Critical"
              : riskLevel === "Medium"
              ? "Warning"
              : "Normal",
        });

        // Update history for charts
        setHistory((prev) => ({
          time: [...prev.time.slice(-19), new Date().toLocaleTimeString()],
          heartRate: [...prev.heartRate.slice(-19), meanHeartRate],
          spo2: [...prev.spo2.slice(-19), meanSpO2],
          temperature: [...prev.temperature.slice(-19), meanTemp],
        }));

        return updated;
      });
    });
  }, 2000);

  setIntervalId(id);

  // Auto-stop after 15 minutes (900,000 ms)
  setTimeout(() => stopMonitoring(), 900000);
}


function prevMean(key, arr) {
  if (!arr || arr.length === 0) return 0;
  const valid = arr.map((x) => parseFloat(x[key])).filter((v) => !isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}


function stopMonitoring() {
  if (intervalId) {
    clearInterval(intervalId);
    setIntervalId(null);
    setMonitoring(false);
    console.log("⏹️ Monitoring stopped.");
  }
}


  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Smart Health Monitor Dashboard</h1>

      <div className="button-group">
        <button className="simulate-btn" onClick={simulateData}>Simulate Random Data</button>
        <button className="action-btn" onClick={startMonitoring}>Start Monitoring</button>
        <button className="action-btn" onClick={stopMonitoring}>Stop</button>
      </div>


        <div className="user-inputs">
  <h3>Enter Your Details</h3>
  <div className="input-group">
    <label>Height (cm):</label>
    <input
      type="number"
      name="height"
      value={userInput.height}
      onChange={handleInputChange}
      min="100"
      max="250"
    />
  </div>
  <div className="input-group">
    <label>Weight (kg):</label>
    <input
      type="number"
      name="weight"
      value={userInput.weight}
      onChange={handleInputChange}
      min="30"
      max="200"
    />
  </div>
</div>

      {/* Sensor Data */}
      <div className="sensor-grid">
        <SensorCard title="Heart Rate" value={`${data.heartRate} BPM`} status={data.healthStatus} color="red" />
        <SensorCard title="SpO₂" value={`${data.spo2} %`} status={data.healthStatus} color="blue" />
        <SensorCard title="Temperature" value={`${data.temperature} °C`} status={data.healthStatus} color="orange" />
        <SensorCard title="Sound Level" value={`${data.soundLevel} dB`} status={data.healthStatus} color="green" />
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <ChartCard title="Heart Rate Over Time" data={chartData("Heart Rate", history.heartRate)} />
        <ChartCard title="SpO₂ Over Time" data={chartData("SpO₂", history.spo2)} />
        <ChartCard title="Temperature Over Time" data={chartData("Temperature", history.temperature)} />
      </div>

      {/* AI Analysis */}
      <motion.div
        className="analysis"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>AI Health Analysis</h2>
        <div className="analysis-content">
<div className="analysis-right">
  <h3>Possible Conditions:</h3>
  {data.matches && data.matches.length > 0 ? (
    <ul>
      {data.matches.map((m, i) => (
        <li key={i}>
          <strong>{m.disease}</strong> — {m.matchPercent}% match ({m.riskLevel})
        </li>
      ))}
    </ul>
  ) : (
    <p>No abnormalities detected.</p>
  )}
</div>
          <div className="analysis-right">
              <h3>Doctor Recommendation:</h3>
              <p><strong>Urgency:</strong> {data.doctorAdvice?.urgency}</p>
              <p>{data.doctorAdvice?.advice}</p>
          </div>
        </div>
      </motion.div>

      <div className="cloud-status">
        <p>🌐 Cloud Sync: Active</p>
        <p>Last Updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

function SensorCard({ title, value, status, color }) {
  return (
    <motion.div className={`sensor-card ${color}`} whileHover={{ scale: 1.05 }}>
      <h3>{title}</h3>
      <p className="sensor-value">{value}</p>
      <p className="sensor-status">{status}</p>
    </motion.div>
  );
}

function ChartCard({ title, data }) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <Line data={data} />
    </div>
  );
}
