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

  const [history, setHistory] = useState({
    time: [],
    heartRate: [],
    spo2: [],
    temperature: [],
  });

//   useEffect(() => {
//   const fetchData = async () => {
//     try {
//       const res = await fetch("https://your-cloud-api/health-data"); // cloud api link
//       const json = await res.json();
//       const latest = json.latest;

//       const { disease, riskLevel } = analyzeHealth(latest);

//       setData({
//         ...latest,
//         disease,
//         riskLevel,
//         healthStatus: riskLevel === "High" ? "Critical" : riskLevel === "Medium" ? "Warning" : "Normal",
//       });

//       setHistory(json.history);
//     } catch (err) {
//       console.error("Error fetching data:", err);
//     }
//   };

//   fetchData();
//   const interval = setInterval(fetchData, 5000);
//   return () => clearInterval(interval);
// }, []);

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
    height: 170,
    weight: 68,
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



  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Smart Health Monitor Dashboard</h1>
        <button className="simulate-btn" onClick={simulateData}>
          Simulate Random Data
        </button>

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
